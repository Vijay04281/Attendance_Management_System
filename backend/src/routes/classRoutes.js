const express = require("express");

const router = express.Router();

const classController = require("../controllers/classController");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// CLASS ROUTES
// Base URL: /api/classes
// =====================================================

// Get all classes
router.get(
    "/",
    authMiddleware,
    classController.getClasses
);

// Get classes by department
// IMPORTANT: keep this BEFORE /:id
router.get(
    "/department/:departmentId",
    authMiddleware,
    classController.getClassesByDepartment
);

// Get class by ID
router.get(
    "/:id",
    authMiddleware,
    classController.getClassById
);

// Create class
router.post(
    "/",
    authMiddleware,
    classController.createClass
);

// Update class
router.put(
    "/:id",
    authMiddleware,
    classController.updateClass
);

// Delete class
router.delete(
    "/:id",
    authMiddleware,
    classController.deleteClass
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;