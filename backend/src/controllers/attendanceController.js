const db = require("../config/db");

// =====================================================
// ATTENDANCE CONTROLLER
//
// IMPORTANT DATA FLOW
//
// STUDENT LOGIN
// users.user_id
//      ↓
// students.user_id
//      ↓
// students.student_id
//      ↓
// attendance.student_id
//
// STAFF QR SCAN
// attendance_sessions.session_id
//      ↓
// attendance.session_id
//      ↓
// attendance.student_id
//
// This controller always resolves the real student_id
// from the authenticated JWT for student operations.
// =====================================================


// =====================================================
// COMMON HELPERS
// =====================================================

function normalize(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

function getUserId(req) {
    return (
        req.user?.user_id ??
        req.user?.id ??
        req.user?.userId ??
        null
    );
}

function getUserRole(req) {
    return normalize(
        req.user?.role ??
        req.user?.user_role ??
        req.user?.userRole
    ).toUpperCase();
}


// =====================================================
// GET LOGGED-IN STAFF ID
// =====================================================

async function getLoggedInStaffId(req) {
    const userId = getUserId(req);

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

    return rows.length
        ? Number(rows[0].staff_id)
        : null;
}


// =====================================================
// GET LOGGED-IN STAFF
// =====================================================

async function getStaffByRequest(req) {
    const userId = getUserId(req);

    if (!userId) {
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
            phone,
            role
        FROM staff
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    return rows.length
        ? rows[0]
        : null;
}


// =====================================================
// GET LOGGED-IN STUDENT
//
// NEVER assume users.user_id == students.student_id.
//
// This is the main fix for the Student Dashboard.
// =====================================================

async function getLoggedInStudent(req) {
    const userId = getUserId(req);

    if (!userId) {
        return null;
    }

    const [rows] = await db.query(
        `
        SELECT
            s.student_id,
            s.user_id,
            s.student_code,
            s.name,
            s.email,
            s.phone,
            s.department,
            s.year,
            s.section
        FROM students s
        WHERE s.user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    return rows.length
        ? rows[0]
        : null;
}


// =====================================================
// EXTRACT QR TOKEN
//
// Accepts:
// 1. Raw token
// 2. JSON QR payload
// =====================================================

function extractQRToken(value) {
    if (!value) {
        return null;
    }

    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    // Raw token
    if (
        !trimmed.startsWith("{") &&
        !trimmed.startsWith("[")
    ) {
        return trimmed;
    }

    try {
        const parsed = JSON.parse(trimmed);

        if (typeof parsed === "string") {
            return parsed.trim();
        }

        return (
            parsed.qr_token ??
            parsed.qrToken ??
            parsed.token ??
            null
        );
    } catch {
        return trimmed;
    }
}


// =====================================================
// GET SESSION ALLOCATION
// =====================================================

async function getSessionAllocation(session) {
    if (!session) {
        return null;
    }

    const allocationId = session.allocation_id;

    if (allocationId) {
        const [rows] = await db.query(
            `
            SELECT
                sa.*,

                sub.subject_id AS joined_subject_id,
                sub.subject_code,
                sub.subject_name,

                c.class_id AS joined_class_id,
                c.year AS class_year,
                c.section AS class_section,

                d.department_id,
                d.department_name

            FROM subject_allocations sa

            LEFT JOIN subjects sub
                ON sub.subject_id = sa.subject_id

            LEFT JOIN classes c
                ON c.class_id = sa.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE sa.allocation_id = ?

            LIMIT 1
            `,
            [allocationId]
        );

        if (rows.length) {
            return rows[0];
        }
    }

    // -------------------------------------------------
    // Fallback using session subject/class
    // -------------------------------------------------

    const [rows] = await db.query(
        `
        SELECT
            sa.*,

            sub.subject_id AS joined_subject_id,
            sub.subject_code,
            sub.subject_name,

            c.class_id AS joined_class_id,
            c.year AS class_year,
            c.section AS class_section,

            d.department_id,
            d.department_name

        FROM subject_allocations sa

        LEFT JOIN subjects sub
            ON sub.subject_id = sa.subject_id

        LEFT JOIN classes c
            ON c.class_id = sa.class_id

        LEFT JOIN departments d
            ON d.department_id = c.department_id

        WHERE
            sa.subject_id = ?
            AND sa.class_id = ?

        ORDER BY sa.allocation_id DESC

        LIMIT 1
        `,
        [
            session.subject_id,
            session.class_id,
        ]
    );

    return rows.length
        ? rows[0]
        : null;
}


// =====================================================
// VALIDATE STUDENT FOR SESSION
// =====================================================

async function validateStudentForSession(
    student,
    session
) {
    if (!student || !session) {
        return {
            valid: false,
            message:
                "Student or attendance session not found.",
        };
    }

    const allocation =
        await getSessionAllocation(session);

    if (!allocation) {
        return {
            valid: false,
            message:
                "Subject/class allocation for this session was not found.",
        };
    }

    const expectedClassId =
        session.class_id ??
        allocation.class_id ??
        allocation.joined_class_id;

    if (
        expectedClassId &&
        allocation.joined_class_id &&
        Number(expectedClassId) !==
            Number(allocation.joined_class_id)
    ) {
        return {
            valid: false,
            message:
                "Attendance session class is invalid.",
        };
    }

    // -------------------------------------------------
    // CLASS YEAR
    // -------------------------------------------------

    if (
        allocation.class_year !== null &&
        allocation.class_year !== undefined &&
        student.year !== null &&
        student.year !== undefined
    ) {
        if (
            Number(student.year) !==
            Number(allocation.class_year)
        ) {
            return {
                valid: false,
                message:
                    "You are not assigned to this class.",
            };
        }
    }

    // -------------------------------------------------
    // CLASS SECTION
    // -------------------------------------------------

    if (
        allocation.class_section &&
        student.section
    ) {
        if (
            normalize(student.section) !==
            normalize(allocation.class_section)
        ) {
            return {
                valid: false,
                message:
                    "You are not assigned to this section.",
            };
        }
    }

    // -------------------------------------------------
    // DEPARTMENT
    //
    // Student department may contain either:
    // department name OR department code.
    // Therefore compare both.
    // -------------------------------------------------

    if (student.department) {
        const [departments] = await db.query(
            `
            SELECT
                department_id,
                department_name,
                department_code
            FROM departments
            WHERE
                department_id = ?
                OR LOWER(TRIM(department_name)) = ?
                OR LOWER(TRIM(department_code)) = ?
            LIMIT 1
            `,
            [
                allocation.department_id,
                normalize(student.department),
                normalize(student.department),
            ]
        );

        if (departments.length) {
            const department =
                departments[0];

            const studentDepartment =
                normalize(student.department);

            const validDepartment =
                studentDepartment ===
                    normalize(
                        department.department_name
                    ) ||
                studentDepartment ===
                    normalize(
                        department.department_code
                    );

            if (!validDepartment) {
                return {
                    valid: false,
                    message:
                        "You are not assigned to this department.",
                };
            }
        }
    }

    return {
        valid: true,
        allocation,
    };
}


// =====================================================
// CHECK STAFF SUBJECT/CLASS ALLOCATION
// =====================================================

async function checkStaffSubjectClassAllocation(
    req,
    allocationId,
    subjectId,
    classId
) {
    const staffId =
        await getLoggedInStaffId(req);

    if (!staffId) {
        return {
            valid: false,
            message:
                "Staff profile not found.",
        };
    }

    const [rows] = await db.query(
        `
        SELECT
            sa.*,
            sub.subject_code,
            sub.subject_name,
            c.year AS class_year,
            c.section AS class_section,
            d.department_name

        FROM subject_allocations sa

        LEFT JOIN subjects sub
            ON sub.subject_id = sa.subject_id

        LEFT JOIN classes c
            ON c.class_id = sa.class_id

        LEFT JOIN departments d
            ON d.department_id = c.department_id

        WHERE
            sa.allocation_id = ?
            AND sa.staff_id = ?
            AND sa.subject_id = ?
            AND sa.class_id = ?

        LIMIT 1
        `,
        [
            allocationId,
            staffId,
            subjectId,
            classId,
        ]
    );

    if (!rows.length) {
        return {
            valid: false,
            message:
                "This subject and class are not assigned to you.",
        };
    }

    return {
        valid: true,
        allocation: rows[0],
        staffId,
    };
}


// =====================================================
// VALIDATE STAFF FOR SESSION
// =====================================================

async function validateStaffForSession(
    req,
    session
) {
    const staffId =
        await getLoggedInStaffId(req);

    if (!staffId) {
        return {
            valid: false,
            message:
                "Staff profile not found.",
        };
    }

    // ADMIN can access any session.
    if (getUserRole(req) === "ADMIN") {
        return {
            valid: true,
            staffId,
        };
    }

    if (
        session.staff_id &&
        Number(session.staff_id) !==
            Number(staffId)
    ) {
        return {
            valid: false,
            message:
                "This attendance session does not belong to you.",
        };
    }

    return {
        valid: true,
        staffId,
    };
}


// =====================================================
// GET MY SUBJECT CLASSES
// =====================================================

async function getMySubjectClasses(req, res) {
    try {
        const staffId =
            await getLoggedInStaffId(req);

        if (!staffId) {
            return res.status(404).json({
                success: false,
                message:
                    "Staff profile not found.",
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                sa.allocation_id,
                sa.staff_id,
                sa.subject_id,
                sa.class_id,
                sa.academic_year,
                sa.semester,

                sub.subject_code,
                sub.subject_name,

                c.year AS class_year,
                c.section AS class_section,

                d.department_id,
                d.department_name

            FROM subject_allocations sa

            LEFT JOIN subjects sub
                ON sub.subject_id = sa.subject_id

            LEFT JOIN classes c
                ON c.class_id = sa.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE sa.staff_id = ?

            ORDER BY
                sub.subject_name ASC,
                c.year ASC,
                c.section ASC,
                sa.allocation_id ASC
            `,
            [staffId]
        );

        return res.json({
            success: true,
            allocations: rows,
            subjects: rows,
        });
    } catch (error) {
        console.error(
            "getMySubjectClasses error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load subject allocations.",
            error: error.message,
        });
    }
}


