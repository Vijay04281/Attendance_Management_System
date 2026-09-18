const db = require("../config/db").default;
const bcrypt = require("bcryptjs");
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
        console.log("STEP 1 - USERNAME NORMALIZED");
        // -------------------------------------------------
        // FIND USER
        // -------------------------------------------------
// -------------------------------------------------
// FIND USER
// -------------------------------------------------

console.log("STEP 2 - BEFORE DB QUERY");

// TEST DATABASE
console.log("STEP 2A - POOL TEST START");

const conn = await db.getConnection();

console.log("STEP 2B - POOL CONNECTION ACQUIRED");

conn.release();

console.log("STEP 2C - POOL CONNECTION RELEASED");

const [testRows] = await db.query(
    "SELECT 1 AS test"
);

console.log("STEP 2D - SIMPLE QUERY SUCCESS");
console.log(testRows);
console.log(testRows);

console.log("STEP 2E - USER QUERY START");

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

console.log("STEP 3 - AFTER DB QUERY");

        console.log(
            "User found:",
            users.length > 0
        );
console.log("STEP 3 - AFTER DB QUERY");
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
console.log("STEP 5 - AFTER PASSWORD CHECK");
        // -------------------------------------------------
        // INVALID PASSWORD
        // -------------------------------------------------
console.log("STEP 6 - BEFORE INVALID PASSWORD CHECK");
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
console.log("STEP 7 - PASSWORD VALID");
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
console.log("STEP 8 - BEFORE JWT");
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
console.log("STEP 9 - AFTER JWT");
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