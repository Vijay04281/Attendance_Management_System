import React, { useEffect, useMemo, useState } from "react";

// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "/api";


// =====================================================
// ICON
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

        case "search":
            return (
                <svg {...common}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
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

        case "mail":
            return (
                <svg {...common}>
                    <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                    />
                    <polyline points="3 7 12 13 21 7" />
                </svg>
            );

        case "graduation":
            return (
                <svg {...common}>
                    <path d="m2 10 10-5 10 5-10 5-10-5Z" />
                    <path d="M6 12.5V17c3 2 9 2 12 0v-4.5" />
                    <path d="M22 10v6" />
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

        case "user":
            return (
                <svg {...common}>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
            );

        default:
            return null;
    }
};


// =====================================================
// CLASS TEACHER STUDENTS
// =====================================================

const ClassTeacherStudents = () => {

    // =================================================
    // STATE
    // =================================================

    const [students, setStudents] =
        useState([]);

    const [classInfo, setClassInfo] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");


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

    const fetchStudents = async (
        showLoading = true
    ) => {
        try {
            if (showLoading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError("");

            const response = await fetch(
                `${API_BASE_URL}/class-teacher/students`,
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
                data =
                    await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    `Request failed (${response.status})`
                );
            }

            if (!data?.success) {
                throw new Error(
                    data?.message ||
                    "Failed to fetch students"
                );
            }

            setStudents(
                Array.isArray(data.students)
                    ? data.students
                    : []
            );

            setClassInfo(
                data.class || null
            );

        } catch (err) {
            console.error(
                "Class Teacher Students Error:",
                err
            );

            setError(
                err?.message ||
                "Failed to load students"
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
        fetchStudents(true);
    }, []);


    // =================================================
    // SEARCH
    // =================================================

    const filteredStudents =
        useMemo(() => {
            const value =
                search
                    .trim()
                    .toLowerCase();

            if (!value) {
                return students;
            }

            return students.filter(
                (student) => {
                    return (
                        String(
                            student?.register_number ||
                            ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            student?.name ||
                            ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            student?.email ||
                            ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            student?.department ||
                            ""
                        )
                            .toLowerCase()
                            .includes(value)
                    );
                }
            );
        }, [
            students,
            search,
        ]);


    // =================================================
    // LOADING
    // =================================================

    if (
        loading &&
        students.length === 0
    ) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-6">

                    <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />

                    <div className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />

                    <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm" />

                </div>
            </div>
        );
    }


    // =================================================
    // ERROR
    // =================================================

    if (
        error &&
        students.length === 0
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
                            Unable to load students
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                fetchStudents(true)
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
                    PAGE HEADER
                ================================================= */}

                <div className="overflow-hidden rounded-2xl bg-linear-to-r from-indigo-600 via-indigo-700 to-violet-700 shadow-lg">

                    <div className="px-5 py-6 sm:px-7 sm:py-7">

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                            <div className="flex items-center gap-4">

                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
                                    <Icon
                                        name="users"
                                        size={27}
                                    />
                                </div>

                                <div>
                                    <h1 className="text-xl font-bold text-white sm:text-2xl">
                                        Class Students
                                    </h1>

                                    <p className="mt-1 text-sm text-indigo-100">
                                        Students assigned to your class
                                    </p>
                                </div>

                            </div>


                            {/* CLASS INFO */}

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

                                <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200">
                                        Department
                                    </p>

                                    <p className="mt-1 truncate text-sm font-semibold text-white">
                                        {classInfo?.department_name ||
                                            "-"}
                                    </p>
                                </div>


                                <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200">
                                        Year
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-white">
                                        {classInfo?.year ||
                                            "-"}
                                    </p>
                                </div>


                                <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200">
                                        Section
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-white">
                                        {classInfo?.section ||
                                            "-"}
                                    </p>
                                </div>


                                <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-200">
                                        Students
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-white">
                                        {students.length}
                                    </p>
                                </div>

                            </div>

                        </div>

                    </div>
                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                        <Icon
                            name="alert"
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <div>
                            <p className="font-semibold">
                                Warning
                            </p>

                            <p className="mt-0.5">
                                {error}
                            </p>
                        </div>

                    </div>
                )}


                {/* =================================================
                    SEARCH / SUMMARY
                ================================================= */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* SUMMARY */}

                        <div className="flex items-center gap-4">

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Icon
                                    name="users"
                                    size={22}
                                />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Total Students
                                </p>

                                <p className="text-2xl font-bold text-slate-900">
                                    {students.length}
                                </p>
                            </div>

                        </div>


                        {/* SEARCH + REFRESH */}

                        <div className="flex flex-col gap-3 sm:flex-row">

                            <div className="relative min-w-0 sm:w-80">

                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <Icon
                                        name="search"
                                        size={18}
                                    />
                                </div>

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search students..."
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    fetchStudents(false)
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

                </div>


                {/* =================================================
                    STUDENTS TABLE
                ================================================= */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* TABLE HEADER */}

                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Icon
                                    name="graduation"
                                    size={19}
                                />
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-slate-900">
                                    Student List
                                </h2>

                                <p className="text-sm text-slate-500">
                                    All students assigned to your class
                                </p>
                            </div>

                        </div>


                        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                            {filteredStudents.length}{" "}
                            {filteredStudents.length ===
                            1
                                ? "student"
                                : "students"}
                        </span>

                    </div>


                    {/* EMPTY SEARCH */}

                    {filteredStudents.length ===
                    0 ? (
                        <div className="flex min-h-70 flex-col items-center justify-center px-6 py-12 text-center">

                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <Icon
                                    name={
                                        search
                                            ? "search"
                                            : "users"
                                    }
                                    size={25}
                                />
                            </div>

                            <h3 className="mt-4 text-sm font-semibold text-slate-700">
                                {search
                                    ? "No students found"
                                    : "No students assigned"}
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-slate-400">
                                {search
                                    ? "Try changing your search term."
                                    : "Students assigned to your class will appear here."}
                            </p>

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch(
                                            ""
                                        )
                                    }
                                    className="mt-4 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                    Clear Search
                                </button>
                            )}

                        </div>
                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-225 text-left text-sm">

                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">

                                    <tr>

                                        <th className="w-[15%] px-6 py-3 font-semibold">
                                            Register Number
                                        </th>

                                        <th className="w-[25%] px-6 py-3 font-semibold">
                                            Student
                                        </th>

                                        <th className="w-[25%] px-6 py-3 font-semibold">
                                            Email
                                        </th>

                                        <th className="w-[20%] px-6 py-3 font-semibold">
                                            Department
                                        </th>

                                        <th className="w-[10%] px-6 py-3 text-center font-semibold">
                                            Year
                                        </th>

                                        <th className="w-[10%] px-6 py-3 text-center font-semibold">
                                            Section
                                        </th>

                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-slate-100">

                                    {filteredStudents.map(
                                        (
                                            student,
                                            index
                                        ) => {

                                            const studentKey =
                                                student?.student_id ||
                                                student?.user_id ||
                                                student?.register_number ||
                                                index;

                                            return (
                                                <tr
                                                    key={`student-${studentKey}-${index}`}
                                                    className="transition hover:bg-slate-50"
                                                >

                                                    {/* REGISTER */}

                                                    <td className="px-6 py-4">

                                                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                                                            {student?.register_number ||
                                                                "-"}
                                                        </span>

                                                    </td>


                                                    {/* STUDENT */}

                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                                                                {String(
                                                                    student?.name ||
                                                                    "S"
                                                                )
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div className="min-w-0">

                                                                <p className="truncate font-semibold text-slate-800">
                                                                    {student?.name ||
                                                                        "-"}
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-slate-400">
                                                                    Student ID:{" "}
                                                                    {student?.student_id ||
                                                                        "-"}
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    {/* EMAIL */}

                                                    <td className="px-6 py-4">

                                                        {student?.email ? (
                                                            <div className="flex items-center gap-2 text-slate-600">

                                                                <Icon
                                                                    name="mail"
                                                                    size={15}
                                                                    className="shrink-0 text-slate-400"
                                                                />

                                                                <span className="truncate">
                                                                    {
                                                                        student.email
                                                                    }
                                                                </span>

                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">
                                                                Not provided
                                                            </span>
                                                        )}

                                                    </td>


                                                    {/* DEPARTMENT */}

                                                    <td className="px-6 py-4">

                                                        <span className="font-medium text-slate-600">
                                                            {student?.department ||
                                                                classInfo?.department_name ||
                                                                "-"}
                                                        </span>

                                                    </td>


                                                    {/* YEAR */}

                                                    <td className="px-6 py-4 text-center">

                                                        <span className="inline-flex min-w-8 justify-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                                                            {student?.year ||
                                                                classInfo?.year ||
                                                                "-"}
                                                        </span>

                                                    </td>


                                                    {/* SECTION */}

                                                    <td className="px-6 py-4 text-center">

                                                        <span className="inline-flex min-w-8 justify-center rounded-md bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">
                                                            {student?.section ||
                                                                classInfo?.section ||
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

                </div>


                {/* =================================================
                    FOOTER SUMMARY
                ================================================= */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Icon
                                    name="users"
                                    size={19}
                                />
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Total
                                </p>

                                <p className="text-xl font-bold text-slate-900">
                                    {students.length}
                                </p>
                            </div>

                        </div>

                    </div>


                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Icon
                                    name="graduation"
                                    size={19}
                                />
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Class
                                </p>

                                <p className="text-xl font-bold text-slate-900">
                                    {classInfo?.year ||
                                        "-"}{" "}
                                    -{" "}
                                    {classInfo?.section ||
                                        "-"}
                                </p>
                            </div>

                        </div>

                    </div>


                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <Icon
                                    name="user"
                                    size={19}
                                />
                            </div>

                            <div className="min-w-0">

                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Department
                                </p>

                                <p className="truncate text-sm font-bold text-slate-900">
                                    {classInfo?.department_name ||
                                        "-"}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>


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

export default ClassTeacherStudents;