const db = require("../config/db");
const crypto = require("crypto");

// =====================================================
// GET ALL QR CODES
// =====================================================

const getQRCodes = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                q.qr_id,
                q.session_id,
                q.qr_token,
                q.generated_at,
                q.expires_at,
                q.is_used,

                ats.session_date,
                ats.start_time,
                ats.status AS session_status,

                s.subject_code,
                s.subject_name,

                st.staff_code,
                st.name AS staff_name

            FROM qr_codes q

            LEFT JOIN attendance_sessions ats
                ON ats.session_id = q.session_id

            LEFT JOIN subjects s
                ON s.subject_id = ats.subject_id

            LEFT JOIN staff st
                ON st.staff_id = ats.staff_id

            ORDER BY q.generated_at DESC
        `);

        return res.json({
            success: true,
            count: rows.length,
            qr_codes: rows
        });
    } catch (error) {
        console.error("Get QR Codes Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch QR codes",
            error: error.message
        });
    }
};


// =====================================================
// GET QR CODE BY ID
// =====================================================

const getQRCodeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT *
            FROM qr_codes
            WHERE qr_id = ?
            LIMIT 1
        `, [id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "QR code not found"
            });
        }

        return res.json({
            success: true,
            qr_code: rows[0]
        });
    } catch (error) {
        console.error("Get QR Code Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch QR code",
            error: error.message
        });
    }
};


// =====================================================
// GENERATE QR CODE
// =====================================================

const createQRCode = async (req, res) => {
    try {
        const {
            session_id,
            expires_at
        } = req.body;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: "session_id is required"
            });
        }

        const [session] = await db.query(`
            SELECT
                session_id,
                qr_token,
                qr_expires_at,
                status
            FROM attendance_sessions
            WHERE session_id = ?
            LIMIT 1
        `, [session_id]);

        if (!session.length) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found"
            });
        }

        if (session[0].status !== "ACTIVE") {
            return res.status(400).json({
                success: false,
                message: "Attendance session is closed"
            });
        }

        const token = crypto
            .randomBytes(32)
            .toString("hex");

        const generatedAt = new Date();

        const expiry =
            expires_at ||
            new Date(
                generatedAt.getTime() + 10 * 60 * 1000
            );

        const [result] = await db.query(`
            INSERT INTO qr_codes
            (
                session_id,
                qr_token,
                generated_at,
                expires_at,
                is_used
            )
            VALUES (?, ?, ?, ?, 0)
        `, [
            session_id,
            token,
            generatedAt,
            expiry
        ]);

        // Keep attendance_sessions QR information synchronized.
        await db.query(`
            UPDATE attendance_sessions
            SET
                qr_token = ?,
                qr_expires_at = ?
            WHERE session_id = ?
        `, [
            token,
            expiry,
            session_id
        ]);

        const [created] = await db.query(`
            SELECT *
            FROM qr_codes
            WHERE qr_id = ?
        `, [result.insertId]);

        return res.status(201).json({
            success: true,
            message: "QR code generated successfully",
            qr_code: created[0]
        });
    } catch (error) {
        console.error("Create QR Code Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate QR code",
            error: error.message
        });
    }
};


// =====================================================
// MARK QR AS USED
// =====================================================

const markQRCodeUsed = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(`
            UPDATE qr_codes
            SET is_used = 1
            WHERE qr_id = ?
        `, [id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "QR code not found"
            });
        }

        return res.json({
            success: true,
            message: "QR code marked as used"
        });
    } catch (error) {
        console.error("Mark QR Used Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update QR code",
            error: error.message
        });
    }
};


// =====================================================
// DELETE QR CODE
// =====================================================

const deleteQRCode = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(`
            DELETE FROM qr_codes
            WHERE qr_id = ?
        `, [id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "QR code not found"
            });
        }

        return res.json({
            success: true,
            message: "QR code deleted"
        });
    } catch (error) {
        console.error("Delete QR Code Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete QR code",
            error: error.message
        });
    }
};


module.exports = {
    getQRCodes,
    getQRCodeById,
    createQRCode,
    markQRCodeUsed,
    deleteQRCode
};