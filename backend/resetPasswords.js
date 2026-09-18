const bcrypt = require("bcryptjs");
const db = require("./src/config/db");

async function resetPasswords() {
    try {
        const hodPassword = await bcrypt.hash("hod123", 10);
        const staffPassword = await bcrypt.hash("staff123", 10);
        const studentPassword = await bcrypt.hash("student123", 10);

        await db.query(
            "UPDATE users SET password = ? WHERE username = ?",
            [hodPassword, "hod001"]
        );

        await db.query(
            "UPDATE users SET password = ? WHERE username = ?",
            [staffPassword, "staff001"]
        );

        await db.query(
            "UPDATE users SET password = ? WHERE username = ?",
            [studentPassword, "student001"]
        );

        console.log("Passwords updated successfully.");

        console.log("HOD:     hod001 / hod123");
        console.log("STAFF:   staff001 / staff123");
        console.log("STUDENT: student001 / student123");

    } catch (error) {
        console.error("Password reset error:", error);
    } finally {
        await db.end();
    }
}

resetPasswords();