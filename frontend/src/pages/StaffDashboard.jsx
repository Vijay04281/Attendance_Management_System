import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    FaQrcode,
    FaUsers,
    FaCheckCircle,
    FaPercentage,
    FaPlay,
    FaStop,
    FaSyncAlt,
    FaBook,
    FaClipboardCheck,
    FaChartBar,
    FaClock,
    FaUserTimes,
    FaUserGraduate,
    FaHistory,
} from "react-icons/fa";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE =
    "https://attendance-management-system-gpci.onrender.com/api";

// =====================================================
// STAFF DASHBOARD
// =====================================================

const StaffDashboard = () => {
    // =================================================
    // AUTH
    // =================================================

    const token = localStorage.getItem("token");

    let loggedUser = null;

    try {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            loggedUser = JSON.parse(storedUser);
        }
    } catch (error) {
        console.error(
            "Unable to parse logged-in user:",
            error
        );
    }

    // =================================================
    // SUBJECT / CLASS
    // =================================================

    const [subjects, setSubjects] = useState([]);
    const [selectedAllocationId, setSelectedAllocationId] =
        useState("");

    // =================================================
    // ATTENDANCE SESSION
    // =================================================

    const [sessionId, setSessionId] = useState(null);
    const [sessionStatus, setSessionStatus] =
        useState(null);

    // =================================================
    // QR
    // =================================================

    const [qrImage, setQrImage] = useState("");
    const [qrExpiresAt, setQrExpiresAt] =
        useState(null);

    // =================================================
    // ATTENDANCE STATISTICS
    // =================================================

    const [present, setPresent] = useState(0);
    const [late, setLate] = useState(0);
    const [absent, setAbsent] = useState(0);
    const [total, setTotal] = useState(0);
    const [percentage, setPercentage] = useState(0);

    const [hasFinalStatistics, setHasFinalStatistics] =
        useState(false);

    // =================================================
    // LIVE ATTENDANCE
    // =================================================

    const [attendanceRecords, setAttendanceRecords] =
        useState([]);

    // Dashboard-only search/filter state
    const [attendanceSearch, setAttendanceSearch] = useState("");
    const [attendanceFilter, setAttendanceFilter] = useState("ALL");

    const [latestAttendance, setLatestAttendance] =
        useState(null);

    const [lastAttendanceTime, setLastAttendanceTime] =
        useState(null);

    // =================================================
    // LOADING
    // =================================================

    const [loadingSubjects, setLoadingSubjects] =
        useState(true);

    const [loadingSession, setLoadingSession] =
        useState(false);

    const [loadingQR, setLoadingQR] =
        useState(false);

    const [loadingAttendance, setLoadingAttendance] =
        useState(false);

    // =================================================
    // MESSAGE
    // =================================================

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // =================================================
    // COUNTDOWN
    // =================================================

    const [secondsLeft, setSecondsLeft] =
        useState(0);

    // =================================================
    // REFS
    // =================================================

    const qrTimerRef = useRef(null);

    const countTimerRef = useRef(null);

    const countdownTimerRef = useRef(null);

    const activeSessionTimerRef =
        useRef(null);

    const attendanceRequestRef =
        useRef(false);

    const activeSessionRequestRef =
        useRef(false);

    const qrRequestRef =
        useRef(0);

    // Used to prevent an old attendance request
    // from overwriting a newer response.
    const liveAttendanceRequestRef =
        useRef(0);

    // =================================================
    // COMMON HEADERS
    // =================================================

    const getHeaders = useCallback(() => {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    }, [token]);

    // =================================================
    // RESET MESSAGE
    // =================================================

    const clearMessages = useCallback(() => {
        setMessage("");
        setError("");
    }, []);

    // =================================================
    // EXTRACT ATTENDANCE RECORDS
    // =================================================

    const extractAttendanceRecords = useCallback(
        (data) => {
            if (Array.isArray(data)) {
                return data;
            }

            if (
                !data ||
                typeof data !== "object"
            ) {
                return [];
            }

            if (Array.isArray(data.records)) {
                return data.records;
            }

            if (Array.isArray(data.data)) {
                return data.data;
            }

            if (
                Array.isArray(
                    data.attendance
                )
            ) {
                return data.attendance;
            }

            if (Array.isArray(data.rows)) {
                return data.rows;
            }

            return [];
        },
        []
    );

    // =================================================
    // GET RECORD TIME
    // =================================================

    const getAttendanceTimestamp =
        useCallback((record) => {
            return (
                record.scanned_at ??
                record.scan_time ??
                record.attendance_time ??
                record.created_at ??
                record.createdAt ??
                null
            );
        }, []);

    // =================================================
    // GET RECORD ID
    // =================================================

    const getAttendanceId =
        useCallback((record) => {
            return (
                record.attendance_id ??
                record.id ??
                record.attendanceId ??
                null
            );
        }, []);

    // =================================================
    // GET STUDENT NAME
    // =================================================

    const getStudentName =
        useCallback((record) => {
            return (
                record.student_name ??
                record.full_name ??
                record.name ??
                record.student_full_name ??
                "Unknown Student"
            );
        }, []);

    // =================================================
    // GET REGISTER NUMBER
    // =================================================

    const getRegisterNumber =
        useCallback((record) => {
            return (
                record.register_number ??
                record.register_no ??
                record.registerNo ??
                record.student_register_number ??
                record.student_code ??
                record.roll_number ??
                "-"
            );
        }, []);

    // =================================================
    // GET ATTENDANCE STATUS
    // =================================================

    const getAttendanceStatus =
        useCallback((record) => {
            return String(
                record.status ??
                    record.attendance_status ??
                    ""
            ).toUpperCase();
        }, []);

    // =================================================
    // SORT ATTENDANCE RECORDS
    // =================================================

    const sortAttendanceRecords =
        useCallback(
            (records) => {
                return [...records].sort(
                    (a, b) => {
                        const aTime =
                            new Date(
                                String(
                                    getAttendanceTimestamp(
                                        a
                                    ) || ""
                                ).replace(
                                    " ",
                                    "T"
                                )
                            ).getTime();

                        const bTime =
                            new Date(
                                String(
                                    getAttendanceTimestamp(
                                        b
                                    ) || ""
                                ).replace(
                                    " ",
                                    "T"
                                )
                            ).getTime();

                        if (
                            Number.isFinite(
                                bTime
                            ) &&
                            Number.isFinite(
                                aTime
                            )
                        ) {
                            return (
                                bTime - aTime
                            );
                        }

                        const aId =
                            Number(
                                getAttendanceId(
                                    a
                                ) || 0
                            );

                        const bId =
                            Number(
                                getAttendanceId(
                                    b
                                ) || 0
                            );

                        return bId - aId;
                    }
                );
            },
            [getAttendanceTimestamp, getAttendanceId]
        );

    // =================================================
    // APPLY ATTENDANCE STATISTICS
    // =================================================

    const calculateAttendanceStatistics =
        useCallback(
            (stats = {}, records = []) => {
                let presentCount = Number(
                    stats.present ??
                        stats.present_count ??
                        stats.presentCount ??
                        0
                );

                let lateCount = Number(
                    stats.late ??
                        stats.late_count ??
                        stats.lateCount ??
                        0
                );

                let totalCount = Number(
                    stats.total ??
                        stats.total_count ??
                        stats.totalCount ??
                        0
                );

                let percentageValue = Number(
                    stats.percentage ??
                        stats.attendance_percentage ??
                        stats.attendancePercentage ??
                        0
                );

                // =============================================
                // CALCULATE FROM RECORDS
                // =============================================

                if (records.length > 0) {
                    let calculatedPresent = 0;
                    let calculatedLate = 0;

                    records.forEach(
                        (record) => {
                            const status =
                                getAttendanceStatus(
                                    record
                                );

                            if (
                                status ===
                                "PRESENT"
                            ) {
                                calculatedPresent += 1;
                            }

                            if (
                                status ===
                                "LATE"
                            ) {
                                calculatedLate += 1;
                            }
                        }
                    );

                    if (
                        presentCount === 0 &&
                        lateCount === 0
                    ) {
                        presentCount =
                            calculatedPresent;

                        lateCount =
                            calculatedLate;
                    }

                    if (totalCount === 0) {
                        totalCount =
                            records.length;
                    }
                }

                // =============================================
                // TOTAL CANNOT BE LESS THAN ATTENDED
                // =============================================

                if (
                    totalCount <
                    presentCount +
                        lateCount
                ) {
                    totalCount =
                        presentCount +
                        lateCount;
                }

                // =============================================
                // ABSENT
                // =============================================

                const attendedCount =
                    presentCount +
                    lateCount;

                const absentCount =
                    Math.max(
                        totalCount -
                            attendedCount,
                        0
                    );

                // =============================================
                // PERCENTAGE
                // =============================================

                if (
                    !percentageValue &&
                    totalCount > 0
                ) {
                    percentageValue =
                        (attendedCount /
                            totalCount) *
                        100;
                }

                percentageValue =
                    Number(
                        Number(
                            percentageValue
                        ).toFixed(2)
                    );

                return {
                    present:
                        presentCount,

                    late:
                        lateCount,

                    absent:
                        absentCount,

                    total:
                        totalCount,

                    percentage:
                        percentageValue,
                };
            },
            [getAttendanceStatus]
        );

    // =================================================
    // APPLY STATISTICS TO STATE
    // =================================================

    const applyAttendanceStatistics =
        useCallback(
            (stats = {}, records = []) => {
                const result =
                    calculateAttendanceStatistics(
                        stats,
                        records
                    );

                setPresent(
                    result.present
                );

                setLate(
                    result.late
                );

                setAbsent(
                    result.absent
                );

                setTotal(
                    result.total
                );

                setPercentage(
                    result.percentage
                );

                return result;
            },
            [calculateAttendanceStatistics]
        );

    // =====================================================
    // LOAD STAFF SUBJECTS
    // =====================================================

    const loadSubjects =
        useCallback(async () => {
            setLoadingSubjects(true);
            setError("");

            try {
                const response =
                    await fetch(
                        `${API_BASE}/subject-allocations/staff`,
                        {
                            method: "GET",
                            headers:
                                getHeaders(),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Unable to load subjects."
                    );
                }

                const rawSubjects =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(
                              data.data
                          )
                        ? data.data
                        : Array.isArray(
                              data.allocations
                          )
                        ? data.allocations
                        : Array.isArray(
                              data.subjects
                          )
                        ? data.subjects
                        : [];

                const normalizedSubjects =
                    rawSubjects.map(
                        (item) => ({
                            ...item,

                            allocation_id:
                                item.allocation_id ??
                                item.subject_allocation_id ??
                                item.allocationId,

                            subject_id:
                                item.subject_id ??
                                item.subjectId,

                            class_id:
                                item.class_id ??
                                item.classId,

                            class_year:
                                item.class_year ??
                                item.year ??
                                item.classYear,

                            class_section:
                                item.class_section ??
                                item.section ??
                                item.classSection,

                            academic_year:
                                item.academic_year ??
                                item.academicYear,

                            semester:
                                item.semester ??
                                item.sem,
                        })
                    );

                setSubjects(
                    normalizedSubjects
                );

                if (
                    selectedAllocationId
                ) {
                    const stillExists =
                        normalizedSubjects.some(
                            (item) =>
                                String(
                                    item.allocation_id
                                ) ===
                                String(
                                    selectedAllocationId
                                )
                        );

                    if (!stillExists) {
                        setSelectedAllocationId(
                            ""
                        );
                    }
                }
            } catch (err) {
                console.error(
                    "Staff subjects error:",
                    err
                );

                setError(
                    err.message ||
                        "Unable to load subjects."
                );
            } finally {
                setLoadingSubjects(
                    false
                );
            }
        }, [
            getHeaders,
            selectedAllocationId,
        ]);

    // =====================================================
    // LOAD CURRENT QR
    // =====================================================

    const loadQR =
        useCallback(
            async (
                id,
                options = {}
            ) => {
                if (!id) {
                    return;
                }

                const {
                    silent = false,
                } = options;

                const currentRequest =
                    ++qrRequestRef.current;

                try {
                    if (!silent) {
                        setLoadingQR(
                            true
                        );
                    }

                    const response =
                        await fetch(
                            `${API_BASE}/attendance-sessions/${id}/qr`,
                            {
                                method:
                                    "GET",
                                headers:
                                    getHeaders(),
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                                "Unable to load QR code."
                        );
                    }

                    if (
                        currentRequest !==
                        qrRequestRef.current
                    ) {
                        return;
                    }

                    const image =
                        data.qr_image ??
                        data.qr_code ??
                        data.qrImage ??
                        data.image ??
                        "";

                    const expiry =
                        data.qr_expires_at ??
                        data.qrExpiresAt ??
                        data.expires_at ??
                        data.expiresAt ??
                        null;

                    setQrImage(
                        image
                    );

                    setQrExpiresAt(
                        expiry
                    );

                    if (data.status) {
                        setSessionStatus(
                            String(
                                data.status
                            ).toUpperCase()
                        );
                    }
                } catch (err) {
                    console.error(
                        "QR loading error:",
                        err
                    );

                    if (!silent) {
                        setError(
                            err.message ||
                                "Unable to load QR code."
                        );
                    }
                } finally {
                    if (!silent) {
                        setLoadingQR(
                            false
                        );
                    }
                }
            },
            [getHeaders]
        );

    // =====================================================
    // LOAD LIVE ATTENDANCE RECORDS
    //
    // THIS IS THE IMPORTANT NEW PART.
    //
    // The browser polls:
    //
    // GET /api/attendance-records/session/:sessionId
    //
    // every 1 second.
    //
    // This endpoint reads the main `attendance` table.
    // =====================================================

    const loadLiveAttendance =
        useCallback(
            async (
                id,
                options = {}
            ) => {
                if (!id) {
                    return null;
                }

                const {
                    silent = false,
                } = options;

                if (
                    attendanceRequestRef.current
                ) {
                    return null;
                }

                attendanceRequestRef.current =
                    true;

                const requestNumber =
                    ++liveAttendanceRequestRef.current;

                try {
                    if (!silent) {
                        setLoadingAttendance(
                            true
                        );
                    }

                    const response =
                        await fetch(
                            `${API_BASE}/attendance/session/${id}`,
                            {
                                method:
                                    "GET",
                                headers:
                                    getHeaders(),
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                                "Unable to load live attendance."
                        );
                    }

                    // =========================================
                    // IGNORE STALE RESPONSE
                    // =========================================

                    if (
                        requestNumber !==
                        liveAttendanceRequestRef.current
                    ) {
                        return null;
                    }

                    const records =
                        extractAttendanceRecords(
                            data
                        );

                    const sortedRecords =
                        sortAttendanceRecords(
                            records
                        );

                    setAttendanceRecords(
                        sortedRecords
                    );

                    // =========================================
                    // LATEST STUDENT
                    // =========================================

                    const newestRecord =
                        sortedRecords.length >
                        0
                            ? sortedRecords[0]
                            : null;

                    setLatestAttendance(
                        newestRecord
                    );

                    if (
                        newestRecord
                    ) {
                        setLastAttendanceTime(
                            getAttendanceTimestamp(
                                newestRecord
                            )
                        );
                    }

                    // =========================================
                    // CALCULATE STATISTICS
                    // =========================================

                    const statistics =
                        calculateAttendanceStatistics(
                            data,
                            sortedRecords
                        );

                    setPresent(
                        statistics.present
                    );

                    setLate(
                        statistics.late
                    );

                    setAbsent(
                        statistics.absent
                    );

                    setTotal(
                        statistics.total
                    );

                    setPercentage(
                        statistics.percentage
                    );

                    return {
                        records:
                            sortedRecords,

                        latest:
                            newestRecord,

                        statistics,
                    };
                } catch (err) {
                    console.error(
                        "Live attendance error:",
                        err
                    );

                    if (!silent) {
                        setError(
                            err.message ||
                                "Unable to load live attendance."
                        );
                    }

                    return null;
                } finally {
                    attendanceRequestRef.current =
                        false;

                    if (!silent) {
                        setLoadingAttendance(
                            false
                        );
                    }
                }
            },
            [
                getHeaders,
                extractAttendanceRecords,
                sortAttendanceRecords,
                getAttendanceTimestamp,
                calculateAttendanceStatistics,
            ]
        );

    // =====================================================
    // LOAD ATTENDANCE COUNT
    //
    // Kept for compatibility with the existing backend.
    // Live records are now the primary source.
    // =====================================================

    const loadAttendanceCount =
        useCallback(
            async (
                id,
                options = {}
            ) => {
                if (!id) {
                    return null;
                }

                const {
                    silent = false,
                } = options;

                try {
                    const liveResult =
                        await loadLiveAttendance(
                            id,
                            {
                                silent,
                            }
                        );

                    if (
                        liveResult
                    ) {
                        return liveResult;
                    }

                    // =====================================
                    // FALLBACK COUNT ENDPOINT
                    // =====================================

                    const response =
                        await fetch(
                            `${API_BASE}/attendance/session/${id}/count`,
                            {
                                method:
                                    "GET",
                                headers:
                                    getHeaders(),
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                                "Unable to load attendance."
                        );
                    }

                    const records =
                        extractAttendanceRecords(
                            data
                        );

                    const statistics =
                        calculateAttendanceStatistics(
                            data,
                            records
                        );

                    setPresent(
                        statistics.present
                    );

                    setLate(
                        statistics.late
                    );

                    setAbsent(
                        statistics.absent
                    );

                    setTotal(
                        statistics.total
                    );

                    setPercentage(
                        statistics.percentage
                    );

                    return {
                        records,
                        latest:
                            records[0] ||
                            null,
                        statistics,
                    };
                } catch (err) {
                    console.error(
                        "Attendance count error:",
                        err
                    );

                    if (!silent) {
                        setError(
                            err.message ||
                                "Unable to load attendance."
                        );
                    }

                    return null;
                }
            },
            [
                loadLiveAttendance,
                getHeaders,
                extractAttendanceRecords,
                calculateAttendanceStatistics,
            ]
        );

    // =====================================================
    // LOAD ACTIVE SESSION
    // =====================================================

    const loadActiveSession =
        useCallback(
            async (
                options = {}
            ) => {
                const {
                    silent = false,
                } = options;

                if (
                    activeSessionRequestRef.current
                ) {
                    return;
                }

                activeSessionRequestRef.current =
                    true;

                try {
                    const response =
                        await fetch(
                            `${API_BASE}/attendance-sessions/active`,
                            {
                                method:
                                    "GET",
                                headers:
                                    getHeaders(),
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                                "Unable to load active session."
                        );
                    }

                    const activeSession =
    data.session ??
    data.data ??
    data.active_session ??
    data.activeSession ??
    data;

const currentSessionId =
    activeSession?.session_id ??
    activeSession?.attendance_session_id ??
    activeSession?.id;

console.log(
    "ACTIVE SESSION DATA:",
    activeSession
);

console.log(
    "SESSION ID:",
    currentSessionId
);

if (!currentSessionId) {
    // Keep the final attendance summary visible after the
    // backend removes the closed session from active sessions.
    if (hasFinalStatistics) {
        setSessionStatus("CLOSED");
    } else {
        setSessionId(null);
        setSessionStatus(null);
    }

    setQrImage("");
    setQrExpiresAt(null);
    setSecondsLeft(0);

    return;
}

                    const activeAllocationId =
                        activeSession.allocation_id ??
                        activeSession.subject_allocation_id ??
                        activeSession.allocationId;

                    if (
                        selectedAllocationId &&
                        activeAllocationId &&
                        String(
                            activeAllocationId
                        ) !==
                            String(
                                selectedAllocationId
                            )
                    ) {
                        return;
                    }

                    const currentStatus =
                        String(
                            activeSession.status ??
                                "ACTIVE"
                        ).toUpperCase();

                    setSessionId(
                        currentSessionId
                    );

                    setSessionStatus(
                        currentStatus
                    );

                    if (
                        currentStatus === "ACTIVE" &&
    currentSessionId
                    ) {
                        await Promise.all(
                            [
                                loadQR(
                                    currentSessionId,
                                    {
                                        silent,
                                    }
                                ),

                                loadLiveAttendance(
                                    currentSessionId,
                                    {
                                        silent,
                                    }
                                ),
                            ]
                        );
                    }
                } catch (err) {
                    console.error(
                        "Active session error:",
                        err
                    );

                    if (!silent) {
                        setError(
                            err.message ||
                                "Unable to load active session."
                        );
                    }
                } finally {
                    activeSessionRequestRef.current =
                        false;
                }
            },
            [
                getHeaders,
                selectedAllocationId,
                loadQR,
                loadLiveAttendance,
                hasFinalStatistics,
            ]
        );

    // =====================================================
    // START ATTENDANCE
    // =====================================================

    const startAttendance =
        async () => {
            clearMessages();

            if (
                !selectedAllocationId
            ) {
                setError(
                    "Please select a subject/class first."
                );
                return;
            }

            const selectedSubject =
                subjects.find(
                    (item) =>
                        String(
                            item.allocation_id
                        ) ===
                        String(
                            selectedAllocationId
                        )
                );

            if (!selectedSubject) {
                setError(
                    "Selected subject allocation was not found."
                );
                return;
            }

            setLoadingSession(
                true
            );

            try {
                const body = {
                    allocation_id:
                        selectedSubject.allocation_id,

                    subject_id:
                        selectedSubject.subject_id,

                    class_id:
                        selectedSubject.class_id,

                    academic_year:
                        selectedSubject.academic_year,

                    semester:
                        selectedSubject.semester,
                };

                console.log(
                    "Starting attendance session:",
                    body
                );

                const response =
                    await fetch(
                        `${API_BASE}/attendance-sessions`,
                        {
                            method:
                                "POST",
                            headers:
                                getHeaders(),
                            body:
                                JSON.stringify(
                                    body
                                ),
                        }
                    );

                const data =
    await response.json();

console.log(
    "START ATTENDANCE RESPONSE:",
    data
);

if (!response.ok) {
    throw new Error(
        data.message ||
        "Unable to start attendance session."
    );
}

const createdSession =
    data.session ??
    data.data ??
    data;

console.log(
    "CREATED SESSION:",
    createdSession
);

const newSessionId =
    createdSession.session_id ??
    data.session_id;

console.log(
    "NEW SESSION ID:",
    newSessionId
);
                if (!newSessionId) {
                    throw new Error(
                        "Session was created but session ID was not returned."
                    );
                }

                // =========================================
                // RESET EVERYTHING
                // =========================================

                setPresent(0);
                setLate(0);
                setAbsent(0);
                setTotal(0);
                setPercentage(0);

                setAttendanceRecords(
                    []
                );

                setLatestAttendance(
                    null
                );

                setLastAttendanceTime(
                    null
                );

                setHasFinalStatistics(
                    false
                );

                setQrImage("");
                setQrExpiresAt(
                    null
                );
                setSecondsLeft(
                    0
                );

                setSessionId(
                    newSessionId
                );

                setSessionStatus(
                    "ACTIVE"
                );

                setMessage(
                    "Attendance session started successfully."
                );

                // =========================================
                // LOAD FIRST QR
                // =========================================

                await loadQR(
                    newSessionId
                );

                // =========================================
                // LOAD INITIAL ATTENDANCE
                // =========================================

                await loadLiveAttendance(
                    newSessionId
                );
            } catch (err) {
                console.error(
                    "Start attendance error:",
                    err
                );

                setError(
                    err.message ||
                        "Unable to start attendance."
                );
            } finally {
                setLoadingSession(
                    false
                );
            }
        };

    // =====================================================
    // CLOSE ATTENDANCE
    // =====================================================

    const closeAttendance =
        async () => {
            clearMessages();

            if (!sessionId) {
                return;
            }

            const shouldClose =
                window.confirm(
                    "Are you sure you want to close this attendance session?"
                );

            if (!shouldClose) {
                return;
            }

            setLoadingSession(
                true
            );

            try {
                // =========================================
                // GET FINAL DATA DIRECTLY
                //
                // Do NOT depend on React state immediately
                // after an async state update.
                // =========================================

                const finalResult =
                    await loadLiveAttendance(
                        sessionId
                    );

                const finalStatistics =
                    finalResult?.statistics ??
                    calculateAttendanceStatistics(
                        {},
                        finalResult?.records ??
                            attendanceRecords
                    );

                // =========================================
                // CLOSE SESSION
                // =========================================

                const response =
                    await fetch(
                        `${API_BASE}/attendance-sessions/${sessionId}/close`,
                        {
                            method:
                                "PATCH",
                            headers:
                                getHeaders(),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Unable to close attendance session."
                    );
                }
                // =========================================
// KEEP FINAL DATA
// =========================================

setAttendanceRecords(
    finalResult?.records || []
);

setAttendanceStats(
    finalStatistics
);

setPresent(
    finalStatistics.present || 0
);

setLate(
    finalStatistics.late || 0
);

setAbsent(
    finalStatistics.absent || 0
);

setTotal(
    finalStatistics.total || 0
);

setPercentage(
    finalStatistics.percentage || 0
);

setHasFinalStatistics(
    true
);

setSessionStatus(
    "CLOSED"
);

setMessage(
    "Attendance session closed successfully."
);

                // =========================================
                // PRESERVE FINAL STATISTICS
                // =========================================

                setPresent(
                    finalStatistics.present
                );

                setLate(
                    finalStatistics.late
                );

                setAbsent(
                    finalStatistics.absent
                );

                setTotal(
                    finalStatistics.total
                );

                setPercentage(
                    finalStatistics.percentage
                );

                setHasFinalStatistics(
                    true
                );

                setSessionStatus(
                    "CLOSED"
                );

                setQrImage("");

                setQrExpiresAt(
                    null
                );

                setSecondsLeft(
                    0
                );

                setMessage(
                    "Attendance session closed successfully."
                );
            } catch (err) {
                console.error(
                    "Close attendance error:",
                    err
                );

                setError(
                    err.message ||
                        "Unable to close attendance."
                );
            } finally {
                setLoadingSession(
                    false
                );
            }
        };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    // =====================================================
    // LOAD ACTIVE SESSION AFTER SUBJECTS
    // =====================================================

    useEffect(() => {
        if (loadingSubjects) {
            return;
        }

        loadActiveSession();
    }, [
        loadingSubjects,
        selectedAllocationId,
        loadActiveSession,
    ]);

    // =====================================================
    // ACTIVE SESSION MONITOR
    // =====================================================

    useEffect(() => {
        if (
            activeSessionTimerRef.current
        ) {
            clearInterval(
                activeSessionTimerRef.current
            );
        }

        activeSessionTimerRef.current =
            setInterval(
                () => {
                    loadActiveSession(
                        {
                            silent: true,
                        }
                    );
                },
                5000
            );

        return () => {
            if (
                activeSessionTimerRef.current
            ) {
                clearInterval(
                    activeSessionTimerRef.current
                );

                activeSessionTimerRef.current =
                    null;
            }
        };
    }, [loadActiveSession]);

    // =====================================================
    // QR REFRESH EVERY 1 SECOND
    // =====================================================

    useEffect(() => {
        if (
            !sessionId ||
            sessionStatus !==
                "ACTIVE"
        ) {
            return;
        }

        if (
            qrTimerRef.current
        ) {
            clearInterval(
                qrTimerRef.current
            );
        }
if (
    sessionStatus !== "ACTIVE"
) {
    return;
}
        loadQR(sessionId);

        qrTimerRef.current =
            setInterval(
                () => {
                    loadQR(
                        sessionId,
                        {
                            silent:
                                true,
                        }
                    );
                },
                1000
            );

        return () => {
            if (
                qrTimerRef.current
            ) {
                clearInterval(
                    qrTimerRef.current
                );

                qrTimerRef.current =
                    null;
            }
        };
    }, [
        sessionId,
        sessionStatus,
        loadQR,
    ]);

    // =====================================================
    // LIVE ATTENDANCE REFRESH EVERY 1 SECOND
    //
    // THIS MAKES THE STAFF PAGE UPDATE QUICKLY AFTER
    // A STUDENT SCANS THE QR.
    // =====================================================

    useEffect(() => {
        if (
            !sessionId ||
            sessionStatus !==
                "ACTIVE"
        ) {
            return;
        }

        if (
            countTimerRef.current
        ) {
            clearInterval(
                countTimerRef.current
            );
        }

        loadLiveAttendance(
            sessionId
        );

        countTimerRef.current =
            setInterval(
                () => {
                    loadLiveAttendance(
                        sessionId,
                        {
                            silent:
                                true,
                        }
                    );
                },
                1000
            );

        return () => {
            if (
                countTimerRef.current
            ) {
                clearInterval(
                    countTimerRef.current
                );

                countTimerRef.current =
                    null;
            }
        };
    }, [
        sessionId,
        sessionStatus,
        loadLiveAttendance,
    ]);

    // =====================================================
    // QR COUNTDOWN
    // =====================================================

    useEffect(() => {
        if (
            !qrExpiresAt ||
            sessionStatus !==
                "ACTIVE"
        ) {
            setSecondsLeft(
                0
            );
            return;
        }

        if (
            countdownTimerRef.current
        ) {
            clearInterval(
                countdownTimerRef.current
            );
        }

        const calculateRemaining =
            () => {
                let expiryTime;

                if (
                    qrExpiresAt instanceof
                    Date
                ) {
                    expiryTime =
                        qrExpiresAt.getTime();
                } else if (
                    typeof qrExpiresAt ===
                    "string"
                ) {
                    let value =
                        qrExpiresAt.trim();

                    if (
                        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
                            value
                        )
                    ) {
                        value =
                            value.replace(
                                " ",
                                "T"
                            );
                    }

                    expiryTime =
                        new Date(
                            value
                        ).getTime();
                } else if (
                    typeof qrExpiresAt ===
                    "number"
                ) {
                    expiryTime =
                        qrExpiresAt;
                } else {
                    expiryTime =
                        NaN;
                }

                if (
                    !Number.isFinite(
                        expiryTime
                    )
                ) {
                    setSecondsLeft(
                        0
                    );
                    return;
                }

                const difference =
                    expiryTime -
                    Date.now();

                const seconds =
                    Math.max(
                        0,
                        Math.ceil(
                            difference /
                                1000
                        )
                    );

                setSecondsLeft(
                    seconds
                );
            };

        calculateRemaining();

        countdownTimerRef.current =
            setInterval(
                calculateRemaining,
                1000
            );

        return () => {
            if (
                countdownTimerRef.current
            ) {
                clearInterval(
                    countdownTimerRef.current
                );

                countdownTimerRef.current =
                    null;
            }
        };
    }, [
        qrExpiresAt,
        sessionStatus,
    ]);

    // =====================================================
    // CLEANUP
    // =====================================================

    useEffect(() => {
        return () => {
            if (
                qrTimerRef.current
            ) {
                clearInterval(
                    qrTimerRef.current
                );
            }

            if (
                countTimerRef.current
            ) {
                clearInterval(
                    countTimerRef.current
                );
            }

            if (
                countdownTimerRef.current
            ) {
                clearInterval(
                    countdownTimerRef.current
                );
            }

            if (
                activeSessionTimerRef.current
            ) {
                clearInterval(
                    activeSessionTimerRef.current
                );
            }
        };
    }, []);

    // =====================================================
    // SELECTED SUBJECT
    // =====================================================

    const selectedSubject =
        subjects.find(
            (item) =>
                String(
                    item.allocation_id
                ) ===
                String(
                    selectedAllocationId
                )
        );

    // =====================================================
    // SESSION ACTIVE
    // =====================================================

    const isSessionActive =
        Boolean(
            sessionId &&
                sessionStatus ===
                    "ACTIVE"
        );

    // =====================================================
    // FORMAT DATE / TIME
    // =====================================================

    const formatDateTime =
        useCallback(
            (value) => {
                if (!value) {
                    return "-";
                }

                let dateValue =
                    String(value);

                if (
                    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
                        dateValue
                    )
                ) {
                    dateValue =
                        dateValue.replace(
                            " ",
                            "T"
                        );
                }

                const date =
                    new Date(
                        dateValue
                    );

                if (
                    !Number.isFinite(
                        date.getTime()
                    )
                ) {
                    return String(
                        value
                    );
                }

                return date.toLocaleString();
            },
            []
        );

    // =====================================================
    // GET DISPLAY STUDENT DEPARTMENT
    // =====================================================

    const getStudentDepartment =
        useCallback(
            (record) => {
                return (
                    record.department_name ??
                    record.department ??
                    record.student_department ??
                    "-"
                );
            },
            []
        );

    // =====================================================
    // DASHBOARD DISPLAY DATA
    // =====================================================

    const filteredAttendanceRecords = attendanceRecords.filter((record) => {
        const search = attendanceSearch.trim().toLowerCase();
        const name = String(getStudentName(record) || "").toLowerCase();
        const register = String(getRegisterNumber(record) || "").toLowerCase();
        const status = String(getAttendanceStatus(record) || "PRESENT").toUpperCase();

        const matchesSearch =
            !search || name.includes(search) || register.includes(search);
        const matchesFilter =
            attendanceFilter === "ALL" || status === attendanceFilter;

        return matchesSearch && matchesFilter;
    });

    const chartMax = Math.max(present, late, absent, 1);

    // =====================================================
    // UI
    // =====================================================

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                padding: "24px",
            }}
        >
            <div
                style={{
                    maxWidth: "1400px",
                    margin: "0 auto",
                }}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    style={{
                        marginBottom: "24px",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "30px",
                            fontWeight: 700,
                            color: "#172033",
                        }}
                    >
                        Staff Attendance
                    </h1>

                    <p
                        style={{
                            margin: "6px 0 0",
                            color: "#667085",
                        }}
                    >
                        Welcome{" "}
                        {loggedUser?.name ||
                            loggedUser?.full_name ||
                            "Staff"}
                    </p>
                </div>
