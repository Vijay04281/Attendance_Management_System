const express = require("express");
const cors = require("cors");
require("dotenv").config();

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");

const studentRoutes = require("./routes/studentRoutes");

const staffRoutes = require("./routes/staffRoutes");

const departmentRoutes = require("./routes/departmentRoutes");

const subjectRoutes = require("./routes/subjectRoutes");

const classRoutes = require("./routes/classRoutes");

const assignmentRoutes = require("./routes/assignmentRoutes");

const timetableRoutes = require("./routes/timetableRoutes");

const attendanceSessionRoutes = require(
    "./routes/attendanceSessionRoutes"
);

const attendanceRoutes = require(
    "./routes/attendanceRoutes"
);

const classTeacherRoutes = require(
    "./routes/classTeacherRoutes"
);

const classTeacherAssignmentRoutes = require(
    "./routes/classTeacherAssignmentRoutes"
);

const subjectAllocationRoutes = require(
    "./routes/subjectAllocationRoutes"
);

// =====================================================
// ATTENDANCE / ADMIN ROUTES
// =====================================================

const attendanceRecordRoutes = require(
    "./routes/attendanceRecordRoutes"
);

const attendanceReportRoutes = require(
    "./routes/attendanceReportRoutes"
);

const qrCodeRoutes = require(
    "./routes/qrCodeRoutes"
);

const auditLogRoutes = require(
    "./routes/auditLogRoutes"
);

const adminRoutes = require(
    "./routes/adminRoutes"
);

// =====================================================
// APP
// =====================================================

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// CORS
app.use(
    cors({
        origin: true,
        credentials: true
    })
);

// JSON request body
app.use(
    express.json({
        limit: "10mb"
    })
);

// URL encoded request body
app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Attendance Management System API is running",
        version: "1.0.0"
    });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "API is healthy",
        timestamp: new Date().toISOString()
    });
});

// =====================================================
// ROUTE VALIDATION
// =====================================================

const mountRoute = (path, route, routeName) => {
    if (!route) {
        console.error(
            "================================================"
        );

        console.error(
            `ERROR: ${routeName} is undefined`
        );

        console.error(
            `Route path: ${path}`
        );

        console.error(
            "Check the corresponding routes file."
        );

        console.error(
            "It must contain:"
        );

        console.error(
            "module.exports = router;"
        );

        console.error(
            "================================================"
        );

        process.exit(1);
    }

    if (
        typeof route !== "function" &&
        typeof route.use !== "function"
    ) {
        console.error(
            "================================================"
        );

        console.error(
            `ERROR: ${routeName} is not a valid Express router`
        );

        console.error(
            `Route path: ${path}`
        );

        console.error(
            "The route file must export the Express router:"
        );

        console.error(
            "module.exports = router;"
        );

        console.error(
            "================================================"
        );

        console.error(
            "Received value:"
        );

        console.error(route);

        process.exit(1);
    }

    app.use(path, route);

    console.log(
        `✓ Mounted ${routeName} -> ${path}`
    );
};

// =====================================================
// API ROUTES
// =====================================================

// -----------------------------------------------------
// AUTHENTICATION
// -----------------------------------------------------

mountRoute(
    "/api/auth",
    authRoutes,
    "authRoutes"
);

// -----------------------------------------------------
// STUDENTS
// -----------------------------------------------------

mountRoute(
    "/api/students",
    studentRoutes,
    "studentRoutes"
);

// -----------------------------------------------------
// STAFF
// -----------------------------------------------------

mountRoute(
    "/api/staff",
    staffRoutes,
    "staffRoutes"
);

// -----------------------------------------------------
// DEPARTMENTS
// -----------------------------------------------------

mountRoute(
    "/api/departments",
    departmentRoutes,
    "departmentRoutes"
);

// -----------------------------------------------------
// SUBJECTS
// -----------------------------------------------------

mountRoute(
    "/api/subjects",
    subjectRoutes,
    "subjectRoutes"
);

