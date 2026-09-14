const db = require("../config/db");
const bcrypt = require("bcrypt");

// =====================================================
// HELPER
// =====================================================

const cleanValue = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const cleaned = String(value).trim();

    return cleaned === "" ? null : cleaned;
};

// =====================================================
// GET STAFF
// =====================================================

const getStaff = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                s.staff_id,
                s.user_id,
                s.staff_code,
                s.name,
                s.email,
                s.department,
                s.phone,
                s.role,
                u.username
            FROM staff s
            LEFT JOIN users u
                ON s.user_id = u.user_id
            ORDER BY s.name ASC
        `);

        return res.json({
            success: true,
            count: rows.length,
            staff: rows
        });

    } catch (error) {
        console.error("GET STAFF ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch staff",
            error: error.message
        });
    }
};

// =====================================================
// GET STAFF BY ID
// =====================================================

const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                s.*,
                u.username
            FROM staff s
            LEFT JOIN users u
                ON s.user_id = u.user_id
            WHERE s.staff_id = ?
            LIMIT 1
        `, [id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found"
            });
        }

        return res.json({
            success: true,
            staff: rows[0]
        });

    } catch (error) {
        console.error("GET STAFF BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch staff member",
            error: error.message
        });
    }
};

// =====================================================
// CREATE STAFF
// =====================================================

const createStaff = async (req, res) => {
    try {
        console.log("========================================");
        console.log("CREATE STAFF REQUEST");
        console.log("REQUEST BODY:", req.body);
        console.log("DEPARTMENT RECEIVED:", req.body.department);
        console.log("========================================");

        const {
            staff_code,
            name,
            email,
            department,
            department_id,
            phone,
            role,
            username,
            password
        } = req.body;

        // =================================================
        // DEPARTMENT
        // =================================================
        //
        // Normally frontend sends:
        //
        // department: "Computer Science"
        //
        // If department is missing but department_id is
        // supplied, find the department name from DB.
        //
        // =================================================

        let finalDepartment = cleanValue(department);

        if (!finalDepartment && department_id) {

            const [departmentRows] = await db.query(`
                SELECT department_name
                FROM departments
                WHERE department_id = ?
                LIMIT 1
            `, [department_id]);

            if (departmentRows.length) {
                finalDepartment =
                    departmentRows[0].department_name;
            }
        }

        // =================================================
        // CLEAN VALUES
        // =================================================

        const finalStaffCode =
            cleanValue(staff_code);

        const finalName =
            cleanValue(name);

        const finalEmail =
            cleanValue(email);

        const finalPhone =
            cleanValue(phone);

        const finalUsername =
            cleanValue(username);

        const finalPassword =
            cleanValue(password);

        const finalRole =
            String(role || "STAFF")
                .trim()
                .toUpperCase();

        // =================================================
        // VALIDATION
        // =================================================

        if (!finalStaffCode) {
            return res.status(400).json({
                success: false,
                message: "Staff code is required"
            });
        }

        if (!finalName) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        if (!finalUsername) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        if (!finalPassword) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        if (!finalDepartment) {
            return res.status(400).json({
                success: false,
                message: "Department is required"
            });
        }

        if (
            !["HOD", "STAFF", "TEACHER"].includes(
                finalRole
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Role must be HOD, STAFF or TEACHER"
            });
        }

        // =================================================
        // CHECK STAFF CODE
        // =================================================

        const [staffExists] = await db.query(`
            SELECT staff_id
            FROM staff
            WHERE staff_code = ?
            LIMIT 1
        `, [finalStaffCode]);

        if (staffExists.length) {
            return res.status(409).json({
                success: false,
                message: "Staff code already exists"
            });
        }

        // =================================================
        // CHECK USERNAME
        // =================================================

        const [userExists] = await db.query(`
            SELECT user_id
            FROM users
            WHERE username = ?
            LIMIT 1
        `, [finalUsername]);

        if (userExists.length) {
            return res.status(409).json({
                success: false,
                message: "Username already exists"
            });
        }

        // =================================================
        // HASH PASSWORD
        // =================================================

        const hashedPassword =
            await bcrypt.hash(
                finalPassword,
                10
            );

        // =================================================
        // CREATE USER
        // =================================================

        const [userResult] = await db.query(`
            INSERT INTO users
            (
                username,
                password,
                role
            )
            VALUES (?, ?, ?)
        `, [
            finalUsername,
            hashedPassword,
            finalRole
        ]);

        const userId =
            userResult.insertId;

        // =================================================
        // CREATE STAFF
        // =================================================

        console.log(
            "SAVING DEPARTMENT:",
            finalDepartment
        );

        const [staffResult] = await db.query(`
            INSERT INTO staff
            (
                user_id,
                staff_code,
                name,
                email,
                department,
                phone,
                role
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            userId,
            finalStaffCode,
            finalName,
            finalEmail,
            finalDepartment,
            finalPhone,
            finalRole
        ]);

        // =================================================
        // VERIFY INSERT
        // =================================================

        const [created] = await db.query(`
            SELECT
                s.staff_id,
                s.user_id,
                s.staff_code,
                s.name,
                s.email,
                s.department,
                s.phone,
                s.role,
                u.username
            FROM staff s
            LEFT JOIN users u
                ON s.user_id = u.user_id
            WHERE s.staff_id = ?
            LIMIT 1
        `, [
            staffResult.insertId
        ]);

        console.log(
            "CREATED STAFF:",
            created[0]
        );

        return res.status(201).json({
            success: true,
            message: "Staff created successfully",
            staff: created[0]
        });

    } catch (error) {

        console.error(
            "CREATE STAFF ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create staff",
            error: error.message
        });
    }
};

// =====================================================
// UPDATE STAFF
// =====================================================

const updateStaff = async (req, res) => {
    try {
        console.log("========================================");
        console.log("UPDATE STAFF REQUEST");
        console.log("STAFF ID:", req.params.id);
        console.log("REQUEST BODY:", req.body);
        console.log("DEPARTMENT RECEIVED:", req.body.department);
        console.log("========================================");

        const { id } = req.params;

        // =================================================
        // FIND STAFF
        // =================================================

        const [existing] = await db.query(`
            SELECT *
            FROM staff
            WHERE staff_id = ?
            LIMIT 1
        `, [id]);

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found"
            });
        }

        const old = existing[0];

        // =================================================
        // REQUEST DATA
        // =================================================

        const {
            staff_code,
            name,
            email,
            department,
            department_id,
            phone,
            role,
            username,
            password
        } = req.body;

        // =================================================
        // DEPARTMENT
        // =================================================

        let finalDepartment =
            cleanValue(department);

        if (!finalDepartment && department_id) {

            const [departmentRows] = await db.query(`
                SELECT department_name
                FROM departments
                WHERE department_id = ?
                LIMIT 1
            `, [department_id]);

            if (departmentRows.length) {
                finalDepartment =
                    departmentRows[0].department_name;
            }
        }

        if (!finalDepartment) {
            finalDepartment =
                old.department;
        }

        // =================================================
        // OTHER VALUES
        // =================================================

        const finalStaffCode =
            cleanValue(staff_code) ||
            old.staff_code;

        const finalName =
            cleanValue(name) ||
            old.name;

        const finalEmail =
            email === undefined
                ? old.email
                : cleanValue(email);

        const finalPhone =
            phone === undefined
                ? old.phone
                : cleanValue(phone);

        const finalRole =
            role === undefined
                ? old.role
                : String(role)
                    .trim()
                    .toUpperCase();

        const finalUsername =
            cleanValue(username);

        const finalPassword =
            cleanValue(password);

        // =================================================
        // VALIDATION
        // =================================================

        if (!finalDepartment) {
            return res.status(400).json({
                success: false,
                message: "Department is required"
            });
        }

        if (
            !["HOD", "STAFF", "TEACHER"].includes(
                finalRole
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Role must be HOD, STAFF or TEACHER"
            });
        }

        // =================================================
        // DUPLICATE STAFF CODE
        // =================================================

        const [duplicateStaff] = await db.query(`
            SELECT staff_id
            FROM staff
            WHERE staff_code = ?
            AND staff_id != ?
            LIMIT 1
        `, [
            finalStaffCode,
            id
        ]);

        if (duplicateStaff.length) {
            return res.status(409).json({
                success: false,
                message: "Staff code already exists"
            });
        }

        // =================================================
        // DUPLICATE USERNAME
        // =================================================

        if (
            old.user_id &&
            finalUsername
        ) {
            const [duplicateUser] =
                await db.query(`
                    SELECT user_id
                    FROM users
                    WHERE username = ?
                    AND user_id != ?
                    LIMIT 1
                `, [
                    finalUsername,
                    old.user_id
                ]);

            if (duplicateUser.length) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Username already exists"
                });
            }
        }

        // =================================================
        // UPDATE STAFF
        // =================================================

        console.log(
            "UPDATING DEPARTMENT:",
            finalDepartment
        );

        await db.query(`
            UPDATE staff
            SET
                staff_code = ?,
                name = ?,
                email = ?,
                department = ?,
                phone = ?,
                role = ?
            WHERE staff_id = ?
        `, [
            finalStaffCode,
            finalName,
            finalEmail,
            finalDepartment,
            finalPhone,
            finalRole,
            id
        ]);

        // =================================================
        // UPDATE USER
        // =================================================

        if (old.user_id) {

            if (finalUsername) {

                await db.query(`
                    UPDATE users
                    SET
                        username = ?,
                        role = ?
                    WHERE user_id = ?
                `, [
                    finalUsername,
                    finalRole,
                    old.user_id
                ]);

            } else {

                await db.query(`
                    UPDATE users
                    SET role = ?
                    WHERE user_id = ?
                `, [
                    finalRole,
                    old.user_id
                ]);
            }

            // =================================================
            // UPDATE PASSWORD
            // =================================================

            if (finalPassword) {

                const hashedPassword =
                    await bcrypt.hash(
                        finalPassword,
                        10
                    );

                await db.query(`
                    UPDATE users
                    SET password = ?
                    WHERE user_id = ?
                `, [
                    hashedPassword,
                    old.user_id
                ]);
            }
        }

        // =================================================
        // VERIFY UPDATE
        // =================================================

        const [updated] = await db.query(`
            SELECT
                s.staff_id,
                s.user_id,
                s.staff_code,
                s.name,
                s.email,
                s.department,
                s.phone,
                s.role,
                u.username
            FROM staff s
            LEFT JOIN users u
                ON s.user_id = u.user_id
            WHERE s.staff_id = ?
            LIMIT 1
        `, [id]);

        console.log(
            "UPDATED STAFF:",
            updated[0]
        );

        return res.json({
            success: true,
            message: "Staff updated successfully",
            staff: updated[0]
        });

    } catch (error) {

        console.error(
            "UPDATE STAFF ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update staff",
            error: error.message
        });
    }
};

// =====================================================
// DELETE STAFF
// =====================================================

const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const [staffRows] = await db.query(`
            SELECT user_id
            FROM staff
            WHERE staff_id = ?
            LIMIT 1
        `, [id]);

        if (!staffRows.length) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found"
            });
        }

        const userId =
            staffRows[0].user_id;

        await db.query(`
            DELETE FROM staff
            WHERE staff_id = ?
        `, [id]);

        if (userId) {
            await db.query(`
                DELETE FROM users
                WHERE user_id = ?
            `, [userId]);
        }

        return res.json({
            success: true,
            message: "Staff deleted successfully"
        });

    } catch (error) {

        console.error(
            "DELETE STAFF ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to delete staff",
            error: error.message
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff
};