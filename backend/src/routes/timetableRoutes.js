
const express = require("express");

const {
    getTimetables,
    getTimetableById,
    createTimetable,
    updateTimetable,
    deleteTimetable,
    getStaffTimetable,
    getStudentTimetable,
} = require("../controllers/timetableController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// STAFF TIMETABLE
// IMPORTANT:
// Keep /staff BEFORE /:id
// =====================================================

router.get(
    "/staff",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD",
        "STAFF",
        "TEACHER"
    ),
    getStaffTimetable
);

// =====================================================
// STUDENT TIMETABLE
// IMPORTANT:
// Keep /student BEFORE /:id
// =====================================================

router.get(
    "/student",
    authenticateToken,
    authorizeRoles("STUDENT"),
    getStudentTimetable
);

// =====================================================
// ALL TIMETABLES
// ADMIN / HOD
// =====================================================

router.get(
    "/",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD"
    ),
    getTimetables
);

// =====================================================
// SINGLE TIMETABLE
// ADMIN / HOD
// =====================================================

router.get(
    "/:id",
    authenticateToken,
    authorizeRoles(
        "ADMIN",
        "HOD"
    ),
    getTimetableById
);

// =====================================================
// CREATE TIMETABLE
// ADMIN ONLY
// =====================================================

router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN"),
    createTimetable
);

// =====================================================
// UPDATE TIMETABLE
// ADMIN ONLY
// =====================================================

router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN"),
    updateTimetable
);

// =====================================================
// DELETE TIMETABLE
// ADMIN ONLY
// =====================================================

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN"),
    deleteTimetable
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
