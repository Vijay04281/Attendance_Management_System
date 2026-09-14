const express = require("express");
const router = express.Router();

const staffController = require("../controllers/staffController");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// STAFF ROUTES
// =====================================================

// GET /api/staff
// Get all staff
router.get(
    "/",
    authMiddleware,
    staffController.getStaff
);

// GET /api/staff/:id
// Get staff member by ID
router.get(
    "/:id",
    authMiddleware,
    staffController.getStaffById
);

// POST /api/staff
// Create staff
router.post(
    "/",
    authMiddleware,
    staffController.createStaff
);

// PUT /api/staff/:id
// Update staff
router.put(
    "/:id",
    authMiddleware,
    staffController.updateStaff
);

// DELETE /api/staff/:id
// Delete staff
router.delete(
    "/:id",
    authMiddleware,
    staffController.deleteStaff
);

module.exports = router;