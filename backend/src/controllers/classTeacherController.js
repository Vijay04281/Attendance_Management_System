// controllers/classTeacherController.js

const db = require("../config/db");
// =====================================================
// ACTIVE CLASS ALLOCATION QUERY
// =====================================================

const ALLOCATION_SOURCE = `
(
    SELECT
        allocation_id,
        subject_id,
        staff_id,
        class_id
    FROM subject_allocations

    UNION

    SELECT
        NULL AS allocation_id,
        subject_id,
        staff_id,
        class_id
    FROM staff_subjects
)
`;

// =====================================================
// GET CLASS SUBJECTS
// =====================================================

const getClassSubjects = async (classId) => {
    const [rows] = await db.query(
        `
        SELECT DISTINCT
            sub.subject_id,
            sub.subject_code,
            sub.subject_name
        FROM ${ALLOCATION_SOURCE} alloc

        INNER JOIN subjects sub
            ON sub.subject_id = alloc.subject_id

        WHERE alloc.class_id = ?

        ORDER BY sub.subject_name
        `,
        [classId]
    );

    return rows;
};

// =====================================================
// GET CLASS STAFF
// =====================================================

const getAllocatedStaff = async (classId) => {
    const [rows] = await db.query(
        `
        SELECT DISTINCT

            st.staff_id,
            st.user_id,
            st.staff_code,
            st.name,
            st.email,

            sub.subject_id,
            sub.subject_code,
            sub.subject_name

        FROM ${ALLOCATION_SOURCE} alloc

        INNER JOIN staff st
            ON st.staff_id = alloc.staff_id

        INNER JOIN subjects sub
            ON sub.subject_id = alloc.subject_id

        WHERE alloc.class_id = ?

        ORDER BY
            st.name,
            sub.subject_name
        `,
        [classId]
    );

    return rows;
};
// =====================================================
// HELPERS
// =====================================================

/**
 * Get the logged-in user's user_id from JWT.
 */
const getTeacherUserId = (req) => {
    const userId =
        req.user?.user_id ??
        req.user?.userId ??
        req.user?.id ??
        req.user?.uid;

    if (!userId) {
        const error = new Error(
            "Authenticated teacher user ID not found"
        );

        error.statusCode = 401;

        throw error;
    }

    const parsed = Number(userId);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        const error = new Error(
            "Invalid authenticated teacher user ID"
        );

        error.statusCode = 401;

        throw error;
    }

    return parsed;
};

// =====================================================
// GET CLASS TEACHER ASSIGNMENT
// =====================================================

const getClassTeacherAssignment = async (
    teacherUserId
) => {
    const [rows] = await db.query(
        `
        SELECT
            cta.assignment_id,
            cta.teacher_user_id,
            cta.class_id,
            cta.status AS assignment_status,

            c.class_id,
            c.department_id,
            c.year,
            c.section,

            d.department_id AS class_department_id,
            d.department_name,
            d.department_code

        FROM class_teacher_assignments cta

        INNER JOIN classes c
            ON c.class_id = cta.class_id

        INNER JOIN departments d
            ON d.department_id = c.department_id

        WHERE cta.teacher_user_id = ?

          AND (
                cta.status IS NULL
                OR LOWER(TRIM(CAST(cta.status AS CHAR))) IN
                    ('active', 'assigned', '1')
              )

        ORDER BY
            cta.assignment_id DESC

        LIMIT 1
        `,
        [teacherUserId]
    );

    return rows.length ? rows[0] : null;
};

// =====================================================
// GET CLASS STUDENTS
// =====================================================

const getClassStudentsFromAssignment = async (
    classInfo
) => {
    if (!classInfo) {
        return [];
    }

    const [rows] = await db.query(
        `
        SELECT
            s.student_id,
            s.user_id,
            s.register_number,
            s.name,
            s.email,
            s.department,
            s.year,
            s.section

        FROM students s

        INNER JOIN departments d
            ON d.department_id = ?

        WHERE CAST(s.year AS CHAR) =
              CAST(? AS CHAR)

          AND LOWER(TRIM(s.section)) =
              LOWER(TRIM(?))

          AND (
                LOWER(TRIM(s.department)) =
                LOWER(TRIM(d.department_name))

                OR

                LOWER(TRIM(s.department)) =
                LOWER(TRIM(d.department_code))
              )

        ORDER BY
            s.name ASC,
            s.register_number ASC
        `,
        [
            classInfo.department_id,
            classInfo.year,
            classInfo.section,
        ]
    );

    return rows;
};

// =====================================================
// TOTAL STUDENTS
// =====================================================

const getTotalStudents = async (classInfo) => {
    if (!classInfo) {
        return 0;
    }

    const [rows] = await db.query(
        `
        SELECT
            COUNT(*) AS total_students

        FROM students s

        INNER JOIN departments d
            ON d.department_id = ?

        WHERE CAST(s.year AS CHAR) =
              CAST(? AS CHAR)

          AND LOWER(TRIM(s.section)) =
              LOWER(TRIM(?))

          AND (
                LOWER(TRIM(s.department)) =
                LOWER(TRIM(d.department_name))

                OR

                LOWER(TRIM(s.department)) =
                LOWER(TRIM(d.department_code))
              )
        `,
        [
            classInfo.department_id,
            classInfo.year,
            classInfo.section,
        ]
    );

    return Number(
        rows[0]?.total_students || 0
    );
};

// =====================================================
// FORMAT CLASS
// =====================================================

const formatClassInfo = (classInfo) => {
    if (!classInfo) {
        return null;
    }

    return {
        class_id: classInfo.class_id,

        department_id:
            classInfo.department_id,

        department_name:
            classInfo.department_name,

        department_code:
            classInfo.department_code,

        year: classInfo.year,

        section: classInfo.section,

        academic_year:
            classInfo.academic_year ??
            classInfo.academicYear ??
            null,
    };
};

// =====================================================
// PERCENTAGE
// =====================================================

const calculatePercentage = (
    present,
    total
) => {
    const p = Number(present || 0);
    const t = Number(total || 0);

    if (t <= 0) {
        return 0;
    }

    return Number(
        ((p / t) * 100).toFixed(2)
    );
};

