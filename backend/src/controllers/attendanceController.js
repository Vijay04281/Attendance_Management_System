
const db = require("../config/db");

// =====================================================
// ATTENDANCE CONTROLLER
//
// STUDENT TABLE ACTUAL STRUCTURE:
//
// student_id
// user_id
// register_number
// name
// email
// department
// year
// section
//
// IMPORTANT:
// register_number is returned as student_code in the API
// so the existing frontend does not need to change.
//
// students.phone DOES NOT EXIST.
// students.student_code DOES NOT EXIST.
// =====================================================


// =====================================================
// HELPERS
// =====================================================

const normalize = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim().toLowerCase();
};


// =====================================================
// GET USER ID
// =====================================================

const getUserId = (req) => {
    return (
        req.user?.user_id ??
        req.user?.id ??
        req.user?.userId ??
        null
    );
};


// =====================================================
// GET USER ROLE
// =====================================================

const getUserRole = (req) => {
    return normalize(
        req.user?.role ??
        req.user?.user_role ??
        req.user?.userRole ??
        ""
    );
};


// =====================================================
// GET LOGGED-IN STAFF ID
// =====================================================

const getLoggedInStaffId = async (req) => {
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

    return rows.length ? rows[0].staff_id : null;
};


// =====================================================
// GET STAFF BY REQUEST
// =====================================================

const getStaffByRequest = async (req) => {
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

    return rows.length ? rows[0] : null;
};


// =====================================================
// GET LOGGED-IN STUDENT
//
// ACTUAL STUDENTS TABLE:
//
// student_id
// user_id
// register_number
// name
// email
// department
// year
// section
//
// register_number is aliased as student_code so the
// existing frontend/API structure remains compatible.
// =====================================================

const getLoggedInStudent = async (req) => {
    const userId = getUserId(req);

    if (!userId) {
        return null;
    }

    const [rows] = await db.query(
        `
        SELECT
            s.student_id,
            s.user_id,
            s.register_number AS student_code,
            s.register_number,
            s.name,
            s.email,
            s.department,
            s.year,
            s.section
        FROM students s
        WHERE s.user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    return rows.length ? rows[0] : null;
};


// =====================================================
// EXTRACT QR TOKEN
// =====================================================

const extractQRToken = (req) => {
    return (
        req.body?.qr_token ??
        req.body?.qrToken ??
        req.body?.token ??
        req.body?.qr ??
        req.query?.qr_token ??
        req.query?.qrToken ??
        req.query?.token ??
        null
    );
};


// =====================================================
// GET SESSION ALLOCATION
// =====================================================

const getSessionAllocation = async (sessionId) => {
    const [rows] = await db.query(
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
            ats.start_time,
            ats.end_time,
            ats.status,
            ats.qr_token,
            ats.qr_expires_at,

            sa.allocation_id AS allocation_exists,
            sa.staff_id AS allocation_staff_id,
            sa.subject_id AS allocation_subject_id,
            sa.class_id AS allocation_class_id,
            sa.academic_year AS allocation_academic_year,
            sa.semester AS allocation_semester

        FROM attendance_sessions ats

        LEFT JOIN subject_allocations sa
            ON sa.allocation_id = ats.allocation_id

        WHERE ats.session_id = ?

        LIMIT 1
        `,
        [sessionId]
    );

    return rows.length ? rows[0] : null;
};


// =====================================================
// VALIDATE STUDENT FOR SESSION
// =====================================================

