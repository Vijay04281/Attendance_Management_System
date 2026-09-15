const db = require("../config/db");

// =====================================================
// ATTENDANCE SESSION CONTROLLER
// =====================================================
//
// DATABASE TABLES USED
//
// attendance_sessions
// ---------------------------------------------
// session_id
// subject_id
// staff_id
// allocation_id
// class_id
// academic_year
// session_date
// start_time
// end_time
// qr_token
// qr_expires_at
// status
//
// attendance
// ---------------------------------------------
// attendance_id
// session_id
// student_id
// scanned_at
// status
//
// attendance.status
// ---------------------------------------------
// PRESENT
// LATE
// ABSENT
//
// students
// ---------------------------------------------
// student_id
// user_id
// register_number
// name
// email
// department
// year
// section
//
// subjects
// ---------------------------------------------
// subject_id
// subject_code
// subject_name
// semester
//
// subject_allocations
// ---------------------------------------------
// allocation_id
// subject_id
// staff_id
// class_id
// academic_year
// department
// year
// semester
//
// classes
// ---------------------------------------------
// class_id
// department_id
// year
// section
//
// =====================================================


// =====================================================
// BASIC HELPERS
// =====================================================

const normalize = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim().toLowerCase();
};


const getUserId = (req) => {
    return (
        req.user?.user_id ||
        req.user?.id ||
        req.user?.userId ||
        null
    );
};


const getUserRole = (req) => {
    return normalize(
        req.user?.role ||
        req.user?.user_role ||
        req.user?.userRole
    ).toUpperCase();
};


// =====================================================
// STAFF HELPERS
// =====================================================

