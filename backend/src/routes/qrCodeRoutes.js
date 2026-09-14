const express = require("express");
const router = express.Router();

const qrCodeController = require("../controllers/qrCodeController");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// QR CODE ROUTES
// =====================================================

// GET /api/qr-codes
// Get all QR codes
router.get(
    "/",
    authMiddleware,
    qrCodeController.getQRCodes
);

// GET /api/qr-codes/:id
// Get QR code by ID
router.get(
    "/:id",
    authMiddleware,
    qrCodeController.getQRCodeById
);

// POST /api/qr-codes
// Generate a new QR code for an active attendance session
router.post(
    "/",
    authMiddleware,
    qrCodeController.createQRCode
);

// PUT /api/qr-codes/:id/use
// Mark QR code as used
router.put(
    "/:id/use",
    authMiddleware,
    qrCodeController.markQRCodeUsed
);

// DELETE /api/qr-codes/:id
// Delete QR code
router.delete(
    "/:id",
    authMiddleware,
    qrCodeController.deleteQRCode
);

module.exports = router;