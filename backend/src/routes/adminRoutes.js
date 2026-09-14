const express = require("express");

const router = express.Router();

const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// SAFETY CHECKS
// =====================================================

if (typeof authMiddleware !== "function") {
    console.error(
        "❌ adminRoutes.js: authMiddleware is not a function:",
        typeof authMiddleware
    );
    throw new TypeError(
        "authMiddleware must export a middleware function"
    );
}

const requiredControllers = [
    "getDashboard",
    "getStatistics",
    "getRecentActivities",
    "getSystemSummary",
    "getAttendanceOverview",
    "getRecentSessions"
];

for (const controllerName of requiredControllers) {
    if (typeof adminController[controllerName] !== "function") {
        console.error(
            `❌ adminRoutes.js: adminController.${controllerName} is not a function`
        );

        console.error(
            "Available adminController exports:",
            Object.keys(adminController)
        );

        throw new TypeError(
            `adminController.${controllerName} must be a function`
        );
    }
}

// =====================================================
// ADMIN DASHBOARD
// =====================================================

// GET /api/admin/dashboard
router.get(
    "/dashboard",
    authMiddleware,
    adminController.getDashboard
);

// =====================================================
// SYSTEM STATISTICS
// =====================================================

// GET /api/admin/statistics
router.get(
    "/statistics",
    authMiddleware,
    adminController.getStatistics
);

// =====================================================
// RECENT ACTIVITIES
// =====================================================

// GET /api/admin/recent-activities
router.get(
    "/recent-activities",
    authMiddleware,
    adminController.getRecentActivities
);

// =====================================================
// SYSTEM SUMMARY
// =====================================================

// GET /api/admin/system-summary
router.get(
    "/system-summary",
    authMiddleware,
    adminController.getSystemSummary
);

// =====================================================
// ATTENDANCE OVERVIEW
// =====================================================

// GET /api/admin/attendance-overview
router.get(
    "/attendance-overview",
    authMiddleware,
    adminController.getAttendanceOverview
);

// =====================================================
// RECENT ATTENDANCE SESSIONS
// =====================================================

// GET /api/admin/recent-sessions
router.get(
    "/recent-sessions",
    authMiddleware,
    adminController.getRecentSessions
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;