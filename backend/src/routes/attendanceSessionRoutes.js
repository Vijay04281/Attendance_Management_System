const express = require("express");

const {
    getAttendanceSessions,
    getAttendanceSessionById,
    getStaffSubjects,
    getStaffTimetable,
    getActiveSession,
    createAttendanceSession,
    getAttendanceSessionQR,
    updateAttendanceSession,
    closeAttendanceSession,
    deleteAttendanceSession
} = require("../controllers/attendanceSessionController");

const authenticateToken =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// GET STAFF SUBJECTS
//
// GET /api/attendance-sessions/staff-subjects
//
// STAFF / TEACHER
// =====================================================

router.get(
    "/staff-subjects",
    authenticateToken,
    authorizeRoles(
        "STAFF",
        "TEACHER"
    ),
    getStaffSubjects
);

// =====================================================
// GET STAFF TIMETABLE
//
// GET /api/attendance-sessions/staff-timetable
//
// STAFF / TEACHER
//
// IMPORTANT:
// This route must be BEFORE /:id.
// =====================================================

router.get(
    "/staff-timetable",
    authenticateToken,
    authorizeRoles(
        "STAFF",
        "TEACHER"
    ),
    getStaffTimetable
);

// =====================================================
// GET ACTIVE SESSION
//
// GET /api/attendance-sessions/active
//
// STAFF / TEACHER
// =====================================================

router.get(
    "/active",
    authenticateToken,
    authorizeRoles(
        "STAFF",
        "TEACHER"
    ),
    getActiveSession
);

// =====================================================
// GET ALL SESSIONS
//
// GET /api/attendance-sessions
//
// ADMIN / HOD / STAFF / TEACHER
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
// CREATE SESSION
//
// POST /api/attendance-sessions
//
// STAFF / TEACHER / ADMIN
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
// GET QR
//
// GET /api/attendance-sessions/:id/qr
//
// IMPORTANT:
// This route must be BEFORE /:id
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
//
// PATCH /api/attendance-sessions/:id/close
//
// IMPORTANT:
// This route must be BEFORE generic /:id
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
//
// PUT /api/attendance-sessions/:id
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
//
// DELETE /api/attendance-sessions/:id
//
// ADMIN ONLY
// =====================================================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles(
        "ADMIN"
    ),
    deleteAttendanceSession
);

// =====================================================
// GET SESSION BY ID
//
// GET /api/attendance-sessions/:id
//
// IMPORTANT:
// Keep this LAST.
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

module.exports = router;