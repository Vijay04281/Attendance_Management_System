// =====================================================
// authMiddleware.js
// Attendance Management System
// =====================================================

const jwt = require("jsonwebtoken");

// =====================================================
// AUTHENTICATE TOKEN
// =====================================================

const authenticateToken = (req, res, next) => {
    try {
        // -------------------------------------------------
        // Get Authorization Header
        // -------------------------------------------------

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }

        // -------------------------------------------------
        // Expected format:
        // Authorization: Bearer TOKEN
        // -------------------------------------------------

        const parts = authHeader.trim().split(/\s+/);

        if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format",
            });
        }

        const token = parts[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }

        // -------------------------------------------------
        // Check JWT Secret
        // -------------------------------------------------

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured");

            return res.status(500).json({
                success: false,
                message: "Authentication configuration error",
            });
        }

        // -------------------------------------------------
        // Verify Token
        // -------------------------------------------------

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // -------------------------------------------------
        // Store decoded user information
        // -------------------------------------------------

        req.user = decoded;

        // -------------------------------------------------
        // Continue
        // -------------------------------------------------

        next();

    } catch (error) {
        console.error("Authentication error:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token expired",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(403).json({
                success: false,
                message: "Invalid access token",
            });
        }

        return res.status(403).json({
            success: false,
            message: "Authentication failed",
        });
    }
};

// =====================================================
// AUTHORIZE ROLES
// =====================================================
//
// Usage:
//
// authorizeRoles("ADMIN", "HOD")
//
// or
//
// authorizeRoles(
//     "ADMIN",
//     "HOD",
//     "STAFF",
//     "TEACHER"
// )
//
// =====================================================

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // -------------------------------------------------
            // Authentication must happen first
            // -------------------------------------------------

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
            }

            // -------------------------------------------------
            // Get role from JWT
            // -------------------------------------------------

            const userRole =
                req.user.role ||
                req.user.user_role ||
                req.user.userRole;

            if (!userRole) {
                return res.status(403).json({
                    success: false,
                    message: "User role not found",
                });
            }

            // -------------------------------------------------
            // Normalize roles
            // -------------------------------------------------

            const normalizedUserRole = String(userRole)
                .trim()
                .toUpperCase();

            const normalizedAllowedRoles = allowedRoles.map(
                (role) =>
                    String(role)
                        .trim()
                        .toUpperCase()
            );

            // -------------------------------------------------
            // Check role
            // -------------------------------------------------

            if (
                !normalizedAllowedRoles.includes(
                    normalizedUserRole
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            // -------------------------------------------------
            // Continue
            // -------------------------------------------------

            next();

        } catch (error) {
            console.error(
                "Role authorization error:",
                error
            );

            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }
    };
};

// =====================================================
// EXPORT
// =====================================================
//
// IMPORTANT:
//
// Export authenticateToken directly because existing
// routes use:
//
// const authMiddleware = require("../middleware/authMiddleware");
//
// This also supports:
//
// const {
//     authenticateToken,
//     authorizeRoles
// } = require("../middleware/authMiddleware");
//
// =====================================================

module.exports = authenticateToken;

// Attach named properties for routes that use destructuring.
module.exports.authenticateToken = authenticateToken;
module.exports.authorizeRoles = authorizeRoles;