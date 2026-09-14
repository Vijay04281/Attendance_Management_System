const db = require("../config/db");

// =====================================================
// GET NOTIFICATIONS
// =====================================================

const getNotifications = async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT *
            FROM notifications
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            count: rows.length,
            notifications: rows
        });

    } catch (error) {
        console.error("Get Notifications Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
};

// =====================================================
// CREATE NOTIFICATION
// =====================================================

const createNotification = async (req, res) => {
    try {

        const {
            user_id,
            title,
            message
        } = req.body;

        const [result] = await db.query(`
            INSERT INTO notifications
            (
                user_id,
                title,
                message
            )
            VALUES (?, ?, ?)
        `, [
            user_id,
            title,
            message
        ]);

        res.status(201).json({
            success: true,
            notification_id: result.insertId,
            message: "Notification created successfully"
        });

    } catch (error) {
        console.error("Create Notification Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create notification",
            error: error.message
        });
    }
};

// =====================================================
// MARK AS READ
// =====================================================

const markNotificationAsRead = async (req, res) => {
    try {

        const { id } = req.params;

        await db.query(`
            UPDATE notifications
            SET is_read = 1
            WHERE notification_id = ?
        `, [id]);

        res.json({
            success: true,
            message: "Notification marked as read"
        });

    } catch (error) {
        console.error("Mark Notification Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update notification",
            error: error.message
        });
    }
};

// =====================================================
// DELETE NOTIFICATION
// =====================================================

const deleteNotification = async (req, res) => {
    try {

        const { id } = req.params;

        await db.query(`
            DELETE FROM notifications
            WHERE notification_id = ?
        `, [id]);

        res.json({
            success: true,
            message: "Notification deleted successfully"
        });

    } catch (error) {
        console.error("Delete Notification Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete notification",
            error: error.message
        });
    }
};

module.exports = {
    getNotifications,
    createNotification,
    markNotificationAsRead,
    deleteNotification
};