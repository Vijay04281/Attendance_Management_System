// =====================================================
// studentController.js
// Attendance Management System
// =====================================================

const db = require("../config/db");
const bcrypt = require("bcrypt");

// =====================================================
// HELPER: Get department by name/code/id
// =====================================================

const getDepartment = async (departmentValue) => {
  if (
    departmentValue === undefined ||
    departmentValue === null ||
    String(departmentValue).trim() === ""
  ) {
    return null;
  }

  const value = String(departmentValue).trim();

  // ---------------------------------------------------
  // Try department name
  // ---------------------------------------------------

  let [rows] = await db.query(
    `
      SELECT
        department_id,
        department_name,
        department_code
      FROM departments
      WHERE LOWER(TRIM(department_name)) = LOWER(TRIM(?))
      LIMIT 1
    `,
    [value]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  // ---------------------------------------------------
  // Try department code
  // ---------------------------------------------------

  [rows] = await db.query(
    `
      SELECT
        department_id,
        department_name,
        department_code
      FROM departments
      WHERE LOWER(TRIM(department_code)) = LOWER(TRIM(?))
      LIMIT 1
    `,
    [value]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  // ---------------------------------------------------
  // Try department ID
  // ---------------------------------------------------

  if (/^\d+$/.test(value)) {
    [rows] = await db.query(
      `
        SELECT
          department_id,
          department_name,
          department_code
        FROM departments
        WHERE department_id = ?
        LIMIT 1
      `,
      [Number(value)]
    );

    if (rows.length > 0) {
      return rows[0];
    }
  }

  return null;
};

// =====================================================
// HELPER: Get class by class_id
// =====================================================

const getClassById = async (classId) => {
  if (
    classId === undefined ||
    classId === null ||
    String(classId).trim() === ""
  ) {
    return null;
  }

  const [rows] = await db.query(
    `
      SELECT
        c.class_id,
        c.department_id,
        c.year,
        c.section,
        d.department_name,
        d.department_code
      FROM classes c
      INNER JOIN departments d
        ON d.department_id = c.department_id
      WHERE c.class_id = ?
      LIMIT 1
    `,
    [classId]
  );

  return rows.length > 0 ? rows[0] : null;
};

// =====================================================
// HELPER: Find class using department + year + section
// =====================================================

const findClass = async (departmentId, year, section) => {
  if (
    departmentId === undefined ||
    departmentId === null ||
    year === undefined ||
    year === null ||
    section === undefined ||
    section === null ||
    String(section).trim() === ""
  ) {
    return null;
  }

  const [rows] = await db.query(
    `
      SELECT
        c.class_id,
        c.department_id,
        c.year,
        c.section,
        d.department_name,
        d.department_code
      FROM classes c
      INNER JOIN departments d
        ON d.department_id = c.department_id
      WHERE c.department_id = ?
        AND c.year = ?
        AND LOWER(TRIM(c.section)) = LOWER(TRIM(?))
      LIMIT 1
    `,
    [departmentId, year, section]
  );

  return rows.length > 0 ? rows[0] : null;
};

// =====================================================
// COMMON STUDENT QUERY
//
// IMPORTANT:
// students table does NOT have class_id.
// Class is resolved through:
// students.department + students.year + students.section
// =====================================================

const getStudentQuery = `
  SELECT
    st.student_id,
    st.user_id,
    st.register_number,
    st.name,
    st.email,
    st.department,
    st.year,
    st.section,

    d.department_id,
    d.department_name,
    d.department_code,

    c.class_id

  FROM students st

  LEFT JOIN departments d
    ON (
      LOWER(TRIM(st.department)) =
      LOWER(TRIM(d.department_name))
      OR
      LOWER(TRIM(st.department)) =
      LOWER(TRIM(d.department_code))
    )

  LEFT JOIN classes c
    ON c.department_id = d.department_id
    AND c.year = st.year
    AND LOWER(TRIM(c.section)) =
        LOWER(TRIM(st.section))
`;

// =====================================================
// GET ALL STUDENTS
// GET /api/students
// =====================================================

const getStudents = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
        ${getStudentQuery}
        ORDER BY
          d.department_name ASC,
          st.year ASC,
          st.section ASC,
          st.name ASC
      `
    );

    return res.json({
      success: true,
      count: rows.length,
      students: rows,
    });
  } catch (error) {
    console.error("Get students error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: error.message,
    });
  }
};

// =====================================================
// GET STUDENTS BY CLASS
// GET /api/students/class/:classId
//
// This is the important endpoint for Attendance.jsx.
//
// It returns ONLY students belonging to the selected class.
// =====================================================

const getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // -------------------------------------------------
    // Validate class ID
    // -------------------------------------------------

    if (
      classId === undefined ||
      classId === null ||
      String(classId).trim() === "" ||
      !/^\d+$/.test(String(classId).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid class ID is required",
      });
    }

    // -------------------------------------------------
    // Get class details
    // -------------------------------------------------

    const selectedClass = await getClassById(classId);

    if (!selectedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // -------------------------------------------------
    // Fetch ONLY students for this class
    //
    // Department can be stored as either:
    //   department_name
    // or
    //   department_code
    //
    // Student year must match class year.
    // Student section must match class section.
    // -------------------------------------------------

    const [rows] = await db.query(
      `
        SELECT
          st.student_id,
          st.user_id,
          st.register_number,
          st.name,
          st.email,
          st.department,
          st.year,
          st.section,

          d.department_id,
          d.department_name,
          d.department_code,

          c.class_id

        FROM students st

        INNER JOIN departments d
          ON (
            LOWER(TRIM(st.department)) =
            LOWER(TRIM(d.department_name))
            OR
            LOWER(TRIM(st.department)) =
            LOWER(TRIM(d.department_code))
          )

        INNER JOIN classes c
          ON c.department_id = d.department_id
          AND c.year = st.year
          AND LOWER(TRIM(c.section)) =
              LOWER(TRIM(st.section))

        WHERE c.class_id = ?

        ORDER BY
          st.name ASC,
          st.register_number ASC
      `,
      [Number(classId)]
    );

    return res.json({
      success: true,
      count: rows.length,

      class: {
        class_id: selectedClass.class_id,
        department_id: selectedClass.department_id,
        department_name: selectedClass.department_name,
        department_code: selectedClass.department_code,
        year: selectedClass.year,
        section: selectedClass.section,
      },

      students: rows,
    });
  } catch (error) {
    console.error("Get students by class error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch students for class",
      error: error.message,
    });
  }
};

// =====================================================
// GET STUDENT BY ID
// GET /api/students/:id
// =====================================================

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
        ${getStudentQuery}
        WHERE st.student_id = ?
        LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.json({
      success: true,
      student: rows[0],
    });
  } catch (error) {
    console.error("Get student by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch student",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE STUDENT
// POST /api/students
// =====================================================

const createStudent = async (req, res) => {
  let connection;

  try {
    const {
      user_id,
      register_number,
      name,
      email,
      department,
      department_id,
      year,
      section,
      class_id,
      username,
      password,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!register_number || String(register_number).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Register number is required",
      });
    }

    if (!name || String(name).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Student name is required",
      });
    }

    if (!username || String(username).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    if (!password || String(password).length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters",
      });
    }

    // -------------------------------------------------
    // DUPLICATE REGISTER NUMBER
    // -------------------------------------------------

    const [existingRegister] = await db.query(
      `
        SELECT student_id
        FROM students
        WHERE register_number = ?
        LIMIT 1
      `,
      [String(register_number).trim()]
    );

    if (existingRegister.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Register number already exists",
      });
    }

    // -------------------------------------------------
    // DUPLICATE USERNAME
    // -------------------------------------------------

    const [existingUsername] = await db.query(
      `
        SELECT user_id
        FROM users
        WHERE username = ?
        LIMIT 1
      `,
      [String(username).trim()]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    // -------------------------------------------------
    // RESOLVE DEPARTMENT
    // -------------------------------------------------

    let selectedDepartment = null;

    if (
      department_id !== undefined &&
      department_id !== null &&
      String(department_id).trim() !== ""
    ) {
      selectedDepartment = await getDepartment(department_id);
    }

    if (!selectedDepartment && department) {
      selectedDepartment = await getDepartment(department);
    }

    // -------------------------------------------------
    // RESOLVE CLASS
    // -------------------------------------------------

    let selectedClass = null;

    if (
      class_id !== undefined &&
      class_id !== null &&
      String(class_id).trim() !== ""
    ) {
      selectedClass = await getClassById(class_id);

      if (!selectedClass) {
        return res.status(400).json({
          success: false,
          message: "Selected class does not exist",
        });
      }

      selectedDepartment = await getDepartment(
        selectedClass.department_id
      );
    }

    // -------------------------------------------------
    // VALIDATE DEPARTMENT
    // -------------------------------------------------

    if (!selectedDepartment) {
      return res.status(400).json({
        success: false,
        message: "Valid department is required",
      });
    }

    // -------------------------------------------------
    // FINAL YEAR / SECTION
    // -------------------------------------------------

    let finalYear =
      year !== undefined &&
      year !== null &&
      String(year).trim() !== ""
        ? Number(year)
        : null;

    let finalSection =
      section !== undefined &&
      section !== null &&
      String(section).trim() !== ""
        ? String(section).trim()
        : null;

    // -------------------------------------------------
    // CLASS HAS PRIORITY
    // -------------------------------------------------

    if (selectedClass) {
      finalYear = selectedClass.year;
      finalSection = selectedClass.section;
    }

    // -------------------------------------------------
    // FIND CLASS IF NOT PROVIDED
    // -------------------------------------------------

    if (
      !selectedClass &&
      selectedDepartment &&
      finalYear !== null &&
      finalSection
    ) {
      selectedClass = await findClass(
        selectedDepartment.department_id,
        finalYear,
        finalSection
      );
    }

    // -------------------------------------------------
    // TRANSACTION
    // -------------------------------------------------

    connection = await db.getConnection();

    await connection.beginTransaction();

    // -------------------------------------------------
    // CREATE USER
    // -------------------------------------------------

    const hashedPassword = await bcrypt.hash(
      String(password),
      10
    );

    let createdUserId = user_id || null;

    if (!createdUserId) {
      const [userResult] = await connection.query(
        `
          INSERT INTO users
          (
            username,
            password,
            role
          )
          VALUES (?, ?, ?)
        `,
        [
          String(username).trim(),
          hashedPassword,
          "STUDENT",
        ]
      );

      createdUserId = userResult.insertId;
    }

    // -------------------------------------------------
    // INSERT STUDENT
    // -------------------------------------------------

    await connection.query(
      `
        INSERT INTO students
        (
          user_id,
          register_number,
          name,
          email,
          department,
          year,
          section
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        createdUserId,
        String(register_number).trim(),
        String(name).trim(),
        email ? String(email).trim() : null,
        selectedDepartment.department_name,
        finalYear,
        finalSection,
      ]
    );

    await connection.commit();

    // -------------------------------------------------
    // FETCH CREATED STUDENT
    // -------------------------------------------------

    const [createdRows] = await db.query(
      `
        ${getStudentQuery}
        WHERE st.user_id = ?
        LIMIT 1
      `,
      [createdUserId]
    );

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      student:
        createdRows.length > 0
          ? createdRows[0]
          : null,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }
    }

    console.error("Create student error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate value detected. Register number or username may already exist.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create student",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// =====================================================
// UPDATE STUDENT
// PUT /api/students/:id
// =====================================================

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      user_id,
      register_number,
      name,
      email,
      department,
      department_id,
      year,
      section,
      class_id,
    } = req.body;

    // -------------------------------------------------
    // CHECK EXISTING STUDENT
    // -------------------------------------------------

    const [existingRows] = await db.query(
      `
        SELECT
          student_id,
          user_id,
          register_number,
          name,
          email,
          department,
          year,
          section
        FROM students
        WHERE student_id = ?
        LIMIT 1
      `,
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const existingStudent = existingRows[0];

    // -------------------------------------------------
    // FINAL VALUES
    // -------------------------------------------------

    const finalRegisterNumber =
      register_number !== undefined
        ? String(register_number).trim()
        : existingStudent.register_number;

    const finalName =
      name !== undefined
        ? String(name).trim()
        : existingStudent.name;

    const finalEmail =
      email !== undefined
        ? email
          ? String(email).trim()
          : null
        : existingStudent.email;

    let finalDepartment =
      department !== undefined
        ? String(department).trim()
        : existingStudent.department;

    let finalYear =
      year !== undefined &&
      year !== null &&
      String(year).trim() !== ""
        ? Number(year)
        : existingStudent.year;

    let finalSection =
      section !== undefined &&
      section !== null &&
      String(section).trim() !== ""
        ? String(section).trim()
        : existingStudent.section;

    // -------------------------------------------------
    // VALIDATE
    // -------------------------------------------------

    if (!finalRegisterNumber) {
      return res.status(400).json({
        success: false,
        message: "Register number is required",
      });
    }

    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: "Student name is required",
      });
    }

    // -------------------------------------------------
    // DUPLICATE REGISTER NUMBER
    // -------------------------------------------------

    const [duplicateRegister] = await db.query(
      `
        SELECT student_id
        FROM students
        WHERE register_number = ?
          AND student_id <> ?
        LIMIT 1
      `,
      [finalRegisterNumber, id]
    );

    if (duplicateRegister.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Register number already exists",
      });
    }

    // -------------------------------------------------
    // RESOLVE DEPARTMENT
    // -------------------------------------------------

    let selectedDepartment = null;

    if (
      department_id !== undefined &&
      department_id !== null &&
      String(department_id).trim() !== ""
    ) {
      selectedDepartment = await getDepartment(department_id);
    }

    if (!selectedDepartment && finalDepartment) {
      selectedDepartment = await getDepartment(
        finalDepartment
      );
    }

    // -------------------------------------------------
    // RESOLVE CLASS
    // -------------------------------------------------

    let selectedClass = null;

    if (
      class_id !== undefined &&
      class_id !== null &&
      String(class_id).trim() !== ""
    ) {
      selectedClass = await getClassById(class_id);

      if (!selectedClass) {
        return res.status(400).json({
          success: false,
          message: "Selected class does not exist",
        });
      }

      selectedDepartment = await getDepartment(
        selectedClass.department_id
      );

      finalYear = selectedClass.year;
      finalSection = selectedClass.section;
    }

    // -------------------------------------------------
    // VALIDATE DEPARTMENT
    // -------------------------------------------------

    if (!selectedDepartment) {
      return res.status(400).json({
        success: false,
        message: "Valid department is required",
      });
    }

    // -------------------------------------------------
    // NORMALIZE DEPARTMENT
    // -------------------------------------------------

    finalDepartment =
      selectedDepartment.department_name;

    // -------------------------------------------------
    // UPDATE STUDENT
    // -------------------------------------------------

    await db.query(
      `
        UPDATE students
        SET
          register_number = ?,
          name = ?,
          email = ?,
          department = ?,
          year = ?,
          section = ?
        WHERE student_id = ?
      `,
      [
        finalRegisterNumber,
        finalName,
        finalEmail,
        finalDepartment,
        finalYear,
        finalSection,
        id,
      ]
    );

    // -------------------------------------------------
    // UPDATE USER ID IF PROVIDED
    // -------------------------------------------------

    if (
      user_id !== undefined &&
      user_id !== null &&
      String(user_id).trim() !== ""
    ) {
      await db.query(
        `
          UPDATE students
          SET user_id = ?
          WHERE student_id = ?
        `,
        [user_id, id]
      );
    }

    // -------------------------------------------------
    // RETURN UPDATED STUDENT
    // -------------------------------------------------

    const [updatedRows] = await db.query(
      `
        ${getStudentQuery}
        WHERE st.student_id = ?
        LIMIT 1
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Student updated successfully",
      student:
        updatedRows.length > 0
          ? updatedRows[0]
          : null,
    });
  } catch (error) {
    console.error("Update student error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Register number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update student",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE STUDENT
// DELETE /api/students/:id
// =====================================================

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // -------------------------------------------------
    // CHECK STUDENT
    // -------------------------------------------------

    const [studentRows] = await db.query(
      `
        SELECT
          student_id,
          user_id
        FROM students
        WHERE student_id = ?
        LIMIT 1
      `,
      [id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const student = studentRows[0];

    // -------------------------------------------------
    // DELETE STUDENT
    // -------------------------------------------------

    await db.query(
      `
        DELETE FROM students
        WHERE student_id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Student deleted successfully",
      warning: student.user_id
        ? "The associated user account was not deleted automatically."
        : null,
    });
  } catch (error) {
    console.error("Delete student error:", error);

    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_ROW_IS_REFERENCED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this student because attendance or other records are linked to the student.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete student",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getStudents,
  getStudentsByClass,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};