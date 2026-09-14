import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { Link } from "react-router-dom";


const API_BASE_URL =
    "https://attendance-management-system-gpci.onrender.com/api";


function StudentDashboard() {

    // =====================================================
    // STATE
    // =====================================================

    const [user, setUser] = useState(null);

    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        percentage: 0,
    });

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    // Prevent overlapping requests.
    const requestInProgressRef =
        useRef(false);


    // =====================================================
    // LOAD MY ATTENDANCE
    // =====================================================
    //
    // IMPORTANT FIX:
    //
    // OLD:
    //
    // /attendance/student/${user.user_id}
    //
    // PROBLEM:
    //
    // user_id != student_id
    //
    // NEW:
    //
    // /attendance/my
    //
    // Backend resolves:
    //
    // JWT user_id
    //      ↓
    // students.user_id
    //      ↓
    // students.student_id
    //
    // =====================================================

    const loadAttendanceStats =
        useCallback(
            async (showLoading = false) => {

                if (
                    requestInProgressRef.current
                ) {
                    return;
                }

                requestInProgressRef.current =
                    true;

                try {

                    if (showLoading) {
                        setLoading(true);
                    }

                    setError("");

                    const token =
                        localStorage.getItem(
                            "token"
                        );

                    if (!token) {
                        setError(
                            "Login session expired. Please login again."
                        );

                        return;
                    }


                    const response =
                        await fetch(
                            `${API_BASE_URL}/attendance/my`,
                            {
                                method: "GET",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,

                                    "Content-Type":
                                        "application/json",
                                },

                                cache: "no-store",
                            }
                        );


                    let data = {};

                    try {
                        data =
                            await response.json();
                    } catch {
                        data = {};
                    }


                    console.log(
                        "My attendance response:",
                        data
                    );


                    if (!response.ok) {
                        throw new Error(
                            data?.message ||
                                "Failed to load attendance."
                        );
                    }


                    if (
                        data?.success === false
                    ) {
                        throw new Error(
                            data?.message ||
                                "Unable to load attendance."
                        );
                    }


                    // =================================================
                    // GET RECORDS
                    // =================================================

                    const records =
                        Array.isArray(
                            data?.attendance
                        )
                            ? data.attendance
                            : Array.isArray(
                                  data?.records
                              )
                            ? data.records
                            : Array.isArray(
                                  data?.attendance_records
                              )
                            ? data.attendance_records
                            : [];


                    // =================================================
                    // PRESENT
                    // =================================================

                    const present =
                        records.filter(
                            (record) =>
                                String(
                                    record?.status ||
                                        ""
                                )
                                    .trim()
                                    .toUpperCase() ===
                                "PRESENT"
                        ).length;


                    // =================================================
                    // LATE
                    // =================================================

                    const late =
                        records.filter(
                            (record) =>
                                String(
                                    record?.status ||
                                        ""
                                )
                                    .trim()
                                    .toUpperCase() ===
                                "LATE"
                        ).length;


                    // =================================================
                    // ABSENT
                    // =================================================

                    const absent =
                        records.filter(
                            (record) =>
                                String(
                                    record?.status ||
                                        ""
                                )
                                    .trim()
                                    .toUpperCase() ===
                                "ABSENT"
                        ).length;


                    // =================================================
                    // TOTAL
                    // =================================================

                    const backendTotal =
                        Number(
                            data?.total ??
                                data?.total_students ??
                                data?.summary?.total ??
                                data?.summary
                                    ?.total_students
                        );


                    const total =
                        Number.isFinite(
                            backendTotal
                        ) &&
                        backendTotal >= 0
                            ? backendTotal
                            : records.length;


                    // =================================================
                    // ATTENDED
                    //
                    // PRESENT + LATE
                    // =================================================

                    const attended =
                        present + late;


                    // =================================================
                    // PERCENTAGE
                    // =================================================

                    const backendPercentage =
                        Number(
                            data?.percentage
                        );


                    const percentage =
                        Number.isFinite(
                            backendPercentage
                        ) &&
                        backendPercentage >= 0
                            ? backendPercentage
                            : total > 0
                            ? Number(
                                  (
                                      (attended /
                                          total) *
                                      100
                                  ).toFixed(1)
                              )
                            : 0;


                    // =================================================
                    // UPDATE
                    // =================================================

                    setStats({
                        total,
                        present,
                        late,
                        absent,
                        percentage:
                            Math.min(
                                Math.max(
                                    percentage,
                                    0
                                ),
                                100
                            ),
                    });

                } catch (err) {

                    console.error(
                        "Attendance stats error:",
                        err
                    );

                    setError(
                        err?.message ||
                            "Unable to load attendance."
                    );

                } finally {

                    requestInProgressRef.current =
                        false;

                    if (showLoading) {
                        setLoading(false);
                    }
                }
            },
            []
        );


    // =====================================================
    // LOAD USER
    // =====================================================

    useEffect(() => {

        const savedUser =
            localStorage.getItem(
                "user"
            );


        if (!savedUser) {

            setError(
                "Student information not found. Please login again."
            );

            setLoading(false);

            return;
        }


        try {

            const userData =
                JSON.parse(
                    savedUser
                );

            setUser(userData);

            // -------------------------------------------------
            // Load attendance using JWT.
            //
            // We intentionally DO NOT pass user_id.
            // -------------------------------------------------

            loadAttendanceStats(true);

        } catch (err) {

            console.error(
                "Invalid user data:",
                err
            );

            setError(
                "Unable to read student information."
            );

            setLoading(false);
        }

    }, [loadAttendanceStats]);


    // =====================================================
    // AUTO REFRESH
    // =====================================================
    //
    // Every 2 seconds:
    //
    // Student scans QR
    //       ↓
    // Backend inserts attendance
    //       ↓
    // /attendance/my
    //       ↓
    // Student Dashboard updates
    //
    // =====================================================

    useEffect(() => {

        const intervalId =
            setInterval(() => {

                loadAttendanceStats(
                    false
                );

            }, 2000);


        return () => {
            clearInterval(
                intervalId
            );
        };

    }, [loadAttendanceStats]);


    // =====================================================
    // REFRESH WHEN TAB BECOMES VISIBLE
    // =====================================================

    useEffect(() => {

        const handleVisibilityChange =
            () => {

                if (
                    document.visibilityState ===
                    "visible"
                ) {

                    loadAttendanceStats(
                        false
                    );
                }
            };


        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );


        return () => {

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

        };

    }, [loadAttendanceStats]);


    // =====================================================
    // REFRESH ON WINDOW FOCUS
    // =====================================================

    useEffect(() => {

        const handleFocus =
            () => {

                loadAttendanceStats(
                    false
                );
            };


        window.addEventListener(
            "focus",
            handleFocus
        );


        return () => {

            window.removeEventListener(
                "focus",
                handleFocus
            );

        };

    }, [loadAttendanceStats]);


    // =====================================================
    // MANUAL REFRESH
    // =====================================================

    const handleRefresh =
        () => {

            loadAttendanceStats(
                true
            );
        };


    // =====================================================
    // VALUES
    // =====================================================

    const attendancePercentage =
        Number(
            stats.percentage
        ) || 0;


    const attendanceStatus =
        attendancePercentage >= 75
            ? "Good attendance"
            : "Below 75%";


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="space-y-8">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                <div>

                    <h1 className="text-3xl font-bold text-slate-800">
                        Student Dashboard
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Welcome back,{" "}

                        <span className="font-semibold text-slate-700">
                            {user?.username ||
                                "Student"}
                        </span>
                    </p>

                </div>


                <div className="flex items-center gap-3">

                    <button
                        type="button"
                        onClick={
                            handleRefresh
                        }
                        disabled={loading}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>


                    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">

                            {user?.username
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}

                        </div>


                        <div>

                            <p className="font-semibold text-slate-800">
                                {user?.username ||
                                    "Student"}
                            </p>

                            <p className="text-xs font-medium text-slate-500">
                                STUDENT
                            </p>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">

                    <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                            !
                        </div>


                        <div>

                            <p className="font-semibold text-red-700">
                                Unable to load attendance
                            </p>

                            <p className="mt-1 text-sm text-red-600">
                                {error}
                            </p>

                        </div>

                    </div>

                </div>
            )}


            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">


                {/* ATTENDANCE */}

                <div className="rounded-2xl bg-white p-6 shadow-sm">

                    <div className="flex items-start justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Attendance
                            </p>

                            <h2 className="mt-3 text-3xl font-bold text-indigo-600">
                                {loading
                                    ? "..."
                                    : `${attendancePercentage}%`}
                            </h2>

                        </div>

                        <div className="rounded-xl bg-indigo-100 px-3 py-2 text-xl">
                            📊
                        </div>

                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                        Overall attendance
                    </p>

                </div>


                {/* PRESENT */}

                <div className="rounded-2xl bg-white p-6 shadow-sm">

                    <div className="flex items-start justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Present
                            </p>

                            <h2 className="mt-3 text-3xl font-bold text-green-600">
                                {loading
                                    ? "..."
                                    : stats.present}
                            </h2>

                        </div>

                        <div className="rounded-xl bg-green-100 px-3 py-2 text-xl">
                            ✓
                        </div>

                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                        Classes attended
                    </p>

                </div>


                {/* LATE */}

                <div className="rounded-2xl bg-white p-6 shadow-sm">

                    <div className="flex items-start justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Late
                            </p>

                            <h2 className="mt-3 text-3xl font-bold text-yellow-600">
                                {loading
                                    ? "..."
                                    : stats.late}
                            </h2>

                        </div>

                        <div className="rounded-xl bg-yellow-100 px-3 py-2 text-xl">
                            ⏰
                        </div>

                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                        Late attendance
                    </p>

                </div>


                {/* ABSENT */}

                <div className="rounded-2xl bg-white p-6 shadow-sm">

                    <div className="flex items-start justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Absent
                            </p>

                            <h2 className="mt-3 text-3xl font-bold text-red-600">
                                {loading
                                    ? "..."
                                    : stats.absent}
                            </h2>

                        </div>

                        <div className="rounded-xl bg-red-100 px-3 py-2 text-xl">
                            !
                        </div>

                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                        Classes missed
                    </p>

                </div>


                {/* TOTAL */}

                <div className="rounded-2xl bg-white p-6 shadow-sm">

                    <div className="flex items-start justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Total Classes
                            </p>

                            <h2 className="mt-3 text-3xl font-bold text-slate-800">
                                {loading
                                    ? "..."
                                    : stats.total}
                            </h2>

                        </div>

                        <div className="rounded-xl bg-slate-100 px-3 py-2 text-xl">
                            📚
                        </div>

                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                        Attendance records
                    </p>

                </div>

            </div>


            {/* =================================================
                ATTENDANCE PROGRESS
            ================================================= */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                    <div>

                        <h2 className="text-xl font-semibold text-slate-800">
                            Attendance Progress
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Your current overall attendance
                        </p>

                    </div>


                    <span
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            attendancePercentage >=
                            75
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {attendanceStatus}
                    </span>

                </div>


                <div className="mt-6">

                    <div className="mb-2 flex items-center justify-between text-sm">

                        <span className="font-medium text-slate-600">
                            Attendance
                        </span>

                        <span className="font-bold text-slate-800">
                            {attendancePercentage}%
                        </span>

                    </div>


                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                attendancePercentage >=
                                75
                                    ? "bg-green-500"
                                    : "bg-red-500"
                            }`}
                            style={{
                                width: `${Math.min(
                                    attendancePercentage,
                                    100
                                )}%`,
                            }}
                        />

                    </div>


                    <div className="mt-2 flex justify-between text-xs text-slate-400">

                        <span>
                            0%
                        </span>

                        <span>
                            75% required
                        </span>

                        <span>
                            100%
                        </span>

                    </div>

                </div>

            </div>


            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div>

                    <h2 className="text-xl font-semibold text-slate-800">
                        Quick Actions
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Quickly access student
                        features
                    </p>

                </div>


                <div className="mt-6 grid gap-4 md:grid-cols-3">

                    <Link
                        to="/student/scan-qr"
                        className="rounded-xl bg-indigo-600 px-6 py-4 text-center font-medium text-white transition hover:bg-indigo-700"
                    >
                        📷 Scan QR Attendance
                    </Link>


                    <Link
                        to="/student/timetable"
                        className="rounded-xl border border-slate-200 px-6 py-4 text-center font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        📅 View Timetable
                    </Link>


                    <Link
                        to="/student/attendance"
                        className="rounded-xl border border-slate-200 px-6 py-4 text-center font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        📊 View Attendance
                    </Link>

                </div>

            </div>


            {/* =================================================
                ATTENDANCE SUMMARY
            ================================================= */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                    <div>

                        <h2 className="text-xl font-semibold text-slate-800">
                            Attendance Summary
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Detailed overview of
                            your attendance
                        </p>

                    </div>


                    <Link
                        to="/student/attendance"
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                        View full attendance →
                    </Link>

                </div>


                <div className="mt-6 overflow-x-auto">

                    <table className="w-full">

                        <tbody>

                            <tr className="border-b">

                                <td className="py-4 font-medium text-slate-700">
                                    Total Classes
                                </td>

                                <td className="py-4 text-right font-semibold text-slate-800">
                                    {loading
                                        ? "..."
                                        : stats.total}
                                </td>

                            </tr>


                            <tr className="border-b">

                                <td className="py-4 font-medium text-slate-700">
                                    Present
                                </td>

                                <td className="py-4 text-right font-semibold text-green-600">
                                    {loading
                                        ? "..."
                                        : stats.present}
                                </td>

                            </tr>


                            <tr className="border-b">

                                <td className="py-4 font-medium text-slate-700">
                                    Late
                                </td>

                                <td className="py-4 text-right font-semibold text-yellow-600">
                                    {loading
                                        ? "..."
                                        : stats.late}
                                </td>

                            </tr>


                            <tr className="border-b">

                                <td className="py-4 font-medium text-slate-700">
                                    Absent
                                </td>

                                <td className="py-4 text-right font-semibold text-red-600">
                                    {loading
                                        ? "..."
                                        : stats.absent}
                                </td>

                            </tr>


                            <tr>

                                <td className="py-4 font-medium text-slate-700">
                                    Attendance
                                    Percentage
                                </td>

                                <td className="py-4 text-right font-semibold text-indigo-600">
                                    {loading
                                        ? "..."
                                        : `${attendancePercentage}%`}
                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}


export default StudentDashboard;