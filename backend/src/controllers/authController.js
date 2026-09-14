const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// =====================================================
// AUTH CONTROLLER
// =====================================================
//
// Supports:
// ADMIN
// HOD
// STAFF
// TEACHER
// STUDENT
//
// Table:
// users
//
// Fields:
// user_id
// username
// password
// role
//
// =====================================================


// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log("========================================");
        console.log("LOGIN REQUEST");
        console.log("Username:", username);
        console.log("Password received:", !!password);
        console.log("========================================");

        // -------------------------------------------------
        // VALIDATE INPUT
        // -------------------------------------------------

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Username and password are required"
            });
        }

        // -------------------------------------------------
        // NORMALIZE USERNAME
        // -------------------------------------------------

        const loginUsername =
            String(username).trim();

        // -------------------------------------------------
        // FIND USER
        // -------------------------------------------------

        const [users] = await db.query(
            `
            SELECT
                user_id,
                username,
                password,
                role
            FROM users
            WHERE username = ?
            LIMIT 1
            `,
            [loginUsername]
        );

        console.log(
            "User found:",
            users.length > 0
        );

        // -------------------------------------------------
        // USER NOT FOUND
        // -------------------------------------------------

        if (users.length === 0) {
            console.log(
                "Login failed: username not found"
            );

            return res.status(401).json({
                success: false,
                message:
                    "Invalid username or password"
            });
        }

        const user = users[0];

        console.log(
            "User ID:",
            user.user_id
        );

        console.log(
            "User role:",
            user.role
        );

        // -------------------------------------------------
        // CHECK STORED PASSWORD
        // -------------------------------------------------

        if (!user.password) {
            console.error(
                "Login failed: password is empty in database"
            );

            return res.status(401).json({
                success: false,
                message:
                    "Invalid username or password"
            });
        }

        // -------------------------------------------------
        // BCRYPT PASSWORD CHECK
        // -------------------------------------------------

        let passwordMatch = false;

        try {
            passwordMatch =
                await bcrypt.compare(
                    String(password),
                    String(user.password)
                );
        } catch (bcryptError) {
            console.error(
                "Bcrypt comparison error:",
                bcryptError
            );

            passwordMatch = false;
        }

        console.log(
            "Password match:",
            passwordMatch
        );

        // -------------------------------------------------
        // INVALID PASSWORD
        // -------------------------------------------------

        if (!passwordMatch) {
            console.log(
                "Login failed: incorrect password"
            );

            return res.status(401).json({
                success: false,
                message:
                    "Invalid username or password"
            });
        }

        // -------------------------------------------------
        // VALIDATE ROLE
        // -------------------------------------------------

        const role =
            String(user.role || "")
                .trim()
                .toUpperCase();

        if (!role) {
            console.error(
                "Login failed: user role is empty"
            );

            return res.status(403).json({
                success: false,
                message:
                    "User role is not configured"
            });
        }

        // -------------------------------------------------
        // JWT SECRET CHECK
        // -------------------------------------------------

        if (!process.env.JWT_SECRET) {
            console.error(
                "JWT_SECRET is missing from environment variables"
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server authentication configuration error"
            });
        }

        // -------------------------------------------------
        // CREATE JWT
        // -------------------------------------------------

        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                role: role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        console.log(
            "Login successful:",
            user.username,
            role
        );

        return res.status(200).json({
            success: true,
            message:
                "Login successful",

            token,

            user: {
                user_id:
                    user.user_id,

                username:
                    user.username,

                role
            }
        });

    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error"
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    login
};