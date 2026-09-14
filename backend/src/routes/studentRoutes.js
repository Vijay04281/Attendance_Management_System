// =====================================================
// studentRoutes.js
// Attendance Management System
// =====================================================

const express = require("express");

const router = express.Router();

const studentController = require("../controllers/studentController");

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// STUDENT ROUTES
// =====================================================

// -----------------------------------------------------
// GET /api/students
// Get all students
// -----------------------------------------------------

router.get(
  "/",
  authMiddleware,
  studentController.getStudents
);

// -----------------------------------------------------
// GET /api/students/class/:classId
// Get ONLY students belonging to a class
// -----------------------------------------------------

router.get(
  "/class/:classId",
  authMiddleware,
  studentController.getStudentsByClass
);

// -----------------------------------------------------
// GET /api/students/:id
// Get student by ID
// -----------------------------------------------------

router.get(
  "/:id",
  authMiddleware,
  studentController.getStudentById
);

// -----------------------------------------------------
// POST /api/students
// Create student
// -----------------------------------------------------

router.post(
  "/",
  authMiddleware,
  studentController.createStudent
);

// -----------------------------------------------------
// PUT /api/students/:id
// Update student
// -----------------------------------------------------

router.put(
  "/:id",
  authMiddleware,
  studentController.updateStudent
);

// -----------------------------------------------------
// DELETE /api/students/:id
// Delete student
// -----------------------------------------------------

router.delete(
  "/:id",
  authMiddleware,
  studentController.deleteStudent
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;