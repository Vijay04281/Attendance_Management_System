const db = require("../config/db");

// =====================================================
// ATTENDANCE RECORDS CONTROLLER
//
// IMPORTANT:
//
// QR STUDENT SCAN STORES DATA IN:
//
//     attendance
//
// NOT:
//
//     attendance_records
//
// Therefore this controller uses `attendance` as the
// LIVE / AUTHORITATIVE attendance table.
//
// This makes Staff/Admin pages immediately see the same
// attendance that the student QR scanner creates.
//
// DATABASE FLOW:
//
// students
//     ↓
// attendance
//     ↓
// attendance_sessions
//     ↓
// subjects
//     ↓
// staff
//     ↓
// classes
// =====================================================


// =====================================================
// HELPER - BUILD COMPLETE ATTENDANCE QUERY
// =====================================================
//
// This query returns the attendance information needed
// by Staff/Admin dashboards.
//
// Includes:
//
// - attendance ID
// - session ID
// - student ID
// - student register number
// - student name
// - attendance status
// - scan time
// - subject code
// - subject name
// - staff name
// - staff code
// - class
// - department
// - session date
// - start/end time
//
// =====================================================

const attendanceSelect = `
    SELECT

        a.attendance_id,
        a.session_id,
        a.student_id,

        a.status AS attendance_status,
        a.status,

        a.scanned_at AS scan_time,
        a.scanned_at,

        s.register_number,
        s.register_number AS student_code,
        s.name AS student_name,
        s.email AS student_email,
        s.department AS student_department,
        s.year AS student_year,
        s.section AS student_section,

        ses.subject_id,
        ses.staff_id,
        ses.allocation_id,
        ses.class_id,
        ses.academic_year,
        ses.session_date,
        ses.start_time,
        ses.end_time,
        ses.status AS session_status,

        sub.subject_code,
        sub.subject_name,
        sub.semester AS subject_semester,

        st.staff_code,
        st.name AS staff_name,
        st.email AS staff_email,

        c.year AS class_year,
        c.section AS class_section,

        d.department_name,
        d.department_code

    FROM attendance a

    LEFT JOIN students s
        ON s.student_id = a.student_id

    LEFT JOIN attendance_sessions ses
        ON ses.session_id = a.session_id

    LEFT JOIN subjects sub
        ON sub.subject_id = ses.subject_id

    LEFT JOIN staff st
        ON st.staff_id = ses.staff_id

    LEFT JOIN classes c
        ON c.class_id = ses.class_id

    LEFT JOIN departments d
        ON d.department_id = c.department_id
`;


// =====================================================
// GET ALL ATTENDANCE RECORDS
// =====================================================
//
// GET /api/attendance-records
//
// Staff/Admin pages use this endpoint.
//
// It reads directly from `attendance`, so QR scans
// appear without needing attendance_records.
//
// =====================================================

const getAttendanceRecords = async (req, res) => {
    try {

        const [rows] = await db.query(`
            ${attendanceSelect}

            ORDER BY
                a.scanned_at DESC,
                a.attendance_id DESC
        `);

        return res.json({
            success: true,
            count: rows.length,
            records: rows
        });

    } catch (error) {

        console.error(
            "Get Attendance Records Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance records",
            error: error.message
        });
    }
};


// =====================================================
// GET ATTENDANCE RECORD BY ID
// =====================================================
//
// GET /api/attendance-records/:id
//
// =====================================================

const getAttendanceRecordById = async (req, res) => {
    try {

        const attendanceId =
            Number(req.params.id);

        if (!Number.isInteger(attendanceId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance ID"
            });
        }

        const [rows] = await db.query(`
            ${attendanceSelect}

            WHERE a.attendance_id = ?

            LIMIT 1
        `, [
            attendanceId
        ]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });
        }

        return res.json({
            success: true,
            record: rows[0]
        });

    } catch (error) {

        console.error(
            "Get Attendance Record Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance record",
            error: error.message
        });
    }
};


