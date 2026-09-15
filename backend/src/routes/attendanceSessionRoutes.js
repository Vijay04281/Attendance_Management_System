
const express = require("express");

const router = express.Router();

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const {
    getStaffSubjects,
    getStaffTimetable,
    getActiveSession,
    getAttendanceSessions,
    getAttendanceSessionById,
    createAttendanceSession,
    getAttendanceSessionQR,
    updateAttendanceSession,
    closeAttendanceSession,
    deleteAttendanceSession,
} = require("../controllers/attendanceSessionController");

// =====================================================
// ATTENDANCE SESSION ROUTES
// =====================================================
//
// BASE URL:
//
// /api/attendance-sessions
//
// IMPORTANT ROUTES:
//
// GET  /api/attendance-sessions/staff-subjects
// GET  /api/attendance-sessions/staff-timetable
// GET  /api/attendance-sessions/active
//
// GET  /api/attendance-sessions
// POST /api/attendance-sessions
// GET  /api/attendance-sessions/:id
// GET  /api/attendance-sessions/:id/qr
// PATCH /api/attendance-sessions/:id/close
// PUT /api/attendance-sessions/:id
// DELETE /api/attendance-sessions/:id
//
// =====================================================


// =====================================================
// STAFF SUBJECTS
// =====================================================
//
// Main endpoint:
//
// GET /api/attendance-sessions/staff-subjects
//
// =====================================================

router.get(
    "/staff-subjects",
    authenticateToken,
    authorizeRoles("STAFF", "TEACHER"),
    getStaffSubjects
);


// =====================================================
// STAFF SUBJECT ALLOCATIONS
// =====================================================
//
// COMPATIBILITY ENDPOINT
//
// Some frontend code calls:
//
// GET /api/allocations/staff
//
// If this router is mounted only at:
//
// /api/attendance-sessions
//
// this route becomes:
//
// /api/attendance-sessions/allocations/staff
//
// Therefore this route alone CANNOT create
// /api/allocations/staff.
//
// The actual /api/allocations/staff compatibility
// route is handled in server.js below.
// =====================================================


// =====================================================
// STAFF TIMETABLE
// =====================================================
//
// GET /api/attendance-sessions/staff-timetable
//
// =====================================================

router.get(
    "/staff-timetable",
    authenticateToken,
    authorizeRoles("STAFF", "TEACHER"),
    getStaffTimetable
);


// =====================================================
// ACTIVE SESSION
// =====================================================
//
// IMPORTANT:
//
// This route MUST appear before /:id.
//
// GET /api/attendance-sessions/active
//
// =====================================================

router.get(
    "/active",
    authenticateToken,
    authorizeRoles("STAFF", "TEACHER"),
    getActiveSession
);


// =====================================================
// ALL ATTENDANCE SESSIONS
// =====================================================
//
// GET /api/attendance-sessions
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
    getAttendanceSessions
);


// =====================================================
// CREATE ATTENDANCE SESSION
// =====================================================
//
// POST /api/attendance-sessions
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
    createAttendanceSession
);


// =====================================================
// GET SESSION QR
// =====================================================
//
// GET /api/attendance-sessions/:id/qr
//
// =====================================================

router.get(
    "/:id/qr",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "STAFF",
        "TEACHER"
    ),
    getAttendanceSessionQR
);


// =====================================================
// CLOSE SESSION
// =====================================================
//
// PATCH /api/attendance-sessions/:id/close
//
// This also automatically creates ABSENT records
// for eligible students who did not attend.
//
// =====================================================

router.patch(
    "/:id/close",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "STAFF",
        "TEACHER"
    ),
    closeAttendanceSession
);


// =====================================================
// UPDATE SESSION
// =====================================================
//
// PUT /api/attendance-sessions/:id
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
    updateAttendanceSession
);


// =====================================================
// DELETE SESSION
// =====================================================
//
// DELETE /api/attendance-sessions/:id
//
// =====================================================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN"),
    deleteAttendanceSession
);


// =====================================================
// GET SESSION BY ID
// =====================================================
//
// IMPORTANT:
//
// This MUST be the LAST GET route.
//
// GET /api/attendance-sessions/:id
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
    getAttendanceSessionById
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;