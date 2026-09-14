const db = require("../config/db");

// =====================================================
// ATTENDANCE CONTROLLER
// =====================================================
//
// DATABASE RELATIONSHIP
//
// users
//   ↓ user_id
// staff
//   ↓ staff_id
// staff_subjects
//   ├── subject_id
//   └── class_id
//
// subject_allocations
//   ├── subject_id
//   ├── staff_id
//   └── class_id
//
// classes
//   ├── class_id
//   ├── department_id
//   ├── year
//   └── section
//
// departments
//   ├── department_id
//   ├── department_name
//   └── department_code
//
// students
//   ├── department
//   ├── year
//   └── section
//
// attendance_sessions
//   ├── subject_id
//   ├── staff_id
//   └── class_id
//
// attendance
//   ├── session_id
//   └── student_id
//
// =====================================================


// =====================================================
// HELPER: GET LOGGED-IN STAFF ID
// =====================================================

const getLoggedInStaffId = async (req) => {
    const user = req.user || {};

    // If middleware already provides staff_id
    if (
        user.staff_id !== undefined &&
        user.staff_id !== null
    ) {
        return Number(user.staff_id);
    }

    // Most common JWT structure
    const userId =
        user.user_id ??
        user.id ??
        user.userId;

    if (
        userId === undefined ||
        userId === null
    ) {
        return null;
    }

    const [rows] = await db.query(
        `
        SELECT
            staff_id,
            user_id,
            staff_code,
            name,
            email,
            department,
            role
        FROM staff
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    if (rows.length === 0) {
        return null;
    }

    return Number(rows[0].staff_id);
};


// =====================================================
// HELPER: GET STAFF DETAILS
// =====================================================

const getStaffByRequest = async (req) => {
    const user = req.user || {};

    if (
        user.staff_id !== undefined &&
        user.staff_id !== null
    ) {
        const [rows] = await db.query(
            `
            SELECT
                staff_id,
                user_id,
                staff_code,
                name,
                email,
                department,
                role
            FROM staff
            WHERE staff_id = ?
            LIMIT 1
            `,
            [user.staff_id]
        );

        return rows.length > 0
            ? rows[0]
            : null;
    }

    const userId =
        user.user_id ??
        user.id ??
        user.userId;

    if (
        userId === undefined ||
        userId === null
    ) {
        return null;
    }

    const [rows] = await db.query(
        `
        SELECT
            staff_id,
            user_id,
            staff_code,
            name,
            email,
            department,
            role
        FROM staff
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    return rows.length > 0
        ? rows[0]
        : null;
};


// =====================================================
// HELPER: CHECK STAFF ALLOCATION
// =====================================================
//
// Checks both:
//
// 1. staff_subjects
// 2. subject_allocations
//
// This supports existing data regardless of which
// allocation table was used.
//
// =====================================================

const checkStaffSubjectClassAllocation = async (
    staffId,
    subjectId,
    classId
) => {
    if (
        !staffId ||
        !subjectId ||
        !classId
    ) {
        return null;
    }

    // -------------------------------------------------
    // staff_subjects
    // -------------------------------------------------

    const [staffSubjectRows] =
        await db.query(
            `
            SELECT
                staff_subject_id,
                staff_id,
                subject_id,
                class_id
            FROM staff_subjects
            WHERE staff_id = ?
              AND subject_id = ?
              AND class_id = ?
            LIMIT 1
            `,
            [
                staffId,
                subjectId,
                classId
            ]
        );

    if (
        staffSubjectRows.length > 0
    ) {
        return {
            source: "staff_subjects",
            allocation:
                staffSubjectRows[0]
        };
    }

    // -------------------------------------------------
    // subject_allocations
    // -------------------------------------------------

    const [allocationRows] =
        await db.query(
            `
            SELECT
                allocation_id,
                staff_id,
                subject_id,
                class_id,
                academic_year,
                department,
                year,
                semester
            FROM subject_allocations
            WHERE staff_id = ?
              AND subject_id = ?
              AND class_id = ?
            ORDER BY allocation_id DESC
            LIMIT 1
            `,
            [
                staffId,
                subjectId,
                classId
            ]
        );

    if (
        allocationRows.length > 0
    ) {
        return {
            source:
                "subject_allocations",
            allocation:
                allocationRows[0]
        };
    }

    return null;
};


// =====================================================
// HELPER: GET SESSION CLASS / ALLOCATION
// =====================================================

const getSessionAllocation = async (
    sessionId
) => {
    const [rows] = await db.query(
        `
        SELECT
            ats.session_id,
            ats.subject_id,
            ats.staff_id,
            ats.class_id AS session_class_id,
            ats.academic_year AS session_academic_year,
            ats.session_date,
            ats.start_time,
            ats.end_time,
            ats.qr_token,
            ats.qr_expires_at,

            UNIX_TIMESTAMP(
                ats.qr_expires_at
            ) * 1000 AS qr_expires_at_ms,

            ats.status AS session_status,

            s.subject_code,
            s.subject_name,
            s.department AS subject_department,

            sa.allocation_id,
            sa.class_id,
            sa.academic_year,
            sa.department AS allocation_department,
            sa.year AS allocation_year,
            sa.semester,

            c.year AS class_year,
            c.section AS class_section,
            c.department_id AS class_department_id,

            d.department_name,
            d.department_code

        FROM attendance_sessions ats

        LEFT JOIN subjects s
            ON s.subject_id =
               ats.subject_id

        LEFT JOIN subject_allocations sa
            ON sa.subject_id =
               ats.subject_id

           AND sa.staff_id =
               ats.staff_id

           AND (
                sa.class_id =
                ats.class_id

                OR (
                    sa.class_id IS NULL
                    AND ats.class_id IS NULL
                )
           )

           AND (
                ats.academic_year IS NULL

                OR sa.academic_year =
                   ats.academic_year

                OR sa.academic_year IS NULL
           )

        LEFT JOIN classes c
            ON c.class_id =
               ats.class_id

        LEFT JOIN departments d
            ON d.department_id =
               c.department_id

        WHERE ats.session_id = ?

        ORDER BY
            CASE
                WHEN sa.class_id =
                     ats.class_id
                THEN 0
                ELSE 1
            END,

            sa.allocation_id DESC

        LIMIT 1
        `,
        [sessionId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
};


// =====================================================
// HELPER: VALIDATE STUDENT FOR SESSION
// =====================================================

const validateStudentForSession = async (
    sessionId,
    studentId
) => {
    const allocation =
        await getSessionAllocation(
            sessionId
        );

    if (!allocation) {
        return {
            valid: false,
            status: 404,
            message:
                "Attendance session or class allocation not found"
        };
    }

    const classId =
        allocation.session_class_id ||
        allocation.class_id;

    if (!classId) {
        return {
            valid: false,
            status: 400,
            message:
                "This attendance session is not linked to a class"
        };
    }

    const [students] =
        await db.query(
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
            [studentId]
        );

    if (students.length === 0) {
        return {
            valid: false,
            status: 404,
            message:
                "Student not found"
        };
    }

    const student =
        students[0];

    const expectedDepartment =
        allocation.department_name ||
        allocation.allocation_department ||
        allocation.subject_department ||
        null;

    const expectedYear =
        allocation.class_year ??
        allocation.allocation_year ??
        null;

    const expectedSection =
        allocation.class_section ??
        null;

    const studentDepartment =
        String(
            student.department ?? ""
        )
            .trim()
            .toLowerCase();

    const expectedDepartmentNormalized =
        String(
            expectedDepartment ?? ""
        )
            .trim()
            .toLowerCase();

    const studentYear =
        student.year === null ||
        student.year === undefined
            ? null
            : Number(student.year);

    const expectedYearNumber =
        expectedYear === null ||
        expectedYear === undefined
            ? null
            : Number(expectedYear);

    const studentSection =
        String(
            student.section ?? ""
        )
            .trim()
            .toLowerCase();

    const expectedSectionNormalized =
        String(
            expectedSection ?? ""
        )
            .trim()
            .toLowerCase();

    // -------------------------------------------------
    // DEPARTMENT
    // -------------------------------------------------

    if (
        expectedDepartmentNormalized &&
        studentDepartment !==
            expectedDepartmentNormalized
    ) {
        return {
            valid: false,
            status: 403,
            message:
                "Student does not belong to the allocated department",
            student,
            allocation
        };
    }

    // -------------------------------------------------
    // YEAR
    // -------------------------------------------------

    if (
        expectedYearNumber !== null &&
        (
            studentYear === null ||
            studentYear !==
                expectedYearNumber
        )
    ) {
        return {
            valid: false,
            status: 403,
            message:
                "Student does not belong to the allocated class year",
            student,
            allocation
        };
    }

    // -------------------------------------------------
    // SECTION
    // -------------------------------------------------

    if (
        expectedSectionNormalized &&
        studentSection !==
            expectedSectionNormalized
    ) {
        return {
            valid: false,
            status: 403,
            message:
                "Student does not belong to the allocated class section",
            student,
            allocation
        };
    }

    return {
        valid: true,
        student,
        allocation
    };
};


// =====================================================
// GET MY SUBJECT + CLASS ALLOCATIONS
// GET /api/attendance/my-subject-classes
// =====================================================

const getMySubjectClasses = async (
    req,
    res
) => {
    try {
        const staffId =
            await getLoggedInStaffId(
                req
            );

        if (!staffId) {
            return res.status(403).json({
                success: false,
                message:
                    "Staff account not found for the logged-in user"
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT DISTINCT

                    ss.subject_id,
                    ss.class_id,

                    s.subject_code,
                    s.subject_name,

                    c.department_id,
                    c.year,
                    c.section,

                    d.department_name,
                    d.department_code,

                    'staff_subjects'
                        AS allocation_source

                FROM staff_subjects ss

                INNER JOIN subjects s
                    ON s.subject_id =
                       ss.subject_id

                INNER JOIN classes c
                    ON c.class_id =
                       ss.class_id

                INNER JOIN departments d
                    ON d.department_id =
                       c.department_id

                WHERE ss.staff_id = ?

                UNION

                SELECT DISTINCT

                    sa.subject_id,
                    sa.class_id,

                    s.subject_code,
                    s.subject_name,

                    c.department_id,
                    c.year,
                    c.section,

                    d.department_name,
                    d.department_code,

                    'subject_allocations'
                        AS allocation_source

                FROM subject_allocations sa

                INNER JOIN subjects s
                    ON s.subject_id =
                       sa.subject_id

                INNER JOIN classes c
                    ON c.class_id =
                       sa.class_id

                INNER JOIN departments d
                    ON d.department_id =
                       c.department_id

                WHERE sa.staff_id = ?
                  AND sa.class_id IS NOT NULL

                ORDER BY
                    department_name ASC,
                    year ASC,
                    section ASC,
                    subject_name ASC
                `,
                [
                    staffId,
                    staffId
                ]
            );

        return res.status(200).json({
            success: true,
            staff_id: staffId,
            count: rows.length,
            allocations: rows
        });

    } catch (error) {
        console.error(
            "Get My Subject Classes Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch assigned subjects and classes",
            error: error.message
        });
    }
};


// =====================================================
// GET STUDENTS FOR MY ASSIGNED SUBJECT + CLASS
//
// GET
// /api/attendance/my-subject-students
//
// Query:
// ?subject_id=1&class_id=5
//
// =====================================================

const getMySubjectStudents = async (
    req,
    res
) => {
    try {
        const {
            subject_id,
            class_id
        } = req.query;

        if (
            !subject_id ||
            !class_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "subject_id and class_id are required"
            });
        }

        const staffId =
            await getLoggedInStaffId(
                req
            );

        if (!staffId) {
            return res.status(403).json({
                success: false,
                message:
                    "Staff account not found for the logged-in user"
            });
        }

        // -------------------------------------------------
        // VERIFY STAFF ALLOCATION
        // -------------------------------------------------

        const allocation =
            await checkStaffSubjectClassAllocation(
                staffId,
                Number(subject_id),
                Number(class_id)
            );

        if (!allocation) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not assigned to this subject and class"
            });
        }

        // -------------------------------------------------
        // GET CLASS
        // -------------------------------------------------

        const [classes] =
            await db.query(
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
                    ON d.department_id =
                       c.department_id

                WHERE c.class_id = ?

                LIMIT 1
                `,
                [class_id]
            );

        if (classes.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Class not found"
            });
        }

        const selectedClass =
            classes[0];

        // -------------------------------------------------
        // GET EXACT CLASS STUDENTS
        // -------------------------------------------------

        const [students] =
            await db.query(
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
                    ON LOWER(
                        TRIM(st.department)
                    ) =
                    LOWER(
                        TRIM(d.department_name)
                    )

                INNER JOIN classes c
                    ON c.department_id =
                       d.department_id

                   AND c.year =
                       st.year

                   AND LOWER(
                        TRIM(c.section)
                   ) =
                       LOWER(
                        TRIM(st.section)
                   )

                WHERE c.class_id = ?

                ORDER BY
                    st.name ASC
                `,
                [class_id]
            );

        return res.status(200).json({
            success: true,

            staff_id:
                staffId,

            subject_id:
                Number(subject_id),

            class_id:
                Number(class_id),

            subject_allocation:
                allocation,

            class: selectedClass,

            count:
                students.length,

            students
        });

    } catch (error) {
        console.error(
            "Get My Subject Students Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch assigned class students",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL ATTENDANCE
// GET /api/attendance
// =====================================================

const getAttendance = async (
    req,
    res
) => {
    try {
        const [rows] =
            await db.query(
                `
                SELECT

                    a.attendance_id,
                    a.session_id,
                    a.student_id,
                    a.scanned_at,
                    a.status,

                    st.register_number,
                    st.name AS student_name,
                    st.email AS student_email,
                    st.department,
                    st.year,
                    st.section,

                    ats.session_date,
                    ats.start_time,
                    ats.end_time,
                    ats.status AS session_status,
                    ats.class_id AS session_class_id,
                    ats.academic_year AS session_academic_year,

                    s.subject_id,
                    s.subject_code,
                    s.subject_name,

                    staff.staff_id,
                    staff.staff_code,
                    staff.name AS staff_name,

                    sa.allocation_id,
                    sa.class_id,
                    sa.academic_year,
                    sa.department
                        AS allocation_department,
                    sa.year AS allocation_year,
                    sa.semester,

                    c.year AS class_year,
                    c.section AS class_section,
                    c.department_id
                        AS class_department_id,

                    d.department_name,
                    d.department_code

                FROM attendance a

                LEFT JOIN students st
                    ON st.student_id =
                       a.student_id

                LEFT JOIN attendance_sessions ats
                    ON ats.session_id =
                       a.session_id

                LEFT JOIN subjects s
                    ON s.subject_id =
                       ats.subject_id

                LEFT JOIN staff
                    ON staff.staff_id =
                       ats.staff_id

                LEFT JOIN subject_allocations sa
                    ON sa.subject_id =
                       ats.subject_id

                   AND sa.staff_id =
                       ats.staff_id

                   AND (
                        sa.class_id =
                        ats.class_id

                        OR (
                            sa.class_id IS NULL
                            AND ats.class_id IS NULL
                        )
                   )

                LEFT JOIN classes c
                    ON c.class_id =
                       ats.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                       c.department_id

                ORDER BY

                    ats.session_date DESC,
                    ats.start_time DESC,
                    a.scanned_at DESC,
                    a.attendance_id DESC
                `
            );

        return res.status(200).json({
            success: true,
            count: rows.length,
            attendance: rows
        });

    } catch (error) {
        console.error(
            "Get Attendance Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch attendance",
            error: error.message
        });
    }
};


// =====================================================
// GET ATTENDANCE BY ID
// GET /api/attendance/:id
// =====================================================

const getAttendanceById = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (
            !id ||
            isNaN(Number(id))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid attendance ID is required"
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT

                    a.attendance_id,
                    a.session_id,
                    a.student_id,
                    a.scanned_at,
                    a.status,

                    st.register_number,
                    st.name AS student_name,
                    st.email AS student_email,
                    st.department,
                    st.year,
                    st.section,

                    ats.session_date,
                    ats.start_time,
                    ats.end_time,
                    ats.status AS session_status,
                    ats.class_id AS session_class_id,
                    ats.academic_year AS session_academic_year,

                    s.subject_id,
                    s.subject_code,
                    s.subject_name,

                    staff.staff_id,
                    staff.staff_code,
                    staff.name AS staff_name,

                    c.year AS class_year,
                    c.section AS class_section,
                    c.department_id
                        AS class_department_id,

                    d.department_name,
                    d.department_code

                FROM attendance a

                LEFT JOIN students st
                    ON st.student_id =
                       a.student_id

                LEFT JOIN attendance_sessions ats
                    ON ats.session_id =
                       a.session_id

                LEFT JOIN subjects s
                    ON s.subject_id =
                       ats.subject_id

                LEFT JOIN staff
                    ON staff.staff_id =
                       ats.staff_id

                LEFT JOIN classes c
                    ON c.class_id =
                       ats.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                       c.department_id

                WHERE a.attendance_id = ?

                LIMIT 1
                `,
                [id]
            );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance record not found"
            });
        }

        return res.status(200).json({
            success: true,
            attendance: rows[0]
        });

    } catch (error) {
        console.error(
            "Get Attendance By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch attendance record",
            error: error.message
        });
    }
};


