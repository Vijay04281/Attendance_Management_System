const db = require("../config/db");

// =====================================================
// GET ALL ATTENDANCE REPORTS
// =====================================================
const getAttendanceReports = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                ar.report_id,
                ar.class_id,
                ar.student_id,
                ar.subject_id,
                ar.total_classes,
                ar.present_count,
                ar.absent_count,
                ar.attendance_percentage,

                st.register_number,
                st.name AS student_name,

                s.subject_code,
                s.subject_name

            FROM attendance_reports ar

            LEFT JOIN students st
                ON st.student_id = ar.student_id

            LEFT JOIN subjects s
                ON s.subject_id = ar.subject_id

            ORDER BY ar.attendance_percentage ASC
        `);

        return res.json({
            success: true,
            count: rows.length,
            reports: rows
        });
    } catch (error) {
        console.error("Get Attendance Reports Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance reports"
        });
    }
};

// =====================================================
// GET REPORT BY ID
// =====================================================
const getAttendanceReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                ar.*,
                st.register_number,
                st.name AS student_name,
                s.subject_code,
                s.subject_name

            FROM attendance_reports ar

            LEFT JOIN students st
                ON st.student_id = ar.student_id

            LEFT JOIN subjects s
                ON s.subject_id = ar.subject_id

            WHERE ar.report_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance report not found"
            });
        }

        return res.json({
            success: true,
            report: rows[0]
        });
    } catch (error) {
        console.error("Get Attendance Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance report"
        });
    }
};

// =====================================================
// GET STUDENT REPORT
// =====================================================
const getStudentAttendanceReport = async (req, res) => {
    try {
        const { studentId } = req.params;

        const [rows] = await db.query(`
            SELECT
                ar.*,
                s.subject_code,
                s.subject_name
            FROM attendance_reports ar
            LEFT JOIN subjects s
                ON s.subject_id = ar.subject_id
            WHERE ar.student_id = ?
            ORDER BY s.subject_code
        `, [studentId]);

        return res.json({
            success: true,
            count: rows.length,
            reports: rows
        });
    } catch (error) {
        console.error(
            "Get Student Attendance Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch student attendance report"
        });
    }
};

// =====================================================
// GET CLASS REPORT
// =====================================================
const getClassAttendanceReport = async (req, res) => {
    try {
        const { classId } = req.params;

        const [rows] = await db.query(`
            SELECT
                ar.*,
                st.register_number,
                st.name AS student_name,
                s.subject_code,
                s.subject_name
            FROM attendance_reports ar
            LEFT JOIN students st
                ON st.student_id = ar.student_id
            LEFT JOIN subjects s
                ON s.subject_id = ar.subject_id
            WHERE ar.class_id = ?
            ORDER BY st.register_number, s.subject_code
        `, [classId]);

        return res.json({
            success: true,
            count: rows.length,
            reports: rows
        });
    } catch (error) {
        console.error("Get Class Attendance Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch class attendance report"
        });
    }
};

// =====================================================
// CREATE REPORT
// =====================================================
const createAttendanceReport = async (req, res) => {
    try {
        const {
            class_id,
            student_id,
            subject_id,
            total_classes,
            present_count,
            absent_count
        } = req.body;

        if (
            !class_id ||
            !student_id ||
            !subject_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "class_id, student_id and subject_id are required"
            });
        }

        const total = Number(total_classes || 0);
        const present = Number(present_count || 0);
        const absent = Number(
            absent_count !== undefined
                ? absent_count
                : Math.max(total - present, 0)
        );

        const percentage =
            total > 0
                ? Number(((present / total) * 100).toFixed(2))
                : 0;

        const [result] = await db.query(`
            INSERT INTO attendance_reports
            (
                class_id,
                student_id,
                subject_id,
                total_classes,
                present_count,
                absent_count,
                attendance_percentage
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            class_id,
            student_id,
            subject_id,
            total,
            present,
            absent,
            percentage
        ]);

        const [rows] = await db.query(
            "SELECT * FROM attendance_reports WHERE report_id = ?",
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Attendance report created successfully",
            report: rows[0]
        });
    } catch (error) {
        console.error("Create Attendance Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create attendance report"
        });
    }
};

