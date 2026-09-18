const db = require("../config/db");
const crypto = require("crypto");
const QRCode = require("qrcode");

// =====================================================
// CONFIGURATION
// =====================================================

// QR changes every 15 seconds.
const QR_EXPIRY_SECONDS = 15;

// =====================================================
// HELPER - GET LOGGED IN STAFF ID
// =====================================================

const getLoggedInStaffId = (req) => {
    return (
        req.user?.staff_id ??
        req.user?.staffId ??
        req.user?.user_id ??
        req.user?.id ??
        req.user?.uid ??
        null
    );
};

// =====================================================
// HELPER - RESOLVE STAFF ID
// =====================================================

const resolveStaffId = async (
    req,
    providedStaffId = null
) => {
    try {
        const loggedInId =
            getLoggedInStaffId(req);

        const candidateIds = [
            providedStaffId,
            loggedInId
        ]
            .filter(
                (value) =>
                    value !== null &&
                    value !== undefined &&
                    value !== ""
            )
            .map(Number)
            .filter(Number.isInteger);

        if (candidateIds.length === 0) {
            return null;
        }

        // -------------------------------------------------
        // First: check explicit staff_id
        // -------------------------------------------------

        for (const id of candidateIds) {
            const [rows] =
                await db.query(
                    `
                    SELECT staff_id
                    FROM staff
                    WHERE staff_id = ?
                    LIMIT 1
                    `,
                    [id]
                );

            if (rows.length > 0) {
                return Number(
                    rows[0].staff_id
                );
            }
        }

        // -------------------------------------------------
        // Second: check user_id
        // -------------------------------------------------

        for (const id of candidateIds) {
            const [rows] =
                await db.query(
                    `
                    SELECT staff_id
                    FROM staff
                    WHERE user_id = ?
                    LIMIT 1
                    `,
                    [id]
                );

            if (rows.length > 0) {
                return Number(
                    rows[0].staff_id
                );
            }
        }

        return null;
    } catch (error) {
        console.error(
            "resolveStaffId error:",
            error
        );

        throw error;
    }
};

// =====================================================
// HELPER - GENERATE NEW QR TOKEN
// =====================================================

const generateQRToken = () => {
    return crypto
        .randomBytes(32)
        .toString("hex");
};

// =====================================================
// HELPER - GET QR EXPIRY
// =====================================================

const getQRExpiryDate = () => {
    return new Date(
        Date.now() +
        QR_EXPIRY_SECONDS * 1000
    );
};

// =====================================================
// HELPER - FORMAT MYSQL DATETIME
// =====================================================

const formatMySQLDateTime = (date) => {
    const value = new Date(date);

    const pad = (number) =>
        String(number).padStart(2, "0");

    return (
        `${value.getFullYear()}-` +
        `${pad(value.getMonth() + 1)}-` +
        `${pad(value.getDate())} ` +
        `${pad(value.getHours())}:` +
        `${pad(value.getMinutes())}:` +
        `${pad(value.getSeconds())}`
    );
};

// =====================================================
// HELPER - BUILD QR DATA
// =====================================================

const buildQRData = (
    session,
    qrToken
) => {
    return JSON.stringify({
        session_id:
            session.session_id,

        qr_token:
            qrToken,

        allocation_id:
            session.allocation_id,

        subject_id:
            session.subject_id,

        staff_id:
            session.staff_id,

        class_id:
            session.class_id,

        academic_year:
            session.academic_year,

        semester:
            session.allocation_semester,

        session_date:
            session.session_date
    });
};

// =====================================================
// HELPER - GENERATE QR IMAGE
// =====================================================

const generateQRCodeImage = async (
    session,
    qrToken
) => {
    const qrData =
        buildQRData(
            session,
            qrToken
        );

    return await QRCode.toDataURL(
        qrData,
        {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 500
        }
    );
};

// =====================================================
// HELPER - SESSION SELECT
// =====================================================

const sessionSelect = `
    SELECT
        ats.session_id,
        ats.subject_id,
        ats.staff_id,
        ats.allocation_id,

        COALESCE(
            ats.class_id,
            sa.class_id
        ) AS class_id,

        COALESCE(
            ats.academic_year,
            sa.academic_year
        ) AS academic_year,

        sa.department AS allocation_department,
        sa.year AS allocation_year,
        sa.semester AS allocation_semester,

        ats.session_date,
        ats.start_time,
        ats.end_time,
        ats.qr_token,
        ats.qr_expires_at,
        ats.status,
        ats.created_at,

        s.subject_code,
        s.subject_name,
        s.department AS subject_department,
        s.year AS subject_year,
        s.credits AS subject_credits,
        s.semester AS subject_semester,
        s.section AS subject_section,

        st.staff_id AS actual_staff_id,
        st.staff_code,
        st.name AS staff_name,

        c.year AS class_year,
        c.section AS class_section,
        c.department_id AS class_department_id,

        d.department_name,
        d.department_code

    FROM attendance_sessions ats

    LEFT JOIN subject_allocations sa
        ON ats.allocation_id =
           sa.allocation_id

    LEFT JOIN subjects s
        ON ats.subject_id =
           s.subject_id

    LEFT JOIN staff st
        ON ats.staff_id =
           st.staff_id

    LEFT JOIN classes c
        ON c.class_id =
           COALESCE(
               ats.class_id,
               sa.class_id
           )

    LEFT JOIN departments d
        ON c.department_id =
           d.department_id
`;