// =====================================================
// GET ATTENDANCE BY SESSION
// GET /api/attendance/session/:sessionId
// =====================================================

const getAttendanceBySession = async (
    req,
    res
) => {
    try {
        const {
            sessionId
        } = req.params;

        if (
            !sessionId ||
            isNaN(Number(sessionId))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid session ID is required"
            });
        }

        const numericSessionId =
            Number(sessionId);

        const allocation =
            await getSessionAllocation(
                numericSessionId
            );

        if (!allocation) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found"
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT

                    a.attendance_id,
                    a.session_id,
                    a.student_id,
                    a.scanned_at,
                    a.status,

                    st.register_number,
                    st.name AS student_name,
                    st.email AS student_email,
                    st.department,
                    st.year,
                    st.section

                FROM attendance a

                LEFT JOIN students st
                    ON st.student_id =
                       a.student_id

                WHERE a.session_id = ?

                ORDER BY
                    a.scanned_at ASC,
                    st.name ASC
                `,
                [numericSessionId]
            );

        const [summary] =
            await db.query(
                `
                SELECT

                    COUNT(*) AS total_attendance,

                    SUM(
                        CASE
                            WHEN status =
                                 'PRESENT'
                            THEN 1
                            ELSE 0
                        END
                    ) AS present_count,

                    SUM(
                        CASE
                            WHEN status =
                                 'LATE'
                            THEN 1
                            ELSE 0
                        END
                    ) AS late_count

                FROM attendance

                WHERE session_id = ?
                `,
                [numericSessionId]
            );

        let classStudentCount = 0;

        const sessionClassId =
            allocation.session_class_id ||
            allocation.class_id;

        if (sessionClassId) {
            const [classStudents] =
                await db.query(
                    `
                    SELECT
                        COUNT(*) AS total_students

                    FROM students st

                    INNER JOIN classes c
                        ON c.class_id = ?

                    INNER JOIN departments d
                        ON d.department_id =
                           c.department_id

                    WHERE st.year = c.year

                      AND LOWER(
                            TRIM(st.section)
                          ) =
                          LOWER(
                            TRIM(c.section)
                          )

                      AND LOWER(
                            TRIM(st.department)
                          ) =
                          LOWER(
                            TRIM(
                                d.department_name
                            )
                          )
                    `,
                    [sessionClassId]
                );

            classStudentCount =
                Number(
                    classStudents[0]
                        ?.total_students || 0
                );
        }

        const attendanceSummary =
            summary[0] || {};

        const presentCount =
            Number(
                attendanceSummary.present_count ||
                0
            );

        const lateCount =
            Number(
                attendanceSummary.late_count ||
                0
            );

        const totalAttendance =
            Number(
                attendanceSummary.total_attendance ||
                0
            );

        const absentCount =
            Math.max(
                classStudentCount -
                    totalAttendance,
                0
            );

        return res.status(200).json({
            success: true,

            session_id:
                numericSessionId,

            subject_id:
                allocation.subject_id,

            subject_code:
                allocation.subject_code,

            subject_name:
                allocation.subject_name,

            staff_id:
                allocation.staff_id,

            class_id:
                sessionClassId,

            class_year:
                allocation.class_year,

            class_section:
                allocation.class_section,

            department:
                allocation.department_name ||
                allocation.allocation_department ||
                allocation.subject_department ||
                null,

            department_code:
                allocation.department_code ||
                null,

            academic_year:
                allocation.session_academic_year ||
                allocation.academic_year ||
                null,

            semester:
                allocation.semester,

            total_students:
                classStudentCount,

            count:
                rows.length,

            attendance:
                rows,

            summary: {
                total_attendance:
                    totalAttendance,

                present_count:
                    presentCount,

                late_count:
                    lateCount,

                absent_count:
                    absentCount,

                total_students:
                    classStudentCount
            }
        });

    } catch (error) {
        console.error(
            "Get Attendance By Session Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch session attendance",
            error: error.message
        });
    }
};


// =====================================================
// GET ATTENDANCE BY STUDENT
// GET /api/attendance/student/:studentId
// =====================================================

const getAttendanceByStudent = async (
    req,
    res
) => {
    try {
        const {
            studentId
        } = req.params;

        if (
            !studentId ||
            isNaN(Number(studentId))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid student ID is required"
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT

                    a.attendance_id,
                    a.session_id,
                    a.student_id,
                    a.scanned_at,
                    a.status,

                    ats.session_date,
                    ats.start_time,
                    ats.end_time,
                    ats.class_id
                        AS session_class_id,
                    ats.academic_year
                        AS session_academic_year,

                    s.subject_id,
                    s.subject_code,
                    s.subject_name,

                    staff.staff_id,
                    staff.staff_code,
                    staff.name AS staff_name,

                    sa.allocation_id,
                    sa.class_id,
                    sa.academic_year,
                    sa.department
                        AS allocation_department,
                    sa.year AS allocation_year,
                    sa.semester,

                    c.year AS class_year,
                    c.section AS class_section,
                    c.department_id
                        AS class_department_id,

                    d.department_name,
                    d.department_code

                FROM attendance a

                LEFT JOIN attendance_sessions ats
                    ON ats.session_id =
                       a.session_id

                LEFT JOIN subjects s
                    ON s.subject_id =
                       ats.subject_id

                LEFT JOIN staff
                    ON staff.staff_id =
                       ats.staff_id

                LEFT JOIN subject_allocations sa
                    ON sa.subject_id =
                       ats.subject_id

                   AND sa.staff_id =
                       ats.staff_id

                   AND (
                        sa.class_id =
                        ats.class_id

                        OR (
                            sa.class_id IS NULL
                            AND ats.class_id IS NULL
                        )
                   )

                LEFT JOIN classes c
                    ON c.class_id =
                       ats.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                       c.department_id

                WHERE a.student_id = ?

                ORDER BY

                    ats.session_date DESC,
                    ats.start_time DESC,
                    a.scanned_at DESC
                `,
                [studentId]
            );

        return res.status(200).json({
            success: true,
            student_id:
                Number(studentId),
            count:
                rows.length,
            attendance:
                rows
        });

    } catch (error) {
        console.error(
            "Get Attendance By Student Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch student attendance",
            error: error.message
        });
    }
};


