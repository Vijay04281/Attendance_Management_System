const db = require("../config/db");

// Get all subject assignments
const getAssignments = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                sa.assignment_id,
                sa.subject_id,
                s.subject_code,
                s.subject_name,
                sa.staff_id,
                st.staff_code,
                st.name AS staff_name,
                sa.class_id,
                c.year,
                c.section,
                d.department_name,
                d.department_code
             FROM subject_assignments sa
             JOIN subjects s
                ON sa.subject_id = s.subject_id
             JOIN staff st
                ON sa.staff_id = st.staff_id
             JOIN classes c
                ON sa.class_id = c.class_id
             JOIN departments d
                ON c.department_id = d.department_id
             ORDER BY sa.assignment_id DESC`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            assignments: rows
        });

    } catch (error) {
        console.error("Get assignments error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch assignments"
        });
    }
};


// Create subject assignment
const createAssignment = async (req, res) => {
    try {
        const {
            subject_id,
            staff_id,
            class_id
        } = req.body;

        if (!subject_id || !staff_id || !class_id) {
            return res.status(400).json({
                success: false,
                message: "Subject, staff and class are required"
            });
        }

        // Check subject
        const [subjects] = await db.query(
            "SELECT subject_id FROM subjects WHERE subject_id = ?",
            [subject_id]
        );

        if (subjects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        // Check staff
        const [staff] = await db.query(
            "SELECT staff_id FROM staff WHERE staff_id = ?",
            [staff_id]
        );

        if (staff.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        // Check class
        const [classes] = await db.query(
            "SELECT class_id FROM classes WHERE class_id = ?",
            [class_id]
        );

        if (classes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
            });
        }

        // Check duplicate assignment
        const [existing] = await db.query(
            `SELECT assignment_id
             FROM subject_assignments
             WHERE subject_id = ?
             AND staff_id = ?
             AND class_id = ?`,
            [
                subject_id,
                staff_id,
                class_id
            ]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This subject is already assigned to this staff and class"
            });
        }

        const [result] = await db.query(
            `INSERT INTO subject_assignments
            (subject_id, staff_id, class_id)
            VALUES (?, ?, ?)`,
            [
                subject_id,
                staff_id,
                class_id
            ]
        );

        res.status(201).json({
            success: true,
            message: "Subject assignment created successfully",
            assignment_id: result.insertId
        });

    } catch (error) {
        console.error("Create assignment error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create assignment"
        });
    }
};


// Delete subject assignment
const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `DELETE FROM subject_assignments
             WHERE assignment_id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Subject assignment deleted successfully"
        });

    } catch (error) {
        console.error("Delete assignment error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete assignment"
        });
    }
};


module.exports = {
    getAssignments,
    createAssignment,
    deleteAssignment
};