import React, { useEffect, useMemo, useState } from "react";

// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "https://attendance-management-system-gpci.onrender.com/api";


// =====================================================
// ICONS
// =====================================================

const Icon = ({ name, size = 20, className = "" }) => {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className,
    };

    switch (name) {
        case "users":
            return (
                <svg {...common}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            );

        case "check":
            return (
                <svg {...common}>
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            );

        case "user-x":
            return (
                <svg {...common}>
                    <circle cx="9" cy="7" r="4" />
                    <path d="M3 21v-2a4 4 0 0 1 4-4h4" />
                    <path d="m17 16 5 5" />
                    <path d="m22 16-5 5" />
                </svg>
            );

        case "percent":
            return (
                <svg {...common}>
                    <line x1="19" y1="5" x2="5" y2="19" />
                    <circle cx="6.5" cy="6.5" r="2.5" />
                    <circle cx="17.5" cy="17.5" r="2.5" />
                </svg>
            );

        case "calendar":
            return (
                <svg {...common}>
                    <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                    />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            );

        case "clock":
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                </svg>
            );

        case "book":
            return (
                <svg {...common}>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            );

        case "user":
            return (
                <svg {...common}>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
            );

        case "refresh":
            return (
                <svg {...common}>
                    <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
                    <polyline points="4 4 4 9 9 9" />
                    <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
                    <polyline points="20 20 20 15 15 15" />
                </svg>
            );

        case "alert":
            return (
                <svg {...common}>
                    <path d="M10.3 3.2 2.1 17a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            );

        case "info":
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="11" x2="12" y2="16" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
            );

        case "arrow-up":
            return (
                <svg {...common}>
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                </svg>
            );

        default:
            return null;
    }
};


// =====================================================
// HELPERS
// =====================================================

const getToday = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


const formatDate = (dateString) => {
    if (!dateString) {
        return "";
    }

    try {
        const date = new Date(
            `${dateString}T00:00:00`
        );

        return date.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            }
        );
    } catch {
        return dateString;
    }
};


const formatTime = (time) => {
    if (!time) {
        return "-";
    }

    const parts = String(time).split(":");

    if (parts.length < 2) {
        return time;
    }

    let hours = Number(parts[0]);
    const minutes = parts[1];

    const period =
        hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
};


const getPercentageClass = (percentage) => {
    const value = Number(percentage || 0);

    if (value >= 75) {
        return "text-emerald-600";
    }

    if (value >= 50) {
        return "text-amber-600";
    }

    return "text-red-600";
};


// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
    title,
    value,
    description,
    icon,
    iconBg,
    iconColor,
}) => {
    return (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-400">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
                >
                    <Icon
                        name={icon}
                        size={21}
                    />
                </div>
            </div>
        </div>
    );
};


// =====================================================
// SECTION CARD
// =====================================================