// =====================================================
// HELPER: VALIDATE STAFF OWNS SESSION
// =====================================================

const validateStaffForSession = async (
    req,
    session
) => {
    const role =
        String(
            req.user?.role || ""
        ).toUpperCase();

    // ADMIN can manage any session
    if (role === "ADMIN") {
        return {
            valid: true
        };
    }

    const staffId =
        await getLoggedInStaffId(
            req
        );

    if (!staffId) {
        return {
            valid: false,
            status: 403,
            message:
                "Staff account not found for the logged-in user"
        };
    }

    if (
        Number(session.staff_id) !==
        Number(staffId)
    ) {
        return {
            valid: false,
            status: 403,
            message:
                "You are not authorized to manage attendance for this session"
        };
    }

    const allocation =
        await checkStaffSubjectClassAllocation(
            staffId,
            Number(session.subject_id),
            Number(session.class_id)
        );

    if (!allocation) {
        return {
            valid: false,
            status: 403,
            message:
                "You are not assigned to this subject and class"
        };
    }

    return {
        valid: true,
        staffId,
        allocation
    };
};


// =====================================================
// MARK ATTENDANCE MANUALLY
// POST /api/attendance
// =====================================================

const markAttendance = async (
    req,
    res
) => {
    try {
        const {
            session_id,
            student_id,
            status
        } = req.body;

        if (
            !session_id ||
            !student_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "session_id and student_id are required"
            });
        }

        const attendanceStatus =
            String(
                status || "PRESENT"
            ).toUpperCase();

        if (
            ![
                "PRESENT",
                "LATE"
            ].includes(
                attendanceStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be PRESENT or LATE"
            });
        }

        const [sessions] =
            await db.query(
                `
                SELECT
                    session_id,
                    subject_id,
                    staff_id,
                    class_id,
                    academic_year,
                    status,
                    session_date,
                    start_time,
                    end_time

                FROM attendance_sessions

                WHERE session_id = ?

                LIMIT 1
                `,
                [session_id]
            );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found"
            });
        }

        const session =
            sessions[0];

        // -------------------------------------------------
        // STAFF AUTHORIZATION
        // -------------------------------------------------

        const staffValidation =
            await validateStaffForSession(
                req,
                session
            );

        if (!staffValidation.valid) {
            return res.status(
                staffValidation.status
            ).json({
                success: false,
                message:
                    staffValidation.message
            });
        }

        if (
            String(
                session.status
            ).toUpperCase() !==
            "ACTIVE"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance session is closed"
            });
        }

        if (!session.class_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance session is not linked to a class"
            });
        }

        const validation =
            await validateStudentForSession(
                Number(session_id),
                Number(student_id)
            );

        if (!validation.valid) {
            return res.status(
                validation.status
            ).json({
                success: false,
                message:
                    validation.message
            });
        }

        const [existing] =
            await db.query(
                `
                SELECT
                    attendance_id,
                    status,
                    scanned_at

                FROM attendance

                WHERE session_id = ?
                  AND student_id = ?

                LIMIT 1
                `,
                [
                    session_id,
                    student_id
                ]
            );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance already marked for this student",
                attendance:
                    existing[0]
            });
        }

        const [result] =
            await db.query(
                `
                INSERT INTO attendance
                (
                    session_id,
                    student_id,
                    status
                )

                VALUES (?, ?, ?)
                `,
                [
                    session_id,
                    student_id,
                    attendanceStatus
                ]
            );

        const [created] =
            await db.query(
                `
                SELECT

                    a.attendance_id,
                    a.session_id,
                    a.student_id,
                    a.scanned_at,
                    a.status,

                    st.register_number,
                    st.name AS student_name,
                    st.email AS student_email,
                    st.department,
                    st.year,
                    st.section,

                    ats.class_id,
                    ats.academic_year,

                    s.subject_code,
                    s.subject_name,

                    c.year AS class_year,
                    c.section AS class_section,

                    d.department_name,
                    d.department_code

                FROM attendance a

                LEFT JOIN students st
                    ON st.student_id =
                       a.student_id

                LEFT JOIN attendance_sessions ats
                    ON ats.session_id =
                       a.session_id

                LEFT JOIN subjects s
                    ON s.subject_id =
                       ats.subject_id

                LEFT JOIN classes c
                    ON c.class_id =
                       ats.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                       c.department_id

                WHERE a.attendance_id = ?

                LIMIT 1
                `,
                [result.insertId]
            );

        return res.status(201).json({
            success: true,
            message:
                "Attendance marked successfully",
            attendance:
                created[0]
        });

    } catch (error) {
        console.error(
            "Mark Attendance Error:",
            error
        );

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance already exists for this student and session"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to mark attendance",
            error: error.message
        });
    }
};


