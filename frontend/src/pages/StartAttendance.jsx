import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    FaQrcode,
    FaCheckCircle,
    FaExclamationTriangle,
    FaBook,
    FaClock,
    FaRedo,
    FaStop,
    FaPlay,
    FaUsers,
    FaSyncAlt,
    FaUserGraduate,
    FaIdCard,
    FaChalkboardTeacher,
    FaCalendarAlt,
    FaHourglassHalf,
} from "react-icons/fa";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_URL =
    "https://attendance-management-system-gpci.onrender.com/api";

// =====================================================
// QR CONFIGURATION
// =====================================================

const QR_EXPIRY_SECONDS = 15;

const QR_POLL_INTERVAL = 1000;

const QR_EXPIRY_REFRESH_DELAY = 250;

// Attendance information is checked every second.
// This makes the latest student scan appear quickly.
const ATTENDANCE_POLL_INTERVAL = 1000;


// =====================================================
// COMPONENT
// =====================================================

export default function StartAttendance() {

    // =================================================
    // STATE
    // =================================================

    const [subjects, setSubjects] = useState([]);

    const [selectedAllocation, setSelectedAllocation] =
        useState("");

    const [session, setSession] = useState(null);

    const [qrImage, setQrImage] = useState("");

    const [qrToken, setQrToken] = useState("");

    const [timeLeft, setTimeLeft] =
        useState(QR_EXPIRY_SECONDS);

    const [loadingSubjects, setLoadingSubjects] =
        useState(true);

    const [starting, setStarting] =
        useState(false);

    const [refreshingQR, setRefreshingQR] =
        useState(false);

    const [closing, setClosing] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    // =================================================
    // ATTENDANCE STATE
    // =================================================

    const [attendanceRecords, setAttendanceRecords] =
        useState([]);

    const [latestAttendance, setLatestAttendance] =
        useState(null);

    const [attendanceLoading, setAttendanceLoading] =
        useState(false);

    const [attendanceStats, setAttendanceStats] =
        useState({
            total: 0,
            present: 0,
            late: 0,
            absent: 0,
            percentage: 0,
        });


    // =================================================
    // REFS
    // =================================================

    const mountedRef =
        useRef(true);

    const initialLoadStarted =
        useRef(false);

    const refreshInProgress =
        useRef(false);

    const startingRef =
        useRef(false);

    const closingRef =
        useRef(false);

    const sessionRef =
        useRef(null);

    const qrTokenRef =
        useRef("");

    const qrExpiryRef =
        useRef(null);

    const localQRExpiryRef =
        useRef(null);

    const qrRefreshTimerRef =
        useRef(null);

    const qrPollingTimerRef =
        useRef(null);

    const countdownTimerRef =
        useRef(null);

    const attendancePollingTimerRef =
        useRef(null);

    const refreshQRRef =
        useRef(null);

    const attendanceRequestInProgress =
        useRef(false);

    const latestAttendanceIdRef =
        useRef(null);


    // =================================================
    // AUTH TOKEN
    // =================================================

    const getAuthToken = () => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("accessToken") ||
            ""
        );
    };


    // =================================================
    // TIMER CLEANUP
    // =================================================

    const clearQRRefreshTimer =
        useCallback(() => {

            if (qrRefreshTimerRef.current) {

                clearTimeout(
                    qrRefreshTimerRef.current
                );

                qrRefreshTimerRef.current =
                    null;
            }

        }, []);


    const clearQRPolling =
        useCallback(() => {

            if (qrPollingTimerRef.current) {

                clearInterval(
                    qrPollingTimerRef.current
                );

                qrPollingTimerRef.current =
                    null;
            }

        }, []);


    const clearAttendancePolling =
        useCallback(() => {

            if (
                attendancePollingTimerRef.current
            ) {

                clearInterval(
                    attendancePollingTimerRef.current
                );

                attendancePollingTimerRef.current =
                    null;
            }

        }, []);


    const clearCountdownTimer =
        useCallback(() => {

            if (countdownTimerRef.current) {

                clearInterval(
                    countdownTimerRef.current
                );

                countdownTimerRef.current =
                    null;
            }

        }, []);


    const clearAllQRTimers =
        useCallback(() => {

            clearQRRefreshTimer();

            clearQRPolling();

            clearCountdownTimer();

        }, [
            clearQRRefreshTimer,
            clearQRPolling,
            clearCountdownTimer,
        ]);


    const clearAllTimers =
        useCallback(() => {

            clearQRRefreshTimer();

            clearQRPolling();

            clearAttendancePolling();

            clearCountdownTimer();

        }, [
            clearQRRefreshTimer,
            clearQRPolling,
            clearAttendancePolling,
            clearCountdownTimer,
        ]);


    // =================================================
    // RESPONSE PARSER
    // =================================================

    const getResponseData = async (
        response
    ) => {

        const text =
            await response.text();

        if (!text) {
            return {};
        }

        try {

            return JSON.parse(text);

        } catch (error) {

            throw new Error(
                text ||
                    `Server returned invalid response (${response.status})`
            );
        }
    };


    // =================================================
    // ERROR MESSAGE
    // =================================================

    const getErrorMessage = (
        data,
        fallback
    ) => {

        if (!data) {
            return fallback;
        }

        if (
            typeof data ===
            "string"
        ) {

            return data;
        }

        return (
            data.message ||
            data.error ||
            data.msg ||
            data.details ||
            data?.data?.message ||
            data?.data?.error ||
            fallback
        );
    };


    // =================================================
    // EXTRACT SESSION
    // =================================================

    const extractSession = (
        data
    ) => {

        if (!data) {
            return null;
        }

        if (data.session) {
            return data.session;
        }

        if (data.data?.session) {
            return data.data.session;
        }

        if (
            data.session_id ||
            data.data?.session_id
        ) {

            return (
                data.data ||
                data
            );
        }

        return null;
    };


    // =================================================
    // EXTRACT QR IMAGE
    // =================================================

    const extractQRImage = (
        data
    ) => {

        if (!data) {
            return "";
        }

        const values = [
            data.qr_image,
            data.qr_code,
            data.qrImage,
            data.qr,
            data.qrData,
            data.qr_data,
        ];

        for (
            const value of values
        ) {

            if (
                typeof value === "string" &&
                value.trim()
            ) {

                return value;
            }
        }

        if (data.data) {

            const nested =
                extractQRImage(
                    data.data
                );

            if (nested) {
                return nested;
            }
        }

        if (data.session) {

            const nested =
                extractQRImage(
                    data.session
                );

            if (nested) {
                return nested;
            }
        }

        return "";
    };


    // =================================================
    // EXTRACT QR TOKEN
    // =================================================

    const extractQRToken = (
        data
    ) => {

        if (!data) {
            return "";
        }

        const values = [
            data.qr_token,
            data.qrToken,
            data.token,
            data.qr_token_value,
        ];

        for (
            const value of values
        ) {

            if (
                typeof value === "string" &&
                value.trim()
            ) {

                return value.trim();
            }
        }

        if (data.data) {

            const nested =
                extractQRToken(
                    data.data
                );

            if (nested) {
                return nested;
            }
        }

        if (data.session) {

            const nested =
                extractQRToken(
                    data.session
                );

            if (nested) {
                return nested;
            }
        }

        return "";
    };


    // =================================================
    // EXTRACT QR EXPIRY
    // =================================================

    const extractQRExpiry = (
        data
    ) => {

        if (!data) {
            return null;
        }

        const values = [
            data.qr_expires_at,
            data.expires_at,
            data.qrExpiresAt,
        ];

        for (
            const value of values
        ) {

            if (value) {
                return value;
            }
        }

        if (data.data) {

            const nested =
                extractQRExpiry(
                    data.data
                );

            if (nested) {
                return nested;
            }
        }

        if (data.session) {

            const nested =
                extractQRExpiry(
                    data.session
                );

            if (nested) {
                return nested;
            }
        }

        return null;
    };


    // =================================================
    // DATE PARSER
    // =================================================

    const parseDateTime = (
        value
    ) => {

        if (!value) {
            return null;
        }

        if (
            value instanceof Date
        ) {

            return value;
        }

        if (
            typeof value !==
            "string"
        ) {

            return null;
        }

        const trimmed =
            value.trim();

        if (!trimmed) {
            return null;
        }

        const mysqlMatch =
            trimmed.match(
                /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
            );

        if (mysqlMatch) {

            const [
                ,
                year,
                month,
                day,
                hours,
                minutes,
                seconds,
            ] = mysqlMatch;

            return new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hours),
                Number(minutes),
                Number(seconds),
                0
            );
        }

        const parsed =
            new Date(trimmed);

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return null;
        }

        return parsed;
    };


    // =================================================
    // FORMAT DATE
    // =================================================

    const formatDateTime = (
        value
    ) => {

        if (!value) {
            return "—";
        }

        const parsed =
            parseDateTime(value);

        if (!parsed) {
            return String(value);
        }

        return parsed.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            }
        );
    };


    const formatDateOnly = (
        value
    ) => {

        if (!value) {
            return "—";
        }

        const parsed =
            parseDateTime(value);

        if (!parsed) {
            return String(value);
        }

        return parsed.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    const formatTimeOnly = (
        value
    ) => {

        if (!value) {
            return "—";
        }

        const parsed =
            parseDateTime(value);

        if (!parsed) {
            return String(value);
        }

        return parsed.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            }
        );
    };


    // =================================================
    // START COUNTDOWN
    // =================================================

    const startCountdown =
        useCallback(
            (
                expiresAt,
                resetTo15 = false
            ) => {

                clearCountdownTimer();

                if (resetTo15) {

                    localQRExpiryRef.current =
                        Date.now() +
                        QR_EXPIRY_SECONDS *
                            1000;

                } else {

                    const parsed =
                        parseDateTime(
                            expiresAt
                        );

                    if (parsed) {

                        localQRExpiryRef.current =
                            parsed.getTime();

                    } else {

                        localQRExpiryRef.current =
                            Date.now() +
                            QR_EXPIRY_SECONDS *
                                1000;
                    }
                }

                const updateCountdown =
                    () => {

                        if (
                            !mountedRef.current
                        ) {
                            return;
                        }

                        if (
                            !localQRExpiryRef.current
                        ) {

                            setTimeLeft(
                                QR_EXPIRY_SECONDS
                            );

                            return;
                        }

                        const remaining =
                            Math.ceil(
                                (
                                    localQRExpiryRef
                                        .current -
                                    Date.now()
                                ) /
                                    1000
                            );

                        const safeRemaining =
                            Math.max(
                                0,
                                Math.min(
                                    QR_EXPIRY_SECONDS,
                                    remaining
                                )
                            );

                        setTimeLeft(
                            safeRemaining
                        );

                        if (
                            safeRemaining <= 0
                        ) {

                            clearCountdownTimer();
                        }
                    };

                updateCountdown();

                countdownTimerRef.current =
                    setInterval(
                        updateCountdown,
                        250
                    );
            },
            [
                clearCountdownTimer,
            ]
        );


    // =================================================
    // SCHEDULE QR EXPIRY
    // =================================================

    const scheduleQRRefresh =
        useCallback(
            (
                expiresAt,
                sessionId
            ) => {

                clearQRRefreshTimer();

                if (
                    !expiresAt ||
                    !sessionId
                ) {
                    return;
                }

                const expiryDate =
                    parseDateTime(
                        expiresAt
                    );

                if (!expiryDate) {
                    return;
                }

                const delay =
                    Math.max(
                        0,
                        expiryDate.getTime() -
                            Date.now() +
                            QR_EXPIRY_REFRESH_DELAY
                    );

                qrRefreshTimerRef.current =
                    setTimeout(
                        () => {

                            if (
                                !mountedRef.current
                            ) {
                                return;
                            }

                            if (
                                sessionRef.current
                                    ?.session_id !==
                                sessionId
                            ) {
                                return;
                            }

                            if (
                                refreshQRRef.current
                            ) {

                                refreshQRRef.current(
                                    sessionId,
                                    {
                                        force: false,
                                        silent: true,
                                    }
                                );
                            }
                        },
                        delay
                    );
            },
            [
                clearQRRefreshTimer,
            ]
        );


    // =================================================
    // QR POLLING
    // =================================================

    const startQRPolling =
        useCallback(
            (sessionId) => {

                clearQRPolling();

                if (!sessionId) {
                    return;
                }

                qrPollingTimerRef.current =
                    setInterval(
                        () => {

                            if (
                                !mountedRef.current
                            ) {
                                return;
                            }

                            const currentSession =
                                sessionRef.current;

                            if (
                                !currentSession
                            ) {
                                return;
                            }

                            if (
                                currentSession.session_id !==
                                sessionId
                            ) {
                                return;
                            }

                            if (
                                currentSession.status &&
                                String(
                                    currentSession.status
                                ).toUpperCase() !==
                                    "ACTIVE"
                            ) {
                                return;
                            }

                            if (
                                refreshQRRef.current
                            ) {

                                refreshQRRef.current(
                                    sessionId,
                                    {
                                        force: false,
                                        silent: true,
                                    }
                                );
                            }
                        },
                        QR_POLL_INTERVAL
                    );
            },
            [
                clearQRPolling,
            ]
        );


    // =================================================
    // EXTRACT ATTENDANCE RECORDS
    // =================================================

    const extractAttendanceRecords = (
        data
    ) => {

        if (!data) {
            return [];
        }

        if (
            Array.isArray(data)
        ) {

            return data;
        }

        const candidates = [
            data.records,
            data.attendance,
            data.rows,
            data.data,
            data.data?.records,
            data.data?.attendance,
            data.data?.rows,
        ];

        for (
            const candidate of candidates
        ) {

            if (
                Array.isArray(candidate)
            ) {

                return candidate;
            }
        }

        return [];
    };


    // =================================================
    // ATTENDANCE STATISTICS
    // =================================================

    const calculateAttendanceStats = (
        records
    ) => {

        const safeRecords =
            Array.isArray(records)
                ? records
                : [];

        const total =
            safeRecords.length;

        const present =
            safeRecords.filter(
                (item) =>
                    String(
                        item?.status || ""
                    ).toUpperCase() ===
                    "PRESENT"
            ).length;

        const late =
            safeRecords.filter(
                (item) =>
                    String(
                        item?.status || ""
                    ).toUpperCase() ===
                    "LATE"
            ).length;

        const attended =
            present +
            late;

        const percentage =
            total > 0
                ? Math.round(
                      (
                          attended /
                          total
                      ) *
                          100
                  )
                : 0;

        return {
            total,
            present,
            late,
            absent:
                Math.max(
                    0,
                    total - attended
                ),
            percentage,
        };
    };


    // =================================================
    // FIND LATEST ATTENDANCE
    // =================================================

    const findLatestAttendance = (
        records
    ) => {

        if (
            !Array.isArray(records) ||
            records.length === 0
        ) {

            return null;
        }

        const sorted =
            [...records].sort(
                (a, b) => {

                    const aDate =
                        parseDateTime(
                            a?.scanned_at ||
                            a?.attendance_time ||
                            a?.created_at
                        );

                    const bDate =
                        parseDateTime(
                            b?.scanned_at ||
                            b?.attendance_time ||
                            b?.created_at
                        );

                    const aTime =
                        aDate
                            ? aDate.getTime()
                            : 0;

                    const bTime =
                        bDate
                            ? bDate.getTime()
                            : 0;

                    return bTime - aTime;
                }
            );

        return sorted[0];
    };


    // =================================================
    // LOAD ATTENDANCE RECORDS
    //
    // This is the important part for the staff screen.
    //
    // After student scan:
    //
    // Student
    //    ↓
    // Backend INSERT attendance
    //    ↓
    // Staff page polls this endpoint
    //    ↓
    // Latest student information appears
    // =================================================

    const loadAttendanceRecords =
        useCallback(
            async (
                sessionId,
                {
                    silent = true,
                } = {}
            ) => {

                if (!sessionId) {
                    return null;
                }

                if (
                    attendanceRequestInProgress.current
                ) {
                    return null;
                }

                attendanceRequestInProgress.current =
                    true;

                if (
                    !silent &&
                    mountedRef.current
                ) {

                    setAttendanceLoading(
                        true
                    );
                }

                try {

                    const token =
                        getAuthToken();

                    if (!token) {
                        return null;
                    }

                    const response =
                        await fetch(
                            `${API_URL}/attendance/session/${sessionId}`,
                            {
                                method:
                                    "GET",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,

                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    const data =
                        await getResponseData(
                            response
                        );

                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            getErrorMessage(
                                data,
                                `Failed to load attendance (${response.status})`
                            )
                        );
                    }

                    if (
                        !mountedRef.current
                    ) {
                        return null;
                    }

                    const records =
                        extractAttendanceRecords(
                            data
                        );

                    const stats =
                        calculateAttendanceStats(
                            records
                        );

                    setAttendanceRecords(
                        records
                    );

                    setAttendanceStats(
                        stats
                    );

                    const latest =
                        findLatestAttendance(
                            records
                        );

                    if (latest) {

                        latestAttendanceIdRef.current =
                            latest.attendance_id;

                        setLatestAttendance(
                            latest
                        );
                    } else {

                        latestAttendanceIdRef.current =
                            null;

                        setLatestAttendance(
                            null
                        );
                    }

                    return {
                        records,
                        stats,
                        latest,
                    };

                } catch (err) {

                    console.error(
                        "Load attendance records error:",
                        err
                    );

                    if (
                        !silent &&
                        mountedRef.current
                    ) {

                        setError(
                            err.message ||
                                "Unable to load attendance records."
                        );
                    }

                    return null;

                } finally {

                    attendanceRequestInProgress.current =
                        false;

                    if (
                        !silent &&
                        mountedRef.current
                    ) {

                        setAttendanceLoading(
                            false
                        );
                    }
                }
            },
            []
        );


    // =================================================
    // START ATTENDANCE POLLING
    // =================================================

    const startAttendancePolling =
        useCallback(
            (sessionId) => {

                clearAttendancePolling();

                if (!sessionId) {
                    return;
                }

                // Immediately load once.
                loadAttendanceRecords(
                    sessionId,
                    {
                        silent: true,
                    }
                );

                attendancePollingTimerRef.current =
                    setInterval(
                        () => {

                            if (
                                !mountedRef.current
                            ) {
                                return;
                            }

                            const currentSession =
                                sessionRef.current;

                            if (
                                !currentSession
                            ) {
                                return;
                            }

                            if (
                                String(
                                    currentSession.status ||
                                    "ACTIVE"
                                ).toUpperCase() !==
                                "ACTIVE"
                            ) {
                                return;
                            }

                            loadAttendanceRecords(
                                sessionId,
                                {
                                    silent: true,
                                }
                            );

                        },
                        ATTENDANCE_POLL_INTERVAL
                    );

            },
            [
                clearAttendancePolling,
                loadAttendanceRecords,
            ]
        );


    // =================================================
    // REFRESH QR
    // =================================================

    const refreshQR =
        useCallback(
            async (
                sessionId,
                {
                    force = false,
                    silent = false,
                } = {}
            ) => {

                if (!sessionId) {
                    return;
                }

                if (
                    refreshInProgress.current
                ) {
                    return;
                }

                refreshInProgress.current =
                    true;

                if (
                    !silent &&
                    mountedRef.current
                ) {

                    setRefreshingQR(
                        true
                    );
                }

                try {

                    const token =
                        getAuthToken();

                    if (!token) {

                        throw new Error(
                            "Authentication token not found. Please login again."
                        );
                    }

                    const endpoint =
                        `${API_URL}/attendance-sessions/${sessionId}/qr` +
                        (
                            force
                                ? "?force=true"
                                : ""
                        );

                    const response =
                        await fetch(
                            endpoint,
                            {
                                method:
                                    "GET",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,

                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    const data =
                        await getResponseData(
                            response
                        );

                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            getErrorMessage(
                                data,
                                `Failed to refresh QR (${response.status})`
                            )
                        );
                    }

                    if (
                        !mountedRef.current
                    ) {
                        return;
                    }

                    const returnedSession =
                        extractSession(
                            data
                        );

                    const returnedQRImage =
                        extractQRImage(
                            data
                        );

                    const returnedQRToken =
                        extractQRToken(
                            data
                        );

                    const returnedQRExpiry =
                        extractQRExpiry(
                            data
                        );


                    // -----------------------------------------
                    // UPDATE SESSION
                    // -----------------------------------------

                    if (
                        returnedSession
                    ) {

                        const mergedSession =
                            {
                                ...(sessionRef.current ||
                                    {}),
                                ...returnedSession,
                            };

                        sessionRef.current =
                            mergedSession;

                        setSession(
                            mergedSession
                        );
                    }


                    // -----------------------------------------
                    // TOKEN COMPARISON
                    // -----------------------------------------

                    const previousToken =
                        qrTokenRef.current;

                    const tokenChanged =
                        Boolean(
                            returnedQRToken &&
                            previousToken &&
                            returnedQRToken !==
                                previousToken
                        );

                    const firstQR =
                        Boolean(
                            returnedQRToken &&
                            !previousToken
                        );


                    // -----------------------------------------
                    // UPDATE TOKEN
                    // -----------------------------------------

                    if (
                        returnedQRToken
                    ) {

                        qrTokenRef.current =
                            returnedQRToken;

                        setQrToken(
                            returnedQRToken
                        );
                    }


                    // -----------------------------------------
                    // UPDATE IMAGE
                    // -----------------------------------------

                    if (
                        returnedQRImage &&
                        (
                            firstQR ||
                            tokenChanged ||
                            force ||
                            !qrImage
                        )
                    ) {

                        setQrImage(
                            returnedQRImage
                        );
                    }


                    // -----------------------------------------
                    // EXPIRY
                    // -----------------------------------------

                    if (
                        returnedQRExpiry
                    ) {

                        qrExpiryRef.current =
                            returnedQRExpiry;

                        if (
                            firstQR ||
                            tokenChanged ||
                            force
                        ) {

                            startCountdown(
                                returnedQRExpiry,
                                true
                            );

                        } else if (
                            !localQRExpiryRef.current
                        ) {

                            startCountdown(
                                returnedQRExpiry,
                                true
                            );
                        }

                        scheduleQRRefresh(
                            returnedQRExpiry,
                            sessionId
                        );
                    }


                    // -----------------------------------------
                    // STUDENT SCANNED
                    //
                    // TOKEN CHANGE means:
                    //
                    // OLD QR
                    //    ↓
                    // Student scan
                    //    ↓
                    // Backend records attendance
                    //    ↓
                    // OLD QR invalidated
                    //    ↓
                    // NEW QR
                    // -----------------------------------------

                    if (
                        tokenChanged
                    ) {

                        setMessage(
                            "Attendance recorded. New QR generated automatically."
                        );

                        setError("");

                        setTimeLeft(
                            QR_EXPIRY_SECONDS
                        );

                        localQRExpiryRef.current =
                            Date.now() +
                            QR_EXPIRY_SECONDS *
                                1000;

                        startCountdown(
                            returnedQRExpiry,
                            true
                        );

                        // Immediately request latest
                        // attendance information.
                        loadAttendanceRecords(
                            sessionId,
                            {
                                silent: true,
                            }
                        );
                    }


                    // -----------------------------------------
                    // FORCE REFRESH
                    // -----------------------------------------

                    if (
                        force &&
                        returnedQRToken
                    ) {

                        setMessage(
                            "New QR code generated successfully."
                        );

                        setError("");

                        setTimeLeft(
                            QR_EXPIRY_SECONDS
                        );

                        localQRExpiryRef.current =
                            Date.now() +
                            QR_EXPIRY_SECONDS *
                                1000;

                        startCountdown(
                            returnedQRExpiry,
                            true
                        );
                    }

                } catch (err) {

                    console.error(
                        "QR refresh error:",
                        err
                    );

                    if (
                        !silent &&
                        mountedRef.current
                    ) {

                        setError(
                            err.message ||
                                "Unable to refresh QR code."
                        );
                    }

                } finally {

                    refreshInProgress.current =
                        false;

                    if (
                        !silent &&
                        mountedRef.current
                    ) {

                        setRefreshingQR(
                            false
                        );
                    }
                }
            },
            [
                qrImage,
                scheduleQRRefresh,
                startCountdown,
                loadAttendanceRecords,
            ]
        );


    // =================================================
    // KEEP LATEST QR FUNCTION
    // =================================================

    useEffect(() => {

        refreshQRRef.current =
            refreshQR;

    }, [
        refreshQR,
    ]);


    // =================================================
    // FETCH SUBJECTS
    // =================================================

    const fetchSubjects =
        useCallback(
            async () => {

                if (
                    !mountedRef.current
                ) {
                    return;
                }

                setLoadingSubjects(
                    true
                );

                setError("");

                try {

                    const token =
                        getAuthToken();

                    if (!token) {

                        throw new Error(
                            "Authentication token not found. Please login again."
                        );
                    }

                    const response =
                        await fetch(
                            `${API_URL}/attendance-sessions/staff-subjects`,
                            {
                                method:
                                    "GET",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,

                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    const data =
                        await getResponseData(
                            response
                        );

                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            getErrorMessage(
                                data,
                                `Failed to load subjects (${response.status})`
                            )
                        );
                    }

                    if (
                        !mountedRef.current
                    ) {
                        return;
                    }

                    let subjectList =
                        [];

                    if (
                        Array.isArray(data)
                    ) {

                        subjectList =
                            data;

                    } else if (
                        Array.isArray(
                            data.data
                        )
                    ) {

                        subjectList =
                            data.data;

                    } else if (
                        Array.isArray(
                            data.subjects
                        )
                    ) {

                        subjectList =
                            data.subjects;

                    } else if (
                        Array.isArray(
                            data.allocations
                        )
                    ) {

                        subjectList =
                            data.allocations;

                    } else if (
                        Array.isArray(
                            data.data?.subjects
                        )
                    ) {

                        subjectList =
                            data.data.subjects;

                    } else if (
                        Array.isArray(
                            data.data?.allocations
                        )
                    ) {

                        subjectList =
                            data.data.allocations;
                    }

                    setSubjects(
                        subjectList
                    );

                    if (
                        subjectList.length ===
                        0
                    ) {

                        setMessage(
                            "No subject/class allocation found."
                        );
                    }

                } catch (err) {

                    console.error(
                        "Fetch subjects error:",
                        err
                    );

                    if (
                        mountedRef.current
                    ) {

                        setError(
                            err.message ||
                                "Unable to load subjects."
                        );
                    }

                } finally {

                    if (
                        mountedRef.current
                    ) {

                        setLoadingSubjects(
                            false
                        );
                    }
                }
            },
            []
        );


    // =================================================
    // FETCH ACTIVE SESSION
    // =================================================

    const fetchActiveSession =
        useCallback(
            async () => {

                try {

                    const token =
                        getAuthToken();

                    if (!token) {
                        return;
                    }

                    const response =
                        await fetch(
                            `${API_URL}/attendance-sessions/active`,
                            {
                                method:
                                    "GET",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,

                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    const data =
                        await getResponseData(
                            response
                        );

                    if (
                        !response.ok
                    ) {

                        if (
                            response.status ===
                                404 ||
                            response.status ===
                                204
                        ) {

                            return;
                        }

                        throw new Error(
                            getErrorMessage(
                                data,
                                `Failed to load active session (${response.status})`
                            )
                        );
                    }

                    if (
                        !mountedRef.current
                    ) {
                        return;
                    }

                    const activeSession =
                        extractSession(
                            data
                        );

                    if (
                        !activeSession
                    ) {
                        return;
                    }

                    const sessionId =
                        activeSession.session_id;

                    if (!sessionId) {
                        return;
                    }

                    sessionRef.current =
                        activeSession;

                    setSession(
                        activeSession
                    );

                    await refreshQR(
                        sessionId,
                        {
                            force: false,
                            silent: false,
                        }
                    );

                    await loadAttendanceRecords(
                        sessionId,
                        {
                            silent: true,
                        }
                    );

                    startQRPolling(
                        sessionId
                    );

                    startAttendancePolling(
                        sessionId
                    );

                } catch (err) {

                    console.error(
                        "Fetch active session error:",
                        err
                    );

                    if (
                        mountedRef.current
                    ) {

                        setError(
                            err.message ||
                                "Unable to load active session."
                        );
                    }
                }
            },
            [
                refreshQR,
                loadAttendanceRecords,
                startQRPolling,
                startAttendancePolling,
            ]
        );


    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {

        mountedRef.current =
            true;

        if (
            initialLoadStarted.current
        ) {
            return;
        }

        initialLoadStarted.current =
            true;

        const load =
            async () => {

                await fetchSubjects();

                await fetchActiveSession();
            };

        load();

        return () => {

            mountedRef.current =
                false;

            clearAllTimers();

            refreshInProgress.current =
                false;

            attendanceRequestInProgress.current =
                false;
        };

    }, [
        fetchSubjects,
        fetchActiveSession,
        clearAllTimers,
    ]);


    // =================================================
    // START ATTENDANCE
    // =================================================

    const startSession =
        async () => {

            if (
                startingRef.current
            ) {
                return;
            }

            if (
                !selectedAllocation
            ) {

                setError(
                    "Please select a subject/class first."
                );

                return;
            }

            startingRef.current =
                true;

            setStarting(true);

            setError("");

            setMessage("");

            try {

                const token =
                    getAuthToken();

                if (!token) {

                    throw new Error(
                        "Authentication token not found. Please login again."
                    );
                }

                const selected =
                    subjects.find(
                        (item) =>
                            String(
                                item?.allocation_id ??
                                item?.subject_allocation_id ??
                                item?.id
                            ) ===
                            String(
                                selectedAllocation
                            )
                    );

                const allocationId =
                    selected?.allocation_id ??
                    selected?.subject_allocation_id ??
                    selectedAllocation;

                const subjectId =
                    selected?.subject_id ??
                    selected?.subject
                        ?.subject_id ??
                    null;

                const body = {
                    allocation_id:
                        Number(
                            allocationId
                        ),
                };

                if (subjectId) {

                    body.subject_id =
                        Number(
                            subjectId
                        );
                }

                console.log(
                    "Starting attendance session:",
                    body
                );

                const response =
                    await fetch(
                        `${API_URL}/attendance-sessions`,
                        {
                            method:
                                "POST",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify(
                                    body
                                ),
                        }
                    );

                const data =
                    await getResponseData(
                        response
                    );

                if (
                    !response.ok
                ) {

                    throw new Error(
                        getErrorMessage(
                            data,
                            `Failed to start attendance (${response.status})`
                        )
                    );
                }

                if (
                    !mountedRef.current
                ) {
                    return;
                }

                const newSession =
                    extractSession(
                        data
                    );

                if (
                    !newSession
                ) {

                    throw new Error(
                        "Attendance session was created but session data was not returned."
                    );
                }

                const sessionId =
                    newSession.session_id;

                if (!sessionId) {

                    throw new Error(
                        "Attendance session ID was not returned."
                    );
                }


                // -----------------------------------------
                // CLEAR OLD QR
                // -----------------------------------------

                clearAllTimers();

                qrTokenRef.current =
                    "";

                qrExpiryRef.current =
                    null;

                localQRExpiryRef.current =
                    null;

                setQrToken("");

                setQrImage("");

                setTimeLeft(
                    QR_EXPIRY_SECONDS
                );


                // -----------------------------------------
                // CLEAR OLD ATTENDANCE
                // -----------------------------------------

                setAttendanceRecords([]);

                setLatestAttendance(
                    null
                );

                latestAttendanceIdRef.current =
                    null;

                setAttendanceStats({
                    total: 0,
                    present: 0,
                    late: 0,
                    absent: 0,
                    percentage: 0,
                });


                // -----------------------------------------
                // SET SESSION
                // -----------------------------------------

                sessionRef.current =
                    newSession;

                setSession(
                    newSession
                );


                // -----------------------------------------
                // QR FROM CREATION RESPONSE
                // -----------------------------------------

                const createdQRImage =
                    extractQRImage(
                        data
                    );

                const createdQRToken =
                    extractQRToken(
                        data
                    );

                const createdQRExpiry =
                    extractQRExpiry(
                        data
                    );


                if (
                    createdQRToken
                ) {

                    qrTokenRef.current =
                        createdQRToken;

                    setQrToken(
                        createdQRToken
                    );
                }


                if (
                    createdQRImage
                ) {

                    setQrImage(
                        createdQRImage
                    );
                }


                if (
                    createdQRExpiry
                ) {

                    qrExpiryRef.current =
                        createdQRExpiry;

                    startCountdown(
                        createdQRExpiry,
                        true
                    );

                    scheduleQRRefresh(
                        createdQRExpiry,
                        sessionId
                    );
                }


                // -----------------------------------------
                // FETCH QR IF NEEDED
                // -----------------------------------------

                if (
                    !createdQRImage ||
                    !createdQRToken ||
                    !createdQRExpiry
                ) {

                    await refreshQR(
                        sessionId,
                        {
                            force: false,
                            silent: false,
                        }
                    );
                }


                // -----------------------------------------
                // START QR MONITORING
                // -----------------------------------------

                startQRPolling(
                    sessionId
                );


                // -----------------------------------------
                // START ATTENDANCE MONITORING
                // -----------------------------------------

                startAttendancePolling(
                    sessionId
                );


                setMessage(
                    "Attendance started. QR code is active for 15 seconds."
                );

            } catch (err) {

                console.error(
                    "Start attendance error:",
                    err
                );

                if (
                    mountedRef.current
                ) {

                    setError(
                        err.message ||
                            "Unable to start attendance."
                    );
                }

            } finally {

                startingRef.current =
                    false;

                if (
                    mountedRef.current
                ) {

                    setStarting(
                        false
                    );
                }
            }
        };


    // =================================================
    // CLOSE ATTENDANCE
    // =================================================

    const closeSession =
        async () => {

            if (
                closingRef.current ||
                !sessionRef.current
                    ?.session_id
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    "Are you sure you want to close this attendance session?"
                );

            if (!confirmed) {
                return;
            }

            closingRef.current =
                true;

            setClosing(true);

            setError("");

            setMessage("");

            try {

                const token =
                    getAuthToken();

                if (!token) {

                    throw new Error(
                        "Authentication token not found. Please login again."
                    );
                }

                const sessionId =
                    sessionRef.current
                        .session_id;


                // -----------------------------------------
                // GET FINAL ATTENDANCE BEFORE CLOSE
                // -----------------------------------------

                const finalAttendance =
                    await loadAttendanceRecords(
                        sessionId,
                        {
                            silent: false,
                        }
                    );


                // -----------------------------------------
                // CLOSE SESSION
                // -----------------------------------------

                const response =
                    await fetch(
                        `${API_URL}/attendance-sessions/${sessionId}/close`,
                        {
                            method:
                                "PATCH",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );

                const data =
                    await getResponseData(
                        response
                    );

                if (
                    !response.ok
                ) {

                    throw new Error(
                        getErrorMessage(
                            data,
                            `Failed to close attendance (${response.status})`
                        )
                    );
                }

                if (
                    !mountedRef.current
                ) {
                    return;
                }


                // -----------------------------------------
                // STOP TIMERS
                // -----------------------------------------

                clearAllTimers();

                refreshInProgress.current =
                    false;

                qrTokenRef.current =
                    "";

                qrExpiryRef.current =
                    null;

                localQRExpiryRef.current =
                    null;


                // -----------------------------------------
                // KEEP FINAL ATTENDANCE INFORMATION
                // -----------------------------------------

                if (
                    finalAttendance
                ) {

                    setAttendanceRecords(
                        finalAttendance.records ||
                            []
                    );

                    setAttendanceStats(
                        finalAttendance.stats ||
                            calculateAttendanceStats(
                                finalAttendance.records ||
                                    []
                            )
                    );

                    if (
                        finalAttendance.latest
                    ) {

                        setLatestAttendance(
                            finalAttendance.latest
                        );
                    }
                }


                // -----------------------------------------
                // CLEAR SESSION
                // -----------------------------------------

                sessionRef.current =
                    null;

                setSession(null);

                setQrImage("");

                setQrToken("");

                setTimeLeft(
                    QR_EXPIRY_SECONDS
                );


                setMessage(
                    "Attendance session closed successfully."
                );

                setError("");

            } catch (err) {

                console.error(
                    "Close attendance error:",
                    err
                );

                if (
                    mountedRef.current
                ) {

                    setError(
                        err.message ||
                            "Unable to close attendance session."
                    );
                }

            } finally {

                closingRef.current =
                    false;

                if (
                    mountedRef.current
                ) {

                    setClosing(
                        false
                    );
                }
            }
        };


    // =================================================
    // MANUAL QR REFRESH
    // =================================================

    const manualRefreshQR =
        async () => {

            const sessionId =
                sessionRef.current
                    ?.session_id;

            if (!sessionId) {
                return;
            }

            setError("");

            setMessage("");

            await refreshQR(
                sessionId,
                {
                    force: true,
                    silent: false,
                }
            );
        };


    // =================================================
    // DISPLAY HELPERS
    // =================================================

    const getSubjectName =
        (item) => {

            return (
                item?.subject_name ||
                item?.subject
                    ?.subject_name ||
                item?.name ||
                (
                    typeof item?.subject ===
                    "string"
                        ? item.subject
                        : ""
                ) ||
                "Subject"
            );
        };


    const getSubjectCode =
        (item) => {

            return (
                item?.subject_code ||
                item?.subject
                    ?.subject_code ||
                item?.code ||
                ""
            );
        };


    const getClassName =
        (item) => {

            return (
                item?.class_name ||
                item?.class
                    ?.class_name ||
                item?.className ||
                item?.class_year ||
                ""
            );
        };


    const getSectionName =
        (item) => {

            return (
                item?.section_name ||
                item?.class_section ||
                item?.section ||
                item?.sectionName ||
                ""
            );
        };


    // =================================================
    // LATEST ATTENDANCE HELPERS
    // =================================================

    const getStudentName =
        (record) => {

            return (
                record?.student_name ||
                record?.name ||
                record?.student?.name ||
                record?.student?.student_name ||
                "Student"
            );
        };


    const getRegisterNumber =
        (record) => {

            return (
                record?.register_number ||
                record?.student_code ||
                record?.student?.register_number ||
                record?.student?.student_code ||
                "—"
            );
        };


    const getStaffName =
        (record) => {

            return (
                record?.staff_name ||
                record?.staff?.name ||
                record?.teacher_name ||
                record?.teacher?.name ||
                session?.staff_name ||
                session?.staff?.name ||
                "Staff"
            );
        };


    const getStaffCode =
        (record) => {

            return (
                record?.staff_code ||
                record?.staff?.staff_code ||
                session?.staff_code ||
                "—"
            );
        };


    const getAttendanceSubject =
        (record) => {

            return (
                record?.subject_name ||
                record?.subject?.subject_name ||
                session?.subject_name ||
                getSubjectName(
                    selectedSubject
                )
            );
        };


    const getAttendanceSubjectCode =
        (record) => {

            return (
                record?.subject_code ||
                record?.subject?.subject_code ||
                session?.subject_code ||
                getSubjectCode(
                    selectedSubject
                )
            );
        };


    const getAttendanceClass =
        (record) => {

            return (
                record?.class_name ||
                record?.class?.class_name ||
                record?.class_year ||
                session?.class_name ||
                getClassName(
                    selectedSubject
                ) ||
                "—"
            );
        };


    const getAttendanceSection =
        (record) => {

            return (
                record?.class_section ||
                record?.section_name ||
                record?.section ||
                record?.class?.section ||
                session?.class_section ||
                getSectionName(
                    selectedSubject
                ) ||
                "—"
            );
        };


    const getAttendanceDate =
        (record) => {

            return (
                record?.scanned_at ||
                record?.attendance_time ||
                record?.created_at ||
                null
            );
        };


    const getAttendanceStatus =
        (record) => {

            return String(
                record?.status ||
                "PRESENT"
            ).toUpperCase();
        };


    const isActive =
        Boolean(session) &&
        (
            !session.status ||
            String(
                session.status
            ).toUpperCase() ===
                "ACTIVE"
        );


    const selectedSubject =
        subjects.find(
            (item) =>
                String(
                    item?.allocation_id ??
                    item?.subject_allocation_id ??
                    item?.id
                ) ===
                String(
                    selectedAllocation
                )
        );


    // =================================================
    // RENDER
    // =================================================

    return (
        <div
            style={{
                maxWidth:
                    "1100px",
                margin:
                    "0 auto",
                padding:
                    "24px",
            }}
        >

            {/* =========================================
                HEADER
            ========================================= */}

            <div
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "12px",
                    marginBottom:
                        "24px",
                }}
            >

                <div
                    style={{
                        width:
                            "48px",
                        height:
                            "48px",
                        borderRadius:
                            "12px",
                        display:
                            "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        background:
                            "rgba(37, 99, 235, 0.12)",
                        color:
                            "#2563eb",
                        fontSize:
                            "22px",
                    }}
                >
                    <FaQrcode />
                </div>

                <div>

                    <h1
                        style={{
                            margin:
                                0,
                            fontSize:
                                "28px",
                            fontWeight:
                                700,
                        }}
                    >
                        Start Attendance
                    </h1>

                    <p
                        style={{
                            margin:
                                "4px 0 0",
                            color:
                                "#64748b",
                        }}
                    >
                        Generate a rotating
                        QR code for student
                        attendance.
                    </p>

                </div>
            </div>


            {/* =========================================
                SUCCESS MESSAGE
            ========================================= */}

            {message && (
                <div
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap:
                            "10px",
                        padding:
                            "14px 16px",
                        marginBottom:
                            "18px",
                        borderRadius:
                            "10px",
                        background:
                            "#ecfdf5",
                        border:
                            "1px solid #a7f3d0",
                        color:
                            "#047857",
                    }}
                >
                    <FaCheckCircle />

                    <span>
                        {message}
                    </span>
                </div>
            )}


            {/* =========================================
                ERROR
            ========================================= */}

            {error && (
                <div
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "flex-start",
                        gap:
                            "10px",
                        padding:
                            "14px 16px",
                        marginBottom:
                            "18px",
                        borderRadius:
                            "10px",
                        background:
                            "#fef2f2",
                        border:
                            "1px solid #fecaca",
                        color:
                            "#b91c1c",
                    }}
                >
                    <FaExclamationTriangle />

                    <span>
                        {error}
                    </span>
                </div>
            )}


            {/* =========================================
                MAIN CONTENT
            ========================================= */}

            <div
                className="start-attendance-grid"
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "minmax(300px, 1fr) minmax(320px, 460px)",
                    gap:
                        "24px",
                    alignItems:
                        "start",
                }}
            >

                {/* =====================================
                    LEFT PANEL
                ===================================== */}

                <div
                    style={{
                        background:
                            "#ffffff",
                        border:
                            "1px solid #e2e8f0",
                        borderRadius:
                            "16px",
                        padding:
                            "24px",
                        boxShadow:
                            "0 4px 18px rgba(15, 23, 42, 0.06)",
                    }}
                >

                    <h2
                        style={{
                            marginTop:
                                0,
                            marginBottom:
                                "20px",
                            fontSize:
                                "20px",
                        }}
                    >
                        Attendance Setup
                    </h2>


                    {/* SUBJECT */}

                    <label
                        style={{
                            display:
                                "block",
                            marginBottom:
                                "8px",
                            fontWeight:
                                600,
                        }}
                    >
                        Subject / Class
                    </label>

                    <select
                        value={
                            selectedAllocation
                        }
                        onChange={(
                            event
                        ) => {

                            setSelectedAllocation(
                                event.target.value
                            );

                            setError("");

                            setMessage("");
                        }}
                        disabled={
                            loadingSubjects ||
                            starting ||
                            isActive
                        }
                        style={{
                            width:
                                "100%",
                            padding:
                                "12px 14px",
                            borderRadius:
                                "10px",
                            border:
                                "1px solid #cbd5e1",
                            background:
                                "#ffffff",
                            fontSize:
                                "15px",
                            outline:
                                "none",
                            marginBottom:
                                "18px",
                        }}
                    >

                        <option value="">
                            {loadingSubjects
                                ? "Loading subjects..."
                                : "Select subject/class"}
                        </option>

                        {subjects.map(
                            (
                                item,
                                index
                            ) => {

                                const id =
                                    item?.allocation_id ??
                                    item?.subject_allocation_id ??
                                    item?.id;

                                return (
                                    <option
                                        key={
                                            id ??
                                            index
                                        }
                                        value={
                                            id
                                        }
                                    >
                                        {
                                            getSubjectName(
                                                item
                                            )
                                        }

                                        {getSubjectCode(
                                            item
                                        )
                                            ? ` (${getSubjectCode(
                                                  item
                                              )})`
                                            : ""}

                                        {getClassName(
                                            item
                                        )
                                            ? ` - ${getClassName(
                                                  item
                                              )}`
                                            : ""}

                                        {getSectionName(
                                            item
                                        )
                                            ? ` / ${getSectionName(
                                                  item
                                              )}`
                                            : ""}
                                    </option>
                                );
                            }
                        )}

                    </select>


                    {/* SELECTED SUBJECT */}

                    {selectedSubject &&
                        !isActive && (
                            <div
                                style={{
                                    padding:
                                        "14px",
                                    marginBottom:
                                        "18px",
                                    borderRadius:
                                        "10px",
                                    background:
                                        "#f8fafc",
                                    border:
                                        "1px solid #e2e8f0",
                                }}
                            >

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        gap:
                                            "10px",
                                        alignItems:
                                            "center",
                                        marginBottom:
                                            "8px",
                                    }}
                                >
                                    <FaBook />

                                    <strong>
                                        {
                                            getSubjectName(
                                                selectedSubject
                                            )
                                        }
                                    </strong>
                                </div>

                                {getSubjectCode(
                                    selectedSubject
                                ) && (
                                    <div
                                        style={{
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "14px",
                                        }}
                                    >
                                        Code:{" "}
                                        {getSubjectCode(
                                            selectedSubject
                                        )}
                                    </div>
                                )}

                                {getClassName(
                                    selectedSubject
                                ) && (
                                    <div
                                        style={{
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "14px",
                                        }}
                                    >
                                        Class:{" "}
                                        {getClassName(
                                            selectedSubject
                                        )}
                                    </div>
                                )}

                            </div>
                        )}


                    {/* ACTIVE SESSION */}

                    {isActive && (
                        <div
                            style={{
                                padding:
                                    "16px",
                                marginBottom:
                                    "18px",
                                borderRadius:
                                    "12px",
                                background:
                                    "#eff6ff",
                                border:
                                    "1px solid #bfdbfe",
                            }}
                        >

                            <div
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap:
                                        "9px",
                                    marginBottom:
                                        "10px",
                                    color:
                                        "#1d4ed8",
                                    fontWeight:
                                        700,
                                }}
                            >
                                <FaCheckCircle />

                                Attendance Active
                            </div>

                            <div
                                style={{
                                    display:
                                        "grid",
                                    gap:
                                        "7px",
                                    fontSize:
                                        "14px",
                                    color:
                                        "#475569",
                                }}
                            >

                                <div>
                                    <strong>
                                        Subject:
                                    </strong>{" "}
                                    {getSubjectName(
                                        session
                                    )}
                                </div>

                                {getSubjectCode(
                                    session
                                ) && (
                                    <div>
                                        <strong>
                                            Code:
                                        </strong>{" "}
                                        {getSubjectCode(
                                            session
                                        )}
                                    </div>
                                )}

                                {getClassName(
                                    session
                                ) && (
                                    <div>
                                        <strong>
                                            Class:
                                        </strong>{" "}
                                        {getClassName(
                                            session
                                        )}
                                    </div>
                                )}

                                {getSectionName(
                                    session
                                ) && (
                                    <div>
                                        <strong>
                                            Section:
                                        </strong>{" "}
                                        {getSectionName(
                                            session
                                        )}
                                    </div>
                                )}

                                {session.session_id && (
                                    <div>
                                        <strong>
                                            Session ID:
                                        </strong>{" "}
                                        {
                                            session.session_id
                                        }
                                    </div>
                                )}

                            </div>
                        </div>
                    )}


                    {/* QR MONITORING */}

                    {isActive && (
                        <div
                            style={{
                                padding:
                                    "16px",
                                marginBottom:
                                    "18px",
                                borderRadius:
                                    "12px",
                                background:
                                    "#f8fafc",
                                border:
                                    "1px solid #e2e8f0",
                            }}
                        >

                            <div
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "space-between",
                                }}
                            >

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        gap:
                                            "9px",
                                    }}
                                >
                                    <FaSyncAlt
                                        style={{
                                            animation:
                                                "spin 1s linear infinite",
                                        }}
                                    />

                                    <strong>
                                        QR Monitoring
                                    </strong>
                                </div>

                                <span
                                    style={{
                                        color:
                                            "#16a34a",
                                        fontWeight:
                                            700,
                                        fontSize:
                                            "13px",
                                    }}
                                >
                                    LIVE
                                </span>

                            </div>

                            <p
                                style={{
                                    margin:
                                        "10px 0 0",
                                    color:
                                        "#64748b",
                                    fontSize:
                                        "13px",
                                    lineHeight:
                                        1.5,
                                }}
                            >
                                When a student
                                successfully
                                scans, the current
                                QR is invalidated
                                and the next QR is
                                displayed
                                automatically.
                            </p>

                        </div>
                    )}


                    {/* BUTTONS */}

                    {!isActive ? (

                        <button
                            type="button"
                            onClick={
                                startSession
                            }
                            disabled={
                                starting ||
                                loadingSubjects ||
                                !selectedAllocation
                            }
                            style={{
                                width:
                                    "100%",
                                border:
                                    "none",
                                borderRadius:
                                    "10px",
                                padding:
                                    "13px 18px",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                gap:
                                    "9px",
                                background:
                                    starting ||
                                    loadingSubjects ||
                                    !selectedAllocation
                                        ? "#94a3b8"
                                        : "#2563eb",
                                color:
                                    "#ffffff",
                                fontWeight:
                                    700,
                                fontSize:
                                    "15px",
                                cursor:
                                    starting ||
                                    loadingSubjects ||
                                    !selectedAllocation
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >
                            <FaPlay />

                            {starting
                                ? "Starting..."
                                : "Start Attendance"}

                        </button>

                    ) : (

                        <div
                            style={{
                                display:
                                    "grid",
                                gap:
                                    "10px",
                            }}
                        >

                            <button
                                type="button"
                                onClick={
                                    manualRefreshQR
                                }
                                disabled={
                                    refreshingQR ||
                                    closing
                                }
                                style={{
                                    width:
                                        "100%",
                                    border:
                                        "1px solid #2563eb",
                                    borderRadius:
                                        "10px",
                                    padding:
                                        "12px 18px",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    gap:
                                        "9px",
                                    background:
                                        "#ffffff",
                                    color:
                                        "#2563eb",
                                    fontWeight:
                                        700,
                                    cursor:
                                        refreshingQR ||
                                        closing
                                            ? "not-allowed"
                                            : "pointer",
                                    opacity:
                                        refreshingQR ||
                                        closing
                                            ? 0.6
                                            : 1,
                                }}
                            >
                                <FaRedo />

                                {refreshingQR
                                    ? "Refreshing..."
                                    : "Generate New QR"}

                            </button>


                            <button
                                type="button"
                                onClick={
                                    closeSession
                                }
                                disabled={
                                    closing ||
                                    refreshingQR
                                }
                                style={{
                                    width:
                                        "100%",
                                    border:
                                        "none",
                                    borderRadius:
                                        "10px",
                                    padding:
                                        "12px 18px",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    gap:
                                        "9px",
                                    background:
                                        closing
                                            ? "#94a3b8"
                                            : "#dc2626",
                                    color:
                                        "#ffffff",
                                    fontWeight:
                                        700,
                                    cursor:
                                        closing ||
                                        refreshingQR
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                <FaStop />

                                {closing
                                    ? "Closing..."
                                    : "Close Attendance"}

                            </button>

                        </div>
                    )}

                </div>


                {/* =====================================
                    RIGHT QR PANEL
                ===================================== */}

                <div
                    style={{
                        background:
                            "#ffffff",
                        border:
                            "1px solid #e2e8f0",
                        borderRadius:
                            "16px",
                        padding:
                            "24px",
                        boxShadow:
                            "0 4px 18px rgba(15, 23, 42, 0.06)",
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
                            gap:
                                "9px",
                            marginBottom:
                                "18px",
                        }}
                    >
                        <FaQrcode />

                        <h2
                            style={{
                                margin:
                                    0,
                                fontSize:
                                    "20px",
                            }}
                        >
                            Attendance QR
                        </h2>
                    </div>


                    {isActive &&
                    qrImage ? (

                        <>
                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "center",
                                    marginBottom:
                                        "18px",
                                }}
                            >

                                <div
                                    style={{
                                        width:
                                            "min(100%, 360px)",
                                        aspectRatio:
                                            "1 / 1",
                                        padding:
                                            "12px",
                                        border:
                                            "1px solid #e2e8f0",
                                        borderRadius:
                                            "14px",
                                        background:
                                            "#ffffff",
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                    }}
                                >

                                    <img
                                        src={
                                            qrImage
                                        }
                                        alt="Attendance QR Code"
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "100%",
                                            objectFit:
                                                "contain",
                                        }}
                                    />

                                </div>

                            </div>


                            {/* COUNTDOWN */}

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "center",
                                    alignItems:
                                        "center",
                                    gap:
                                        "9px",
                                    marginBottom:
                                        "10px",
                                }}
                            >

                                <FaClock />

                                <span
                                    style={{
                                        fontSize:
                                            "28px",
                                        fontWeight:
                                            800,
                                    }}
                                >
                                    {timeLeft}s
                                </span>

                            </div>


                            <div
                                style={{
                                    fontSize:
                                        "14px",
                                    color:
                                        "#64748b",
                                    marginBottom:
                                        "18px",
                                }}
                            >
                                QR changes after
                                a successful
                                scan or when the
                                15-second timer
                                expires.
                            </div>


                            {/* PROGRESS BAR */}

                            <div
                                style={{
                                    height:
                                        "8px",
                                    borderRadius:
                                        "999px",
                                    background:
                                        "#e2e8f0",
                                    overflow:
                                        "hidden",
                                    marginBottom:
                                        "18px",
                                }}
                            >

                                <div
                                    style={{
                                        height:
                                            "100%",
                                        width:
                                            `${Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    (
                                                        timeLeft /
                                                        QR_EXPIRY_SECONDS
                                                    ) *
                                                        100
                                                )
                                            )}%`,
                                        background:
                                            timeLeft <=
                                            5
                                                ? "#dc2626"
                                                : "#2563eb",
                                        transition:
                                            "width 0.25s linear",
                                    }}
                                />

                            </div>


                            <div
                                style={{
                                    padding:
                                        "12px",
                                    borderRadius:
                                        "10px",
                                    background:
                                        "#f0fdf4",
                                    border:
                                        "1px solid #bbf7d0",
                                    color:
                                        "#166534",
                                    fontSize:
                                        "13px",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    gap:
                                        "8px",
                                }}
                            >

                                <FaCheckCircle />

                                Waiting for student
                                scans...

                            </div>


                            <div
                                style={{
                                    marginTop:
                                        "12px",
                                    fontSize:
                                        "11px",
                                    color:
                                        "#94a3b8",
                                }}
                            >
                                QR token active
                            </div>

                        </>

                    ) : isActive ? (

                        <div
                            style={{
                                minHeight:
                                    "360px",
                                display:
                                    "flex",
                                flexDirection:
                                    "column",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                color:
                                    "#64748b",
                                gap:
                                    "14px",
                            }}
                        >

                            <FaQrcode
                                style={{
                                    fontSize:
                                        "64px",
                                    opacity:
                                        0.35,
                                }}
                            />

                            <strong>
                                Loading QR code...
                            </strong>

                            <button
                                type="button"
                                onClick={() =>
                                    refreshQR(
                                        sessionRef
                                            .current
                                            ?.session_id,
                                        {
                                            force:
                                                false,
                                            silent:
                                                false,
                                        }
                                    )
                                }
                                disabled={
                                    refreshingQR
                                }
                                style={{
                                    border:
                                        "1px solid #cbd5e1",
                                    background:
                                        "#ffffff",
                                    borderRadius:
                                        "8px",
                                    padding:
                                        "9px 14px",
                                    cursor:
                                        "pointer",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap:
                                        "7px",
                                }}
                            >
                                <FaRedo />

                                Retry
                            </button>

                        </div>

                    ) : (

                        <div
                            style={{
                                minHeight:
                                    "360px",
                                display:
                                    "flex",
                                flexDirection:
                                    "column",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                color:
                                    "#64748b",
                                gap:
                                    "14px",
                            }}
                        >

                            <FaQrcode
                                style={{
                                    fontSize:
                                        "72px",
                                    opacity:
                                        0.3,
                                }}
                            />

                            <strong>
                                No active
                                attendance
                                session
                            </strong>

                            <span
                                style={{
                                    fontSize:
                                        "14px",
                                    maxWidth:
                                        "300px",
                                    lineHeight:
                                        1.5,
                                }}
                            >
                                Select a
                                subject/class
                                and click
                                "Start
                                Attendance"
                                to generate
                                the QR code.
                            </span>

                        </div>
                    )}

                </div>
            </div>


            {/* =============================================
                LATEST SCAN INFORMATION
            ============================================= */}

            {isActive && (
                <div
                    style={{
                        marginTop:
                            "24px",
                        background:
                            "#ffffff",
                        border:
                            "1px solid #e2e8f0",
                        borderRadius:
                            "16px",
                        padding:
                            "24px",
                        boxShadow:
                            "0 4px 18px rgba(15, 23, 42, 0.05)",
                    }}
                >

                    <div
                        style={{
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "space-between",
                            gap:
                                "12px",
                            marginBottom:
                                "18px",
                        }}
                    >

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap:
                                    "10px",
                            }}
                        >

                            <div
                                style={{
                                    width:
                                        "42px",
                                    height:
                                        "42px",
                                    borderRadius:
                                        "10px",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    background:
                                        "#ecfdf5",
                                    color:
                                        "#059669",
                                }}
                            >
                                <FaUserGraduate />
                            </div>

                            <div>

                                <h2
                                    style={{
                                        margin:
                                            0,
                                        fontSize:
                                            "20px",
                                    }}
                                >
                                    Latest Student Scan
                                </h2>

                                <p
                                    style={{
                                        margin:
                                            "4px 0 0",
                                        color:
                                            "#64748b",
                                        fontSize:
                                            "13px",
                                    }}
                                >
                                    Updates automatically after
                                    every successful scan.
                                </p>

                            </div>

                        </div>

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap:
                                    "7px",
                                color:
                                    "#16a34a",
                                fontSize:
                                    "12px",
                                fontWeight:
                                    700,
                            }}
                        >

                            <FaSyncAlt
                                style={{
                                    animation:
                                        "spin 1s linear infinite",
                                }}
                            />

                            LIVE

                        </div>

                    </div>


                    {!latestAttendance ? (

                        <div
                            style={{
                                padding:
                                    "30px 20px",
                                borderRadius:
                                    "12px",
                                background:
                                    "#f8fafc",
                                border:
                                    "1px dashed #cbd5e1",
                                textAlign:
                                    "center",
                                color:
                                    "#64748b",
                            }}
                        >

                            <FaUserGraduate
                                style={{
                                    fontSize:
                                        "38px",
                                    opacity:
                                        0.35,
                                    marginBottom:
                                        "10px",
                                }}
                            />

                            <div
                                style={{
                                    fontWeight:
                                        700,
                                    marginBottom:
                                        "5px",
                                }}
                            >
                                Waiting for student scan
                            </div>

                            <div
                                style={{
                                    fontSize:
                                        "13px",
                                }}
                            >
                                Student information will appear
                                here immediately after a
                                successful QR scan.
                            </div>

                        </div>

                    ) : (

                        <div>

                            {/* SUCCESS HEADER */}

                            <div
                                style={{
                                    padding:
                                        "14px 16px",
                                    marginBottom:
                                        "18px",
                                    borderRadius:
                                        "10px",
                                    background:
                                        "#ecfdf5",
                                    border:
                                        "1px solid #a7f3d0",
                                    color:
                                        "#047857",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap:
                                        "9px",
                                    fontWeight:
                                        700,
                                }}
                            >

                                <FaCheckCircle />

                                Attendance recorded successfully

                            </div>


                            {/* INFORMATION GRID */}

                            <div
                                className="latest-attendance-grid"
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(0, 1fr))",
                                    gap:
                                        "12px",
                                }}
                            >

                                {/* STUDENT */}

                                <div
                                    style={{
                                        padding:
                                            "15px",
                                        borderRadius:
                                            "11px",
                                        background:
                                            "#f8fafc",
                                        border:
                                            "1px solid #e2e8f0",
                                    }}
                                >

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "8px",
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "12px",
                                            marginBottom:
                                                "7px",
                                        }}
                                    >

                                        <FaUserGraduate />

                                        STUDENT

                                    </div>

                                    <strong
                                        style={{
                                            fontSize:
                                                "16px",
                                        }}
                                    >
                                        {
                                            getStudentName(
                                                latestAttendance
                                            )
                                        }
                                    </strong>

                                </div>


                                {/* REGISTER NUMBER */}

                                <div
                                    style={{
                                        padding:
                                            "15px",
                                        borderRadius:
                                            "11px",
                                        background:
                                            "#f8fafc",
                                        border:
                                            "1px solid #e2e8f0",
                                    }}
                                >

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "8px",
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "12px",
                                            marginBottom:
                                                "7px",
                                        }}
                                    >

                                        <FaIdCard />

                                        REGISTER NUMBER

                                    </div>

                                    <strong
                                        style={{
                                            fontSize:
                                                "16px",
                                        }}
                                    >
                                        {
                                            getRegisterNumber(
                                                latestAttendance
                                            )
                                        }
                                    </strong>

                                </div>


                                {/* STAFF */}

                                <div
                                    style={{
                                        padding:
                                            "15px",
                                        borderRadius:
                                            "11px",
                                        background:
                                            "#f8fafc",
                                        border:
                                            "1px solid #e2e8f0",
                                    }}
                                >

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "8px",
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "12px",
                                            marginBottom:
                                                "7px",
                                        }}
                                    >

                                        <FaChalkboardTeacher />

                                        STAFF

                                    </div>

                                    <strong
                                        style={{
                                            fontSize:
                                                "15px",
                                        }}
                                    >
                                        {
                                            getStaffName(
                                                latestAttendance
                                            )
                                        }
                                    </strong>

                                    <div
                                        style={{
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "12px",
                                            marginTop:
                                                "4px",
                                        }}
                                    >
                                        Code:{" "}
                                        {
                                            getStaffCode(
                                                latestAttendance
                                            )
                                        }
                                    </div>

                                </div>


                                {/* SUBJECT */}

                                <div
                                    style={{
                                        padding:
                                            "15px",
                                        borderRadius:
                                            "11px",
                                        background:
                                            "#f8fafc",
                                        border:
                                            "1px solid #e2e8f0",
                                    }}
                                >

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "8px",
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "12px",
                                            marginBottom:
                                                "7px",
                                        }}
                                    >

                                        <FaBook />

                                        SUBJECT

                                    </div>

                                    <strong
                                        style={{
                                            fontSize:
                                                "15px",
                                        }}
                                    >
                                        {
                                            getAttendanceSubject(
                                                latestAttendance
                                            )
                                        }
                                    </strong>

                                    <div
                                        style={{
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "12px",
                                            marginTop:
                                                "4px",
                                        }}
                                    >
                                        Code:{" "}
                                        {
                                            getAttendanceSubjectCode(
                                                latestAttendance
                                            ) ||
                                            "—"
                                        }
                                    </div>

                                </div>


                                {/* CLASS */}

                                <div
                                    style={{
                                        padding:
                                            "15px",
                                        borderRadius:
                                            "11px",
                                        background:
                                            "#f8fafc",
                                        border:
                                            "1px solid #e2e8f0",
                                    }}
                                >

                                    <div
                                        style={{
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "12px",
                                            marginBottom:
                                                "7px",
                                        }}
                                    >
                                        CLASS
                                    </div>

                                    <strong
                                        style={{
                                            fontSize:
                                                "15px",
                                        }}
                                    >
                                        {
                                            getAttendanceClass(
                                                latestAttendance
                                            )
                                        }
                                    </strong>

                                    <div
                                        style={{
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "12px",
                                            marginTop:
                                                "4px",
                                        }}
                                    >
                                        Section:{" "}
                                        {
                                            getAttendanceSection(
                                                latestAttendance
                                            )
                                        }
                                    </div>

                                </div>


                                {/* DATE */}

                                <div
                                    style={{
                                        padding:
                                            "15px",
                                        borderRadius:
                                            "11px",
                                        background:
                                            "#f8fafc",
                                        border:
                                            "1px solid #e2e8f0",
                                    }}
                                >

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "8px",
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "12px",
                                            marginBottom:
                                                "7px",
                                        }}
                                    >

                                        <FaCalendarAlt />

                                        DATE

                                    </div>

                                    <strong
                                        style={{
                                            fontSize:
                                                "15px",
                                        }}
                                    >
                                        {
                                            formatDateOnly(
                                                getAttendanceDate(
                                                    latestAttendance
                                                )
                                            )
                                        }
                                    </strong>

                                </div>


                                {/* SCAN TIME */}

                                <div
                                    style={{
                                        padding:
                                            "15px",
                                        borderRadius:
                                            "11px",
                                        background:
                                            "#f8fafc",
                                        border:
                                            "1px solid #e2e8f0",
                                    }}
                                >

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "8px",
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "12px",
                                            marginBottom:
                                                "7px",
                                        }}
                                    >

                                        <FaClock />

                                        SCAN TIME

                                    </div>

                                    <strong
                                        style={{
                                            fontSize:
                                                "15px",
                                        }}
                                    >
                                        {
                                            formatTimeOnly(
                                                getAttendanceDate(
                                                    latestAttendance
                                                )
                                            )
                                        }
                                    </strong>

                                </div>


                                {/* STATUS */}

                                <div
                                    style={{
                                        padding:
                                            "15px",
                                        borderRadius:
                                            "11px",
                                        background:
                                            getAttendanceStatus(
                                                latestAttendance
                                            ) ===
                                            "LATE"
                                                ? "#fffbeb"
                                                : "#ecfdf5",
                                        border:
                                            getAttendanceStatus(
                                                latestAttendance
                                            ) ===
                                            "LATE"
                                                ? "1px solid #fde68a"
                                                : "1px solid #a7f3d0",
                                    }}
                                >

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "8px",
                                            color:
                                                getAttendanceStatus(
                                                    latestAttendance
                                                ) ===
                                                "LATE"
                                                    ? "#b45309"
                                                    : "#047857",
                                            fontSize:
                                                "12px",
                                            marginBottom:
                                                "7px",
                                        }}
                                    >

                                        <FaCheckCircle />

                                        STATUS

                                    </div>

                                    <strong
                                        style={{
                                            fontSize:
                                                "18px",
                                            color:
                                                getAttendanceStatus(
                                                    latestAttendance
                                                ) ===
                                                "LATE"
                                                    ? "#b45309"
                                                    : "#047857",
                                        }}
                                    >
                                        {
                                            getAttendanceStatus(
                                                latestAttendance
                                            )
                                        }
                                    </strong>

                                </div>

                            </div>


                            {/* ATTENDANCE ID */}

                            {latestAttendance.attendance_id && (
                                <div
                                    style={{
                                        marginTop:
                                            "14px",
                                        fontSize:
                                            "12px",
                                        color:
                                            "#94a3b8",
                                        textAlign:
                                            "right",
                                    }}
                                >
                                    Attendance ID:{" "}
                                    {
                                        latestAttendance.attendance_id
                                    }
                                </div>
                            )}

                        </div>
                    )}

                </div>
            )}


            {/* =============================================
                ATTENDANCE SUMMARY
            ============================================= */}

            {isActive && (
                <div
                    style={{
                        marginTop:
                            "24px",
                        display:
                            "grid",
                        gridTemplateColumns:
                            "repeat(4, minmax(0, 1fr))",
                        gap:
                            "14px",
                    }}
                >

                    <div
                        style={{
                            background:
                                "#ffffff",
                            border:
                                "1px solid #e2e8f0",
                            borderRadius:
                                "14px",
                            padding:
                                "18px",
                        }}
                    >

                        <div
                            style={{
                                color:
                                    "#64748b",
                                fontSize:
                                    "12px",
                                marginBottom:
                                    "7px",
                            }}
                        >
                            TOTAL SCANS
                        </div>

                        <strong
                            style={{
                                fontSize:
                                    "26px",
                            }}
                        >
                            {
                                attendanceStats.total
                            }
                        </strong>

                    </div>


                    <div
                        style={{
                            background:
                                "#ecfdf5",
                            border:
                                "1px solid #a7f3d0",
                            borderRadius:
                                "14px",
                            padding:
                                "18px",
                        }}
                    >

                        <div
                            style={{
                                color:
                                    "#047857",
                                fontSize:
                                    "12px",
                                marginBottom:
                                    "7px",
                            }}
                        >
                            PRESENT
                        </div>

                        <strong
                            style={{
                                fontSize:
                                    "26px",
                                color:
                                    "#047857",
                            }}
                        >
                            {
                                attendanceStats.present
                            }
                        </strong>

                    </div>


                    <div
                        style={{
                            background:
                                "#fffbeb",
                            border:
                                "1px solid #fde68a",
                            borderRadius:
                                "14px",
                            padding:
                                "18px",
                        }}
                    >

                        <div
                            style={{
                                color:
                                    "#b45309",
                                fontSize:
                                    "12px",
                                marginBottom:
                                    "7px",
                            }}
                        >
                            LATE
                        </div>

                        <strong
                            style={{
                                fontSize:
                                    "26px",
                                color:
                                    "#b45309",
                            }}
                        >
                            {
                                attendanceStats.late
                            }
                        </strong>

                    </div>


                    <div
                        style={{
                            background:
                                "#eff6ff",
                            border:
                                "1px solid #bfdbfe",
                            borderRadius:
                                "14px",
                            padding:
                                "18px",
                        }}
                    >

                        <div
                            style={{
                                color:
                                    "#1d4ed8",
                                fontSize:
                                    "12px",
                                marginBottom:
                                    "7px",
                            }}
                        >
                            ATTENDANCE %
                        </div>

                        <strong
                            style={{
                                fontSize:
                                    "26px",
                                color:
                                    "#1d4ed8",
                            }}
                        >
                            {
                                attendanceStats.percentage
                            }%
                        </strong>

                    </div>

                </div>
            )}


            {/* =============================================
                AUTOMATIC QR FLOW
            ============================================= */}

            <div
                style={{
                    marginTop:
                        "24px",
                    background:
                        "#ffffff",
                    border:
                        "1px solid #e2e8f0",
                    borderRadius:
                        "16px",
                    padding:
                        "22px",
                }}
            >

                <h3
                    style={{
                        marginTop:
                            0,
                        marginBottom:
                            "16px",
                        fontSize:
                            "18px",
                    }}
                >

                    <FaUsers
                        style={{
                            marginRight:
                                "8px",
                        }}
                    />

                    Automatic QR Rotation

                </h3>


                <div
                    style={{
                        display:
                            "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        gap:
                            "14px",
                    }}
                >

                    <div
                        style={{
                            padding:
                                "14px",
                            borderRadius:
                                "10px",
                            background:
                                "#f8fafc",
                        }}
                    >

                        <strong>
                            1. QR #1
                        </strong>

                        <p
                            style={{
                                margin:
                                    "7px 0 0",
                                color:
                                    "#64748b",
                                fontSize:
                                    "13px",
                                lineHeight:
                                    1.5,
                            }}
                        >
                            A new QR is
                            generated when
                            attendance starts
                            and the timer
                            begins at 15
                            seconds.
                        </p>

                    </div>


                    <div
                        style={{
                            padding:
                                "14px",
                            borderRadius:
                                "10px",
                            background:
                                "#f8fafc",
                        }}
                    >

                        <strong>
                            2. Student Scans
                        </strong>

                        <p
                            style={{
                                margin:
                                    "7px 0 0",
                                color:
                                    "#64748b",
                                fontSize:
                                    "13px",
                                lineHeight:
                                    1.5,
                            }}
                        >
                            The backend
                            validates the
                            student's QR
                            request and
                            prevents reuse
                            of the old QR.
                        </p>

                    </div>


                    <div
                        style={{
                            padding:
                                "14px",
                            borderRadius:
                                "10px",
                            background:
                                "#f8fafc",
                        }}
                    >

                        <strong>
                            3. Attendance Shown
                        </strong>

                        <p
                            style={{
                                margin:
                                    "7px 0 0",
                                color:
                                    "#64748b",
                                fontSize:
                                    "13px",
                                lineHeight:
                                    1.5,
                            }}
                        >
                            Student name,
                            register number,
                            subject, staff,
                            class, date,
                            time and status
                            appear automatically
                            on this screen.
                        </p>

                    </div>


                    <div
                        style={{
                            padding:
                                "14px",
                            borderRadius:
                                "10px",
                            background:
                                "#f8fafc",
                        }}
                    >

                        <strong>
                            4. QR #2
                        </strong>

                        <p
                            style={{
                                margin:
                                    "7px 0 0",
                                color:
                                    "#64748b",
                                fontSize:
                                    "13px",
                                lineHeight:
                                    1.5,
                            }}
                        >
                            After the
                            successful scan,
                            the backend
                            creates the next
                            QR and the
                            countdown returns
                            to 15 seconds.
                        </p>

                    </div>

                </div>

            </div>


            {/* =============================================
                RESPONSIVE + ANIMATION
            ============================================= */}

            <style>
                {`
                    @keyframes spin {
                        from {
                            transform: rotate(0deg);
                        }

                        to {
                            transform: rotate(360deg);
                        }
                    }

                    @media (max-width: 800px) {
                        .start-attendance-grid {
                            grid-template-columns: 1fr !important;
                        }

                        .latest-attendance-grid {
                            grid-template-columns: 1fr !important;
                        }
                    }

                    @media (max-width: 650px) {
                        .start-attendance-grid {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}
            </style>

        </div>
    );
}