<div
    style={{
        display: "grid",
        gridTemplateColumns:
            "repeat(4,1fr)",
        gap: "12px",
        marginBottom: "20px",
    }}
>
    <button onClick={() => loadSubjects()}>
        Refresh Subjects
    </button>

    <button
        onClick={() =>
            sessionId &&
            loadLiveAttendance(
                sessionId
            )
        }
    >
        Refresh Attendance
    </button>

    <button
        onClick={() =>
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            })
        }
    >
        Top
    </button>

    <button
        onClick={() =>
            console.log(
                attendanceRecords
            )
        }
    >
        Debug
    </button>
</div>
                {/* =================================================
                    MESSAGES
                ================================================= */}

                {message && (
                    <div
                        style={{
                            background: "#ecfdf3",
                            border: "1px solid #abefc6",
                            color: "#067647",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            marginBottom: "16px",
                        }}
                    >
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            background: "#fef3f2",
                            border: "1px solid #fecdca",
                            color: "#b42318",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            marginBottom: "16px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* =================================================
                    SUBJECT SELECTION
                ================================================= */}

                <div
                    style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        padding: "20px",
                        marginBottom: "20px",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "12px",
                        }}
                    >
                        <FaBook style={{ color: "#4f46e5" }} />

                        <h2
                            style={{
                                margin: 0,
                                fontSize: "18px",
                            }}
                        >
                            Select Subject / Class
                        </h2>
                    </div>

                    <select
                        value={selectedAllocationId}
                        onChange={(e) => {
                            clearMessages();
                            setSelectedAllocationId(e.target.value);
                            setHasFinalStatistics(false);
                            setPresent(0);
                            setLate(0);
                            setAbsent(0);
                            setTotal(0);
                            setPercentage(0);
                            setAttendanceRecords([]);
                            setLatestAttendance(null);
                            setLastAttendanceTime(null);
                        }}
                        disabled={
                            loadingSubjects ||
                            isSessionActive
                        }
                        style={{
                            width: "100%",
                            padding: "12px 14px",
                            border: "1px solid #d0d5dd",
                            borderRadius: "10px",
                            background: "#ffffff",
                            fontSize: "15px",
                        }}
                    >
                        <option value="">
                            {loadingSubjects
                                ? "Loading subjects..."
                                : "Select subject/class"}
                        </option>

                        {subjects.map((item) => (
                            <option
                                key={item.allocation_id}
                                value={item.allocation_id}
                            >
                                {item.subject_name ||
                                    item.subject_code ||
                                    `Subject ${item.subject_id}`}
                                {" - "}
                                {item.class_year ||
                                    item.year ||
                                    ""}
                                {" "}
                                {item.class_section ||
                                    item.section ||
                                    ""}
                                {item.semester
                                    ? ` - Sem ${item.semester}`
                                    : ""}
                            </option>
                        ))}
                    </select>
                </div>

                {/* =================================================
                    SESSION DETAILS
                ================================================= */}

                {selectedSubject && (
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "16px",
                            padding: "18px 20px",
                            marginBottom: "20px",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "15px",
                            }}
                        >
                            <div>
                                <small style={{ color: "#667085" }}>
                                    Subject
                                </small>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        marginTop: "4px",
                                    }}
                                >
                                    {selectedSubject.subject_name ||
                                        selectedSubject.subject_code ||
                                        selectedSubject.subject_id}
                                </div>
                            </div>

                            <div>
                                <small style={{ color: "#667085" }}>
                                    Class
                                </small>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        marginTop: "4px",
                                    }}
                                >
                                    {selectedSubject.class_year ||
                                        selectedSubject.year ||
                                        "-"}{" "}
                                    {selectedSubject.class_section ||
                                        selectedSubject.section ||
                                        ""}
                                </div>
                            </div>

                            <div>
                                <small style={{ color: "#667085" }}>
                                    Academic Year
                                </small>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        marginTop: "4px",
                                    }}
                                >
                                    {selectedSubject.academic_year || "-"}
                                </div>
                            </div>

                            <div>
                                <small style={{ color: "#667085" }}>
                                    Semester
                                </small>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        marginTop: "4px",
                                    }}
                                >
                                    {selectedSubject.semester || "-"}
                                </div>
                            </div>

                            <div>
                                <small style={{ color: "#667085" }}>
                                    Session Status
                                </small>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        marginTop: "4px",
                                        color:
                                            sessionStatus === "ACTIVE"
                                                ? "#16a34a"
                                                : sessionStatus === "CLOSED"
                                                ? "#dc2626"
                                                : "#667085",
                                    }}
                                >
                                    {sessionStatus || "NOT STARTED"}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                    STATISTICS
                ================================================= */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "16px",
                        marginBottom: "20px",
                    }}
                >
                    {[
                        {
                            label: "Total Students",
                            value: total,
                            icon: <FaUsers size={28} />,
                            iconColor: "#4f46e5",
                            sub: "Enrolled students",
                        },
                        {
                            label: "Present",
                            value: present,
                            icon: <FaCheckCircle size={28} />,
                            iconColor: "#16a34a",
                            sub:
                                total > 0
                                    ? `${Math.round(
                                          (present / total) * 100
                                      )}% of class`
                                    : "0% of class",
                        },
                        {
                            label: "Late",
                            value: late,
                            icon: <FaClock size={28} />,
                            iconColor: "#d97706",
                            sub:
                                total > 0
                                    ? `${Math.round(
                                          (late / total) * 100
                                      )}% of class`
                                    : "0% of class",
                        },
                        {
                            label: "Absent",
                            value: absent,
                            icon: <FaUserTimes size={28} />,
                            iconColor: "#dc2626",
                            sub:
                                total > 0
                                    ? `${Math.round(
                                          (absent / total) * 100
                                      )}% of class`
                                    : "0% of class",
                        },
                        {
                            label: "Attendance %",
                            value: `${percentage}%`,
                            icon: <FaPercentage size={28} />,
                            iconColor: "#7c3aed",
                            sub: "Today's attendance",
                        },
                    ].map((card) => (
                        <div
                            key={card.label}
                            style={{
                                background: "#ffffff",
                                borderRadius: "16px",
                                padding: "20px",
                                boxShadow:
                                    "0 4px 15px rgba(0,0,0,0.06)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            color: "#667085",
                                            fontSize: "14px",
                                        }}
                                    >
                                        {card.label}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "28px",
                                            fontWeight: 700,
                                            marginTop: "6px",
                                            color:
                                                card.label === "Present"
                                                    ? "#16a34a"
                                                    : card.label === "Late"
                                                    ? "#d97706"
                                                    : card.label === "Absent"
                                                    ? "#dc2626"
                                                    : "#172033",
                                        }}
                                    >
                                        {card.value}
                                    </div>

                                    <div
                                        style={{
                                            marginTop: "4px",
                                            fontSize: "12px",
                                            color: "#98a2b3",
                                        }}
                                    >
                                        {card.sub}
                                    </div>
                                </div>

                                <span style={{ color: card.iconColor }}>
                                    {card.icon}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
<div
    style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
    }}