const validateStudentForSession = async (student, session) => {
    if (!student || !session) {
        return {
            valid: false,
            message: "Invalid student or attendance session."
        };
    }

    // -------------------------------------------------
    // If the session has no class allocation,
    // do not block the student here.
    // -------------------------------------------------

    if (!session.class_id) {
        return {
            valid: true
        };
    }

    const [classRows] = await db.query(
        `
        SELECT
            class_id,
            year,
            section,
            department_id
        FROM classes
        WHERE class_id = ?
        LIMIT 1
        `,
        [session.class_id]
    );

    if (!classRows.length) {
        return {
            valid: false,
            message: "The class assigned to this attendance session was not found."
        };
    }

    const classInfo = classRows[0];

    // -------------------------------------------------
    // YEAR CHECK
    // -------------------------------------------------

    if (
        student.year !== null &&
        student.year !== undefined &&
        classInfo.year !== null &&
        classInfo.year !== undefined
    ) {
        if (Number(student.year) !== Number(classInfo.year)) {
            return {
                valid: false,
                message: "You are not eligible for this class."
            };
        }
    }

    // -------------------------------------------------
    // SECTION CHECK
    // -------------------------------------------------

    if (
        student.section &&
        classInfo.section
    ) {
        if (
            normalize(student.section) !==
            normalize(classInfo.section)
        ) {
            return {
                valid: false,
                message: "You are not eligible for this class section."
            };
        }
    }

    // -------------------------------------------------
    // DEPARTMENT CHECK
    // -------------------------------------------------

    if (classInfo.department_id && student.department) {
        const [departmentRows] = await db.query(
            `
            SELECT
                department_id,
                department_name,
                department_code
            FROM departments
            WHERE department_id = ?
               OR LOWER(TRIM(department_name)) = ?
               OR LOWER(TRIM(department_code)) = ?
            LIMIT 1
            `,
            [
                classInfo.department_id,
                normalize(student.department),
                normalize(student.department)
            ]
        );

        if (departmentRows.length) {
            const department = departmentRows[0];

            const studentDepartment = normalize(student.department);

            const matchesDepartment =
                studentDepartment === normalize(department.department_name) ||
                studentDepartment === normalize(department.department_code) ||
                studentDepartment === String(department.department_id);

            if (!matchesDepartment) {
                return {
                    valid: false,
                    message: "You are not eligible for this department."
                };
            }
        }
    }

    return {
        valid: true
    };
};


// =====================================================
// CHECK STAFF SUBJECT + CLASS ALLOCATION
// =====================================================

const checkStaffSubjectClassAllocation = async (
    staffId,
    subjectId,
    classId
) => {
    if (!staffId || !subjectId || !classId) {
        return false;
    }

    const [rows] = await db.query(
        `
        SELECT allocation_id
        FROM subject_allocations
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

    return rows.length > 0;
};


// =====================================================
// VALIDATE STAFF FOR SESSION
// =====================================================

const validateStaffForSession = async (
    req,
    session
) => {
    const staffId = await getLoggedInStaffId(req);

    if (!staffId) {
        return {
            valid: false,
            message: "Staff profile not found."
        };
    }

    if (
        session.staff_id &&
        Number(session.staff_id) !== Number(staffId)
    ) {
        return {
            valid: false,
            message: "You are not authorized to access this attendance session."
        };
    }

    if (
        session.subject_id &&
        session.class_id
    ) {
        const allocated =
            await checkStaffSubjectClassAllocation(
                staffId,
                session.subject_id,
                session.class_id
            );

        if (!allocated) {
            return {
                valid: false,
                message: "This subject/class is not assigned to you."
            };
        }
    }

    return {
        valid: true,
        staffId
    };
};


// =====================================================
// GET MY SUBJECT CLASSES
// =====================================================

const getMySubjectClasses = async (req, res) => {
    try {
        const staffId = await getLoggedInStaffId(req);

        if (!staffId) {
            return res.status(404).json({
                success: false,
                message: "Staff profile not found."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                sa.allocation_id,

                sa.staff_id,

                sa.subject_id,
                s.subject_code,
                s.subject_name,

                sa.class_id,
                c.year,
                c.section,

                c.department_id,
                d.department_name,
                d.department_code,

                sa.academic_year,
                sa.semester

            FROM subject_allocations sa

            INNER JOIN subjects s
                ON s.subject_id = sa.subject_id

            INNER JOIN classes c
                ON c.class_id = sa.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE sa.staff_id = ?

            ORDER BY
                c.year,
                c.section,
                s.subject_name
            `,
            [staffId]
        );

        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error(
            "getMySubjectClasses error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load assigned classes.",
            error: error.message
        });
    }
};


