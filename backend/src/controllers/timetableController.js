const db = require("../config/db");

// =====================================================
// HELPER: GET LOGGED-IN STAFF ID
// =====================================================

const getLoggedInStaffId = async (req) => {
    const user = req.user || {};

    // -------------------------------------------------
    // Prefer explicit staff_id from authenticated user
    // -------------------------------------------------

    const explicitStaffIds = [
        user.staff_id,
        user.staffId,
    ];

    for (const value of explicitStaffIds) {
        const staffId = Number(value);

        if (!Number.isInteger(staffId) || staffId <= 0) {
            continue;
        }

        const [rows] = await db.query(
            `
            SELECT staff_id
            FROM staff
            WHERE staff_id = ?
            LIMIT 1
            `,
            [staffId]
        );

        if (rows.length > 0) {
            return rows[0].staff_id;
        }
    }

    // -------------------------------------------------
    // Otherwise resolve using user_id
    // -------------------------------------------------

    const userIds = [
        user.user_id,
        user.id,
        user.uid,
    ];

    for (const value of userIds) {
        const userId = Number(value);

        if (!Number.isInteger(userId) || userId <= 0) {
            continue;
        }

        const [rows] = await db.query(
            `
            SELECT staff_id
            FROM staff
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );

        if (rows.length > 0) {
            return rows[0].staff_id;
        }
    }

    return null;
};

// =====================================================
// HELPER: BASE TIMETABLE QUERY
// =====================================================

const timetableSelect = `
    SELECT
        t.timetable_id,
        t.class_id,
        t.subject_id,
        t.staff_id,

        t.day_of_week,
        t.start_time,
        t.end_time,

        s.subject_code,
        s.subject_name,

        st.staff_code,
        st.name AS staff_name,
        st.email AS staff_email,
        st.phone AS staff_phone,

        c.year,
        c.section,

        d.department_id,
        d.department_name,
        d.department_code

    FROM timetables t

    INNER JOIN classes c
        ON c.class_id = t.class_id

    INNER JOIN departments d
        ON d.department_id = c.department_id

    INNER JOIN subjects s
        ON s.subject_id = t.subject_id

    INNER JOIN staff st
        ON st.staff_id = t.staff_id
`;

// =====================================================
// HELPER: ORDER BY DAY
// =====================================================

const timetableOrder = `
    ORDER BY
        CASE UPPER(t.day_of_week)
            WHEN 'MONDAY' THEN 1
            WHEN 'TUESDAY' THEN 2
            WHEN 'WEDNESDAY' THEN 3
            WHEN 'THURSDAY' THEN 4
            WHEN 'FRIDAY' THEN 5
            WHEN 'SATURDAY' THEN 6
            ELSE 7
        END,
        t.start_time ASC
`;

// =====================================================
// GET ALL TIMETABLES
// ADMIN / HOD
// =====================================================

const getTimetables = async (req, res) => {
    try {
        const [rows] = await db.query(
            `
            ${timetableSelect}
            ${timetableOrder}
            `
        );

        return res.status(200).json({
            success: true,
            count: rows.length,
            timetables: rows,
        });
    } catch (error) {
        console.error(
            "getTimetables error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch timetables",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =====================================================
// GET STAFF TIMETABLE
// =====================================================

const getStaffTimetable = async (req, res) => {
    try {
        const staffId =
            await getLoggedInStaffId(req);

        if (!staffId) {
            return res.status(401).json({
                success: false,
                message:
                    "Unable to identify the logged-in staff member",
            });
        }

        const [rows] = await db.query(
            `
            ${timetableSelect}

            WHERE t.staff_id = ?

            ${timetableOrder}
            `,
            [staffId]
        );

        return res.status(200).json({
            success: true,
            staff_id: staffId,
            count: rows.length,
            timetables: rows,
        });
    } catch (error) {
        console.error(
            "getStaffTimetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch staff timetable",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =====================================================
// GET STUDENT TIMETABLE
// =====================================================

const getStudentTimetable = async (req, res) => {
    try {
        const user = req.user || {};

        const userId = Number(
            user.user_id ||
            user.id ||
            user.uid
        );

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                success: false,
                message:
                    "Unable to identify the logged-in student",
            });
        }

        // -------------------------------------------------
        // Find student
        // -------------------------------------------------

        const [students] = await db.query(
            `
            SELECT
                student_id,
                user_id,
                register_number,
                name,
                email,
                department,
                year,
                section
            FROM students
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Student profile not found",
            });
        }

        const student = students[0];

        // -------------------------------------------------
        // Find class using department + year + section
        // -------------------------------------------------

        const [classes] = await db.query(
            `
            SELECT
                c.class_id,
                c.year,
                c.section,

                d.department_id,
                d.department_name,
                d.department_code

            FROM classes c

            INNER JOIN departments d
                ON d.department_id = c.department_id

            WHERE
                c.year = ?
                AND c.section = ?
                AND (
                    LOWER(d.department_name) =
                        LOWER(?)

                    OR

                    LOWER(d.department_code) =
                        LOWER(?)
                )

            LIMIT 1
            `,
            [
                student.year,
                student.section,
                student.department || "",
                student.department || "",
            ]
        );

        if (classes.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Class could not be identified for this student",
                student,
                timetables: [],
            });
        }

        const classInfo = classes[0];

        // -------------------------------------------------
        // Get timetable
        // -------------------------------------------------

        const [rows] = await db.query(
            `
            ${timetableSelect}

            WHERE t.class_id = ?

            ${timetableOrder}
            `,
            [classInfo.class_id]
        );

        return res.status(200).json({
            success: true,

            student: {
                student_id:
                    student.student_id,

                register_number:
                    student.register_number,

                name: student.name,

                email: student.email,

                department:
                    student.department,

                year: student.year,

                section:
                    student.section,
            },

            class: classInfo,

            count: rows.length,

            timetables: rows,
        });
    } catch (error) {
        console.error(
            "getStudentTimetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch student timetable",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =====================================================
// GET TIMETABLE BY ID
// =====================================================

const getTimetableById = async (req, res) => {
    try {
        const timetableId = Number(
            req.params.id
        );

        if (
            !Number.isInteger(timetableId) ||
            timetableId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid timetable ID",
            });
        }

        const [rows] = await db.query(
            `
            ${timetableSelect}

            WHERE t.timetable_id = ?

            LIMIT 1
            `,
            [timetableId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Timetable entry not found",
            });
        }

        return res.status(200).json({
            success: true,
            timetable: rows[0],
        });
    } catch (error) {
        console.error(
            "getTimetableById error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch timetable entry",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =====================================================
// CREATE TIMETABLE
// =====================================================

const createTimetable = async (req, res) => {
    try {
        const {
            class_id,
            subject_id,
            staff_id,
            day_of_week,
            start_time,
            end_time,
        } = req.body;

        // -------------------------------------------------
        // Required fields
        // -------------------------------------------------

        if (
            !class_id ||
            !subject_id ||
            !staff_id ||
            !day_of_week ||
            !start_time ||
            !end_time
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "class_id, subject_id, staff_id, day_of_week, start_time and end_time are required",
            });
        }

        const classId = Number(class_id);
        const subjectId = Number(subject_id);
        const staffId = Number(staff_id);

        if (
            !Number.isInteger(classId) ||
            classId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid class_id",
            });
        }

        if (
            !Number.isInteger(subjectId) ||
            subjectId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid subject_id",
            });
        }

        if (
            !Number.isInteger(staffId) ||
            staffId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid staff_id",
            });
        }

        // -------------------------------------------------
        // Validate day
        // -------------------------------------------------

        const normalizedDay =
            String(day_of_week)
                .trim()
                .toUpperCase();

        const validDays = [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
        ];

        if (!validDays.includes(normalizedDay)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid day_of_week",
                valid_days: validDays,
            });
        }

        // -------------------------------------------------
        // Validate time
        // -------------------------------------------------

        if (
            String(start_time) >=
            String(end_time)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "start_time must be earlier than end_time",
            });
        }

        // -------------------------------------------------
        // Validate class
        // -------------------------------------------------

        const [classes] = await db.query(
            `
            SELECT class_id
            FROM classes
            WHERE class_id = ?
            LIMIT 1
            `,
            [classId]
        );

        if (classes.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Class not found",
            });
        }

        // -------------------------------------------------
        // Validate subject
        // -------------------------------------------------

        const [subjects] = await db.query(
            `
            SELECT subject_id
            FROM subjects
            WHERE subject_id = ?
            LIMIT 1
            `,
            [subjectId]
        );

        if (subjects.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Subject not found",
            });
        }

        // -------------------------------------------------
        // Validate staff
        // -------------------------------------------------

        const [staff] = await db.query(
            `
            SELECT staff_id
            FROM staff
            WHERE staff_id = ?
            LIMIT 1
            `,
            [staffId]
        );

        if (staff.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Staff member not found",
            });
        }

        // -------------------------------------------------
        // Validate subject allocation
        // -------------------------------------------------

        const [allocations] =
            await db.query(
                `
                SELECT
                    allocation_id
                FROM subject_allocations
                WHERE
                    subject_id = ?
                    AND staff_id = ?
                    AND class_id = ?
                LIMIT 1
                `,
                [
                    subjectId,
                    staffId,
                    classId,
                ]
            );

        if (allocations.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This subject is not allocated to this staff member for the selected class",
            });
        }

        // -------------------------------------------------
        // Check overlapping timetable
        // -------------------------------------------------

        const [overlaps] =
            await db.query(
                `
                SELECT
                    timetable_id
                FROM timetables
                WHERE
                    class_id = ?
                    AND day_of_week = ?

                    AND start_time < ?
                    AND end_time > ?

                LIMIT 1
                `,
                [
                    classId,
                    normalizedDay,
                    end_time,
                    start_time,
                ]
            );

        if (overlaps.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This class already has a timetable entry during the selected time",
                timetable_id:
                    overlaps[0].timetable_id,
            });
        }

        // -------------------------------------------------
        // Check staff overlap
        // -------------------------------------------------

        const [staffOverlaps] =
            await db.query(
                `
                SELECT
                    timetable_id
                FROM timetables
                WHERE
                    staff_id = ?
                    AND day_of_week = ?

                    AND start_time < ?
                    AND end_time > ?

                LIMIT 1
                `,
                [
                    staffId,
                    normalizedDay,
                    end_time,
                    start_time,
                ]
            );

        if (staffOverlaps.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This staff member already has another class during the selected time",
                timetable_id:
                    staffOverlaps[0]
                        .timetable_id,
            });
        }

        // -------------------------------------------------
        // Insert
        // -------------------------------------------------

        const [result] = await db.query(
            `
            INSERT INTO timetables
            (
                class_id,
                subject_id,
                staff_id,
                day_of_week,
                start_time,
                end_time
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                classId,
                subjectId,
                staffId,
                normalizedDay,
                start_time,
                end_time,
            ]
        );

        // -------------------------------------------------
        // Return created timetable
        // -------------------------------------------------

        const [created] =
            await db.query(
                `
                ${timetableSelect}

                WHERE t.timetable_id = ?

                LIMIT 1
                `,
                [result.insertId]
            );

        return res.status(201).json({
            success: true,
            message:
                "Timetable created successfully",
            timetable:
                created[0] || null,
        });
    } catch (error) {
        console.error(
            "createTimetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create timetable",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =====================================================
// UPDATE TIMETABLE
// =====================================================

const updateTimetable = async (req, res) => {
    try {
        const timetableId = Number(
            req.params.id
        );

        if (
            !Number.isInteger(timetableId) ||
            timetableId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid timetable ID",
            });
        }

        const {
            class_id,
            subject_id,
            staff_id,
            day_of_week,
            start_time,
            end_time,
        } = req.body;

        if (
            !class_id ||
            !subject_id ||
            !staff_id ||
            !day_of_week ||
            !start_time ||
            !end_time
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "class_id, subject_id, staff_id, day_of_week, start_time and end_time are required",
            });
        }

        const classId = Number(class_id);
        const subjectId = Number(subject_id);
        const staffId = Number(staff_id);

        if (
            !Number.isInteger(classId) ||
            classId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid class_id",
            });
        }

        if (
            !Number.isInteger(subjectId) ||
            subjectId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid subject_id",
            });
        }

        if (
            !Number.isInteger(staffId) ||
            staffId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid staff_id",
            });
        }

        const normalizedDay =
            String(day_of_week)
                .trim()
                .toUpperCase();

        const validDays = [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
        ];

        if (!validDays.includes(normalizedDay)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid day_of_week",
            });
        }

        if (
            String(start_time) >=
            String(end_time)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "start_time must be earlier than end_time",
            });
        }

        // -------------------------------------------------
        // Check existing
        // -------------------------------------------------

        const [existing] =
            await db.query(
                `
                SELECT timetable_id
                FROM timetables
                WHERE timetable_id = ?
                LIMIT 1
                `,
                [timetableId]
            );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Timetable entry not found",
            });
        }

        // -------------------------------------------------
        // Validate allocation
        // -------------------------------------------------

        const [allocations] =
            await db.query(
                `
                SELECT allocation_id
                FROM subject_allocations
                WHERE
                    subject_id = ?
                    AND staff_id = ?
                    AND class_id = ?
                LIMIT 1
                `,
                [
                    subjectId,
                    staffId,
                    classId,
                ]
            );

        if (allocations.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This subject is not allocated to this staff member for the selected class",
            });
        }

        // -------------------------------------------------
        // Check class overlap
        // -------------------------------------------------

        const [classOverlaps] =
            await db.query(
                `
                SELECT timetable_id
                FROM timetables
                WHERE
                    timetable_id <> ?
                    AND class_id = ?
                    AND day_of_week = ?
                    AND start_time < ?
                    AND end_time > ?
                LIMIT 1
                `,
                [
                    timetableId,
                    classId,
                    normalizedDay,
                    end_time,
                    start_time,
                ]
            );

        if (classOverlaps.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This class already has another timetable entry during the selected time",
                timetable_id:
                    classOverlaps[0]
                        .timetable_id,
            });
        }

        // -------------------------------------------------
        // Check staff overlap
        // -------------------------------------------------

        const [staffOverlaps] =
            await db.query(
                `
                SELECT timetable_id
                FROM timetables
                WHERE
                    timetable_id <> ?
                    AND staff_id = ?
                    AND day_of_week = ?
                    AND start_time < ?
                    AND end_time > ?
                LIMIT 1
                `,
                [
                    timetableId,
                    staffId,
                    normalizedDay,
                    end_time,
                    start_time,
                ]
            );

        if (staffOverlaps.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This staff member already has another class during the selected time",
                timetable_id:
                    staffOverlaps[0]
                        .timetable_id,
            });
        }

        // -------------------------------------------------
        // Update
        // -------------------------------------------------

        await db.query(
            `
            UPDATE timetables

            SET
                class_id = ?,
                subject_id = ?,
                staff_id = ?,
                day_of_week = ?,
                start_time = ?,
                end_time = ?

            WHERE timetable_id = ?
            `,
            [
                classId,
                subjectId,
                staffId,
                normalizedDay,
                start_time,
                end_time,
                timetableId,
            ]
        );

        // -------------------------------------------------
        // Return updated
        // -------------------------------------------------

        const [updated] =
            await db.query(
                `
                ${timetableSelect}

                WHERE t.timetable_id = ?

                LIMIT 1
                `,
                [timetableId]
            );

        return res.status(200).json({
            success: true,
            message:
                "Timetable updated successfully",
            timetable:
                updated[0] || null,
        });
    } catch (error) {
        console.error(
            "updateTimetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update timetable",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =====================================================
// DELETE TIMETABLE
// =====================================================

const deleteTimetable = async (req, res) => {
    try {
        const timetableId = Number(
            req.params.id
        );

        if (
            !Number.isInteger(timetableId) ||
            timetableId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid timetable ID",
            });
        }

        const [existing] =
            await db.query(
                `
                SELECT timetable_id
                FROM timetables
                WHERE timetable_id = ?
                LIMIT 1
                `,
                [timetableId]
            );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Timetable entry not found",
            });
        }

        await db.query(
            `
            DELETE FROM timetables
            WHERE timetable_id = ?
            `,
            [timetableId]
        );

        return res.status(200).json({
            success: true,
            message:
                "Timetable deleted successfully",
        });
    } catch (error) {
        console.error(
            "deleteTimetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete timetable",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getTimetables,
    getStaffTimetable,
    getStudentTimetable,
    getTimetableById,
    createTimetable,
    updateTimetable,
    deleteTimetable,
};
