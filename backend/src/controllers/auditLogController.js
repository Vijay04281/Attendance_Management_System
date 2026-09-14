const db = require("../config/db");

// =====================================================
// GET ALL AUDIT LOGS
// =====================================================
const getAuditLogs = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                a.log_id,
                a.user_id,
                a.action,
                a.description,
                a.created_at
            FROM audit_logs a
            ORDER BY a.created_at DESC
        `);

        return res.json({
            success: true,
            count: rows.length,
            logs: rows
        });
    } catch (error) {
        console.error("Get Audit Logs Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs"
        });
    }
};

// =====================================================
// GET AUDIT LOG BY ID
// =====================================================
const getAuditLogById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM audit_logs WHERE log_id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Audit log not found"
            });
        }

        return res.json({
            success: true,
            log: rows[0]
        });
    } catch (error) {
        console.error("Get Audit Log Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch audit log"
        });
    }
};

// =====================================================
// CREATE AUDIT LOG
// =====================================================
const createAuditLog = async (req, res) => {
    try {
        const {
            user_id,
            action,
            description
        } = req.body;

        if (!action) {
            return res.status(400).json({
                success: false,
                message: "action is required"
            });
        }

        const finalUserId =
            user_id ||
            req.user?.user_id ||
            req.user?.userId ||
            req.user?.id ||
            null;

        const [result] = await db.query(`
            INSERT INTO audit_logs
            (
                user_id,
                action,
                description
            )
            VALUES (?, ?, ?)
        `, [
            finalUserId,
            action,
            description || null
        ]);

        const [rows] = await db.query(
            "SELECT * FROM audit_logs WHERE log_id = ?",
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Audit log created successfully",
            log: rows[0]
        });
    } catch (error) {
        console.error("Create Audit Log Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create audit log"
        });
    }
};

// =====================================================
// UPDATE AUDIT LOG
// =====================================================
const updateAuditLog = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            action,
            description
        } = req.body;

        const [existing] = await db.query(
            "SELECT * FROM audit_logs WHERE log_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Audit log not found"
            });
        }

        await db.query(`
            UPDATE audit_logs
            SET
                action = ?,
                description = ?
            WHERE log_id = ?
        `, [
            action || existing[0].action,
            description !== undefined
                ? description
                : existing[0].description,
            id
        ]);

        const [rows] = await db.query(
            "SELECT * FROM audit_logs WHERE log_id = ?",
            [id]
        );

        return res.json({
            success: true,
            message: "Audit log updated successfully",
            log: rows[0]
        });
    } catch (error) {
        console.error("Update Audit Log Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update audit log"
        });
    }
};

// =====================================================
// DELETE AUDIT LOG
// =====================================================
const deleteAuditLog = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM audit_logs WHERE log_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Audit log not found"
            });
        }

        return res.json({
            success: true,
            message: "Audit log deleted successfully"
        });
    } catch (error) {
        console.error("Delete Audit Log Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete audit log"
        });
    }
};

module.exports = {
    getAuditLogs,
    getAuditLogById,
    createAuditLog,
    updateAuditLog,
    deleteAuditLog
};