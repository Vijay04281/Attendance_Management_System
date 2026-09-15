// =====================================================
// CLASS TEACHER ASSIGNMENT ROUTES
// ATTENDANCE MANAGEMENT SYSTEM
// =====================================================

const express = require("express");

const {
    getClassTeacherAssignments,
    getClassTeacherAssignmentById,
    createClassTeacherAssignment,
    updateClassTeacherAssignment,
    deleteClassTeacherAssignment,
    getAssignmentsByClass,
    getAssignmentsByTeacher
} = require("../controllers/classTeacherAssignmentController");

const authenticateToken =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// GET ALL ASSIGNMENTS
// GET /api/class-teacher-assignments
// =====================================================

router.get(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    getClassTeacherAssignments
);

// =====================================================
// GET ASSIGNMENTS BY CLASS
//
// IMPORTANT:
// This must come before /:id
// =====================================================

router.get(
    "/class/:classId",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD",
        "STAFF",
        "TEACHER"
    ),
    getAssignmentsByClass
);

// =====================================================
// GET ASSIGNMENTS BY TEACHER
// =====================================================

router.get(
    "/teacher/:userId",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD",
        "STAFF",
        "TEACHER"
    ),
    getAssignmentsByTeacher
);

// =====================================================
// GET ONE ASSIGNMENT
// GET /api/class-teacher-assignments/:id
// =====================================================

router.get(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    getClassTeacherAssignmentById
);

// =====================================================
// CREATE
// POST /api/class-teacher-assignments
// =====================================================

router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    createClassTeacherAssignment
);

// =====================================================
// UPDATE
// PUT /api/class-teacher-assignments/:id
// =====================================================

router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    updateClassTeacherAssignment
);

// =====================================================
// DELETE
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