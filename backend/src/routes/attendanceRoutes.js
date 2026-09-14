const express = require("express");

const router = express.Router();

const {
    getAttendance,
    getAttendanceById,
    getAttendanceBySession,
    getAttendanceCountBySession,
    getAttendanceByStudent,
    markAttendance,
    scanAttendance,
    updateAttendance,
    deleteAttendance,
    getMySubjectClasses,
    getMySubjectStudents
} = require("../controllers/attendanceController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");


// =====================================================
// ATTENDANCE ROUTES
// =====================================================
//
// Base:
//
// /api/attendance
//
// =====================================================


// =====================================================
// GET ALL ATTENDANCE
// =====================================================
//
// GET /api/attendance
//
// ADMIN
// HOD
// STAFF
// TEACHER
//
// =====================================================

router.get(
    "/",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD",
        "STAFF",
        "TEACHER"
    ),
    getAttendance
);


// =====================================================
// GET ATTENDANCE BY SESSION
// =====================================================
//
// GET /api/attendance/session/:sessionId
//
// =====================================================

router.get(
    "/session/:sessionId",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD",
        "STAFF",
        "TEACHER",
        "STUDENT"
    ),
    getAttendanceBySession
);


// =====================================================
// GET LIVE ATTENDANCE COUNT
// =====================================================
//
// GET /api/attendance/session/:sessionId/count
//
// Used by Staff Dashboard.
//
// =====================================================

router.get(
    "/session/:sessionId/count",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD",
        "STAFF",
        "TEACHER"
    ),
    getAttendanceCountBySession
);


// =====================================================
// GET ATTENDANCE BY STUDENT
// =====================================================
//
// GET /api/attendance/student/:studentId
//
// =====================================================

router.get(
    "/student/:studentId",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD",
        "STAFF",
        "TEACHER",
        "STUDENT"
    ),
    getAttendanceByStudent
);


// =====================================================
// GET MY SUBJECT + CLASS ALLOCATIONS
// =====================================================
//
// GET /api/attendance/my-subject-classes
//
// =====================================================

router.get(
    "/my-subject-classes",
    authenticateToken,
    authorizeRoles(
        "STAFF",
        "TEACHER"
    ),
    getMySubjectClasses
);


// =====================================================
// GET STUDENTS FOR MY SUBJECT + CLASS
// =====================================================
//
// GET /api/attendance/my-subject-students
//
// Example:
//
// /api/attendance/my-subject-students
//     ?subject_id=1
//     &class_id=2
//
// =====================================================

router.get(
    "/my-subject-students",
    authenticateToken,
    authorizeRoles(
        "STAFF",
        "TEACHER"
    ),
    getMySubjectStudents
);


// =====================================================
// MARK ATTENDANCE MANUALLY
// =====================================================
//
// POST /api/attendance
//
// =====================================================

router.post(
    "/",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "STAFF",
        "TEACHER"
    ),
    markAttendance
);


// =====================================================
// SCAN QR ATTENDANCE
// =====================================================
//
// POST /api/attendance/scan
//
// Student sends:
//
// {
//     "qr_token": "..."
// }
//
// Student ID is resolved from JWT.
//
// =====================================================

router.post(
    "/scan",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "STAFF",
        "TEACHER",
        "STUDENT"
    ),
    scanAttendance
);


// =====================================================
// GET ATTENDANCE BY ID
// =====================================================
//
// GET /api/attendance/:id
//
// Keep this AFTER the more specific routes.
//
// =====================================================

router.get(
    "/:id",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD",
        "STAFF",
        "TEACHER"
    ),
    getAttendanceById
);


// =====================================================
// UPDATE ATTENDANCE
// =====================================================
//
// PUT /api/attendance/:id
//
// =====================================================

router.put(
    "/:id",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "STAFF",
        "TEACHER"
    ),
    updateAttendance
);


// =====================================================
// DELETE ATTENDANCE
// =====================================================
//
// DELETE /api/attendance/:id
//
// ADMIN ONLY
//
// =====================================================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles(
        "ADMIN"
    ),
    deleteAttendance
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;