// =====================================================
// DASHBOARD
// =====================================================

const getDashboard = async (req, res) => {
    try {
        const teacherUserId =
            getTeacherUserId(req);

        // -------------------------------------------------
        // TEACHER
        // -------------------------------------------------

        const [teacherRows] =
            await db.query(
                `
                SELECT
                    s.staff_id,
                    s.user_id,
                    s.staff_code,
                    s.name,
                    s.email

                FROM staff s

                WHERE s.user_id = ?

                LIMIT 1
                `,
                [teacherUserId]
            );

        if (!teacherRows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Teacher staff record not found",
            });
        }

        const teacher =
            teacherRows[0];

        // -------------------------------------------------
        // CLASS
        // -------------------------------------------------

        const classInfo =
            await getClassTeacherAssignment(
                teacherUserId
            );

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message:
                    "No active class-teacher assignment found for this teacher",
            });
        }

        // -------------------------------------------------
        // TOTAL STUDENTS
        // -------------------------------------------------

        const totalStudents =
            await getTotalStudents(
                classInfo
            );

        // -------------------------------------------------
        // TODAY'S SESSIONS
        // -------------------------------------------------
const [sessionsToday] =
    await db.query(
        `
        SELECT DISTINCT

            ass.session_id,
            ass.subject_id,
            ass.staff_id,
            ass.class_id,

            ass.session_date,
            ass.start_time,
            ass.end_time,
            ass.status,

            sub.subject_code,
            sub.subject_name,

            st.staff_code,
            st.name AS staff_name,

            c.class_id,
            c.year,
            c.section,

            d.department_id,
            d.department_name,
            d.department_code

        FROM attendance_sessions ass

        INNER JOIN subjects sub
            ON sub.subject_id = ass.subject_id

        INNER JOIN staff st
            ON st.staff_id = ass.staff_id

        INNER JOIN classes c
            ON c.class_id = ass.class_id

        INNER JOIN departments d
            ON d.department_id = c.department_id

        WHERE ass.class_id = ?

          AND DATE(ass.session_date) = CURDATE()

        ORDER BY
            ass.start_time ASC,
            ass.session_id ASC
        `,
        [classInfo.class_id]
    );
        // -------------------------------------------------
        // TODAY'S ATTENDANCE
        //
        // IMPORTANT:
        // attendance.status only contains:
        // PRESENT / LATE
        //
        // ABSENT is calculated when there is no
        // attendance row for a student/session.
        // -------------------------------------------------

       const [attendanceStats] =
    await db.query(
        `
        SELECT

            COUNT(
                DISTINCT CASE
                    WHEN UPPER(a.status) = 'PRESENT'
                    THEN CONCAT(
                        ass.session_id,
                        '-',
                        a.student_id
                    )
                END
            ) AS present_count,

            COUNT(
                DISTINCT CASE
                    WHEN UPPER(a.status) = 'LATE'
                    THEN CONCAT(
                        ass.session_id,
                        '-',
                        a.student_id
                    )
                END
            ) AS late_count

        FROM attendance_sessions ass

        LEFT JOIN attendance a
            ON a.session_id = ass.session_id

        WHERE ass.class_id = ?

          AND DATE(ass.session_date) = CURDATE()
        `,
        [classInfo.class_id]
    );
        const stats =
            attendanceStats[0] || {};

        const presentCount =
            Number(
                stats.present_count || 0
            );

        const lateCount =
            Number(
                stats.late_count || 0
            );

        // -------------------------------------------------
        // CALCULATE EXPECTED ATTENDANCE
        // -------------------------------------------------

        const expectedAttendance =
            Number(sessionsToday.length) *
            Number(totalStudents);

        const recordedAttendance =
            presentCount +
            lateCount;

        const absentCount =
            Math.max(
                0,
                expectedAttendance -
                recordedAttendance
            );

        const attendancePercentage =
            calculatePercentage(
                presentCount + lateCount,
                expectedAttendance
            );

        return res.json({
            success: true,

            teacher: {
                staff_id:
                    teacher.staff_id,

                user_id:
                    teacher.user_id,

                staff_code:
                    teacher.staff_code,

                name:
                    teacher.name,

                email:
                    teacher.email,
            },

            class:
                formatClassInfo(
                    classInfo
                ),

            statistics: {
                total_students:
                    totalStudents,

                present:
                    presentCount,

                absent:
                    absentCount,

                late:
                    lateCount,

                attendance_percentage:
                    attendancePercentage,

                total_attendance_records:
                    recordedAttendance,

                sessions_today:
                    sessionsToday.length,
            },

            sessions_today:
                sessionsToday,
        });
    } catch (error) {
        console.error(
            "Class teacher dashboard error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Failed to load class teacher dashboard",
        });
    }
};

// =====================================================
// SUBJECT ATTENDANCE
// =====================================================