// =====================================================
// HELPER - ROTATE SESSION QR
//
// ALWAYS generates a new QR.
//
// Used when:
// 1. New attendance session starts.
// 2. QR expires.
// 3. Student successfully scans.
// 4. Teacher forces refresh.
// =====================================================

const rotateSessionQR = async (
    sessionId,
    connection = db
) => {
    const [rows] =
        await connection.query(
            `
            ${sessionSelect}
            WHERE ats.session_id = ?
            LIMIT 1
            `,
            [sessionId]
        );

    if (rows.length === 0) {
        throw new Error(
            "Attendance session not found."
        );
    }

    const session =
        rows[0];

    if (
        String(
            session.status || ""
        ).toUpperCase() !==
        "ACTIVE"
    ) {
        throw new Error(
            "Attendance session is not active."
        );
    }

    const newQrToken =
        generateQRToken();

    const newExpiryDate =
        getQRExpiryDate();

    const newExpiry =
        formatMySQLDateTime(
            newExpiryDate
        );

    const [updateResult] =
        await connection.query(
            `
            UPDATE attendance_sessions
            SET
                qr_token = ?,
                qr_expires_at = ?
            WHERE session_id = ?
              AND status = 'ACTIVE'
            `,
            [
                newQrToken,
                newExpiry,
                sessionId
            ]
        );

    if (
        updateResult.affectedRows === 0
    ) {
        throw new Error(
            "Unable to update attendance session QR token."
        );
    }

    session.qr_token =
        newQrToken;

    session.qr_expires_at =
        newExpiry;

    const qrCode =
        await generateQRCodeImage(
            session,
            newQrToken
        );

    return {
        session,

        qrCode,

        qrToken:
            newQrToken,

        qrExpiresAt:
            newExpiry,

        qrExpired: false
    };
};

// =====================================================
// HELPER - GET CURRENT QR
// =====================================================

const getCurrentOrRotateSessionQR = async (
    sessionId,
    connection = db,
    forceRefresh = false
) => {
    const [rows] =
        await connection.query(
            `
            ${sessionSelect}
            WHERE ats.session_id = ?
            LIMIT 1
            `,
            [sessionId]
        );

    if (rows.length === 0) {
        throw new Error(
            "Attendance session not found."
        );
    }

    const session =
        rows[0];

    if (
        String(
            session.status || ""
        ).toUpperCase() !==
        "ACTIVE"
    ) {
        throw new Error(
            "Attendance session is not active."
        );
    }

    // -------------------------------------------------
    // FORCE NEW QR
    // -------------------------------------------------

    if (forceRefresh) {
        return await rotateSessionQR(
            sessionId,
            connection
        );
    }

    // -------------------------------------------------
    // NO TOKEN = GENERATE
    // -------------------------------------------------

    if (!session.qr_token) {
        return await rotateSessionQR(
            sessionId,
            connection
        );
    }

    // -------------------------------------------------
    // CHECK EXPIRY USING DATABASE TIME
    // -------------------------------------------------

    const [expiryRows] =
        await connection.query(
            `
            SELECT
                CASE
                    WHEN qr_expires_at IS NULL
                        THEN 1
                    WHEN qr_expires_at <= NOW()
                        THEN 1
                    ELSE 0
                END AS expired
            FROM attendance_sessions
            WHERE session_id = ?
            LIMIT 1
            `,
            [sessionId]
        );

    const expired =
        Number(
            expiryRows[0]?.expired || 0
        ) === 1;

    if (expired) {
        return await rotateSessionQR(
            sessionId,
            connection
        );
    }

    // -------------------------------------------------
    // EXISTING QR IS STILL VALID
    // -------------------------------------------------

    const qrCode =
        await generateQRCodeImage(
            session,
            session.qr_token
        );

    return {
        session,

        qrCode,

        qrToken:
            session.qr_token,

        qrExpiresAt:
            session.qr_expires_at,

        qrExpired: false
    };
};

// =====================================================
// HELPER - GENERATE QR DATA FOR EXISTING SESSION
// =====================================================

const generateSessionQR = async (
    session
) => {
    return await rotateSessionQR(
        session.session_id
    );
};

// =====================================================
// GET ALL ATTENDANCE SESSIONS
// =====================================================

