const db = require("../config/db");

// =====================================================
// GET ALL ATTENDANCE RECORDS
// =====================================================
const getAttendanceRecords = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                ar.attendance_id,
                ar.session_id,
                ar.student_id,
                ar.attendance_status,
                ar.scan_time,
                ar.created_at,

                st.register_number,
                st.name AS student_name,

                ses.session_date,
                ses.start_time,

                s.subject_code,
                s.subject_name

            FROM attendance_records ar

            LEFT JOIN students st
                ON st.student_id = ar.student_id

            LEFT JOIN attendance_sessions ses
                ON ses.session_id = ar.session_id

            LEFT JOIN subjects s
                ON s.subject_id = ses.subject_id

            ORDER BY ar.created_at DESC
        `);

        return res.json({
            success: true,
            count: rows.length,
            records: rows
        });
    } catch (error) {
        console.error("Get Attendance Records Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance records"
        });
    }
};

// =====================================================
// GET RECORD BY ID
// =====================================================
const getAttendanceRecordById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                ar.*,
                st.register_number,
                st.name AS student_name,
                ses.session_date,
                ses.start_time,
                s.subject_code,
                s.subject_name

            FROM attendance_records ar

            LEFT JOIN students st
                ON st.student_id = ar.student_id

            LEFT JOIN attendance_sessions ses
                ON ses.session_id = ar.session_id

            LEFT JOIN subjects s
                ON s.subject_id = ses.subject_id

            WHERE ar.attendance_id = ?
        `, [id]);

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
        console.error("Get Attendance Record Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance record"
        });
    }
};

// =====================================================
// GET RECORDS BY SESSION
// =====================================================
const getRecordsBySession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const [rows] = await db.query(`
            SELECT
                ar.*,
                st.register_number,
                st.name AS student_name

            FROM attendance_records ar

            LEFT JOIN students st
                ON st.student_id = ar.student_id

            WHERE ar.session_id = ?

            ORDER BY st.register_number ASC
        `, [sessionId]);

        return res.json({
            success: true,
            count: rows.length,
            records: rows
        });
    } catch (error) {
        console.error("Get Records By Session Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch session records"
        });
    }
};

// =====================================================
// GET RECORDS BY STUDENT
// =====================================================
const getRecordsByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        const [rows] = await db.query(`
            SELECT
                ar.*,
                ses.session_date,
                ses.start_time,
                s.subject_code,
                s.subject_name

            FROM attendance_records ar

            LEFT JOIN attendance_sessions ses
                ON ses.session_id = ar.session_id

            LEFT JOIN subjects s
                ON s.subject_id = ses.subject_id

            WHERE ar.student_id = ?

            ORDER BY ses.session_date DESC
        `, [studentId]);

        return res.json({
            success: true,
            count: rows.length,
            records: rows
        });
    } catch (error) {
        console.error("Get Records By Student Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch student records"
        });
    }
};

// =====================================================
// CREATE ATTENDANCE RECORD
// =====================================================
const createAttendanceRecord = async (req, res) => {
    try {
        const {
            session_id,
            student_id,
            attendance_status,
            scan_time
        } = req.body;

        if (!session_id || !student_id) {
            return res.status(400).json({
                success: false,
                message: "session_id and student_id are required"
            });
        }

        const finalStatus =
            attendance_status === "ABSENT"
                ? "ABSENT"
                : "PRESENT";

        const [session] = await db.query(
            "SELECT session_id FROM attendance_sessions WHERE session_id = ?",
            [session_id]
        );

        if (session.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found"
            });
        }

        const [student] = await db.query(
            "SELECT student_id FROM students WHERE student_id = ?",
            [student_id]
        );

        if (student.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const [duplicate] = await db.query(`
            SELECT attendance_id
            FROM attendance_records
            WHERE session_id = ?
              AND student_id = ?
        `, [session_id, student_id]);

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Attendance record already exists"
            });
        }

        const [result] = await db.query(`
            INSERT INTO attendance_records
            (
                session_id,
                student_id,
                attendance_status,
                scan_time
            )
            VALUES (?, ?, ?, ?)
        `, [
            session_id,
            student_id,
            finalStatus,
            scan_time || null
        ]);

        const [rows] = await db.query(
            "SELECT * FROM attendance_records WHERE attendance_id = ?",
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Attendance record created successfully",
            record: rows[0]
        });
    } catch (error) {
        console.error("Create Attendance Record Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create attendance record"
        });
    }
};

// =====================================================
// UPDATE ATTENDANCE RECORD
// =====================================================
const updateAttendanceRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            attendance_status,
            scan_time
        } = req.body;

        const [existing] = await db.query(
            "SELECT * FROM attendance_records WHERE attendance_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });
        }

        if (
            attendance_status &&
            !["PRESENT", "ABSENT"].includes(
                attendance_status
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance status"
            });
        }

        await db.query(`
            UPDATE attendance_records
            SET
                attendance_status = ?,
                scan_time = ?
            WHERE attendance_id = ?
        `, [
            attendance_status ||
                existing[0].attendance_status,
            scan_time !== undefined
                ? scan_time
                : existing[0].scan_time,
            id
        ]);

        const [rows] = await db.query(
            "SELECT * FROM attendance_records WHERE attendance_id = ?",
            [id]
        );

        return res.json({
            success: true,
            message: "Attendance record updated successfully",
            record: rows[0]
        });
    } catch (error) {
        console.error("Update Attendance Record Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update attendance record"
        });
    }
};

// =====================================================
// DELETE ATTENDANCE RECORD
// =====================================================
const deleteAttendanceRecord = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM attendance_records WHERE attendance_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });
        }

        return res.json({
            success: true,
            message: "Attendance record deleted successfully"
        });
    } catch (error) {
        console.error("Delete Attendance Record Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete attendance record"
        });
    }
};

// =====================================================
// MARK ABSENT
// =====================================================
const markAbsentForSession = async (req, res) => {
    try {
        const {
            session_id,
            student_id
        } = req.body;

        if (!session_id || !student_id) {
            return res.status(400).json({
                success: false,
                message: "session_id and student_id are required"
            });
        }

        const [duplicate] = await db.query(`
            SELECT attendance_id
            FROM attendance_records
            WHERE session_id = ?
              AND student_id = ?
        `, [session_id, student_id]);

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Attendance record already exists"
            });
        }

        const [result] = await db.query(`
            INSERT INTO attendance_records
            (
                session_id,
                student_id,
                attendance_status
            )
            VALUES (?, ?, 'ABSENT')
        `, [session_id, student_id]);

        return res.status(201).json({
            success: true,
            message: "Student marked absent",
            attendance_id: result.insertId
        });
    } catch (error) {
        console.error("Mark Absent Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark student absent"
        });
    }
};

module.exports = {
    getAttendanceRecords,
    getAttendanceRecordById,
    getRecordsBySession,
    getRecordsByStudent,
    createAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    markAbsentForSession
};