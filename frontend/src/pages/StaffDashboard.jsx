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
        console.error("Unable to parse logged-in user:", error);
    }

    // =================================================
    // SUBJECT / CLASS
    // =================================================

    const [subjects, setSubjects] = useState([]);
    const [selectedAllocationId, setSelectedAllocationId] = useState("");

    // =================================================
    // ATTENDANCE SESSION
    // =================================================

    const [sessionId, setSessionId] = useState(null);
    const [sessionStatus, setSessionStatus] = useState(null);

    // =================================================
    // QR
    // =================================================

    const [qrImage, setQrImage] = useState("");
    const [qrExpiresAt, setQrExpiresAt] = useState(null);

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
    // LOADING
    // =================================================

    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingSession, setLoadingSession] = useState(false);
    const [loadingQR, setLoadingQR] = useState(false);

    // =================================================
    // MESSAGE
    // =================================================

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // =================================================
    // COUNTDOWN
    // =================================================

    const [secondsLeft, setSecondsLeft] = useState(0);

    // =================================================
    // REFS
    // =================================================

    const qrTimerRef = useRef(null);
    const countTimerRef = useRef(null);
    const countdownTimerRef = useRef(null);
    const activeSessionTimerRef = useRef(null);

    const attendanceRequestRef = useRef(false);
    const activeSessionRequestRef = useRef(false);

    // Used to prevent an older QR request from overwriting
    // a newer QR response.
    const qrRequestRef = useRef(0);

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

    const extractAttendanceRecords = useCallback((data) => {
        if (Array.isArray(data)) {
            return data;
        }

        if (!data || typeof data !== "object") {
            return [];
        }

        if (Array.isArray(data.records)) {
            return data.records;
        }

        if (Array.isArray(data.data)) {
            return data.data;
        }

        if (Array.isArray(data.attendance)) {
            return data.attendance;
        }

        if (Array.isArray(data.rows)) {
            return data.rows;
        }

        return [];
    }, []);

    // =================================================
    // APPLY ATTENDANCE STATISTICS
    // =================================================

    const applyAttendanceStatistics = useCallback(
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
            // FALLBACK FROM RECORDS
            // =============================================

            if (records.length > 0) {
                let calculatedPresent = 0;
                let calculatedLate = 0;

                records.forEach((record) => {
                    const status = String(
                        record.status ??
                            record.attendance_status ??
                            ""
                    ).toUpperCase();

                    if (status === "PRESENT") {
                        calculatedPresent += 1;
                    }

                    if (status === "LATE") {
                        calculatedLate += 1;
                    }
                });

                if (
                    presentCount === 0 &&
                    lateCount === 0
                ) {
                    presentCount = calculatedPresent;
                    lateCount = calculatedLate;
                }

                if (totalCount === 0) {
                    totalCount = records.length;
                }
            }

            // =============================================
            // TOTAL
            // =============================================

            if (totalCount < presentCount + lateCount) {
                totalCount = presentCount + lateCount;
            }

            // =============================================
            // ABSENT
            // =============================================

            const attendedCount =
                presentCount + lateCount;

            const absentCount = Math.max(
                totalCount - attendedCount,
                0
            );

            // =============================================
            // PERCENTAGE
            // =============================================

            if (!percentageValue && totalCount > 0) {
                percentageValue =
                    (attendedCount / totalCount) * 100;
            }

            percentageValue = Number(
                Number(percentageValue).toFixed(2)
            );

            setPresent(presentCount);
            setLate(lateCount);
            setAbsent(absentCount);
            setTotal(totalCount);
            setPercentage(percentageValue);
        },
        []
    );

    // =====================================================
    // LOAD STAFF SUBJECTS
    // =====================================================

    const loadSubjects = useCallback(async () => {
        setLoadingSubjects(true);
        setError("");

        try {
            const response = await fetch(
                `${API_BASE}/subject-allocations/staff`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to load subjects."
                );
            }

            const rawSubjects =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data.allocations)
                    ? data.allocations
                    : Array.isArray(data.subjects)
                    ? data.subjects
                    : [];

            const normalizedSubjects =
                rawSubjects.map((item) => ({
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
                }));

            setSubjects(normalizedSubjects);

            // =============================================
            // KEEP CURRENT SELECTION IF AVAILABLE
            // =============================================

            if (selectedAllocationId) {
                const stillExists =
                    normalizedSubjects.some(
                        (item) =>
                            String(item.allocation_id) ===
                            String(selectedAllocationId)
                    );

                if (!stillExists) {
                    setSelectedAllocationId("");
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
            setLoadingSubjects(false);
        }
    }, [getHeaders, selectedAllocationId]);

    // =====================================================
    // LOAD CURRENT QR
    //
    // silent = true:
    //    used during 1-second polling
    //
    // silent = false:
    //    used for initial/manual loading
    // =====================================================

    const loadQR = useCallback(
        async (id, options = {}) => {
            if (!id) {
                return;
            }

            const { silent = false } = options;

            const currentRequest =
                ++qrRequestRef.current;

            try {
                if (!silent) {
                    setLoadingQR(true);
                }

                const response = await fetch(
                    `${API_BASE}/attendance-sessions/${id}/qr`,
                    {
                        method: "GET",
                        headers: getHeaders(),
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Unable to load QR code."
                    );
                }

                // =========================================
                // IGNORE OLD REQUEST
                // =========================================

                if (
                    currentRequest !==
                    qrRequestRef.current
                ) {
                    return;
                }

                // =========================================
                // QR IMAGE
                // =========================================

                const image =
                    data.qr_image ??
                    data.qr_code ??
                    data.qrImage ??
                    data.image ??
                    "";

                // =========================================
                // EXPIRY
                // =========================================

                const expiry =
                    data.qr_expires_at ??
                    data.qrExpiresAt ??
                    data.expires_at ??
                    data.expiresAt ??
                    null;

                setQrImage(image);
                setQrExpiresAt(expiry);

                // =========================================
                // SESSION STATUS
                // =========================================

                if (data.status) {
                    setSessionStatus(
                        String(data.status).toUpperCase()
                    );
                }
            } catch (err) {
                console.error(
                    "QR loading error:",
                    err
                );

                // Do not destroy an already visible QR
                // during silent polling.
                if (!silent) {
                    setError(
                        err.message ||
                            "Unable to load QR code."
                    );
                }
            } finally {
                if (!silent) {
                    setLoadingQR(false);
                }
            }
        },
        [getHeaders]
    );

    // =====================================================
    // LOAD ATTENDANCE COUNT
    // =====================================================

    const loadAttendanceCount = useCallback(
        async (id, options = {}) => {
            if (!id) {
                return;
            }

            const { silent = false } = options;

            if (attendanceRequestRef.current) {
                return;
            }

            attendanceRequestRef.current = true;

            try {
                // =========================================
                // PRIMARY COUNT ENDPOINT
                // =========================================

                let response = await fetch(
                    `${API_BASE}/attendance/session/${id}/count`,
                    {
                        method: "GET",
                        headers: getHeaders(),
                    }
                );

                let data = await response.json();

                // =========================================
                // FALLBACK
                // =========================================

                if (!response.ok) {
                    response = await fetch(
                        `${API_BASE}/attendance/session/${id}`,
                        {
                            method: "GET",
                            headers: getHeaders(),
                        }
                    );

                    data = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                                "Unable to load attendance."
                        );
                    }
                }

                // =========================================
                // EXTRACT RECORDS
                // =========================================

                const records =
                    extractAttendanceRecords(data);

                // =========================================
                // APPLY STATS
                // =========================================

                applyAttendanceStatistics(
                    data,
                    records
                );
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
            } finally {
                attendanceRequestRef.current =
                    false;
            }
        },
        [
            getHeaders,
            extractAttendanceRecords,
            applyAttendanceStatistics,
        ]
    );

    // =====================================================
    // LOAD ACTIVE SESSION
    // =====================================================

    const loadActiveSession = useCallback(
        async (options = {}) => {
            const { silent = false } = options;

            if (activeSessionRequestRef.current) {
                return;
            }

            activeSessionRequestRef.current = true;

            try {
                const response = await fetch(
                    `${API_BASE}/attendance-sessions/active`,
                    {
                        method: "GET",
                        headers: getHeaders(),
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Unable to load active session."
                    );
                }

                // =========================================
                // NORMALIZE RESPONSE
                // =========================================

                const activeSession =
                    data.session ??
                    data.data ??
                    data.active_session ??
                    data.activeSession ??
                    data;

                // =========================================
                // NO ACTIVE SESSION
                // =========================================

                if (
                    !activeSession ||
                    !activeSession.session_id
                ) {
                    setSessionId(null);
                    setSessionStatus(null);
                    setQrImage("");
                    setQrExpiresAt(null);
                    setSecondsLeft(0);

                    return;
                }

                const activeAllocationId =
                    activeSession.allocation_id ??
                    activeSession.subject_allocation_id ??
                    activeSession.allocationId;

                // =========================================
                // IF A SUBJECT IS SELECTED,
                // ONLY SHOW ITS ACTIVE SESSION
                // =========================================

                if (
                    selectedAllocationId &&
                    activeAllocationId &&
                    String(activeAllocationId) !==
                        String(selectedAllocationId)
                ) {
                    return;
                }

                const currentSessionId =
                    activeSession.session_id;

                const currentStatus = String(
                    activeSession.status ??
                        "ACTIVE"
                ).toUpperCase();

                setSessionId(currentSessionId);
                setSessionStatus(currentStatus);

                // =========================================
                // ACTIVE SESSION
                // =========================================

                if (currentStatus === "ACTIVE") {
                    await Promise.all([
                        loadQR(
                            currentSessionId,
                            {
                                silent,
                            }
                        ),
                        loadAttendanceCount(
                            currentSessionId,
                            {
                                silent,
                            }
                        ),
                    ]);
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
            loadAttendanceCount,
        ]
    );

    // =====================================================
    // START ATTENDANCE
    // =====================================================

    const startAttendance = async () => {
        clearMessages();

        if (!selectedAllocationId) {
            setError(
                "Please select a subject/class first."
            );
            return;
        }

        const selectedSubject =
            subjects.find(
                (item) =>
                    String(item.allocation_id) ===
                    String(selectedAllocationId)
            );

        if (!selectedSubject) {
            setError(
                "Selected subject allocation was not found."
            );
            return;
        }

        setLoadingSession(true);

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

            const response = await fetch(
                `${API_BASE}/attendance-sessions`,
                {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify(body),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to start attendance session."
                );
            }

            // =========================================
            // NORMALIZE CREATED SESSION
            // =========================================

            const createdSession =
                data.session ??
                data.data ??
                data;

            const newSessionId =
                createdSession.session_id ??
                data.session_id;

            if (!newSessionId) {
                throw new Error(
                    "Session was created but session ID was not returned."
                );
            }

            // =========================================
            // RESET STATISTICS
            // =========================================

            setPresent(0);
            setLate(0);
            setAbsent(0);
            setTotal(0);
            setPercentage(0);

            setHasFinalStatistics(false);

            setQrImage("");
            setQrExpiresAt(null);
            setSecondsLeft(0);

            setSessionId(newSessionId);
            setSessionStatus("ACTIVE");

            setMessage(
                "Attendance session started successfully."
            );

            // =========================================
            // LOAD FIRST QR
            // =========================================

            await loadQR(newSessionId);

            // =========================================
            // LOAD INITIAL ATTENDANCE
            // =========================================

            await loadAttendanceCount(
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
            setLoadingSession(false);
        }
    };

    // =====================================================
    // CLOSE ATTENDANCE
    // =====================================================

    const closeAttendance = async () => {
        clearMessages();

        if (!sessionId) {
            return;
        }

        const shouldClose = window.confirm(
            "Are you sure you want to close this attendance session?"
        );

        if (!shouldClose) {
            return;
        }

        setLoadingSession(true);

        try {
            // =========================================
            // FIRST GET FINAL STATISTICS
            // =========================================

            await loadAttendanceCount(sessionId);

            const finalPresent = present;
            const finalLate = late;
            const finalAbsent = absent;
            const finalTotal = total;
            const finalPercentage = percentage;

            // =========================================
            // CLOSE SESSION
            // =========================================

            const response = await fetch(
                `${API_BASE}/attendance-sessions/${sessionId}/close`,
                {
                    method: "PATCH",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to close attendance session."
                );
            }

            // =========================================
            // PRESERVE FINAL STATISTICS
            // =========================================

            setPresent(finalPresent);
            setLate(finalLate);
            setAbsent(finalAbsent);
            setTotal(finalTotal);
            setPercentage(finalPercentage);

            setHasFinalStatistics(true);

            setSessionStatus("CLOSED");

            setQrImage("");
            setQrExpiresAt(null);
            setSecondsLeft(0);

            setMessage(
                "Attendance session closed successfully."
            );

            // =========================================
            // VERIFY FINAL DATA
            // =========================================

            try {
                await loadAttendanceCount(
                    sessionId,
                    {
                        silent: true,
                    }
                );
            } catch (verifyError) {
                console.warn(
                    "Final attendance verification failed:",
                    verifyError
                );
            }
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
            setLoadingSession(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    // =====================================================
    // LOAD ACTIVE SESSION AFTER SUBJECT LOAD
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
    //
    // This checks whether another tab/session has started
    // or whether the backend session changed.
    // =====================================================

    useEffect(() => {
        if (activeSessionTimerRef.current) {
            clearInterval(
                activeSessionTimerRef.current
            );
        }

        activeSessionTimerRef.current =
            setInterval(() => {
                loadActiveSession({
                    silent: true,
                });
            }, 5000);

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
    // QR REFRESH
    //
    // IMPORTANT:
    //
    // Every 1 second the staff dashboard asks the backend:
    //
    // GET /attendance-sessions/:id/qr
    //
    // If QR #1 is still valid:
    //     backend returns QR #1
    //
    // If student scanned QR #1:
    //     backend has already generated QR #2
    //     dashboard receives QR #2
    //
    // If nobody scanned QR #1 for 15 seconds:
    //     backend rotates to QR #2
    //     dashboard receives QR #2
    //
    // Therefore no manual refresh is required.
    // =====================================================

    useEffect(() => {
        if (
            !sessionId ||
            sessionStatus !== "ACTIVE"
        ) {
            return;
        }

        // =============================================
        // CLEAR OLD TIMER
        // =============================================

        if (qrTimerRef.current) {
            clearInterval(qrTimerRef.current);
            qrTimerRef.current = null;
        }

        // =============================================
        // INITIAL QR LOAD
        // =============================================

        loadQR(sessionId);

        // =============================================
        // CHECK QR EVERY 1 SECOND
        // =============================================

        qrTimerRef.current = setInterval(() => {
            loadQR(sessionId, {
                silent: true,
            });
        }, 1000);

        return () => {
            if (qrTimerRef.current) {
                clearInterval(
                    qrTimerRef.current
                );

                qrTimerRef.current = null;
            }
        };
    }, [
        sessionId,
        sessionStatus,
        loadQR,
    ]);

    // =====================================================
    // LIVE ATTENDANCE REFRESH
    //
    // Attendance count is refreshed every 2 seconds.
    // =====================================================

    useEffect(() => {
        if (
            !sessionId ||
            sessionStatus !== "ACTIVE"
        ) {
            return;
        }

        if (countTimerRef.current) {
            clearInterval(
                countTimerRef.current
            );
        }

        loadAttendanceCount(sessionId);

        countTimerRef.current =
            setInterval(() => {
                loadAttendanceCount(
                    sessionId,
                    {
                        silent: true,
                    }
                );
            }, 2000);

        return () => {
            if (countTimerRef.current) {
                clearInterval(
                    countTimerRef.current
                );

                countTimerRef.current = null;
            }
        };
    }, [
        sessionId,
        sessionStatus,
        loadAttendanceCount,
    ]);

    // =====================================================
    // QR COUNTDOWN
    //
    // Displays:
    //
    // 15
    // 14
    // 13
    // ...
    // 1
    // 0
    //
    // The backend remains authoritative for actual QR
    // validity. This timer is only the visual countdown.
    // =====================================================

    useEffect(() => {
        if (
            !qrExpiresAt ||
            sessionStatus !== "ACTIVE"
        ) {
            setSecondsLeft(0);
            return;
        }

        if (countdownTimerRef.current) {
            clearInterval(
                countdownTimerRef.current
            );
        }

        const calculateRemaining = () => {
            let expiryTime;

            // =========================================
            // DATE OBJECT
            // =========================================

            if (
                qrExpiresAt instanceof Date
            ) {
                expiryTime =
                    qrExpiresAt.getTime();
            }

            // =========================================
            // STRING
            // =========================================

            else if (
                typeof qrExpiresAt === "string"
            ) {
                let value =
                    qrExpiresAt.trim();

                // =====================================
                // MySQL DATETIME
                // Example:
                // 2026-09-15 18:20:30
                // =====================================

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
                    new Date(value).getTime();
            }

            // =========================================
            // NUMBER
            // =========================================

            else if (
                typeof qrExpiresAt ===
                "number"
            ) {
                expiryTime = qrExpiresAt;
            }

            // =========================================
            // INVALID
            // =========================================

            else {
                expiryTime = NaN;
            }

            if (
                !Number.isFinite(expiryTime)
            ) {
                setSecondsLeft(0);
                return;
            }

            const difference =
                expiryTime -
                Date.now();

            const seconds = Math.max(
                0,
                Math.ceil(
                    difference / 1000
                )
            );

            setSecondsLeft(seconds);
        };

        // =============================================
        // CALCULATE IMMEDIATELY
        // =============================================

        calculateRemaining();

        // =============================================
        // EVERY 1 SECOND
        // =============================================

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
            if (qrTimerRef.current) {
                clearInterval(
                    qrTimerRef.current
                );
            }

            if (countTimerRef.current) {
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
                String(item.allocation_id) ===
                String(selectedAllocationId)
        );

    // =====================================================
    // SESSION ACTIVE
    // =====================================================

    const isSessionActive =
        sessionId &&
        sessionStatus === "ACTIVE";

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
            {/* =================================================
                HEADER
            ================================================= */}

            <div
                style={{
                    maxWidth: "1400px",
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        gap: "20px",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
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
                                margin:
                                    "6px 0 0",
                                color: "#667085",
                            }}
                        >
                            Welcome{" "}
                            {loggedUser?.name ||
                                loggedUser?.full_name ||
                                "Staff"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            clearMessages();
                            loadSubjects();
                            loadActiveSession();
                        }}
                        disabled={
                            loadingSubjects ||
                            loadingSession
                        }
                        style={{
                            border: "none",
                            background:
                                "#ffffff",
                            color: "#344054",
                            padding:
                                "11px 16px",
                            borderRadius:
                                "10px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems:
                                "center",
                            gap: "8px",
                            boxShadow:
                                "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                    >
                        <FaSyncAlt />
                        Refresh
                    </button>
                </div>

                {/* =================================================
                    MESSAGES
                ================================================= */}

                {message && (
                    <div
                        style={{
                            background:
                                "#ecfdf3",
                            border:
                                "1px solid #abefc6",
                            color: "#067647",
                            padding:
                                "12px 16px",
                            borderRadius:
                                "10px",
                            marginBottom:
                                "16px",
                        }}
                    >
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            background:
                                "#fef3f2",
                            border:
                                "1px solid #fecdca",
                            color: "#b42318",
                            padding:
                                "12px 16px",
                            borderRadius:
                                "10px",
                            marginBottom:
                                "16px",
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
                        background:
                            "#ffffff",
                        borderRadius:
                            "16px",
                        padding:
                            "20px",
                        marginBottom:
                            "20px",
                        boxShadow:
                            "0 4px 15px rgba(0,0,0,0.06)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems:
                                "center",
                            gap: "10px",
                            marginBottom:
                                "12px",
                        }}
                    >
                        <FaBook
                            style={{
                                color: "#4f46e5",
                            }}
                        />

                        <h2
                            style={{
                                margin: 0,
                                fontSize:
                                    "18px",
                            }}
                        >
                            Select Subject / Class
                        </h2>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            flexWrap:
                                "wrap",
                        }}
                    >
                        <select
                            value={
                                selectedAllocationId
                            }
                            onChange={(e) => {
                                clearMessages();

                                setSelectedAllocationId(
                                    e.target.value
                                );
                            }}
                            disabled={
                                loadingSubjects ||
                                isSessionActive
                            }
                            style={{
                                flex: 1,
                                minWidth:
                                    "280px",
                                padding:
                                    "12px 14px",
                                border:
                                    "1px solid #d0d5dd",
                                borderRadius:
                                    "10px",
                                background:
                                    "#ffffff",
                                fontSize:
                                    "15px",
                            }}
                        >
                            <option value="">
                                {loadingSubjects
                                    ? "Loading subjects..."
                                    : "Select subject/class"}
                            </option>

                            {subjects.map(
                                (item) => (
                                    <option
                                        key={
                                            item.allocation_id
                                        }
                                        value={
                                            item.allocation_id
                                        }
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
                                )
                            )}
                        </select>

                        {!isSessionActive ? (
                            <button
                                type="button"
                                onClick={
                                    startAttendance
                                }
                                disabled={
                                    loadingSession ||
                                    !selectedAllocationId
                                }
                                style={{
                                    border:
                                        "none",
                                    background:
                                        "#16a34a",
                                    color:
                                        "#ffffff",
                                    padding:
                                        "12px 20px",
                                    borderRadius:
                                        "10px",
                                    cursor:
                                        "pointer",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    gap: "8px",
                                    fontWeight:
                                        600,
                                    minWidth:
                                        "180px",
                                }}
                            >
                                <FaPlay />

                                {loadingSession
                                    ? "Starting..."
                                    : "Start Attendance"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={
                                    closeAttendance
                                }
                                disabled={
                                    loadingSession
                                }
                                style={{
                                    border:
                                        "none",
                                    background:
                                        "#dc2626",
                                    color:
                                        "#ffffff",
                                    padding:
                                        "12px 20px",
                                    borderRadius:
                                        "10px",
                                    cursor:
                                        "pointer",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    gap: "8px",
                                    fontWeight:
                                        600,
                                    minWidth:
                                        "180px",
                                }}
                            >
                                <FaStop />

                                {loadingSession
                                    ? "Closing..."
                                    : "Close Attendance"}
                            </button>
                        )}
                    </div>
                </div>

                {/* =================================================
                    SESSION DETAILS
                ================================================= */}

                {selectedSubject && (
                    <div
                        style={{
                            background:
                                "#ffffff",
                            borderRadius:
                                "16px",
                            padding:
                                "18px 20px",
                            marginBottom:
                                "20px",
                            boxShadow:
                                "0 4px 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "15px",
                            }}
                        >
                            <div>
                                <small
                                    style={{
                                        color:
                                            "#667085",
                                    }}
                                >
                                    Subject
                                </small>

                                <div
                                    style={{
                                        fontWeight:
                                            600,
                                        marginTop:
                                            "4px",
                                    }}
                                >
                                    {selectedSubject.subject_name ||
                                        selectedSubject.subject_code ||
                                        selectedSubject.subject_id}
                                </div>
                            </div>

                            <div>
                                <small
                                    style={{
                                        color:
                                            "#667085",
                                    }}
                                >
                                    Class
                                </small>

                                <div
                                    style={{
                                        fontWeight:
                                            600,
                                        marginTop:
                                            "4px",
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
                                <small
                                    style={{
                                        color:
                                            "#667085",
                                    }}
                                >
                                    Academic Year
                                </small>

                                <div
                                    style={{
                                        fontWeight:
                                            600,
                                        marginTop:
                                            "4px",
                                    }}
                                >
                                    {selectedSubject.academic_year ||
                                        "-"}
                                </div>
                            </div>

                            <div>
                                <small
                                    style={{
                                        color:
                                            "#667085",
                                    }}
                                >
                                    Semester
                                </small>

                                <div
                                    style={{
                                        fontWeight:
                                            600,
                                        marginTop:
                                            "4px",
                                    }}
                                >
                                    {selectedSubject.semester ||
                                        "-"}
                                </div>
                            </div>

                            <div>
                                <small
                                    style={{
                                        color:
                                            "#667085",
                                    }}
                                >
                                    Session Status
                                </small>

                                <div
                                    style={{
                                        fontWeight:
                                            700,
                                        marginTop:
                                            "4px",
                                        color:
                                            sessionStatus ===
                                            "ACTIVE"
                                                ? "#16a34a"
                                                : sessionStatus ===
                                                  "CLOSED"
                                                ? "#dc2626"
                                                : "#667085",
                                    }}
                                >
                                    {sessionStatus ||
                                        "NOT STARTED"}
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
                        marginBottom:
                            "20px",
                    }}
                >
                    {/* TOTAL */}

                    <div
                        style={{
                            background:
                                "#ffffff",
                            borderRadius:
                                "16px",
                            padding:
                                "20px",
                            boxShadow:
                                "0 4px 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        color:
                                            "#667085",
                                        fontSize:
                                            "14px",
                                    }}
                                >
                                    Total Students
                                </div>

                                <div
                                    style={{
                                        fontSize:
                                            "28px",
                                        fontWeight:
                                            700,
                                        marginTop:
                                            "6px",
                                    }}
                                >
                                    {total}
                                </div>
                            </div>

                            <FaUsers
                                size={28}
                                style={{
                                    color:
                                        "#4f46e5",
                                }}
                            />
                        </div>
                    </div>

                    {/* PRESENT */}

                    <div
                        style={{
                            background:
                                "#ffffff",
                            borderRadius:
                                "16px",
                            padding:
                                "20px",
                            boxShadow:
                                "0 4px 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        color:
                                            "#667085",
                                        fontSize:
                                            "14px",
                                    }}
                                >
                                    Present
                                </div>

                                <div
                                    style={{
                                        fontSize:
                                            "28px",
                                        fontWeight:
                                            700,
                                        marginTop:
                                            "6px",
                                        color:
                                            "#16a34a",
                                    }}
                                >
                                    {present}
                                </div>
                            </div>

                            <FaCheckCircle
                                size={28}
                                style={{
                                    color:
                                        "#16a34a",
                                }}
                            />
                        </div>
                    </div>

                    {/* LATE */}

                    <div
                        style={{
                            background:
                                "#ffffff",
                            borderRadius:
                                "16px",
                            padding:
                                "20px",
                            boxShadow:
                                "0 4px 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        color:
                                            "#667085",
                                        fontSize:
                                            "14px",
                                    }}
                                >
                                    Late
                                </div>

                                <div
                                    style={{
                                        fontSize:
                                            "28px",
                                        fontWeight:
                                            700,
                                        marginTop:
                                            "6px",
                                        color:
                                            "#d97706",
                                    }}
                                >
                                    {late}
                                </div>
                            </div>

                            <FaClock
                                size={28}
                                style={{
                                    color:
                                        "#d97706",
                                }}
                            />
                        </div>
                    </div>

                    {/* ABSENT */}

                    <div
                        style={{
                            background:
                                "#ffffff",
                            borderRadius:
                                "16px",
                            padding:
                                "20px",
                            boxShadow:
                                "0 4px 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        color:
                                            "#667085",
                                        fontSize:
                                            "14px",
                                    }}
                                >
                                    Absent
                                </div>

                                <div
                                    style={{
                                        fontSize:
                                            "28px",
                                        fontWeight:
                                            700,
                                        marginTop:
                                            "6px",
                                        color:
                                            "#dc2626",
                                    }}
                                >
                                    {absent}
                                </div>
                            </div>

                            <FaUserTimes
                                size={28}
                                style={{
                                    color:
                                        "#dc2626",
                                }}
                            />
                        </div>
                    </div>

                    {/* PERCENTAGE */}

                    <div
                        style={{
                            background:
                                "#ffffff",
                            borderRadius:
                                "16px",
                            padding:
                                "20px",
                            boxShadow:
                                "0 4px 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        color:
                                            "#667085",
                                        fontSize:
                                            "14px",
                                    }}
                                >
                                    Attendance %
                                </div>

                                <div
                                    style={{
                                        fontSize:
                                            "28px",
                                        fontWeight:
                                            700,
                                        marginTop:
                                            "6px",
                                    }}
                                >
                                    {percentage}%
                                </div>
                            </div>

                            <FaPercentage
                                size={28}
                                style={{
                                    color:
                                        "#7c3aed",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "minmax(320px, 1fr) minmax(320px, 1fr)",
                        gap: "20px",
                    }}
                >
                    {/* =================================================
                        QR SECTION
                    ================================================= */}

                    <div
                        style={{
                            background:
                                "#ffffff",
                            borderRadius:
                                "16px",
                            padding:
                                "24px",
                            boxShadow:
                                "0 4px 15px rgba(0,0,0,0.06)",
                            textAlign:
                                "center",
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "center",
                                alignItems:
                                    "center",
                                gap: "10px",
                                marginBottom:
                                    "8px",
                            }}
                        >
                            <FaQrcode
                                size={22}
                                style={{
                                    color:
                                        "#4f46e5",
                                }}
                            />

                            <h2
                                style={{
                                    margin: 0,
                                    fontSize:
                                        "21px",
                                }}
                            >
                                Attendance QR
                            </h2>
                        </div>

                        <p
                            style={{
                                margin:
                                    "0 0 18px",
                                color:
                                    "#667085",
                            }}
                        >
                            Scan this QR from the
                            student application.
                        </p>

                        {/* =========================================
                            ACTIVE QR
                        ========================================= */}

                        {isSessionActive ? (
                            <>
                                {loadingQR &&
                                !qrImage ? (
                                    <div
                                        style={{
                                            padding:
                                                "70px 20px",
                                            color:
                                                "#667085",
                                        }}
                                    >
                                        Loading QR...
                                    </div>
                                ) : qrImage ? (
                                    <>
                                        <div
                                            style={{
                                                display:
                                                    "inline-flex",
                                                padding:
                                                    "16px",
                                                background:
                                                    "#ffffff",
                                                border:
                                                    "1px solid #e4e7ec",
                                                borderRadius:
                                                    "16px",
                                                position:
                                                    "relative",
                                            }}
                                        >
                                            <img
                                                src={
                                                    qrImage
                                                }
                                                alt="Attendance QR Code"
                                                style={{
                                                    width:
                                                        "280px",
                                                    height:
                                                        "280px",
                                                    objectFit:
                                                        "contain",
                                                    display:
                                                        "block",
                                                }}
                                            />
                                        </div>

                                        {/* =================================
                                            COUNTDOWN
                                        ================================= */}

                                        <div
                                            style={{
                                                marginTop:
                                                    "18px",
                                                display:
                                                    "flex",
                                                justifyContent:
                                                    "center",
                                                alignItems:
                                                    "center",
                                                gap: "10px",
                                            }}
                                        >
                                            <FaClock />

                                            <span
                                                style={{
                                                    fontSize:
                                                        "18px",
                                                    fontWeight:
                                                        700,
                                                    color:
                                                        secondsLeft <=
                                                        5
                                                            ? "#dc2626"
                                                            : "#344054",
                                                }}
                                            >
                                                QR changes in{" "}
                                                {
                                                    secondsLeft
                                                }{" "}
                                                sec
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                marginTop:
                                                    "10px",
                                                color:
                                                    "#667085",
                                                fontSize:
                                                    "13px",
                                            }}
                                        >
                                            QR automatically
                                            refreshes every
                                            second.
                                        </div>

                                        <div
                                            style={{
                                                marginTop:
                                                    "5px",
                                                color:
                                                    "#667085",
                                                fontSize:
                                                    "13px",
                                            }}
                                        >
                                            A successful
                                            student scan
                                            immediately
                                            invalidates the
                                            current QR.
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        style={{
                                            padding:
                                                "70px 20px",
                                            color:
                                                "#b42318",
                                        }}
                                    >
                                        QR code is not
                                        available.
                                    </div>
                                )}
                            </>
                        ) : sessionStatus ===
                          "CLOSED" ? (
                            <div
                                style={{
                                    padding:
                                        "80px 20px",
                                }}
                            >
                                <FaClipboardCheck
                                    size={60}
                                    style={{
                                        color:
                                            "#16a34a",
                                        marginBottom:
                                            "15px",
                                    }}
                                />

                                <h3
                                    style={{
                                        margin:
                                            "0 0 8px",
                                    }}
                                >
                                    Attendance Closed
                                </h3>

                                <p
                                    style={{
                                        color:
                                            "#667085",
                                        margin:
                                            0,
                                    }}
                                >
                                    The attendance
                                    session has been
                                    completed.
                                </p>
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding:
                                        "80px 20px",
                                }}
                            >
                                <FaQrcode
                                    size={60}
                                    style={{
                                        color:
                                            "#98a2b3",
                                        marginBottom:
                                            "15px",
                                    }}
                                />

                                <h3
                                    style={{
                                        margin:
                                            "0 0 8px",
                                    }}
                                >
                                    No Active Session
                                </h3>

                                <p
                                    style={{
                                        color:
                                            "#667085",
                                        margin:
                                            0,
                                    }}
                                >
                                    Select a subject
                                    and start
                                    attendance.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* =================================================
                        ATTENDANCE BREAKDOWN
                    ================================================= */}

                    <div
                        style={{
                            background:
                                "#ffffff",
                            borderRadius:
                                "16px",
                            padding:
                                "24px",
                            boxShadow:
                                "0 4px 15px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: "10px",
                                marginBottom:
                                    "20px",
                            }}
                        >
                            <FaChartBar
                                style={{
                                    color:
                                        "#4f46e5",
                                }}
                            />

                            <h2
                                style={{
                                    margin: 0,
                                    fontSize:
                                        "21px",
                                }}
                            >
                                Attendance Breakdown
                            </h2>
                        </div>

                        {/* PRESENT */}

                        <div
                            style={{
                                marginBottom:
                                    "18px",
                            }}
                        >
                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    marginBottom:
                                        "8px",
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight:
                                            600,
                                    }}
                                >
                                    Present
                                </span>

                                <span>
                                    {present}
                                </span>
                            </div>

                            <div
                                style={{
                                    height:
                                        "10px",
                                    background:
                                        "#e5e7eb",
                                    borderRadius:
                                        "999px",
                                    overflow:
                                        "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width:
                                            total >
                                            0
                                                ? `${Math.min(
                                                      (present /
                                                          total) *
                                                          100,
                                                      100
                                                  )}%`
                                                : "0%",
                                        height:
                                            "100%",
                                        background:
                                            "#16a34a",
                                        borderRadius:
                                            "999px",
                                    }}
                                />
                            </div>
                        </div>

                        {/* LATE */}

                        <div
                            style={{
                                marginBottom:
                                    "18px",
                            }}
                        >
                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    marginBottom:
                                        "8px",
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight:
                                            600,
                                    }}
                                >
                                    Late
                                </span>

                                <span>
                                    {late}
                                </span>
                            </div>

                            <div
                                style={{
                                    height:
                                        "10px",
                                    background:
                                        "#e5e7eb",
                                    borderRadius:
                                        "999px",
                                    overflow:
                                        "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width:
                                            total >
                                            0
                                                ? `${Math.min(
                                                      (late /
                                                          total) *
                                                          100,
                                                      100
                                                  )}%`
                                                : "0%",
                                        height:
                                            "100%",
                                        background:
                                            "#d97706",
                                        borderRadius:
                                            "999px",
                                    }}
                                />
                            </div>
                        </div>

                        {/* ABSENT */}

                        <div
                            style={{
                                marginBottom:
                                    "18px",
                            }}
                        >
                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    marginBottom:
                                        "8px",
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight:
                                            600,
                                    }}
                                >
                                    Absent
                                </span>

                                <span>
                                    {absent}
                                </span>
                            </div>

                            <div
                                style={{
                                    height:
                                        "10px",
                                    background:
                                        "#e5e7eb",
                                    borderRadius:
                                        "999px",
                                    overflow:
                                        "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width:
                                            total >
                                            0
                                                ? `${Math.min(
                                                      (absent /
                                                          total) *
                                                          100,
                                                      100
                                                  )}%`
                                                : "0%",
                                        height:
                                            "100%",
                                        background:
                                            "#dc2626",
                                        borderRadius:
                                            "999px",
                                    }}
                                />
                            </div>
                        </div>

                        {/* TOTAL */}

                        <div
                            style={{
                                borderTop:
                                    "1px solid #eaecf0",
                                paddingTop:
                                    "18px",
                                marginTop:
                                    "20px",
                            }}
                        >
                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    marginBottom:
                                        "10px",
                                }}
                            >
                                <span>
                                    Attendance
                                    Percentage
                                </span>

                                <strong>
                                    {
                                        percentage
                                    }
                                    %
                                </strong>
                            </div>

                            <div
                                style={{
                                    height:
                                        "14px",
                                    background:
                                        "#e5e7eb",
                                    borderRadius:
                                        "999px",
                                    overflow:
                                        "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${Math.min(
                                            Math.max(
                                                percentage,
                                                0
                                            ),
                                            100
                                        )}%`,
                                        height:
                                            "100%",
                                        background:
                                            "#4f46e5",
                                        borderRadius:
                                            "999px",
                                    }}
                                />
                            </div>
                        </div>

                        {/* FINAL STATUS */}

                        {hasFinalStatistics && (
                            <div
                                style={{
                                    marginTop:
                                        "22px",
                                    padding:
                                        "14px",
                                    borderRadius:
                                        "10px",
                                    background:
                                        "#ecfdf3",
                                    border:
                                        "1px solid #abefc6",
                                    color:
                                        "#067647",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap: "10px",
                                }}
                            >
                                <FaCheckCircle />

                                <span>
                                    Final attendance
                                    statistics
                                    recorded.
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* =================================================
                    QUICK ACTIONS / SESSION INFORMATION
                ================================================= */}

                <div
                    style={{
                        background:
                            "#ffffff",
                        borderRadius:
                            "16px",
                        padding:
                            "20px",
                        marginTop:
                            "20px",
                        boxShadow:
                            "0 4px 15px rgba(0,0,0,0.06)",
                    }}
                >
                    <div
                        style={{
                            display:
                                "flex",
                            alignItems:
                                "center",
                            gap: "10px",
                            marginBottom:
                                "14px",
                        }}
                    >
                        <FaClipboardCheck
                            style={{
                                color:
                                    "#4f46e5",
                            }}
                        />

                        <h3
                            style={{
                                margin: 0,
                            }}
                        >
                            Session Information
                        </h3>
                    </div>

                    <div
                        style={{
                            display:
                                "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "15px",
                        }}
                    >
                        <div>
                            <small
                                style={{
                                    color:
                                        "#667085",
                                }}
                            >
                                Session ID
                            </small>

                            <div
                                style={{
                                    fontWeight:
                                        600,
                                    marginTop:
                                        "4px",
                                }}
                            >
                                {sessionId ||
                                    "-"}
                            </div>
                        </div>

                        <div>
                            <small
                                style={{
                                    color:
                                        "#667085",
                                }}
                            >
                                Status
                            </small>

                            <div
                                style={{
                                    fontWeight:
                                        700,
                                    marginTop:
                                        "4px",
                                    color:
                                        sessionStatus ===
                                        "ACTIVE"
                                            ? "#16a34a"
                                            : sessionStatus ===
                                              "CLOSED"
                                            ? "#dc2626"
                                            : "#667085",
                                }}
                            >
                                {sessionStatus ||
                                    "NOT STARTED"}
                            </div>
                        </div>

                        <div>
                            <small
                                style={{
                                    color:
                                        "#667085",
                                }}
                            >
                                QR Refresh
                            </small>

                            <div
                                style={{
                                    fontWeight:
                                        600,
                                    marginTop:
                                        "4px",
                                }}
                            >
                                Every 1 second
                            </div>
                        </div>

                        <div>
                            <small
                                style={{
                                    color:
                                        "#667085",
                                }}
                            >
                                QR Lifetime
                            </small>

                            <div
                                style={{
                                    fontWeight:
                                        600,
                                    marginTop:
                                        "4px",
                                }}
                            >
                                15 seconds
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
                        div[style*="grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr)"] {
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