// =====================================================
// GET MY SUBJECT STUDENTS
// =====================================================

async function getMySubjectStudents(req, res) {
    try {
        const staffId =
            await getLoggedInStaffId(req);

        if (!staffId) {
            return res.status(404).json({
                success: false,
                message:
                    "Staff profile not found.",
            });
        }

        const {
            subject_id,
            class_id,
            allocation_id,
        } = req.query;

        if (!class_id) {
            return res.status(400).json({
                success: false,
                message:
                    "class_id is required.",
            });
        }

        const classId = Number(class_id);

        if (!Number.isInteger(classId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid class_id.",
            });
        }

        let allocation;

        if (allocation_id) {
            const result =
                await checkStaffSubjectClassAllocation(
                    req,
                    Number(allocation_id),
                    Number(subject_id),
                    classId
                );

            if (!result.valid) {
                return res.status(403).json({
                    success: false,
                    message: result.message,
                });
            }

            allocation =
                result.allocation;
        } else {
            const [allocationRows] =
                await db.query(
                    `
                    SELECT *
                    FROM subject_allocations
                    WHERE
                        staff_id = ?
                        AND class_id = ?
                        ${
                            subject_id
                                ? "AND subject_id = ?"
                                : ""
                        }
                    ORDER BY allocation_id DESC
                    LIMIT 1
                    `,
                    subject_id
                        ? [
                              staffId,
                              classId,
                              Number(subject_id),
                          ]
                        : [
                              staffId,
                              classId,
                          ]
                );

            if (!allocationRows.length) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This class is not assigned to you.",
                });
            }

            allocation =
                allocationRows[0];
        }

        const [classRows] = await db.query(
            `
            SELECT
                c.class_id,
                c.year,
                c.section,
                c.department_id,
                d.department_name,
                d.department_code

            FROM classes c

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE c.class_id = ?

            LIMIT 1
            `,
            [classId]
        );

        if (!classRows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Class not found.",
            });
        }

        const classInfo =
            classRows[0];

        const [students] = await db.query(
            `
            SELECT
                s.student_id,
                s.user_id,
                s.student_code,
                s.name,
                s.email,
                s.phone,
                s.department,
                s.year,
                s.section

            FROM students s

            WHERE
                s.year = ?

                AND LOWER(TRIM(s.section)) =
                    LOWER(TRIM(?))

                AND (
                    LOWER(TRIM(s.department)) =
                        LOWER(TRIM(?))
                    OR
                    LOWER(TRIM(s.department)) =
                        LOWER(TRIM(?))
                )

            ORDER BY s.name ASC
            `,
            [
                classInfo.year,
                classInfo.section,
                classInfo.department_name || "",
                classInfo.department_code || "",
            ]
        );

        return res.json({
            success: true,
            students,
            total_students: students.length,
            allocation,
            class: classInfo,
        });
    } catch (error) {
        console.error(
            "getMySubjectStudents error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load students.",
            error: error.message,
        });
    }
}