const getAttendanceSessions = async (
    req,
    res
) => {
    try {
        const userRole =
            String(
                req.user?.role || ""
            ).toUpperCase();

        const requestedStaffId =
            req.query.staff_id ||
            req.query.staffId ||
            null;

        let query =
            sessionSelect;

        const params = [];
        const conditions = [];

        if (
            userRole === "STAFF" ||
            userRole === "TEACHER"
        ) {
            const staffId =
                await resolveStaffId(req);

            if (!staffId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Unable to determine logged-in staff."
                });
            }

            conditions.push(
                "ats.staff_id = ?"
            );

            params.push(
                staffId
            );
        }

        if (
            userRole === "ADMIN" ||
            userRole === "HOD"
        ) {
            if (requestedStaffId) {
                const staffId =
                    await resolveStaffId(
                        req,
                        requestedStaffId
                    );

                if (!staffId) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Staff member not found."
                    });
                }

                conditions.push(
                    "ats.staff_id = ?"
                );

                params.push(
                    staffId
                );
            }
        }

        if (req.query.subject_id) {
            const subjectId =
                Number(
                    req.query.subject_id
                );

            if (
                !Number.isInteger(
                    subjectId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid subject_id."
                });
            }

            conditions.push(
                "ats.subject_id = ?"
            );

            params.push(
                subjectId
            );
        }

        if (req.query.class_id) {
            const classId =
                Number(
                    req.query.class_id
                );

            if (
                !Number.isInteger(
                    classId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid class_id."
                });
            }

            conditions.push(`
                COALESCE(
                    ats.class_id,
                    sa.class_id
                ) = ?
            `);

            params.push(
                classId
            );
        }

        if (req.query.allocation_id) {
            const allocationId =
                Number(
                    req.query.allocation_id
                );

            if (
                !Number.isInteger(
                    allocationId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid allocation_id."
                });
            }

            conditions.push(
                "ats.allocation_id = ?"
            );

            params.push(
                allocationId
            );
        }

        if (req.query.status) {
            const status =
                String(
                    req.query.status
                ).toUpperCase();

            if (
                status !== "ACTIVE" &&
                status !== "CLOSED"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid status."
                });
            }

            conditions.push(
                "ats.status = ?"
            );

            params.push(
                status
            );
        }

        if (req.query.session_date) {
            conditions.push(
                "ats.session_date = ?"
            );

            params.push(
                req.query.session_date
            );
        }

        if (conditions.length > 0) {
            query += `
                WHERE ${conditions.join(
                    " AND "
                )}
            `;
        }

        query += `
            ORDER BY
                ats.session_date DESC,
                ats.start_time DESC,
                ats.session_id DESC
        `;

        const [rows] =
            await db.query(
                query,
                params
            );

        return res.json({
            success: true,
            count:
                rows.length,
            sessions:
                rows
        });
    } catch (error) {
        console.error(
            "getAttendanceSessions error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch attendance sessions.",
            error:
                error.message
        });
    }
};

// =====================================================
// GET SESSION BY ID
// =====================================================

const getAttendanceSessionById = async (
    req,
    res
) => {
    try {
        const sessionId =
            Number(
                req.params.id
            );

        if (
            !Number.isInteger(
                sessionId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid session ID."
            });
        }

        const userRole =
            String(
                req.user?.role || ""
            ).toUpperCase();

        let query = `
            ${sessionSelect}
            WHERE ats.session_id = ?
        `;

console.log(
    "SESSION ID:",
    sessionId
);


        const params = [
            sessionId
        ];

        if (
            userRole === "STAFF" ||
            userRole === "TEACHER"
        ) {
            const staffId =
                await resolveStaffId(req);

            if (!staffId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Unable to determine logged-in staff."
                });
            }

            query += `
                AND ats.staff_id = ?
            `;

            params.push(
                staffId
            );
        }

        const [rows] =
            await db.query(
                query,
                params
            );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found."
            });
        }

        return res.json({
            success: true,
            session:
                rows[0]
        });
    } catch (error) {
        console.error(
            "getAttendanceSessionById error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch attendance session.",
            error:
                error.message
        });
    }
};

// =====================================================
// GET STAFF SUBJECT ALLOCATIONS
// =====================================================

