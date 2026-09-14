const express = require("express");
const router = express.Router();

const attendanceReportController = require("../controllers/attendanceReportController");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// GET ALL ATTENDANCE REPORTS
// =====================================================

// GET /api/attendance-reports
router.get(
    "/",
    authMiddleware,
    attendanceReportController.getAttendanceReports
);

// =====================================================
// GET ATTENDANCE REPORT BY ID
// =====================================================

// GET /api/attendance-reports/:id
router.get(
    "/:id",
    authMiddleware,
    attendanceReportController.getAttendanceReportById
);

// =====================================================
// GET STUDENT ATTENDANCE REPORT
// =====================================================

// GET /api/attendance-reports/student/:studentId
router.get(
    "/student/:studentId",
    authMiddleware,
    attendanceReportController.getStudentAttendanceReport
);

// =====================================================
// GET CLASS ATTENDANCE REPORT
// =====================================================

// GET /api/attendance-reports/class/:classId
router.get(
    "/class/:classId",
    authMiddleware,
    attendanceReportController.getClassAttendanceReport
);

// =====================================================
// CREATE ATTENDANCE REPORT
// =====================================================

// POST /api/attendance-reports
router.post(
    "/",
    authMiddleware,
    attendanceReportController.createAttendanceReport
);

// =====================================================
// GENERATE / RECALCULATE ATTENDANCE REPORT
// =====================================================

// POST /api/attendance-reports/generate
router.post(
    "/generate",
    authMiddleware,
    attendanceReportController.generateAttendanceReport
);

// =====================================================
// UPDATE ATTENDANCE REPORT
// =====================================================

// PUT /api/attendance-reports/:id
router.put(
    "/:id",
    authMiddleware,
    attendanceReportController.updateAttendanceReport
);

// =====================================================
// DELETE ATTENDANCE REPORT
// =====================================================

// DELETE /api/attendance-reports/:id
router.delete(
    "/:id",
    authMiddleware,
    attendanceReportController.deleteAttendanceReport
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
