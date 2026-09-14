const express = require("express");
const router = express.Router();

const attendanceRecordController = require("../controllers/attendanceRecordController");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// ATTENDANCE RECORD ROUTES
// =====================================================

// GET /api/attendance-records
// Get all attendance records
router.get(
    "/",
    authMiddleware,
    attendanceRecordController.getAttendanceRecords
);

// =====================================================
// GET RECORD BY ID
// =====================================================

// GET /api/attendance-records/:id
router.get(
    "/:id",
    authMiddleware,
    attendanceRecordController.getAttendanceRecordById
);

// =====================================================
// GET RECORDS BY SESSION
// =====================================================

// GET /api/attendance-records/session/:sessionId
router.get(
    "/session/:sessionId",
    authMiddleware,
    attendanceRecordController.getRecordsBySession
);

// =====================================================
// GET RECORDS BY STUDENT
// =====================================================

// GET /api/attendance-records/student/:studentId
router.get(
    "/student/:studentId",
    authMiddleware,
    attendanceRecordController.getRecordsByStudent
);

// =====================================================
// CREATE ATTENDANCE RECORD
// =====================================================

// POST /api/attendance-records
router.post(
    "/",
    authMiddleware,
    attendanceRecordController.createAttendanceRecord
);

// =====================================================
// UPDATE ATTENDANCE RECORD
// =====================================================

// PUT /api/attendance-records/:id
router.put(
    "/:id",
    authMiddleware,
    attendanceRecordController.updateAttendanceRecord
);

// =====================================================
// DELETE ATTENDANCE RECORD
// =====================================================

// DELETE /api/attendance-records/:id
router.delete(
    "/:id",
    authMiddleware,
    attendanceRecordController.deleteAttendanceRecord
);

// =====================================================
// MARK STUDENT ABSENT
// =====================================================

// POST /api/attendance-records/absent
router.post(
    "/absent",
    authMiddleware,
    attendanceRecordController.markAbsentForSession
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