const getStaffSubjects = async (
    req,
    res
) => {
    try {
        const staffId =
            await resolveStaffId(req);

        if (!staffId) {
            return res.status(400).json({
                success: false,
                message:
                    "Unable to determine logged-in staff."
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT
                    sa.allocation_id,
                    sa.subject_id,
                    sa.staff_id,
                    sa.class_id,
                    sa.academic_year,
                    sa.department,
                    sa.year,
                    sa.semester,

                    s.subject_code,
                    s.subject_name,
                    s.department AS subject_department,
                    s.credits,
                    s.semester AS subject_semester,
                    s.section AS subject_section,

                    st.staff_code,
                    st.name AS staff_name,

                    c.year AS class_year,
                    c.section AS class_section,
                    c.department_id
                        AS class_department_id,

                    d.department_name,
                    d.department_code

                FROM subject_allocations sa

                INNER JOIN subjects s
                    ON sa.subject_id =
                       s.subject_id

                INNER JOIN staff st
                    ON sa.staff_id =
                       st.staff_id

                LEFT JOIN classes c
                    ON sa.class_id =
                       c.class_id

                LEFT JOIN departments d
                    ON c.department_id =
                       d.department_id

                WHERE sa.staff_id = ?

                ORDER BY
                    s.subject_name ASC,
                    sa.academic_year DESC,
                    c.year ASC,
                    c.section ASC,
                    sa.allocation_id DESC
                `,
                [staffId]
            );

        return res.json({
            success: true,
            count:
                rows.length,
            allocations:
                rows,
            subjects:
                rows
        });
    } catch (error) {
        console.error(
            "getStaffSubjects error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch staff subject allocations.",
            error:
                error.message
        });
    }
};

// =====================================================
// GET STAFF TIMETABLE
// =====================================================

const getStaffTimetable = async (
    req,
    res
) => {
    try {
        const staffId =
            await resolveStaffId(req);

        if (!staffId) {
            return res.status(400).json({
                success: false,
                message:
                    "Unable to determine logged-in staff."
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT
                    tt.timetable_id,

                    tt.class_id,
                    tt.subject_id,
                    tt.staff_id,

                    tt.day_of_week,
                    tt.start_time,
                    tt.end_time,

                    s.subject_code,
                    s.subject_name,
                    s.department
                        AS subject_department,
                    s.year AS subject_year,
                    s.semester
                        AS subject_semester,

                    st.staff_code,
                    st.name
                        AS staff_name,
                    st.email
                        AS staff_email,
                    st.phone
                        AS staff_phone,

                    c.year
                        AS class_year,
                    c.section
                        AS class_section,

                    c.department_id
                        AS class_department_id,

                    d.department_name,
                    d.department_code

                FROM timetables tt

                INNER JOIN subjects s
                    ON tt.subject_id =
                       s.subject_id

                INNER JOIN staff st
                    ON tt.staff_id =
                       st.staff_id

                INNER JOIN classes c
                    ON tt.class_id =
                       c.class_id

                LEFT JOIN departments d
                    ON c.department_id =
                       d.department_id

                WHERE tt.staff_id = ?

                ORDER BY
                    FIELD(
                        tt.day_of_week,
                        'MONDAY',
                        'TUESDAY',
                        'WEDNESDAY',
                        'THURSDAY',
                        'FRIDAY',
                        'SATURDAY'
                    ),
                    tt.start_time ASC,
                    s.subject_name ASC,
                    c.year ASC,
                    c.section ASC
                `,
                [staffId]
            );

        const timetable =
            rows.map(
                (row) => ({
                    timetable_id:
                        row.timetable_id,

                    staff_id:
                        row.staff_id,

                    staff_code:
                        row.staff_code,

                    staff_name:
                        row.staff_name,

                    subject_id:
                        row.subject_id,

                    subject_code:
                        row.subject_code,

                    subject_name:
                        row.subject_name,

                    subject_department:
                        row.subject_department,

                    subject_year:
                        row.subject_year,

                    subject_semester:
                        row.subject_semester,

                    class_id:
                        row.class_id,

                    class_year:
                        row.class_year,

                    class_section:
                        row.class_section,

                    department_id:
                        row.class_department_id,

                    department_name:
                        row.department_name,

                    department_code:
                        row.department_code,

                    day_of_week:
                        row.day_of_week,

                    start_time:
                        row.start_time,

                    end_time:
                        row.end_time
                })
            );

        const grouped = {
            MONDAY: [],
            TUESDAY: [],
            WEDNESDAY: [],
            THURSDAY: [],
            FRIDAY: [],
            SATURDAY: []
        };

        timetable.forEach(
            (entry) => {
                const day =
                    String(
                        entry.day_of_week ||
                        ""
                    ).toUpperCase();

                if (
                    Object.prototype.hasOwnProperty.call(
                        grouped,
                        day
                    )
                ) {
                    grouped[day].push(
                        entry
                    );
                }
            }
        );

        return res.json({
            success: true,

            staff_id:
                staffId,

            count:
                timetable.length,

            timetable,

            grouped
        });
    } catch (error) {
        console.error(
            "getStaffTimetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch staff timetable.",
            error:
                error.message
        });
    }
};

// =====================================================
// GET ACTIVE SESSION
// =====================================================

const getActiveSession = async (
    req,
    res
) => {
    try {
        const staffId =
            await resolveStaffId(req);

        if (!staffId) {
            return res.status(400).json({
                success: false,
                message:
                    "Unable to determine logged-in staff."
            });
        }

        let query = `
            ${sessionSelect}
            WHERE ats.staff_id = ?
              AND ats.status = 'ACTIVE'
        `;

        const params = [
            staffId
        ];

        if (req.query.subject_id) {
            const subjectId =
                Number(
                    req.query.subject_id
                );

            if (
                !Number.isInteger(
                    subjectId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid subject_id."
                });
            }

            query += `
                AND ats.subject_id = ?
            `;

            params.push(
                subjectId
            );
        }

        if (req.query.class_id) {
            const classId =
                Number(
                    req.query.class_id
                );

            if (
                !Number.isInteger(
                    classId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid class_id."
                });
            }

            query += `
                AND COALESCE(
                    ats.class_id,
                    sa.class_id
                ) = ?
            `;

            params.push(
                classId
            );
        }

        if (req.query.allocation_id) {
            const allocationId =
                Number(
                    req.query.allocation_id
                );

            if (
                !Number.isInteger(
                    allocationId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid allocation_id."
                });
            }

            query += `
                AND ats.allocation_id = ?
            `;

            params.push(
                allocationId
            );
        }

        query += `
            ORDER BY
                ats.session_id DESC
            LIMIT 1
        `;

        const [rows] =
            await db.query(
                query,
                params
            );

        if (rows.length === 0) {
            return res.json({
                success: true,
                active: false,
                session: null
            });
        }

        return res.json({
            success: true,
            active: true,
            session:
                rows[0]
        });
    } catch (error) {
        console.error(
            "getActiveSession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch active attendance session.",
            error:
                error.message
        });
    }
};

