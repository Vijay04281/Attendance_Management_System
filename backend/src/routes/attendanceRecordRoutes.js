const express = require("express");

const router = express.Router();

const attendanceRecordController = require("../controllers/attendanceRecordController");

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// ATTENDANCE RECORD ROUTES
// =====================================================
//
// Mounted from server.js as:
//
// /api/attendance-records
//
// IMPORTANT:
// Specific routes MUST come before /:id
// because Express matches routes from top to bottom.
// =====================================================


// =====================================================
// GET ALL ATTENDANCE RECORDS
// =====================================================
//
// GET /api/attendance-records
//
// Used by:
// - Admin attendance page
// - Staff attendance page
// - Attendance reports
//
// Reads attendance from the main `attendance` table.
// =====================================================

router.get(
    "/",
    authMiddleware,
    attendanceRecordController.getAttendanceRecords
);


// =====================================================
// GET LATEST ATTENDANCE RECORD
// =====================================================
//
// GET /api/attendance-records/latest
//
// Used for live attendance display.
//
// IMPORTANT:
// This route MUST be before /:id.
// Otherwise "latest" will be treated as an ID.
// =====================================================

router.get(
    "/latest",
    authMiddleware,
    attendanceRecordController.getLatestAttendance
);


// =====================================================
// GET ATTENDANCE COUNT BY SESSION
// =====================================================
//
// GET /api/attendance-records/session/:sessionId/count
//
// Returns:
// - total
// - present
// - late
// - absent
//
// IMPORTANT:
// This route MUST come before:
// /session/:sessionId
//
// Otherwise "count" can be interpreted as the session ID.
// =====================================================

router.get(
    "/session/:sessionId/count",
    authMiddleware,
    attendanceRecordController.getAttendanceCountBySession
);


// =====================================================
// GET ATTENDANCE RECORDS BY SESSION
// =====================================================
//
// GET /api/attendance-records/session/:sessionId
//
// Used heavily by:
// - Staff dashboard
// - Admin attendance page
// - Live attendance
// =====================================================

router.get(
    "/session/:sessionId",
    authMiddleware,
    attendanceRecordController.getRecordsBySession
);


// =====================================================
// GET ATTENDANCE RECORDS BY STUDENT
// =====================================================
//
// GET /api/attendance-records/student/:studentId
//
// Used by:
// - Student attendance history
// - Admin student attendance
// - Attendance reports
// =====================================================

router.get(
    "/student/:studentId",
    authMiddleware,
    attendanceRecordController.getRecordsByStudent
);


// =====================================================
// GET ATTENDANCE RECORD BY ID
// =====================================================
//
// GET /api/attendance-records/:id
//
// IMPORTANT:
// This MUST remain AFTER all specific routes.
//
// Otherwise:
// /latest
// /session/10
// /student/5
//
// could be interpreted as an ID route.
// =====================================================

router.get(
    "/:id",
    authMiddleware,
    attendanceRecordController.getAttendanceRecordById
);


// =====================================================
// CREATE ATTENDANCE RECORD
// =====================================================
//
// POST /api/attendance-records
//
// Creates a record in the main `attendance` table.
//
// Normal QR scanning should continue to use:
//
// POST /api/attendance/scan
//
// This endpoint is available for administrative/manual
// attendance operations.
// =====================================================

router.post(
    "/",
    authMiddleware,
    attendanceRecordController.createAttendanceRecord
);


// =====================================================
// UPDATE ATTENDANCE RECORD
// =====================================================
//
// PUT /api/attendance-records/:id
//
// Used for administrative attendance correction.
// =====================================================

router.put(
    "/:id",
    authMiddleware,
    attendanceRecordController.updateAttendanceRecord
);


// =====================================================
// DELETE ATTENDANCE RECORD
// =====================================================
//
// DELETE /api/attendance-records/:id
//
// Used for administrative deletion/correction.
// =====================================================

router.delete(
    "/:id",
    authMiddleware,
    attendanceRecordController.deleteAttendanceRecord
);


// =====================================================
// MARK STUDENT ABSENT
// =====================================================
//
// POST /api/attendance-records/absent
//
// Used when attendance needs to be marked ABSENT.
// =====================================================
//
// IMPORTANT:
// This route is after GET /:id, but that is OK because
// this is a POST request and /:id above is GET only.
// =====================================================

router.post(
    "/absent",
    authMiddleware,
    attendanceRecordController.markAbsentForSession
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;