const express = require("express");
const router = express.Router();

const auditLogController = require("../controllers/auditLogController");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// GET ALL AUDIT LOGS
// =====================================================

// GET /api/audit-logs
router.get(
    "/",
    authMiddleware,
    auditLogController.getAuditLogs
);

// =====================================================
// GET AUDIT LOG BY ID
// =====================================================

// GET /api/audit-logs/:id
router.get(
    "/:id",
    authMiddleware,
    auditLogController.getAuditLogById
);

// =====================================================
// CREATE AUDIT LOG
// =====================================================

// POST /api/audit-logs
router.post(
    "/",
    authMiddleware,
    auditLogController.createAuditLog
);

// =====================================================
// UPDATE AUDIT LOG
// =====================================================

// PUT /api/audit-logs/:id
router.put(
    "/:id",
    authMiddleware,
    auditLogController.updateAuditLog
);

// =====================================================
// DELETE AUDIT LOG
// =====================================================

// DELETE /api/audit-logs/:id
router.delete(
    "/:id",
    authMiddleware,
    auditLogController.deleteAuditLog
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;