const getLoggedInStaff = async (req) => {
    const userId = getUserId(req);

    if (!userId) {
        return null;
    }

    const [rows] = await db.query(
        `
        SELECT
            st.staff_id,
            st.user_id,
            st.staff_code,
            u.username
        FROM staff st
        LEFT JOIN users u
            ON u.user_id = st.user_id
        WHERE st.user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    return rows.length ? rows[0] : null;
};


const getStaffIdFromRequest = async (req) => {
    const loggedStaff = await getLoggedInStaff(req);

    if (loggedStaff?.staff_id) {
        return loggedStaff.staff_id;
    }

    return (
        req.user?.staff_id ||
        req.user?.staffId ||
        null
    );
};


// =====================================================
// QR TOKEN
// =====================================================

const generateQRToken = () => {
    return (
        `${Date.now()}-` +
        `${Math.random().toString(36).substring(2, 15)}-` +
        `${Math.random().toString(36).substring(2, 15)}`
    );
};


// =====================================================
// DATE / TIME HELPERS
// =====================================================

const getTodayDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


const getCurrentTime = () => {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
};


const getExpiryDateTime = (minutes = 10) => {
    const date = new Date();

    date.setMinutes(date.getMinutes() + Number(minutes));

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${mins}:${seconds}`;
};


// =====================================================
// GET SESSION ALLOCATION
// =====================================================

const getSessionAllocation = async (sessionId) => {
    const [rows] = await db.query(
        `
        SELECT
            ats.session_id,
            ats.subject_id,
            ats.staff_id,
            ats.allocation_id,
            ats.class_id,
            ats.academic_year,
            ats.session_date,
            ats.start_time,
            ats.end_time,
            ats.qr_token,
            ats.qr_expires_at,
            ats.status,

            sa.allocation_id AS allocation_exists,
            sa.staff_id AS allocation_staff_id,
            sa.subject_id AS allocation_subject_id,
            sa.class_id AS allocation_class_id,
            sa.academic_year AS allocation_academic_year,
            sa.department AS allocation_department,
            sa.year AS allocation_year,
            sa.semester AS allocation_semester,

            sub.subject_code,
            sub.subject_name,
            sub.semester AS subject_semester,
            sub.department AS subject_department,
            sub.year AS subject_year,
            sub.section AS subject_section,

            c.department_id AS class_department_id,
            c.year AS class_year,
            c.section AS class_section,

            d.department_name,
            d.department_code

        FROM attendance_sessions ats

        LEFT JOIN subject_allocations sa
            ON sa.allocation_id = ats.allocation_id

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

    return rows.length ? rows[0] : null;
};


// =====================================================
// VALIDATE ALLOCATION
// =====================================================

const validateAllocation = (session, staffId) => {
    if (!session) {
        return {
            valid: false,
            message: "Attendance session not found."
        };
    }

    if (
        staffId &&
        Number(session.staff_id) !== Number(staffId)
    ) {
        return {
            valid: false,
            message: "You are not authorized to manage this session."
        };
    }

    if (
        session.allocation_id &&
        session.allocation_exists &&
        session.allocation_staff_id &&
        Number(session.allocation_staff_id) !== Number(staffId)
    ) {
        return {
            valid: false,
            message: "This subject allocation does not belong to you."
        };
    }

    return {
        valid: true
    };
};


// =====================================================
// GET STAFF SUBJECTS
// =====================================================

const getStaffSubjects = async (req, res) => {
    try {
        const staffId = await getStaffIdFromRequest(req);

        if (!staffId) {
            return res.status(401).json({
                success: false,
                message: "Staff account not found."
            });
        }

        const [rows] = await db.query(
            `
            SELECT DISTINCT
                sa.allocation_id,
                sa.subject_id,
                sa.staff_id,
                sa.class_id,
                sa.academic_year,
                sa.department,
                sa.year,
                sa.semester,

                sub.subject_code,
                sub.subject_name,
                sub.credits,
                sub.semester AS subject_semester,

                c.year AS class_year,
                c.section AS class_section,

                d.department_name,
                d.department_code

            FROM subject_allocations sa

            INNER JOIN subjects sub
                ON sub.subject_id = sa.subject_id

            LEFT JOIN classes c
                ON c.class_id = sa.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE sa.staff_id = ?

            ORDER BY
                sub.subject_name ASC,
                c.year ASC,
                c.section ASC
            `,
            [staffId]
        );

        return res.json({
            success: true,
            subjects: rows,
            allocations: rows,
            data: rows
        });

    } catch (error) {
        console.error(
            "getStaffSubjects error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load staff subjects.",
            error: error.message
        });
    }
};


// =====================================================
// GET STAFF TIMETABLE
// =====================================================

const getStaffTimetable = async (req, res) => {
    try {
        const staffId = await getStaffIdFromRequest(req);

        if (!staffId) {
            return res.status(401).json({
                success: false,
                message: "Staff account not found."
            });
        }

        let rows = [];

        try {
            const [result] = await db.query(
                `
                SELECT
                    t.*,
                    sub.subject_code,
                    sub.subject_name,
                    sub.semester,

                    c.year AS class_year,
                    c.section AS class_section,

                    d.department_name,
                    d.department_code

                FROM timetable t

                LEFT JOIN subjects sub
                    ON sub.subject_id = t.subject_id

                LEFT JOIN classes c
                    ON c.class_id = t.class_id

                LEFT JOIN departments d
                    ON d.department_id = c.department_id

                WHERE t.staff_id = ?

                ORDER BY
                    t.day_of_week ASC,
                    t.start_time ASC
                `,
                [staffId]
            );

            rows = result;

        } catch (timetableError) {
            console.warn(
                "Timetable query failed:",
                timetableError.message
            );

            rows = [];
        }

        return res.json({
            success: true,
            timetable: rows,
            data: rows
        });

    } catch (error) {
        console.error(
            "getStaffTimetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load staff timetable.",
            error: error.message
        });
    }
};


// =====================================================
// GET ACTIVE SESSION
// =====================================================

const getActiveSession = async (req, res) => {
    try {
        const staffId = await getStaffIdFromRequest(req);

        if (!staffId) {
            return res.status(401).json({
                success: false,
                message: "Staff account not found."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                ats.session_id,
                ats.subject_id,
                ats.staff_id,
                ats.allocation_id,
                ats.class_id,
                ats.academic_year,
                ats.session_date,
                ats.start_time,
                ats.end_time,
                ats.qr_token,
                ats.qr_expires_at,
                ats.status,

                sub.subject_code,
                sub.subject_name,
                sub.semester,

                sa.department AS allocation_department,
                sa.year AS allocation_year,
                sa.semester AS allocation_semester,

                c.year AS class_year,
                c.section AS class_section,

                d.department_name,
                d.department_code

            FROM attendance_sessions ats

            LEFT JOIN subjects sub
                ON sub.subject_id = ats.subject_id

            LEFT JOIN subject_allocations sa
                ON sa.allocation_id = ats.allocation_id

            LEFT JOIN classes c
                ON c.class_id = ats.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE ats.staff_id = ?
              AND UPPER(ats.status) = 'ACTIVE'

            ORDER BY ats.session_id DESC

            LIMIT 1
            `,
            [staffId]
        );

        if (!rows.length) {
            return res.json({
                success: true,
                active: false,
                session: null,
                data: null
            });
        }

        return res.json({
            success: true,
            active: true,
            session: rows[0],
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "getActiveSession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load active attendance session.",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL ATTENDANCE SESSIONS
// =====================================================

const getAttendanceSessions = async (req, res) => {
    try {
        const role = getUserRole(req);
        const staffId = await getStaffIdFromRequest(req);

        let sql = `
            SELECT
                ats.session_id,
                ats.subject_id,
                ats.staff_id,
                ats.allocation_id,
                ats.class_id,
                ats.academic_year,
                ats.session_date,
                ats.start_time,
                ats.end_time,
                ats.qr_token,
                ats.qr_expires_at,
                ats.status,

                sub.subject_code,
                sub.subject_name,
                sub.semester,

                sa.department AS allocation_department,
                sa.year AS allocation_year,
                sa.semester AS allocation_semester,

                c.year AS class_year,
                c.section AS class_section,

                d.department_name,
                d.department_code,

                COUNT(a.attendance_id) AS attendance_count,

                SUM(
                    CASE
                        WHEN a.status = 'PRESENT'
                        THEN 1
                        ELSE 0
                    END
                ) AS present_count,

                SUM(
                    CASE
                        WHEN a.status = 'LATE'
                        THEN 1
                        ELSE 0
                    END
                ) AS late_count,

                SUM(
                    CASE
                        WHEN a.status = 'ABSENT'
                        THEN 1
                        ELSE 0
                    END
                ) AS absent_count

            FROM attendance_sessions ats

            LEFT JOIN subjects sub
                ON sub.subject_id = ats.subject_id

            LEFT JOIN subject_allocations sa
                ON sa.allocation_id = ats.allocation_id

            LEFT JOIN classes c
                ON c.class_id = ats.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            LEFT JOIN attendance a
                ON a.session_id = ats.session_id
        `;

        const params = [];

        if (
            role === "STAFF" ||
            role === "TEACHER"
        ) {
            if (!staffId) {
                return res.status(401).json({
                    success: false,
                    message: "Staff account not found."
                });
            }

            sql += `
                WHERE ats.staff_id = ?
            `;

            params.push(staffId);
        }

        sql += `
            GROUP BY
                ats.session_id,
                ats.subject_id,
                ats.staff_id,
                ats.allocation_id,
                ats.class_id,
                ats.academic_year,
                ats.session_date,
                ats.start_time,
                ats.end_time,
                ats.qr_token,
                ats.qr_expires_at,
                ats.status,
                sub.subject_code,
                sub.subject_name,
                sub.semester,
                sa.department,
                sa.year,
                sa.semester,
                c.year,
                c.section,
                d.department_name,
                d.department_code

            ORDER BY
                ats.session_date DESC,
                ats.start_time DESC
        `;

        const [rows] = await db.query(
            sql,
            params
        );

        return res.json({
            success: true,
            sessions: rows,
            data: rows
        });

    } catch (error) {
        console.error(
            "getAttendanceSessions error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load attendance sessions.",
            error: error.message
        });
    }
};


// =====================================================
// GET SESSION BY ID
// =====================================================

const getAttendanceSessionById = async (req, res) => {
    try {
        const sessionId = Number(req.params.id);

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                ats.session_id,
                ats.subject_id,
                ats.staff_id,
                ats.allocation_id,
                ats.class_id,
                ats.academic_year,
                ats.session_date,
                ats.start_time,
                ats.end_time,
                ats.qr_token,
                ats.qr_expires_at,
                ats.status,

                sub.subject_code,
                sub.subject_name,
                sub.semester,

                sa.department AS allocation_department,
                sa.year AS allocation_year,
                sa.semester AS allocation_semester,

                c.year AS class_year,
                c.section AS class_section,

                d.department_name,
                d.department_code

            FROM attendance_sessions ats

            LEFT JOIN subjects sub
                ON sub.subject_id = ats.subject_id

            LEFT JOIN subject_allocations sa
                ON sa.allocation_id = ats.allocation_id

            LEFT JOIN classes c
                ON c.class_id = ats.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE ats.session_id = ?

            LIMIT 1
            `,
            [sessionId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        return res.json({
            success: true,
            session: rows[0],
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "getAttendanceSessionById error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load attendance session.",
            error: error.message
        });
    }
};


// =====================================================
// CREATE ATTENDANCE SESSION
// =====================================================

const createAttendanceSession = async (req, res) => {
    try {
        const staffId = await getStaffIdFromRequest(req);

        if (!staffId) {
            return res.status(401).json({
                success: false,
                message: "Staff account not found."
            });
        }

        const {
            subject_id,
            allocation_id,
            class_id,
            academic_year,
            session_date,
            start_time,
            qr_expires_minutes
        } = req.body;

        if (!subject_id) {
            return res.status(400).json({
                success: false,
                message: "subject_id is required."
            });
        }

        let allocation = null;

        if (allocation_id) {
            const [allocationRows] = await db.query(
                `
                SELECT
                    *
                FROM subject_allocations
                WHERE allocation_id = ?
                  AND staff_id = ?
                LIMIT 1
                `,
                [
                    allocation_id,
                    staffId
                ]
            );

            if (!allocationRows.length) {
                return res.status(403).json({
                    success: false,
                    message: "Subject allocation not found for this staff member."
                });
            }

            allocation = allocationRows[0];
        }

        const finalClassId =
            class_id ||
            allocation?.class_id ||
            null;

        const finalAcademicYear =
            academic_year ||
            allocation?.academic_year ||
            null;

        // -------------------------------------------------
        // Prevent multiple active sessions for same staff
        // -------------------------------------------------

        const [activeRows] = await db.query(
            `
            SELECT
                session_id
            FROM attendance_sessions
            WHERE staff_id = ?
              AND UPPER(status) = 'ACTIVE'
            LIMIT 1
            `,
            [staffId]
        );

        if (activeRows.length) {
            return res.status(409).json({
                success: false,
                message: "You already have an active attendance session.",
                session_id: activeRows[0].session_id
            });
        }

        const finalDate =
            session_date ||
            getTodayDate();

        const finalStartTime =
            start_time ||
            getCurrentTime();

        const qrToken = generateQRToken();

        const expiryMinutes =
            Number(qr_expires_minutes) > 0
                ? Number(qr_expires_minutes)
                : 10;

        const qrExpiresAt =
            getExpiryDateTime(expiryMinutes);

        const [result] = await db.query(
            `
            INSERT INTO attendance_sessions
            (
                subject_id,
                staff_id,
                allocation_id,
                class_id,
                academic_year,
                session_date,
                start_time,
                qr_token,
                qr_expires_at,
                status
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                'ACTIVE'
            )
            `,
            [
                subject_id,
                staffId,
                allocation_id || null,
                finalClassId,
                finalAcademicYear,
                finalDate,
                finalStartTime,
                qrToken,
                qrExpiresAt
            ]
        );

        const sessionId =
            result.insertId;

        const [sessionRows] = await db.query(
            `
            SELECT
                ats.*,

                sub.subject_code,
                sub.subject_name,
                sub.semester,

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

        return res.status(201).json({
            success: true,
            message: "Attendance session created successfully.",
            session: sessionRows[0],
            data: sessionRows[0]
        });

    } catch (error) {
        console.error(
            "createAttendanceSession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create attendance session.",
            error: error.message
        });
    }
};


// =====================================================
// GET QR
// =====================================================

const getAttendanceSessionQR = async (req, res) => {
    try {
        const sessionId = Number(req.params.id);

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                session_id,
                subject_id,
                staff_id,
                class_id,
                qr_token,
                qr_expires_at,
                status
            FROM attendance_sessions
            WHERE session_id = ?
            LIMIT 1
            `,
            [sessionId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        const session = rows[0];

        if (
            normalize(session.status) !==
            "active"
        ) {
            return res.status(400).json({
                success: false,
                message: "Attendance session is not active."
            });
        }

        return res.json({
            success: true,
            session_id: session.session_id,
            qr_token: session.qr_token,
            qr_expires_at: session.qr_expires_at,
            data: {
                session_id: session.session_id,
                qr_token: session.qr_token,
                qr_expires_at: session.qr_expires_at
            }
        });

    } catch (error) {
        console.error(
            "getAttendanceSessionQR error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load QR code.",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE SESSION
// =====================================================

const updateAttendanceSession = async (req, res) => {
    try {
        const sessionId = Number(req.params.id);

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID."
            });
        }

        const {
            subject_id,
            allocation_id,
            class_id,
            academic_year,
            session_date,
            start_time,
            end_time,
            status
        } = req.body;

        const fields = [];
        const values = [];

        if (subject_id !== undefined) {
            fields.push("subject_id = ?");
            values.push(subject_id);
        }

        if (allocation_id !== undefined) {
            fields.push("allocation_id = ?");
            values.push(allocation_id);
        }

        if (class_id !== undefined) {
            fields.push("class_id = ?");
            values.push(class_id);
        }

        if (academic_year !== undefined) {
            fields.push("academic_year = ?");
            values.push(academic_year);
        }

        if (session_date !== undefined) {
            fields.push("session_date = ?");
            values.push(session_date);
        }

        if (start_time !== undefined) {
            fields.push("start_time = ?");
            values.push(start_time);
        }

        if (end_time !== undefined) {
            fields.push("end_time = ?");
            values.push(end_time);
        }

        if (status !== undefined) {
            const normalizedStatus =
                String(status).toUpperCase();

            if (
                ![
                    "ACTIVE",
                    "CLOSED"
                ].includes(normalizedStatus)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid session status."
                });
            }

            fields.push("status = ?");
            values.push(normalizedStatus);
        }

        if (!fields.length) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update."
            });
        }

        values.push(sessionId);

        const [result] = await db.query(
            `
            UPDATE attendance_sessions
            SET ${fields.join(", ")}
            WHERE session_id = ?
            `,
            values
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        const [rows] = await db.query(
            `
            SELECT *
            FROM attendance_sessions
            WHERE session_id = ?
            LIMIT 1
            `,
            [sessionId]
        );

        return res.json({
            success: true,
            message: "Attendance session updated successfully.",
            session: rows[0],
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "updateAttendanceSession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update attendance session.",
            error: error.message
        });
    }
};


// =====================================================
// CLOSE ATTENDANCE SESSION
//
// IMPORTANT:
// When a session is closed:
//
// 1. Existing PRESENT records remain PRESENT.
// 2. Existing LATE records remain LATE.
// 3. Students who are eligible for the session but have
//    no attendance record are inserted as ABSENT.
// 4. Duplicate attendance records are prevented.
// 5. Session status becomes CLOSED.
//
// =====================================================

const closeAttendanceSession = async (req, res) => {
    let connection;

    try {
        const sessionId = Number(req.params.id);

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID."
            });
        }

        const staffId =
            await getStaffIdFromRequest(req);

        if (!staffId) {
            return res.status(401).json({
                success: false,
                message: "Staff account not found."
            });
        }

        // -------------------------------------------------
        // Get a dedicated DB connection so the operation
        // can be handled as one transaction.
        // -------------------------------------------------

        connection =
            await db.getConnection();

        await connection.beginTransaction();

        // -------------------------------------------------
        // 1. Get session
        // -------------------------------------------------

        const [sessionRows] =
            await connection.query(
                `
                SELECT
                    ats.session_id,
                    ats.subject_id,
                    ats.staff_id,
                    ats.allocation_id,
                    ats.class_id,
                    ats.academic_year,
                    ats.session_date,
                    ats.start_time,
                    ats.end_time,
                    ats.status,

                    sa.department AS allocation_department,
                    sa.year AS allocation_year,
                    sa.semester AS allocation_semester,

                    sub.department AS subject_department,
                    sub.year AS subject_year,
                    sub.section AS subject_section,
                    sub.semester AS subject_semester,

                    c.department_id AS class_department_id,
                    c.year AS class_year,
                    c.section AS class_section,

                    d.department_name,
                    d.department_code

                FROM attendance_sessions ats

                LEFT JOIN subject_allocations sa
                    ON sa.allocation_id = ats.allocation_id

                LEFT JOIN subjects sub
                    ON sub.subject_id = ats.subject_id

                LEFT JOIN classes c
                    ON c.class_id = ats.class_id

                LEFT JOIN departments d
                    ON d.department_id = c.department_id

                WHERE ats.session_id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [sessionId]
            );

        if (!sessionRows.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        const session =
            sessionRows[0];

        // -------------------------------------------------
        // 2. Check staff ownership
        // -------------------------------------------------

        if (
            Number(session.staff_id) !==
            Number(staffId)
        ) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to close this attendance session."
            });
        }

        // -------------------------------------------------
        // 3. If already closed, do not insert duplicates.
        // -------------------------------------------------

        if (
            normalize(session.status) ===
            "closed"
        ) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "Attendance session is already closed."
            });
        }

        // -------------------------------------------------
        // 4. Find eligible students
        //
        // Primary method:
        // attendance_sessions.class_id
        //
        // classes:
        // department_id + year + section
        //
        // students:
        // department + year + section
        //
        // The department name is matched through the
        // departments table.
        // -------------------------------------------------

        let eligibleStudents = [];

        if (session.class_id) {
            const [studentRows] =
                await connection.query(
                    `
                    SELECT
                        s.student_id,
                        s.user_id,
                        s.register_number,
                        s.name,
                        s.email,
                        s.department,
                        s.year,
                        s.section

                    FROM students s

                    INNER JOIN classes c
                        ON c.class_id = ?

                    INNER JOIN departments d
                        ON d.department_id = c.department_id

                    WHERE
                        (
                            LOWER(TRIM(s.department)) =
                            LOWER(TRIM(d.department_name))
                        )
                        AND s.year = c.year
                        AND LOWER(TRIM(s.section)) =
                            LOWER(TRIM(c.section))

                    ORDER BY
                        s.register_number ASC
                    `,
                    [session.class_id]
                );

            eligibleStudents =
                studentRows;
        } else {
            // -------------------------------------------------
            // Fallback when the session has no class_id.
            //
            // Use subject allocation department/year.
            // Section is used when subject.section exists.
            // -------------------------------------------------

            const department =
                session.allocation_department ||
                session.subject_department ||
                null;

            const year =
                session.allocation_year ||
                session.subject_year ||
                null;

            const section =
                session.subject_section ||
                null;

            if (department && year) {
                let sql = `
                    SELECT
                        s.student_id,
                        s.user_id,
                        s.register_number,
                        s.name,
                        s.email,
                        s.department,
                        s.year,
                        s.section

                    FROM students s

                    WHERE
                        LOWER(TRIM(s.department)) =
                        LOWER(TRIM(?))

                        AND s.year = ?
                `;

                const params = [
                    department,
                    year
                ];

                if (section) {
                    sql += `
                        AND LOWER(TRIM(s.section)) =
                        LOWER(TRIM(?))
                    `;

                    params.push(section);
                }

                sql += `
                    ORDER BY
                        s.register_number ASC
                `;

                const [studentRows] =
                    await connection.query(
                        sql,
                        params
                    );

                eligibleStudents =
                    studentRows;
            }
        }

        // -------------------------------------------------
        // 5. If no students were found, do NOT blindly
        //    close and create incorrect ABSENT records.
        // -------------------------------------------------

        if (!eligibleStudents.length) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "No eligible students were found for this attendance session. Attendance session was not closed.",
                session_id: sessionId,
                class_id: session.class_id || null
            });
        }

        // -------------------------------------------------
        // 6. Get existing attendance records.
        //
        // We only need student_id because the purpose here
        // is to find students who already attended.
        // -------------------------------------------------

        const [existingAttendance] =
            await connection.query(
                `
                SELECT
                    attendance_id,
                    student_id,
                    status
                FROM attendance
                WHERE session_id = ?
                `,
                [sessionId]
            );

        const existingStudentIds =
            new Set(
                existingAttendance.map(
                    (row) =>
                        Number(row.student_id)
                )
            );

        // -------------------------------------------------
        // 7. Find students who have no attendance record.
        // -------------------------------------------------

        const absentStudents =
            eligibleStudents.filter(
                (student) =>
                    !existingStudentIds.has(
                        Number(student.student_id)
                    )
            );

        // -------------------------------------------------
        // 8. Insert ABSENT records.
        //
        // INSERT IGNORE is intentionally used together
        // with the NOT EXISTS check below.
        //
        // This protects against duplicate records if a
        // unique index exists for session_id + student_id.
        // -------------------------------------------------

        let absentInserted = 0;

        for (const student of absentStudents) {
            const [insertResult] =
                await connection.query(
                    `
                    INSERT INTO attendance
                    (
                        session_id,
                        student_id,
                        status
                    )
                    SELECT
                        ?,
                        ?,
                        'ABSENT'
                    FROM DUAL

                    WHERE NOT EXISTS
                    (
                        SELECT 1
                        FROM attendance
                        WHERE session_id = ?
                          AND student_id = ?
                    )
                    `,
                    [
                        sessionId,
                        student.student_id,
                        sessionId,
                        student.student_id
                    ]
                );

            absentInserted +=
                insertResult.affectedRows;
        }

        // -------------------------------------------------
        // 9. Close the session.
        // -------------------------------------------------

        const finalEndTime =
            req.body?.end_time ||
            getCurrentTime();

        await connection.query(
            `
            UPDATE attendance_sessions
            SET
                status = 'CLOSED',
                end_time = ?
            WHERE session_id = ?
            `,
            [
                finalEndTime,
                sessionId
            ]
        );

        // -------------------------------------------------
        // 10. Get final attendance statistics.
        // -------------------------------------------------

        const [summaryRows] =
            await connection.query(
                `
                SELECT
                    COUNT(*) AS total_records,

                    SUM(
                        CASE
                            WHEN status = 'PRESENT'
                            THEN 1
                            ELSE 0
                        END
                    ) AS present_count,

                    SUM(
                        CASE
                            WHEN status = 'LATE'
                            THEN 1
                            ELSE 0
                        END
                    ) AS late_count,

                    SUM(
                        CASE
                            WHEN status = 'ABSENT'
                            THEN 1
                            ELSE 0
                        END
                    ) AS absent_count

                FROM attendance

                WHERE session_id = ?
                `,
                [sessionId]
            );

        const summary =
            summaryRows[0] || {
                total_records: 0,
                present_count: 0,
                late_count: 0,
                absent_count: 0
            };

        // -------------------------------------------------
        // 11. Get final session.
        // -------------------------------------------------

        const [finalSessionRows] =
            await connection.query(
                `
                SELECT
                    ats.*,

                    sub.subject_code,
                    sub.subject_name,
                    sub.semester,

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
                    ON d.department_id =
                        c.department_id

                WHERE ats.session_id = ?

                LIMIT 1
                `,
                [sessionId]
            );

        await connection.commit();

        return res.json({
            success: true,

            message:
                "Attendance session closed successfully. Absent students were marked automatically.",

            session:
                finalSessionRows[0] || null,

            summary: {
                total_students:
                    eligibleStudents.length,

                already_marked:
                    existingAttendance.length,

                absent_inserted:
                    absentInserted,

                total_records:
                    Number(
                        summary.total_records || 0
                    ),

                present_count:
                    Number(
                        summary.present_count || 0
                    ),

                late_count:
                    Number(
                        summary.late_count || 0
                    ),

                absent_count:
                    Number(
                        summary.absent_count || 0
                    )
            },

            data:
                finalSessionRows[0] || null
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

        console.error(
            "closeAttendanceSession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to close attendance session.",
            error: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// =====================================================
// DELETE SESSION
// =====================================================

const deleteAttendanceSession = async (req, res) => {
    let connection;

    try {
        const sessionId =
            Number(req.params.id);

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID."
            });
        }

        connection =
            await db.getConnection();

        await connection.beginTransaction();

        // Delete attendance first because it references
        // the attendance session.

        await connection.query(
            `
            DELETE FROM attendance
            WHERE session_id = ?
            `,
            [sessionId]
        );

        const [result] =
            await connection.query(
                `
                DELETE FROM attendance_sessions
                WHERE session_id = ?
                `,
                [sessionId]
            );

        if (!result.affectedRows) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found."
            });
        }

        await connection.commit();

        return res.json({
            success: true,
            message:
                "Attendance session deleted successfully."
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

        console.error(
            "deleteAttendanceSession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete attendance session.",
            error: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getStaffSubjects,
    getStaffTimetable,
    getActiveSession,
    getAttendanceSessions,
    getAttendanceSessionById,
    createAttendanceSession,
    getAttendanceSessionQR,
    updateAttendanceSession,
    closeAttendanceSession,
    deleteAttendanceSession
};