// =====================================================
// GET ALL ATTENDANCE
// =====================================================

async function getAttendance(req, res) {
    try {
        const [rows] = await db.query(
            `
            SELECT
                a.*,

                s.student_code,
                s.name AS student_name,
                s.email AS student_email,

                ats.session_id,
                ats.subject_id,
                ats.staff_id,
                ats.class_id,
                ats.academic_year,
                ats.semester,
                ats.session_date,
                ats.status AS session_status

            FROM attendance a

            LEFT JOIN students s
                ON s.student_id = a.student_id

            LEFT JOIN attendance_sessions ats
                ON ats.session_id = a.session_id

            ORDER BY
                a.attendance_id DESC
            `
        );

        return res.json({
            success: true,
            attendance: rows,
            records: rows,
            total: rows.length,
        });
    } catch (error) {
        console.error(
            "getAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load attendance.",
            error: error.message,
        });
    }
}


// =====================================================
// GET ATTENDANCE BY ID
// =====================================================

async function getAttendanceById(req, res) {
    try {
        const attendanceId =
            Number(req.params.id);

        if (!Number.isInteger(attendanceId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance ID.",
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                a.*,

                s.student_code,
                s.name AS student_name,
                s.email AS student_email,

                ats.subject_id,
                ats.staff_id,
                ats.class_id,
                ats.academic_year,
                ats.semester,
                ats.session_date,
                ats.status AS session_status

            FROM attendance a

            LEFT JOIN students s
                ON s.student_id = a.student_id

            LEFT JOIN attendance_sessions ats
                ON ats.session_id = a.session_id

            WHERE a.attendance_id = ?

            LIMIT 1
            `,
            [attendanceId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance record not found.",
            });
        }

        return res.json({
            success: true,
            attendance: rows[0],
            record: rows[0],
        });
    } catch (error) {
        console.error(
            "getAttendanceById error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load attendance record.",
            error: error.message,
        });
    }
}


// =====================================================
// GET ATTENDANCE BY SESSION
// =====================================================

async function getAttendanceBySession(
    req,
    res
) {
    try {
        const sessionId =
            Number(req.params.sessionId);

        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid session ID.",
            });
        }

        const [sessionRows] =
            await db.query(
                `
                SELECT
                    ats.*,

                    sub.subject_code,
                    sub.subject_name,

                    c.year AS class_year,
                    c.section AS class_section,

                    d.department_name,
                    d.department_code

                FROM attendance_sessions ats

                LEFT JOIN subjects sub
                    ON sub.subject_id = ats.subject_id

                LEFT JOIN classes c
                    ON c.class_id = ats.class_id

                LEFT JOIN departments d
                    ON d.department_id = c.department_id

                WHERE ats.session_id = ?

                LIMIT 1
                `,
                [sessionId]
            );

        if (!sessionRows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found.",
            });
        }

        const session =
            sessionRows[0];

        // -------------------------------------------------
        // Student access
        // -------------------------------------------------

        if (
            getUserRole(req) ===
            "STUDENT"
        ) {
            const student =
                await getLoggedInStudent(req);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student profile not found.",
                });
            }

            const validation =
                await validateStudentForSession(
                    student,
                    session
                );

            if (!validation.valid) {
                return res.status(403).json({
                    success: false,
                    message:
                        validation.message,
                });
            }
        }

        const [records] = await db.query(
            `
            SELECT
                a.*,

                s.student_id,
                s.student_code,
                s.name AS student_name,
                s.email AS student_email,
                s.phone AS student_phone,
                s.department,
                s.year,
                s.section

            FROM attendance a

            INNER JOIN students s
                ON s.student_id = a.student_id

            WHERE a.session_id = ?

            ORDER BY
                s.name ASC,
                a.attendance_id ASC
            `,
            [sessionId]
        );

        const [countRows] =
            await db.query(
                `
                SELECT
                    COUNT(DISTINCT a.student_id) AS attended
                FROM attendance a
                WHERE
                    a.session_id = ?
                    AND UPPER(TRIM(a.status))
                        IN ('PRESENT', 'LATE')
                `,
                [sessionId]
            );

        const attended =
            Number(
                countRows[0]?.attended || 0
            );

        // -------------------------------------------------
        // Calculate total students in session class
        // -------------------------------------------------

        let totalStudents = 0;

        if (session.class_id) {
            const [classRows] =
                await db.query(
                    `
                    SELECT
                        c.class_id,
                        c.year,
                        c.section,
                        c.department_id,
                        d.department_name,
                        d.department_code

                    FROM classes c

                    LEFT JOIN departments d
                        ON d.department_id =
                           c.department_id

                    WHERE c.class_id = ?

                    LIMIT 1
                    `,
                    [session.class_id]
                );

            if (classRows.length) {
                const c =
                    classRows[0];

                const [studentCountRows] =
                    await db.query(
                        `
                        SELECT
                            COUNT(*) AS total_students

                        FROM students s

                        WHERE
                            s.year = ?

                            AND LOWER(TRIM(s.section)) =
                                LOWER(TRIM(?))

                            AND (
                                LOWER(TRIM(s.department)) =
                                    LOWER(TRIM(?))

                                OR

                                LOWER(TRIM(s.department)) =
                                    LOWER(TRIM(?))
                            )
                        `,
                        [
                            c.year,
                            c.section,
                            c.department_name || "",
                            c.department_code || "",
                        ]
                    );

                totalStudents =
                    Number(
                        studentCountRows[0]
                            ?.total_students || 0
                    );
            }
        }

        // Fallback
        if (!totalStudents) {
            totalStudents =
                Number(records.length);
        }

        const percentage =
            totalStudents > 0
                ? Number(
                      (
                          (attended /
                              totalStudents) *
                          100
                      ).toFixed(2)
                  )
                : 0;

        return res.json({
            success: true,

            session,

            attendance: records,
            records,

            total_students:
                totalStudents,

            present: attended,

            percentage,
        });
    } catch (error) {
        console.error(
            "getAttendanceBySession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load session attendance.",
            error: error.message,
        });
    }
}


// =====================================================
// GET LIVE ATTENDANCE COUNT BY SESSION
// =====================================================

async function getAttendanceCountBySession(
    req,
    res
) {
    try {
        const sessionId =
            Number(req.params.sessionId);

        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid session ID.",
            });
        }

        const [sessionRows] =
            await db.query(
                `
                SELECT
                    ats.session_id,
                    ats.allocation_id,
                    ats.subject_id,
                    ats.staff_id,
                    ats.class_id,
                    ats.academic_year,
                    ats.semester,
                    ats.session_date,
                    ats.status,

                    c.year AS class_year,
                    c.section AS class_section,

                    d.department_name,
                    d.department_code

                FROM attendance_sessions ats

                LEFT JOIN classes c
                    ON c.class_id = ats.class_id

                LEFT JOIN departments d
                    ON d.department_id =
                       c.department_id

                WHERE ats.session_id = ?

                LIMIT 1
                `,
                [sessionId]
            );

        if (!sessionRows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found.",
            });
        }

        const session =
            sessionRows[0];

        const validation =
            await validateStaffForSession(
                req,
                session
            );

        if (!validation.valid) {
            return res.status(403).json({
                success: false,
                message:
                    validation.message,
            });
        }

        // -------------------------------------------------
        // PRESENT + LATE
        // -------------------------------------------------

        const [attendanceRows] =
            await db.query(
                `
                SELECT
                    COUNT(DISTINCT a.student_id)
                        AS attended

                FROM attendance a

                WHERE
                    a.session_id = ?

                    AND UPPER(TRIM(a.status))
                        IN ('PRESENT', 'LATE')
                `,
                [sessionId]
            );

        const present =
            Number(
                attendanceRows[0]?.attended || 0
            );

        // -------------------------------------------------
        // TOTAL STUDENTS
        // -------------------------------------------------

        let totalStudents = 0;

        if (session.class_id) {
            const [studentsRows] =
                await db.query(
                    `
                    SELECT
                        COUNT(*) AS total_students

                    FROM students s

                    WHERE
                        s.year = ?

                        AND LOWER(TRIM(s.section)) =
                            LOWER(TRIM(?))

                        AND (
                            LOWER(TRIM(s.department)) =
                                LOWER(TRIM(?))

                            OR

                            LOWER(TRIM(s.department)) =
                                LOWER(TRIM(?))
                        )
                    `,
                    [
                        session.class_year,
                        session.class_section,
                        session.department_name || "",
                        session.department_code || "",
                    ]
                );

            totalStudents =
                Number(
                    studentsRows[0]
                        ?.total_students || 0
                );
        }

        // -------------------------------------------------
        // FALLBACK
        // -------------------------------------------------

        if (!totalStudents) {
            const [allocationStudents] =
                await db.query(
                    `
                    SELECT
                        COUNT(*) AS total_students

                    FROM students s

                    INNER JOIN classes c
                        ON c.class_id = ?

                    LEFT JOIN departments d
                        ON d.department_id =
                           c.department_id

                    WHERE
                        s.year = c.year

                        AND LOWER(TRIM(s.section)) =
                            LOWER(TRIM(c.section))

                        AND (
                            LOWER(TRIM(s.department)) =
                                LOWER(TRIM(d.department_name))

                            OR

                            LOWER(TRIM(s.department)) =
                                LOWER(TRIM(d.department_code))
                        )
                    `,
                    [session.class_id]
                );

            totalStudents =
                Number(
                    allocationStudents[0]
                        ?.total_students || 0
                );
        }

        const percentage =
            totalStudents > 0
                ? Number(
                      (
                          (present /
                              totalStudents) *
                          100
                      ).toFixed(2)
                  )
                : 0;

        return res.json({
            success: true,

            session_id:
                sessionId,

            session_status:
                session.status,

            present,

            attended: present,

            total:
                totalStudents,

            total_students:
                totalStudents,

            percentage,
        });
    } catch (error) {
        console.error(
            "getAttendanceCountBySession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load attendance count.",
            error: error.message,
        });
    }
}


// =====================================================
// GET ATTENDANCE BY STUDENT
// =====================================================
//
// IMPORTANT:
//
// This endpoint expects students.student_id.
//
// Student Dashboard should preferably use /my.
//
// =====================================================

async function getAttendanceByStudent(
    req,
    res
) {
    try {
        let studentId =
            Number(req.params.studentId);

        if (
            getUserRole(req) ===
            "STUDENT"
        ) {
            const loggedInStudent =
                await getLoggedInStudent(req);

            if (!loggedInStudent) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student profile not found.",
                });
            }

            // -------------------------------------------------
            // STUDENT CAN ONLY SEE OWN ATTENDANCE
            // -------------------------------------------------

            studentId =
                Number(
                    loggedInStudent.student_id
                );
        }

        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid student ID.",
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                a.*,

                s.student_id,
                s.student_code,
                s.name AS student_name,

                ats.subject_id,
                ats.staff_id,
                ats.class_id,
                ats.allocation_id,
                ats.academic_year,
                ats.semester,
                ats.session_date,
                ats.start_time,
                ats.end_time,
                ats.status AS session_status

            FROM attendance a

            INNER JOIN students s
                ON s.student_id = a.student_id

            LEFT JOIN attendance_sessions ats
                ON ats.session_id = a.session_id

            WHERE a.student_id = ?

            ORDER BY
                COALESCE(
                    ats.session_date,
                    DATE(a.scanned_at)
                ) DESC,
                a.attendance_id DESC
            `,
            [studentId]
        );

        const present =
            rows.filter(
                (row) =>
                    normalize(
                        row.status
                    ).toUpperCase() ===
                    "PRESENT"
            ).length;

        const late =
            rows.filter(
                (row) =>
                    normalize(
                        row.status
                    ).toUpperCase() ===
                    "LATE"
            ).length;

        const absent =
            rows.filter(
                (row) =>
                    normalize(
                        row.status
                    ).toUpperCase() ===
                    "ABSENT"
            ).length;

        const attended =
            present + late;

        return res.json({
            success: true,

            student_id:
                studentId,

            attendance: rows,
            records: rows,
            attendance_records: rows,

            total: rows.length,
            total_students: rows.length,

            present,
            late,
            absent,
            attended,

            percentage:
                rows.length > 0
                    ? Number(
                          (
                              (attended /
                                  rows.length) *
                              100
                          ).toFixed(1)
                      )
                    : 0,
        });
    } catch (error) {
        console.error(
            "getAttendanceByStudent error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load student attendance.",
            error: error.message,
        });
    }
}