const SectionCard = ({
    title,
    description,
    icon,
    children,
    action,
}) => {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Icon
                            name={icon}
                            size={19}
                        />
                    </div>

                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-900">
                            {title}
                        </h2>

                        {description && (
                            <p className="mt-0.5 text-sm text-slate-500">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {action}
            </div>

            {children}
        </section>
    );
};


// =====================================================
// EMPTY STATE
// =====================================================

const EmptyState = ({
    icon = "info",
    title,
    description,
}) => {
    return (
        <div className="flex min-h-42.5 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Icon
                    name={icon}
                    size={22}
                />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-700">
                {title}
            </h3>

            {description && (
                <p className="mt-1 max-w-md text-sm text-slate-400">
                    {description}
                </p>
            )}
        </div>
    );
};


// =====================================================
// CLASS TEACHER DASHBOARD
// =====================================================

const ClassTeacherDashboard = () => {
    // =================================================
    // STATE
    // =================================================

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [dashboard, setDashboard] =
        useState(null);

    const [subjectAttendance, setSubjectAttendance] =
        useState([]);

    const [absentStudents, setAbsentStudents] =
        useState([]);

    const [classStaff, setClassStaff] =
        useState([]);

    const [selectedDate, setSelectedDate] =
        useState(getToday());

    const [lastUpdated, setLastUpdated] =
        useState(null);


    // =================================================
    // TOKEN
    // =================================================

    const token = useMemo(() => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            ""
        );
    }, []);


    // =================================================
    // API REQUEST
    // =================================================

    const apiRequest = async (
        endpoint
    ) => {
        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                method: "GET",

                headers: {
                    "Content-Type":
                        "application/json",

                    ...(token
                        ? {
                            Authorization:
                                `Bearer ${token}`,
                        }
                        : {}),
                },
            }
        );

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                `Request failed (${response.status})`
            );
        }

        return data;
    };


    // =================================================
    // LOAD DASHBOARD
    // =================================================

    const loadDashboard = async (
        date = selectedDate,
        showLoader = true
    ) => {
        try {
            if (showLoader) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError("");

            const [
                dashboardResponse,
                subjectResponse,
                absentResponse,
                staffResponse,
            ] = await Promise.all([
                apiRequest("/class-teacher/class"),
                apiRequest(
                    "/class-teacher/dashboard"
                ),

                apiRequest(
                    `/class-teacher/subject-attendance?date=${date}`
                ),

                apiRequest(
                    `/class-teacher/absent-students?date=${date}`
                ),

                apiRequest(
                    "/class-teacher/staff"
                ),
            ]);


            // -----------------------------------------
            // DASHBOARD
            // -----------------------------------------

            if (
                dashboardResponse?.success
            ) {
                setDashboard(
                    dashboardResponse
                );
            }


            // -----------------------------------------
            // SUBJECT ATTENDANCE
            // -----------------------------------------

            if (
                subjectResponse?.success
            ) {
                setSubjectAttendance(
                    Array.isArray(
                        subjectResponse.attendance
                    )
                        ? subjectResponse.attendance
                        : []
                );
            } else {
                setSubjectAttendance([]);
            }


            // -----------------------------------------
            // ABSENT STUDENTS
            // -----------------------------------------

            if (
                absentResponse?.success
            ) {
                setAbsentStudents(
                    Array.isArray(
                        absentResponse.absent_students
                    )
                        ? absentResponse.absent_students
                        : []
                );
            } else {
                setAbsentStudents([]);
            }


            // -----------------------------------------
            // STAFF
            // -----------------------------------------

            if (
                staffResponse?.success
            ) {
                setClassStaff(
                    Array.isArray(
                        staffResponse.staff
                    )
                        ? staffResponse.staff
                        : []
                );
            } else {
                setClassStaff([]);
            }


            setLastUpdated(
                new Date()
            );
        } catch (err) {
            console.error(
                "Class Teacher Dashboard Error:",
                err
            );

            setError(
                err?.message ||
                "Failed to load dashboard"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {
        loadDashboard(
            selectedDate,
            true
        );
    }, []);


    // =================================================
    // DATE CHANGE
    // =================================================

    const handleDateChange = async (
        event
    ) => {
        const date =
            event.target.value;

        setSelectedDate(date);

        await loadDashboard(
            date,
            false
        );
    };


    // =================================================
    // REFRESH
    // =================================================

    const handleRefresh = async () => {
        await loadDashboard(
            selectedDate,
            false
        );
    };


    // =================================================
    // DATA
    // =================================================

    const teacher =
        dashboard?.teacher || {};

    const classInfo =
        dashboard?.class || {};

    const statistics =
        dashboard?.statistics || {};

    const sessions =
        Array.isArray(
            dashboard?.sessions_today
        )
            ? dashboard.sessions_today
            : [];


    const totalStudents =
        Number(
            statistics.total_students || 0
        );

    const presentStudents =
        Number(
            statistics.present_students || 0
        );

    const absentStudentsCount =
        Number(
            statistics.absent_students || 0
        );

    const attendancePercentage =
        Number(
            statistics.attendance_percentage || 0
        );

    const sessionsToday =
        Number(
            statistics.sessions_today ||
            sessions.length ||
            0
        );


    // =================================================
    // LOADING
    // =================================================

    if (
        loading &&
        !dashboard
    ) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-6">

                    <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {Array.from(
                            { length: 5 }
                        ).map((_, index) => (
                            <div
                                key={index}
                                className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
                            />
                        ))}
                    </div>

                    <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />

                    <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />

                    <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
                </div>
            </div>
        );
    }


    // =================================================
    // ERROR
    // =================================================

    if (
        error &&
        !dashboard
    ) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl">
                    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <Icon
                                name="alert"
                                size={25}
                            />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold text-slate-900">
                            Unable to load dashboard
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                loadDashboard(
                                    selectedDate,
                                    true
                                )
                            }
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            <Icon
                                name="refresh"
                                size={17}
                            />

                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="overflow-hidden rounded-2xl bg-linear-to-r from-indigo-600 via-indigo-700 to-violet-700 shadow-lg">
                    <div className="px-5 py-6 sm:px-7 sm:py-7">

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                            {/* LEFT */}
                            <div className="flex min-w-0 items-center gap-4">

                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white ring-1 ring-white/20">
                                    {String(
                                        teacher.username ||
                                        "T"
                                    )
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-xl font-bold text-white sm:text-2xl">
                                            Class Teacher Dashboard
                                        </h1>

                                        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                                            TEACHER
                                        </span>
                                    </div>

                                    <p className="mt-1 text-sm text-indigo-100">
                                        Welcome,{" "}
                                        <span className="font-semibold text-white">
                                            {teacher.username ||
                                                "Teacher"}
                                        </span>
                                    </p>
                                </div>
                            </div>


                            {/* RIGHT */}
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-92">

                                <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200">
                                        Department
                                    </p>

                                    <p className="mt-1 truncate text-sm font-semibold text-white">
                                        {classInfo.department_name ||
                                            "-"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200">
                                        Year
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-white">
                                        {classInfo.year ||
                                            "-"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200">
                                        Section
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-white">
                                        {classInfo.section ||
                                            "-"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200">
                                        Academic Year
                                    </p>

                                    <p className="mt-1 truncate text-sm font-semibold text-white">
                                        {classInfo.academic_year ||
                                            "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* =================================================
                    DATE FILTER
                ================================================= */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Attendance Date
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Select a date to view attendance and absentees
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                            <label
                                htmlFor="attendance-date"
                                className="text-sm font-medium text-slate-600"
                            >
                                Date
                            </label>

                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <Icon
                                        name="calendar"
                                        size={17}
                                    />
                                </div>

                                <input
                                    id="attendance-date"
                                    type="date"
                                    value={
                                        selectedDate
                                    }
                                    onChange={
                                        handleDateChange
                                    }
                                    className="h-11 rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleRefresh
                                }
                                disabled={
                                    refreshing
                                }
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Icon
                                    name="refresh"
                                    size={17}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                Refresh
                            </button>
                        </div>
                    </div>

                    {lastUpdated && (
                        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                            Last updated{" "}
                            {lastUpdated.toLocaleTimeString(
                                [],
                                {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }
                            )}
                        </div>
                    )}
                </div>


                {/* =================================================
                    ERROR ALERT
                ================================================= */}

                {error && dashboard && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <Icon
                            name="alert"
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="min-w-0">
                            <p className="font-semibold">
                                Dashboard warning
                            </p>

                            <p className="mt-0.5">
                                {error}
                            </p>
                        </div>
                    </div>
                )}


                {/* =================================================
                    STAT CARDS
                ================================================= */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    <StatCard
                        title="Total Students"
                        value={
                            totalStudents
                        }
                        description="Students in your class"
                        icon="users"
                        iconBg="bg-indigo-50"
                        iconColor="text-indigo-600"
                    />

                    <StatCard
                        title="Present"
                        value={
                            presentStudents
                        }
                        description="Students present"
                        icon="check"
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                    />

                    <StatCard
                        title="Absent"
                        value={
                            absentStudentsCount
                        }
                        description="Students absent"
                        icon="user-x"
                        iconBg="bg-red-50"
                        iconColor="text-red-600"
                    />

                    <StatCard
                        title="Attendance %"
                        value={`${attendancePercentage.toFixed(1)}%`}
                        description="Class attendance"
                        icon="percent"
                        iconBg="bg-violet-50"
                        iconColor="text-violet-600"
                    />

                    <StatCard
                        title="Sessions Today"
                        value={
                            sessionsToday
                        }
                        description="Attendance sessions"
                        icon="clock"
                        iconBg="bg-amber-50"
                        iconColor="text-amber-600"
                    />
                </div>


                {/* =================================================
                    TODAY'S SESSIONS
                ================================================= */}

                <SectionCard
                    title="Today's Attendance Sessions"
                    description="Attendance sessions conducted for your class today"
                    icon="clock"
                >
                    {sessions.length === 0 ? (
                        <EmptyState
                            icon="clock"
                            title="No attendance sessions today"
                            description="Attendance sessions conducted for your class will appear here."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-92 text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">
                                            Subject
                                        </th>

                                        <th className="px-6 py-3 font-semibold">
                                            Staff
                                        </th>

                                        <th className="px-6 py-3 font-semibold">
                                            Date
                                        </th>

                                        <th className="px-6 py-3 font-semibold">
                                            Time
                                        </th>

                                        <th className="px-6 py-3 text-right font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {sessions.map(
                                        (
                                            session,
                                            index
                                        ) => (
                                            <tr
                                                key={[
                                                    session?.session_id ||
                                                        "session",
                                                    index,
                                                ].join(
                                                    "-"
                                                )}
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {session?.subject_name ||
                                                                "-"}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {session?.subject_code ||
                                                                "-"}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-slate-700">
                                                        {session?.staff_name ||
                                                            "-"}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        {session?.staff_code ||
                                                            "-"}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                    {session?.session_date ||
                                                        selectedDate}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                    {formatTime(
                                                        session?.start_time
                                                    )}{" "}
                                                    -{" "}
                                                    {formatTime(
                                                        session?.end_time
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        {session?.status ||
                                                            "ACTIVE"}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>


                {/* =================================================
                    SUBJECT-WISE ATTENDANCE
                ================================================= */}

                <SectionCard
                    title="Subject-wise Attendance"
                    description={`Attendance for ${formatDate(
                        selectedDate
                    )}`}
                    icon="book"
                    action={
                        <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                            {
                                subjectAttendance.length
                            }{" "}
                            subjects
                        </span>
                    }
                >
                    {subjectAttendance.length ===
                    0 ? (
                        <EmptyState
                            icon="book"
                            title="No subject attendance found"
                            description="Attendance data for the selected date will appear here."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-92 table-fixed text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="w-[23%] px-6 py-3 font-semibold">
                                            Subject
                                        </th>

                                        <th className="w-[13%] px-6 py-3 font-semibold">
                                            Code
                                        </th>

                                        <th className="w-[22%] px-6 py-3 font-semibold">
                                            Staff
                                        </th>

                                        <th className="w-[10%] px-6 py-3 text-center font-semibold">
                                            Present
                                        </th>

                                        <th className="w-[10%] px-6 py-3 text-center font-semibold">
                                            Absent
                                        </th>

                                        <th className="w-[10%] px-6 py-3 text-center font-semibold">
                                            Sessions
                                        </th>

                                        <th className="w-[12%] px-6 py-3 text-right font-semibold">
                                            Attendance
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {subjectAttendance.map(
                                        (
                                            subject,
                                            index
                                        ) => {
                                            const percentage =
                                                Number(
                                                    subject?.attendance_percentage ||
                                                        0
                                                );

                                            const subjectKey =
                                                [
                                                    subject?.subject_id ||
                                                        "subject",
                                                    subject?.staff_id ||
                                                        "staff",
                                                    index,
                                                ].join(
                                                    "-"
                                                );

                                            return (
                                                <tr
                                                    key={`subject-${subjectKey}`}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-6 py-4">
                                                        <p className="truncate font-semibold text-slate-800">
                                                            {subject?.subject_name ||
                                                                "-"}
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                                            {subject?.subject_code ||
                                                                "-"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <p className="truncate font-medium text-slate-700">
                                                            {subject?.staff_name ||
                                                                "-"}
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-semibold text-emerald-600">
                                                            {Number(
                                                                subject?.present_students ||
                                                                    0
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-semibold text-red-600">
                                                            {Number(
                                                                subject?.absent_students ||
                                                                    0
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-semibold text-slate-700">
                                                            {Number(
                                                                subject?.sessions_count ||
                                                                    0
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        <span
                                                            className={`font-bold ${getPercentageClass(
                                                                percentage
                                                            )}`}
                                                        >
                                                            {percentage.toFixed(
                                                                1
                                                            )}
                                                            %
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>


                {/* =================================================
                    ABSENT STUDENTS
                ================================================= */}

                <SectionCard
                    title="Absent Students"
                    description={`Students marked absent for ${formatDate(
                        selectedDate
                    )}`}
                    icon="user-x"
                    action={
                        absentStudents.length >
                        0 ? (
                            <span className="inline-flex w-fit rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                                {
                                    absentStudents.length
                                }{" "}
                                absent
                            </span>
                        ) : null
                    }
                >
                    {absentStudents.length ===
                    0 ? (
                        <EmptyState
                            icon="check"
                            title="No absent students"
                            description="All students are present or attendance has not been closed yet."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-92 text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">
                                            Register No.
                                        </th>

                                        <th className="px-6 py-3 font-semibold">
                                            Student Name
                                        </th>

                                        <th className="px-6 py-3 font-semibold">
                                            Subject
                                        </th>

                                        <th className="px-6 py-3 font-semibold">
                                            Staff
                                        </th>

                                        <th className="px-6 py-3 font-semibold">
                                            Time
                                        </th>

                                        <th className="px-6 py-3 text-right font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {absentStudents.map(
                                        (
                                            student,
                                            index
                                        ) => {
                                            const absentKey =
                                                [
                                                    student?.attendance_id ||
                                                        "attendance",
                                                    student?.session_id ||
                                                        "session",
                                                    student?.student_id ||
                                                        "student",
                                                    index,
                                                ].join(
                                                    "-"
                                                );

                                            return (
                                                <tr
                                                    key={`absent-${absentKey}`}
                                                    className="transition hover:bg-red-50/30"
                                                >
                                                    <td className="px-6 py-4 font-medium text-slate-700">
                                                        {student?.register_number ||
                                                            "-"}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-slate-800">
                                                            {student?.student_name ||
                                                                "-"}
                                                        </p>

                                                        {student?.email && (
                                                            <p className="mt-0.5 text-xs text-slate-400">
                                                                {student.email}
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-slate-700">
                                                            {student?.subject_name ||
                                                                "-"}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {student?.subject_code ||
                                                                "-"}
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-slate-700">
                                                            {student?.staff_name ||
                                                                "-"}
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                        {formatTime(
                                                            student?.start_time
                                                        )}{" "}
                                                        -{" "}
                                                        {formatTime(
                                                            student?.end_time
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                                            ABSENT
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>


                {/* =================================================
    STAFF HANDLING CLASS
================================================= */}

<SectionCard
    title="Staff Handling Class"
    description="Subject staff assigned to your class"
    icon="users"
    action={
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {classStaff.length}{" "}
            assignments
        </span>
    }
>
    {classStaff.length === 0 ? (
        <EmptyState
            icon="users"
            title="No staff assigned"
            description="Subject staff assigned to your class will appear here."
        />
    ) : (
        <div className="overflow-x-auto">
            <table className="w-full min-w-92 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-6 py-3 font-semibold">
                            Staff Name
                        </th>

                        <th className="px-6 py-3 font-semibold">
                            Staff Code
                        </th>

                        <th className="px-6 py-3 font-semibold">
                            Department
                        </th>

                        <th className="px-6 py-3 font-semibold">
                            Subject
                        </th>

                        <th className="px-6 py-3 font-semibold">
                            Subject Code
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                    {classStaff.map(
                        (staff, index) => {
                            // -----------------------------------------
                            // STAFF NAME
                            //
                            // Backend currently returns `name`.
                            // Some responses may return `staff_name`.
                            // Support both.
                            // -----------------------------------------
                            const staffName =
                                staff?.staff_name ||
                                staff?.name ||
                                staff?.staffName ||
                                staff?.full_name ||
                                staff?.fullName ||
                                "Name Not Available";

                            // -----------------------------------------
                            // DEPARTMENT
                            //
                            // Backend returns `department_name`.
                            // -----------------------------------------
                            const departmentName =
                                staff?.department_name ||
                                staff?.department ||
                                staff?.departmentName ||
                                classInfo?.department_name ||
                                "-";

                            const staffKey = [
                                staff?.staff_id ||
                                    "staff",
                                staff?.subject_id ||
                                    "subject",
                                index,
                            ].join("-");

                            return (
                                <tr
                                    key={`staff-${staffKey}`}
                                    className="transition hover:bg-slate-50"
                                >
                                    {/* STAFF NAME */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                                                {String(
                                                    staffName
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800">
                                                    {staffName}
                                                </p>

                                                {staff?.email && (
                                                    <p className="mt-0.5 truncate text-xs text-slate-400">
                                                        {staff.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* STAFF CODE */}
                                    <td className="px-6 py-4 font-medium text-slate-600">
                                        {staff?.staff_code ||
                                            "-"}
                                    </td>

                                    {/* DEPARTMENT */}
                                    <td className="px-6 py-4 text-slate-600">
                                        {departmentName}
                                    </td>

                                    {/* SUBJECT */}
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-slate-700">
                                            {staff?.subject_name ||
                                                "-"}
                                        </span>
                                    </td>

                                    {/* SUBJECT CODE */}
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                            {staff?.subject_code ||
                                                "-"}
                                        </span>
                                    </td>
                                </tr>
                            );
                        }
                    )}
                </tbody>
            </table>
        </div>
    )}
</SectionCard>

                {/* =================================================
                    BOTTOM OVERVIEW
                ================================================= */}

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

                    {/* =============================================
                        CLASS ATTENDANCE
                    ============================================= */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Icon
                                    name="percent"
                                    size={19}
                                />
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-slate-900">
                                    Class Attendance
                                </h2>

                                <p className="text-sm text-slate-500">
                                    Current attendance rate
                                </p>
                            </div>
                        </div>


                        <div className="mt-7 flex items-end justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Attendance
                                </p>

                                <p
                                    className={`mt-1 text-4xl font-bold tracking-tight ${getPercentageClass(
                                        attendancePercentage
                                    )}`}
                                >
                                    {attendancePercentage.toFixed(
                                        1
                                    )}
                                    %
                                </p>
                            </div>

                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                                    <Icon
                                        name="arrow-up"
                                        size={22}
                                        className="text-indigo-600"
                                    />
                                </div>
                            </div>
                        </div>


                        <div className="mt-6">
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                                    style={{
                                        width: `${Math.min(
                                            Math.max(
                                                attendancePercentage,
                                                0
                                            ),
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>


                        <div className="mt-5 grid grid-cols-2 gap-3">

                            <div className="rounded-xl bg-emerald-50 p-3">
                                <p className="text-xs font-medium text-emerald-600">
                                    Present
                                </p>

                                <p className="mt-1 text-lg font-bold text-emerald-700">
                                    {
                                        presentStudents
                                    }
                                </p>
                            </div>

                            <div className="rounded-xl bg-red-50 p-3">
                                <p className="text-xs font-medium text-red-600">
                                    Absent
                                </p>

                                <p className="mt-1 text-lg font-bold text-red-700">
                                    {
                                        absentStudentsCount
                                    }
                                </p>
                            </div>
                        </div>
                    </div>


                    {/* =============================================
                        CLASS OVERVIEW
                    ============================================= */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <Icon
                                    name="users"
                                    size={19}
                                />
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-slate-900">
                                    Class Overview
                                </h2>

                                <p className="text-sm text-slate-500">
                                    Your assigned class
                                </p>
                            </div>
                        </div>


                        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">

                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Class
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {classInfo.year ||
                                        "-"}{" "}
                                    -{" "}
                                    {classInfo.section ||
                                        "-"}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    {classInfo.department_name ||
                                        "-"}
                                </p>
                            </div>


                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Students
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {
                                        totalStudents
                                    }
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    Students enrolled
                                </p>
                            </div>


                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Academic Year
                                </p>

                                <p className="mt-2 text-lg font-bold text-slate-900">
                                    {classInfo.academic_year ||
                                        "-"}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    Current academic year
                                </p>
                            </div>


                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Semester
                                </p>

                                <p className="mt-2 text-lg font-bold text-slate-900">
                                    {classInfo.semester ||
                                        "-"}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    Current semester
                                </p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="pb-4 text-center text-xs text-slate-400">
                    Attendance Management System
                </div>
            </div>
        </div>
    );
};


// =====================================================
// EXPORT
// =====================================================

export default ClassTeacherDashboard;