import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    FaQrcode,
    FaPlay,
    FaStop,
    FaClock,
    FaBook,
    FaSyncAlt,
    FaCheckCircle,
    FaExclamationTriangle,
} from "react-icons/fa";

const API_URL =
    "https://attendance-management-system-gpci.onrender.com/api";

const QR_EXPIRY_SECONDS = 15;

const StartAttendance = () => {
    // ======================================================
    // STATE
    // ======================================================

    const [subjects, setSubjects] = useState([]);
    const [selectedAllocation, setSelectedAllocation] =
        useState("");

    const [session, setSession] = useState(null);
    const [qrImage, setQrImage] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);

    const [loadingSubjects, setLoadingSubjects] =
        useState(true);

    const [starting, setStarting] = useState(false);
    const [refreshingQR, setRefreshingQR] =
        useState(false);

    const [closing, setClosing] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // ======================================================
    // REFS
    // ======================================================

    const refreshInProgress = useRef(false);
    const initialLoadStarted = useRef(false);
    const mountedRef = useRef(false);

    const sessionRef = useRef(null);

    const qrExpiryRef = useRef(null);
    const qrRefreshTimerRef = useRef(null);
    const countdownTimerRef = useRef(null);

    const startingRef = useRef(false);
    const closingRef = useRef(false);

    const token = localStorage.getItem("token");

    // ======================================================
    // KEEP SESSION REF SYNCHRONIZED
    // ======================================================

    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    // ======================================================
    // SAFE JSON RESPONSE
    // ======================================================

    const getResponseData = async (response) => {
        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch (err) {
            console.error(
                "Invalid server response:",
                text
            );

            throw new Error(
                `Server returned an invalid response (${response.status}).`
            );
        }
    };

    // ======================================================
    // NORMALIZE API DATA
    //
    // Supports:
    //
    // data.qr_image
    // data.qr_code
    // data.qrImage
    // data.qr
    //
    // and also:
    //
    // data.data.qr_image
    // data.data.qr_code
    // ======================================================

    const extractQRImage = (data) => {
        if (!data || typeof data !== "object") {
            return "";
        }

        const nested =
            data.data &&
            typeof data.data === "object"
                ? data.data
                : null;

        const sessionData =
            data.session &&
            typeof data.session === "object"
                ? data.session
                : null;

        const candidates = [
            data.qr_image,
            data.qr_code,
            data.qrImage,
            data.qr,
            data.qrData,
            data.qr_data,

            nested?.qr_image,
            nested?.qr_code,
            nested?.qrImage,
            nested?.qr,
            nested?.qrData,
            nested?.qr_data,

            sessionData?.qr_image,
            sessionData?.qr_code,
            sessionData?.qrImage,
            sessionData?.qr,
        ];

        for (const candidate of candidates) {
            if (
                typeof candidate === "string" &&
                candidate.trim() !== ""
            ) {
                return candidate.trim();
            }
        }

        return "";
    };

    // ======================================================
    // EXTRACT QR EXPIRY
    // ======================================================

    const extractQRExpiry = (
        data,
        currentSession = null
    ) => {
        if (!data || typeof data !== "object") {
            return (
                currentSession?.qr_expires_at ||
                null
            );
        }

        const nested =
            data.data &&
            typeof data.data === "object"
                ? data.data
                : null;

        const sessionData =
            data.session &&
            typeof data.session === "object"
                ? data.session
                : currentSession;

        return (
            data.qr_expires_at ||
            data.expires_at ||
            data.qrExpiresAt ||
            nested?.qr_expires_at ||
            nested?.expires_at ||
            nested?.qrExpiresAt ||
            sessionData?.qr_expires_at ||
            sessionData?.qrExpiresAt ||
            null
        );
    };

    // ======================================================
    // CLEAR QR TIMERS
    // ======================================================

    const clearQRTimers = useCallback(() => {
        if (qrRefreshTimerRef.current) {
            clearTimeout(
                qrRefreshTimerRef.current
            );

            qrRefreshTimerRef.current = null;
        }

        if (countdownTimerRef.current) {
            clearInterval(
                countdownTimerRef.current
            );

            countdownTimerRef.current = null;
        }

        qrExpiryRef.current = null;
    }, []);

    // ======================================================
    // CALCULATE TIME LEFT
    // ======================================================

    const calculateTimeLeft = useCallback(
        (expiresAt) => {
            if (!expiresAt) {
                return 0;
            }

            let expiryTime;

            // ------------------------------------------------
            // MySQL datetime:
            //
            // 2026-09-15 20:30:15
            //
            // JavaScript can interpret this as local time,
            // which is what we want for the backend date.
            // ------------------------------------------------

            if (
                typeof expiresAt === "string" &&
                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
                    expiresAt
                )
            ) {
                expiryTime = new Date(
                    expiresAt.replace(
                        " ",
                        "T"
                    )
                ).getTime();
            } else {
                expiryTime =
                    new Date(
                        expiresAt
                    ).getTime();
            }

            if (
                Number.isNaN(expiryTime)
            ) {
                return 0;
            }

            return Math.max(
                0,
                Math.ceil(
                    (expiryTime -
                        Date.now()) /
                        1000
                )
            );
        },
        []
    );

    // ======================================================
    // SCHEDULE QR REFRESH
    // ======================================================

    const scheduleQRRefresh =
        useCallback(
            (
                expiresAt,
                sessionId
            ) => {
                if (
                    qrRefreshTimerRef.current
                ) {
                    clearTimeout(
                        qrRefreshTimerRef.current
                    );

                    qrRefreshTimerRef.current =
                        null;
                }

                if (
                    !expiresAt ||
                    !sessionId
                ) {
                    return;
                }

                let expiryTime;

                if (
                    typeof expiresAt ===
                        "string" &&
                    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
                        expiresAt
                    )
                ) {
                    expiryTime =
                        new Date(
                            expiresAt.replace(
                                " ",
                                "T"
                            )
                        ).getTime();
                } else {
                    expiryTime =
                        new Date(
                            expiresAt
                        ).getTime();
                }

                if (
                    Number.isNaN(
                        expiryTime
                    )
                ) {
                    return;
                }

                qrExpiryRef.current =
                    expiryTime;

                const delay =
                    Math.max(
                        1000,
                        expiryTime -
                            Date.now() +
                            250
                    );

                qrRefreshTimerRef.current =
                    setTimeout(() => {
                        qrRefreshTimerRef.current =
                            null;

                        if (
                            !mountedRef.current
                        ) {
                            return;
                        }

                        if (
                            !sessionRef.current
                        ) {
                            return;
                        }

                        if (
                            Number(
                                sessionRef
                                    .current
                                    .session_id
                            ) !==
                            Number(
                                sessionId
                            )
                        ) {
                            return;
                        }

                        refreshQR(
                            sessionId
                        );
                    }, delay);
            },
            []
        );

    // ======================================================
    // COUNTDOWN TIMER
    // ======================================================

    const startCountdown =
        useCallback(
            (expiresAt) => {
                if (
                    countdownTimerRef.current
                ) {
                    clearInterval(
                        countdownTimerRef.current
                    );

                    countdownTimerRef.current =
                        null;
                }

                if (!expiresAt) {
                    setTimeLeft(0);
                    return;
                }

                const updateCountdown =
                    () => {
                        const remaining =
                            calculateTimeLeft(
                                expiresAt
                            );

                        setTimeLeft(
                            remaining
                        );

                        if (
                            remaining <=
                            0
                        ) {
                            if (
                                countdownTimerRef.current
                            ) {
                                clearInterval(
                                    countdownTimerRef.current
                                );

                                countdownTimerRef.current =
                                    null;
                            }
                        }
                    };

                updateCountdown();

                countdownTimerRef.current =
                    setInterval(
                        updateCountdown,
                        1000
                    );
            },
            [calculateTimeLeft]
        );

    // ======================================================
    // REFRESH QR
    // ======================================================

    const refreshQR = useCallback(
        async (
            sessionId =
                sessionRef.current
                    ?.session_id
        ) => {
            if (!sessionId) {
                console.error(
                    "Cannot refresh QR: session ID missing."
                );

                return;
            }

            if (!token) {
                console.error(
                    "Cannot refresh QR: authentication token missing."
                );

                return;
            }

            if (
                refreshInProgress.current
            ) {
                console.log(
                    "QR refresh already in progress. Skipping duplicate request."
                );

                return;
            }

            const currentSession =
                sessionRef.current;

            if (
                currentSession &&
                Number(
                    currentSession.session_id
                ) !==
                    Number(sessionId)
            ) {
                console.log(
                    "Ignoring QR refresh for old session:",
                    sessionId
                );

                return;
            }

            try {
                refreshInProgress.current =
                    true;

                if (
                    mountedRef.current
                ) {
                    setRefreshingQR(
                        true
                    );

                    setError("");
                }

                console.log(
                    "Requesting QR:",
                    `${API_URL}/attendance-sessions/${sessionId}/qr`
                );

                const response =
                    await fetch(
                        `${API_URL}/attendance-sessions/${sessionId}/qr`,
                        {
                            method: "GET",

                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );

                const data =
                    await getResponseData(
                        response
                    );

                console.log(
                    "Refresh QR HTTP status:",
                    response.status
                );

                console.log(
                    "Refresh QR response:",
                    data
                );

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to refresh QR."
                    );
                }

                // ==================================================
                // EXTRACT QR
                // ==================================================

                const qr =
                    extractQRImage(
                        data
                    );

                console.log(
                    "Extracted QR image:",
                    qr
                        ? `FOUND (${qr.length} characters)`
                        : "NOT FOUND"
                );

                if (!qr) {
                    console.error(
                        "QR image missing from response:",
                        data
                    );

                    throw new Error(
                        "QR code was not returned by the server."
                    );
                }

                if (
                    !mountedRef.current
                ) {
                    return;
                }

                const latestSession =
                    sessionRef.current;

                if (
                    latestSession &&
                    Number(
                        latestSession.session_id
                    ) !==
                        Number(sessionId)
                ) {
                    console.log(
                        "Ignoring QR response for old session:",
                        sessionId
                    );

                    return;
                }

                setQrImage(qr);

                // ==================================================
                // EXPIRATION
                // ==================================================

                let expiresAt =
                    extractQRExpiry(
                        data,
                        latestSession
                    );

                if (!expiresAt) {
                    const fallbackExpiry =
                        new Date(
                            Date.now() +
                                QR_EXPIRY_SECONDS *
                                    1000
                        );

                    expiresAt =
                        fallbackExpiry.toISOString();
                }

                const seconds =
                    calculateTimeLeft(
                        expiresAt
                    );

                setTimeLeft(
                    seconds
                );

                startCountdown(
                    expiresAt
                );

                scheduleQRRefresh(
                    expiresAt,
                    sessionId
                );
            } catch (err) {
                console.error(
                    "Refresh QR error:",
                    err
                );

                if (
                    mountedRef.current
                ) {
                    setQrImage("");

                    setError(
                        err.message ||
                            "Failed to refresh QR."
                    );
                }
            } finally {
                refreshInProgress.current =
                    false;

                if (
                    mountedRef.current
                ) {
                    setRefreshingQR(
                        false
                    );
                }
            }
        },
        [
            calculateTimeLeft,
            extractQRImage,
            extractQRExpiry,
            scheduleQRRefresh,
            startCountdown,
            token,
        ]
    );

    // ======================================================
    // FETCH STAFF SUBJECTS
    // ======================================================

    const fetchSubjects =
        useCallback(async () => {
            try {
                setLoadingSubjects(
                    true
                );

                setError("");

                if (!token) {
                    throw new Error(
                        "Authentication token not found. Please login again."
                    );
                }

                const response =
                    await fetch(
                        `${API_URL}/attendance-sessions/staff-subjects`,
                        {
                            method: "GET",

                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );

                const data =
                    await getResponseData(
                        response
                    );

                console.log(
                    "Staff subjects response:",
                    data
                );

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to load subjects."
                    );
                }

                const allocationList =
                    Array.isArray(
                        data.subjects
                    )
                        ? data.subjects
                        : Array.isArray(
                              data.allocations
                          )
                        ? data.allocations
                        : [];

                setSubjects(
                    allocationList
                );

                return allocationList;
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
                            "Failed to load subjects."
                    );
                }

                return [];
            } finally {
                if (
                    mountedRef.current
                ) {
                    setLoadingSubjects(
                        false
                    );
                }
            }
        }, [token]);

    // ======================================================
    // CHECK ACTIVE SESSION
    // ======================================================

    const fetchActiveSession =
        useCallback(
            async (
                allocationList = []
            ) => {
                try {
                    if (!token) {
                        return;
                    }

                    const response =
                        await fetch(
                            `${API_URL}/attendance-sessions/active`,
                            {
                                method: "GET",

                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    const data =
                        await getResponseData(
                            response
                        );

                    console.log(
                        "Active session response:",
                        data
                    );

                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                                "Failed to load active session."
                        );
                    }

                    let activeSession =
                        null;

                    if (
                        data.session &&
                        typeof data.session ===
                            "object"
                    ) {
                        activeSession =
                            data.session;
                    } else if (
                        Array.isArray(
                            data.sessions
                        ) &&
                        data.sessions
                            .length >
                            0
                    ) {
                        activeSession =
                            data.sessions[0];
                    }

                    if (!activeSession) {
                        console.log(
                            "No active attendance session found."
                        );

                        return;
                    }

                    console.log(
                        "Active attendance session:",
                        activeSession
                    );

                    if (
                        !mountedRef.current
                    ) {
                        return;
                    }

                    sessionRef.current =
                        activeSession;

                    setSession(
                        activeSession
                    );

                    const activeAllocationId =
                        activeSession.allocation_id ||
                        activeSession.subject_allocation_id;

                    if (
                        activeAllocationId
                    ) {
                        setSelectedAllocation(
                            String(
                                activeAllocationId
                            )
                        );
                    } else {
                        const matchingAllocation =
                            allocationList.find(
                                (item) =>
                                    Number(
                                        item.subject_id
                                    ) ===
                                    Number(
                                        activeSession.subject_id
                                    )
                            );

                        if (
                            matchingAllocation
                        ) {
                            setSelectedAllocation(
                                String(
                                    matchingAllocation.allocation_id
                                )
                            );
                        }
                    }

                    setQrImage("");

                    await refreshQR(
                        activeSession.session_id
                    );
                } catch (err) {
                    console.error(
                        "Active session error:",
                        err
                    );
                }
            },
            [refreshQR, token]
        );

    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {
        mountedRef.current =
            true;

        if (!token) {
            setError(
                "Authentication token not found. Please login again."
            );

            setLoadingSubjects(
                false
            );

            return () => {
                mountedRef.current =
                    false;

                clearQRTimers();
            };
        }

        if (
            initialLoadStarted.current
        ) {
            return () => {
                mountedRef.current =
                    false;

                clearQRTimers();
            };
        }

        initialLoadStarted.current =
            true;

        const loadData =
            async () => {
                try {
                    const allocationList =
                        await fetchSubjects();

                    if (
                        !mountedRef.current
                    ) {
                        return;
                    }

                    await fetchActiveSession(
                        allocationList
                    );
                } catch (err) {
                    console.error(
                        "Initial attendance page load error:",
                        err
                    );
                }
            };

        loadData();

        return () => {
            mountedRef.current =
                false;

            clearQRTimers();
        };
    }, [
        clearQRTimers,
        fetchActiveSession,
        fetchSubjects,
        token,
    ]);

    // ======================================================
    // START SESSION
    // ======================================================

    const startSession =
        async () => {
            if (
                !selectedAllocation
            ) {
                setError(
                    "Please select a subject."
                );

                return;
            }

            if (
                startingRef.current
            ) {
                return;
            }

            if (
                sessionRef.current
            ) {
                setError(
                    "An attendance session is already active."
                );

                return;
            }

            try {
                startingRef.current =
                    true;

                setStarting(true);
                setError("");
                setMessage("");

                const allocation =
                    subjects.find(
                        (item) =>
                            Number(
                                item.allocation_id
                            ) ===
                            Number(
                                selectedAllocation
                            )
                    );

                if (!allocation) {
                    throw new Error(
                        "Subject allocation not found."
                    );
                }

                console.log(
                    "Selected allocation:",
                    allocation
                );

                const response =
                    await fetch(
                        `${API_URL}/attendance-sessions`,
                        {
                            method: "POST",

                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify(
                                {
                                    allocation_id:
                                        allocation.allocation_id,

                                    subject_id:
                                        allocation.subject_id,
                                }
                            ),
                        }
                    );

                const data =
                    await getResponseData(
                        response
                    );

                console.log(
                    "Start attendance response:",
                    data
                );

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to start attendance."
                    );
                }

                const newSession =
                    data.session ||
                    data.data?.session ||
                    null;

                if (!newSession) {
                    throw new Error(
                        "Attendance session was created but session data was not returned."
                    );
                }

                clearQRTimers();

                sessionRef.current =
                    newSession;

                setSession(
                    newSession
                );

                setQrImage("");
                setTimeLeft(0);

                // ==================================================
                // USE QR RETURNED BY POST RESPONSE
                // ==================================================

                const returnedQR =
                    extractQRImage(
                        data
                    );

                const returnedExpiry =
                    extractQRExpiry(
                        data,
                        newSession
                    );

                console.log(
                    "Returned QR from start API:",
                    returnedQR
                        ? "FOUND"
                        : "NOT FOUND"
                );

                if (returnedQR) {
                    setQrImage(
                        returnedQR
                    );

                    let expiry =
                        returnedExpiry;

                    if (!expiry) {
                        expiry =
                            new Date(
                                Date.now() +
                                    QR_EXPIRY_SECONDS *
                                        1000
                            ).toISOString();
                    }

                    const seconds =
                        calculateTimeLeft(
                            expiry
                        );

                    setTimeLeft(
                        seconds
                    );

                    startCountdown(
                        expiry
                    );

                    scheduleQRRefresh(
                        expiry,
                        newSession.session_id
                    );
                } else {
                    // ==================================================
                    // FALLBACK TO QR ENDPOINT
                    // ==================================================

                    await refreshQR(
                        newSession.session_id
                    );
                }

                if (
                    data.existing
                ) {
                    setMessage(
                        "The existing active attendance session has been loaded."
                    );
                } else {
                    setMessage(
                        "Attendance session started successfully."
                    );
                }
            } catch (err) {
                console.error(
                    "Start session error:",
                    err
                );

                if (
                    mountedRef.current
                ) {
                    setError(
                        err.message ||
                            "Failed to start attendance."
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

    // ======================================================
    // CLOSE SESSION
    // ======================================================

    const closeSession =
        async () => {
            const currentSession =
                sessionRef.current;

            if (!currentSession) {
                return;
            }

            if (
                closingRef.current
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

            try {
                closingRef.current =
                    true;

                setClosing(true);
                setError("");
                setMessage("");

                clearQRTimers();

                const response =
                    await fetch(
                        `${API_URL}/attendance-sessions/${currentSession.session_id}/close`,
                        {
                            method: "PATCH",

                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );

                const data =
                    await getResponseData(
                        response
                    );

                console.log(
                    "Close session response:",
                    data
                );

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to close session."
                    );
                }

                sessionRef.current =
                    null;

                setSession(null);
                setQrImage("");
                setTimeLeft(0);

                setSelectedAllocation(
                    ""
                );

                setMessage(
                    data.message ||
                        "Attendance session closed successfully."
                );
            } catch (err) {
                console.error(
                    "Close session error:",
                    err
                );

                if (
                    currentSession
                ) {
                    sessionRef.current =
                        currentSession;

                    setSession(
                        currentSession
                    );

                    if (
                        currentSession.qr_expires_at
                    ) {
                        scheduleQRRefresh(
                            currentSession.qr_expires_at,
                            currentSession.session_id
                        );

                        startCountdown(
                            currentSession.qr_expires_at
                        );
                    } else {
                        refreshQR(
                            currentSession.session_id
                        );
                    }
                }

                setError(
                    err.message ||
                        "Failed to close session."
                );
            } finally {
                closingRef.current =
                    false;

                if (
                    mountedRef.current
                ) {
                    setClosing(false);
                }
            }
        };

    // ======================================================
    // MANUAL QR REFRESH
    // ======================================================

    const handleManualRefreshQR =
        async () => {
            if (
                !sessionRef.current
            ) {
                return;
            }

            if (
                qrRefreshTimerRef.current
            ) {
                clearTimeout(
                    qrRefreshTimerRef.current
                );

                qrRefreshTimerRef.current =
                    null;
            }

            await refreshQR(
                sessionRef.current
                    .session_id
            );
        };

    // ======================================================
    // FORMAT TIMER
    // ======================================================

    const formatTime = (
        seconds
    ) => {
        return `${String(
            Math.max(
                0,
                seconds
            )
        ).padStart(2, "0")}s`;
    };

    // ======================================================
    // SELECTED SUBJECT
    // ======================================================

    const selectedSubjectData =
        subjects.find(
            (item) =>
                Number(
                    item.allocation_id
                ) ===
                Number(
                    selectedAllocation
                )
        );

    // ======================================================
    // LOADING
    // ======================================================

    if (loadingSubjects) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

                    <p className="text-sm font-medium text-slate-600">
                        Loading subjects...
                    </p>
                </div>
            </div>
        );
    }

    // ======================================================
    // UI
    // ======================================================

    return (
        <div className="space-y-6">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div>
                <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                        <FaQrcode size={22} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Start Attendance
                        </h1>

                        <p className="text-sm text-slate-500">
                            Start a class attendance session and
                            display the QR code.
                        </p>
                    </div>

                </div>
            </div>

            {/* ==================================================
                SUCCESS MESSAGE
            ================================================== */}

            {message && (
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">

                    <FaCheckCircle />

                    <span className="text-sm font-medium">
                        {message}
                    </span>

                </div>
            )}

            {/* ==================================================
                ERROR MESSAGE
            ================================================== */}

            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

                    <FaExclamationTriangle />

                    <span className="text-sm font-medium">
                        {error}
                    </span>

                </div>
            )}

            {/* ==================================================
                MAIN GRID
            ================================================== */}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* ==================================================
                    LEFT SIDE
                ================================================== */}

                <div className="space-y-6 lg:col-span-1">

                    {/* ==================================================
                        SUBJECT SELECTION
                    ================================================== */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="mb-5 flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <FaBook />
                            </div>

                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Select Subject
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Choose the subject for attendance
                                </p>
                            </div>

                        </div>

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Subject
                        </label>

                        <select
                            value={
                                selectedAllocation
                            }
                            onChange={(e) =>
                                setSelectedAllocation(
                                    e.target.value
                                )
                            }
                            disabled={
                                !!session
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                        >
                            <option value="">
                                Select a subject
                            </option>

                            {subjects.map(
                                (
                                    subject
                                ) => (
                                    <option
                                        key={
                                            subject.allocation_id
                                        }
                                        value={
                                            subject.allocation_id
                                        }
                                    >
                                        {
                                            subject.subject_code
                                        }{" "}
                                        -{" "}
                                        {
                                            subject.subject_name
                                        }
                                    </option>
                                )
                            )}
                        </select>

                        {selectedSubjectData &&
                            !session && (
                                <div className="mt-3 rounded-lg bg-blue-50 p-3">

                                    <p className="text-xs font-medium text-blue-600">
                                        Selected Subject
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-blue-900">
                                        {
                                            selectedSubjectData.subject_code
                                        }{" "}
                                        -{" "}
                                        {
                                            selectedSubjectData.subject_name
                                        }
                                    </p>

                                    {selectedSubjectData.class_name && (
                                        <p className="mt-1 text-xs text-blue-700">
                                            Class:{" "}
                                            {
                                                selectedSubjectData.class_name
                                            }
                                        </p>
                                    )}

                                </div>
                            )}

                        {subjects.length ===
                            0 && (
                            <p className="mt-3 text-xs text-amber-600">
                                No subjects are assigned to your
                                staff account.
                            </p>
                        )}

                        {!session ? (
                            <button
                                onClick={
                                    startSession
                                }
                                disabled={
                                    starting ||
                                    !selectedAllocation ||
                                    subjects.length ===
                                        0
                                }
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FaPlay />

                                {starting
                                    ? "Starting..."
                                    : "Start Attendance"}
                            </button>
                        ) : (
                            <button
                                onClick={
                                    closeSession
                                }
                                disabled={
                                    closing
                                }
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FaStop />

                                {closing
                                    ? "Closing..."
                                    : "Close Attendance"}
                            </button>
                        )}
                    </div>

                    {/* ==================================================
                        SESSION INFORMATION
                    ================================================== */}

                    {session && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                            <h2 className="mb-4 font-semibold text-slate-900">
                                Session Information
                            </h2>

                            <div className="space-y-4">

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Subject
                                    </p>

                                    <p className="mt-1 font-semibold text-slate-900">
                                        {session.subject_code ||
                                            selectedSubjectData?.subject_code ||
                                            "-"}
                                    </p>

                                    <p className="text-sm text-slate-600">
                                        {session.subject_name ||
                                            selectedSubjectData?.subject_name ||
                                            "-"}
                                    </p>
                                </div>

                                {(session.allocation_id ||
                                    selectedAllocation) && (
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Allocation ID
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-700">
                                            {session.allocation_id ||
                                                selectedAllocation}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Session ID
                                    </p>

                                    <p className="mt-1 font-semibold text-slate-900">
                                        #
                                        {
                                            session.session_id
                                        }
                                    </p>
                                </div>

                                {session.session_date && (
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Date
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-700">
                                            {
                                                session.session_date
                                            }
                                        </p>
                                    </div>
                                )}

                                {session.start_time && (
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Start Time
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-700">
                                            {
                                                session.start_time
                                            }
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Status
                                    </p>

                                    <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                        ACTIVE
                                    </span>
                                </div>

                            </div>
                        </div>
                    )}
                </div>

                {/* ==================================================
                    QR SECTION
                ================================================== */}

                <div className="lg:col-span-2">

                    <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

                        {!session ? (
                            <div className="max-w-md text-center">

                                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <FaQrcode size={46} />
                                </div>

                                <h2 className="text-xl font-bold text-slate-900">
                                    Attendance QR Code
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Select a subject and start an
                                    attendance session. The QR code
                                    will appear here for students to
                                    scan.
                                </p>

                            </div>
                        ) : (
                            <div className="w-full max-w-md text-center">

                                {/* ==================================================
                                    SUBJECT
                                ================================================== */}

                                <div className="mb-6">

                                    <p className="text-sm font-medium text-slate-500">
                                        Scan this QR code
                                    </p>

                                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                                        {session.subject_code ||
                                            selectedSubjectData?.subject_code ||
                                            "-"}
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        {session.subject_name ||
                                            selectedSubjectData?.subject_name ||
                                            "-"}
                                    </p>

                                </div>

                                {/* ==================================================
                                    QR CODE
                                ================================================== */}

                                <div className="mx-auto flex w-fit items-center justify-center rounded-2xl border-8 border-slate-100 bg-white p-4 shadow-lg">

                                    {qrImage ? (
                                        <img
                                            src={
                                                qrImage
                                            }
                                            alt="Attendance QR Code"
                                            className="h-64 w-64 object-contain"
                                            onError={(
                                                event
                                            ) => {
                                                console.error(
                                                    "QR image failed to render."
                                                );

                                                event.currentTarget.style.display =
                                                    "none";

                                                setError(
                                                    "QR image could not be displayed. Please refresh the QR code."
                                                );
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-64 w-64 flex-col items-center justify-center">

                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

                                            <p className="mt-3 text-xs text-slate-500">
                                                Generating QR code...
                                            </p>

                                        </div>
                                    )}

                                </div>

                                {/* ==================================================
                                    TIMER
                                ================================================== */}

                                <div className="mt-6">

                                    <div
                                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2 ${
                                            timeLeft <=
                                            5
                                                ? "bg-red-50 text-red-700"
                                                : "bg-blue-50 text-blue-700"
                                        }`}
                                    >
                                        <FaClock />

                                        <span className="text-sm font-bold">
                                            QR refreshes in{" "}
                                            {formatTime(
                                                timeLeft
                                            )}
                                        </span>
                                    </div>

                                </div>

                                {/* ==================================================
                                    MANUAL REFRESH
                                ================================================== */}

                                <button
                                    onClick={
                                        handleManualRefreshQR
                                    }
                                    disabled={
                                        refreshingQR ||
                                        closing
                                    }
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <FaSyncAlt
                                        className={
                                            refreshingQR
                                                ? "animate-spin"
                                                : ""
                                        }
                                    />

                                    {refreshingQR
                                        ? "Refreshing..."
                                        : "Refresh QR"}
                                </button>

                                <p className="mt-5 text-xs text-slate-400">
                                    Students must scan the current
                                    QR code before it expires.
                                </p>

                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartAttendance;