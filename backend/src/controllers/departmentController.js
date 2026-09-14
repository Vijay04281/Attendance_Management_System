const db = require("../config/db");

// =====================================================
// GET ALL DEPARTMENTS
// =====================================================

const getDepartments = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM departments
            ORDER BY department_name ASC
        `);

        res.json({
            success: true,
            count: rows.length,
            departments: rows
        });
    } catch (error) {
        console.error("Get Departments Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch departments",
            error: error.message
        });
    }
};

// =====================================================
// GET DEPARTMENT BY ID
// =====================================================

const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT *
            FROM departments
            WHERE department_id = ?
        `,
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.json({
            success: true,
            department: rows[0]
        });
    } catch (error) {
        console.error("Get Department Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch department",
            error: error.message
        });
    }
};

// =====================================================
// CREATE DEPARTMENT
// =====================================================

const createDepartment = async (req, res) => {
    try {
        const {
            department_name,
            department_code
        } = req.body;

        if (
            !department_name ||
            !department_code
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "department_name and department_code are required"
            });
        }

        const [existing] = await db.query(
            `
            SELECT department_id
            FROM departments
            WHERE department_code = ?
        `,
            [department_code]
        );

        if (existing.length) {
            return res.status(400).json({
                success: false,
                message:
                    "Department code already exists"
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO departments
            (
                department_name,
                department_code
            )
            VALUES (?, ?)
        `,
            [
                department_name,
                department_code
            ]
        );

        res.status(201).json({
            success: true,
            message:
                "Department created successfully",
            department_id:
                result.insertId
        });
    } catch (error) {
        console.error(
            "Create Department Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to create department",
            error: error.message
        });
    }
};

// =====================================================
// UPDATE DEPARTMENT
// =====================================================

const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            department_name,
            department_code
        } = req.body;

        const [result] = await db.query(
            `
            UPDATE departments
            SET
                department_name = ?,
                department_code = ?
            WHERE department_id = ?
        `,
            [
                department_name,
                department_code,
                id
            ]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found"
            });
        }

        res.json({
            success: true,
            message:
                "Department updated successfully"
        });
    } catch (error) {
        console.error(
            "Update Department Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update department",
            error: error.message
        });
    }
};

// =====================================================
// DELETE DEPARTMENT
// =====================================================

const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `
            DELETE FROM departments
            WHERE department_id = ?
        `,
            [id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found"
            });
        }

        res.json({
            success: true,
            message:
                "Department deleted successfully"
        });
    } catch (error) {
        console.error(
            "Delete Department Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete department",
            error: error.message
        });
    }
};

module.exports = {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
};