>
    <h3 style={{ marginBottom: "15px" }}>
        Live Session Monitor
    </h3>

    <div
        style={{
            display: "grid",
            gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
            gap: "15px",
        }}
    >
        <div>
            <small>Session ID</small>
            <div style={{ fontWeight: 700 }}>
                {sessionId || "-"}
            </div>
        </div>

        <div>
            <small>Students Scanned</small>
            <div
                style={{
                    fontWeight: 700,
                    color: "#16a34a",
                }}
            >
                {present + late}
            </div>
        </div>

        <div>
            <small>Pending Students</small>
            <div
                style={{
                    fontWeight: 700,
                    color: "#dc2626",
                }}
            >
                {Math.max(
                    total - (present + late),
                    0
                )}
            </div>
        </div>

        <div>
            <small>QR Expires In</small>
            <div
                style={{
                    fontWeight: 700,
                    color: "#4f46e5",
                }}
            >
                {secondsLeft}s
            </div>
        </div>
    </div>
</div>
<div
    style={{
        background: "#ecfdf3",
        border: "1px solid #abefc6",
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "20px",
    }}
>
    <strong>
        Class Attendance Insight
    </strong>

    <p
        style={{
            marginTop: "8px",
            marginBottom: 0,
        }}
    >
        {percentage >= 90
            ? "Excellent attendance today."
            : percentage >= 75
            ? "Good attendance. Few students absent."
            : "Attendance is below expected level."}
    </p>
