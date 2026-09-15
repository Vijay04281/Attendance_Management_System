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
    require("../middleware/authMiddleware")
        .authenticateToken;

const authorizeRoles =
    require("../middleware/authMiddleware")
        .authorizeRoles;

const router = express.Router();

// =====================================================
// GET ALL
//
// GET /api/class-teacher-assignments
// =====================================================

router.get(
    "/",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD"
    ),
    getClassTeacherAssignments
);

// =====================================================
// GET BY CLASS
//
// IMPORTANT:
// Must appear before /:id
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
// GET BY TEACHER
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
// GET ONE
// =====================================================

router.get(
    "/:id",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD"
    ),
    getClassTeacherAssignmentById
);

// =====================================================
// CREATE
// =====================================================

router.post(
    "/",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD"
    ),
    createClassTeacherAssignment
);

// =====================================================
// UPDATE
// =====================================================

router.put(
    "/:id",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD"
    ),
    updateClassTeacherAssignment
);

// =====================================================
// DELETE
// =====================================================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD"
    ),
    deleteClassTeacherAssignment
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;