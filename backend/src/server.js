// =====================================================
// SERVER.JS
// ATTENDANCE MANAGEMENT SYSTEM
// =====================================================

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const frontendDist = path.resolve(__dirname, "../../frontend/dist");

require("dotenv").config();

// =====================================================
// ROUTES
// =====================================================

const authRoutes =
    require("./routes/authRoutes");

const studentRoutes =
    require("./routes/studentRoutes");

const staffRoutes =
    require("./routes/staffRoutes");

const departmentRoutes =
    require("./routes/departmentRoutes");

const subjectRoutes =
    require("./routes/subjectRoutes");

const classRoutes =
    require("./routes/classRoutes");

const assignmentRoutes =
    require("./routes/assignmentRoutes");

const attendanceRoutes =
    require("./routes/attendanceRoutes");

const attendanceSessionRoutes =
    require("./routes/attendanceSessionRoutes");

const subjectAllocationRoutes =
    require("./routes/subjectAllocationRoutes");

const classTeacherAssignmentRoutes =
    require("./routes/classTeacherAssignmentRoutes");

const timetableRoutes =
    require("./routes/timetableRoutes");

const classTeacherRoutes =
    require("./routes/classTeacherRoutes");

// =====================================================
// EXPRESS APP
// =====================================================

const app = express();

// =====================================================
// TRUST PROXY
// Render
// =====================================================

app.set(
    "trust proxy",
    1
);

// =====================================================
// PORT
// =====================================================

const PORT = 3000;

// =====================================================
// CORS
// =====================================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);
// =====================================================
// OPTIONS / PREFLIGHT
// =====================================================


// =====================================================
// BODY PARSERS
// =====================================================

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use(
    (
        req,
        res,
        next
    ) => {

        console.log(
            "================================================"
        );

        console.log(
            "REQUEST:",
            req.method,
            req.originalUrl
        );

        console.log(
            "ORIGIN:",
            req.headers.origin ||
                "NO ORIGIN"
        );

        console.log(
            "================================================"
        );

        next();
    }
);

// =====================================================
// FRONTEND STATIC FILES
// =====================================================

app.use(express.static(frontendDist));

// =====================================================
// HEALTH
// =====================================================

app.get(
    "/health",
    (
        req,
        res
    ) => {

        res.status(200).json({
            success: true,

            message:
                "Server is healthy",

            timestamp:
                new Date().toISOString()
        });
    }
);

// =====================================================
// API ROOT
// =====================================================

app.get(
    "/api",
    (
        req,
        res
    ) => {

        res.status(200).json({
            success: true,

            message:
                "Attendance Management System API",

            version:
                "1.0.0",

            timestamp:
                new Date().toISOString()
        });
    }
);

// =====================================================
// ROUTE MOUNT HELPER
// =====================================================

const mountRoute = (
    path,
    route,
    name
) => {

    if (!route) {

        console.error(
            `❌ ${name} route is undefined`
        );

        return;
    }

    app.use(
        path,
        route
    );

    console.log(
        `✅ ${name} mounted at ${path}`
    );
};

// =====================================================
// AUTH
// =====================================================

mountRoute(
    "/api/auth",
    authRoutes,
    "AUTH"
);

// =====================================================
// STUDENTS
// =====================================================

mountRoute(
    "/api/students",
    studentRoutes,
    "STUDENTS"
);

// =====================================================
// STAFF
// =====================================================

mountRoute(
    "/api/staff",
    staffRoutes,
    "STAFF"
);

// =====================================================
// DEPARTMENTS
// =====================================================

mountRoute(
    "/api/departments",
    departmentRoutes,
    "DEPARTMENTS"
);

// =====================================================
// SUBJECTS
// =====================================================

mountRoute(
    "/api/subjects",
    subjectRoutes,
    "SUBJECTS"
);

// =====================================================
// CLASSES
// =====================================================

mountRoute(
    "/api/classes",
    classRoutes,
    "CLASSES"
);

// =====================================================
// ASSIGNMENTS
// =====================================================

mountRoute(
    "/api/assignments",
    assignmentRoutes,
    "ASSIGNMENTS"
);

// =====================================================
// ATTENDANCE
// =====================================================

mountRoute(
    "/api/attendance",
    attendanceRoutes,
    "ATTENDANCE"
);

// =====================================================
// ATTENDANCE SESSIONS
// =====================================================

mountRoute(
    "/api/attendance-sessions",
    attendanceSessionRoutes,
    "ATTENDANCE SESSIONS"
);

// =====================================================
// SUBJECT ALLOCATIONS
//
// ADMIN SUBJECT STAFF
//
// GET    /api/subject-allocations
// GET    /api/subject-allocations/staff
// GET    /api/subject-allocations/:id
// POST   /api/subject-allocations
// PUT    /api/subject-allocations/:id
// DELETE /api/subject-allocations/:id
// =====================================================

mountRoute(
    "/api/subject-allocations",
    subjectAllocationRoutes,
    "SUBJECT ALLOCATIONS"
);

// =====================================================
// CLASS TEACHER ASSIGNMENTS
//
// ADMIN CLASS TEACHER ALLOCATION
//
// GET    /api/class-teacher-assignments
// GET    /api/class-teacher-assignments/:id
// POST   /api/class-teacher-assignments
// PUT    /api/class-teacher-assignments/:id
// DELETE /api/class-teacher-assignments/:id
// =====================================================

mountRoute(
    "/api/class-teacher-assignments",
    classTeacherAssignmentRoutes,
    "CLASS TEACHER ASSIGNMENTS"
);

// =====================================================
// TIMETABLE
// =====================================================

