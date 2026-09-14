const db = require("../config/db");

// =====================================================
// GET ALL CLASSES
// GET /api/classes
// =====================================================
const getClasses = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                c.class_id,
                c.department_id,
                c.year,
                c.section,

                d.department_name

            FROM classes c

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            ORDER BY
                d.department_name ASC,
                c.year ASC,
                c.section ASC
        `);

        return res.json({
            success: true,
            count: rows.length,
            classes: rows
        });
    } catch (error) {
        console.error("Get Classes Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch classes"
        });
    }
};

// =====================================================
// GET CLASS BY ID
// GET /api/classes/:id
// =====================================================
const getClassById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                c.class_id,
                c.department_id,
                c.year,
                c.section,

                d.department_name

            FROM classes c

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE c.class_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
            });
        }

        return res.json({
            success: true,
            class: rows[0]
        });
    } catch (error) {
        console.error("Get Class By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch class"
        });
    }
};

// =====================================================
// GET CLASSES BY DEPARTMENT
// GET /api/classes/department/:departmentId
// =====================================================
const getClassesByDepartment = async (req, res) => {
    try {
        const { departmentId } = req.params;

        const [rows] = await db.query(`
            SELECT
                c.class_id,
                c.department_id,
                c.year,
                c.section,
                d.department_name

            FROM classes c

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE c.department_id = ?

            ORDER BY
                c.year ASC,
                c.section ASC
        `, [departmentId]);

        return res.json({
            success: true,
            count: rows.length,
            classes: rows
        });
    } catch (error) {
        console.error(
            "Get Classes By Department Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch department classes"
        });
    }
};

// =====================================================
// CREATE CLASS
// POST /api/classes
// =====================================================
const createClass = async (req, res) => {
    try {
        const {
            department_id,
            year,
            section
        } = req.body;

        if (
            !department_id ||
            year === undefined ||
            year === null ||
            !section
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "department_id, year and section are required"
            });
        }

        const numericYear = Number(year);

        if (
            !Number.isInteger(numericYear) ||
            numericYear <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "year must be a valid positive integer"
            });
        }

        const cleanSection =
            String(section).trim().toUpperCase();

        if (!cleanSection) {
            return res.status(400).json({
                success: false,
                message: "section is required"
            });
        }

        // -------------------------------------------------
        // Check department
        // -------------------------------------------------
        const [departmentRows] = await db.query(`
            SELECT department_id
            FROM departments
            WHERE department_id = ?
        `, [department_id]);

        if (departmentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        // -------------------------------------------------
        // Check duplicate class
        // -------------------------------------------------
        const [duplicate] = await db.query(`
            SELECT class_id
            FROM classes
            WHERE department_id = ?
              AND year = ?
              AND section = ?
        `, [
            department_id,
            numericYear,
            cleanSection
        ]);

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Class already exists for this department, year and section"
            });
        }

        // -------------------------------------------------
        // Insert
        // -------------------------------------------------
        const [result] = await db.query(`
            INSERT INTO classes
            (
                department_id,
                year,
                section
            )
            VALUES (?, ?, ?)
        `, [
            department_id,
            numericYear,
            cleanSection
        ]);

        const [rows] = await db.query(`
            SELECT
                c.class_id,
                c.department_id,
                c.year,
                c.section,
                d.department_name
            FROM classes c
            LEFT JOIN departments d
                ON d.department_id = c.department_id
            WHERE c.class_id = ?
        `, [result.insertId]);

        return res.status(201).json({
            success: true,
            message: "Class created successfully",
            class: rows[0]
        });
    } catch (error) {
        console.error("Create Class Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Class already exists"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Invalid department"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create class"
        });
    }
};

// =====================================================
// UPDATE CLASS
// PUT /api/classes/:id
// =====================================================
const updateClass = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            department_id,
            year,
            section
        } = req.body;

        // -------------------------------------------------
        // Get existing class
        // -------------------------------------------------
        const [existingRows] = await db.query(`
            SELECT *
            FROM classes
            WHERE class_id = ?
        `, [id]);

        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
            });
        }

        const existing = existingRows[0];

        const finalDepartmentId =
            department_id !== undefined &&
            department_id !== null &&
            department_id !== ""
                ? department_id
                : existing.department_id;

        const finalYear =
            year !== undefined &&
            year !== null &&
            year !== ""
                ? Number(year)
                : existing.year;

        const finalSection =
            section !== undefined &&
            section !== null &&
            String(section).trim() !== ""
                ? String(section)
                    .trim()
                    .toUpperCase()
                : existing.section;

        // -------------------------------------------------
        // Validate year
        // -------------------------------------------------
        if (
            !Number.isInteger(finalYear) ||
            finalYear <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "year must be a valid positive integer"
            });
        }

        // -------------------------------------------------
        // Check department
        // -------------------------------------------------
        const [departmentRows] = await db.query(`
            SELECT department_id
            FROM departments
            WHERE department_id = ?
        `, [finalDepartmentId]);

        if (departmentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        // -------------------------------------------------
        // Check duplicate excluding current class
        // -------------------------------------------------
        const [duplicate] = await db.query(`
            SELECT class_id
            FROM classes
            WHERE department_id = ?
              AND year = ?
              AND section = ?
              AND class_id != ?
        `, [
            finalDepartmentId,
            finalYear,
            finalSection,
            id
        ]);

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Another class already exists for this department, year and section"
            });
        }

        // -------------------------------------------------
        // Update
        // -------------------------------------------------
        await db.query(`
            UPDATE classes
            SET
                department_id = ?,
                year = ?,
                section = ?
            WHERE class_id = ?
        `, [
            finalDepartmentId,
            finalYear,
            finalSection,
            id
        ]);

        const [rows] = await db.query(`
            SELECT
                c.class_id,
                c.department_id,
                c.year,
                c.section,
                d.department_name
            FROM classes c
            LEFT JOIN departments d
                ON d.department_id = c.department_id
            WHERE c.class_id = ?
        `, [id]);

        return res.json({
            success: true,
            message: "Class updated successfully",
            class: rows[0]
        });
    } catch (error) {
        console.error("Update Class Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Class already exists"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Invalid department"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update class"
        });
    }
};

// =====================================================
// DELETE CLASS
// DELETE /api/classes/:id
// =====================================================
const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(`
            DELETE FROM classes
            WHERE class_id = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
            });
        }

        return res.json({
            success: true,
            message: "Class deleted successfully"
        });
    } catch (error) {
        console.error("Delete Class Error:", error);

        if (
            error.code === "ER_ROW_IS_REFERENCED_2" ||
            error.code === "ER_ROW_IS_REFERENCED"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Cannot delete this class because other records are linked to it"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to delete class"
        });
    }
};

module.exports = {
    getClasses,
    getClassById,
    getClassesByDepartment,
    createClass,
    updateClass,
    deleteClass
};