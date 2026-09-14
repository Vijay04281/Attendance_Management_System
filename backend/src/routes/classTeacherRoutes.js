const express = require("express");

const classTeacherController = require("../controllers/classTeacherController");

const authenticateToken = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// =====================================================
// CLASS TEACHER DASHBOARD
//
// GET /api/class-teacher/dashboard
// =====================================================

router.get(
    "/dashboard",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getDashboard
);


// =====================================================
// PROFILE
//
// GET /api/class-teacher/profile
// =====================================================

router.get(
    "/profile",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getProfile
);


// =====================================================
// MY CLASS
//
// GET /api/class-teacher/class
// =====================================================

router.get(
    "/class",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getMyClass
);


// =====================================================
// STUDENTS
//
// GET /api/class-teacher/students
// =====================================================

router.get(
    "/students",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getStudents
);


// =====================================================
// STAFF HANDLING CLASS
//
// Primary API:
// GET /api/class-teacher/class-staff
//
// Frontend currently uses:
// /class-teacher/class-staff
// =====================================================

router.get(
    "/class-staff",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getClassStaff
);


// =====================================================
// STAFF HANDLING CLASS - LEGACY / EXISTING API
//
// GET /api/class-teacher/staff
//
// Kept for backward compatibility.
// =====================================================

router.get(
    "/staff",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getClassStaff
);


// =====================================================
// SUBJECT-WISE ATTENDANCE
//
// GET /api/class-teacher/subject-attendance
//
// ?date=2026-09-13
// =====================================================

router.get(
    "/subject-attendance",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getSubjectAttendance
);


// =====================================================
// ABSENT STUDENTS
//
// GET /api/class-teacher/absent-students
//
// ?date=2026-09-13
// =====================================================

router.get(
    "/absent-students",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getAbsentStudents
);


// =====================================================
// CLASS TIMETABLE
//
// GET /api/class-teacher/timetable
// =====================================================

router.get(
    "/timetable",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getTimetable
);


// =====================================================
// ATTENDANCE REPORTS
// =====================================================
//
// These APIs are ONLY for CLASS TEACHER.
//
// Subject Staff does not use these routes.
// =====================================================


// =====================================================
// DAILY ATTENDANCE REPORT
//
// GET /api/class-teacher/reports/daily
//
// Optional:
// ?from=2026-09-01
// ?to=2026-09-13
// =====================================================

router.get(
    "/reports/daily",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getDailyAttendanceReport
);


// =====================================================
// SUBJECT-WISE ATTENDANCE REPORT
//
// GET /api/class-teacher/reports/subject
// =====================================================

router.get(
    "/reports/subject",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getSubjectAttendanceReport
);


// =====================================================
// DEPARTMENT-WISE ATTENDANCE REPORT
//
// GET /api/class-teacher/reports/department
// =====================================================

router.get(
    "/reports/department",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getDepartmentAttendanceReport
);


// =====================================================
// STUDENT ATTENDANCE PERCENTAGE REPORT
//
// GET /api/class-teacher/reports/students
// =====================================================

router.get(
    "/reports/students",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getStudentAttendanceReport
);


// =====================================================
// CLASS-WISE ATTENDANCE REPORT
//
// GET /api/class-teacher/reports/class
// =====================================================

router.get(
    "/reports/class",
    authenticateToken,
    authorizeRoles("TEACHER"),
    classTeacherController.getClassAttendanceReport
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;