// =====================================================
// GET MY SUBJECT STUDENTS
// =====================================================

const getMySubjectStudents = async (req, res) => {
    try {
        const staffId = await getLoggedInStaffId(req);

        if (!staffId) {
            return res.status(404).json({
                success: false,
                message: "Staff profile not found."
            });
        }

        const subjectId =
            req.params.subjectId ??
            req.query.subjectId;

        const classId =
            req.params.classId ??
            req.query.classId;

        if (!subjectId || !classId) {
            return res.status(400).json({
                success: false,
                message: "subjectId and classId are required."
            });
        }

        const allocated =
            await checkStaffSubjectClassAllocation(
                staffId,
                subjectId,
                classId
            );

        if (!allocated) {
            return res.status(403).json({
                success: false,
                message: "This subject/class is not assigned to you."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                s.student_id,
                s.user_id,
                s.register_number AS student_code,
                s.register_number,
                s.name,
                s.email,
                s.department,
                s.year,
                s.section

            FROM students s

            INNER JOIN classes c
                ON c.class_id = ?

            WHERE
                (
                    s.year = c.year
                    OR s.year IS NULL
                    OR c.year IS NULL
                )

                AND
                (
                    LOWER(TRIM(s.section)) =
                    LOWER(TRIM(c.section))

                    OR s.section IS NULL
                    OR c.section IS NULL
                )

            ORDER BY
                s.name
            `,
            [classId]
        );

        return res.json({
            success: true,
            students: rows
        });

    } catch (error) {
        console.error(
            "getMySubjectStudents error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load students.",
            error: error.message
        });
    }
};


// =====================================================
// GET ATTENDANCE
// =====================================================

const getAttendance = async (req, res) => {
    try {
        const role = getUserRole(req);

        let query = `
            SELECT
                a.attendance_id,
                a.session_id,
                a.student_id,
                a.status,
                a.scanned_at,

                s.user_id,
                s.register_number AS student_code,
                s.register_number,
                s.name AS student_name,
                s.email,
                s.department,
                s.year,
                s.section,

                ats.subject_id,
                ats.staff_id,
                ats.class_id,
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

            INNER JOIN attendance_sessions ats
                ON ats.session_id = a.session_id

            LEFT JOIN subjects sub
                ON sub.subject_id = ats.subject_id
        `;

        const params = [];

        // -------------------------------------------------
        // STUDENT
        // -------------------------------------------------

        if (role === "student") {
            const student =
                await getLoggedInStudent(req);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student profile not found."
                });
            }

            query += `
                WHERE a.student_id = ?
            `;

            params.push(student.student_id);
        }

        // -------------------------------------------------
        // STAFF / TEACHER
        // -------------------------------------------------

        else if (
            role === "staff" ||
            role === "teacher"
        ) {
            const staffId =
                await getLoggedInStaffId(req);

            if (!staffId) {
                return res.status(404).json({
                    success: false,
                    message: "Staff profile not found."
                });
            }

            query += `
                WHERE ats.staff_id = ?
            `;

            params.push(staffId);
        }

        // -------------------------------------------------
        // ADMIN / HOD
        // -------------------------------------------------

        else if (
            role === "admin" ||
            role === "hod"
        ) {
            // No additional restriction.
        }

        else {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view attendance."
            });
        }

        query += `
            ORDER BY
                ats.session_date DESC,
                a.scanned_at DESC
        `;

        const [rows] =
            await db.query(query, params);

        return res.json({
            success: true,
            attendance: rows,
            records: rows,
            data: rows
        });

    } catch (error) {
        console.error(
            "getAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load attendance.",
            error: error.message
        });
    }
};


// =====================================================
// GET ATTENDANCE BY ID
// =====================================================

const getAttendanceById = async (req, res) => {
    try {
        const attendanceId =
            req.params.attendanceId ??
            req.params.id;

        if (!attendanceId) {
            return res.status(400).json({
                success: false,
                message: "Attendance ID is required."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                a.attendance_id,
                a.session_id,
                a.student_id,
                a.status,
                a.scanned_at,

                s.user_id,
                s.register_number AS student_code,
                s.register_number,
                s.name AS student_name,
                s.email,
                s.department,
                s.year,
                s.section,

                ats.subject_id,
                ats.staff_id,
                ats.class_id,
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

            INNER JOIN attendance_sessions ats
                ON ats.session_id = a.session_id

            LEFT JOIN subjects sub
                ON sub.subject_id = ats.subject_id

            WHERE a.attendance_id = ?

            LIMIT 1
            `,
            [attendanceId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found."
            });
        }

        return res.json({
            success: true,
            attendance: rows[0],
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "getAttendanceById error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load attendance.",
            error: error.message
        });
    }
};


// =====================================================
// GET ATTENDANCE BY SESSION
// =====================================================

const getAttendanceBySession = async (req, res) => {
    try {
        const sessionId =
            req.params.sessionId ??
            req.query.sessionId;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required."
            });
        }

        const session =
            await getSessionAllocation(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        const role = getUserRole(req);

        // -------------------------------------------------
        // STAFF
        // -------------------------------------------------

        if (
            role === "staff" ||
            role === "teacher"
        ) {
            const validation =
                await validateStaffForSession(
                    req,
                    session
                );

            if (!validation.valid) {
                return res.status(403).json({
                    success: false,
                    message: validation.message
                });
            }
        }

        // -------------------------------------------------
        // STUDENT
        // -------------------------------------------------

        if (role === "student") {
            const student =
                await getLoggedInStudent(req);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student profile not found."
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
                    message: validation.message
                });
            }
        }

        const [rows] = await db.query(
            `
            SELECT
                a.attendance_id,
                a.session_id,
                a.student_id,
                a.status,
                a.scanned_at,

                s.user_id,
                s.register_number AS student_code,
                s.register_number,
                s.name AS student_name,
                s.email,
                s.department,
                s.year,
                s.section

            FROM attendance a

            INNER JOIN students s
                ON s.student_id = a.student_id

            WHERE a.session_id = ?

            ORDER BY
                s.name
            `,
            [sessionId]
        );

        return res.json({
            success: true,
            attendance: rows,
            records: rows,
            data: rows
        });

    } catch (error) {
        console.error(
            "getAttendanceBySession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load session attendance.",
            error: error.message
        });
    }
};