// =====================================================
// GET RECORDS BY SESSION
// =====================================================
//
// GET /api/attendance-records/session/:sessionId
//
// IMPORTANT:
//
// Reads from attendance.
//
// Therefore immediately after a student scans,
// this endpoint contains the new attendance.
//
// =====================================================

const getRecordsBySession = async (req, res) => {
    try {

        const sessionId =
            Number(req.params.sessionId);

        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID"
            });
        }

        const [rows] = await db.query(`
            ${attendanceSelect}

            WHERE a.session_id = ?

            ORDER BY
                a.scanned_at DESC,
                a.attendance_id DESC
        `, [
            sessionId
        ]);

        return res.json({
            success: true,
            count: rows.length,
            records: rows
        });

    } catch (error) {

        console.error(
            "Get Records By Session Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch session records",
            error: error.message
        });
    }
};


// =====================================================
// GET RECORDS BY STUDENT
// =====================================================
//
// GET /api/attendance-records/student/:studentId
//
// =====================================================

const getRecordsByStudent = async (req, res) => {
    try {

        const studentId =
            Number(req.params.studentId);

        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const [rows] = await db.query(`
            ${attendanceSelect}

            WHERE a.student_id = ?

            ORDER BY
                ses.session_date DESC,
                a.scanned_at DESC,
                a.attendance_id DESC
        `, [
            studentId
        ]);

        return res.json({
            success: true,
            count: rows.length,
            records: rows
        });

    } catch (error) {

        console.error(
            "Get Records By Student Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch student records",
            error: error.message
        });
    }
};


// =====================================================
// CREATE ATTENDANCE RECORD
// =====================================================
//
// POST /api/attendance-records
//
// This also writes to the authoritative `attendance`
// table.
//
// =====================================================