// =====================================================
// CREATE ATTENDANCE SESSION
// =====================================================

const createAttendanceSession = async (
    req,
    res
) => {
    let connection;

    try {
        connection =
            await db.getConnection();

        const userRole =
            String(
                req.user?.role || ""
            ).toUpperCase();

        let {
            allocation_id,
            subject_id,
            staff_id,
            class_id,
            academic_year,
            semester,
            session_date,
            start_time,
            end_time,
            qr_token,
            qr_expires_at,
            status
        } = req.body;

        if (
            allocation_id === undefined ||
            allocation_id === null ||
            allocation_id === ""
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "allocation_id is required when creating an attendance session."
            });
        }

        allocation_id =
            Number(
                allocation_id
            );

        if (
            !Number.isInteger(
                allocation_id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid allocation_id."
            });
        }

        if (
            subject_id !== undefined &&
            subject_id !== null &&
            subject_id !== ""
        ) {
            subject_id =
                Number(
                    subject_id
                );

            if (
                !Number.isInteger(
                    subject_id
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid subject_id."
                });
            }
        }

        const loggedInStaffId =
            await resolveStaffId(
                req,
                staff_id
            );

        if (!loggedInStaffId) {
            return res.status(400).json({
                success: false,
                message:
                    "Unable to determine staff member."
            });
        }

        if (
            userRole === "STAFF" ||
            userRole === "TEACHER"
        ) {
            const jwtStaffId =
                await resolveStaffId(
                    req
                );

            if (
                !jwtStaffId ||
                Number(jwtStaffId) !==
                Number(loggedInStaffId)
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You can only create attendance sessions for yourself."
                });
            }
        }

        const [allocationRows] =
            await connection.query(
                `
                SELECT
                    sa.allocation_id,
                    sa.subject_id,
                    sa.staff_id,
                    sa.class_id,
                    sa.academic_year,
                    sa.department,
                    sa.year,
                    sa.semester,

                    s.subject_code,
                    s.subject_name,
                    s.department
                        AS subject_department,

                    c.year AS class_year,
                    c.section AS class_section,
                    c.department_id
                        AS class_department_id,

                    d.department_name,
                    d.department_code

                FROM subject_allocations sa

                INNER JOIN subjects s
                    ON sa.subject_id =
                       s.subject_id

                LEFT JOIN classes c
                    ON sa.class_id =
                       c.class_id

                LEFT JOIN departments d
                    ON c.department_id =
                       d.department_id

                WHERE sa.allocation_id = ?

                LIMIT 1
                `,
                [allocation_id]
            );

        if (
            allocationRows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Subject allocation not found."
            });
        }

        const allocation =
            allocationRows[0];

        if (
            subject_id !== undefined &&
            Number(
                allocation.subject_id
            ) !== Number(
                subject_id
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "The selected subject does not belong to this allocation."
            });
        }

        subject_id =
            Number(
                allocation.subject_id
            );

        if (
            Number(
                allocation.staff_id
            ) !== Number(
                loggedInStaffId
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "This subject allocation does not belong to the logged-in staff member."
            });
        }

        if (
            allocation.class_id === null ||
            allocation.class_id === undefined
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "This subject allocation is not assigned to a class."
            });
        }

        const allocationClassId =
            Number(
                allocation.class_id
            );

        if (
            !Number.isInteger(
                allocationClassId
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Invalid class assigned to this subject allocation."
            });
        }

        if (
            class_id !== undefined &&
            class_id !== null &&
            class_id !== ""
        ) {
            class_id =
                Number(
                    class_id
                );

            if (
                !Number.isInteger(
                    class_id
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid class_id."
                });
            }

            if (
                class_id !==
                allocationClassId
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "The selected class does not match the subject allocation."
                });
            }
        }

        class_id =
            allocationClassId;

        if (
            academic_year === undefined ||
            academic_year === null ||
            academic_year === ""
        ) {
            academic_year =
                allocation.academic_year ||
                null;
        } else if (
            allocation.academic_year &&
            String(
                academic_year
            ) !==
            String(
                allocation.academic_year
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "The academic year does not match the subject allocation."
            });
        }

        if (
            semester === undefined ||
            semester === null ||
            semester === ""
        ) {
            semester =
                allocation.semester ||
                null;
        }

        if (!session_date) {
            const now =
                new Date();

            session_date =
                now.toISOString()
                    .split("T")[0];
        }

        if (!start_time) {
            const now =
                new Date();

            start_time =
                now.toTimeString()
                    .slice(0, 8);
        }

        status =
            String(
                status ||
                "ACTIVE"
            ).toUpperCase();

        if (
            status !== "ACTIVE" &&
            status !== "CLOSED"
        ) {
            status =
                "ACTIVE";
        }

        // -------------------------------------------------
        // EXISTING ACTIVE SESSION
        // -------------------------------------------------

        const [activeRows] =
            await connection.query(
                `
                SELECT session_id
                FROM attendance_sessions
                WHERE allocation_id = ?
                  AND session_date = ?
                  AND status = 'ACTIVE'
                ORDER BY session_id DESC
                LIMIT 1
                `,
                [
                    allocation_id,
                    session_date
                ]
            );

        if (
            activeRows.length > 0
        ) {
            const existingSessionId =
                Number(
                    activeRows[0]
                        .session_id
                );

            const [
                existingSessionRows
            ] =
                await connection.query(
                    `
                    ${sessionSelect}
                    WHERE ats.session_id = ?
                    LIMIT 1
                    `,
                    [existingSessionId]
                );

            if (
                existingSessionRows.length ===
                0
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "An active session exists but could not be loaded."
                });
            }

            const qrResult =
                await rotateSessionQR(
                    existingSessionId,
                    connection
                );

            return res.status(200).json({
                success: true,
                existing: true,

                message:
                    "An active attendance session already exists. Existing session loaded with a new QR code.",

                session:
                    qrResult.session,

                session_id:
                    qrResult.session
                        .session_id,

                qr_image:
                    qrResult.qrCode,

                qr_code:
                    qrResult.qrCode,

                qr_token:
                    qrResult.qrToken,

                qr_expires_at:
                    qrResult.qrExpiresAt,

                qr_expired: false
            });
        }

        // -------------------------------------------------
        // LEGACY ACTIVE SESSION
        // -------------------------------------------------

        const [legacyActiveRows] =
            await connection.query(
                `
                SELECT session_id
                FROM attendance_sessions
                WHERE staff_id = ?
                  AND subject_id = ?
                  AND class_id = ?
                  AND session_date = ?
                  AND status = 'ACTIVE'
                  AND (
                      allocation_id IS NULL
                      OR allocation_id <> ?
                  )
                ORDER BY session_id DESC
                LIMIT 1
                `,
                [
                    loggedInStaffId,
                    subject_id,
                    class_id,
                    session_date,
                    allocation_id
                ]
            );

        if (
            legacyActiveRows.length > 0
        ) {
            const existingSessionId =
                Number(
                    legacyActiveRows[0]
                        .session_id
                );

            const [
                existingSessionRows
            ] =
                await connection.query(
                    `
                    ${sessionSelect}
                    WHERE ats.session_id = ?
                    LIMIT 1
                    `,
                    [existingSessionId]
                );

            if (
                existingSessionRows.length ===
                0
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "An active legacy session exists but could not be loaded."
                });
            }

            const qrResult =
                await rotateSessionQR(
                    existingSessionId,
                    connection
                );

            return res.status(200).json({
                success: true,
                existing: true,

                message:
                    "An active attendance session already exists. Existing session loaded with a new QR code.",

                session:
                    qrResult.session,

                session_id:
                    qrResult.session
                        .session_id,

                qr_image:
                    qrResult.qrCode,

                qr_code:
                    qrResult.qrCode,

                qr_token:
                    qrResult.qrToken,

                qr_expires_at:
                    qrResult.qrExpiresAt,

                qr_expired: false
            });
        }

        // -------------------------------------------------
        // NEW QR
        // -------------------------------------------------

        qr_token =
            generateQRToken();

        const expiry =
            getQRExpiryDate();

        qr_expires_at =
            formatMySQLDateTime(
                expiry
            );

        await connection.beginTransaction();

        const [result] =
    await connection.query(
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
            end_time,
            qr_token,
            qr_expires_at,
            status
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            subject_id,
            loggedInStaffId,
            allocation_id,
            class_id,
            academic_year,
            session_date,
            start_time,
            end_time || null,
            qr_token,
            qr_expires_at,
            status
        ]
    );

