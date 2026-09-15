
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
        // =================================================
        // IMPORTANT:
        // Allow CORS preflight requests.
        //
        // Browser sends OPTIONS before requests such as:
        // GET /api/attendance/my
        //
        // OPTIONS does NOT contain the JWT Authorization
        // header, so it must not be rejected by JWT auth.
        // =================================================

        if (req.method === "OPTIONS") {
            return next();
        }

        // =================================================
        // GET AUTHORIZATION HEADER
        // =================================================

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }

        // =================================================
        // EXPECTED FORMAT:
        //
        // Authorization: Bearer TOKEN
        // =================================================

        const parts = authHeader.trim().split(/\s+/);

        if (
            parts.length !== 2 ||
            parts[0].toLowerCase() !== "bearer"
        ) {
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

        // =================================================
        // CHECK JWT SECRET
        // =================================================

        if (!process.env.JWT_SECRET) {
            console.error(
                "JWT_SECRET is not configured"
            );

            return res.status(500).json({
                success: false,
                message:
                    "Authentication configuration error",
            });
        }

        // =================================================
        // VERIFY JWT
        // =================================================

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // =================================================
        // STORE USER INFORMATION
        // =================================================

        req.user = decoded;

        // =================================================
        // CONTINUE
        // =================================================

        next();

    } catch (error) {
        console.error(
            "Authentication error:",
            error.message
        );

        // =================================================
        // TOKEN EXPIRED
        // =================================================

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token expired",
            });
        }

        // =================================================
        // INVALID JWT
        // =================================================

        if (error.name === "JsonWebTokenError") {
            return res.status(403).json({
                success: false,
                message: "Invalid access token",
            });
        }

        // =================================================
        // OTHER AUTHENTICATION ERROR
        // =================================================

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
// authorizeRoles("ADMIN")
//
// authorizeRoles("ADMIN", "HOD")
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
            // =================================================
            // AUTHENTICATION MUST HAPPEN FIRST
            // =================================================

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required",
                });
            }

            // =================================================
            // GET ROLE FROM JWT
            // =================================================

            const userRole =
                req.user.role ||
                req.user.user_role ||
                req.user.userRole;

            if (!userRole) {
                return res.status(403).json({
                    success: false,
                    message:
                        "User role not found",
                });
            }

            // =================================================
            // NORMALIZE USER ROLE
            // =================================================

            const normalizedUserRole =
                String(userRole)
                    .trim()
                    .toUpperCase();

            // =================================================
            // NORMALIZE ALLOWED ROLES
            // =================================================

            const normalizedAllowedRoles =
                allowedRoles.map((role) =>
                    String(role)
                        .trim()
                        .toUpperCase()
                );

            // =================================================
            // CHECK ROLE
            // =================================================

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

            // =================================================
            // CONTINUE
            // =================================================

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
// Supports:
//
// const authMiddleware = require(
//     "../middleware/authMiddleware"
// );
//
// And:
//
// const {
//     authenticateToken,
//     authorizeRoles
// } = require(
//     "../middleware/authMiddleware"
// );
//
// =====================================================

module.exports = authenticateToken;

module.exports.authenticateToken =
    authenticateToken;

module.exports.authorizeRoles =
    authorizeRoles;