// =====================================================
// GET ATTENDANCE COUNT BY SESSION
// =====================================================

const getAttendanceCountBySession = async (req, res) => {
    try {
        const sessionId =
            req.params.sessionId ??
            req.query.sessionId;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required."
            });
        }

        const session =
            await getSessionAllocation(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        const validation =
            await validateStaffForSession(
                req,
                session
            );

        if (!validation.valid) {
            return res.status(403).json({
                success: false,
                message: validation.message
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                COUNT(*) AS total,
                SUM(
                    CASE
                        WHEN LOWER(status) = 'present'
                        THEN 1
                        ELSE 0
                    END
                ) AS present,
                SUM(
                    CASE
                        WHEN LOWER(status) = 'absent'
                        THEN 1
                        ELSE 0
                    END
                ) AS absent

            FROM attendance

            WHERE session_id = ?
            `,
            [sessionId]
        );

        const result = rows[0] || {
            total: 0,
            present: 0,
            absent: 0
        };

        return res.json({
            success: true,
            count: result,
            data: result
        });

    } catch (error) {
        console.error(
            "getAttendanceCountBySession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load attendance count.",
            error: error.message
        });
    }
};


// =====================================================
// GET ATTENDANCE BY STUDENT
// =====================================================

const getAttendanceByStudent = async (req, res) => {
    try {
        let studentId =
            req.params.studentId ??
            req.query.studentId;

        const role = getUserRole(req);

        // -------------------------------------------------
        // STUDENT CAN ONLY SEE OWN ATTENDANCE
        // -------------------------------------------------

        if (role === "student") {
            const student =
                await getLoggedInStudent(req);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student profile not found."
                });
            }

            studentId = student.student_id;
        }

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                a.attendance_id,
                a.session_id,
                a.student_id,
                a.status,
                a.scanned_at,

                s.user_id,
                s.register_number AS student_code,
                s.register_number,
                s.name AS student_name,
                s.email,
                s.department,
                s.year,
                s.section,

                ats.subject_id,
                ats.staff_id,
                ats.class_id,
                ats.academic_year,
                ats.semester,
                ats.session_date,
                ats.start_time,
                ats.end_time,

                sub.subject_code,
                sub.subject_name

            FROM attendance a

            INNER JOIN students s
                ON s.student_id = a.student_id

            INNER JOIN attendance_sessions ats
                ON ats.session_id = a.session_id

            LEFT JOIN subjects sub
                ON sub.subject_id = ats.subject_id

            WHERE a.student_id = ?

            ORDER BY
                ats.session_date DESC,
                a.scanned_at DESC
            `,
            [studentId]
        );

        return res.json({
            success: true,
            attendance: rows,
            records: rows,
            data: rows
        });

    } catch (error) {
        console.error(
            "getAttendanceByStudent error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load student attendance.",
            error: error.message
        });
    }
};