mountRoute(
    "/api/timetable",
    timetableRoutes,
    "TIMETABLE"
);

// =====================================================
// TIMETABLE COMPATIBILITY
//
// Supports:
//
// /api/timetables
//
// as well as:
//
// /api/timetable
// =====================================================

mountRoute(
    "/api/timetables",
    timetableRoutes,
    "TIMETABLE COMPATIBILITY"
);

// =====================================================
// CLASS TEACHER DASHBOARD
// =====================================================

mountRoute(
    "/api/class-teachers",
    classTeacherRoutes,
    "CLASS TEACHER"
);

// =====================================================
// CLASS TEACHER SINGULAR COMPATIBILITY
// =====================================================

mountRoute(
    "/api/class-teacher",
    classTeacherRoutes,
    "CLASS TEACHER COMPATIBILITY"
);
app.get("/db-test", async (req, res) => {
    const [rows] = await db.query(`
        SELECT MAX(session_id) AS latest_session
        FROM attendance_sessions
    `);

    res.json(rows[0]);
});
// =====================================================
// ROUTE CHECK
// =====================================================

app.get(
    "/api/route-check",
    (
        req,
        res
    ) => {

        res.status(200).json({

            success: true,

            message:
                "Attendance API routes are mounted",

            routes: {

                attendance:
                    "/api/attendance",

                attendanceSessions:
                    "/api/attendance-sessions",

                activeSession:
                    "/api/attendance-sessions/active",

                subjectAllocations:
                    "/api/subject-allocations",

                subjectAllocationsStaff:
                    "/api/subject-allocations/staff",

                classTeacherAssignments:
                    "/api/class-teacher-assignments",

                timetable:
                    "/api/timetable",

                timetables:
                    "/api/timetables",

                classTeachers:
                    "/api/class-teachers",

                classTeacher:
                    "/api/class-teacher"
            },

            timestamp:
                new Date().toISOString()
        });
    }
);

// =====================================================
// SPA FALLBACK / 404
// =====================================================

app.use(
    (
        req,
        res
    ) => {
        if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/health")) {
            const indexPath = path.join(frontendDist, "index.html");
            if (fs.existsSync(indexPath)) {
                return res.sendFile(indexPath);
            }
        }

        console.log(
            "404 ROUTE NOT FOUND:",
            req.method,
            req.originalUrl
        );

        res.status(404).json({

            success: false,

            message:
                "API route not found",

            path:
                req.originalUrl,

            method:
                req.method
        });
    }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "================================================"
        );

        console.error(
            "GLOBAL SERVER ERROR"
        );

        console.error(
            "MESSAGE:",
            err.message
        );

        console.error(
            "METHOD:",
            req.method
        );

        console.error(
            "URL:",
            req.originalUrl
        );

        console.error(
            "================================================"
        );

        const requestOrigin =
            req.headers.origin;

        if (
            requestOrigin &&
            allowedOrigins.includes(
                requestOrigin
            )
        ) {

            res.header(
                "Access-Control-Allow-Origin",
                requestOrigin
            );

            res.header(
                "Access-Control-Allow-Credentials",
                "true"
            );

            res.header(
                "Vary",
                "Origin"
            );
        }

        if (
            err.message &&
            err.message.includes(
                "Origin not allowed by CORS"
            )
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "CORS origin not allowed",

                origin:
                    requestOrigin ||
                    null
            });
        }

        return res.status(500).json({

            success: false,

            message:
                "Internal server error",

            error:
                process.env.NODE_ENV ===
                "production"
                    ? undefined
                    : err.message
        });
    }
);

// =====================================================
// START SERVER
// =====================================================

const server =
    app.listen(
        PORT,
        "0.0.0.0",
        () => {

            console.log("");
            console.log(
                "================================================"
            );

            console.log(
                "ATTENDANCE MANAGEMENT SYSTEM"
            );

            console.log(
                "================================================"
            );

            console.log(
                `Server running on port ${PORT}`
            );

            console.log(
                `Environment: ${
                    process.env.NODE_ENV ||
                    "development"
                }`
            );

            console.log("");

            console.log(
                "ROUTES:"
            );

            console.log(
                "  /api/auth"
            );

            console.log(
                "  /api/students"
            );

            console.log(
                "  /api/staff"
            );

            console.log(
                "  /api/departments"
            );

            console.log(
                "  /api/subjects"
            );

            console.log(
                "  /api/classes"
            );

            console.log(
                "  /api/assignments"
            );

            console.log(
                "  /api/attendance"
            );

            console.log(
                "  /api/attendance-sessions"
            );

            console.log(
                "  /api/subject-allocations"
            );

            console.log(
                "  /api/class-teacher-assignments"
            );

            console.log(
                "  /api/timetable"
            );

            console.log(
                "  /api/timetables"
            );

            console.log(
                "  /api/class-teachers"
            );

            console.log(
                "  /api/class-teacher"
            );

            console.log("");

            console.log(
                "HEALTH:"
            );

            console.log(
                `http://localhost:${PORT}/health`
            );

            console.log("");

            console.log(
                "ROUTE CHECK:"
            );

            console.log(
                `http://localhost:${PORT}/api/route-check`
            );

            console.log("");

            console.log(
                "================================================"
            );

            console.log(
                "SERVER READY"
            );

            console.log(
                "================================================"
            );

            console.log("");
        }
    );

// =====================================================
// SERVER ERROR HANDLING
// =====================================================

server.on(
    "error",
    (error) => {

        console.error(
            "SERVER START ERROR:",
            error
        );

        process.exit(1);
    }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = app;