const createAttendanceRecord = async (req, res) => {
    try {

        const {
            session_id,
            student_id,
            attendance_status,
            status,
            scan_time
        } = req.body;

        if (
            session_id === undefined ||
            session_id === null ||
            student_id === undefined ||
            student_id === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "session_id and student_id are required"
            });
        }

        const sessionId =
            Number(session_id);

        const studentId =
            Number(student_id);

        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid session_id"
            });
        }

        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student_id"
            });
        }


        // -------------------------------------------------
        // VALID STATUS
        // -------------------------------------------------

        let finalStatus =
            attendance_status ||
            status ||
            "PRESENT";

        finalStatus =
            String(finalStatus)
                .toUpperCase();

        if (
            ![
                "PRESENT",
                "LATE",
                "ABSENT"
            ].includes(finalStatus)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance status. Use PRESENT, LATE or ABSENT."
            });
        }


        // -------------------------------------------------
        // CHECK SESSION
        // -------------------------------------------------

        const [sessionRows] =
            await db.query(
                `
                SELECT
                    session_id,
                    status
                FROM attendance_sessions
                WHERE session_id = ?
                LIMIT 1
                `,
                [
                    sessionId
                ]
            );

        if (sessionRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance session not found"
            });
        }


        // -------------------------------------------------
        // CHECK STUDENT
        // -------------------------------------------------

        const [studentRows] =
            await db.query(
                `
                SELECT
                    student_id
                FROM students
                WHERE student_id = ?
                LIMIT 1
                `,
                [
                    studentId
                ]
            );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Student not found"
            });
        }


        // -------------------------------------------------
        // DUPLICATE CHECK
        // -------------------------------------------------

        const [duplicateRows] =
            await db.query(
                `
                SELECT
                    attendance_id
                FROM attendance
                WHERE session_id = ?
                  AND student_id = ?
                LIMIT 1
                `,
                [
                    sessionId,
                    studentId
                ]
            );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance record already exists",
                attendance_id:
                    duplicateRows[0].attendance_id
            });
        }


        // -------------------------------------------------
        // INSERT INTO AUTHORITATIVE TABLE
        // -------------------------------------------------

        let result;

        if (scan_time) {

            [result] =
                await db.query(
                    `
                    INSERT INTO attendance
                    (
                        session_id,
                        student_id,
                        scanned_at,
                        status
                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        sessionId,
                        studentId,
                        scan_time,
                        finalStatus
                    ]
                );

        } else {

            [result] =
                await db.query(
                    `
                    INSERT INTO attendance
                    (
                        session_id,
                        student_id,
                        scanned_at,
                        status
                    )
                    VALUES (?, ?, NOW(), ?)
                    `,
                    [
                        sessionId,
                        studentId,
                        finalStatus
                    ]
                );
        }


        // -------------------------------------------------
        // GET COMPLETE CREATED RECORD
        // -------------------------------------------------

        const [rows] =
            await db.query(`
                ${attendanceSelect}

                WHERE a.attendance_id = ?

                LIMIT 1
            `, [
                result.insertId
            ]);


        return res.status(201).json({
            success: true,

            message:
                "Attendance record created successfully",

            record:
                rows[0] || null
        });

    } catch (error) {

        console.error(
            "Create Attendance Record Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create attendance record",
            error:
                error.message
        });
    }
};


// =====================================================
// UPDATE ATTENDANCE RECORD
// =====================================================
//
// PUT/PATCH /api/attendance-records/:id
//
// =====================================================

const updateAttendanceRecord = async (req, res) => {
    try {

        const attendanceId =
            Number(req.params.id);

        if (!Number.isInteger(attendanceId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance ID"
            });
        }

        const {
            attendance_status,
            status,
            scan_time
        } = req.body;


        // -------------------------------------------------
        // GET EXISTING
        // -------------------------------------------------

        const [existingRows] =
            await db.query(
                `
                SELECT *
                FROM attendance
                WHERE attendance_id = ?
                LIMIT 1
                `,
                [
                    attendanceId
                ]
            );

        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance record not found"
            });
        }

        const existing =
            existingRows[0];


        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        let newStatus =
            attendance_status ??
            status ??
            existing.status;

        newStatus =
            String(newStatus)
                .toUpperCase();

        if (
            ![
                "PRESENT",
                "LATE",
                "ABSENT"
            ].includes(newStatus)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance status. Use PRESENT, LATE or ABSENT."
            });
        }


        // -------------------------------------------------
        // SCAN TIME
        // -------------------------------------------------

        const newScanTime =
            scan_time !== undefined
                ? scan_time
                : existing.scanned_at;


        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

        await db.query(
            `
            UPDATE attendance
            SET
                status = ?,
                scanned_at = ?
            WHERE attendance_id = ?
            `,
            [
                newStatus,
                newScanTime,
                attendanceId
            ]
        );


        // -------------------------------------------------
        // GET UPDATED RECORD
        // -------------------------------------------------

        const [rows] =
            await db.query(`
                ${attendanceSelect}

                WHERE a.attendance_id = ?

                LIMIT 1
            `, [
                attendanceId
            ]);


        return res.json({
            success: true,

            message:
                "Attendance record updated successfully",

            record:
                rows[0] || null
        });

    } catch (error) {

        console.error(
            "Update Attendance Record Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update attendance record",
            error:
                error.message
        });
    }
};


// =====================================================
// DELETE ATTENDANCE RECORD
// =====================================================
//
// DELETE /api/attendance-records/:id
//
// =====================================================

const deleteAttendanceRecord = async (req, res) => {
    try {

        const attendanceId =
            Number(req.params.id);

        if (!Number.isInteger(attendanceId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance ID"
            });
        }


        const [result] =
            await db.query(
                `
                DELETE FROM attendance
                WHERE attendance_id = ?
                `,
                [
                    attendanceId
                ]
            );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance record not found"
            });
        }


        return res.json({
            success: true,
            message:
                "Attendance record deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete Attendance Record Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete attendance record",
            error:
                error.message
        });
    }
};


// =====================================================
// MARK ABSENT
// =====================================================
//
// POST /api/attendance-records/absent
//
// =====================================================

const markAbsentForSession = async (req, res) => {
    try {

        const {
            session_id,
            student_id
        } = req.body;


        if (
            session_id === undefined ||
            session_id === null ||
            student_id === undefined ||
            student_id === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "session_id and student_id are required"
            });
        }


        const sessionId =
            Number(session_id);

        const studentId =
            Number(student_id);


        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid session_id"
            });
        }

        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid student_id"
            });
        }


        // -------------------------------------------------
        // CHECK DUPLICATE
        // -------------------------------------------------

        const [duplicateRows] =
            await db.query(
                `
                SELECT
                    attendance_id
                FROM attendance
                WHERE session_id = ?
                  AND student_id = ?
                LIMIT 1
                `,
                [
                    sessionId,
                    studentId
                ]
            );


        if (duplicateRows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Attendance record already exists",

                attendance_id:
                    duplicateRows[0]
                        .attendance_id
            });
        }


        // -------------------------------------------------
        // INSERT ABSENT
        // -------------------------------------------------

        const [result] =
            await db.query(
                `
                INSERT INTO attendance
                (
                    session_id,
                    student_id,
                    scanned_at,
                    status
                )
                VALUES
                (?, ?, NOW(), 'ABSENT')
                `,
                [
                    sessionId,
                    studentId
                ]
            );


        // -------------------------------------------------
        // GET CREATED RECORD
        // -------------------------------------------------

        const [rows] =
            await db.query(`
                ${attendanceSelect}

                WHERE a.attendance_id = ?

                LIMIT 1
            `, [
                result.insertId
            ]);


        return res.status(201).json({
            success: true,

            message:
                "Student marked absent",

            attendance_id:
                result.insertId,

            record:
                rows[0] || null
        });

    } catch (error) {

        console.error(
            "Mark Absent Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to mark student absent",
            error:
                error.message
        });
    }
};


// =====================================================
// GET LATEST ATTENDANCE
// =====================================================
//
// GET /api/attendance-records/latest
//
// Useful for Staff/Admin live dashboards.
//
// Returns the most recently scanned student.
//
// =====================================================

const getLatestAttendance = async (req, res) => {
    try {

        const [rows] =
            await db.query(`
                ${attendanceSelect}

                ORDER BY
                    a.scanned_at DESC,
                    a.attendance_id DESC

                LIMIT 1
            `);


        return res.json({
            success: true,

            record:
                rows[0] || null
        });

    } catch (error) {

        console.error(
            "Get Latest Attendance Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch latest attendance",
            error:
                error.message
        });
    }
};


// =====================================================
// GET ATTENDANCE COUNT BY SESSION
// =====================================================
//
// GET /api/attendance-records/session/:sessionId/count
//
// =====================================================

const getAttendanceCountBySession = async (
    req,
    res
) => {
    try {

        const sessionId =
            Number(req.params.sessionId);

        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid session ID"
            });
        }


        const [rows] =
            await db.query(
                `
                SELECT

                    COUNT(*) AS total,

                    SUM(
                        CASE
                            WHEN status = 'PRESENT'
                            THEN 1
                            ELSE 0
                        END
                    ) AS present,

                    SUM(
                        CASE
                            WHEN status = 'LATE'
                            THEN 1
                            ELSE 0
                        END
                    ) AS late,

                    SUM(
                        CASE
                            WHEN status = 'ABSENT'
                            THEN 1
                            ELSE 0
                        END
                    ) AS absent

                FROM attendance

                WHERE session_id = ?
                `,
                [
                    sessionId
                ]
            );


        const row =
            rows[0] || {};


        return res.json({
            success: true,

            session_id:
                sessionId,

            total:
                Number(row.total || 0),

            present:
                Number(row.present || 0),

            late:
                Number(row.late || 0),

            absent:
                Number(row.absent || 0)
        });

    } catch (error) {

        console.error(
            "Get Attendance Count By Session Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch attendance count",
            error:
                error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getAttendanceRecords,

    getAttendanceRecordById,

    getRecordsBySession,

    getRecordsByStudent,

    createAttendanceRecord,

    updateAttendanceRecord,

    deleteAttendanceRecord,

    markAbsentForSession,

    getLatestAttendance,

    getAttendanceCountBySession
};