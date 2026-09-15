// =====================================================
// SERVER.JS
// ATTENDANCE MANAGEMENT SYSTEM
// =====================================================

const express = require("express");
const cors = require("cors");

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

// =====================================================
// ATTENDANCE SESSION ROUTES
// =====================================================

const attendanceSessionRoutes =
    require(
        "./routes/attendanceSessionRoutes"
    );

// =====================================================
// SUBJECT ALLOCATION ROUTES
// =====================================================
//
// Provides:
//
// GET    /api/subject-allocations
// GET    /api/subject-allocations/staff
// GET    /api/subject-allocations/:id
// POST   /api/subject-allocations
// PUT    /api/subject-allocations/:id
// DELETE /api/subject-allocations/:id
// =====================================================

const subjectAllocationRoutes =
    require(
        "./routes/subjectAllocationRoutes"
    );

// =====================================================
// CLASS TEACHER ASSIGNMENT ROUTES
// =====================================================
//
// Provides:
//
// GET    /api/class-teacher-assignments
// GET    /api/class-teacher-assignments/:id
// GET    /api/class-teacher-assignments/class/:classId
// GET    /api/class-teacher-assignments/teacher/:userId
// POST   /api/class-teacher-assignments
// PUT    /api/class-teacher-assignments/:id
// DELETE /api/class-teacher-assignments/:id
// =====================================================

const classTeacherAssignmentRoutes =
    require(
        "./routes/classTeacherAssignmentRoutes"
    );

// =====================================================
// AUTH MIDDLEWARE
// =====================================================

const {
    authenticateToken,
    authorizeRoles
} = require(
    "./middleware/authMiddleware"
);

// =====================================================
// OTHER ROUTES
// =====================================================

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
// Required for Render
// =====================================================

app.set(
    "trust proxy",
    1
);

// =====================================================
// PORT
// =====================================================

const PORT =
    process.env.PORT || 5000;

// =====================================================
// ALLOWED CORS ORIGINS
// =====================================================

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",

    // Vercel frontend
    "https://attendance-management-system-inky-five.vercel.app",

    // Render frontend
    "https://attendance-management-system-gpci.onrender.com"
];

// =====================================================
// CORS CONFIGURATION
// =====================================================

const corsOptions = {
    origin: (
        origin,
        callback
    ) => {
        console.log(
            "------------------------------------------------"
        );

        console.log(
            "CORS CHECK"
        );

        console.log(
            "REQUEST ORIGIN:",
            origin ||
                "NO ORIGIN"
        );

        // ---------------------------------------------
        // Requests without origin
        // ---------------------------------------------

        if (!origin) {
            console.log(
                "CORS ALLOWED: request has no origin"
            );

            return callback(
                null,
                true
            );
        }

        // ---------------------------------------------
        // Allowed origin
        // ---------------------------------------------

        if (
            allowedOrigins.includes(
                origin
            )
        ) {
            console.log(
                "CORS ALLOWED:",
                origin
            );

            return callback(
                null,
                true
            );
        }

        // ---------------------------------------------
        // Blocked origin
        // ---------------------------------------------

        console.error(
            "CORS BLOCKED:",
            origin
        );

        return callback(
            new Error(
                `Origin not allowed by CORS: ${origin}`
            )
        );
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization"
    ],

    optionsSuccessStatus: 204
};

// =====================================================
// CORS
// MUST COME BEFORE API ROUTES
// =====================================================

app.use(
    cors(corsOptions)
);

// =====================================================
// EXPRESS 5 SAFE PREFLIGHT HANDLER
// =====================================================

app.use(
    (
        req,
        res,
        next
    ) => {
        if (
            req.method ===
            "OPTIONS"
        ) {
            console.log(
                "------------------------------------------------"
            );

            console.log(
                "CORS PREFLIGHT REQUEST"
            );

            console.log(
                "ORIGIN:",
                req.headers.origin ||
                    "NO ORIGIN"
            );

            console.log(
                "REQUEST METHOD:",
                req.headers[
                    "access-control-request-method"
                ]
            );

            console.log(
                "REQUEST HEADERS:",
                req.headers[
                    "access-control-request-headers"
                ]
            );

            console.log(
                "URL:",
                req.originalUrl
            );

            console.log(
                "------------------------------------------------"
            );

            return res
                .status(204)
                .end();
        }

        next();
    }
);

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
            "REQUEST"
        );

        console.log(
            "METHOD :",
            req.method
        );

        console.log(
            "URL    :",
            req.originalUrl
        );

        console.log(
            "ORIGIN :",
            req.headers.origin ||
                "NO ORIGIN"
        );

        console.log(
            "IP     :",
            req.ip
        );

        console.log(
            "================================================"
        );

        next();
    }
);

// =====================================================
// ROOT ROUTE
// =====================================================

