// =====================================================
// CLASS TEACHER ASSIGNMENT CONTROLLER
// ATTENDANCE MANAGEMENT SYSTEM
// =====================================================

const db = require("../config/db");

// =====================================================
// HELPER
// =====================================================

const getErrorMessage = (error) => {
    return (
        error?.sqlMessage ||
        error?.message ||
        "Database operation failed."
    );
};

// =====================================================
// GET ALL CLASS TEACHER ASSIGNMENTS
//
// GET /api/class-teacher-assignments
// =====================================================

const getClassTeacherAssignments = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
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

                c.year,
                c.section,

                d.department_id,
                d.department_name,
                d.department_code

            FROM class_teacher_assignments cta

            LEFT JOIN staff s
                ON s.user_id = cta.teacher_user_id

            LEFT JOIN classes c
                ON c.class_id = cta.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            ORDER BY
                cta.assignment_id DESC
        `);

        return res.status(200).json({
            success: true,
            assignments: rows
        });
    } catch (error) {
        console.error(
            "GET CLASS TEACHER ASSIGNMENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load class teacher assignments.",
            error: getErrorMessage(error)
        });
    }
};

// =====================================================
// GET ONE CLASS TEACHER ASSIGNMENT
//
// GET /api/class-teacher-assignments/:id
// =====================================================

const getClassTeacherAssignmentById = async (
    req,
    res
) => {
    try {
        const assignmentId =
            Number(req.params.id);

        if (!Number.isInteger(assignmentId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid assignment ID."
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

                c.year,
                c.section,

                d.department_id,
                d.department_name,
                d.department_code

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

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Class teacher assignment not found."
            });
        }

        return res.status(200).json({
            success: true,
            assignment: rows[0]
        });
    } catch (error) {
        console.error(
            "GET CLASS TEACHER ASSIGNMENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load class teacher assignment.",
            error: getErrorMessage(error)
        });
    }
};

// =====================================================
// CREATE CLASS TEACHER ASSIGNMENT
//
// POST /api/class-teacher-assignments
//
// Body:
// {
//     teacher_user_id,
//     class_id,
//     academic_year,
//     semester,
//     status
// }
// =====================================================

const createClassTeacherAssignment = async (
    req,
    res
) => {
    let connection;

    try {
        const {
            teacher_user_id,
            class_id,
            academic_year,
            semester,
            status
        } = req.body;

        const teacherUserId =
            Number(teacher_user_id);

        const classId =
            Number(class_id);

        const academicYear =
            String(
                academic_year || ""
            ).trim();

        const normalizedStatus =
            String(
                status || "ACTIVE"
            )
                .trim()
                .toUpperCase();

        let normalizedSemester =
            null;

        if (
            semester !== null &&
            semester !== undefined &&
            String(semester).trim() !== ""
        ) {
            normalizedSemester =
                String(semester).trim();
        }

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !Number.isInteger(
                teacherUserId
            ) ||
            teacherUserId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid teacher_user_id is required."
            });
        }

        if (
            !Number.isInteger(classId) ||
            classId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid class_id is required."
            });
        }

        if (!academicYear) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic year is required."
            });
        }

        if (
            !["ACTIVE", "INACTIVE"].includes(
                normalizedStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be ACTIVE or INACTIVE."
            });
        }

        // ---------------------------------------------
        // CONNECTION
        // ---------------------------------------------

        connection =
            await db.getConnection();

        await connection.beginTransaction();

        // ---------------------------------------------
        // CHECK STAFF
        // ---------------------------------------------

        const [staffRows] =
            await connection.query(
                `
                SELECT
                    staff_id,
                    user_id,
                    staff_code
                FROM staff
                WHERE user_id = ?
                LIMIT 1
                `,
                [teacherUserId]
            );

        if (staffRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Selected class teacher does not exist in staff records."
            });
        }

        // ---------------------------------------------
        // CHECK CLASS
        // ---------------------------------------------

        const [classRows] =
            await connection.query(
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
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Selected class does not exist."
            });
        }

        // ---------------------------------------------
        // CHECK DUPLICATE ACTIVE ASSIGNMENT
        //
        // Same teacher + class + academic year
        // should not be duplicated.
        // ---------------------------------------------

        const [duplicateRows] =
            await connection.query(
                `
                SELECT
                    assignment_id,
                    status
                FROM class_teacher_assignments
                WHERE teacher_user_id = ?
                  AND class_id = ?
                  AND academic_year = ?
                LIMIT 1
                `,
                [
                    teacherUserId,
                    classId,
                    academicYear
                ]
            );

        if (duplicateRows.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "This class teacher assignment already exists for the selected academic year.",
                assignment_id:
                    duplicateRows[0]
                        .assignment_id,
                status:
                    duplicateRows[0].status
            });
        }

        // ---------------------------------------------
        // OPTIONAL BUSINESS RULE
        //
        // One class should normally have only one
        // ACTIVE class teacher for an academic year.
        // ---------------------------------------------

        if (
            normalizedStatus === "ACTIVE"
        ) {
            const [
                activeClassRows
            ] =
                await connection.query(
                    `
                    SELECT
                        assignment_id,
                        teacher_user_id
                    FROM class_teacher_assignments
                    WHERE class_id = ?
                      AND academic_year = ?
                      AND status = 'ACTIVE'
                    LIMIT 1
                    `,
                    [
                        classId,
                        academicYear
                    ]
                );

            if (
                activeClassRows.length > 0
            ) {
                await connection.rollback();

                return res.status(409).json({
                    success: false,
                    message:
                        "This class already has an active class teacher for the selected academic year.",
                    assignment_id:
                        activeClassRows[0]
                            .assignment_id,
                    teacher_user_id:
                        activeClassRows[0]
                            .teacher_user_id
                });
            }
        }

        // ---------------------------------------------
        // INSERT
        // ---------------------------------------------

        const [
            result
        ] =
            await connection.query(
                `
                INSERT INTO
                    class_teacher_assignments
                (
                    teacher_user_id,
                    class_id,
                    academic_year,
                    semester,
                    status
                )
                VALUES
                (?, ?, ?, ?, ?)
                `,
                [
                    teacherUserId,
                    classId,
                    academicYear,
                    normalizedSemester,
                    normalizedStatus
                ]
            );

        await connection.commit();

        // ---------------------------------------------
        // GET CREATED RECORD
        // ---------------------------------------------

        const [
            createdRows
        ] =
            await db.query(
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

                    c.year,
                    c.section,

                    d.department_id,
                    d.department_name,
                    d.department_code

                FROM class_teacher_assignments cta

                LEFT JOIN staff s
                    ON s.user_id =
                        cta.teacher_user_id

                LEFT JOIN classes c
                    ON c.class_id =
                        cta.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                        c.department_id

                WHERE
                    cta.assignment_id = ?

                LIMIT 1
                `,
                [result.insertId]
            );

        return res.status(201).json({
            success: true,
            message:
                "Class teacher assigned successfully.",
            assignment:
                createdRows[0] || {
                    assignment_id:
                        result.insertId,
                    teacher_user_id:
                        teacherUserId,
                    class_id:
                        classId,
                    academic_year:
                        academicYear,
                    semester:
                        normalizedSemester,
                    status:
                        normalizedStatus
                }
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "ROLLBACK ERROR:",
                    rollbackError
                );
            }
        }

        console.error(
            "CREATE CLASS TEACHER ASSIGNMENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create class teacher assignment.",
            error: getErrorMessage(error)
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// =====================================================
// UPDATE CLASS TEACHER ASSIGNMENT
//
// PUT /api/class-teacher-assignments/:id
// =====================================================

const updateClassTeacherAssignment = async (
    req,
    res
) => {
    let connection;

    try {
        const assignmentId =
            Number(req.params.id);

        const {
            teacher_user_id,
            class_id,
            academic_year,
            semester,
            status
        } = req.body;

        const teacherUserId =
            Number(teacher_user_id);

        const classId =
            Number(class_id);

        const academicYear =
            String(
                academic_year || ""
            ).trim();

        const normalizedStatus =
            String(
                status || "ACTIVE"
            )
                .trim()
                .toUpperCase();

        let normalizedSemester =
            null;

        if (
            semester !== null &&
            semester !== undefined &&
            String(semester).trim() !== ""
        ) {
            normalizedSemester =
                String(semester).trim();
        }

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !Number.isInteger(
                assignmentId
            ) ||
            assignmentId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid assignment ID."
            });
        }

        if (
            !Number.isInteger(
                teacherUserId
            ) ||
            teacherUserId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid teacher_user_id is required."
            });
        }

        if (
            !Number.isInteger(classId) ||
            classId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid class_id is required."
            });
        }

        if (!academicYear) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic year is required."
            });
        }

        if (
            !["ACTIVE", "INACTIVE"].includes(
                normalizedStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be ACTIVE or INACTIVE."
            });
        }

        // ---------------------------------------------
        // CONNECTION
        // ---------------------------------------------

        connection =
            await db.getConnection();

        await connection.beginTransaction();

        // ---------------------------------------------
        // CHECK CURRENT ASSIGNMENT
        // ---------------------------------------------

        const [
            existingRows
        ] =
            await connection.query(
                `
                SELECT
                    assignment_id
                FROM class_teacher_assignments
                WHERE assignment_id = ?
                LIMIT 1
                `,
                [assignmentId]
            );

        if (existingRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Class teacher assignment not found."
            });
        }

        // ---------------------------------------------
        // CHECK STAFF
        // ---------------------------------------------

        const [staffRows] =
            await connection.query(
                `
                SELECT
                    staff_id,
                    user_id,
                    staff_code
                FROM staff
                WHERE user_id = ?
                LIMIT 1
                `,
                [teacherUserId]
            );

        if (staffRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Selected class teacher does not exist in staff records."
            });
        }

        // ---------------------------------------------
        // CHECK CLASS
        // ---------------------------------------------

        const [classRows] =
            await connection.query(
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
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Selected class does not exist."
            });
        }

        // ---------------------------------------------
        // DUPLICATE CHECK
        // ---------------------------------------------

        const [
            duplicateRows
        ] =
            await connection.query(
                `
                SELECT
                    assignment_id,
                    status
                FROM class_teacher_assignments
                WHERE teacher_user_id = ?
                  AND class_id = ?
                  AND academic_year = ?
                  AND assignment_id <> ?
                LIMIT 1
                `,
                [
                    teacherUserId,
                    classId,
                    academicYear,
                    assignmentId
                ]
            );

        if (duplicateRows.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "Another class teacher assignment with the same teacher, class and academic year already exists.",
                assignment_id:
                    duplicateRows[0]
                        .assignment_id
            });
        }

        // ---------------------------------------------
        // ONE ACTIVE TEACHER PER CLASS
        // ---------------------------------------------

        if (
            normalizedStatus === "ACTIVE"
        ) {
            const [
                activeClassRows
            ] =
                await connection.query(
                    `
                    SELECT
                        assignment_id,
                        teacher_user_id
                    FROM class_teacher_assignments
                    WHERE class_id = ?
                      AND academic_year = ?
                      AND status = 'ACTIVE'
                      AND assignment_id <> ?
                    LIMIT 1
                    `,
                    [
                        classId,
                        academicYear,
                        assignmentId
                    ]
                );

            if (
                activeClassRows.length > 0
            ) {
                await connection.rollback();

                return res.status(409).json({
                    success: false,
                    message:
                        "This class already has another active class teacher for the selected academic year.",
                    assignment_id:
                        activeClassRows[0]
                            .assignment_id,
                    teacher_user_id:
                        activeClassRows[0]
                            .teacher_user_id
                });
            }
        }

        // ---------------------------------------------
        // UPDATE
        // ---------------------------------------------

        await connection.query(
            `
            UPDATE
                class_teacher_assignments

            SET
                teacher_user_id = ?,
                class_id = ?,
                academic_year = ?,
                semester = ?,
                status = ?

            WHERE
                assignment_id = ?
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

        await connection.commit();

        // ---------------------------------------------
        // GET UPDATED RECORD
        // ---------------------------------------------

        const [
            updatedRows
        ] =
            await db.query(
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

                    c.year,
                    c.section,

                    d.department_id,
                    d.department_name,
                    d.department_code

                FROM class_teacher_assignments cta

                LEFT JOIN staff s
                    ON s.user_id =
                        cta.teacher_user_id

                LEFT JOIN classes c
                    ON c.class_id =
                        cta.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                        c.department_id

                WHERE
                    cta.assignment_id = ?

                LIMIT 1
                `,
                [assignmentId]
            );

        return res.status(200).json({
            success: true,
            message:
                "Class teacher assignment updated successfully.",
            assignment:
                updatedRows[0] || null
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "ROLLBACK ERROR:",
                    rollbackError
                );
            }
        }

        console.error(
            "UPDATE CLASS TEACHER ASSIGNMENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update class teacher assignment.",
            error: getErrorMessage(error)
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// =====================================================
// DELETE CLASS TEACHER ASSIGNMENT
//
// DELETE /api/class-teacher-assignments/:id
// =====================================================

const deleteClassTeacherAssignment = async (
    req,
    res
) => {
    try {
        const assignmentId =
            Number(req.params.id);

        if (
            !Number.isInteger(
                assignmentId
            ) ||
            assignmentId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid assignment ID."
            });
        }

        const [
            existingRows
        ] =
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

        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Class teacher assignment not found."
            });
        }

        await db.query(
            `
            DELETE FROM
                class_teacher_assignments
            WHERE
                assignment_id = ?
            `,
            [assignmentId]
        );

        return res.status(200).json({
            success: true,
            message:
                "Class teacher assignment deleted successfully.",
            assignment_id:
                assignmentId
        });
    } catch (error) {
        console.error(
            "DELETE CLASS TEACHER ASSIGNMENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete class teacher assignment.",
            error: getErrorMessage(error)
        });
    }
};