console.log(
    "Created Session ID:",
    result.insertId
);

const [debugRows] =
    await connection.query(
        `
        SELECT
            session_id,
            status,
            start_time,
            end_time
        FROM attendance_sessions
        WHERE session_id = ?
        `,
        [result.insertId]
    );

console.log(
    "Inserted DB Row:",
    debugRows[0]
);

await connection.commit();
        const [createdRows] =
            await db.query(
                `
                ${sessionSelect}
                WHERE ats.session_id = ?
                LIMIT 1
                `,
                [result.insertId]
            );

        const createdSession =
            createdRows[0] ||
            null;

        let qrCode = null;

        if (createdSession) {
            qrCode =
                await generateQRCodeImage(
                    createdSession,
                    createdSession.qr_token
                );
        }

        return res.status(201).json({
            success: true,
            existing: false,

            message:
                "Attendance session created successfully.",

            session:
                createdSession,

            session_id:
                createdSession?.session_id ||
                result.insertId,

            qr_image:
                qrCode,

            qr_code:
                qrCode,

            qr_token:
                createdSession?.qr_token ||
                qr_token,

            qr_expires_at:
                createdSession?.qr_expires_at ||
                qr_expires_at,

            qr_expired: false
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Transaction rollback error:",
                    rollbackError
                );
            }
        }

        console.error(
            "createAttendanceSession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create attendance session.",
            error:
                error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// =====================================================
// GET ATTENDANCE SESSION QR
// =====================================================

const getAttendanceSessionQR = async (
    req,
    res
) => {
    let connection;

    try {
        console.log(
            "DB HOST:",
            process.env.DB_HOST
        );

        console.log(
            "DB NAME:",
            process.env.DB_NAME
        );

        connection =
            await db.getConnection();
        const userRole =
            String(
                req.user?.role || ""
            ).toUpperCase();

        const staffId =
            await resolveStaffId(req);
        const sessionId =
    Number(req.params.id);
console.log(
    "SESSION ID:",
    sessionId
);
if (!sessionId) {
    return res.status(400).json({
        success: false,
        message: "Invalid session id"
    });
}
        const forceRefresh =
            String(
                req.query.force || ""
            ).toLowerCase() ===
                "true" ||
            String(
                req.query.force || ""
            ) === "1";

        connection =
            await db.getConnection();

        let query = `
            ${sessionSelect}
            WHERE ats.session_id = ?
        `;

        const params = [
            sessionId
        ];

        if (
            userRole === "STAFF" ||
            userRole === "TEACHER"
        ) {
            if (!staffId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Unable to determine logged-in staff."
                });
            }

            query += `
                AND ats.staff_id = ?
            `;

            params.push(
                staffId
            );
        }

        const [rows] =
            await connection.query(
                query,
                params
            );
console.log(
    "QR STATUS:",
    rows[0]?.status
);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found."
            });
        }

        const session =
            rows[0];

        if (
            String(
                session.status || ""
            ).toUpperCase() !==
            "ACTIVE"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance session is not active."
            });
        }