const getSubjectAttendance = async (
    req,
    res
) => {
    try {
        const teacherUserId =
            getTeacherUserId(req);

        const date =
            req.query.date ||
            new Date()
                .toISOString()
                .slice(0, 10);

        const classInfo =
            await getClassTeacherAssignment(
                teacherUserId
            );

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message:
                    "No active class-teacher assignment found",
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT

                    sub.subject_id,
                    sub.subject_code,
                    sub.subject_name,

                    COUNT(
                        DISTINCT ass.session_id
                    ) AS total_sessions,

                    COUNT(
                        DISTINCT CASE
                            WHEN UPPER(a.status) =
                                 'PRESENT'
                            THEN CONCAT(
                                ass.session_id,
                                '-',
                                a.student_id
                            )
                        END
                    ) AS present_count,

                    COUNT(
                        DISTINCT CASE
                            WHEN UPPER(a.status) =
                                 'LATE'
                            THEN CONCAT(
                                ass.session_id,
                                '-',
                                a.student_id
                            )
                        END
                    ) AS late_count

                FROM subject_allocations sa

                INNER JOIN subjects sub
                    ON sub.subject_id =
                       sa.subject_id

                INNER JOIN classes c
                    ON c.class_id =
                       sa.class_id

                   AND c.department_id = ?

                LEFT JOIN attendance_sessions ass
                    ON ass.staff_id =
                       sa.staff_id

                   AND ass.subject_id =
                       sa.subject_id

                   AND DATE(
                       ass.session_date
                   ) = ?

                LEFT JOIN attendance a
                    ON a.session_id =
                       ass.session_id

                WHERE sa.class_id = ?

                GROUP BY
                    sub.subject_id,
                    sub.subject_code,
                    sub.subject_name

                ORDER BY
                    sub.subject_name ASC
                `,
                [
                    classInfo.department_id,
                    date,
                    classInfo.class_id,
                ]
            );

        const formatted =
            rows.map((row) => {
                const present =
                    Number(
                        row.present_count || 0
                    );

                const late =
                    Number(
                        row.late_count || 0
                    );

                const total =
                    present + late;

                return {
                    ...row,

                    total_sessions:
                        Number(
                            row.total_sessions || 0
                        ),

                    present_count:
                        present,

                    absent_count:
                        0,

                    late_count:
                        late,

                    total_attendance:
                        total,

                    attendance_percentage:
                        calculatePercentage(
                            present + late,
                            total
                        ),
                };
            });

        return res.json({
            success: true,

            date,

            class:
                formatClassInfo(
                    classInfo
                ),

            data:
                formatted,
        });
    } catch (error) {
        console.error(
            "Class teacher subject attendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to load subject attendance",
        });
    }
};

// =====================================================
// ABSENT STUDENTS
//
// IMPORTANT:
//
// attendance.status DOES NOT contain ABSENT.
//
// Therefore:
//
// Student + class session
//       ↓
// attendance row exists?
//       ↓
// NO = ABSENT
// YES = PRESENT/LATE
// =====================================================

const getAbsentStudents = async (
    req,
    res
) => {
    try {
        const teacherUserId =
            getTeacherUserId(req);

        const date =
            req.query.date ||
            new Date()
                .toISOString()
                .slice(0, 10);

        const classInfo =
            await getClassTeacherAssignment(
                teacherUserId
            );

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message:
                    "No active class-teacher assignment found",
            });
        }

        // -------------------------------------------------
        // GET STUDENTS × CLASS SESSIONS
        // AND FIND MISSING ATTENDANCE
        // -------------------------------------------------

        const [rows] =
            await db.query(
                `
                SELECT DISTINCT

                    s.student_id,
                    s.user_id,
                    s.register_number,
                    s.name,
                    s.email,
                    s.department,
                    s.year,
                    s.section,

                    sub.subject_id,
                    sub.subject_code,
                    sub.subject_name,

                    ass.session_id,
                    ass.session_date,
                    ass.start_time,
                    ass.end_time,

                    COALESCE(
                        a.status,
                        'ABSENT'
                    ) AS status,

                    a.scanned_at

                FROM students s

                INNER JOIN departments d
                    ON d.department_id = ?

                INNER JOIN classes c
                    ON c.class_id = ?

                   AND c.department_id =
                       d.department_id

                INNER JOIN staff_subjects ss
                    ON ss.class_id =
                       c.class_id

                INNER JOIN subjects sub
                    ON sub.subject_id =
                       ss.subject_id

                INNER JOIN attendance_sessions ass
                    ON ass.staff_id =
                       ss.staff_id

                   AND ass.subject_id =
                       ss.subject_id

                   AND DATE(
                       ass.session_date
                   ) = ?

                LEFT JOIN attendance a
                    ON a.session_id =
                       ass.session_id

                   AND a.student_id =
                       s.student_id

                WHERE CAST(s.year AS CHAR) =
                      CAST(c.year AS CHAR)

                  AND LOWER(TRIM(s.section)) =
                      LOWER(TRIM(c.section))

                  AND (
                        LOWER(TRIM(s.department)) =
                        LOWER(TRIM(d.department_name))

                        OR

                        LOWER(TRIM(s.department)) =
                        LOWER(TRIM(d.department_code))
                      )

                  AND (
                        a.attendance_id IS NULL

                        OR

                        UPPER(
                            COALESCE(
                                a.status,
                                ''
                            )
                        ) = 'ABSENT'
                      )

                ORDER BY
                    s.name ASC,
                    sub.subject_name ASC
                `,
                [
                    classInfo.department_id,
                    classInfo.class_id,
                    date,
                ]
            );

        return res.json({
            success: true,

            date,

            class:
                formatClassInfo(
                    classInfo
                ),

            count:
                rows.length,

            data:
                rows,

            absent_students:
                rows,
        });
    } catch (error) {
        console.error(
            "Class teacher absent students error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to load absent students",
        });
    }
};

// =====================================================
// STUDENTS
// =====================================================

const getStudents = async (
    req,
    res
) => {
    try {
        const teacherUserId =
            getTeacherUserId(req);

        const classInfo =
            await getClassTeacherAssignment(
                teacherUserId
            );

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message:
                    "No active class-teacher assignment found",
            });
        }

        const students =
            await getClassStudentsFromAssignment(
                classInfo
            );

        // -------------------------------------------------
        // ATTENDANCE SUMMARY
        // -------------------------------------------------

        const [attendanceRows] =
            await db.query(
                `
                SELECT

                    a.student_id,

                    COUNT(
                        DISTINCT ass.session_id
                    ) AS total_sessions,

                    COUNT(
                        DISTINCT CASE
                            WHEN UPPER(a.status) =
                                 'PRESENT'
                            THEN ass.session_id
                        END
                    ) AS present_sessions,

                    COUNT(
                        DISTINCT CASE
                            WHEN UPPER(a.status) =
                                 'LATE'
                            THEN ass.session_id
                        END
                    ) AS late_sessions

                FROM attendance a

                INNER JOIN attendance_sessions ass
                    ON ass.session_id =
                       a.session_id

                INNER JOIN staff_subjects ss
                    ON ss.staff_id =
                       ass.staff_id

                   AND ss.subject_id =
                       ass.subject_id

                   AND ss.class_id = ?

                INNER JOIN classes c
                    ON c.class_id =
                       ss.class_id

                   AND c.department_id = ?

                GROUP BY
                    a.student_id
                `,
                [
                    classInfo.class_id,
                    classInfo.department_id,
                ]
            );

        const attendanceMap =
            new Map();

        attendanceRows.forEach(
            (row) => {
                attendanceMap.set(
                    Number(
                        row.student_id
                    ),
                    {
                        total_sessions:
                            Number(
                                row.total_sessions ||
                                0
                            ),

                        present_sessions:
                            Number(
                                row.present_sessions ||
                                0
                            ),

                        late_sessions:
                            Number(
                                row.late_sessions ||
                                0
                            ),
                    }
                );
            }
        );

        // -------------------------------------------------
        // FORMAT
        // -------------------------------------------------

        const formattedStudents =
            students.map(
                (student) => {
                    const stats =
                        attendanceMap.get(
                            Number(
                                student.student_id
                            )
                        ) || {
                            total_sessions: 0,
                            present_sessions: 0,
                            late_sessions: 0,
                        };

                    const total =
                        stats.total_sessions;

                    const present =
                        stats.present_sessions;

                    const late =
                        stats.late_sessions;

                    return {
                        ...student,

                        total_sessions:
                            total,

                        present_sessions:
                            present,

                        absent_sessions:
                            Math.max(
                                0,
                                total -
                                present -
                                late
                            ),

                        late_sessions:
                            late,

                        attendance_percentage:
                            calculatePercentage(
                                present + late,
                                total
                            ),
                    };
                }
            );

        return res.json({
            success: true,

            class:
                formatClassInfo(
                    classInfo
                ),

            count:
                formattedStudents.length,

            data:
                formattedStudents,

            students:
                formattedStudents,
        });
    } catch (error) {
        console.error(
            "Class teacher students error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to load students",
        });
    }
};

// =====================================================
// CLASS STAFF
// =====================================================

const getClassStaff = async (
    req,
    res
) => {
    try {
        const teacherUserId =
            getTeacherUserId(req);

        const classInfo =
            await getClassTeacherAssignment(
                teacherUserId
            );

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message:
                    "No active class-teacher assignment found",
            });
        }

        // -------------------------------------------------
        // STAFF_SUBJECTS
        // --------------------------------------------

        let staffSubjectRows = [];

        try {
            const [rows] =
                await db.query(
                    `
                    SELECT DISTINCT

                        st.staff_id,
                        st.user_id,
                        st.staff_code,
                        st.name,
                        st.email,

                        sub.subject_id,
                        sub.subject_code,
                        sub.subject_name,

                        c.class_id,
                        c.year,
                        c.section,

                        d.department_id,
                        d.department_name,
                        d.department_code

                    FROM staff_subjects ss

                    INNER JOIN staff st
                        ON st.staff_id =
                           ss.staff_id

                    INNER JOIN subjects sub
                        ON sub.subject_id =
                           ss.subject_id

                    INNER JOIN classes c
                        ON c.class_id =
                           ss.class_id

                    INNER JOIN departments d
                        ON d.department_id =
                           c.department_id

                    WHERE ss.class_id = ?

                      AND c.department_id = ?

                    ORDER BY
                        st.name ASC,
                        sub.subject_name ASC
                    `,
                    [
                        classInfo.class_id,
                        classInfo.department_id,
                    ]
                );

            staffSubjectRows = rows;
        } catch (error) {
            console.warn(
                "staff_subjects lookup failed:",
                error.message
            );
        }

        // -------------------------------------------------
        // SUBJECT_ALLOCATIONS
        //
        // This is optional because older project data may
        // use this table.
        // -------------------------------------------------

        let allocationRows = [];

        try {
            const [rows] =
                await db.query(
                    `
                    SELECT DISTINCT

                        st.staff_id,
                        st.user_id,
                        st.staff_code,
                        st.name,
                        st.email,

                        sub.subject_id,
                        sub.subject_code,
                        sub.subject_name,

                        c.class_id,
                        c.year,
                        c.section,

                        d.department_id,
                        d.department_name,
                        d.department_code

                    FROM subject_allocations sa

                    INNER JOIN staff st
                        ON st.staff_id =
                           sa.staff_id

                    INNER JOIN subjects sub
                        ON sub.subject_id =
                           sa.subject_id

                    INNER JOIN classes c
                        ON c.class_id =
                           sa.class_id

                    INNER JOIN departments d
                        ON d.department_id =
                           c.department_id

                    WHERE sa.class_id = ?

                      AND c.department_id = ?

                    ORDER BY
                        st.name ASC,
                        sub.subject_name ASC
                    `,
                    [
                        classInfo.class_id,
                        classInfo.department_id,
                    ]
                );

            allocationRows = rows;
        } catch (error) {
            console.warn(
                "subject_allocations lookup failed:",
                error.message
            );
        }

        // -------------------------------------------------
        // COMBINE
        // -------------------------------------------------

        const combined = [
            ...staffSubjectRows,
            ...allocationRows,
        ];

        // -------------------------------------------------
        // REMOVE DUPLICATES
        // -------------------------------------------------

        const uniqueMap =
            new Map();

        combined.forEach(
            (row) => {
                const key = [
                    row.staff_id,
                    row.subject_id,
                    row.class_id,
                ].join("-");

                if (
                    !uniqueMap.has(key)
                ) {
                    uniqueMap.set(
                        key,
                        row
                    );
                }
            }
        );

        const rows =
            Array.from(
                uniqueMap.values()
            ).sort(
                (a, b) => {
                    const staffCompare =
                        String(
                            a.name || ""
                        ).localeCompare(
                            String(
                                b.name || ""
                            )
                        );

                    if (
                        staffCompare !== 0
                    ) {
                        return staffCompare;
                    }

                    return String(
                        a.subject_name ||
                        ""
                    ).localeCompare(
                        String(
                            b.subject_name ||
                            ""
                        )
                    );
                }
            );

        return res.json({
            success: true,

            class: {
                class_id:
                    classInfo.class_id,

                department_id:
                    classInfo.department_id,

                department_name:
                    classInfo.department_name,

                department_code:
                    classInfo.department_code,

                year:
                    classInfo.year,

                section:
                    classInfo.section,
            },

            department: {
                department_id:
                    classInfo.department_id,

                department_name:
                    classInfo.department_name,

                department_code:
                    classInfo.department_code,
            },

            count:
                rows.length,

            data:
                rows,

            staff:
                rows,
        });
    } catch (error) {
        console.error(
            "Class teacher class staff error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to load class staff",
        });
    }
};

// =====================================================
// PROFILE
// =====================================================

const getProfile = async (
    req,
    res
) => {
    try {
        const teacherUserId =
            getTeacherUserId(req);

        const [rows] =
            await db.query(
                `
                SELECT
                    s.staff_id,
                    s.user_id,
                    s.staff_code,
                    s.name,
                    s.email

                FROM staff s

                WHERE s.user_id = ?

                LIMIT 1
                `,
                [teacherUserId]
            );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Teacher profile not found",
            });
        }

        const classInfo =
            await getClassTeacherAssignment(
                teacherUserId
            );

        return res.json({
            success: true,

            profile:
                rows[0],

            teacher:
                rows[0],

            class:
                formatClassInfo(
                    classInfo
                ),
        });
    } catch (error) {
        console.error(
            "Class teacher profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to load teacher profile",
        });
    }
};
// =====================================================
// GET MY CLASS
// GET /api/class-teacher/class
//
// Returns the complete class-teacher assignment:
//
// - Assignment ID
// - Academic Year
// - Semester
// - Class
// - Department
// - Total Students
// =====================================================

const getMyClass = async (req, res) => {
    try {
        const teacherUserId = getTeacherUserId(req);

        if (!teacherUserId) {
            return res.status(401).json({
                success: false,
                message: "Teacher user ID not found",
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                cta.assignment_id,
                cta.teacher_user_id,
                cta.class_id,
                cta.academic_year,
                cta.semester,
                cta.status,
                cta.assigned_at,

                c.class_id AS assigned_class_id,
                c.year,
                c.section,
                c.department_id,

                d.department_id AS assigned_department_id,
                d.department_name,
                d.department_code,

                (
                    SELECT COUNT(*)
                    FROM students s
                    WHERE
                        s.year = c.year
                        AND s.section = c.section
                        AND (
                            s.department = d.department_name
                            OR s.department = d.department_code
                        )
                ) AS total_students

            FROM class_teacher_assignments cta

            INNER JOIN classes c
                ON c.class_id = cta.class_id

            LEFT JOIN departments d
                ON d.department_id = c.department_id

            WHERE cta.teacher_user_id = ?

            ORDER BY
                cta.assignment_id DESC

            LIMIT 1
            `,
            [teacherUserId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "No class assigned to this teacher",
            });
        }

        const row = rows[0];

        return res.status(200).json({
            success: true,

            class: {
                class_id: row.class_id,
                year: row.year,
                section: row.section,

                department_id:
                    row.department_id ||
                    row.assigned_department_id,

                department_name:
                    row.department_name || null,

                department_code:
                    row.department_code || null,

                total_students:
                    Number(row.total_students) || 0,
            },

            assignment: {
                assignment_id: row.assignment_id,
                teacher_user_id: row.teacher_user_id,
                class_id: row.class_id,

                academic_year:
                    row.academic_year || null,

                semester:
                    row.semester || null,

                status:
                    row.status || null,

                assigned_at:
                    row.assigned_at || null,
            },

            // Also expose these at the top level.
            // This makes the frontend compatible with
            // both response formats.
            assignment_id: row.assignment_id,

            academic_year:
                row.academic_year || null,

            semester:
                row.semester || null,

            status:
                row.status || null,

            assigned_at:
                row.assigned_at || null,

            total_students:
                Number(row.total_students) || 0,
        });
    } catch (error) {
        console.error(
            "Get My Class Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch my class",
            error: error.message,
        });
    }
};

