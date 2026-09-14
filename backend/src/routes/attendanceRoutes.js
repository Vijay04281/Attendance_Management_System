const express = require("express");

const {
    getAttendance,
    getAttendanceById,
    getAttendanceBySession,
    getAttendanceByStudent,
    markAttendance,
    scanAttendance,
    updateAttendance,
    deleteAttendance
} = require("../controllers/attendanceController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// GET ALL ATTENDANCE
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
// IMPORTANT: before /:id
// =====================================================

router.get(
    "/session/:sessionId",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD",
        "STAFF",
        "TEACHER"
    ),
    getAttendanceBySession
);

// =====================================================
// GET ATTENDANCE BY STUDENT
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
// MARK ATTENDANCE
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
// QR SCAN ATTENDANCE
// STUDENT CAN USE THIS
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
// Keep after /session and /student routes
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
// ADMIN ONLY
// =====================================================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN"),
    deleteAttendance
);

module.exports = router;