</div>
                {/* =================================================
                    FINAL SESSION SUMMARY
                ================================================= */}

                {hasFinalStatistics && sessionStatus === "CLOSED" && (
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "16px",
                            padding: "20px",
                            marginBottom: "20px",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                            border: "1px solid #e4e7ec",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "12px",
                                marginBottom: "18px",
                                flexWrap: "wrap",
                            }}
                        >
                            <div>
                                <h3 style={{ margin: 0, color: "#172033" }}>
                                    Final Attendance Summary
                                </h3>
                                <p
                                    style={{
                                        margin: "5px 0 0",
                                        color: "#98a2b3",
                                        fontSize: "13px",
                                    }}
                                >
                                    Final details recorded when the attendance session was closed
                                </p>
                            </div>
                            <span
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "999px",
                                    background: "#ecfdf3",
                                    color: "#067647",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                }}
                            >
                                SESSION CLOSED
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                                gap: "12px",
                            }}
                        >
                            {[
                                { label: "Total Students", value: total },
                                { label: "Present", value: present },
                                { label: "Late", value: late },
                                { label: "Absent", value: absent },
                                { label: "Attendance Rate", value: `${percentage}%` },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    style={{
                                        padding: "14px",
                                        borderRadius: "12px",
                                        background: "#f8fafc",
                                        border: "1px solid #eaecf0",
                                    }}
                                >
                                    <div
                                        style={{
                                            color: "#667085",
                                            fontSize: "12px",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        {item.label}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "22px",
                                            fontWeight: 700,
                                            color: "#172033",
                                        }}
                                    >
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* =================================================
                    DASHBOARD OVERVIEW
                ================================================= */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "minmax(0, 1.35fr) minmax(300px, 1fr)",
                        gap: "20px",
                        marginBottom: "20px",
                    }}
                >
                    {/* ATTENDANCE CHART */}

                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "16px",
                            padding: "20px",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "20px",
                            }}
                        >
                            <FaChartBar style={{ color: "#4f46e5" }} />
                            <div>
                                <h3 style={{ margin: 0, color: "#172033" }}>
                                    Attendance Chart
                                </h3>
                                <p style={{ margin: "5px 0 0", color: "#98a2b3", fontSize: "13px" }}>
                                    Current class attendance distribution
                                </p>
                            </div>
                        </div>

                        <div
                            style={{
                                height: "180px",
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "space-around",
                                gap: "18px",
                                padding: "10px 8px 0",
                                borderBottom: "1px solid #eaecf0",
                            }}
                        >
                            {[
                                { label: "Present", value: present, color: "#16a34a" },
                                { label: "Late", value: late, color: "#d97706" },
                                { label: "Absent", value: absent, color: "#dc2626" },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    style={{
                                        flex: 1,
                                        maxWidth: "90px",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                    }}
                                >
                                    <strong style={{ marginBottom: "6px", color: "#172033" }}>
                                        {item.value}
                                    </strong>
                                    <div
                                        style={{
                                            width: "52px",
                                            height: `${Math.max((item.value / chartMax) * 125, item.value > 0 ? 8 : 2)}px`,
                                            background: item.color,
                                            borderRadius: "8px 8px 2px 2px",
                                            transition: "height 0.3s ease",
                                        }}
                                    />
                                    <span style={{ marginTop: "8px", fontSize: "12px", color: "#667085", fontWeight: 600 }}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LIVE SESSION STATUS */}

<div
    style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "20px",
        boxShadow:
            "0 4px 15px rgba(0,0,0,0.06)",
    }}