// =====================================================
// TIMETABLE
// =====================================================

const getTimetable = async (
    req,
    res
) => {
    try {
        const teacherUserId =
            getTeacherUserId(req);

        const classInfo =
            await getClassTeacherAssignment(
                teacherUserId
            );

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message:
                    "No active class-teacher assignment found",
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT

                    t.timetable_id,

                    t.class_id,
                    t.subject_id,
                    t.staff_id,

                    t.day_of_week,
                    t.start_time,
                    t.end_time,

                    sub.subject_code,
                    sub.subject_name,

                    st.staff_code,
                    st.name AS staff_name,

                    c.year,
                    c.section,

                    d.department_id,
                    d.department_name,
                    d.department_code

                FROM timetables t

                INNER JOIN classes c
                    ON c.class_id =
                       t.class_id

                   AND c.department_id = ?

                INNER JOIN departments d
                    ON d.department_id =
                       c.department_id

                INNER JOIN subjects sub
                    ON sub.subject_id =
                       t.subject_id

                INNER JOIN staff st
                    ON st.staff_id =
                       t.staff_id

                WHERE t.class_id = ?

                ORDER BY
                    CASE
                        WHEN LOWER(
                            t.day_of_week
                        ) = 'monday'
                        THEN 1

                        WHEN LOWER(
                            t.day_of_week
                        ) = 'tuesday'
                        THEN 2

                        WHEN LOWER(
                            t.day_of_week
                        ) = 'wednesday'
                        THEN 3

                        WHEN LOWER(
                            t.day_of_week
                        ) = 'thursday'
                        THEN 4

                        WHEN LOWER(
                            t.day_of_week
                        ) = 'friday'
                        THEN 5

                        WHEN LOWER(
                            t.day_of_week
                        ) = 'saturday'
                        THEN 6

                        WHEN LOWER(
                            t.day_of_week
                        ) = 'sunday'
                        THEN 7

                        ELSE 8
                    END,

                    t.start_time ASC
                `,
                [
                    classInfo.department_id,
                    classInfo.class_id,
                ]
            );

        return res.json({
            success: true,

            class:
                formatClassInfo(
                    classInfo
                ),

            count:
                rows.length,

            data:
                rows,

            timetable:
                rows,
        });
    } catch (error) {
        console.error(
            "Class teacher timetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to load timetable",
        });
    }
};

// =====================================================
// DAILY ATTENDANCE REPORT
// =====================================================

const getDailyAttendanceReport = async (
    req,
    res
) => {
    try {
        const teacherUserId =
            getTeacherUserId(req);

        const fromDate =
            req.query.fromDate ||
            req.query.startDate ||
            req.query.date;

        const toDate =
            req.query.toDate ||
            req.query.endDate ||
            fromDate;

        const startDate =
            fromDate ||
            new Date()
                .toISOString()
                .slice(0, 10);

        const endDate =
            toDate ||
            startDate;

        const classInfo =
            await getClassTeacherAssignment(
                teacherUserId
            );

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message:
                    "No active class-teacher assignment found",
            });
        }

        const totalStudents =
            await getTotalStudents(
                classInfo
            );

        const [rows] =
            await db.query(
                `
                SELECT

                    DATE(
                        ass.session_date
                    ) AS attendance_date,

                    COUNT(
                        DISTINCT ass.session_id
                    ) AS total_sessions,

                    COUNT(
                        DISTINCT CASE
                            WHEN UPPER(
                                a.status
                            ) = 'PRESENT'
                            THEN CONCAT(
                                ass.session_id,
                                '-',
                                a.student_id
                            )
                        END
                    ) AS present_count,

                    COUNT(
                        DISTINCT CASE
                            WHEN UPPER(
                                a.status
                            ) = 'LATE'
                            THEN CONCAT(
                                ass.session_id,
                                '-',
                                a.student_id
                            )
                        END
                    ) AS late_count

                FROM attendance_sessions ass

                INNER JOIN staff_subjects ss
                    ON ss.staff_id =
                       ass.staff_id

                   AND ss.subject_id =
                       ass.subject_id

                   AND ss.class_id = ?

                INNER JOIN classes c
                    ON c.class_id =
                       ss.class_id

                   AND c.department_id = ?

                LEFT JOIN attendance a
                    ON a.session_id =
                       ass.session_id

                WHERE ass.session_date >= ?

                  AND ass.session_date < DATE_ADD(
                        ?,
                        INTERVAL 1 DAY
                      )

                GROUP BY
                    DATE(
                        ass.session_date
                    )

                ORDER BY
                    attendance_date ASC
                `,
                [
                    
                    classInfo.department_id,
                    classInfo.class_id,
                    startDate,
                    endDate,
                ]
            );

        const formatted =
            rows.map((row) => {
                const sessions =
                    Number(
                        row.total_sessions ||
                        0
                    );

                const present =
                    Number(
                        row.present_count ||
                        0
                    );

                const late =
                    Number(
                        row.late_count ||
                        0
                    );

                const expected =
                    sessions *
                    totalStudents;

                const recorded =
                    present + late;

                const absent =
                    Math.max(
                        0,
                        expected -
                        recorded
                    );

                return {
                    ...row,

                    total_sessions:
                        sessions,

                    present_count:
                        present,

                    absent_count:
                        absent,

                    late_count:
                        late,

                    total_attendance:
                        recorded,

                    expected_attendance:
                        expected,

                    attendance_percentage:
                        calculatePercentage(
                            recorded,
                            expected
                        ),
                };
            });

        return res.json({
            success: true,

            fromDate:
                startDate,

            toDate:
                endDate,

            class:
                formatClassInfo(
                    classInfo
                ),

            count:
                formatted.length,

            data:
                formatted,

            report:
                formatted,
        });
    } catch (error) {
        console.error(
            "Class teacher daily report error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to load daily attendance report",
        });
    }
};

// =====================================================
// SUBJECT ATTENDANCE REPORT
// =====================================================

const getSubjectAttendanceReport =
    async (req, res) => {
        try {
            const teacherUserId =
                getTeacherUserId(req);

            const fromDate =
                req.query.fromDate ||
                req.query.startDate ||
                req.query.date;

            const toDate =
                req.query.toDate ||
                req.query.endDate ||
                fromDate;

            const startDate =
                fromDate ||
                new Date()
                    .toISOString()
                    .slice(0, 10);

            const endDate =
                toDate ||
                startDate;

            const classInfo =
                await getClassTeacherAssignment(
                    teacherUserId
                );

            if (!classInfo) {
                return res.status(404).json({
                    success: false,
                    message:
                        "No active class-teacher assignment found",
                });
            }

            const totalStudents =
                await getTotalStudents(
                    classInfo
                );

            const [rows] =
                await db.query(
                    `
                    SELECT

                        sub.subject_id,
                        sub.subject_code,
                        sub.subject_name,

                        COUNT(
                            DISTINCT ass.session_id
                        ) AS total_sessions,

                        COUNT(
                            DISTINCT CASE
                                WHEN UPPER(
                                    a.status
                                ) = 'PRESENT'
                                THEN CONCAT(
                                    ass.session_id,
                                    '-',
                                    a.student_id
                                )
                            END
                        ) AS present_count,

                        COUNT(
                            DISTINCT CASE
                                WHEN UPPER(
                                    a.status
                                ) = 'LATE'
                                THEN CONCAT(
                                    ass.session_id,
                                    '-',
                                    a.student_id
                                )
                            END
                        ) AS late_count

                    FROM attendance_sessions ass

INNER JOIN subjects sub
    ON sub.subject_id =
       ass.subject_id

INNER JOIN classes c
    ON c.class_id =
       ass.class_id

   AND c.department_id = ?

LEFT JOIN attendance a
    ON a.session_id =
       ass.session_id

WHERE ass.class_id = ?

  AND ass.session_date >= ?

  AND ass.session_date < DATE_ADD(
        ?,
        INTERVAL 1 DAY
      )
                    LEFT JOIN attendance a
                        ON a.session_id =
                           ass.session_id

                    WHERE sa.class_id = ?

                    GROUP BY
                        sub.subject_id,
                        sub.subject_code,
                        sub.subject_name

                    ORDER BY
                        sub.subject_name ASC
                    `,
                    [
                        classInfo.department_id,
                        classInfo.class_id,
                        startDate,
                        endDate,
                        
                    ]
                );

            const formatted =
                rows.map((row) => {
                    const sessions =
                        Number(
                            row.total_sessions ||
                            0
                        );

                    const present =
                        Number(
                            row.present_count ||
                            0
                        );

                    const late =
                        Number(
                            row.late_count ||
                            0
                        );

                    const expected =
                        sessions *
                        totalStudents;

                    const recorded =
                        present + late;

                    const absent =
                        Math.max(
                            0,
                            expected -
                            recorded
                        );

                    return {
                        ...row,

                        total_sessions:
                            sessions,

                        present_count:
                            present,

                        absent_count:
                            absent,

                        late_count:
                            late,

                        total_attendance:
                            recorded,

                        expected_attendance:
                            expected,

                        attendance_percentage:
                            calculatePercentage(
                                recorded,
                                expected
                            ),
                    };
                });

            return res.json({
                success: true,

                fromDate:
                    startDate,

                toDate:
                    endDate,

                class:
                    formatClassInfo(
                        classInfo
                    ),

                count:
                    formatted.length,

                data:
                    formatted,

                report:
                    formatted,
            });
        } catch (error) {
            console.error(
                "Class teacher subject report error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to load subject attendance report",
            });
        }
    };

// =====================================================
// DEPARTMENT ATTENDANCE REPORT
// =====================================================

const getDepartmentAttendanceReport =
    async (req, res) => {
        try {
            const teacherUserId =
                getTeacherUserId(req);

            const fromDate =
                req.query.fromDate ||
                req.query.startDate ||
                req.query.date;

            const toDate =
                req.query.toDate ||
                req.query.endDate ||
                fromDate;

            const startDate =
                fromDate ||
                new Date()
                    .toISOString()
                    .slice(0, 10);

            const endDate =
                toDate ||
                startDate;

            const classInfo =
                await getClassTeacherAssignment(
                    teacherUserId
                );

            if (!classInfo) {
                return res.status(404).json({
                    success: false,
                    message:
                        "No active class-teacher assignment found",
                });
            }

            const totalStudents =
                await getTotalStudents(
                    classInfo
                );

            const [rows] =
                await db.query(
                    `
                    SELECT

                        d.department_id,
                        d.department_name,
                        d.department_code,

                        c.class_id,
                        c.year,
                        c.section,

                        COUNT(
                            DISTINCT ass.session_id
                        ) AS total_sessions,

                        COUNT(
                            DISTINCT CASE
                                WHEN UPPER(
                                    a.status
                                ) = 'PRESENT'
                                THEN CONCAT(
                                    ass.session_id,
                                    '-',
                                    a.student_id
                                )
                            END
                        ) AS present_count,

                        COUNT(
                            DISTINCT CASE
                                WHEN UPPER(
                                    a.status
                                ) = 'LATE'
                                THEN CONCAT(
                                    ass.session_id,
                                    '-',
                                    a.student_id
                                )
                            END
                        ) AS late_count

                    FROM attendance_sessions ass

INNER JOIN classes c
    ON c.class_id =
       ass.class_id

   AND c.department_id = ?

INNER JOIN departments d
    ON d.department_id =
       c.department_id

LEFT JOIN attendance a
    ON a.session_id =
       ass.session_id

WHERE ass.class_id = ?

  AND ass.session_date >= ?

  AND ass.session_date < DATE_ADD(
        ?,
        INTERVAL 1 DAY
      )
                    GROUP BY

                        d.department_id,
                        d.department_name,
                        d.department_code,

                        c.class_id,
                        c.year,
                        c.section

                    ORDER BY
                        c.year ASC,
                        c.section ASC
                    `,
                    [
                        
                        classInfo.department_id,
                        classInfo.class_id,
                        startDate,
                        endDate,
                    ]
                );

            const formatted =
                rows.map((row) => {
                    const sessions =
                        Number(
                            row.total_sessions ||
                            0
                        );

                    const present =
                        Number(
                            row.present_count ||
                            0
                        );

                    const late =
                        Number(
                            row.late_count ||
                            0
                        );

                    const expected =
                        sessions *
                        totalStudents;

                    const recorded =
                        present + late;

                    const absent =
                        Math.max(
                            0,
                            expected -
                            recorded
                        );

                    return {
                        ...row,

                        total_sessions:
                            sessions,

                        present_count:
                            present,

                        absent_count:
                            absent,

                        late_count:
                            late,

                        total_attendance_records:
                            recorded,

                        expected_attendance:
                            expected,

                        attendance_percentage:
                            calculatePercentage(
                                recorded,
                                expected
                            ),
                    };
                });

            return res.json({
                success: true,

                fromDate:
                    startDate,

                toDate:
                    endDate,

                department: {
                    department_id:
                        classInfo.department_id,

                    department_name:
                        classInfo.department_name,

                    department_code:
                        classInfo.department_code,
                },

                class:
                    formatClassInfo(
                        classInfo
                    ),

                count:
                    formatted.length,

                data:
                    formatted,

                report:
                    formatted,
            });
        } catch (error) {
            console.error(
                "Class teacher department report error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to load department attendance report",
            });
        }
    };

// =====================================================
// STUDENT ATTENDANCE REPORT
// =====================================================

const getStudentAttendanceReport =
    async (req, res) => {
        try {
            const teacherUserId =
                getTeacherUserId(req);

            const fromDate =
                req.query.fromDate ||
                req.query.startDate ||
                req.query.date;

            const toDate =
                req.query.toDate ||
                req.query.endDate ||
                fromDate;

            const startDate =
                fromDate ||
                new Date()
                    .toISOString()
                    .slice(0, 10);

            const endDate =
                toDate ||
                startDate;

            const classInfo =
                await getClassTeacherAssignment(
                    teacherUserId
                );

            if (!classInfo) {
                return res.status(404).json({
                    success: false,
                    message:
                        "No active class-teacher assignment found",
                });
            }

            const students =
                await getClassStudentsFromAssignment(
                    classInfo
                );

            const [rows] =
                await db.query(
                    `
                    SELECT

                        a.student_id,

                        COUNT(
                            DISTINCT ass.session_id
                        ) AS total_sessions,

                        COUNT(
                            DISTINCT CASE
                                WHEN UPPER(
                                    a.status
                                ) = 'PRESENT'
                                THEN ass.session_id
                            END
                        ) AS present_sessions,

                        COUNT(
                            DISTINCT CASE
                                WHEN UPPER(
                                    a.status
                                ) = 'LATE'
                                THEN ass.session_id
                            END
                        ) AS late_sessions
FROM attendance a

INNER JOIN attendance_sessions ass
    ON ass.session_id =
       a.session_id

INNER JOIN classes c
    ON c.class_id =
       ass.class_id

   AND c.department_id = ?

WHERE ass.class_id = ?

  AND ass.session_date >= ?

  AND ass.session_date < DATE_ADD(
        ?,
        INTERVAL 1 DAY
      )

                    GROUP BY
                        a.student_id
                    `,
                    [
                        
                        classInfo.department_id,
                        classInfo.class_id,
                        startDate,
                        endDate,
                    ]
                );

            const attendanceMap =
                new Map();

            rows.forEach((row) => {
                attendanceMap.set(
                    Number(
                        row.student_id
                    ),
                    {
                        total_sessions:
                            Number(
                                row.total_sessions ||
                                0
                            ),

                        present_sessions:
                            Number(
                                row.present_sessions ||
                                0
                            ),

                        late_sessions:
                            Number(
                                row.late_sessions ||
                                0
                            ),
                    }
                );
            });

            const formatted =
                students.map(
                    (student) => {
                        const stats =
                            attendanceMap.get(
                                Number(
                                    student.student_id
                                )
                            ) || {
                                total_sessions: 0,
                                present_sessions: 0,
                                late_sessions: 0,
                            };

                        const total =
                            stats.total_sessions;

                        const present =
                            stats.present_sessions;

                        const late =
                            stats.late_sessions;

                        return {
                            ...student,

                            total_sessions:
                                total,

                            present_sessions:
                                present,

                            absent_sessions:
                                Math.max(
                                    0,
                                    total -
                                    present -
                                    late
                                ),

                            late_sessions:
                                late,

                            attendance_percentage:
                                calculatePercentage(
                                    present +
                                    late,
                                    total
                                ),
                        };
                    }
                );

            return res.json({
                success: true,

                fromDate:
                    startDate,

                toDate:
                    endDate,

                class:
                    formatClassInfo(
                        classInfo
                    ),

                count:
                    formatted.length,

                data:
                    formatted,

                students:
                    formatted,

                report:
                    formatted,
            });
        } catch (error) {
            console.error(
                "Class teacher student report error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to load student attendance report",
            });
        }
    };

// =====================================================
// CLASS ATTENDANCE REPORT
// =====================================================

const getClassAttendanceReport =
    async (req, res) => {
        try {
            const teacherUserId =
                getTeacherUserId(req);

            const fromDate =
                req.query.fromDate ||
                req.query.startDate ||
                req.query.date;

            const toDate =
                req.query.toDate ||
                req.query.endDate ||
                fromDate;

            const startDate =
                fromDate ||
                new Date()
                    .toISOString()
                    .slice(0, 10);

            const endDate =
                toDate ||
                startDate;

            const classInfo =
                await getClassTeacherAssignment(
                    teacherUserId
                );

            if (!classInfo) {
                return res.status(404).json({
                    success: false,
                    message:
                        "No active class-teacher assignment found",
                });
            }

            const totalStudents =
                await getTotalStudents(
                    classInfo
                );

            const [rows] =
                await db.query(
                    `
                    SELECT

                        COUNT(
                            DISTINCT ass.session_id
                        ) AS total_sessions,

                        COUNT(
                            DISTINCT CASE
                                WHEN UPPER(
                                    a.status
                                ) = 'PRESENT'
                                THEN CONCAT(
                                    ass.session_id,
                                    '-',
                                    a.student_id
                                )
                            END
                        ) AS present_count,

                        COUNT(
                            DISTINCT CASE
                                WHEN UPPER(
                                    a.status
                                ) = 'LATE'
                                THEN CONCAT(
                                    ass.session_id,
                                    '-',
                                    a.student_id
                                )
                            END
                        ) AS late_count

                    FROM attendance_sessions ass

INNER JOIN classes c
    ON c.class_id =
       ass.class_id

   AND c.department_id = ?

LEFT JOIN attendance a
    ON a.session_id =
       ass.session_id

WHERE ass.class_id = ?

  AND ass.session_date >= ?

  AND ass.session_date < DATE_ADD(
        ?,
        INTERVAL 1 DAY
      )
                    `,
                    [
                        
                        classInfo.department_id,
                        classInfo.class_id,
                        startDate,
                        endDate,
                    ]
                );

            const stats =
                rows[0] || {};

            const sessions =
                Number(
                    stats.total_sessions ||
                    0
                );

            const present =
                Number(
                    stats.present_count ||
                    0
                );

            const late =
                Number(
                    stats.late_count ||
                    0
                );

            const expected =
                sessions *
                totalStudents;

            const recorded =
                present + late;

            const absent =
                Math.max(
                    0,
                    expected -
                    recorded
                );

            const report = {
                class_id:
                    classInfo.class_id,

                department_id:
                    classInfo.department_id,

                department_name:
                    classInfo.department_name,

                department_code:
                    classInfo.department_code,

                year:
                    classInfo.year,

                section:
                    classInfo.section,

                total_students:
                    totalStudents,

                total_sessions:
                    sessions,

                present_count:
                    present,

                absent_count:
                    absent,

                late_count:
                    late,

                total_attendance_records:
                    recorded,

                expected_attendance:
                    expected,

                attendance_percentage:
                    calculatePercentage(
                        recorded,
                        expected
                    ),
            };

            return res.json({
                success: true,

                fromDate:
                    startDate,

                toDate:
                    endDate,

                class:
                    formatClassInfo(
                        classInfo
                    ),

                data:
                    report,

                report,
            });
        } catch (error) {
            console.error(
                "Class teacher class report error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to load class attendance report",
            });
        }
    };

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getDashboard,

    getProfile,

    getMyClass,

    getStudents,

    getClassStaff,

    getSubjectAttendance,

    getAbsentStudents,

    getTimetable,

    getDailyAttendanceReport,

    getSubjectAttendanceReport,

    getDepartmentAttendanceReport,

    getStudentAttendanceReport,

    getClassAttendanceReport,
};
