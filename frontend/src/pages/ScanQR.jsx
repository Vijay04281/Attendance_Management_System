import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    FaQrcode,
    FaCamera,
    FaCheckCircle,
    FaExclamationTriangle,
    FaUserGraduate,
    FaBook,
    FaClock,
    FaRedo,
    FaStop,
    FaShieldAlt,
} from "react-icons/fa";

import { Html5Qrcode } from "html5-qrcode";

// =====================================================
// API
// =====================================================

const API_URL =
    "https://attendance-management-system-gpci.onrender.com/api";

const SCAN_URL =
    `${API_URL}/attendance/scan`;

const REQUEST_TIMEOUT =
    15000;

// =====================================================
// COMPONENT
// =====================================================

function StudentScanQR() {

    // =================================================
    // REFS
    // =================================================

    const scannerRef =
        useRef(null);

    const scannerStartedRef =
        useRef(false);

    const processingRef =
        useRef(false);

    const mountedRef =
        useRef(true);

    const requestAbortRef =
        useRef(null);


    // =================================================
    // STATE
    // =================================================

    const [
        scanning,
        setScanning
    ] = useState(false);

    const [
        processing,
        setProcessing
    ] = useState(false);

    const [
        successMessage,
        setSuccessMessage
    ] = useState("");

    const [
        errorMessage,
        setErrorMessage
    ] = useState("");

    const [
        attendance,
        setAttendance
    ] = useState(null);


    // =====================================================
    // GET AUTH TOKEN
    // =====================================================

    const getAuthToken = () => {

        const token =
            localStorage.getItem("token");

        if (!token) {
            return null;
        }

        return token.trim();
    };


    // =====================================================
    // STOP SCANNER
    // =====================================================

    const stopScanner = async () => {

        const scanner =
            scannerRef.current;

        try {

            if (scanner) {

                if (
                    scannerStartedRef.current
                ) {

                    try {

                        await scanner.stop();

                    } catch (error) {

                        console.warn(
                            "Scanner stop warning:",
                            error
                        );
                    }
                }

                try {

                    await scanner.clear();

                } catch (error) {

                    console.warn(
                        "Scanner clear warning:",
                        error
                    );
                }
            }

        } catch (error) {

            console.error(
                "Stop scanner error:",
                error
            );

        } finally {

            scannerStartedRef.current =
                false;

            scannerRef.current =
                null;

            if (
                mountedRef.current
            ) {

                setScanning(false);
            }
        }
    };


    // =====================================================
    // EXTRACT QR TOKEN
    //
    // Teacher QR normally contains JSON:
    //
    // {
    //   session_id: 1,
    //   qr_token: "...",
    //   allocation_id: 1,
    //   subject_id: 1,
    //   staff_id: 1,
    //   class_id: 1
    // }
    //
    // Backend only needs qr_token.
    // =====================================================

    const extractQRToken = (
        decodedText
    ) => {

        if (
            decodedText === null ||
            decodedText === undefined
        ) {
            return null;
        }

        const rawValue =
            String(decodedText).trim();

        if (!rawValue) {
            return null;
        }


        // -------------------------------------------------
        // JSON QR
        // -------------------------------------------------

        try {

            const parsed =
                JSON.parse(rawValue);

            if (
                parsed &&
                typeof parsed === "object"
            ) {

                const token =
                    parsed.qr_token ??
                    parsed.qrToken ??
                    parsed.token;

                if (
                    token !== null &&
                    token !== undefined
                ) {

                    const extracted =
                        String(token).trim();

                    if (extracted) {
                        return extracted;
                    }
                }
            }

        } catch {
            // Not JSON.
            // Continue as raw token.
        }


        // -------------------------------------------------
        // RAW TOKEN QR
        // -------------------------------------------------

        return rawValue;
    };


    // =====================================================
    // READ ERROR RESPONSE
    // =====================================================

    const getResponseMessage = (
        data,
        fallback
    ) => {

        if (
            data &&
            typeof data === "object"
        ) {

            if (
                typeof data.message ===
                "string" &&
                data.message.trim()
            ) {

                return data.message.trim();
            }

            if (
                typeof data.error ===
                "string" &&
                data.error.trim()
            ) {

                return data.error.trim();
            }
        }

        return fallback;
    };


    // =====================================================
    // PROCESS QR CODE
    // =====================================================

    const processQRCode =
        async (
            decodedText
        ) => {

            // -------------------------------------------------
            // Prevent duplicate processing
            // -------------------------------------------------

            if (
                processingRef.current
            ) {
                return;
            }

            if (
                !decodedText ||
                !String(decodedText).trim()
            ) {
                return;
            }


            processingRef.current =
                true;


            if (
                mountedRef.current
            ) {

                setProcessing(true);

                setErrorMessage("");

                setSuccessMessage("");

                setAttendance(null);
            }


            try {

                // =============================================
                // EXTRACT QR TOKEN
                // =============================================

                const qrToken =
                    extractQRToken(
                        decodedText
                    );


                if (!qrToken) {

                    throw new Error(
                        "Invalid QR code. Please scan the latest QR code displayed by your teacher."
                    );
                }


                console.log(
                    "QR token extracted successfully."
                );


                // =============================================
                // AUTH TOKEN
                // =============================================

                const token =
                    getAuthToken();


                if (!token) {

                    throw new Error(
                        "Authentication token not found. Please login again."
                    );
                }


                // =============================================
                // STOP CAMERA
                // =============================================

                await stopScanner();


                // =============================================
                // CANCEL OLD REQUEST
                // =============================================

                if (
                    requestAbortRef.current
                ) {

                    try {

                        requestAbortRef.current.abort();

                    } catch {
                        // Ignore
                    }
                }


                // =============================================
                // NEW ABORT CONTROLLER
                // =============================================

                const controller =
                    new AbortController();

                requestAbortRef.current =
                    controller;


                const timeoutId =
                    setTimeout(
                        () => {

                            controller.abort();

                        },
                        REQUEST_TIMEOUT
                    );


                // =============================================
                // DEBUG
                // =============================================

                console.log(
                    "Sending attendance scan request:",
                    {
                        url: SCAN_URL,
                        method: "POST",
                        hasToken: Boolean(token),
                        hasQRToken: Boolean(qrToken),
                    }
                );


                // =============================================
                // SEND REQUEST
                //
                // IMPORTANT:
                // Do NOT send student_id.
                //
                // Backend gets student from:
                //
                // JWT user_id
                //       ↓
                // students.user_id
                //       ↓
                // students.student_id
                // =============================================

                let response;

                try {

                    response =
                        await fetch(
                            SCAN_URL,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    Accept:
                                        "application/json",

                                    Authorization:
                                        `Bearer ${token}`,
                                },

                                body:
                                    JSON.stringify({
                                        qr_token:
                                            qrToken,
                                    }),

                                signal:
                                    controller.signal,

                                cache:
                                    "no-store",
                            }
                        );

                } catch (
                    networkError
                ) {

                    clearTimeout(
                        timeoutId
                    );


                    console.error(
                        "Attendance network error:",
                        networkError
                    );


                    if (
                        networkError?.name ===
                        "AbortError"
                    ) {

                        throw new Error(
                            "Attendance server did not respond within 15 seconds. Please check the internet connection and try again."
                        );
                    }


                    throw new Error(
                        "Unable to connect to the attendance server. Please check your internet connection and try again."
                    );
                }


                clearTimeout(
                    timeoutId
                );


                // =============================================
                // READ RESPONSE
                // =============================================

                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";


                let data = {};


                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    try {

                        data =
                            await response.json();

                    } catch (
                        jsonError
                    ) {

                        console.error(
                            "JSON response error:",
                            jsonError
                        );

                        throw new Error(
                            `Server returned an invalid response (HTTP ${response.status}).`
                        );
                    }

                } else {

                    const text =
                        await response.text();

                    data = {
                        message:
                            text ||
                            `Server returned HTTP ${response.status}.`,
                    };
                }


                console.log(
                    "Attendance scan response:",
                    {
                        status:
                            response.status,
                        ok:
                            response.ok,
                        data,
                    }
                );


                // =============================================
                // 401
                // =============================================

                if (
                    response.status === 401
                ) {

                    throw new Error(
                        getResponseMessage(
                            data,
                            "Your login session has expired. Please login again."
                        )
                    );
                }


                // =============================================
                // 403
                // =============================================

                if (
                    response.status === 403
                ) {

                    throw new Error(
                        getResponseMessage(
                            data,
                            "You are not authorized to mark attendance."
                        )
                    );
                }


                // =============================================
                // 404
                // =============================================

                if (
                    response.status === 404
                ) {

                    throw new Error(
                        getResponseMessage(
                            data,
                            "Attendance scan API was not found on the server. Please make sure the latest backend is deployed."
                        )
                    );
                }


                // =============================================
                // 409
                // ALREADY MARKED
                // =============================================

                if (
                    response.status === 409
                ) {

                    const message =
                        getResponseMessage(
                            data,
                            "Attendance is already marked for this session."
                        );


                    if (
                        mountedRef.current
                    ) {

                        setAttendance(null);

                        setSuccessMessage("");

                        setErrorMessage(
                            message
                        );
                    }

                    return;
                }


                // =============================================
                // 400 / 422
                // =============================================

                if (
                    response.status === 400 ||
                    response.status === 422
                ) {

                    throw new Error(
                        getResponseMessage(
                            data,
                            "The QR code is invalid or expired. Please scan the latest QR code."
                        )
                    );
                }


                // =============================================
                // OTHER SERVER ERRORS
                // =============================================

                if (
                    !response.ok
                ) {

                    throw new Error(
                        getResponseMessage(
                            data,
                            `Attendance server error (HTTP ${response.status}).`
                        )
                    );
                }


                // =============================================
                // APPLICATION SUCCESS CHECK
                // =============================================

                if (
                    !data ||
                    data.success !== true
                ) {

                    throw new Error(
                        getResponseMessage(
                            data,
                            "Attendance could not be marked."
                        )
                    );
                }


                // =============================================
                // SUCCESS
                // =============================================

                console.log(
                    "Attendance marked successfully:",
                    data
                );


                if (
                    mountedRef.current
                ) {

                    setAttendance(
                        data
                    );

                    setSuccessMessage(
                        getResponseMessage(
                            data,
                            "Attendance marked successfully."
                        )
                    );

                    setErrorMessage("");
                }

            } catch (
                error
            ) {

                console.error(
                    "QR attendance error:",
                    error
                );


                if (
                    mountedRef.current
                ) {

                    setAttendance(null);

                    setSuccessMessage("");

                    setErrorMessage(
                        error?.message ||
                        "Failed to process QR code."
                    );
                }

            } finally {

                if (
                    requestAbortRef.current
                ) {

                    requestAbortRef.current =
                        null;
                }


                processingRef.current =
                    false;


                if (
                    mountedRef.current
                ) {

                    setProcessing(
                        false
                    );
                }
            }
        };


    // =====================================================
    // START SCANNER
    // =====================================================

    const startScanner =
        async () => {

            const token =
                getAuthToken();


            if (!token) {

                setErrorMessage(
                    "Authentication token not found. Please login again."
                );

                return;
            }


            if (
                scannerStartedRef.current
            ) {
                return;
            }


            if (
                processingRef.current
            ) {
                return;
            }


            try {

                setErrorMessage("");

                setSuccessMessage("");

                setAttendance(null);


                const readerElement =
                    document.getElementById(
                        "qr-reader"
                    );


                if (!readerElement) {

                    throw new Error(
                        "QR scanner container not found."
                    );
                }


                // -------------------------------------------------
                // Remove old scanner HTML
                // -------------------------------------------------

                readerElement.innerHTML =
                    "";


                // -------------------------------------------------
                // Create scanner
                // -------------------------------------------------

                let scanner =
                    new Html5Qrcode(
                        "qr-reader"
                    );


                scannerRef.current =
                    scanner;


                const qrConfig = {

                    fps: 10,

                    qrbox: {
                        width: 250,
                        height: 250,
                    },

                    aspectRatio: 1.0,

                };


                // =================================================
                // QR SUCCESS
                // =================================================

                const onScanSuccess =
                    (
                        decodedText
                    ) => {

                        if (
                            !decodedText
                        ) {
                            return;
                        }


                        if (
                            processingRef.current
                        ) {
                            return;
                        }


                        console.log(
                            "QR code detected."
                        );


                        processQRCode(
                            decodedText
                        );
                    };


                // =================================================
                // QR FAILURE
                // =================================================

                const onScanFailure =
                    () => {

                        // Normal scanning misses.
                        // Do not display an error.
                    };


                // =================================================
                // START REAR CAMERA
                // =================================================

                try {

                    await scanner.start(
                        {
                            facingMode:
                                "environment",
                        },

                        qrConfig,

                        onScanSuccess,

                        onScanFailure
                    );

                } catch (
                    rearCameraError
                ) {

                    console.warn(
                        "Rear camera unavailable. Trying front camera.",
                        rearCameraError
                    );


                    try {

                        await scanner.clear();

                    } catch {
                        // Ignore
                    }


                    scanner =
                        new Html5Qrcode(
                            "qr-reader"
                        );


                    scannerRef.current =
                        scanner;


                    await scanner.start(
                        {
                            facingMode:
                                "user",
                        },

                        qrConfig,

                        onScanSuccess,

                        onScanFailure
                    );
                }


                scannerStartedRef.current =
                    true;


                if (
                    mountedRef.current
                ) {

                    setScanning(
                        true
                    );
                }

            } catch (
                error
            ) {

                console.error(
                    "Start scanner error:",
                    error
                );


                scannerStartedRef.current =
                    false;

                scannerRef.current =
                    null;


                if (
                    mountedRef.current
                ) {

                    setScanning(
                        false
                    );
                }


                let message =
                    "Unable to access the camera.";


                const errorName =
                    error?.name || "";


                const errorText =
                    error?.message || "";


                const lowerError =
                    errorText.toLowerCase();


                if (
                    errorName ===
                    "NotAllowedError"
                ) {

                    message =
                        "Camera permission was denied. Please allow camera access and try again.";

                } else if (
                    errorName ===
                    "NotFoundError"
                ) {

                    message =
                        "No camera was found on this device.";

                } else if (
                    lowerError.includes(
                        "permission"
                    )
                ) {

                    message =
                        "Camera permission is required. Please allow camera access.";

                } else if (
                    lowerError.includes(
                        "secure context"
                    )
                ) {

                    message =
                        "Camera access requires localhost or HTTPS.";

                } else if (
                    lowerError.includes(
                        "camera"
                    )
                ) {

                    message =
                        "Unable to access the camera. Please check browser permissions.";

                } else if (
                    errorText
                ) {

                    message =
                        errorText;
                }


                if (
                    mountedRef.current
                ) {

                    setErrorMessage(
                        message
                    );
                }
            }
        };


    // =====================================================
    // SCAN AGAIN
    // =====================================================

    const handleScanAgain =
        async () => {

            if (
                processingRef.current
            ) {
                return;
            }


            await stopScanner();


            setAttendance(null);

            setSuccessMessage("");

            setErrorMessage("");

            setProcessing(false);


            setTimeout(() => {

                if (
                    mountedRef.current
                ) {

                    startScanner();
                }

            }, 300);
        };


    // =====================================================
    // COMPONENT CLEANUP
    // =====================================================

    useEffect(() => {

        mountedRef.current =
            true;


        return () => {

            mountedRef.current =
                false;


            // ---------------------------------------------
            // Cancel attendance request
            // ---------------------------------------------

            if (
                requestAbortRef.current
            ) {

                try {

                    requestAbortRef.current.abort();

                } catch {
                    // Ignore
                }
            }


            // ---------------------------------------------
            // Stop scanner
            // ---------------------------------------------

            const scanner =
                scannerRef.current;


            if (
                scanner &&
                scannerStartedRef.current
            ) {

                scanner
                    .stop()
                    .catch(() => {})
                    .finally(() => {

                        try {

                            scanner.clear();

                        } catch {
                            // Ignore
                        }
                    });
            }


            scannerRef.current =
                null;

            scannerStartedRef.current =
                false;

            processingRef.current =
                false;

        };

    }, []);


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div>

                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                    <div>

                        <div className="mb-2 flex items-center gap-2">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">

                                <FaQrcode />

                            </div>

                            <span className="text-sm font-semibold text-indigo-600">

                                Attendance

                            </span>

                        </div>


                        <h1 className="text-3xl font-bold text-slate-800">

                            Scan QR Code

                        </h1>


                        <p className="mt-2 text-slate-500">

                            Scan your teacher's QR code to mark
                            your attendance.

                        </p>

                    </div>


                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

                        <FaShieldAlt className="text-green-500" />

                        <span className="text-sm font-medium text-slate-600">

                            Secure Attendance

                        </span>

                    </div>

                </div>

            </div>


            {/* =================================================
                SUCCESS MESSAGE
            ================================================= */}

            {successMessage && (

                <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5">

                    <div className="mt-0.5 text-green-600">

                        <FaCheckCircle />

                    </div>


                    <div>

                        <p className="font-semibold text-green-800">

                            Success

                        </p>


                        <p className="mt-1 text-sm text-green-700">

                            {successMessage}

                        </p>

                    </div>

                </div>

            )}


            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {errorMessage && (

                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">

                    <div className="mt-0.5 text-red-600">

                        <FaExclamationTriangle />

                    </div>


                    <div className="flex-1">

                        <p className="font-semibold text-red-800">

                            Attendance Error

                        </p>


                        <p className="mt-1 wrap-break-word text-sm text-red-700">

                            {errorMessage}

                        </p>

                    </div>

                </div>

            )}


            {/* =================================================
                ATTENDANCE CONFIRMED
            ================================================= */}

            {attendance ? (

                <div className="mx-auto max-w-3xl">

                    <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">

                        {/* SUCCESS HEADER */}

                        <div className="border-b border-green-100 bg-green-50 px-6 py-8 text-center">

                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">

                                <FaCheckCircle
                                    size={44}
                                />

                            </div>


                            <h2 className="mt-5 text-2xl font-bold text-slate-800">

                                Attendance Marked

                            </h2>


                            <p className="mt-2 text-sm text-slate-500">

                                Your attendance has been successfully
                                recorded.

                            </p>

                        </div>


                        <div className="p-6 md:p-8">

                            {/* =================================================
                                STUDENT
                            ================================================= */}

                            {attendance.student && (

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">

                                    <div className="mb-5 flex items-center gap-3">

                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">

                                            <FaUserGraduate />

                                        </div>


                                        <div>

                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">

                                                Student

                                            </p>


                                            <p className="font-semibold text-slate-800">

                                                {attendance.student.name ||
                                                    "-"}

                                            </p>

                                        </div>

                                    </div>


                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                        <div>

                                            <p className="text-xs text-slate-400">

                                                Register Number

                                            </p>


                                            <p className="mt-1 font-semibold text-slate-700">

                                                {attendance.student.register_number ||
                                                    attendance.student.student_id ||
                                                    "-"}

                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs text-slate-400">

                                                Status

                                            </p>


                                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                                                <FaCheckCircle />

                                                {String(
                                                    attendance.attendance?.status ||
                                                    "PRESENT"
                                                ).toUpperCase()}

                                            </span>

                                        </div>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                SESSION
                            ================================================= */}

                            {attendance.session && (

                                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">

                                    <div className="mb-5 flex items-center gap-3">

                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">

                                            <FaBook />

                                        </div>


                                        <div>

                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">

                                                Subject

                                            </p>


                                            <p className="font-semibold text-slate-800">

                                                {attendance.session.subject_code ||
                                                    "-"}

                                            </p>


                                            <p className="text-sm text-slate-500">

                                                {attendance.session.subject_name ||
                                                    "-"}

                                            </p>

                                        </div>

                                    </div>


                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                        <div>

                                            <p className="text-xs text-slate-400">

                                                Staff

                                            </p>


                                            <p className="mt-1 font-medium text-slate-700">

                                                {attendance.session.staff_name ||
                                                    "-"}

                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs text-slate-400">

                                                Session

                                            </p>


                                            <p className="mt-1 font-medium text-slate-700">

                                                #
                                                {attendance.session.session_id ||
                                                    "-"}

                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs text-slate-400">

                                                Date

                                            </p>


                                            <p className="mt-1 font-medium text-slate-700">

                                                {attendance.session.session_date ||
                                                    "-"}

                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs text-slate-400">

                                                Time

                                            </p>


                                            <p className="mt-1 font-medium text-slate-700">

                                                {attendance.session.start_time ||
                                                    "-"}

                                                {" - "}

                                                {attendance.session.end_time ||
                                                    "-"}

                                            </p>

                                        </div>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                ATTENDANCE ID
                            ================================================= */}

                            {attendance.attendance && (

                                <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4">

                                    <div className="flex items-center justify-between gap-4">

                                        <span className="text-xs text-slate-400">

                                            Attendance ID

                                        </span>


                                        <span className="text-sm font-semibold text-slate-700">

                                            #
                                            {attendance.attendance.attendance_id ||
                                                "-"}

                                        </span>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                SCAN AGAIN
                            ================================================= */}

                            <button
                                type="button"
                                onClick={
                                    handleScanAgain
                                }
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                            >

                                <FaRedo />

                                Scan Another QR

                            </button>

                        </div>

                    </div>

                </div>

            ) : (

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* =================================================
                        INSTRUCTIONS
                    ================================================= */}

                    <div className="lg:col-span-1">

                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

                            <div className="mb-6 flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">

                                    <FaCamera />

                                </div>


                                <div>

                                    <h2 className="font-semibold text-slate-800">

                                        How to Scan

                                    </h2>


                                    <p className="text-xs text-slate-400">

                                        Follow these steps

                                    </p>

                                </div>

                            </div>


                            <div className="space-y-6">

                                {/* STEP 1 */}

                                <div className="flex gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">

                                        1

                                    </div>


                                    <div>

                                        <p className="text-sm font-semibold text-slate-800">

                                            Ask your teacher

                                        </p>


                                        <p className="mt-1 text-xs leading-5 text-slate-500">

                                            Ask your teacher to start
                                            an attendance session.

                                        </p>

                                    </div>

                                </div>


                                {/* STEP 2 */}

                                <div className="flex gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">

                                        2

                                    </div>


                                    <div>

                                        <p className="text-sm font-semibold text-slate-800">

                                            Start the camera

                                        </p>


                                        <p className="mt-1 text-xs leading-5 text-slate-500">

                                            Click Start Camera and
                                            allow browser camera access.

                                        </p>

                                    </div>

                                </div>


                                {/* STEP 3 */}

                                <div className="flex gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">

                                        3

                                    </div>


                                    <div>

                                        <p className="text-sm font-semibold text-slate-800">

                                            Scan the QR code

                                        </p>


                                        <p className="mt-1 text-xs leading-5 text-slate-500">

                                            Place the teacher's QR
                                            code inside the scanner.

                                        </p>

                                    </div>

                                </div>


                                {/* STEP 4 */}

                                <div className="flex gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">

                                        4

                                    </div>


                                    <div>

                                        <p className="text-sm font-semibold text-slate-800">

                                            Attendance confirmed

                                        </p>


                                        <p className="mt-1 text-xs leading-5 text-slate-500">

                                            Your attendance will be
                                            recorded automatically.

                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* SECURITY */}

                        <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

                            <div className="flex items-start gap-3">

                                <div className="text-green-500">

                                    <FaShieldAlt />

                                </div>


                                <div>

                                    <p className="text-sm font-semibold text-slate-800">

                                        Secure QR Attendance

                                    </p>


                                    <p className="mt-1 text-xs leading-5 text-slate-500">

                                        QR codes are temporary and
                                        should only be scanned during
                                        your active class session.

                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        SCANNER
                    ================================================= */}

                    <div className="lg:col-span-2">

                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

                            <div className="mb-6 text-center">

                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">

                                    <FaQrcode
                                        size={28}
                                    />

                                </div>


                                <h2 className="mt-4 text-xl font-bold text-slate-800">

                                    QR Scanner

                                </h2>


                                <p className="mt-1 text-sm text-slate-500">

                                    Position the QR code inside
                                    the scanning area.

                                </p>

                            </div>


                            {/* =================================================
                                SCANNER
                            ================================================= */}

                            <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                                <div
                                    id="qr-reader"
                                    className="min-h-72 w-full"
                                ></div>

                            </div>


                            {/* ACTIVE */}

                            {scanning &&
                                !processing && (

                                    <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">

                                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500"></span>

                                        Camera is active. Scan the QR
                                        code now.

                                    </div>

                                )}


                            {/* PROCESSING */}

                            {processing && (

                                <div className="mt-5 flex items-center justify-center gap-3 rounded-xl bg-indigo-50 p-4 text-sm font-medium text-indigo-700">

                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"></div>

                                    Verifying QR code and marking
                                    attendance...

                                </div>

                            )}


                            {/* START */}

                            {!scanning &&
                                !processing && (

                                    <button
                                        type="button"
                                        onClick={
                                            startScanner
                                        }
                                        className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                                    >

                                        <FaCamera />

                                        Start Camera

                                    </button>

                                )}


                            {/* STOP */}

                            {scanning &&
                                !processing && (

                                    <button
                                        type="button"
                                        onClick={
                                            stopScanner
                                        }
                                        className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                                    >

                                        <FaStop />

                                        Stop Camera

                                    </button>

                                )}


                            {/* FOOTER */}

                            <div className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-5 text-slate-400">

                                <FaClock className="mt-0.5 shrink-0" />

                                <span>

                                    Scan the latest QR code displayed
                                    by your teacher. QR codes may
                                    expire after a short time.

                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default StudentScanQR;