console.log(
    "SESSION STATUS FROM DB:",
    session.status
);
        const qrResult =
            await getCurrentOrRotateSessionQR(
                sessionId,
                connection,
                forceRefresh
            );

        return res.json({
            success: true,

            session:
                qrResult.session,

            session_id:
                qrResult.session
                    .session_id,

            qr_token:
                qrResult.qrToken,

            qr_image:
                qrResult.qrCode,

            qr_code:
                qrResult.qrCode,

            allocation_id:
                qrResult.session
                    .allocation_id,

            subject_id:
                qrResult.session
                    .subject_id,

            staff_id:
                qrResult.session
                    .staff_id,

            class_id:
                qrResult.session
                    .class_id,

            academic_year:
                qrResult.session
                    .academic_year,

            semester:
                qrResult.session
                    .allocation_semester,

            qr_expires_at:
                qrResult.qrExpiresAt,

            qr_expired:
                false,

            status:
                qrResult.session
                    .status,

            subject_code:
                qrResult.session
                    .subject_code,

            subject_name:
                qrResult.session
                    .subject_name,

            class_year:
                qrResult.session
                    .class_year,

            class_section:
                qrResult.session
                    .class_section,

            department_name:
                qrResult.session
                    .department_name,

            department_code:
                qrResult.session
                    .department_code
        });
    } catch (error) {
        console.error(
            "getAttendanceSessionQR error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate attendance QR.",
            error:
                error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// =====================================================
// UPDATE ATTENDANCE SESSION
// =====================================================

const updateAttendanceSession = async (
    req,
    res
) => {
    try {
        const sessionId =
            Number(
                req.params.id
            );

        if (
            !Number.isInteger(
                sessionId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid session ID."
            });
        }

        const userRole =
            String(
                req.user?.role || ""
            ).toUpperCase();

        const existingStaffId =
            await resolveStaffId(req);

        const [existingRows] =
            await db.query(
                `
                SELECT *
                FROM attendance_sessions
                WHERE session_id = ?
                LIMIT 1
                `,
                [sessionId]
            );

        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found."
            });
        }

        const existing =
            existingRows[0];

        if (
            userRole === "STAFF" ||
            userRole === "TEACHER"
        ) {
            if (
                !existingStaffId ||
                Number(
                    existing.staff_id
                ) !==
                Number(
                    existingStaffId
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not allowed to modify this attendance session."
                });
            }
        }

        const {
            session_date,
            start_time,
            end_time,
            qr_expires_at,
            status
        } = req.body;

        const newSessionDate =
            session_date ??
            existing.session_date;

        const newStartTime =
            start_time ??
            existing.start_time;

        const newEndTime =
            end_time ??
            existing.end_time;

        const newQrExpiresAt =
            qr_expires_at ??
            existing.qr_expires_at;

        let newStatus =
            status ??
            existing.status;

        newStatus =
            String(
                newStatus
            ).toUpperCase();

        if (
            newStatus !== "ACTIVE" &&
            newStatus !== "CLOSED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be ACTIVE or CLOSED."
            });
        }

        const [result] =
            await db.query(
                `
                UPDATE attendance_sessions
                SET
                    session_date = ?,
                    start_time = ?,
                    end_time = ?,
                    qr_expires_at = ?,
                    status = ?
                WHERE session_id = ?
                `,
                [
                    newSessionDate,
                    newStartTime,
                    newEndTime,
                    newQrExpiresAt,
                    newStatus,
                    sessionId
                ]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance session was not updated."
            });
        }

        const [rows] =
            await db.query(
                `
                ${sessionSelect}
                WHERE ats.session_id = ?
                LIMIT 1
                `,
                [sessionId]
            );

        return res.json({
            success: true,
            message:
                "Attendance session updated successfully.",
            session:
                rows[0] ||
                null
        });
    } catch (error) {
        console.error(
            "updateAttendanceSession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update attendance session.",
            error:
                error.message
        });
    }
};

