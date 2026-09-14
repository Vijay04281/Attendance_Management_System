const express = require("express");

const {
    getClassTeacherAssignments,
    getClassTeacherAssignmentById,
    createClassTeacherAssignment,
    updateClassTeacherAssignment,
    deleteClassTeacherAssignment
} = require("../controllers/classTeacherAssignmentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// GET ALL ASSIGNMENTS
// =====================================================

router.get(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    getClassTeacherAssignments
);

// =====================================================
// GET ASSIGNMENT BY ID
// =====================================================

router.get(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    getClassTeacherAssignmentById
);

// =====================================================
// CREATE ASSIGNMENT
// =====================================================

router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    createClassTeacherAssignment
);

// =====================================================
// UPDATE ASSIGNMENT
// =====================================================

router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    updateClassTeacherAssignment
);

// =====================================================
// DELETE ASSIGNMENT
// =====================================================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    deleteClassTeacherAssignment
);

module.exports = router;