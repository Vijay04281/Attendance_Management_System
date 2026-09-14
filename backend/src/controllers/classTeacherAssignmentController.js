const db = require("../config/db");

// =====================================================
// GET ALL CLASS TEACHER ASSIGNMENTS
// GET /api/class-teacher-assignments
// =====================================================

const getClassTeacherAssignments = async (req, res) => {
    try {
        const [rows] = await db.query(
            `
            SELECT
                cta.assignment_id,
                cta.teacher_user_id,
                cta.class_id,
                cta.academic_year,
                cta.semester,
                cta.status,
                cta.assigned_at,

                s.staff_id,
                s.staff_code,
                s.name AS teacher_name,
                s.email AS teacher_email,
                s.department AS teacher_department,
                s.role AS teacher_role,

                c.year,
                c.section,
                c.department_id,

                d.department_name

            FROM class_teacher_assignments cta

            LEFT JOIN staff s
                ON s.user_id = cta.teacher_user_id

            LEFT JOIN classes c
                ON c.class_id = cta.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            ORDER BY
                cta.assigned_at DESC,
                cta.assignment_id DESC
            `
        );

        return res.status(200).json({
            success: true,
            count: rows.length,
            assignments: rows
        });
    } catch (error) {
        console.error(
            "Get Class Teacher Assignments Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch class teacher assignments",
            error: error.message
        });
    }
};

// =====================================================
// GET ASSIGNMENT BY ID
// GET /api/class-teacher-assignments/:id
// =====================================================

const getClassTeacherAssignmentById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid assignment ID is required"
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                cta.assignment_id,
                cta.teacher_user_id,
                cta.class_id,
                cta.academic_year,
                cta.semester,
                cta.status,
                cta.assigned_at,

                s.staff_id,
                s.staff_code,
                s.name AS teacher_name,
                s.email AS teacher_email,
                s.department AS teacher_department,
                s.role AS teacher_role,

                c.year,
                c.section,
                c.department_id,

                d.department_name

            FROM class_teacher_assignments cta

            LEFT JOIN staff s
                ON s.user_id = cta.teacher_user_id

            LEFT JOIN classes c
                ON c.class_id = cta.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE cta.assignment_id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Class teacher assignment not found"
            });
        }

        return res.status(200).json({
            success: true,
            assignment: rows[0]
        });
    } catch (error) {
        console.error(
            "Get Class Teacher Assignment By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch class teacher assignment",
            error: error.message
        });
    }
};

// =====================================================
// CREATE CLASS TEACHER ASSIGNMENT
// POST /api/class-teacher-assignments
// =====================================================

const createClassTeacherAssignment = async (
    req,
    res
) => {
    try {
        const {
            teacher_user_id,
            class_id,
            academic_year,
            semester,
            status
        } = req.body;

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !teacher_user_id ||
            !class_id ||
            !academic_year
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Teacher, class and academic year are required"
            });
        }

        const teacherUserId = Number(
            teacher_user_id
        );

        const classId = Number(class_id);

        if (
            !Number.isInteger(teacherUserId) ||
            teacherUserId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid teacher user ID"
            });
        }

        if (
            !Number.isInteger(classId) ||
            classId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid class ID"
            });
        }

        const normalizedStatus =
            String(status || "ACTIVE")
                .trim()
                .toUpperCase();

        if (
            !["ACTIVE", "INACTIVE"].includes(
                normalizedStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be ACTIVE or INACTIVE"
            });
        }

        const academicYear =
            String(academic_year).trim();

        const normalizedSemester =
            semester === null ||
            semester === undefined ||
            String(semester).trim() === ""
                ? null
                : String(semester).trim();

        // ---------------------------------------------
        // CHECK TEACHER
        // ---------------------------------------------

        const [teacherRows] = await db.query(
            `
            SELECT
                staff_id,
                user_id,
                staff_code,
                name,
                role
            FROM staff
            WHERE user_id = ?
            LIMIT 1
            `,
            [teacherUserId]
        );

        if (teacherRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Selected class teacher was not found"
            });
        }

        const teacher = teacherRows[0];

        // ---------------------------------------------
        // CHECK TEACHER ROLE
        // ---------------------------------------------

        const teacherRole = String(
            teacher.role || ""
        )
            .trim()
            .toUpperCase();

        if (
            ![
                "TEACHER",
                "STAFF",
                "HOD"
            ].includes(teacherRole)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Selected staff member cannot be assigned as a class teacher"
            });
        }

        // ---------------------------------------------
        // CHECK CLASS
        // ---------------------------------------------

        const [classRows] = await db.query(
            `
            SELECT
                class_id,
                department_id,
                year,
                section
            FROM classes
            WHERE class_id = ?
            LIMIT 1
            `,
            [classId]
        );

        if (classRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Selected class was not found"
            });
        }

        // ---------------------------------------------
        // CHECK DUPLICATE TEACHER + CLASS
        // ---------------------------------------------

        const [duplicateRows] = await db.query(
            `
            SELECT
                assignment_id
            FROM class_teacher_assignments

            WHERE teacher_user_id = ?
              AND class_id = ?
              AND academic_year = ?

              AND (
                    (semester = ?)
                    OR
                    (
                        semester IS NULL
                        AND ? IS NULL
                    )
                  )

              AND status = 'ACTIVE'

            LIMIT 1
            `,
            [
                teacherUserId,
                classId,
                academicYear,
                normalizedSemester,
                normalizedSemester
            ]
        );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This teacher is already assigned to this class for the selected academic year and semester"
            });
        }

        // ---------------------------------------------
        // CHECK WHETHER CLASS ALREADY HAS ACTIVE
        // CLASS TEACHER
        // ---------------------------------------------

        const [existingClassTeacher] =
            await db.query(
                `
                SELECT
                    assignment_id,
                    teacher_user_id

                FROM class_teacher_assignments

                WHERE class_id = ?
                  AND academic_year = ?

                  AND (
                        (semester = ?)
                        OR
                        (
                            semester IS NULL
                            AND ? IS NULL
                        )
                      )

                  AND status = 'ACTIVE'

                LIMIT 1
                `,
                [
                    classId,
                    academicYear,
                    normalizedSemester,
                    normalizedSemester
                ]
            );

        if (existingClassTeacher.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This class already has an active class teacher for the selected academic year and semester"
            });
        }

        // ---------------------------------------------
        // INSERT
        // ---------------------------------------------

        const [result] = await db.query(
            `
            INSERT INTO class_teacher_assignments
            (
                teacher_user_id,
                class_id,
                academic_year,
                semester,
                status
            )

            VALUES (?, ?, ?, ?, ?)
            `,
            [
                teacherUserId,
                classId,
                academicYear,
                normalizedSemester,
                normalizedStatus
            ]
        );