// =====================================================
// GET MY ATTENDANCE
// =====================================================
//
// NEW RELIABLE STUDENT ENDPOINT
//
// GET /api/attendance/my
//
// JWT → users.user_id → students.student_id
//
// The frontend no longer needs to know student_id.
// =====================================================

async function getMyAttendance(req, res) {
    try {
        const student =
            await getLoggedInStudent(req);

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student profile not found for this login.",
            });
        }

        const studentId =
            Number(student.student_id);

        const [rows] = await db.query(
            `
            SELECT
                a.*,

                s.student_id,
                s.student_code,
                s.name AS student_name,

                ats.subject_id,
                ats.staff_id,
                ats.class_id,
                ats.allocation_id,
                ats.academic_year,
                ats.semester,
                ats.session_date,
                ats.start_time,
                ats.end_time,
                ats.status AS session_status,

                sub.subject_code,
                sub.subject_name

            FROM attendance a

            INNER JOIN students s
                ON s.student_id = a.student_id

            LEFT JOIN attendance_sessions ats
                ON ats.session_id = a.session_id

            LEFT JOIN subjects sub
                ON sub.subject_id = ats.subject_id

            WHERE a.student_id = ?

            ORDER BY
                COALESCE(
                    ats.session_date,
                    DATE(a.scanned_at)
                ) DESC,
                a.attendance_id DESC
            `,
            [studentId]
        );

        const present =
            rows.filter(
                (row) =>
                    normalize(
                        row.status
                    ).toUpperCase() ===
                    "PRESENT"
            ).length;

        const late =
            rows.filter(
                (row) =>
                    normalize(
                        row.status
                    ).toUpperCase() ===
                    "LATE"
            ).length;

        const absent =
            rows.filter(
                (row) =>
                    normalize(
                        row.status
                    ).toUpperCase() ===
                    "ABSENT"
            ).length;

        const attended =
            present + late;

        const total =
            rows.length;

        const percentage =
            total > 0
                ? Number(
                      (
                          (attended /
                              total) *
                          100
                      ).toFixed(1)
                  )
                : 0;

        return res.json({
            success: true,

            student: {
                student_id:
                    student.student_id,
                user_id:
                    student.user_id,
                student_code:
                    student.student_code,
                name:
                    student.name,
                department:
                    student.department,
                year:
                    student.year,
                section:
                    student.section,
            },

            attendance: rows,
            records: rows,
            attendance_records: rows,

            total,
            present,
            late,
            absent,
            attended,
            percentage,
        });
    } catch (error) {
        console.error(
            "getMyAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load your attendance.",
            error: error.message,
        });
    }
}