>
    <div
        style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
        }}
    >
        <div>
            <h3
                style={{
                    margin: 0,
                    color: "#172033",
                }}
            >
                Live Session Status
            </h3>

            <p
                style={{
                    margin: "5px 0 0",
                    color: "#98a2b3",
                    fontSize: "13px",
                }}
            >
                Real-time attendance monitoring
            </p>
        </div>

        <div
            style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background:
                    isSessionActive
                        ? "#16a34a"
                        : "#dc2626",
            }}
        />
    </div>

    <div
        style={{
            display: "grid",
            gap: "14px",
        }}
    >
        <div
            style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#f8fafc",
            }}
        >
            <div
                style={{
                    fontSize: "12px",
                    color: "#667085",
                }}
            >
                Session Status
            </div>

            <div
                style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    marginTop: "4px",
                    color:
                        isSessionActive
                            ? "#16a34a"
                            : "#dc2626",
                }}
            >
                {sessionStatus || "NOT STARTED"}
            </div>
        </div>

        <div
            style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#f8fafc",
            }}
        >
            <div
                style={{
                    fontSize: "12px",
                    color: "#667085",
                }}
            >
                QR Countdown
            </div>

            <div
                style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#4f46e5",
                    marginTop: "4px",
                }}
            >
                {isSessionActive
                    ? `${secondsLeft}s`
                    : "--"}
            </div>
        </div>

        <div
            style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#f8fafc",
            }}
        >
            <div
                style={{
                    fontSize: "12px",
                    color: "#667085",
                }}
            >
                Records Captured
            </div>

            <div
                style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#172033",
                    marginTop: "4px",
                }}
            >
                {attendanceRecords.length}
            </div>
        </div>

        <div
            style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#f8fafc",
            }}
        >
            <div
                style={{
                    fontSize: "12px",
                    color: "#667085",
                }}
            >
                Last Scan
            </div>

            <div
                style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#172033",
                    marginTop: "4px",
                }}
            >
                {lastAttendanceTime
                    ? formatDateTime(
                          lastAttendanceTime
                      )
                    : "No scans yet"}
            </div>
        </div>
    </div>
