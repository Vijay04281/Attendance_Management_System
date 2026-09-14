const express = require("express");

const {
    getAssignments,
    createAssignment,
    deleteAssignment
} = require("../controllers/assignmentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// HOD can view assignments
router.get(
    "/",
    authenticateToken,
    authorizeRoles("HOD"),
    getAssignments
);

// HOD can create assignment
router.post(
    "/",
    authenticateToken,
    authorizeRoles("HOD"),
    createAssignment
);

// HOD can delete assignment
router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("HOD"),
    deleteAssignment
);

module.exports = router;