// =====================================================
// GET MY ATTENDANCE
//
// THIS IS THE ENDPOINT CURRENTLY FAILING:
//
// GET /api/attendance/my
// =====================================================

const getMyAttendance = async (req, res) => {
    try {
        const student =
            await getLoggedInStudent(req);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                a.attendance_id,
                a.session_id,
                a.student_id,
                a.status,
                a.scanned_at,

                s.user_id,
                s.register_number AS student_code,
                s.register_number,
                s.name AS student_name,
                s.email,
                s.department,
                s.year,
                s.section,

                ats.subject_id,
                ats.staff_id,
                ats.class_id,
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

            INNER JOIN attendance_sessions ats
                ON ats.session_id = a.session_id

            LEFT JOIN subjects sub
                ON sub.subject_id = ats.subject_id

            WHERE a.student_id = ?

            ORDER BY
                ats.session_date DESC,
                a.scanned_at DESC
            `,
            [student.student_id]
        );

        return res.json({
            success: true,

            // Main response used by frontend
            attendance: rows,

            // Compatibility aliases
            records: rows,
            attendance_records: rows,
            data: rows,

            // Logged-in student information
            student: {
                student_id: student.student_id,
                user_id: student.user_id,
                student_code: student.student_code,
                register_number: student.register_number,
                name: student.name,
                email: student.email,
                department: student.department,
                year: student.year,
                section: student.section
            }
        });

    } catch (error) {
        console.error(
            "getMyAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load your attendance.",
            error: error.message
        });
    }
};


// =====================================================
// MARK ATTENDANCE
// =====================================================

const markAttendance = async (req, res) => {
    try {
        const {
            session_id,
            sessionId,
            student_id,
            studentId,
            status = "present"
        } = req.body;

        const finalSessionId =
            session_id ?? sessionId;

        let finalStudentId =
            student_id ?? studentId;

        if (!finalSessionId) {
            return res.status(400).json({
                success: false,
                message: "session_id is required."
            });
        }

        // -------------------------------------------------
        // STUDENT
        // -------------------------------------------------

        if (getUserRole(req) === "student") {
            const student =
                await getLoggedInStudent(req);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student profile not found."
                });
            }

            finalStudentId = student.student_id;

            const session =
                await getSessionAllocation(
                    finalSessionId
                );

            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: "Attendance session not found."
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
                    message: validation.message
                });
            }
        }

        if (!finalStudentId) {
            return res.status(400).json({
                success: false,
                message: "student_id is required."
            });
        }

        // -------------------------------------------------
        // CHECK SESSION
        // -------------------------------------------------

        const session =
            await getSessionAllocation(
                finalSessionId
            );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        // -------------------------------------------------
        // CHECK STAFF
        // -------------------------------------------------

        if (
            getUserRole(req) === "staff" ||
            getUserRole(req) === "teacher"
        ) {
            const validation =
                await validateStaffForSession(
                    req,
                    session
                );

            if (!validation.valid) {
                return res.status(403).json({
                    success: false,
                    message: validation.message
                });
            }
        }

        // -------------------------------------------------
        // SESSION STATUS
        // -------------------------------------------------

        if (
            session.status &&
            normalize(session.status) !== "active"
        ) {
            return res.status(400).json({
                success: false,
                message: "This attendance session is no longer active."
            });
        }

        // -------------------------------------------------
        // DUPLICATE CHECK
        // -------------------------------------------------

        const [existing] = await db.query(
            `
            SELECT attendance_id
            FROM attendance
            WHERE session_id = ?
              AND student_id = ?
            LIMIT 1
            `,
            [
                finalSessionId,
                finalStudentId
            ]
        );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message: "Attendance has already been marked for this session.",
                attendance_id: existing[0].attendance_id
            });
        }

        // -------------------------------------------------
        // INSERT
        // -------------------------------------------------

        const [result] = await db.query(
            `
            INSERT INTO attendance
            (
                session_id,
                student_id,
                status,
                scanned_at
            )
            VALUES
            (?, ?, ?, NOW())
            `,
            [
                finalSessionId,
                finalStudentId,
                status
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Attendance marked successfully.",
            attendance_id: result.insertId
        });

    } catch (error) {
        console.error(
            "markAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to mark attendance.",
            error: error.message
        });
    }
};


// =====================================================
// SCAN ATTENDANCE
// =====================================================

const scanAttendance = async (req, res) => {
    try {
        const qrToken =
            extractQRToken(req);

        if (!qrToken) {
            return res.status(400).json({
                success: false,
                message: "QR token is required."
            });
        }

        const student =
            await getLoggedInStudent(req);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        // -------------------------------------------------
        // FIND SESSION BY QR TOKEN
        // -------------------------------------------------

        const [sessionRows] = await db.query(
            `
            SELECT
                session_id,
                allocation_id,
                subject_id,
                staff_id,
                class_id,
                academic_year,
                semester,
                session_date,
                start_time,
                end_time,
                status,
                qr_token,
                qr_expires_at

            FROM attendance_sessions

            WHERE qr_token = ?

            ORDER BY session_id DESC

            LIMIT 1
            `,
            [qrToken]
        );

        if (!sessionRows.length) {
            return res.status(404).json({
                success: false,
                message: "Invalid QR code."
            });
        }

        const session = sessionRows[0];

        // -------------------------------------------------
        // SESSION ACTIVE CHECK
        // -------------------------------------------------

        if (
            session.status &&
            normalize(session.status) !== "active"
        ) {
            return res.status(400).json({
                success: false,
                message: "This attendance session is closed."
            });
        }

        // -------------------------------------------------
        // QR EXPIRY CHECK
        // -------------------------------------------------

        if (session.qr_expires_at) {
            const expiry =
                new Date(session.qr_expires_at);

            if (
                !Number.isNaN(expiry.getTime()) &&
                expiry.getTime() < Date.now()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "This QR code has expired."
                });
            }
        }

        // -------------------------------------------------
        // STUDENT ELIGIBILITY
        // -------------------------------------------------

        const studentValidation =
            await validateStudentForSession(
                student,
                session
            );

        if (!studentValidation.valid) {
            return res.status(403).json({
                success: false,
                message: studentValidation.message
            });
        }

        // -------------------------------------------------
        // DUPLICATE CHECK
        // -------------------------------------------------

        const [existing] = await db.query(
            `
            SELECT
                attendance_id,
                session_id,
                student_id,
                status,
                scanned_at

            FROM attendance

            WHERE session_id = ?
              AND student_id = ?

            LIMIT 1
            `,
            [
                session.session_id,
                student.student_id
            ]
        );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message: "Attendance already marked for this session.",
                attendance: existing[0]
            });
        }

        // -------------------------------------------------
        // INSERT ATTENDANCE
        // -------------------------------------------------

        const [insertResult] = await db.query(
            `
            INSERT INTO attendance
            (
                session_id,
                student_id,
                status,
                scanned_at
            )
            VALUES
            (?, ?, 'present', NOW())
            `,
            [
                session.session_id,
                student.student_id
            ]
        );

        // -------------------------------------------------
        // READ BACK INSERTED RECORD
        // -------------------------------------------------

        const [attendanceRows] = await db.query(
            `
            SELECT
                a.attendance_id,
                a.session_id,
                a.student_id,
                a.status,
                a.scanned_at,

                s.user_id,
                s.register_number AS student_code,
                s.register_number,
                s.name AS student_name,
                s.email,
                s.department,
                s.year,
                s.section,

                ats.subject_id,
                ats.staff_id,
                ats.class_id,
                ats.session_date,
                ats.start_time,
                ats.end_time,

                sub.subject_code,
                sub.subject_name

            FROM attendance a

            INNER JOIN students s
                ON s.student_id = a.student_id

            INNER JOIN attendance_sessions ats
                ON ats.session_id = a.session_id

            LEFT JOIN subjects sub
                ON sub.subject_id = ats.subject_id

            WHERE a.attendance_id = ?

            LIMIT 1
            `,
            [insertResult.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Attendance marked successfully.",
            attendance: attendanceRows[0] || {
                attendance_id: insertResult.insertId,
                session_id: session.session_id,
                student_id: student.student_id,
                status: "present"
            }
        });

    } catch (error) {
        console.error(
            "scanAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to process attendance scan.",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE ATTENDANCE
// =====================================================

const updateAttendance = async (req, res) => {
    try {
        const attendanceId =
            req.params.attendanceId ??
            req.params.id;

        const {
            status
        } = req.body;

        if (!attendanceId) {
            return res.status(400).json({
                success: false,
                message: "Attendance ID is required."
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Attendance status is required."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                a.attendance_id,
                a.session_id,

                ats.staff_id

            FROM attendance a

            INNER JOIN attendance_sessions ats
                ON ats.session_id = a.session_id

            WHERE a.attendance_id = ?

            LIMIT 1
            `,
            [attendanceId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found."
            });
        }

        const record = rows[0];

        const role = getUserRole(req);

        // -------------------------------------------------
        // STAFF AUTHORIZATION
        // -------------------------------------------------

        if (
            role === "staff" ||
            role === "teacher"
        ) {
            const staffId =
                await getLoggedInStaffId(req);

            if (
                !staffId ||
                Number(staffId) !==
                Number(record.staff_id)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update this attendance."
                });
            }
        }

        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

        await db.query(
            `
            UPDATE attendance

            SET status = ?

            WHERE attendance_id = ?
            `,
            [
                status,
                attendanceId
            ]
        );

        return res.json({
            success: true,
            message: "Attendance updated successfully."
        });

    } catch (error) {
        console.error(
            "updateAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update attendance.",
            error: error.message
        });
    }
};


// =====================================================
// DELETE ATTENDANCE
// =====================================================

const deleteAttendance = async (req, res) => {
    try {
        const attendanceId =
            req.params.attendanceId ??
            req.params.id;

        if (!attendanceId) {
            return res.status(400).json({
                success: false,
                message: "Attendance ID is required."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                attendance_id,
                session_id

            FROM attendance

            WHERE attendance_id = ?

            LIMIT 1
            `,
            [attendanceId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found."
            });
        }

        // -------------------------------------------------
        // DELETE
        // -------------------------------------------------

        await db.query(
            `
            DELETE FROM attendance
            WHERE attendance_id = ?
            `,
            [attendanceId]
        );

        return res.json({
            success: true,
            message: "Attendance deleted successfully."
        });

    } catch (error) {
        console.error(
            "deleteAttendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete attendance.",
            error: error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getMySubjectClasses,
    getMySubjectStudents,

    getAttendance,
    getAttendanceById,
    getAttendanceBySession,
    getAttendanceCountBySession,
    getAttendanceByStudent,
    getMyAttendance,

    markAttendance,
    scanAttendance,

    updateAttendance,
    deleteAttendance
};