// =====================================================
// CLOSE ATTENDANCE SESSION
//
// IMPORTANT FIX:
//
// We DO NOT set qr_token = NULL.
//
// Instead:
// - generate a completely new random token
// - set its expiry to NOW()
// - change status to CLOSED
//
// Therefore the old displayed QR becomes invalid,
// while this also works if qr_token is NOT NULL.
// =====================================================

const closeAttendanceSession = async (
    req,
    res
) => {
    let connection;

    try {
        const sessionId =
            Number(
                req.params.id
            );

        if (
            !Number.isInteger(
                sessionId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid session ID."
            });
        }

        const userRole =
            String(
                req.user?.role || ""
            ).toUpperCase();

        const staffId =
            await resolveStaffId(req);

        connection =
            await db.getConnection();

        // -------------------------------------------------
        // LOAD SESSION
        // -------------------------------------------------

        const [rows] =
            await connection.query(
                `
                SELECT
                    session_id,
                    subject_id,
                    staff_id,
                    allocation_id,
                    class_id,
                    academic_year,
                    status
                FROM attendance_sessions
                WHERE session_id = ?
                LIMIT 1
                `,
                [sessionId]
            );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found."
            });
        }

        const session =
            rows[0];

        // -------------------------------------------------
        // AUTHORIZATION
        // -------------------------------------------------

        if (
            userRole === "STAFF" ||
            userRole === "TEACHER"
        ) {
            if (
                !staffId ||
                Number(
                    session.staff_id
                ) !==
                Number(
                    staffId
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not allowed to close this attendance session."
                });
            }
        }

        // -------------------------------------------------
        // ALREADY CLOSED
        // -------------------------------------------------

        if (
            String(
                session.status || ""
            ).toUpperCase() ===
            "CLOSED"
        ) {
            const [
                alreadyClosedRows
            ] =
                await connection.query(
                    `
                    ${sessionSelect}
                    WHERE ats.session_id = ?
                    LIMIT 1
                    `,
                    [sessionId]
                );

            return res.json({
                success: true,
                message:
                    "Attendance session is already closed.",
                session:
                    alreadyClosedRows[0] ||
                    null
            });
        }

        // -------------------------------------------------
        // BEGIN TRANSACTION
        // -------------------------------------------------

        await connection.beginTransaction();

        // -------------------------------------------------
        // GENERATE DEAD / INVALID QR TOKEN
        //
        // Do NOT use NULL because some databases define
        // qr_token as NOT NULL.
        // -------------------------------------------------

        const invalidQrToken =
            `closed_${generateQRToken()}`;

        // -------------------------------------------------
        // CLOSE SESSION
        //
        // QR expires immediately because qr_expires_at
        // is set to database NOW().
        // -------------------------------------------------

        const [result] =
            await connection.query(
                `
                UPDATE attendance_sessions
                SET
                    status = 'CLOSED',

                    end_time = COALESCE(
                        end_time,
                        CURTIME()
                    ),

                    qr_token = ?,

                    qr_expires_at = NOW()

                WHERE session_id = ?
                  AND status = 'ACTIVE'
                `,
                [
                    invalidQrToken,
                    sessionId
                ]
            );

        if (
            result.affectedRows === 0
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Attendance session could not be closed because it is no longer active."
            });
        }

        // -------------------------------------------------
        // GET UPDATED SESSION
        // -------------------------------------------------

        const [updatedRows] =
            await connection.query(
                `
                ${sessionSelect}
                WHERE ats.session_id = ?
                LIMIT 1
                `,
                [sessionId]
            );

        // -------------------------------------------------
        // COMMIT
        // -------------------------------------------------

        await connection.commit();

        return res.json({
            success: true,

            message:
                "Attendance session closed successfully.",

            session:
                updatedRows[0] ||
                null
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "closeAttendanceSession rollback error:",
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

            error:
                error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// =====================================================
// DELETE ATTENDANCE SESSION
// =====================================================

const deleteAttendanceSession = async (
    req,
    res
) => {
    const connection =
        await db.getConnection();

    try {
        const sessionId =
            Number(
                req.params.id
            );

        if (
            !Number.isInteger(
                sessionId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid session ID."
            });
        }

        const [rows] =
            await connection.query(
                `
                SELECT
                    session_id
                FROM attendance_sessions
                WHERE session_id = ?
                LIMIT 1
                `,
                [sessionId]
            );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found."
            });
        }

        await connection.beginTransaction();

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

        if (
            result.affectedRows === 0
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Attendance session could not be deleted."
            });
        }

        await connection.commit();

        return res.json({
            success: true,
            message:
                "Attendance session deleted successfully."
        });
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "Delete rollback error:",
                rollbackError
            );
        }

        console.error(
            "deleteAttendanceSession error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete attendance session.",
            error:
                error.message
        });
    } finally {
        connection.release();
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getAttendanceSessions,
    getAttendanceSessionById,

    getStaffSubjects,
    getStaffTimetable,

    getActiveSession,

    createAttendanceSession,

    getAttendanceSessionQR,

    updateAttendanceSession,

    closeAttendanceSession,

    deleteAttendanceSession,

    // Used by attendanceController.js
    // for QR rotation after successful scan.
    rotateSessionQR,

    getCurrentOrRotateSessionQR
};