const express = require("express");

const router = express.Router();

const subjectController = require("../controllers/subjectController");

const authMiddleware = require("../middleware/authMiddleware");


// =====================================================
// SUBJECT ROUTES
// =====================================================


// =====================================================
// GET /api/subjects
// GET ALL SUBJECTS
// =====================================================

router.get(
    "/",
    authMiddleware,
    subjectController.getSubjects
);


// =====================================================
// POST /api/subjects
// CREATE SUBJECT
// =====================================================

router.post(
    "/",
    authMiddleware,
    subjectController.createSubject
);


// =====================================================
// GET /api/subjects/:id
// GET SUBJECT BY ID
// =====================================================

router.get(
    "/:id",
    authMiddleware,
    subjectController.getSubjectById
);


// =====================================================
// PUT /api/subjects/:id
// UPDATE SUBJECT
// =====================================================

router.put(
    "/:id",
    authMiddleware,
    subjectController.updateSubject
);


// =====================================================
// DELETE /api/subjects/:id
// DELETE SUBJECT
// =====================================================

router.delete(
    "/:id",
    authMiddleware,
    subjectController.deleteSubject
);


module.exports = router;