// =====================================================
// GET ASSIGNMENTS BY CLASS
//
// GET /api/class-teacher-assignments/class/:classId
// =====================================================

const getAssignmentsByClass = async (
    req,
    res
) => {
    try {
        const classId =
            Number(req.params.classId);

        if (
            !Number.isInteger(classId) ||
            classId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid class ID."
            });
        }

        const [rows] =
            await db.query(
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

                    c.year,
                    c.section,

                    d.department_id,
                    d.department_name,
                    d.department_code

                FROM class_teacher_assignments cta

                LEFT JOIN staff s
                    ON s.user_id =
                        cta.teacher_user_id

                LEFT JOIN classes c
                    ON c.class_id =
                        cta.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                        c.department_id

                WHERE
                    cta.class_id = ?

                ORDER BY
                    cta.assignment_id DESC
                `,
                [classId]
            );

        return res.status(200).json({
            success: true,
            assignments: rows
        });
    } catch (error) {
        console.error(
            "GET CLASS ASSIGNMENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load class assignments.",
            error: getErrorMessage(error)
        });
    }
};

// =====================================================
// GET ASSIGNMENTS BY TEACHER
//
// GET /api/class-teacher-assignments/teacher/:userId
// =====================================================

const getAssignmentsByTeacher = async (
    req,
    res
) => {
    try {
        const userId =
            Number(req.params.userId);

        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid teacher user ID."
            });
        }

        const [rows] =
            await db.query(
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

                    c.year,
                    c.section,

                    d.department_id,
                    d.department_name,
                    d.department_code

                FROM class_teacher_assignments cta

                LEFT JOIN staff s
                    ON s.user_id =
                        cta.teacher_user_id

                LEFT JOIN classes c
                    ON c.class_id =
                        cta.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                        c.department_id

                WHERE
                    cta.teacher_user_id = ?

                ORDER BY
                    cta.assignment_id DESC
                `,
                [userId]
            );

        return res.status(200).json({
            success: true,
            assignments: rows
        });
    } catch (error) {
        console.error(
            "GET TEACHER ASSIGNMENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load teacher assignments.",
            error: getErrorMessage(error)
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getClassTeacherAssignments,
    getClassTeacherAssignmentById,
    createClassTeacherAssignment,
    updateClassTeacherAssignment,
    deleteClassTeacherAssignment,
    getAssignmentsByClass,
    getAssignmentsByTeacher
};