// =====================================================
// MARK ATTENDANCE MANUALLY
// =====================================================

async function markAttendance(req, res) {
    try {
        const {
            session_id,
            student_id,
            status,
        } = req.body;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message:
                    "session_id is required.",
            });
        }

        if (!student_id) {
            return res.status(400).json({
                success: false,
                message:
                    "student_id is required.",
            });
        }

        const attendanceStatus =
            String(
                status || "PRESENT"
            )
                .trim()
                .toUpperCase();

        if (
            ![
                "PRESENT",
                "LATE",
                "ABSENT",
            ].includes(attendanceStatus)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance status.",
            });
        }

        const [sessionRows] =
            await db.query(
                `
                SELECT *
                FROM attendance_sessions
                WHERE session_id = ?
                LIMIT 1
                `,
                [session_id]
            );

        if (!sessionRows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found.",
            });
        }

        const session =
            sessionRows[0];

        const validation =
            await validateStaffForSession(
                req,
                session
            );

        if (!validation.valid) {
            return res.status(403).json({
                success: false,
                message:
                    validation.message,
            });
        }

        const [studentRows] =
            await db.query(
                `
                SELECT *
                FROM students
                WHERE student_id = ?
                LIMIT 1
                `,
                [student_id]
            );

        if (!studentRows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Student not found.",
            });
        }

        // -------------------------------------------------
        // Check duplicate
        // -------------------------------------------------

        const [existingRows] =
            await db.query(
                `
                SELECT attendance_id
                FROM attendance
                WHERE
                    session_id = ?
                    AND student_id = ?
                LIMIT 1
                `,
                [
                    session_id,
                    student_id,
                ]
            );

        if (existingRows.length) {
            const attendanceId =
                existingRows[0]
                    .attendance_id;

            await db.query(
                `
                UPDATE attendance
                SET status = ?
                WHERE attendance_id = ?
                `,
                [
                    attendanceStatus,
                    attendanceId,
                ]
            );

            const [updatedRows] =
                await db.query(
                    `
                    SELECT *
                    FROM attendance
                    WHERE attendance_id = ?
                    LIMIT 1
                    `,
                    [attendanceId]
                );

            return res.json({
                success: true,
                message:
                    "Attendance updated successfully.",
                attendance:
                    updatedRows[0],
                updated: true,
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
                    attendanceStatus,
                ]
            );

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM attendance
                WHERE attendance_id = ?
                LIMIT 1
                `,
                [result.insertId]
            );

        return res.status(201).json({
            success: true,
            message:
                "Attendance marked successfully.",
            attendance:
                rows[0],
        });
    } catch (error) {
        console.error(
            "markAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to mark attendance.",
            error: error.message,
        });
    }
}


// =====================================================
// SCAN QR ATTENDANCE
// =====================================================
//
// POST /api/attendance/scan
//
// Student sends:
//
// {
//     qr_token: "..."
// }
//
// Student is resolved from JWT.
// =====================================================

async function scanAttendance(req, res) {
    try {
        const qrInput =
            req.body?.qr_token ??
            req.body?.qrToken ??
            req.body?.token ??
            req.body?.qr;

        const qrToken =
            extractQRToken(qrInput);

        if (!qrToken) {
            return res.status(400).json({
                success: false,
                message:
                    "QR token is required.",
            });
        }

        // -------------------------------------------------
        // Resolve student from JWT
        // -------------------------------------------------

        const student =
            await getLoggedInStudent(req);

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student profile not found. Please login again.",
            });
        }

        const studentId =
            Number(student.student_id);

        // -------------------------------------------------
        // Find session by QR token
        // -------------------------------------------------

        const [sessionRows] =
            await db.query(
                `
                SELECT *
                FROM attendance_sessions
                WHERE qr_token = ?
                LIMIT 1
                `,
                [qrToken]
            );

        if (!sessionRows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Invalid QR token.",
            });
        }

        const session =
            sessionRows[0];

        // -------------------------------------------------
        // Session must be active
        // -------------------------------------------------

        if (
            normalize(session.status) !==
            "active"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This attendance session is no longer active.",
            });
        }

        // -------------------------------------------------
        // Check QR expiry
        // -------------------------------------------------

        if (session.qr_expires_at) {
            const expiry =
                new Date(
                    session.qr_expires_at
                ).getTime();

            if (
                Number.isFinite(expiry) &&
                Date.now() > expiry
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "QR code has expired. Please scan the latest QR code.",
                });
            }
        }

        // -------------------------------------------------
        // Validate student class
        // -------------------------------------------------

        const validation =
            await validateStudentForSession(
                student,
                session
            );

        if (!validation.valid) {
            return res.status(403).json({
                success: false,
                message:
                    validation.message,
            });
        }

        // -------------------------------------------------
        // Check duplicate
        // -------------------------------------------------

        const [existingRows] =
            await db.query(
                `
                SELECT
                    attendance_id,
                    session_id,
                    student_id,
                    status,
                    scanned_at

                FROM attendance

                WHERE
                    session_id = ?
                    AND student_id = ?

                LIMIT 1
                `,
                [
                    session.session_id,
                    studentId,
                ]
            );

        if (existingRows.length) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance has already been marked for this session.",
                duplicate: true,
                attendance:
                    existingRows[0],
            });
        }

        // -------------------------------------------------
        // Determine attendance status
        //
        // If session has start_time and scan happens
        // after start time, mark LATE.
        //
        // Otherwise PRESENT.
        // -------------------------------------------------

        let attendanceStatus =
            "PRESENT";

        if (
            session.start_time &&
            session.session_date
        ) {
            const startDateTime =
                new Date(
                    `${session.session_date}T${session.start_time}`
                );

            if (
                !Number.isNaN(
                    startDateTime.getTime()
                ) &&
                Date.now() >
                    startDateTime.getTime()
            ) {
                attendanceStatus =
                    "LATE";
            }
        }

        // -------------------------------------------------
        // INSERT ATTENDANCE
        // -------------------------------------------------

        const [insertResult] =
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
                    studentId,
                    attendanceStatus,
                ]
            );

        const attendanceId =
            insertResult.insertId;

        // -------------------------------------------------
        // Read inserted record back
        // -------------------------------------------------

        const [attendanceRows] =
            await db.query(
                `
                SELECT
                    a.*,

                    s.student_id,
                    s.student_code,
                    s.name AS student_name,
                    s.email AS student_email,

                    ats.session_id,
                    ats.subject_id,
                    ats.staff_id,
                    ats.class_id,
                    ats.allocation_id,
                    ats.academic_year,
                    ats.semester,
                    ats.session_date

                FROM attendance a

                INNER JOIN students s
                    ON s.student_id =
                       a.student_id

                LEFT JOIN attendance_sessions ats
                    ON ats.session_id =
                       a.session_id

                WHERE
                    a.attendance_id = ?

                LIMIT 1
                `,
                [attendanceId]
            );

        return res.status(201).json({
            success: true,

            message:
                attendanceStatus === "LATE"
                    ? "Attendance marked successfully as late."
                    : "Attendance marked successfully.",

            attendance:
                attendanceRows[0] || {
                    attendance_id:
                        attendanceId,
                    session_id:
                        session.session_id,
                    student_id:
                        studentId,
                    status:
                        attendanceStatus,
                },

            student: {
                student_id:
                    student.student_id,
                student_code:
                    student.student_code,
                name:
                    student.name,
            },

            session: {
                session_id:
                    session.session_id,
                subject_id:
                    session.subject_id,
                class_id:
                    session.class_id,
            },
        });
    } catch (error) {
        console.error(
            "scanAttendance error:",
            error
        );

        // -------------------------------------------------
        // Handle duplicate-key race condition
        // -------------------------------------------------

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance has already been marked for this session.",
                duplicate: true,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to save attendance.",
            error: error.message,
        });
    }
}


// =====================================================
// UPDATE ATTENDANCE
// =====================================================

async function updateAttendance(
    req,
    res
) {
    try {
        const attendanceId =
            Number(req.params.id);

        const {
            status,
        } = req.body;

        if (!Number.isInteger(attendanceId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance ID.",
            });
        }

        const attendanceStatus =
            String(
                status || ""
            )
                .trim()
                .toUpperCase();

        if (
            ![
                "PRESENT",
                "LATE",
                "ABSENT",
            ].includes(attendanceStatus)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance status.",
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT
                    a.*,
                    ats.staff_id,
                    ats.status AS session_status

                FROM attendance a

                LEFT JOIN attendance_sessions ats
                    ON ats.session_id =
                       a.session_id

                WHERE a.attendance_id = ?

                LIMIT 1
                `,
                [attendanceId]
            );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance record not found.",
            });
        }

        const record =
            rows[0];

        const validation =
            await validateStaffForSession(
                req,
                record
            );

        if (!validation.valid) {
            return res.status(403).json({
                success: false,
                message:
                    validation.message,
            });
        }

        await db.query(
            `
            UPDATE attendance
            SET status = ?
            WHERE attendance_id = ?
            `,
            [
                attendanceStatus,
                attendanceId,
            ]
        );

        const [updatedRows] =
            await db.query(
                `
                SELECT *
                FROM attendance
                WHERE attendance_id = ?
                LIMIT 1
                `,
                [attendanceId]
            );

        return res.json({
            success: true,
            message:
                "Attendance updated successfully.",
            attendance:
                updatedRows[0],
        });
    } catch (error) {
        console.error(
            "updateAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update attendance.",
            error: error.message,
        });
    }
}


// =====================================================
// DELETE ATTENDANCE
// =====================================================

async function deleteAttendance(
    req,
    res
) {
    try {
        const attendanceId =
            Number(req.params.id);

        if (!Number.isInteger(attendanceId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance ID.",
            });
        }

        const [result] =
            await db.query(
                `
                DELETE FROM attendance
                WHERE attendance_id = ?
                `,
                [attendanceId]
            );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance record not found.",
            });
        }

        return res.json({
            success: true,
            message:
                "Attendance deleted successfully.",
        });
    } catch (error) {
        console.error(
            "deleteAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete attendance.",
            error: error.message,
        });
    }
}


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getAttendance,
    getAttendanceById,
    getAttendanceBySession,
    getAttendanceCountBySession,
    getAttendanceByStudent,
    getMyAttendance,
    markAttendance,
    scanAttendance,
    updateAttendance,
    deleteAttendance,
    getMySubjectClasses,
    getMySubjectStudents,
};