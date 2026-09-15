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

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const staffRoutes = require("./routes/staffRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const classRoutes = require("./routes/classRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const classTeacherRoutes = require("./routes/classTeacherRoutes");

// =====================================================
// EXPRESS APP
// =====================================================

const app = express();

// =====================================================
// TRUST PROXY
// Required for Render
// =====================================================

app.set("trust proxy", 1);

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// ALLOWED CORS ORIGINS
// =====================================================

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",

    // Production frontend
    "https://attendance-management-system-inky-five.vercel.app",
];

// =====================================================
// CORS CONFIGURATION
// IMPORTANT:
// CORS MUST BE BEFORE ALL API ROUTES
// =====================================================

const corsOptions = {
    origin: (origin, callback) => {
        console.log("------------------------------------------------");
        console.log("CORS CHECK");
        console.log("REQUEST ORIGIN:", origin || "NO ORIGIN");

        // Allow requests without Origin
        // Example: Postman, curl, server-to-server
        if (!origin) {
            console.log("CORS ALLOWED: request has no origin");
            return callback(null, true);
        }

        // Allow known origins
        if (allowedOrigins.includes(origin)) {
            console.log("CORS ALLOWED:", origin);
            return callback(null, true);
        }

        // Block unknown origins
        console.error("CORS BLOCKED:", origin);

        return callback(
            new Error(`Origin not allowed by CORS: ${origin}`)
        );
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],

    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
    ],

    optionsSuccessStatus: 204,
};

// =====================================================
// CORS
// MUST COME BEFORE ROUTES
// =====================================================

app.use(cors(corsOptions));

// =====================================================
// EXPRESS 5 SAFE PREFLIGHT HANDLER
//
// DO NOT USE:
// app.options("*", cors(...))
//
// Express 5 may throw:
// PathError: Missing parameter name at index 1: *
// =====================================================

app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        console.log("------------------------------------------------");
        console.log("CORS PREFLIGHT REQUEST");
        console.log(
            "ORIGIN:",
            req.headers.origin || "NO ORIGIN"
        );
        console.log(
            "REQUEST METHOD:",
            req.headers["access-control-request-method"]
        );
        console.log(
            "REQUEST HEADERS:",
            req.headers["access-control-request-headers"]
        );
        console.log("URL:", req.originalUrl);
        console.log("------------------------------------------------");

        return res.status(204).end();
    }

    next();
});

// =====================================================
// BODY PARSERS
// =====================================================

app.use(
    express.json({
        limit: "10mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    })
);

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
    console.log("================================================");
    console.log("REQUEST");
    console.log("METHOD :", req.method);
    console.log("URL    :", req.originalUrl);
    console.log(
        "ORIGIN :",
        req.headers.origin || "NO ORIGIN"
    );
    console.log("IP     :", req.ip);
    console.log("================================================");

    next();
});

// =====================================================
// ROOT ROUTE
// =====================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message:
            "Attendance Management System API is running",
        environment:
            process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
    });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString(),
    });
});

// =====================================================
// API ROOT
// =====================================================

app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Attendance Management System API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

// =====================================================
// ROUTE MOUNT HELPER
// =====================================================

const mountRoute = (path, route, name) => {
    if (!route) {
        console.error(
            `❌ ${name} route is undefined`
        );

        return;
    }

    app.use(path, route);

    console.log(
        `✅ ${name} mounted at ${path}`
    );
};

// =====================================================
// AUTH ROUTES
// =====================================================

mountRoute(
    "/api/auth",
    authRoutes,
    "AUTH"
);

// =====================================================
// STUDENT ROUTES
// =====================================================

mountRoute(
    "/api/students",
    studentRoutes,
    "STUDENTS"
);

// =====================================================
// STAFF ROUTES
// =====================================================

mountRoute(
    "/api/staff",
    staffRoutes,
    "STAFF"
);

// =====================================================
// DEPARTMENT ROUTES
// =====================================================

mountRoute(
    "/api/departments",
    departmentRoutes,
    "DEPARTMENTS"
);

// =====================================================
// SUBJECT ROUTES
// =====================================================

mountRoute(
    "/api/subjects",
    subjectRoutes,
    "SUBJECTS"
);

// =====================================================
// CLASS ROUTES
// =====================================================

mountRoute(
    "/api/classes",
    classRoutes,
    "CLASSES"
);

// =====================================================
// ASSIGNMENT ROUTES
// =====================================================

mountRoute(
    "/api/assignments",
    assignmentRoutes,
    "ASSIGNMENTS"
);

// =====================================================
// ATTENDANCE ROUTES
//
// IMPORTANT:
// Mount this ONLY ONCE.
// =====================================================

mountRoute(
    "/api/attendance",
    attendanceRoutes,
    "ATTENDANCE"
);

// =====================================================
// TIMETABLE ROUTES
// =====================================================

mountRoute(
    "/api/timetable",
    timetableRoutes,
    "TIMETABLE"
);

// =====================================================
// CLASS TEACHER ROUTES
// =====================================================

mountRoute(
    "/api/class-teachers",
    classTeacherRoutes,
    "CLASS TEACHER"
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
    console.log(
        "404 ROUTE NOT FOUND:",
        req.method,
        req.originalUrl
    );

    res.status(404).json({
        success: false,
        message: "API route not found",
        path: req.originalUrl,
        method: req.method,
    });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error("================================================");
    console.error("GLOBAL ERROR");
    console.error("================================================");
    console.error("Message:", err.message);
    console.error("Method:", req.method);
    console.error("URL:", req.originalUrl);
    console.error(
        "Origin:",
        req.headers.origin || "NO ORIGIN"
    );
    console.error("================================================");

    // -------------------------------------------------
    // Re-apply CORS headers for allowed origins
    // -------------------------------------------------

    const requestOrigin = req.headers.origin;

    if (
        requestOrigin &&
        allowedOrigins.includes(requestOrigin)
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

    // -------------------------------------------------
    // CORS ERROR
    // -------------------------------------------------

    if (
        err.message &&
        err.message.includes(
            "Origin not allowed by CORS"
        )
    ) {
        return res.status(403).json({
            success: false,
            message: "CORS origin not allowed",
            origin: requestOrigin || null,
        });
    }

    // -------------------------------------------------
    // GENERAL SERVER ERROR
    // -------------------------------------------------

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
            process.env.NODE_ENV === "production"
                ? undefined
                : err.message,
    });
});

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
                console.log("================================================");
                console.log(
                    "ATTENDANCE MANAGEMENT SYSTEM"
                );
                console.log("================================================");

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
                    "Allowed CORS Origins:"
                );

                allowedOrigins.forEach(
                    (origin) => {
                        console.log(
                            `  ✅ ${origin}`
                        );
                    }
                );

                console.log("");
                console.log("API Base URL:");

                console.log(
                    `  http://localhost:${PORT}/api`
                );

                console.log("");
                console.log("Health:");

                console.log(
                    `  http://localhost:${PORT}/health`
                );

                console.log("");
                console.log("Attendance API:");

                console.log(
                    `  http://localhost:${PORT}/api/attendance`
                );

                console.log("");
                console.log(
                    "Student Attendance API:"
                );

                console.log(
                    `  http://localhost:${PORT}/api/attendance/my`
                );

                console.log("");
                console.log("================================================");
                console.log("SERVER READY");
                console.log("================================================");
                console.log("");
            }
        );
    } catch (error) {
        console.error(
            "❌ Failed to start server"
        );

        console.error(error);

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