// =====================================================
// classTeacherAssignmentRoutes.js
// Attendance Management System
//
// ADMIN / HOD CLASS TEACHER ASSIGNMENT ROUTES
// =====================================================

const express = require("express");

const {
    getClassTeacherAssignments,
    getClassTeacherAssignmentById,
    createClassTeacherAssignment,
    updateClassTeacherAssignment,
    deleteClassTeacherAssignment,
} = require("../controllers/classTeacherAssignmentController");

const authenticateToken =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// GET ALL CLASS TEACHER ASSIGNMENTS
// =====================================================
//
// GET /api/class-teacher-assignments
//
// ADMIN and HOD can view assignments.
// =====================================================

router.get(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    getClassTeacherAssignments
);

// =====================================================
// GET SINGLE CLASS TEACHER ASSIGNMENT
// =====================================================
//
// GET /api/class-teacher-assignments/:id
//
// IMPORTANT:
// This route must remain AFTER the "/" route.
// =====================================================

router.get(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    getClassTeacherAssignmentById
);

// =====================================================
// CREATE CLASS TEACHER ASSIGNMENT
// =====================================================
//
// POST /api/class-teacher-assignments
//
// ADMIN and HOD can create assignments.
// =====================================================

router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    createClassTeacherAssignment
);

// =====================================================
// UPDATE CLASS TEACHER ASSIGNMENT
// =====================================================
//
// PUT /api/class-teacher-assignments/:id
// =====================================================

router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    updateClassTeacherAssignment
);

// =====================================================
// DELETE CLASS TEACHER ASSIGNMENT
// =====================================================
//
// DELETE /api/class-teacher-assignments/:id
// =====================================================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    deleteClassTeacherAssignment
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;