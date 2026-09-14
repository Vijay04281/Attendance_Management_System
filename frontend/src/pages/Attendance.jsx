import React, { useEffect, useMemo, useState } from "react";
import {
    FaCalendarAlt,
    FaUsers,
    FaCheckCircle,
    FaTimesCircle,
    FaSave,
    FaSearch,
    FaSyncAlt,
    FaBook,
    FaPlay,
    FaStop,
    FaExclamationTriangle,
    FaClock,
} from "react-icons/fa";

const API_URL = "https://attendance-management-system-gpci.onrender.com/api";

const Attendance = () => {
    // =====================================================
    // STATE
    // =====================================================

    const [students, setStudents] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [attendance, setAttendance] = useState({});

    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [selectedAllocation, setSelectedAllocation] =
        useState("");

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [startingSession, setStartingSession] = useState(false);
    const [closingSession, setClosingSession] = useState(false);

    const [activeSession, setActiveSession] = useState(null);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const token = localStorage.getItem("token");

    // =====================================================
    // HELPERS
    // =====================================================

    const normalize = (value) =>
        String(value ?? "")
            .trim()
            .toLowerCase();

    const getStudentId = (student) => {
        return (
            student.student_id ??
            student.id ??
            student.user_id ??
            null
        );
    };

    const getStudentName = (student) => {
        const fullName = `${student.first_name || ""} ${
            student.last_name || ""
        }`.trim();

        return (
            student.name ||
            student.student_name ||
            fullName ||
            "Unknown Student"
        );
    };

    const getRollNumber = (student) => {
        return (
            student.register_number ||
            student.roll_number ||
            student.reg_no ||
            student.register_no ||
            "-"
        );
    };

    const getDepartmentName = (student) => {
        return (
            student.department_name ||
            student.dept_name ||
            student.department ||
            student.dept ||
            ""
        );
    };

    const getYear = (student) => {
        return (
            student.year ??
            student.class_year ??
            student.student_year ??
            student.academic_year ??
            student.classYear ??
            ""
        );
    };

    const getSection = (student) => {
        return (
            student.section ||
            student.class_section ||
            student.classSection ||
            ""
        );
    };

    const getAllocationId = (allocation) => {
        return (
            allocation.allocation_id ??
            allocation.id ??
            null
        );
    };

    const getAllocationSubjectId = (allocation) => {
        return (
            allocation.subject_id ??
            allocation.subjectId ??
            null
        );
    };

    const getAllocationClassId = (allocation) => {
        return (
            allocation.class_id ??
            allocation.classId ??
            null
        );
    };

    const getAllocationSubjectName = (allocation) => {
        return (
            allocation.subject_name ||
            allocation.subjectName ||
            "Unknown Subject"
        );
    };

    const getAllocationSubjectCode = (allocation) => {
        return (
            allocation.subject_code ||
            allocation.subjectCode ||
            "-"
        );
    };

    const getAllocationDepartment = (allocation) => {
        return (
            allocation.department_name ||
            allocation.department ||
            allocation.subject_department ||
            allocation.dept_name ||
            ""
        );
    };

    const getAllocationYear = (allocation) => {
        return (
            allocation.class_year ??
            allocation.classYear ??
            allocation.year ??
            allocation.allocation_year ??
            allocation.subject_year ??
            ""
        );
    };

    const getAllocationSection = (allocation) => {
        return (
            allocation.class_section ||
            allocation.classSection ||
            allocation.section ||
            allocation.subject_section ||
            ""
        );
    };

    const getAllocationClassName = (allocation) => {
        const year = getAllocationYear(allocation);
        const section = getAllocationSection(allocation);

        if (year && section) {
            return `${year} - ${section}`;
        }

        if (year) {
            return `Year ${year}`;
        }

        if (section) {
            return `Section ${section}`;
        }

        const classId = getAllocationClassId(allocation);

        return classId
            ? `Class ${classId}`
            : "Unknown Class";
    };

    const getStatusLabel = (status) => {
        if (status === "PRESENT") return "Present";
        if (status === "LATE") return "Late";
        return "Absent";
    };

    const getStudentMatchesAllocation = (
        student,
        allocation
    ) => {
        if (!allocation) {
            return false;
        }

        const studentDepartment = normalize(
            getDepartmentName(student)
        );

        const allocationDepartment = normalize(
            getAllocationDepartment(allocation)
        );

        const studentYear = String(
            getYear(student) ?? ""
        ).trim();

        const allocationYear = String(
            getAllocationYear(allocation) ?? ""
        ).trim();

        const studentSection = normalize(
            getSection(student)
        );

        const allocationSection = normalize(
            getAllocationSection(allocation)
        );

        // -------------------------------------------------
        // Department
        // -------------------------------------------------

        const departmentMatch =
            !allocationDepartment ||
            studentDepartment === allocationDepartment;

        // -------------------------------------------------
        // Year
        // -------------------------------------------------

        const yearMatch =
            !allocationYear ||
            studentYear === allocationYear;

        // -------------------------------------------------
        // Section
        // -------------------------------------------------

        const sectionMatch =
            !allocationSection ||
            studentSection === allocationSection;

        return (
            departmentMatch &&
            yearMatch &&
            sectionMatch
        );
    };

    // =====================================================
    // SELECTED ALLOCATION
    // =====================================================

    const selectedAllocationData = useMemo(() => {
        if (!selectedAllocation) {
            return null;
        }

        return (
            allocations.find(
                (allocation) =>
                    String(
                        getAllocationId(allocation)
                    ) === String(selectedAllocation)
            ) || null
        );
    }, [allocations, selectedAllocation]);

    // =====================================================
    // API REQUEST HELPER
    // =====================================================

    const apiRequest = async (
        endpoint,
        options = {}
    ) => {
        if (!token) {
            throw new Error(
                "Access token required. Please login again."
            );
        }

        const response = await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...(options.headers || {}),
                },
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                    `Request failed with status ${response.status}`
            );
        }

        if (data.success === false) {
            throw new Error(
                data.message ||
                    "Request failed."
            );
        }

        return data;
    };

    // =====================================================
    // MESSAGE
    // =====================================================

    const showMessage = (
        text,
        type = "success"
    ) => {
        setMessage(text);
        setMessageType(type);
    };

    // =====================================================
    // FETCH STAFF SUBJECT ALLOCATIONS
    //
    // GET:
    // /api/attendance-sessions/staff-subjects
    // =====================================================

    const fetchAllocations = async () => {
        try {
            setLoading(true);
            setMessage("");
            setMessageType("");

            const data = await apiRequest(
                "/attendance-sessions/staff-subjects"
            );

            let list = [];

            if (Array.isArray(data.allocations)) {
                list = data.allocations;
            } else if (Array.isArray(data.subjects)) {
                list = data.subjects;
            } else if (Array.isArray(data.data)) {
                list = data.data;
            }

            // -------------------------------------------------
            // Remove invalid allocations
            // -------------------------------------------------

            const validAllocations = list.filter(
                (allocation) => {
                    const allocationId =
                        getAllocationId(allocation);

                    const subjectId =
                        getAllocationSubjectId(
                            allocation
                        );

                    const classId =
                        getAllocationClassId(
                            allocation
                        );

                    return (
                        allocationId !== null &&
                        allocationId !== undefined &&
                        allocationId !== "" &&
                        subjectId !== null &&
                        subjectId !== undefined &&
                        subjectId !== "" &&
                        classId !== null &&
                        classId !== undefined &&
                        classId !== ""
                    );
                }
            );

            // -------------------------------------------------
            // Remove duplicate allocations
            // -------------------------------------------------

            const uniqueAllocations = [];

            const seen = new Set();

            validAllocations.forEach(
                (allocation) => {
                    const key = [
                        getAllocationId(
                            allocation
                        ),
                        getAllocationSubjectId(
                            allocation
                        ),
                        getAllocationClassId(
                            allocation
                        ),
                    ].join("-");

                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueAllocations.push(
                            allocation
                        );
                    }
                }
            );

            setAllocations(
                uniqueAllocations
            );

            // -------------------------------------------------
            // Keep current selection if still valid
            // -------------------------------------------------

            const currentExists =
                uniqueAllocations.some(
                    (allocation) =>
                        String(
                            getAllocationId(
                                allocation
                            )
                        ) ===
                        String(
                            selectedAllocation
                        )
                );

            if (
                uniqueAllocations.length > 0 &&
                !currentExists
            ) {
                setSelectedAllocation(
                    String(
                        getAllocationId(
                            uniqueAllocations[0]
                        )
                    )
                );
            }

            if (
                uniqueAllocations.length === 0
            ) {
                setSelectedAllocation("");
            }
        } catch (error) {
            console.error(
                "Fetch staff allocations error:",
                error
            );

            setAllocations([]);
            setSelectedAllocation("");

            showMessage(
                error.message ||
                    "Unable to load your subject allocations.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // FETCH STUDENTS
    //
    // Current backend endpoint:
    // GET /api/students
    //
    // The students table has NO class_id.
    //
    // Class membership:
    // department + year + section
    // =====================================================

    const fetchStudents = async () => {
        try {
            setStudentsLoading(true);

            const data = await apiRequest(
                "/students"
            );

            let list = [];

            if (Array.isArray(data.students)) {
                list = data.students;
            } else if (Array.isArray(data.data)) {
                list = data.data;
            } else if (Array.isArray(data)) {
                list = data;
            }

            // -------------------------------------------------
            // Remove invalid students
            // -------------------------------------------------

            const validStudents = list.filter(
                (student) => {
                    const studentId =
                        getStudentId(student);

                    return (
                        studentId !== null &&
                        studentId !== undefined &&
                        studentId !== ""
                    );
                }
            );

            setStudents(validStudents);

            // -------------------------------------------------
            // Initialize attendance
            // -------------------------------------------------

            const initialAttendance = {};

            validStudents.forEach(
                (student) => {
                    const studentId =
                        getStudentId(student);

                    initialAttendance[
                        studentId
                    ] = "ABSENT";
                }
            );

            setAttendance(
                initialAttendance
            );
        } catch (error) {
            console.error(
                "Fetch students error:",
                error
            );

            setStudents([]);

            showMessage(
                error.message ||
                    "Unable to load students.",
                "error"
            );
        } finally {
            setStudentsLoading(false);
        }
    };

    // =====================================================
    // FETCH ACTIVE SESSION
    //
    // GET:
    // /api/attendance-sessions/active
    // =====================================================

    const fetchActiveSession =
        async () => {
            try {
                if (!selectedAllocationData) {
                    setActiveSession(null);
                    return;
                }

                const allocation =
                    selectedAllocationData;

                const allocationId =
                    getAllocationId(allocation);

                const subjectId =
                    getAllocationSubjectId(
                        allocation
                    );

                const classId =
                    getAllocationClassId(
                        allocation
                    );

                if (
                    !allocationId ||
                    !subjectId ||
                    !classId
                ) {
                    setActiveSession(null);
                    return;
                }

                const params =
                    new URLSearchParams();

                params.set(
                    "allocation_id",
                    String(allocationId)
                );

                params.set(
                    "subject_id",
                    String(subjectId)
                );

                params.set(
                    "class_id",
                    String(classId)
                );

                const data =
                    await apiRequest(
                        `/attendance-sessions/active?${params.toString()}`
                    );

                if (
                    data.active &&
                    data.session
                ) {
                    setActiveSession(
                        data.session
                    );
                } else {
                    setActiveSession(null);
                }
            } catch (error) {
                console.error(
                    "Fetch active session error:",
                    error
                );

                setActiveSession(null);
            }
        };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        const load = async () => {
            await Promise.all([
                fetchAllocations(),
                fetchStudents(),
            ]);
        };

        load();
    }, []);

    // =====================================================
    // ALLOCATION CHANGE
    // =====================================================

    useEffect(() => {
        if (
            !selectedAllocationData
        ) {
            setActiveSession(null);
            return;
        }

        fetchActiveSession();
    }, [
        selectedAllocation,
        selectedAllocationData,
    ]);

    // =====================================================
    // DATE CHANGE
    // =====================================================

    useEffect(() => {
        if (!selectedAllocationData) {
            return;
        }

        fetchActiveSession();
    }, [selectedDate]);

    // =====================================================
    // FILTER STUDENTS BY EXACT CLASS
    // =====================================================

    const classStudents = useMemo(() => {
        if (!selectedAllocationData) {
            return [];
        }

        return students.filter(
            (student) =>
                getStudentMatchesAllocation(
                    student,
                    selectedAllocationData
                )
        );
    }, [
        students,
        selectedAllocationData,
    ]);

    // =====================================================
    // SEARCH FILTER
    // =====================================================

    const filteredStudents = useMemo(() => {
        const text = normalize(search);

        if (!text) {
            return classStudents;
        }

        return classStudents.filter(
            (student) => {
                const name = normalize(
                    getStudentName(student)
                );

                const register = normalize(
                    getRollNumber(student)
                );

                const email = normalize(
                    student.email
                );

                return (
                    name.includes(text) ||
                    register.includes(text) ||
                    email.includes(text)
                );
            }
        );
    }, [
        classStudents,
        search,
    ]);

    // =====================================================
    // CHANGE ATTENDANCE
    // =====================================================

    const handleAttendanceChange = (
        studentId,
        status
    ) => {
        setAttendance(
            (previous) => ({
                ...previous,
                [studentId]: status,
            })
        );
    };

    // =====================================================
    // MARK ALL PRESENT
    // =====================================================

    const markAllPresent = () => {
        setAttendance(
            (previous) => {
                const updated = {
                    ...previous,
                };

                classStudents.forEach(
                    (student) => {
                        const id =
                            getStudentId(
                                student
                            );

                        if (id !== null) {
                            updated[id] =
                                "PRESENT";
                        }
                    }
                );

                return updated;
            }
        );
    };

    // =====================================================
    // MARK ALL ABSENT
    // =====================================================

    const markAllAbsent = () => {
        setAttendance(
            (previous) => {
                const updated = {
                    ...previous,
                };

                classStudents.forEach(
                    (student) => {
                        const id =
                            getStudentId(
                                student
                            );

                        if (id !== null) {
                            updated[id] =
                                "ABSENT";
                        }
                    }
                );

                return updated;
            }
        );
    };

    // =====================================================
    // MARK ALL LATE
    // =====================================================

    const markAllLate = () => {
        setAttendance(
            (previous) => {
                const updated = {
                    ...previous,
                };

                classStudents.forEach(
                    (student) => {
                        const id =
                            getStudentId(
                                student
                            );

                        if (id !== null) {
                            updated[id] =
                                "LATE";
                        }
                    }
                );

                return updated;
            }
        );
    };

    // =====================================================
    // CREATE / START ATTENDANCE SESSION
    // =====================================================

    const startAttendanceSession =
        async () => {
            try {
                setStartingSession(true);

                setMessage("");
                setMessageType("");

                if (
                    !selectedAllocationData
                ) {
                    throw new Error(
                        "Please select a subject and class."
                    );
                }

                const allocation =
                    selectedAllocationData;

                const allocationId =
                    getAllocationId(
                        allocation
                    );

                const subjectId =
                    getAllocationSubjectId(
                        allocation
                    );

                const classId =
                    getAllocationClassId(
                        allocation
                    );

                if (
                    !allocationId ||
                    !subjectId ||
                    !classId
                ) {
                    throw new Error(
                        "Selected allocation is missing subject or class information."
                    );
                }

                const data =
                    await apiRequest(
                        "/attendance-sessions",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                allocation_id:
                                    Number(
                                        allocationId
                                    ),

                                subject_id:
                                    Number(
                                        subjectId
                                    ),

                                class_id:
                                    Number(
                                        classId
                                    ),

                                academic_year:
                                    allocation.academic_year ||
                                    null,

                                semester:
                                    allocation.semester ??
                                    allocation.subject_semester ??
                                    null,

                                session_date:
                                    selectedDate,

                                status: "ACTIVE",
                            }),
                        }
                    );

                if (data.session) {
                    setActiveSession(
                        data.session
                    );
                }

                showMessage(
                    data.message ||
                        "Attendance session started successfully.",
                    "success"
                );
            } catch (error) {
                console.error(
                    "Start attendance session error:",
                    error
                );

                showMessage(
                    error.message ||
                        "Unable to start attendance session.",
                    "error"
                );
            } finally {
                setStartingSession(false);
            }
        };

    // =====================================================
    // CLOSE ATTENDANCE SESSION
    // =====================================================

    const closeAttendanceSession =
        async () => {
            try {
                setClosingSession(true);

                setMessage("");
                setMessageType("");

                if (
                    !activeSession?.session_id
                ) {
                    throw new Error(
                        "No active attendance session."
                    );
                }

                const data =
                    await apiRequest(
                        `/attendance-sessions/${activeSession.session_id}/close`,
                        {
                            method: "PATCH",
                        }
                    );

                setActiveSession(
                    data.session || null
                );

                showMessage(
                    data.message ||
                        "Attendance session closed successfully.",
                    "success"
                );
            } catch (error) {
                console.error(
                    "Close attendance session error:",
                    error
                );

                showMessage(
                    error.message ||
                        "Unable to close attendance session.",
                    "error"
                );
            } finally {
                setClosingSession(false);
            }
        };

    // =====================================================
    // SAVE ATTENDANCE
    // =====================================================

    const saveAttendance = async () => {
        try {
            setSaving(true);

            setMessage("");
            setMessageType("");

            if (
                !selectedAllocationData
            ) {
                throw new Error(
                    "Please select a subject and class."
                );
            }

            if (classStudents.length === 0) {
                throw new Error(
                    "No students found in the selected class."
                );
            }

            // -------------------------------------------------
            // Require active session
            // -------------------------------------------------

            let session =
                activeSession;

            // -------------------------------------------------
            // Automatically create session if required
            // -------------------------------------------------

            if (!session?.session_id) {
                const allocation =
                    selectedAllocationData;

                const data =
                    await apiRequest(
                        "/attendance-sessions",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                allocation_id:
                                    Number(
                                        getAllocationId(
                                            allocation
                                        )
                                    ),

                                subject_id:
                                    Number(
                                        getAllocationSubjectId(
                                            allocation
                                        )
                                    ),

                                class_id:
                                    Number(
                                        getAllocationClassId(
                                            allocation
                                        )
                                    ),

                                academic_year:
                                    allocation.academic_year ||
                                    null,

                                semester:
                                    allocation.semester ??
                                    allocation.subject_semester ??
                                    null,

                                session_date:
                                    selectedDate,

                                status: "ACTIVE",
                            }),
                        }
                    );

                session =
                    data.session;

                setActiveSession(
                    session
                );
            }

            if (!session?.session_id) {
                throw new Error(
                    "Unable to create or load attendance session."
                );
            }

            // -------------------------------------------------
            // Verify date
            // -------------------------------------------------

            if (
                session.session_date &&
                String(
                    session.session_date
                ).slice(0, 10) !==
                    String(selectedDate)
            ) {
                throw new Error(
                    "The active attendance session belongs to a different date. Please select the correct date."
                );
            }

            // -------------------------------------------------
            // Verify selected session belongs
            // to selected allocation
            // -------------------------------------------------

            const selectedClassId =
                getAllocationClassId(
                    selectedAllocationData
                );

            const selectedSubjectId =
                getAllocationSubjectId(
                    selectedAllocationData
                );

            const sessionClassId =
                session.class_id;

            const sessionSubjectId =
                session.subject_id;

            if (
                sessionClassId &&
                String(sessionClassId) !==
                    String(selectedClassId)
            ) {
                throw new Error(
                    "The active session belongs to a different class."
                );
            }

            if (
                sessionSubjectId &&
                String(sessionSubjectId) !==
                    String(selectedSubjectId)
            ) {
                throw new Error(
                    "The active session belongs to a different subject."
                );
            }

            // -------------------------------------------------
            // PRESENT
            // -------------------------------------------------

            const presentStudents =
                classStudents.filter(
                    (student) => {
                        const id =
                            getStudentId(
                                student
                            );

                        return (
                            attendance[id] ===
                            "PRESENT"
                        );
                    }
                );

            // -------------------------------------------------
            // LATE
            // -------------------------------------------------

            const lateStudents =
                classStudents.filter(
                    (student) => {
                        const id =
                            getStudentId(
                                student
                            );

                        return (
                            attendance[id] ===
                            "LATE"
                        );
                    }
                );

            // -------------------------------------------------
            // Build records
            // -------------------------------------------------

            const records = [
                ...presentStudents.map(
                    (student) => ({
                        session_id:
                            Number(
                                session.session_id
                            ),

                        student_id:
                            Number(
                                getStudentId(
                                    student
                                )
                            ),

                        status: "PRESENT",
                    })
                ),

                ...lateStudents.map(
                    (student) => ({
                        session_id:
                            Number(
                                session.session_id
                            ),

                        student_id:
                            Number(
                                getStudentId(
                                    student
                                )
                            ),

                        status: "LATE",
                    })
                ),
            ];

            // -------------------------------------------------
            // All absent
            // -------------------------------------------------

            if (records.length === 0) {
                showMessage(
                    "All students are marked absent. No attendance records were added.",
                    "success"
                );

                return;
            }

            // -------------------------------------------------
            // Save records
            // -------------------------------------------------

            let savedCount = 0;
            const failedRecords = [];

            for (const record of records) {
                try {
                    await apiRequest(
                        "/attendance",
                        {
                            method: "POST",
                            body: JSON.stringify(
                                record
                            ),
                        }
                    );

                    savedCount++;
                } catch (error) {
                    console.error(
                        "Attendance record save error:",
                        error
                    );

                    failedRecords.push({
                        student_id:
                            record.student_id,

                        status:
                            record.status,

                        error:
                            error.message,
                    });
                }
            }

            // -------------------------------------------------
            // Result
            // -------------------------------------------------

            const absentCountAfterSave =
                classStudents.length -
                presentStudents.length -
                lateStudents.length;

            if (
                failedRecords.length === 0
            ) {
                showMessage(
                    `Attendance saved successfully. ${savedCount} record${
                        savedCount !== 1
                            ? "s"
                            : ""
                    } saved, ${absentCountAfterSave} student${
                        absentCountAfterSave !==
                        1
                            ? "s"
                            : ""
                    } absent.`,
                    "success"
                );
            } else if (savedCount > 0) {
                showMessage(
                    `Attendance partially saved. ${savedCount} record${
                        savedCount !== 1
                            ? "s"
                            : ""
                    } saved and ${failedRecords.length} failed.`,
                    "error"
                );
            } else {
                showMessage(
                    "No attendance records could be saved.",
                    "error"
                );
            }
        } catch (error) {
            console.error(
                "Save attendance error:",
                error
            );

            showMessage(
                error.message ||
                    "Failed to save attendance.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // REFRESH
    // =====================================================

    const refreshData = async () => {
        try {
            setLoading(true);

            await fetchAllocations();
            await fetchStudents();

            if (selectedAllocation) {
                await fetchActiveSession();
            }

            showMessage(
                "Attendance data refreshed successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Refresh attendance error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalStudents =
        classStudents.length;

    const presentCount =
        classStudents.filter(
            (student) =>
                attendance[
                    getStudentId(student)
                ] === "PRESENT"
        ).length;

    const absentCount =
        classStudents.filter(
            (student) =>
                attendance[
                    getStudentId(student)
                ] === "ABSENT"
        ).length;

    const lateCount =
        classStudents.filter(
            (student) =>
                attendance[
                    getStudentId(student)
                ] === "LATE"
        ).length;

    const attendedCount =
        presentCount + lateCount;

    const attendancePercentage =
        totalStudents > 0
            ? Math.round(
                  (attendedCount /
                      totalStudents) *
                      100
              )
            : 0;

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

                    <p className="text-sm font-medium text-slate-600">
                        Loading your attendance classes...
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // MAIN PAGE
    // =====================================================

    return (
        <div className="space-y-6">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Attendance
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Mark and manage attendance for
                        your assigned subject classes
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    {/* DATE */}

                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <FaCalendarAlt className="text-slate-400" />

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(
                                    e.target.value
                                );

                                setActiveSession(
                                    null
                                );
                            }}
                            className="bg-transparent text-sm font-medium text-slate-700 outline-none"
                        />
                    </div>

                    {/* START / CLOSE SESSION */}

                    {!activeSession ? (
                        <button
                            onClick={
                                startAttendanceSession
                            }
                            disabled={
                                startingSession ||
                                !selectedAllocationData
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FaPlay />

                            {startingSession
                                ? "Starting..."
                                : "Start Session"}
                        </button>
                    ) : (
                        <button
                            onClick={
                                closeAttendanceSession
                            }
                            disabled={
                                closingSession
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FaStop />

                            {closingSession
                                ? "Closing..."
                                : "Close Session"}
                        </button>
                    )}

                    {/* SAVE */}

                    <button
                        onClick={
                            saveAttendance
                        }
                        disabled={
                            saving ||
                            classStudents.length ===
                                0
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <FaSave />

                        {saving
                            ? "Saving..."
                            : "Save Attendance"}
                    </button>
                </div>
            </div>

            {/* =================================================
                NO ALLOCATIONS
            ================================================= */}

            {allocations.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
                    <FaExclamationTriangle className="mx-auto text-4xl text-amber-500" />

                    <h2 className="mt-4 text-lg font-bold text-amber-800">
                        No Subject Allocation Found
                    </h2>

                    <p className="mx-auto mt-2 max-w-xl text-sm text-amber-700">
                        Your staff account does not
                        currently have a subject/class
                        allocation. Please ask the
                        administrator or HOD to assign a
                        subject and class.
                    </p>

                    <button
                        onClick={
                            refreshData
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-amber-700 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-100"
                    >
                        <FaSyncAlt />
                        Refresh
                    </button>
                </div>
            ) : (
                <>
                    {/* =================================================
                        SUBJECT / CLASS SELECTION
                    ================================================= */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <FaBook className="text-blue-600" />

                            <div>
                                <h2 className="font-bold text-slate-800">
                                    Subject & Class
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Select one of your assigned
                                    subject classes
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {/* SUBJECT */}

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Assigned Subject
                                </label>

                                <div className="relative">
                                    <FaBook className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                    <select
                                        value={
                                            selectedAllocation
                                        }
                                        onChange={(
                                            e
                                        ) => {
                                            setSelectedAllocation(
                                                e.target.value
                                            );

                                            setSearch(
                                                ""
                                            );

                                            setActiveSession(
                                                null
                                            );
                                        }}
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            Select Subject / Class
                                        </option>

                                        {allocations.map(
                                            (
                                                allocation
                                            ) => (
                                                <option
                                                    key={String(
                                                        getAllocationId(
                                                            allocation
                                                        )
                                                    )}
                                                    value={String(
                                                        getAllocationId(
                                                            allocation
                                                        )
                                                    )}
                                                >
                                                    {
                                                        getAllocationSubjectCode(
                                                            allocation
                                                        )
                                                    }{" "}
                                                    -{" "}
                                                    {
                                                        getAllocationSubjectName(
                                                            allocation
                                                        )
                                                    }{" "}
                                                    •{" "}
                                                    {
                                                        getAllocationDepartment(
                                                            allocation
                                                        )
                                                    }{" "}
                                                    •{" "}
                                                    {
                                                        getAllocationClassName(
                                                            allocation
                                                        )
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* SELECTED INFO */}

                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                {selectedAllocationData ? (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                                                Subject
                                            </p>

                                            <p className="mt-1 font-bold text-blue-800">
                                                {
                                                    getAllocationSubjectName(
                                                        selectedAllocationData
                                                    )
                                                }
                                            </p>

                                            <p className="text-xs text-blue-600">
                                                {
                                                    getAllocationSubjectCode(
                                                        selectedAllocationData
                                                    )
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                                                Department
                                            </p>

                                            <p className="mt-1 font-bold text-blue-800">
                                                {getAllocationDepartment(
                                                    selectedAllocationData
                                                ) ||
                                                    "Not specified"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                                                Class
                                            </p>

                                            <p className="mt-1 font-bold text-blue-800">
                                                {
                                                    getAllocationClassName(
                                                        selectedAllocationData
                                                    )
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-blue-600">
                                        Select an assigned
                                        subject to continue.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* SESSION STATUS */}

                        <div className="mt-4">
                            {activeSession ? (
                                <div className="flex flex-col justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                                            <FaCheckCircle className="text-green-600" />
                                        </span>

                                        <div>
                                            <p className="text-sm font-bold text-green-800">
                                                Attendance Session Active
                                            </p>

                                            <p className="text-xs text-green-700">
                                                Session #
                                                {
                                                    activeSession.session_id
                                                }{" "}
                                                •{" "}
                                                {selectedDate}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="inline-flex w-fit rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                                        ACTIVE
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <FaExclamationTriangle className="text-slate-400" />

                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            No active attendance
                                            session
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            Start a session before
                                            saving attendance.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* =================================================
                        MESSAGE
                    ================================================= */}

                    {message && (
                        <div
                            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                                messageType ===
                                "success"
                                    ? "border-green-100 bg-green-50 text-green-700"
                                    : "border-red-100 bg-red-50 text-red-700"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    {/* =================================================
                        STATISTICS
                    ================================================= */}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* TOTAL */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Total Students
                                    </p>

                                    <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                        {
                                            totalStudents
                                        }
                                    </h2>
                                </div>

                                <div className="rounded-xl bg-blue-50 p-4">
                                    <FaUsers className="text-xl text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* PRESENT */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Present
                                    </p>

                                    <h2 className="mt-2 text-3xl font-bold text-green-600">
                                        {
                                            presentCount
                                        }
                                    </h2>
                                </div>

                                <div className="rounded-xl bg-green-50 p-4">
                                    <FaCheckCircle className="text-xl text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* ABSENT */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Absent
                                    </p>

                                    <h2 className="mt-2 text-3xl font-bold text-red-600">
                                        {
                                            absentCount
                                        }
                                    </h2>
                                </div>

                                <div className="rounded-xl bg-red-50 p-4">
                                    <FaTimesCircle className="text-xl text-red-600" />
                                </div>
                            </div>
                        </div>

                        {/* ATTENDANCE */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Attendance
                                    </p>

                                    <h2 className="mt-2 text-3xl font-bold text-blue-600">
                                        {
                                            attendancePercentage
                                        }
                                        %
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {
                                            attendedCount
                                        }{" "}
                                        attended
                                    </p>
                                </div>

                                <div className="rounded-xl bg-blue-50 p-4">
                                    <FaCheckCircle className="text-xl text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        STUDENT ATTENDANCE
                    ================================================= */}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* HEADER */}

                        <div className="border-b border-slate-200 p-5">
                            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Student Attendance
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {selectedAllocationData
                                            ? `${getAllocationDepartment(
                                                  selectedAllocationData
                                              ) || "Department"} • ${getAllocationClassName(
                                                  selectedAllocationData
                                              )} • ${getAllocationSubjectName(
                                                  selectedAllocationData
                                              )} • ${selectedDate}`
                                            : "Select a subject class"}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    {/* SEARCH */}

                                    <div className="relative w-full sm:w-72">
                                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                        <input
                                            type="text"
                                            value={
                                                search
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setSearch(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Search student..."
                                            className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    {/* REFRESH */}

                                    <button
                                        onClick={
                                            refreshData
                                        }
                                        disabled={
                                            loading ||
                                            studentsLoading
                                        }
                                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <FaSyncAlt
                                            className={
                                                studentsLoading
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />

                                        Refresh
                                    </button>
                                </div>
                            </div>

                            {/* BULK ACTIONS */}

                            {classStudents.length >
                                0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        onClick={
                                            markAllPresent
                                        }
                                        className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                                    >
                                        <FaCheckCircle />
                                        Mark All Present
                                    </button>

                                    <button
                                        onClick={
                                            markAllLate
                                        }
                                        className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                                    >
                                        <FaClock />
                                        Mark All Late
                                    </button>

                                    <button
                                        onClick={
                                            markAllAbsent
                                        }
                                        className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                    >
                                        <FaTimesCircle />
                                        Mark All Absent
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* =================================================
                            STUDENTS LOADING
                        ================================================= */}

                        {studentsLoading ? (
                            <div className="p-12 text-center">
                                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

                                <p className="mt-4 text-sm font-medium text-slate-600">
                                    Loading students...
                                </p>
                            </div>
                        ) : !selectedAllocationData ? (
                            <div className="p-12 text-center">
                                <FaBook className="mx-auto text-4xl text-slate-300" />

                                <h3 className="mt-4 text-lg font-semibold text-slate-700">
                                    Select a subject class
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Select one of your assigned
                                    subjects to view its students.
                                </p>
                            </div>
                        ) : classStudents.length ===
                          0 ? (
                            <div className="p-12 text-center">
                                <FaUsers className="mx-auto text-4xl text-slate-300" />

                                <h3 className="mt-4 text-lg font-semibold text-slate-700">
                                    No students in this class
                                </h3>

                                <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">
                                    No student matches the
                                    selected class department,
                                    year and section.
                                </p>
                            </div>
                        ) : filteredStudents.length ===
                          0 ? (
                            <div className="p-12 text-center">
                                <FaSearch className="mx-auto text-4xl text-slate-300" />

                                <h3 className="mt-4 text-lg font-semibold text-slate-700">
                                    No matching students
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Try a different student
                                    name or register number.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* =================================================
                                    DESKTOP TABLE
                                ================================================= */}

                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    #
                                                </th>

                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Student
                                                </th>

                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Register Number
                                                </th>

                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Department
                                                </th>

                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Class
                                                </th>

                                                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Attendance
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredStudents.map(
                                                (
                                                    student,
                                                    index
                                                ) => {
                                                    const studentId =
                                                        getStudentId(
                                                            student
                                                        );

                                                    const studentName =
                                                        getStudentName(
                                                            student
                                                        );

                                                    const rollNumber =
                                                        getRollNumber(
                                                            student
                                                        );

                                                    const currentStatus =
                                                        attendance[
                                                            studentId
                                                        ] ||
                                                        "ABSENT";

                                                    return (
                                                        <tr
                                                            key={String(
                                                                studentId
                                                            )}
                                                            className="border-b border-slate-100 transition hover:bg-slate-50"
                                                        >
                                                            {/* NUMBER */}

                                                            <td className="px-6 py-5 text-sm font-medium text-slate-500">
                                                                {
                                                                    index +
                                                                    1
                                                                }
                                                            </td>

                                                            {/* STUDENT */}

                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                                                                        {studentName
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase()}
                                                                    </div>

                                                                    <div>
                                                                        <p className="font-semibold text-slate-700">
                                                                            {
                                                                                studentName
                                                                            }
                                                                        </p>

                                                                        {student.email && (
                                                                            <p className="mt-1 text-xs text-slate-400">
                                                                                {
                                                                                    student.email
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* REGISTER */}

                                                            <td className="px-6 py-5 text-sm text-slate-600">
                                                                {
                                                                    rollNumber
                                                                }
                                                            </td>

                                                            {/* DEPARTMENT */}

                                                            <td className="px-6 py-5 text-sm text-slate-600">
                                                                {getDepartmentName(
                                                                    student
                                                                ) ||
                                                                    "—"}
                                                            </td>

                                                            {/* CLASS */}

                                                            <td className="px-6 py-5">
                                                                <span className="inline-flex rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                                                                    {getYear(
                                                                        student
                                                                    ) ||
                                                                        "—"}{" "}
                                                                    -{" "}
                                                                    {getSection(
                                                                        student
                                                                    ) ||
                                                                        "—"}
                                                                </span>
                                                            </td>

                                                            {/* ATTENDANCE */}

                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-wrap justify-center gap-2">
                                                                    {/* PRESENT */}

                                                                    <button
                                                                        onClick={() =>
                                                                            handleAttendanceChange(
                                                                                studentId,
                                                                                "PRESENT"
                                                                            )
                                                                        }
                                                                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                                                            currentStatus ===
                                                                            "PRESENT"
                                                                                ? "bg-green-600 text-white shadow-sm"
                                                                                : "bg-green-50 text-green-700 hover:bg-green-100"
                                                                        }`}
                                                                    >
                                                                        <FaCheckCircle />
                                                                        Present
                                                                    </button>

                                                                    {/* LATE */}

                                                                    <button
                                                                        onClick={() =>
                                                                            handleAttendanceChange(
                                                                                studentId,
                                                                                "LATE"
                                                                            )
                                                                        }
                                                                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                                                            currentStatus ===
                                                                            "LATE"
                                                                                ? "bg-amber-500 text-white shadow-sm"
                                                                                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                                        }`}
                                                                    >
                                                                        <FaClock />
                                                                        Late
                                                                    </button>

                                                                    {/* ABSENT */}

                                                                    <button
                                                                        onClick={() =>
                                                                            handleAttendanceChange(
                                                                                studentId,
                                                                                "ABSENT"
                                                                            )
                                                                        }
                                                                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                                                            currentStatus ===
                                                                            "ABSENT"
                                                                                ? "bg-red-600 text-white shadow-sm"
                                                                                : "bg-red-50 text-red-700 hover:bg-red-100"
                                                                        }`}
                                                                    >
                                                                        <FaTimesCircle />
                                                                        Absent
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* =================================================
                                    MOBILE CARDS
                                ================================================= */}

                                <div className="space-y-3 p-4 md:hidden">
                                    {filteredStudents.map(
                                        (
                                            student
                                        ) => {
                                            const studentId =
                                                getStudentId(
                                                    student
                                                );

                                            const studentName =
                                                getStudentName(
                                                    student
                                                );

                                            const rollNumber =
                                                getRollNumber(
                                                    student
                                                );

                                            const currentStatus =
                                                attendance[
                                                    studentId
                                                ] ||
                                                "ABSENT";

                                            return (
                                                <div
                                                    key={String(
                                                        studentId
                                                    )}
                                                    className="rounded-xl border border-slate-200 p-4"
                                                >
                                                    {/* INFO */}

                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                                                            {studentName
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <h3 className="truncate font-semibold text-slate-700">
                                                                {
                                                                    studentName
                                                                }
                                                            </h3>

                                                            <p className="text-xs text-slate-500">
                                                                {
                                                                    rollNumber
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs font-medium text-blue-600">
                                                                {getDepartmentName(
                                                                    student
                                                                ) ||
                                                                    "Department"}{" "}
                                                                •{" "}
                                                                {getYear(
                                                                    student
                                                                ) ||
                                                                    "—"}{" "}
                                                                -{" "}
                                                                {getSection(
                                                                    student
                                                                ) ||
                                                                    "—"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* STATUS */}

                                                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-500">
                                                        Current:{" "}
                                                        {
                                                            getStatusLabel(
                                                                currentStatus
                                                            )
                                                        }
                                                    </div>

                                                    {/* ATTENDANCE */}

                                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                                        {/* PRESENT */}

                                                        <button
                                                            onClick={() =>
                                                                handleAttendanceChange(
                                                                    studentId,
                                                                    "PRESENT"
                                                                )
                                                            }
                                                            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                                                                currentStatus ===
                                                                "PRESENT"
                                                                    ? "bg-green-600 text-white"
                                                                    : "bg-green-50 text-green-700 hover:bg-green-100"
                                                            }`}
                                                        >
                                                            <FaCheckCircle />
                                                            Present
                                                        </button>

                                                        {/* LATE */}

                                                        <button
                                                            onClick={() =>
                                                                handleAttendanceChange(
                                                                    studentId,
                                                                    "LATE"
                                                                )
                                                            }
                                                            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                                                                currentStatus ===
                                                                "LATE"
                                                                    ? "bg-amber-500 text-white"
                                                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                            }`}
                                                        >
                                                            <FaClock />
                                                            Late
                                                        </button>

                                                        {/* ABSENT */}

                                                        <button
                                                            onClick={() =>
                                                                handleAttendanceChange(
                                                                    studentId,
                                                                    "ABSENT"
                                                                )
                                                            }
                                                            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                                                                currentStatus ===
                                                                "ABSENT"
                                                                    ? "bg-red-600 text-white"
                                                                    : "bg-red-50 text-red-700 hover:bg-red-100"
                                                            }`}
                                                        >
                                                            <FaTimesCircle />
                                                            Absent
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Attendance;