</div>
                    {/* RECENT ATTENDANCE - FULL WIDTH */}

                    <div
                        style={{
                            gridColumn: "1 / -1",
                            background: "#ffffff",
                            borderRadius: "16px",
                            padding: "20px",
                            boxShadow:
                                "0 4px 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "18px",
                            }}
                        >
                            <FaHistory
                                style={{ color: "#4f46e5" }}
                            />

                            <div>
                                <h3
                                    style={{
                                        margin: 0,
                                        color: "#172033",
                                    }}
                                >
                                    Recent Attendance
                                </h3>
                                <p
                                    style={{
                                        margin: "5px 0 0",
                                        color: "#98a2b3",
                                        fontSize: "13px",
                                    }}
                                >
                                    Latest student scans
                                </p>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0, 1fr) 130px",
                                gap: "10px",
                                marginBottom: "14px",
                            }}
                        >
                            <input
                                type="text"
                                value={attendanceSearch}
                                onChange={(e) => setAttendanceSearch(e.target.value)}
                                placeholder="Search name or register number..."
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "10px 12px",
                                    border: "1px solid #d0d5dd",
                                    borderRadius: "10px",
                                    outline: "none",
                                    fontSize: "13px",
                                }}
                            />
                            <select
                                value={attendanceFilter}
                                onChange={(e) => setAttendanceFilter(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 8px",
                                    border: "1px solid #d0d5dd",
                                    borderRadius: "10px",
                                    background: "#ffffff",
                                    fontSize: "13px",
                                }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="PRESENT">Present</option>
                                <option value="LATE">Late</option>
                                <option value="ABSENT">Absent</option>
                            </select>
                        </div>

                        {filteredAttendanceRecords.length > 0 ? (
                            filteredAttendanceRecords
                                .slice(0, 8)
                                .map((record, index) => {
                                    const status =
                                        getAttendanceStatus(record);

                                    return (
                                        <div
                                            key={
                                                getAttendanceId(
                                                    record
                                                ) ??
                                                `${index}-${getRegisterNumber(
                                                    record
                                                )}`
                                            }
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent:
                                                    "space-between",
                                                padding: "10px 0",
                                                borderBottom:
                                                    index <
                                                    Math.min(
                                                        filteredAttendanceRecords.length,
                                                        8
                                                    ) -
                                                        1
                                                        ? "1px solid #f2f4f7"
                                                        : "none",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    minWidth: 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        color: "#172033",
                                                        fontSize: "14px",
                                                        whiteSpace:
                                                            "nowrap",
                                                        overflow:
                                                            "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {getStudentName(
                                                        record
                                                    )}
                                                </div>

                                                <div
                                                    style={{
                                                        marginTop: "3px",
                                                        color: "#98a2b3",
                                                        fontSize: "11px",
                                                    }}
                                                >
                                                    {getRegisterNumber(
                                                        record
                                                    )}
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    textAlign: "right",
                                                    marginLeft: "10px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display:
                                                            "inline-block",
                                                        padding:
                                                            "4px 9px",
                                                        borderRadius:
                                                            "999px",
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        background:
                                                            status ===
                                                            "LATE"
                                                                ? "#fffaeb"
                                                                : status ===
                                                                  "ABSENT"
                                                                ? "#fef3f2"
                                                                : "#ecfdf3",
                                                        color:
                                                            status ===
                                                            "LATE"
                                                                ? "#b54708"
                                                                : status ===
                                                                  "ABSENT"
                                                                ? "#b42318"
                                                                : "#067647",
                                                    }}
                                                >
                                                    {status ||
                                                        "PRESENT"}
                                                </span>

                                                <div
                                                    style={{
                                                        marginTop: "4px",
                                                        color: "#98a2b3",
                                                        fontSize: "10px",
                                                    }}
                                                >
                                                    {formatDateTime(
                                                        getAttendanceTimestamp(
                                                            record
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        ) : (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "30px 10px",
                                    color: "#98a2b3",
                                    fontSize: "13px",
                                }}
                            >
                                No attendance records available.
                            </div>
                        )}
                    </div>
                </div>

                {/* =================================================
                    ATTENDANCE ALERT
                ================================================= */}

                <div
                    style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        padding: "20px",
                        marginBottom: "20px",
                        boxShadow:
                            "0 4px 15px rgba(0,0,0,0.06)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <div
                            style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "12px",
                                background:
                                    absent > 0
                                        ? "#fef3f2"
                                        : "#ecfdf3",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <FaUserGraduate
                                style={{
                                    color:
                                        absent > 0
                                            ? "#dc2626"
                                            : "#16a34a",
                                }}
                            />
                        </div>

                        <div>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: "16px",
                                    color: "#172033",
                                }}
                            >
                                Attendance Overview
                            </h3>

                            <p
                                style={{
                                    margin: "4px 0 0",
                                    color: "#667085",
                                    fontSize: "13px",
                                }}
                            >
                                {isSessionActive
                                    ? `${attendanceRecords.length} attendance record${
                                          attendanceRecords.length !== 1
                                              ? "s"
                                              : ""
                                      } received in the active session.`
                                    : absent > 0
                                    ? `${absent} student${
                                          absent !== 1 ? "s" : ""
                                      } currently marked absent.`
                                    : "No attendance concerns in the current statistics."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    SESSION INFORMATION
                ================================================= */}

                <div
                    style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        padding: "20px",
                        boxShadow:
                            "0 4px 15px rgba(0,0,0,0.06)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "18px",
                        }}
                    >
                        <FaClipboardCheck
                            style={{ color: "#4f46e5" }}
                        />

                        <h3
                            style={{
                                margin: 0,
                                color: "#172033",
                            }}
                        >
                            Session Information
                        </h3>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "15px",
                        }}
                    >
                        <div>
                            <small style={{ color: "#667085" }}>
                                Status
                            </small>
                            <div
                                style={{
                                    fontWeight: 700,
                                    marginTop: "4px",
                                    color:
                                        sessionStatus === "ACTIVE"
                                            ? "#16a34a"
                                            : sessionStatus === "CLOSED"
                                            ? "#dc2626"
                                            : "#667085",
                                }}
                            >
                                {sessionStatus || "NOT STARTED"}
                            </div>
                        </div>

                        <div>
                            <small style={{ color: "#667085" }}>
                                QR Refresh
                            </small>
                            <div
                                style={{
                                    fontWeight: 600,
                                    marginTop: "4px",
                                }}
                            >
                                Every 1 second
                            </div>
                        </div>

                        <div>
                            <small style={{ color: "#667085" }}>
                                QR Lifetime
                            </small>
                            <div
                                style={{
                                    fontWeight: 600,
                                    marginTop: "4px",
                                }}
                            >
                                15 seconds
                            </div>
                        </div>

                        <div>
                            <small style={{ color: "#667085" }}>
                                Live Attendance
                            </small>
                            <div
                                style={{
                                    fontWeight: 600,
                                    marginTop: "4px",
                                }}
                            >
                                Every 1 second
                            </div>
                        </div>

                        <div>
                            <small style={{ color: "#667085" }}>
                                Records Loaded
                            </small>
                            <div
                                style={{
                                    fontWeight: 600,
                                    marginTop: "4px",
                                }}
                            >
                                {attendanceRecords.length}
                            </div>
                        </div>

                        <div>
                            <small style={{ color: "#667085" }}>
                                QR Countdown
                            </small>
                            <div
                                style={{
                                    fontWeight: 600,
                                    marginTop: "4px",
                                }}
                            >
                                {isSessionActive
                                    ? `${secondsLeft}s`
                                    : "Inactive"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================
                RESPONSIVE CSS
            ================================================= */}

            <style>
                {`
                    @media (max-width: 900px) {
                        div[style*="minmax(0, 1.35fr)"] {
                            grid-template-columns: 1fr !important;
                        }
                    }

                    @media (max-width: 600px) {
                        body {
                            margin: 0;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default StaffDashboard;