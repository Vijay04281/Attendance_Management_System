// =====================================================
// ATTENDANCE MANAGEMENT SYSTEM
// BACKEND SERVER
// =====================================================

// =====================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// =====================================================

const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "../.env");

const envResult = dotenv.config({
  path: envPath,
  override: true,
});

// =====================================================
// ENVIRONMENT VALIDATION
// =====================================================

console.log("================================================");
console.log("Environment Configuration");
console.log("================================================");
console.log("ENV FILE:", envPath);

if (envResult.error) {
  console.error("ERROR LOADING .env:");
  console.error(envResult.error.message);
} else {
  console.log(".env file loaded successfully");
}

console.log("DB_HOST:", process.env.DB_HOST || "undefined");
console.log("DB_PORT:", process.env.DB_PORT || "undefined");
console.log("DB_USER:", process.env.DB_USER || "undefined");
console.log("DB_NAME:", process.env.DB_NAME || "undefined");
console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD ? "LOADED" : "NOT LOADED"
);
console.log("PORT:", process.env.PORT || "5000");
console.log(
  "JWT_SECRET:",
  process.env.JWT_SECRET ? "LOADED" : "NOT LOADED"
);
console.log("================================================");

// =====================================================
// REQUIRED ENVIRONMENT VARIABLES
// =====================================================

const requiredEnv = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
];

const missingEnv = requiredEnv.filter(
  (key) => !process.env[key] || String(process.env[key]).trim() === ""
);

if (missingEnv.length > 0) {
  console.error("");
  console.error("================================================");
  console.error("MISSING ENVIRONMENT VARIABLES");
  console.error("================================================");
  console.error(missingEnv.join(", "));
  console.error("================================================");
  console.error("");
  process.exit(1);
}

// =====================================================
// IMPORT DEPENDENCIES AFTER ENV IS LOADED
// =====================================================

const express = require("express");
const cors = require("cors");

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
const attendanceSessionRoutes = require("./routes/attendanceSessionRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const classTeacherRoutes = require("./routes/classTeacherRoutes");
const classTeacherAssignmentRoutes = require("./routes/classTeacherAssignmentRoutes");
const subjectAllocationRoutes = require("./routes/subjectAllocationRoutes");
const attendanceRecordRoutes = require("./routes/attendanceRecordRoutes");
const attendanceReportRoutes = require("./routes/attendanceReportRoutes");
const qrCodeRoutes = require("./routes/qrCodeRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const adminRoutes = require("./routes/adminRoutes");

// =====================================================
// EXPRESS APP
// =====================================================

const app = express();

app.use(
    "/api/attendance",
    attendanceRoutes
);
// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://attendance-management-system-inky-five.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow Postman, server-to-server, mobile apps
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

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
};

// Handle preflight requests
app.options("*", cors(corsOptions));

// Apply CORS
app.use(cors(corsOptions));

// Extra safety headers
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  res.header(
    "Access-Control-Allow-Credentials",
    "true"
  );

  next();
});

// =====================================================
// BODY PARSERS
// =====================================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );

  next();
});

// =====================================================
// ROOT
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Attendance Management System API is running",
    version: "1.0.0",
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    database: "configured",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// ROUTE MOUNT HELPER
// =====================================================

const mountRoute = (path, route, name) => {
  if (!route) {
    console.error(`✗ ${name} FAILED - route is undefined`);
    return;
  }

  app.use(path, route);

  console.log(`✓ Mounted ${name} -> ${path}`);
};

// =====================================================
// MOUNT ROUTES
// =====================================================

mountRoute("/api/auth", authRoutes, "authRoutes");

mountRoute("/api/students", studentRoutes, "studentRoutes");

mountRoute("/api/staff", staffRoutes, "staffRoutes");

mountRoute(
  "/api/departments",
  departmentRoutes,
  "departmentRoutes"
);

mountRoute("/api/subjects", subjectRoutes, "subjectRoutes");

mountRoute("/api/classes", classRoutes, "classRoutes");

mountRoute(
  "/api/assignments",
  assignmentRoutes,
  "assignmentRoutes"
);

mountRoute(
  "/api/timetables",
  timetableRoutes,
  "timetableRoutes"
);

mountRoute(
  "/api/subject-allocations",
  subjectAllocationRoutes,
  "subjectAllocationRoutes"
);

mountRoute(
  "/api/attendance-sessions",
  attendanceSessionRoutes,
  "attendanceSessionRoutes"
);

mountRoute(
  "/api/attendance",
  attendanceRoutes,
  "attendanceRoutes"
);

mountRoute(
  "/api/attendance-records",
  attendanceRecordRoutes,
  "attendanceRecordRoutes"
);

mountRoute(
  "/api/attendance-reports",
  attendanceReportRoutes,
  "attendanceReportRoutes"
);

mountRoute(
  "/api/qr-codes",
  qrCodeRoutes,
  "qrCodeRoutes"
);

mountRoute(
  "/api/class-teacher",
  classTeacherRoutes,
  "classTeacherRoutes"
);

mountRoute(
  "/api/class-teacher-assignments",
  classTeacherAssignmentRoutes,
  "classTeacherAssignmentRoutes"
);

mountRoute(
  "/api/admin",
  adminRoutes,
  "adminRoutes"
);

mountRoute(
  "/api/audit-logs",
  auditLogRoutes,
  "auditLogRoutes"
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("================================================");
  console.error("GLOBAL SERVER ERROR");
  console.error("================================================");
  console.error(err);
  console.error("================================================");

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// =====================================================
// SERVER PORT
// =====================================================

const PORT = Number(process.env.PORT) || 5000;

// =====================================================
// START SERVER
// =====================================================

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("==============================================");
  console.log("Attendance Management System API");
  console.log("==============================================");
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://localhost:${PORT}`);
  console.log("==============================================");
  console.log("Server started successfully");
  console.log("==============================================");
});

// =====================================================
// SERVER ERROR
// =====================================================

server.on("error", (error) => {
  console.error("");
  console.error("================================================");
  console.error("SERVER START ERROR");
  console.error("================================================");

  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error(error);
  }

  console.error("================================================");
});

// =====================================================
// PROCESS ERROR HANDLERS
// =====================================================

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:");
  console.error(error);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED PROMISE REJECTION:");
  console.error(reason);
});