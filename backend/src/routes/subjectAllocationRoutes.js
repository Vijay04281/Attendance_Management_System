const express = require("express");

const {
    getSubjectAllocations,
    getSubjectAllocationById,
    getStaffSubjectAllocations,
    createSubjectAllocation,
    updateSubjectAllocation,
    deleteSubjectAllocation
} = require("../controllers/subjectAllocationController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
=====================================================
GET ALL SUBJECT ALLOCATIONS
ADMIN / HOD / STAFF / TEACHER
=====================================================
*/
router.get(
    "/",
    authenticateToken,
    getSubjectAllocations
);

/*
=====================================================
GET SUBJECTS ALLOCATED TO LOGGED-IN STAFF
=====================================================

Example:
GET /api/subject-allocations/staff

This endpoint must come BEFORE /:id.
Otherwise "staff" will be treated as an allocation ID.
*/
router.get(
    "/staff",
    authenticateToken,
    authorizeRoles("STAFF", "TEACHER", "HOD"),
    getStaffSubjectAllocations
);

/*
=====================================================
GET SUBJECT ALLOCATION BY ID
=====================================================
*/
router.get(
    "/:id",
    authenticateToken,
    getSubjectAllocationById
);

/*
=====================================================
CREATE SUBJECT ALLOCATION
ADMIN / HOD ONLY
=====================================================
*/
router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    createSubjectAllocation
);

/*
=====================================================
UPDATE SUBJECT ALLOCATION
ADMIN / HOD ONLY
=====================================================
*/
router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    updateSubjectAllocation
);

/*
=====================================================
DELETE SUBJECT ALLOCATION
ADMIN / HOD ONLY
=====================================================
*/
router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "HOD"),
    deleteSubjectAllocation
);

module.exports = router;