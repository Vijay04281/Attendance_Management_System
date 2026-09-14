const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            const userRole = String(
                req.user.role || ""
            )
                .trim()
                .toUpperCase();

            const normalizedAllowedRoles =
                allowedRoles.map((role) =>
                    String(role)
                        .trim()
                        .toUpperCase()
                );

            // =================================================
            // CLASS TEACHER SUPPORT
            // STAFF users assigned as class teachers
            // can access TEACHER routes
            // =================================================

            if (
                normalizedAllowedRoles.includes("TEACHER") &&
                (
                    userRole === "TEACHER" ||
                    userRole === "CLASS_TEACHER" ||
                    userRole === "STAFF"
                )
            ) {
                return next();
            }

            // =================================================
            // NORMAL ROLE CHECK
            // =================================================

            if (
                normalizedAllowedRoles.includes(
                    userRole
                )
            ) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(
                    ", "
                )}. Current role: ${req.user.role}`
            });
        } catch (error) {
            console.error(
                "Role Middleware Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Role authorization failed"
            });
        }
    };
};

module.exports = authorizeRoles;