// Update user role
await db.query(
    `
    UPDATE users
    SET role = 'TEACHER'
    WHERE user_id = ?
    `,
    [teacherUserId]
);

// Update staff role
await db.query(
    `
    UPDATE staff
    SET role = 'TEACHER'
    WHERE user_id = ?
    `,
    [teacherUserId]
);
        // ---------------------------------------------
        // GET CREATED RECORD
        // ---------------------------------------------

        const [createdRows] = await db.query(
            `
            SELECT
                cta.assignment_id,
                cta.teacher_user_id,
                cta.class_id,
                cta.academic_year,
                cta.semester,
                cta.status,
                cta.assigned_at,

                s.staff_id,
                s.staff_code,
                s.name AS teacher_name,

                c.year,
                c.section,
                c.department_id,

                d.department_name

            FROM class_teacher_assignments cta

            LEFT JOIN staff s
                ON s.user_id = cta.teacher_user_id

            LEFT JOIN classes c
                ON c.class_id = cta.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE cta.assignment_id = ?

            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message:
                "Class teacher assigned successfully",
            assignment:
                createdRows.length > 0
                    ? createdRows[0]
                    : {
                          assignment_id:
                              result.insertId
                      }
        });
    } catch (error) {
        console.error(
            "Create Class Teacher Assignment Error:",
            error
        );

        // MySQL duplicate
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "This class teacher assignment already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create class teacher assignment",
            error: error.message
        });
    }
};

// =====================================================
// UPDATE CLASS TEACHER ASSIGNMENT
// PUT /api/class-teacher-assignments/:id
// =====================================================

const updateClassTeacherAssignment = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const {
            teacher_user_id,
            class_id,
            academic_year,
            semester,
            status
        } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid assignment ID is required"
            });
        }

        if (
            !teacher_user_id ||
            !class_id ||
            !academic_year
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Teacher, class and academic year are required"
            });
        }

        const assignmentId = Number(id);
        const teacherUserId = Number(
            teacher_user_id
        );
        const classId = Number(class_id);

        if (
            !Number.isInteger(teacherUserId) ||
            teacherUserId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid teacher user ID"
            });
        }

        if (
            !Number.isInteger(classId) ||
            classId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid class ID"
            });
        }

        const normalizedStatus =
            String(status || "ACTIVE")
                .trim()
                .toUpperCase();

        if (
            !["ACTIVE", "INACTIVE"].includes(
                normalizedStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be ACTIVE or INACTIVE"
            });
        }

        const academicYear =
            String(academic_year).trim();

        const normalizedSemester =
            semester === null ||
            semester === undefined ||
            String(semester).trim() === ""
                ? null
                : String(semester).trim();

        // ---------------------------------------------
        // CHECK EXISTING ASSIGNMENT
        // ---------------------------------------------

        const [assignmentRows] =
            await db.query(
                `
                SELECT
                    assignment_id
                FROM class_teacher_assignments
                WHERE assignment_id = ?
                LIMIT 1
                `,
                [assignmentId]
            );

        if (assignmentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Class teacher assignment not found"
            });
        }

        // ---------------------------------------------
        // CHECK TEACHER
        // ---------------------------------------------

        const [teacherRows] = await db.query(
            `
            SELECT
                staff_id,
                user_id,
                staff_code,
                name,
                role
            FROM staff
            WHERE user_id = ?
            LIMIT 1
            `,
            [teacherUserId]
        );

        if (teacherRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Selected class teacher was not found"
            });
        }

        // ---------------------------------------------
        // CHECK CLASS
        // ---------------------------------------------

        const [classRows] = await db.query(
            `
            SELECT
                class_id,
                department_id,
                year,
                section
            FROM classes
            WHERE class_id = ?
            LIMIT 1
            `,
            [classId]
        );

        if (classRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Selected class was not found"
            });
        }

        // ---------------------------------------------
        // CHECK DUPLICATE
        // ---------------------------------------------

        const [duplicateRows] = await db.query(
            `
            SELECT
                assignment_id

            FROM class_teacher_assignments

            WHERE assignment_id <> ?
              AND teacher_user_id = ?
              AND class_id = ?
              AND academic_year = ?

              AND (
                    (semester = ?)
                    OR
                    (
                        semester IS NULL
                        AND ? IS NULL
                    )
                  )

              AND status = 'ACTIVE'

            LIMIT 1
            `,
            [
                assignmentId,
                teacherUserId,
                classId,
                academicYear,
                normalizedSemester,
                normalizedSemester
            ]
        );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Another active assignment already exists with these details"
            });
        }

        // ---------------------------------------------
        // CHECK CLASS ACTIVE TEACHER
        // ---------------------------------------------

        if (normalizedStatus === "ACTIVE") {
            const [existingClassTeacher] =
                await db.query(
                    `
                    SELECT
                        assignment_id

                    FROM class_teacher_assignments

                    WHERE assignment_id <> ?
                      AND class_id = ?
                      AND academic_year = ?

                      AND (
                            (semester = ?)
                            OR
                            (
                                semester IS NULL
                                AND ? IS NULL
                            )
                          )

                      AND status = 'ACTIVE'

                    LIMIT 1
                    `,
                    [
                        assignmentId,
                        classId,
                        academicYear,
                        normalizedSemester,
                        normalizedSemester
                    ]
                );

            if (
                existingClassTeacher.length > 0
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This class already has another active class teacher for the selected academic year and semester"
                });
            }
        }

        // ---------------------------------------------
        // UPDATE
        // ---------------------------------------------

        await db.query(
            `
            UPDATE class_teacher_assignments

            SET
                teacher_user_id = ?,
                class_id = ?,
                academic_year = ?,
                semester = ?,
                status = ?

            WHERE assignment_id = ?
            `,
            [
                teacherUserId,
                classId,
                academicYear,
                normalizedSemester,
                normalizedStatus,
                assignmentId
            ]
        );
// Update user role
await db.query(
    `
    UPDATE users
    SET role = 'TEACHER'
    WHERE user_id = ?
    `,
    [teacherUserId]
);

// Update staff role
await db.query(
    `
    UPDATE staff
    SET role = 'TEACHER'
    WHERE user_id = ?
    `,
    [teacherUserId]
);
        // ---------------------------------------------
        // GET UPDATED RECORD
        // ---------------------------------------------

        const [updatedRows] = await db.query(
            `
            SELECT
                cta.assignment_id,
                cta.teacher_user_id,
                cta.class_id,
                cta.academic_year,
                cta.semester,
                cta.status,
                cta.assigned_at,

                s.staff_id,
                s.staff_code,
                s.name AS teacher_name,

                c.year,
                c.section,
                c.department_id,

                d.department_name

            FROM class_teacher_assignments cta

            LEFT JOIN staff s
                ON s.user_id = cta.teacher_user_id

            LEFT JOIN classes c
                ON c.class_id = cta.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE cta.assignment_id = ?

            LIMIT 1
            `,
            [assignmentId]
        );

        return res.status(200).json({
            success: true,
            message:
                "Class teacher assignment updated successfully",
            assignment:
                updatedRows.length > 0
                    ? updatedRows[0]
                    : null
        });
    } catch (error) {
        console.error(
            "Update Class Teacher Assignment Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update class teacher assignment",
            error: error.message
        });
    }
};

// =====================================================
// DELETE CLASS TEACHER ASSIGNMENT
// DELETE /api/class-teacher-assignments/:id
// =====================================================

const deleteClassTeacherAssignment = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid assignment ID is required"
            });
        }

        const assignmentId = Number(id);

        const [rows] = await db.query(
            `
            SELECT
                assignment_id
            FROM class_teacher_assignments
            WHERE assignment_id = ?
            LIMIT 1
            `,
            [assignmentId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Class teacher assignment not found"
            });
        }

        await db.query(
            `
            DELETE FROM class_teacher_assignments
            WHERE assignment_id = ?
            `,
            [assignmentId]
        );

        return res.status(200).json({
            success: true,
            message:
                "Class teacher assignment deleted successfully"
        });
    } catch (error) {
        console.error(
            "Delete Class Teacher Assignment Error:",
            error
        );

        if (
            error.code ===
            "ER_ROW_IS_REFERENCED_2"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "This assignment cannot be deleted because it is being used by another record"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete class teacher assignment",
            error: error.message
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getClassTeacherAssignments,
    getClassTeacherAssignmentById,
    createClassTeacherAssignment,
    updateClassTeacherAssignment,
    deleteClassTeacherAssignment
};