// -----------------------------------------------------
// CLASSES
// -----------------------------------------------------

mountRoute(
    "/api/classes",
    classRoutes,
    "classRoutes"
);

// -----------------------------------------------------
// GENERAL ASSIGNMENTS
// -----------------------------------------------------

mountRoute(
    "/api/assignments",
    assignmentRoutes,
    "assignmentRoutes"
);

// -----------------------------------------------------
// TIMETABLE
// -----------------------------------------------------
//
// GET  /api/timetables
// GET  /api/timetables/:id
// POST /api/timetables
// PUT  /api/timetables/:id
// DELETE /api/timetables/:id
//
// STAFF:
// GET /api/timetables/staff
//
// STUDENT:
// GET /api/timetables/student
//
// -----------------------------------------------------

mountRoute(
    "/api/timetables",
    timetableRoutes,
    "timetableRoutes"
);

// -----------------------------------------------------
// SUBJECT ALLOCATIONS
// -----------------------------------------------------

mountRoute(
    "/api/subject-allocations",
    subjectAllocationRoutes,
    "subjectAllocationRoutes"
);

// -----------------------------------------------------
// ATTENDANCE SESSIONS
// -----------------------------------------------------

mountRoute(
    "/api/attendance-sessions",
    attendanceSessionRoutes,
    "attendanceSessionRoutes"
);

// -----------------------------------------------------
// ATTENDANCE
// -----------------------------------------------------

mountRoute(
    "/api/attendance",
    attendanceRoutes,
    "attendanceRoutes"
);

// -----------------------------------------------------
// ATTENDANCE RECORDS
// -----------------------------------------------------

mountRoute(
    "/api/attendance-records",
    attendanceRecordRoutes,
    "attendanceRecordRoutes"
);

// -----------------------------------------------------
// ATTENDANCE REPORTS
// -----------------------------------------------------

mountRoute(
    "/api/attendance-reports",
    attendanceReportRoutes,
    "attendanceReportRoutes"
);

// -----------------------------------------------------
// QR CODES
// -----------------------------------------------------

mountRoute(
    "/api/qr-codes",
    qrCodeRoutes,
    "qrCodeRoutes"
);

// -----------------------------------------------------
// CLASS TEACHER
// -----------------------------------------------------

mountRoute(
    "/api/class-teacher",
    classTeacherRoutes,
    "classTeacherRoutes"
);

// -----------------------------------------------------
// CLASS TEACHER ASSIGNMENTS
// -----------------------------------------------------

mountRoute(
    "/api/class-teacher-assignments",
    classTeacherAssignmentRoutes,
    "classTeacherAssignmentRoutes"
);

// -----------------------------------------------------
// ADMIN
// -----------------------------------------------------

mountRoute(
    "/api/admin",
    adminRoutes,
    "adminRoutes"
);

// -----------------------------------------------------
// AUDIT LOGS
// -----------------------------------------------------

mountRoute(
    "/api/audit-logs",
    auditLogRoutes,
    "auditLogRoutes"
);

// =====================================================
// NOTIFICATIONS
// =====================================================
//
// Notifications are intentionally not mounted yet.
//
// We will correct notificationRoutes.js before mounting
// it so that the notification API matches the existing
// frontend and database structure.
//
// =====================================================


// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl
    });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error(
        "================================================"
    );

    console.error(
        "Global Server Error:"
    );

    console.error(err);

    console.error(
        "================================================"
    );

    const statusCode =
        err.status ||
        err.statusCode ||
        500;

    res.status(statusCode).json({
        success: false,
        message:
            err.message ||
            "Internal server error"
    });
});

// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            "=============================================="
        );

        console.log(
            "Attendance Management System API"
        );

        console.log(
            "=============================================="
        );

        console.log(
            `Local:   http://localhost:${PORT}`
        );

        console.log(
            `Network: http://10.52.2.243:${PORT}`
        );

        console.log(
            "=============================================="
        );

        console.log(
            "Server started successfully"
        );

        console.log(
            "=============================================="
        );
    }
);