// =====================================================
// MARK ATTENDANCE USING QR TOKEN
// POST /api/attendance/scan
// =====================================================

const scanAttendance = async (
    req,
    res
) => {
    try {
        const {
            qr_token,
            student_id
        } = req.body;

        if (
            !qr_token ||
            !student_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "qr_token and student_id are required"
            });
        }

        const [sessions] =
            await db.query(
                `
                SELECT

                    session_id,
                    subject_id,
                    staff_id,
                    class_id,
                    academic_year,
                    session_date,
                    start_time,
                    end_time,
                    qr_token,
                    qr_expires_at,

                    UNIX_TIMESTAMP(
                        qr_expires_at
                    ) * 1000
                        AS qr_expires_at_ms,

                    status

                FROM attendance_sessions

                WHERE qr_token = ?

                  AND status =
                      'ACTIVE'

                LIMIT 1
                `,
                [qr_token]
            );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Invalid or inactive QR code"
            });
        }

        const session =
            sessions[0];

        if (!session.class_id) {
            return res.status(400).json({
                success: false,
                message:
                    "This attendance session is not linked to a class"
            });
        }

        // -------------------------------------------------
        // TIMEZONE-SAFE EXPIRY
        // -------------------------------------------------

        if (
            session.qr_expires_at_ms &&
            Number(
                session.qr_expires_at_ms
            ) < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "QR code has expired"
            });
        }

        const validation =
            await validateStudentForSession(
                Number(session.session_id),
                Number(student_id)
            );

        if (!validation.valid) {
            return res.status(
                validation.status
            ).json({
                success: false,
                message:
                    validation.message
            });
        }

        const student =
            validation.student;

        const allocation =
            validation.allocation;

        const [existing] =
            await db.query(
                `
                SELECT
                    attendance_id,
                    scanned_at,
                    status

                FROM attendance

                WHERE session_id = ?
                  AND student_id = ?

                LIMIT 1
                `,
                [
                    session.session_id,
                    student_id
                ]
            );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance already marked",
                attendance:
                    existing[0]
            });
        }

        // -------------------------------------------------
        // PRESENT / LATE
        // -------------------------------------------------

        let attendanceStatus =
            "PRESENT";

        const now =
            new Date();

        const startTime =
            String(
                session.start_time || ""
            ).substring(0, 8);

        if (startTime) {
            const [
                hours,
                minutes,
                seconds
            ] =
                startTime
                    .split(":")
                    .map(Number);

            const sessionStart =
                new Date(now);

            sessionStart.setHours(
                hours || 0,
                minutes || 0,
                seconds || 0,
                0
            );

            if (
                now >
                sessionStart
            ) {
                attendanceStatus =
                    "LATE";
            }
        }

        const [result] =
            await db.query(
                `
                INSERT INTO attendance
                (
                    session_id,
                    student_id,
                    status
                )

                VALUES (?, ?, ?)
                `,
                [
                    session.session_id,
                    student_id,
                    attendanceStatus
                ]
            );

        const [created] =
            await db.query(
                `
                SELECT

                    a.attendance_id,
                    a.session_id,
                    a.student_id,
                    a.scanned_at,
                    a.status,

                    st.register_number,
                    st.name AS student_name,
                    st.email AS student_email,
                    st.department,
                    st.year,
                    st.section,

                    ats.class_id,
                    ats.academic_year,

                    s.subject_code,
                    s.subject_name,

                    c.year AS class_year,
                    c.section AS class_section,

                    d.department_name,
                    d.department_code

                FROM attendance a

                LEFT JOIN students st
                    ON st.student_id =
                       a.student_id

                LEFT JOIN attendance_sessions ats
                    ON ats.session_id =
                       a.session_id

                LEFT JOIN subjects s
                    ON s.subject_id =
                       ats.subject_id

                LEFT JOIN classes c
                    ON c.class_id =
                       ats.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                       c.department_id

                WHERE a.attendance_id = ?

                LIMIT 1
                `,
                [result.insertId]
            );

        return res.status(201).json({
            success: true,

            message:
                attendanceStatus ===
                "LATE"
                    ? "Attendance marked as late"
                    : "Attendance marked successfully",

            student_id:
                Number(
                    student.student_id
                ),

            student_name:
                student.name,

            class_id:
                session.class_id,

            class_year:
                allocation.class_year,

            class_section:
                allocation.class_section,

            department:
                allocation.department_name ||
                allocation.allocation_department ||
                allocation.subject_department ||
                null,

            academic_year:
                session.academic_year ||
                allocation.academic_year ||
                null,

            semester:
                allocation.semester,

            attendance:
                created[0]
        });

    } catch (error) {
        console.error(
            "Scan Attendance Error:",
            error
        );

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance already marked"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to process QR attendance",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE ATTENDANCE
// PUT /api/attendance/:id
// =====================================================

const updateAttendance = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (
            !id ||
            isNaN(Number(id))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid attendance ID is required"
            });
        }

        const [existing] =
            await db.query(
                `
                SELECT *
                FROM attendance
                WHERE attendance_id = ?
                LIMIT 1
                `,
                [id]
            );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance record not found"
            });
        }

        const current =
            existing[0];

        const {
            session_id,
            student_id,
            status
        } = req.body;

        const updatedSessionId =
            session_id ??
            current.session_id;

        const updatedStudentId =
            student_id ??
            current.student_id;

        const updatedStatus =
            String(
                status ??
                current.status
            ).toUpperCase();

        if (
            ![
                "PRESENT",
                "LATE"
            ].includes(
                updatedStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be PRESENT or LATE"
            });
        }

        const [sessions] =
            await db.query(
                `
                SELECT

                    session_id,
                    subject_id,
                    staff_id,
                    class_id,
                    academic_year,
                    status

                FROM attendance_sessions

                WHERE session_id = ?

                LIMIT 1
                `,
                [updatedSessionId]
            );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found"
            });
        }

        const session =
            sessions[0];

        // -------------------------------------------------
        // STAFF AUTHORIZATION
        // -------------------------------------------------

        const staffValidation =
            await validateStaffForSession(
                req,
                session
            );

        if (!staffValidation.valid) {
            return res.status(
                staffValidation.status
            ).json({
                success: false,
                message:
                    staffValidation.message
            });
        }

        if (!session.class_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance session is not linked to a class"
            });
        }

        const validation =
            await validateStudentForSession(
                Number(updatedSessionId),
                Number(updatedStudentId)
            );

        if (!validation.valid) {
            return res.status(
                validation.status
            ).json({
                success: false,
                message:
                    validation.message
            });
        }

        const [duplicate] =
            await db.query(
                `
                SELECT
                    attendance_id

                FROM attendance

                WHERE session_id = ?
                  AND student_id = ?
                  AND attendance_id <> ?

                LIMIT 1
                `,
                [
                    updatedSessionId,
                    updatedStudentId,
                    id
                ]
            );

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance already exists for this student and session"
            });
        }

        await db.query(
            `
            UPDATE attendance

            SET
                session_id = ?,
                student_id = ?,
                status = ?

            WHERE attendance_id = ?
            `,
            [
                updatedSessionId,
                updatedStudentId,
                updatedStatus,
                id
            ]
        );

        const [updated] =
            await db.query(
                `
                SELECT

                    a.attendance_id,
                    a.session_id,
                    a.student_id,
                    a.scanned_at,
                    a.status,

                    st.register_number,
                    st.name AS student_name,
                    st.email AS student_email,
                    st.department,
                    st.year,
                    st.section,

                    ats.class_id,
                    ats.academic_year,

                    s.subject_code,
                    s.subject_name,

                    c.year AS class_year,
                    c.section AS class_section,

                    d.department_name,
                    d.department_code

                FROM attendance a

                LEFT JOIN students st
                    ON st.student_id =
                       a.student_id

                LEFT JOIN attendance_sessions ats
                    ON ats.session_id =
                       a.session_id

                LEFT JOIN subjects s
                    ON s.subject_id =
                       ats.subject_id

                LEFT JOIN classes c
                    ON c.class_id =
                       ats.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                       c.department_id

                WHERE a.attendance_id = ?

                LIMIT 1
                `,
                [id]
            );

        return res.status(200).json({
            success: true,
            message:
                "Attendance updated successfully",
            attendance:
                updated[0]
        });

    } catch (error) {
        console.error(
            "Update Attendance Error:",
            error
        );

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance already exists for this student and session"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update attendance",
            error: error.message
        });
    }
};


// =====================================================
// DELETE ATTENDANCE
// DELETE /api/attendance/:id
// =====================================================

const deleteAttendance = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        if (
            !id ||
            isNaN(Number(id))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid attendance ID is required"
            });
        }

        const [existing] =
            await db.query(
                `
                SELECT
                    attendance_id
                FROM attendance
                WHERE attendance_id = ?
                LIMIT 1
                `,
                [id]
            );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance record not found"
            });
        }

        await db.query(
            `
            DELETE FROM attendance
            WHERE attendance_id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message:
                "Attendance deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete Attendance Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete attendance",
            error: error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getAttendance,

    getAttendanceById,

    getAttendanceBySession,

    getAttendanceByStudent,

    markAttendance,

    scanAttendance,

    updateAttendance,

    deleteAttendance,

    // NEW
    getMySubjectClasses,

    getMySubjectStudents
};