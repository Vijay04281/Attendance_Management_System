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
} from "react-icons/fa";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_URL =
    "https://attendance-management-system-gpci.onrender.com/api";

// =====================================================
// QR CONFIGURATION
// =====================================================

// Every QR is displayed for 15 seconds.
const QR_EXPIRY_SECONDS = 15;

// Check backend every 1 second to detect when a student
// has scanned and backend has generated a new QR.
const QR_POLL_INTERVAL = 1000;

// Small delay after backend expiry.
const QR_EXPIRY_REFRESH_DELAY = 250;


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

    // Current backend QR token.
    const qrTokenRef =
        useRef("");

    // Backend expiry.
    const qrExpiryRef =
        useRef(null);

    // LOCAL DISPLAY expiry.
    //
    // This guarantees the visible countdown is:
    //
    // 15 → 14 → 13 → ... → 1
    //
    // whenever a new QR is received.
    const localQRExpiryRef =
        useRef(null);

    const qrRefreshTimerRef =
        useRef(null);

    const qrPollingTimerRef =
        useRef(null);

    const countdownTimerRef =
        useRef(null);

    const refreshQRRef =
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

        if (typeof data === "string") {
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

        for (const value of values) {
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

        for (const value of values) {
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

        for (const value of values) {
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

        if (value instanceof Date) {
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

        // MySQL DATETIME:
        //
        // 2026-09-15 16:02:30
        //

        const mysqlMatch =
            trimmed.match(
                /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/
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
    // START COUNTDOWN
    //
    // IMPORTANT:
    //
    // The countdown is based on the LOCAL QR creation
    // time for display.
    //
    // This guarantees:
    //
    // 15
    // 14
    // 13
    // ...
    // 2
    // 1
    // new QR
    // 15
    //
    // The BACKEND remains authoritative for whether
    // the QR is actually valid.
    // =================================================

    const startCountdown =
        useCallback(
            (
                expiresAt,
                resetTo15 = false
            ) => {
                clearCountdownTimer();

                // -----------------------------------------
                // If this is a NEW QR, start a fresh
                // 15-second local countdown.
                // -----------------------------------------

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
                            safeRemaining <=
                            0
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
    // SCHEDULE BACKEND EXPIRY CHECK
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
                                sessionRef
                                    .current
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
    //
    // Every second the teacher page asks the backend
    // for the current QR.
    //
    // If student scanned QR #1:
    //
    // Backend:
    //
    // QR #1 → invalid
    // QR #2 → generated
    //
    // Polling detects token change.
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

                    if (!response.ok) {
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

                    // -----------------------------------------
                    // EXTRACT DATA
                    // -----------------------------------------

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
                    // TOKEN UPDATE
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
                    // NEW QR DETECTED
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
                    // EXPIRY UPDATE
                    // -----------------------------------------

                    if (
                        returnedQRExpiry
                    ) {
                        qrExpiryRef.current =
                            returnedQRExpiry;

                        // -------------------------------------
                        // NEW TOKEN
                        //
                        // ALWAYS restart visible countdown
                        // from 15 seconds.
                        // -------------------------------------

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

                        // -------------------------------------
                        // Backend controls actual expiry.
                        // -------------------------------------

                        scheduleQRRefresh(
                            returnedQRExpiry,
                            sessionId
                        );
                    }

                    // -----------------------------------------
                    // IF TOKEN CHANGED BECAUSE A STUDENT
                    // SUCCESSFULLY SCANNED
                    // -----------------------------------------

                    if (
                        tokenChanged
                    ) {
                        setMessage(
                            "Attendance recorded. New QR generated automatically."
                        );

                        setError("");

                        // Ensure countdown is exactly
                        // a fresh QR countdown.
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

                    // Do not show repeated errors caused
                    // by background polling.
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
            ]
        );


    // =================================================
    // KEEP LATEST REFRESH FUNCTION
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

                    if (!response.ok) {
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
                        Array.isArray(
                            data
                        )
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
                            data.data
                                ?.subjects
                        )
                    ) {
                        subjectList =
                            data.data.subjects;
                    } else if (
                        Array.isArray(
                            data.data
                                ?.allocations
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

                    // -----------------------------------------
                    // Get current QR
                    // -----------------------------------------

                    await refreshQR(
                        sessionId,
                        {
                            force:
                                false,
                            silent:
                                false,
                        }
                    );

                    // -----------------------------------------
                    // Start monitoring
                    // -----------------------------------------

                    startQRPolling(
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
                startQRPolling,
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

            clearAllQRTimers();

            refreshInProgress.current =
                false;
        };
    }, [
        fetchSubjects,
        fetchActiveSession,
        clearAllQRTimers,
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

                if (!response.ok) {
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
                // Clear previous QR
                // -----------------------------------------

                clearAllQRTimers();

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
                // Set session
                // -----------------------------------------

                sessionRef.current =
                    newSession;

                setSession(
                    newSession
                );

                // -----------------------------------------
                // QR returned during creation
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

                    // NEW QR = exactly 15 seconds
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
                // If QR was not included, fetch it.
                // -----------------------------------------

                if (
                    !createdQRImage ||
                    !createdQRToken ||
                    !createdQRExpiry
                ) {
                    await refreshQR(
                        sessionId,
                        {
                            force:
                                false,
                            silent:
                                false,
                        }
                    );
                }

                // -----------------------------------------
                // Start automatic QR monitoring.
                // -----------------------------------------

                startQRPolling(
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

                if (!response.ok) {
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
                // STOP QR
                // -----------------------------------------

                clearAllQRTimers();

                refreshInProgress.current =
                    false;

                qrTokenRef.current =
                    "";

                qrExpiryRef.current =
                    null;

                localQRExpiryRef.current =
                    null;

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
    // MANUAL REFRESH
    //
    // force=true means:
    // current QR becomes invalid
    // new QR is generated
    // countdown returns to 15
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
                    force:
                        true,
                    silent:
                        false,
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
                ""
            );
        };


    const getSectionName =
        (item) => {
            return (
                item?.section_name ||
                item?.section ||
                item?.sectionName ||
                ""
            );
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
                ERROR MESSAGE
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

                            setError(
                                ""
                            );

                            setMessage(
                                ""
                            );
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

                                Attendance
                                Active
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

                            {/* MANUAL NEW QR */}

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


                            {/* CLOSE */}

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


                    {/* QR AVAILABLE */}

                    {isActive &&
                    qrImage ? (
                        <>
                            {/* QR IMAGE */}

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


                            {/* EXPLANATION */}

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


                            {/* LIVE STATUS */}

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


                            {/* TOKEN STATUS */}

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

                        /* LOADING QR */

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

                        /* NO SESSION */

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
                AUTOMATIC QR FLOW INFORMATION
            ============================================== */}

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
                            3. QR #2
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
                            After a successful
                            scan, the backend
                            creates a new QR.
                            The teacher screen
                            detects it
                            automatically.
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
                            4. 15 Seconds
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
                            If nobody scans,
                            the QR expires
                            and the backend
                            creates the next
                            QR automatically.
                        </p>
                    </div>
                </div>
            </div>


            {/* =============================================
                RESPONSIVE + ANIMATION
            ============================================== */}

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
                    }
                `}
            </style>
        </div>
    );
}