app.get(
    "/",
    (
        req,
        res
    ) => {
        res.status(200).json({
            success: true,

            message:
                "Attendance Management System API is running",

            environment:
                process.env.NODE_ENV ||
                "development",

            timestamp:
                new Date().toISOString()
        });
    }
);

// =====================================================
// HEALTH CHECK
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
// =====================================================
//
// THIS WAS MISSING FROM YOUR PREVIOUS SERVER.JS.
//
// Admin Subject Staff requires:
//
// GET
// POST
// PUT
// DELETE
//
// /api/subject-allocations
// =====================================================

mountRoute(
    "/api/subject-allocations",
    subjectAllocationRoutes,
    "SUBJECT ALLOCATIONS"
);

// =====================================================
// CLASS TEACHER ASSIGNMENTS
// =====================================================
//
// THIS FIXES:
//
// GET
// /api/class-teacher-assignments
//
// POST
// /api/class-teacher-assignments
//
// PUT
// /api/class-teacher-assignments/:id
//
// DELETE
// /api/class-teacher-assignments/:id
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
// Supports frontend code using:
//
// /api/timetables
//
// Existing:
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
//
// Existing router
// =====================================================

mountRoute(
    "/api/class-teachers",
    classTeacherRoutes,
    "CLASS TEACHER"
);

// =====================================================
// CLASS TEACHER SINGULAR COMPATIBILITY
//
// Some frontend code may use:
//
// /api/class-teacher
// =====================================================

mountRoute(
    "/api/class-teacher",
    classTeacherRoutes,
    "CLASS TEACHER COMPATIBILITY"
);

// =====================================================
// DEVELOPMENT ROUTE CHECK
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

                staffSubjects:
                    "/api/attendance-sessions/staff-subjects",

                subjectAllocations:
                    "/api/subject-allocations",

                subjectAllocationsStaff:
                    "/api/subject-allocations/staff",

                classTeacherAssignments:
                    "/api/class-teacher-assignments",

                timetable:
                    "/api/timetable",

                timetablesCompatibility:
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
// 404 HANDLER
// =====================================================

app.use(
    (
        req,
        res
    ) => {
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
            "GLOBAL ERROR"
        );

        console.error(
            "================================================"
        );

        console.error(
            "Message:",
            err.message
        );

        console.error(
            "Method:",
            req.method
        );

        console.error(
            "URL:",
            req.originalUrl
        );

        console.error(
            "Origin:",
            req.headers.origin ||
                "NO ORIGIN"
        );

        console.error(
            "================================================"
        );

        const requestOrigin =
            req.headers.origin;

        // ---------------------------------------------
        // CORS HEADERS
        // ---------------------------------------------

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

        // ---------------------------------------------
        // CORS ERROR
        // ---------------------------------------------

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

        // ---------------------------------------------
        // GENERAL ERROR
        // ---------------------------------------------

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

const startServer = () => {
    try {
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
                    `Server running on port: ${PORT}`
                );

                console.log(
                    `Environment: ${
                        process.env.NODE_ENV ||
                        "development"
                    }`
                );

                console.log("");

                console.log(
                    "API ROUTES"
                );

                console.log("");

                console.log(
                    `  AUTH:                 /api/auth`
                );

                console.log(
                    `  STUDENTS:             /api/students`
                );

                console.log(
                    `  STAFF:                /api/staff`
                );

                console.log(
                    `  DEPARTMENTS:          /api/departments`
                );

                console.log(
                    `  SUBJECTS:              /api/subjects`
                );

                console.log(
                    `  CLASSES:               /api/classes`
                );

                console.log(
                    `  ASSIGNMENTS:           /api/assignments`
                );

                console.log(
                    `  ATTENDANCE:            /api/attendance`
                );

                console.log(
                    `  ATTENDANCE SESSIONS:   /api/attendance-sessions`
                );

                console.log(
                    `  SUBJECT ALLOCATIONS:   /api/subject-allocations`
                );

                console.log(
                    `  CLASS TEACHER ASSIGN:  /api/class-teacher-assignments`
                );

                console.log(
                    `  TIMETABLE:             /api/timetable`
                );

                console.log(
                    `  TIMETABLE COMPAT:      /api/timetables`
                );

                console.log(
                    `  CLASS TEACHERS:        /api/class-teachers`
                );

                console.log(
                    `  CLASS TEACHER COMPAT:  /api/class-teacher`
                );

                console.log("");

                console.log(
                    "HEALTH:"
                );

                console.log(
                    `  http://localhost:${PORT}/health`
                );

                console.log("");

                console.log(
                    "ROUTE CHECK:"
                );

                console.log(
                    `  http://localhost:${PORT}/api/route-check`
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
    } catch (error) {
        console.error(
            "❌ Failed to start server"
        );

        console.error(
            error
        );

        process.exit(1);
    }
};

// =====================================================
// START
// =====================================================

startServer();

// =====================================================
// EXPORT
// =====================================================

module.exports = app;