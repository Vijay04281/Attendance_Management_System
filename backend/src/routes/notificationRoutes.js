const express = require("express");

const {
    getNotifications,
    createNotification,
    markNotificationAsRead,
    deleteNotification
} = require("../controllers/notificationController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    getNotifications
);

router.post(
    "/",
    authenticateToken,
    createNotification
);

router.put(
    "/:id/read",
    authenticateToken,
    markNotificationAsRead
);

router.delete(
    "/:id",
    authenticateToken,
    deleteNotification
);

module.exports = router;