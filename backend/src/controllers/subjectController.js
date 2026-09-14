const db = require("../config/db");

// =====================================================
// HELPERS
// =====================================================

const normalizeNullable = (value) => {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    return value;
};

const normalizeNumber = (value) => {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isNaN(number) ? null : number;
};


// =====================================================
// GET SUBJECTS
// =====================================================

const getSubjects = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                subject_id,
                subject_code,
                subject_name,
                department,
                year,
                credits,
                semester,
                section,
                staff_id
            FROM subjects
            ORDER BY subject_name ASC
        `);

        const subjects = rows.map((subject) => ({
            ...subject,

            // Frontend compatibility
            department_id: subject.department,

            // Existing frontend expects status
            // Current database does not have status.
            status: "active"
        }));

        return res.status(200).json({
            success: true,
            count: subjects.length,
            subjects
        });

    } catch (error) {
        console.error("Get Subjects Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch subjects",
            error: error.message
        });
    }
};


// =====================================================
// GET SUBJECT BY ID
// =====================================================

const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid subject ID is required"
            });
        }

        const [rows] = await db.query(`
            SELECT
                subject_id,
                subject_code,
                subject_name,
                department,
                year,
                credits,
                semester,
                section,
                staff_id
            FROM subjects
            WHERE subject_id = ?
            LIMIT 1
        `, [id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        const subject = {
            ...rows[0],
            department_id: rows[0].department,
            status: "active"
        };

        return res.status(200).json({
            success: true,
            subject
        });

    } catch (error) {
        console.error("Get Subject Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch subject",
            error: error.message
        });
    }
};


// =====================================================
// CREATE SUBJECT
// =====================================================

const createSubject = async (req, res) => {
    try {
        const {
            subject_code,
            subject_name,
            department,
            department_id,
            year,
            credits,
            semester,
            section,
            staff_id
        } = req.body;

        console.log("========================================");
        console.log("CREATE SUBJECT REQUEST");
        console.log("Body:", req.body);
        console.log("========================================");

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (
            !subject_code ||
            String(subject_code).trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Subject code is required"
            });
        }

        if (
            !subject_name ||
            String(subject_name).trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Subject name is required"
            });
        }

        const cleanSubjectCode = String(subject_code).trim();
        const cleanSubjectName = String(subject_name).trim();

        // -------------------------------------------------
        // DUPLICATE SUBJECT CODE
        // -------------------------------------------------

        const [duplicate] = await db.query(`
            SELECT subject_id
            FROM subjects
            WHERE subject_code = ?
            LIMIT 1
        `, [cleanSubjectCode]);

        if (duplicate.length) {
            return res.status(409).json({
                success: false,
                message: "Subject code already exists"
            });
        }

        // -------------------------------------------------
        // DEPARTMENT
        // -------------------------------------------------

        let departmentValue;

        if (
            department !== undefined &&
            department !== null &&
            String(department).trim() !== ""
        ) {
            departmentValue = department;
        } else {
            departmentValue = normalizeNullable(department_id);
        }

        // -------------------------------------------------
        // YEAR
        // -------------------------------------------------

        const yearValue = normalizeNumber(year);

        // -------------------------------------------------
        // CREDITS
        // -------------------------------------------------

        const creditsValue = normalizeNumber(credits);

        // -------------------------------------------------
        // SEMESTER
        // -------------------------------------------------

        const semesterValue = normalizeNumber(semester);

        // -------------------------------------------------
        // SECTION
        // -------------------------------------------------

        const sectionValue = normalizeNullable(section);

        // -------------------------------------------------
        // STAFF
        // -------------------------------------------------

        const staffIdValue = normalizeNumber(staff_id);

        // -------------------------------------------------
        // INSERT SUBJECT
        // -------------------------------------------------

        const [result] = await db.query(`
            INSERT INTO subjects
            (
                subject_code,
                subject_name,
                department,
                year,
                credits,
                semester,
                section,
                staff_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            cleanSubjectCode,
            cleanSubjectName,
            departmentValue,
            yearValue,
            creditsValue,
            semesterValue,
            sectionValue,
            staffIdValue
        ]);

        console.log(
            "Subject created successfully. ID:",
            result.insertId
        );

        // -------------------------------------------------
        // GET CREATED SUBJECT
        // -------------------------------------------------

        const [createdRows] = await db.query(`
            SELECT
                subject_id,
                subject_code,
                subject_name,
                department,
                year,
                credits,
                semester,
                section,
                staff_id
            FROM subjects
            WHERE subject_id = ?
            LIMIT 1
        `, [result.insertId]);

        if (!createdRows.length) {
            return res.status(500).json({
                success: false,
                message: "Subject created but could not be retrieved"
            });
        }

        const created = {
            ...createdRows[0],
            department_id: createdRows[0].department,
            status: "active"
        };

        return res.status(201).json({
            success: true,
            message: "Subject created successfully",
            subject: created
        });

    } catch (error) {
        console.error("Create Subject Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Subject code already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create subject",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE SUBJECT
// =====================================================

const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid subject ID is required"
            });
        }

        // -------------------------------------------------
        // GET EXISTING SUBJECT
        // -------------------------------------------------

        const [existing] = await db.query(`
            SELECT
                subject_id,
                subject_code,
                subject_name,
                department,
                year,
                credits,
                semester,
                section,
                staff_id
            FROM subjects
            WHERE subject_id = ?
            LIMIT 1
        `, [id]);

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        const old = existing[0];

        const {
            subject_code,
            subject_name,
            department,
            department_id,
            year,
            credits,
            semester,
            section,
            staff_id
        } = req.body;

        // -------------------------------------------------
        // SUBJECT CODE
        // -------------------------------------------------

        const updatedSubjectCode =
            subject_code !== undefined &&
            String(subject_code).trim() !== ""
                ? String(subject_code).trim()
                : old.subject_code;

        // -------------------------------------------------
        // SUBJECT NAME
        // -------------------------------------------------

        const updatedSubjectName =
            subject_name !== undefined &&
            String(subject_name).trim() !== ""
                ? String(subject_name).trim()
                : old.subject_name;

        // -------------------------------------------------
        // DEPARTMENT
        // -------------------------------------------------

        let updatedDepartment;

        if (department !== undefined) {
            updatedDepartment = normalizeNullable(department);
        } else if (department_id !== undefined) {
            updatedDepartment = normalizeNullable(department_id);
        } else {
            updatedDepartment = old.department;
        }

        // -------------------------------------------------
        // YEAR
        // -------------------------------------------------

        const updatedYear =
            year !== undefined
                ? normalizeNumber(year)
                : old.year;

        // -------------------------------------------------
        // CREDITS
        // -------------------------------------------------

        const updatedCredits =
            credits !== undefined
                ? normalizeNumber(credits)
                : old.credits;

        // -------------------------------------------------
        // SEMESTER
        // -------------------------------------------------

        const updatedSemester =
            semester !== undefined
                ? normalizeNumber(semester)
                : old.semester;

        // -------------------------------------------------
        // SECTION
        // -------------------------------------------------

        const updatedSection =
            section !== undefined
                ? normalizeNullable(section)
                : old.section;

        // -------------------------------------------------
        // STAFF
        // -------------------------------------------------

        const updatedStaffId =
            staff_id !== undefined
                ? normalizeNumber(staff_id)
                : old.staff_id;

        // -------------------------------------------------
        // DUPLICATE SUBJECT CODE CHECK
        // -------------------------------------------------

        const [duplicate] = await db.query(`
            SELECT subject_id
            FROM subjects
            WHERE subject_code = ?
              AND subject_id != ?
            LIMIT 1
        `, [
            updatedSubjectCode,
            id
        ]);

        if (duplicate.length) {
            return res.status(409).json({
                success: false,
                message: "Subject code already exists"
            });
        }

        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

        await db.query(`
            UPDATE subjects
            SET
                subject_code = ?,
                subject_name = ?,
                department = ?,
                year = ?,
                credits = ?,
                semester = ?,
                section = ?,
                staff_id = ?
            WHERE subject_id = ?
        `, [
            updatedSubjectCode,
            updatedSubjectName,
            updatedDepartment,
            updatedYear,
            updatedCredits,
            updatedSemester,
            updatedSection,
            updatedStaffId,
            id
        ]);

        // -------------------------------------------------
        // GET UPDATED SUBJECT
        // -------------------------------------------------

        const [updatedRows] = await db.query(`
            SELECT
                subject_id,
                subject_code,
                subject_name,
                department,
                year,
                credits,
                semester,
                section,
                staff_id
            FROM subjects
            WHERE subject_id = ?
            LIMIT 1
        `, [id]);

        const updated = {
            ...updatedRows[0],
            department_id: updatedRows[0].department,
            status: "active"
        };

        return res.status(200).json({
            success: true,
            message: "Subject updated successfully",
            subject: updated
        });

    } catch (error) {
        console.error("Update Subject Error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Subject code already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update subject",
            error: error.message
        });
    }
};


// =====================================================
// DELETE SUBJECT
// =====================================================

const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid subject ID is required"
            });
        }

        const [result] = await db.query(`
            DELETE FROM subjects
            WHERE subject_id = ?
        `, [id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subject deleted successfully"
        });

    } catch (error) {
        console.error("Delete Subject Error:", error);

        if (
            error.code === "ER_ROW_IS_REFERENCED_2" ||
            error.code === "ER_ROW_IS_REFERENCED"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Unable to delete subject because related records exist.",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete subject. Related records may exist.",
            error: error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};