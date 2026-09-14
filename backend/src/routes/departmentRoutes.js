const express = require("express");

const {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require("../controllers/departmentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// GET ALL DEPARTMENTS
// GET /api/departments
// =====================================================

router.get(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    getDepartments
);

// =====================================================
// CREATE DEPARTMENT
// POST /api/departments
// =====================================================

router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    createDepartment
);

// =====================================================
// UPDATE DEPARTMENT
// PUT /api/departments/:id
// =====================================================

router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    updateDepartment
);

// =====================================================
// DELETE DEPARTMENT
// DELETE /api/departments/:id
// =====================================================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    deleteDepartment
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;