// =====================================================
// GENERATE / RECALCULATE REPORT
// =====================================================
const generateAttendanceReport = async (req, res) => {
    try {
        const {
            class_id,
            student_id,
            subject_id
        } = req.body;

        if (
            !class_id ||
            !student_id ||
            !subject_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "class_id, student_id and subject_id are required"
            });
        }

        const [stats] = await db.query(`
            SELECT
                COUNT(*) AS total_classes,
                SUM(
                    CASE
                        WHEN ar.attendance_status = 'PRESENT'
                        THEN 1
                        ELSE 0
                    END
                ) AS present_count,
                SUM(
                    CASE
                        WHEN ar.attendance_status = 'ABSENT'
                        THEN 1
                        ELSE 0
                    END
                ) AS absent_count

            FROM attendance_records ar

            INNER JOIN attendance_sessions ses
                ON ses.session_id = ar.session_id

            WHERE ar.student_id = ?
              AND ses.subject_id = ?
        `, [
            student_id,
            subject_id
        ]);

        const total = Number(
            stats[0].total_classes || 0
        );

        const present = Number(
            stats[0].present_count || 0
        );

        const absent = Number(
            stats[0].absent_count || 0
        );

        const percentage =
            total > 0
                ? Number(((present / total) * 100).toFixed(2))
                : 0;

        const [existing] = await db.query(`
            SELECT report_id
            FROM attendance_reports
            WHERE class_id = ?
              AND student_id = ?
              AND subject_id = ?
        `, [
            class_id,
            student_id,
            subject_id
        ]);

        if (existing.length > 0) {
            await db.query(`
                UPDATE attendance_reports
                SET
                    total_classes = ?,
                    present_count = ?,
                    absent_count = ?,
                    attendance_percentage = ?
                WHERE report_id = ?
            `, [
                total,
                present,
                absent,
                percentage,
                existing[0].report_id
            ]);

            const [rows] = await db.query(
                "SELECT * FROM attendance_reports WHERE report_id = ?",
                [existing[0].report_id]
            );

            return res.json({
                success: true,
                message: "Attendance report regenerated successfully",
                report: rows[0]
            });
        }

        const [result] = await db.query(`
            INSERT INTO attendance_reports
            (
                class_id,
                student_id,
                subject_id,
                total_classes,
                present_count,
                absent_count,
                attendance_percentage
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            class_id,
            student_id,
            subject_id,
            total,
            present,
            absent,
            percentage
        ]);

        const [rows] = await db.query(
            "SELECT * FROM attendance_reports WHERE report_id = ?",
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Attendance report generated successfully",
            report: rows[0]
        });
    } catch (error) {
        console.error("Generate Attendance Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate attendance report"
        });
    }
};

// =====================================================
// UPDATE REPORT
// =====================================================
const updateAttendanceReport = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            total_classes,
            present_count,
            absent_count
        } = req.body;

        const [existing] = await db.query(
            "SELECT * FROM attendance_reports WHERE report_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance report not found"
            });
        }

        const total =
            total_classes !== undefined
                ? Number(total_classes)
                : Number(existing[0].total_classes);

        const present =
            present_count !== undefined
                ? Number(present_count)
                : Number(existing[0].present_count);

        const absent =
            absent_count !== undefined
                ? Number(absent_count)
                : Number(existing[0].absent_count);

        const percentage =
            total > 0
                ? Number(((present / total) * 100).toFixed(2))
                : 0;

        await db.query(`
            UPDATE attendance_reports
            SET
                total_classes = ?,
                present_count = ?,
                absent_count = ?,
                attendance_percentage = ?
            WHERE report_id = ?
        `, [
            total,
            present,
            absent,
            percentage,
            id
        ]);

        const [rows] = await db.query(
            "SELECT * FROM attendance_reports WHERE report_id = ?",
            [id]
        );

        return res.json({
            success: true,
            message: "Attendance report updated successfully",
            report: rows[0]
        });
    } catch (error) {
        console.error("Update Attendance Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update attendance report"
        });
    }
};

// =====================================================
// DELETE REPORT
// =====================================================
const deleteAttendanceReport = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM attendance_reports WHERE report_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance report not found"
            });
        }

        return res.json({
            success: true,
            message: "Attendance report deleted successfully"
        });
    } catch (error) {
        console.error("Delete Attendance Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete attendance report"
        });
    }
};

module.exports = {
    getAttendanceReports,
    getAttendanceReportById,
    getStudentAttendanceReport,
    getClassAttendanceReport,
    createAttendanceReport,
    generateAttendanceReport,
    updateAttendanceReport,
    deleteAttendanceReport
};