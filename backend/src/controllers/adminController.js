const db = require("../config/db");

// =====================================================
// ADMIN DASHBOARD
// =====================================================

const getDashboard = async (req, res) => {
    try {
        const [[students]] = await db.query(`
            SELECT COUNT(*) AS totalStudents
            FROM students
        `);

        const [[staff]] = await db.query(`
            SELECT COUNT(*) AS totalStaff
            FROM staff
        `);

        const [[departments]] = await db.query(`
            SELECT COUNT(*) AS totalDepartments
            FROM departments
        `);

        const [[subjects]] = await db.query(`
            SELECT COUNT(*) AS totalSubjects
            FROM subjects
        `);

        const [[classes]] = await db.query(`
            SELECT COUNT(*) AS totalClasses
            FROM classes
        `);

        const [[activeSessions]] = await db.query(`
            SELECT COUNT(*) AS activeSessions
            FROM attendance_sessions
            WHERE status = 'ACTIVE'
        `);

        const [[todayAttendance]] = await db.query(`
            SELECT COUNT(*) AS totalAttendance
            FROM attendance
            WHERE DATE(scanned_at) = CURDATE()
        `);

        res.json({
            success: true,
            dashboard: {
                totalStudents: students.totalStudents,
                totalStaff: staff.totalStaff,
                totalDepartments: departments.totalDepartments,
                totalSubjects: subjects.totalSubjects,
                totalClasses: classes.totalClasses,
                activeSessions: activeSessions.activeSessions,
                todayAttendance: todayAttendance.totalAttendance
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load dashboard",
            error: error.message
        });
    }
};

// =====================================================
// SYSTEM STATISTICS
// =====================================================

const getStatistics = async (req, res) => {
    try {

        const [[presentCount]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM attendance_records
            WHERE attendance_status = 'PRESENT'
        `);

        const [[absentCount]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM attendance_records
            WHERE attendance_status = 'ABSENT'
        `);

        const [[totalSessions]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM attendance_sessions
        `);

        const [[notifications]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM notifications
        `);

        res.json({
            success: true,
            statistics: {
                presentStudents: presentCount.total,
                absentStudents: absentCount.total,
                totalSessions: totalSessions.total,
                totalNotifications: notifications.total
            }
        });

    } catch (error) {
        console.error("Statistics Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load statistics",
            error: error.message
        });
    }
};

// =====================================================
// RECENT ACTIVITIES
// =====================================================

const getRecentActivities = async (req, res) => {
    try {

        const [logs] = await db.query(`
            SELECT *
            FROM audit_logs
            ORDER BY created_at DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            activities: logs
        });

    } catch (error) {
        console.error("Recent Activities Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load activities",
            error: error.message
        });
    }
};

// =====================================================
// SYSTEM SUMMARY
// =====================================================

const getSystemSummary = async (req, res) => {
    try {

        const [[students]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM students
        `);

        const [[staff]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM staff
        `);

        const [[sessions]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM attendance_sessions
        `);

        const [[attendance]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM attendance
        `);

        const [recentNotifications] = await db.query(`
            SELECT *
            FROM notifications
            ORDER BY created_at DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            summary: {
                students: students.total,
                staff: staff.total,
                sessions: sessions.total,
                attendanceRecords: attendance.total,
                recentNotifications
            }
        });

    } catch (error) {
        console.error("System Summary Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load summary",
            error: error.message
        });
    }
};

// =====================================================
// ATTENDANCE OVERVIEW
// =====================================================

const getAttendanceOverview = async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                ar.subject_id,
                s.subject_name,
                SUM(ar.present_count) AS total_present,
                SUM(ar.absent_count) AS total_absent,
                ROUND(
                    AVG(ar.attendance_percentage),
                    2
                ) AS avg_percentage
            FROM attendance_reports ar
            LEFT JOIN subjects s
                ON ar.subject_id = s.subject_id
            GROUP BY ar.subject_id
            ORDER BY avg_percentage DESC
        `);

        res.json({
            success: true,
            overview: rows
        });

    } catch (error) {
        console.error("Attendance Overview Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load attendance overview",
            error: error.message
        });
    }
};

// =====================================================
// RECENT ATTENDANCE SESSIONS
// =====================================================

const getRecentSessions = async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                ats.*,
                sub.subject_name,
                st.name AS staff_name
            FROM attendance_sessions ats
            LEFT JOIN subjects sub
                ON ats.subject_id = sub.subject_id
            LEFT JOIN staff st
                ON ats.staff_id = st.staff_id
            ORDER BY ats.created_at DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            sessions: rows
        });

    } catch (error) {
        console.error("Recent Sessions Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load recent sessions",
            error: error.message
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getDashboard,
    getStatistics,
    getRecentActivities,
    getSystemSummary,
    getAttendanceOverview,
    getRecentSessions
};