const db = require("../config/db");

// =====================================================
// HELPERS
// =====================================================

const normalizeNullable = (value) => {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    return value;
};

const normalizeNumber = (value) => {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isNaN(number) ? null : number;
};


// =====================================================
// GET LOGGED-IN STAFF ID
// =====================================================
//
// JWT contains user_id.
// staff table contains:
// staff_id
// user_id
//
// Therefore:
// users.user_id -> staff.user_id -> staff.staff_id
//
// =====================================================

const getLoggedInStaffId = async (req) => {
    try {
        if (!req.user) {
            return null;
        }

        // If middleware already provides staff_id
        if (req.user.staff_id) {
            const staffId = Number(req.user.staff_id);

            if (!Number.isNaN(staffId)) {
                return staffId;
            }
        }

        // Normal login JWT contains user_id
        const userId =
            req.user.user_id ||
            req.user.id ||
            req.user.uid;

        if (!userId) {
            return null;
        }

        const [rows] = await db.query(
            `
            SELECT staff_id
            FROM staff
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );

        if (!rows.length) {
            return null;
        }

        return Number(rows[0].staff_id);

    } catch (error) {
        console.error(
            "Get Logged-in Staff ID Error:",
            error
        );

        return null;
    }
};


// =====================================================
// GET ALL SUBJECT ALLOCATIONS
// =====================================================

const getSubjectAllocations = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                sa.allocation_id,
                sa.subject_id,
                sa.staff_id,
                sa.class_id,
                sa.academic_year,
                sa.department,
                sa.year,
                sa.semester,
                sa.created_at,

                s.subject_code,
                s.subject_name,

                st.name AS staff_name,
                st.staff_code,

                c.year AS class_year,
                c.section AS class_section,
                c.department_id AS class_department_id

            FROM subject_allocations sa

            LEFT JOIN subjects s
                ON sa.subject_id = s.subject_id

            LEFT JOIN staff st
                ON sa.staff_id = st.staff_id

            LEFT JOIN classes c
                ON sa.class_id = c.class_id

            ORDER BY sa.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            count: rows.length,
            allocations: rows
        });

    } catch (error) {
        console.error(
            "Get Subject Allocations Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch allocations",
            error: error.message
        });
    }
};


// =====================================================
// GET SUBJECTS ALLOCATED TO LOGGED-IN STAFF
// =====================================================
//
// GET:
// /api/subject-allocations/staff
//
// This is the important endpoint for Staff pages.
//
// It returns ONLY allocations belonging to the logged-in
// staff member.
//
// =====================================================

const getStaffSubjectAllocations = async (req, res) => {
    try {
        console.log("========================================");
        console.log("GET STAFF SUBJECT ALLOCATIONS");
        console.log("Logged-in user:", req.user);
        console.log("========================================");

        const staffId = await getLoggedInStaffId(req);

        if (!staffId) {
            return res.status(404).json({
                success: false,
                message:
                    "Staff profile not found for the logged-in user"
            });
        }

        console.log(
            "Resolved staff_id:",
            staffId
        );

        const [rows] = await db.query(`
            SELECT
                sa.allocation_id,

                sa.subject_id,
                sa.staff_id,

                sa.class_id,
                sa.academic_year,

                sa.department,
                sa.year,
                sa.semester,

                sa.created_at,

                s.subject_code,
                s.subject_name,

                s.credits,

                st.staff_code,
                st.name AS staff_name,

                c.year AS class_year,
                c.section AS class_section,
                c.department_id AS class_department_id

            FROM subject_allocations sa

            INNER JOIN subjects s
                ON sa.subject_id = s.subject_id

            INNER JOIN staff st
                ON sa.staff_id = st.staff_id

            LEFT JOIN classes c
                ON sa.class_id = c.class_id

            WHERE sa.staff_id = ?

            ORDER BY
                sa.academic_year DESC,
                sa.semester ASC,
                s.subject_name ASC
        `, [staffId]);

        console.log(
            "Staff allocations found:",
            rows.length
        );

        return res.status(200).json({
            success: true,
            count: rows.length,
            staff_id: staffId,
            allocations: rows
        });

    } catch (error) {
        console.error(
            "Get Staff Subject Allocations Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch staff subject allocations",
            error: error.message
        });
    }
};


// =====================================================
// GET SUBJECT ALLOCATION BY ID
// =====================================================

const getSubjectAllocationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid allocation ID is required"
            });
        }

        const [rows] = await db.query(`
            SELECT
                sa.allocation_id,
                sa.subject_id,
                sa.staff_id,
                sa.class_id,
                sa.academic_year,
                sa.department,
                sa.year,
                sa.semester,
                sa.created_at,

                s.subject_code,
                s.subject_name,

                st.name AS staff_name,
                st.staff_code,

                c.year AS class_year,
                c.section AS class_section,
                c.department_id AS class_department_id

            FROM subject_allocations sa

            LEFT JOIN subjects s
                ON sa.subject_id = s.subject_id

            LEFT JOIN staff st
                ON sa.staff_id = st.staff_id

            LEFT JOIN classes c
                ON sa.class_id = c.class_id

            WHERE sa.allocation_id = ?

            LIMIT 1
        `, [id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Allocation not found"
            });
        }

        return res.status(200).json({
            success: true,
            allocation: rows[0]
        });

    } catch (error) {
        console.error(
            "Get Allocation Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch allocation",
            error: error.message
        });
    }
};


// =====================================================
// CREATE SUBJECT ALLOCATION
// =====================================================

const createSubjectAllocation = async (req, res) => {
    try {
        const {
            subject_id,
            staff_id,
            class_id,
            academic_year,
            department,
            year,
            semester
        } = req.body;

        console.log("========================================");
        console.log("CREATE SUBJECT ALLOCATION");
        console.log("Request body:", req.body);
        console.log("========================================");

        // -------------------------------------------------
        // REQUIRED FIELDS
        // -------------------------------------------------

        if (
            subject_id === undefined ||
            subject_id === null ||
            subject_id === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "subject_id is required"
            });
        }

        if (
            staff_id === undefined ||
            staff_id === null ||
            staff_id === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "staff_id is required"
            });
        }

        // -------------------------------------------------
        // NORMALIZE VALUES
        // -------------------------------------------------

        const subjectIdValue =
            normalizeNumber(subject_id);

        const staffIdValue =
            normalizeNumber(staff_id);

        const classIdValue =
            normalizeNumber(class_id);

        const departmentValue =
            normalizeNullable(department);

        const yearValue =
            normalizeNumber(year);

        const semesterValue =
            normalizeNumber(semester);

        const academicYearValue =
            normalizeNullable(academic_year);

        // -------------------------------------------------
        // VALIDATE SUBJECT
        // -------------------------------------------------

        const [subjectRows] = await db.query(`
            SELECT
                subject_id,
                subject_code,
                subject_name,
                department,
                year,
                semester,
                section,
                staff_id
            FROM subjects
            WHERE subject_id = ?
            LIMIT 1
        `, [subjectIdValue]);

        if (!subjectRows.length) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        // -------------------------------------------------
        // VALIDATE STAFF
        // -------------------------------------------------

        const [staffRows] = await db.query(`
            SELECT
                staff_id,
                staff_code,
                name
            FROM staff
            WHERE staff_id = ?
            LIMIT 1
        `, [staffIdValue]);

        if (!staffRows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Staff member not found"
            });
        }

        // -------------------------------------------------
        // VALIDATE CLASS
        // -------------------------------------------------

        if (classIdValue !== null) {
            const [classRows] = await db.query(`
                SELECT
                    class_id,
                    department_id,
                    year,
                    section
                FROM classes
                WHERE class_id = ?
                LIMIT 1
            `, [classIdValue]);

            if (!classRows.length) {
                return res.status(404).json({
                    success: false,
                    message: "Class not found"
                });
            }
        }

        // -------------------------------------------------
        // DUPLICATE ALLOCATION CHECK
        // -------------------------------------------------

        const [duplicate] = await db.query(`
            SELECT allocation_id
            FROM subject_allocations
            WHERE subject_id = ?
              AND staff_id = ?

              AND (
                    class_id = ?
                    OR (
                        class_id IS NULL
                        AND ? IS NULL
                    )
                  )

              AND (
                    academic_year = ?
                    OR (
                        academic_year IS NULL
                        AND ? IS NULL
                    )
                  )

            LIMIT 1
        `, [
            subjectIdValue,
            staffIdValue,
            classIdValue,
            classIdValue,
            academicYearValue,
            academicYearValue
        ]);

        if (duplicate.length) {
            return res.status(409).json({
                success: false,
                message:
                    "This subject is already allocated to this staff member for the selected class and academic year."
            });
        }

        // -------------------------------------------------
        // INSERT
        // -------------------------------------------------

        const [result] = await db.query(`
            INSERT INTO subject_allocations
            (
                subject_id,
                staff_id,
                class_id,
                academic_year,
                department,
                year,
                semester
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            subjectIdValue,
            staffIdValue,
            classIdValue,
            academicYearValue,
            departmentValue,
            yearValue,
            semesterValue
        ]);

        console.log(
            "Allocation created. ID:",
            result.insertId
        );

        // -------------------------------------------------
        // RETURN CREATED ALLOCATION
        // -------------------------------------------------

        const [createdRows] = await db.query(`
            SELECT
                sa.allocation_id,
                sa.subject_id,
                sa.staff_id,
                sa.class_id,
                sa.academic_year,
                sa.department,
                sa.year,
                sa.semester,
                sa.created_at,

                s.subject_code,
                s.subject_name,

                st.name AS staff_name,
                st.staff_code,

                c.year AS class_year,
                c.section AS class_section,
                c.department_id AS class_department_id

            FROM subject_allocations sa

            LEFT JOIN subjects s
                ON sa.subject_id = s.subject_id

            LEFT JOIN staff st
                ON sa.staff_id = st.staff_id

            LEFT JOIN classes c
                ON sa.class_id = c.class_id

            WHERE sa.allocation_id = ?

            LIMIT 1
        `, [result.insertId]);

        return res.status(201).json({
            success: true,
            message:
                "Subject allocation created successfully",
            allocation_id: result.insertId,
            allocation: createdRows[0] || null
        });

    } catch (error) {
        console.error(
            "Create Allocation Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create allocation",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE SUBJECT ALLOCATION
// =====================================================

const updateSubjectAllocation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid allocation ID is required"
            });
        }

        const {
            subject_id,
            staff_id,
            class_id,
            academic_year,
            department,
            year,
            semester
        } = req.body;

        // -------------------------------------------------
        // GET EXISTING
        // -------------------------------------------------

        const [existingRows] = await db.query(`
            SELECT
                allocation_id,
                subject_id,
                staff_id,
                class_id,
                academic_year,
                department,
                year,
                semester
            FROM subject_allocations
            WHERE allocation_id = ?
            LIMIT 1
        `, [id]);

        if (!existingRows.length) {
            return res.status(404).json({
                success: false,
                message: "Allocation not found"
            });
        }

        const old = existingRows[0];

        // -------------------------------------------------
        // KEEP OLD VALUES
        // -------------------------------------------------

        const updatedSubjectId =
            subject_id !== undefined
                ? normalizeNumber(subject_id)
                : old.subject_id;

        const updatedStaffId =
            staff_id !== undefined
                ? normalizeNumber(staff_id)
                : old.staff_id;

        const updatedClassId =
            class_id !== undefined
                ? normalizeNumber(class_id)
                : old.class_id;

        const updatedAcademicYear =
            academic_year !== undefined
                ? normalizeNullable(academic_year)
                : old.academic_year;

        const updatedDepartment =
            department !== undefined
                ? normalizeNullable(department)
                : old.department;

        const updatedYear =
            year !== undefined
                ? normalizeNumber(year)
                : old.year;

        const updatedSemester =
            semester !== undefined
                ? normalizeNumber(semester)
                : old.semester;

        // -------------------------------------------------
        // VALIDATE SUBJECT
        // -------------------------------------------------

        const [subjectRows] = await db.query(`
            SELECT subject_id
            FROM subjects
            WHERE subject_id = ?
            LIMIT 1
        `, [updatedSubjectId]);

        if (!subjectRows.length) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        // -------------------------------------------------
        // VALIDATE STAFF
        // -------------------------------------------------

        const [staffRows] = await db.query(`
            SELECT staff_id
            FROM staff
            WHERE staff_id = ?
            LIMIT 1
        `, [updatedStaffId]);

        if (!staffRows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Staff member not found"
            });
        }

        // -------------------------------------------------
        // VALIDATE CLASS
        // -------------------------------------------------

        if (updatedClassId !== null) {
            const [classRows] = await db.query(`
                SELECT class_id
                FROM classes
                WHERE class_id = ?
                LIMIT 1
            `, [updatedClassId]);

            if (!classRows.length) {
                return res.status(404).json({
                    success: false,
                    message: "Class not found"
                });
            }
        }

        // -------------------------------------------------
        // DUPLICATE CHECK
        // -------------------------------------------------

        const [duplicate] = await db.query(`
            SELECT allocation_id
            FROM subject_allocations
            WHERE subject_id = ?
              AND staff_id = ?
              AND allocation_id != ?

              AND (
                    class_id = ?
                    OR (
                        class_id IS NULL
                        AND ? IS NULL
                    )
                  )

              AND (
                    academic_year = ?
                    OR (
                        academic_year IS NULL
                        AND ? IS NULL
                    )
                  )

            LIMIT 1
        `, [
            updatedSubjectId,
            updatedStaffId,
            id,
            updatedClassId,
            updatedClassId,
            updatedAcademicYear,
            updatedAcademicYear
        ]);

        if (duplicate.length) {
            return res.status(409).json({
                success: false,
                message:
                    "This subject is already allocated to this staff member for the selected class and academic year."
            });
        }

        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

        await db.query(`
            UPDATE subject_allocations
            SET
                subject_id = ?,
                staff_id = ?,
                class_id = ?,
                academic_year = ?,
                department = ?,
                year = ?,
                semester = ?

            WHERE allocation_id = ?
        `, [
            updatedSubjectId,
            updatedStaffId,
            updatedClassId,
            updatedAcademicYear,
            updatedDepartment,
            updatedYear,
            updatedSemester,
            id
        ]);

        // -------------------------------------------------
        // GET UPDATED ALLOCATION
        // -------------------------------------------------

        const [updatedRows] = await db.query(`
            SELECT
                sa.allocation_id,
                sa.subject_id,
                sa.staff_id,
                sa.class_id,
                sa.academic_year,
                sa.department,
                sa.year,
                sa.semester,
                sa.created_at,

                s.subject_code,
                s.subject_name,

                st.name AS staff_name,
                st.staff_code,

                c.year AS class_year,
                c.section AS class_section,
                c.department_id AS class_department_id

            FROM subject_allocations sa

            LEFT JOIN subjects s
                ON sa.subject_id = s.subject_id

            LEFT JOIN staff st
                ON sa.staff_id = st.staff_id

            LEFT JOIN classes c
                ON sa.class_id = c.class_id

            WHERE sa.allocation_id = ?

            LIMIT 1
        `, [id]);

        return res.status(200).json({
            success: true,
            message:
                "Allocation updated successfully",
            allocation:
                updatedRows[0] || null
        });

    } catch (error) {
        console.error(
            "Update Allocation Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update allocation",
            error: error.message
        });
    }
};


// =====================================================
// DELETE SUBJECT ALLOCATION
// =====================================================

const deleteSubjectAllocation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid allocation ID is required"
            });
        }

        const [result] = await db.query(`
            DELETE FROM subject_allocations
            WHERE allocation_id = ?
        `, [id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Allocation not found"
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Allocation deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete Subject Allocation Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete allocation",
            error: error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getSubjectAllocations,
    getStaffSubjectAllocations,
    getSubjectAllocationById,
    createSubjectAllocation,
    updateSubjectAllocation,
    deleteSubjectAllocation
};