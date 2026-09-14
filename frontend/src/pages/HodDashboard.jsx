import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
    FaUserGraduate,
    FaUsers,
    FaBook,
    FaCalendarAlt,
    FaClipboardCheck,
    FaChartBar,
    FaArrowLeft,
    FaSyncAlt,
    FaCheckCircle,
    FaExclamationTriangle,
    FaGraduationCap,
    FaPlus,
    FaEdit,
    FaTrash,
    FaEye,
    FaBuilding,
} from "react-icons/fa";

// =====================================================
// API
// =====================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// =====================================================
// HOD DASHBOARD
// =====================================================

const HodDashboard = () => {
    const { department } = useParams();

    // =====================================================
    // STATE
    // =====================================================

    const [students, setStudents] = useState([]);
    const [staff, setStaff] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // =====================================================
    // USER
    // =====================================================

    const user = useMemo(() => {
        try {
            return JSON.parse(
                localStorage.getItem("user") ||
                    localStorage.getItem("currentUser") ||
                    "{}"
            );
        } catch {
            return {};
        }
    }, []);

    // =====================================================
    // TOKEN
    // =====================================================

    const token = useMemo(() => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("access_token") ||
            ""
        );
    }, []);

    // =====================================================
    // DEPARTMENT
    // =====================================================

    const departmentSlug =
        department ||
        user?.department_slug ||
        user?.departmentSlug ||
        "computer-science";

    const departmentName =
        user?.department ||
        user?.department_name ||
        user?.departmentName ||
        "Computer Science";

    // =====================================================
    // DEPARTMENT NORMALIZATION
    // =====================================================

    const normalizeDepartment = (value) => {
        if (!value) return "";

        return String(value)
            .trim()
            .toLowerCase()
            .replace(/[-_]/g, " ")
            .replace(/\s+/g, " ");
    };

    const currentDepartment = normalizeDepartment(
        departmentName
    );

    // =====================================================
    // DEPARTMENT MATCH
    // =====================================================

    const isSameDepartment = (item) => {
        const itemDepartment =
            item?.department ||
            item?.department_name ||
            item?.departmentName ||
            "";

        if (!itemDepartment) {
            return false;
        }

        return (
            normalizeDepartment(itemDepartment) ===
            currentDepartment
        );
    };

    // =====================================================
    // LOAD DASHBOARD DATA
    // =====================================================

    const loadDashboardData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const headers = {
                "Content-Type": "application/json",
                ...(token
                    ? {
                          Authorization:
                              `Bearer ${token}`,
                      }
                    : {}),
            };

            const [
                studentsResponse,
                staffResponse,
                subjectsResponse,
                classesResponse,
            ] = await Promise.all([
                fetch(`${API_BASE_URL}/students`, {
                    method: "GET",
                    headers,
                }),

                fetch(`${API_BASE_URL}/staff`, {
                    method: "GET",
                    headers,
                }),

                fetch(`${API_BASE_URL}/subjects`, {
                    method: "GET",
                    headers,
                }),

                fetch(`${API_BASE_URL}/classes`, {
                    method: "GET",
                    headers,
                }),
            ]);

            const [
                studentsData,
                staffData,
                subjectsData,
                classesData,
            ] = await Promise.all([
                studentsResponse.json(),
                staffResponse.json(),
                subjectsResponse.json(),
                classesResponse.json(),
            ]);

            // =================================================
            // STUDENTS
            // =================================================

            if (studentsData?.success) {
                setStudents(
                    Array.isArray(studentsData.students)
                        ? studentsData.students
                        : []
                );
            } else if (
                Array.isArray(studentsData)
            ) {
                setStudents(studentsData);
            } else {
                setStudents([]);
            }

            // =================================================
            // STAFF
            // =================================================

            if (staffData?.success) {
                setStaff(
                    Array.isArray(staffData.staff)
                        ? staffData.staff
                        : []
                );
            } else if (Array.isArray(staffData)) {
                setStaff(staffData);
            } else {
                setStaff([]);
            }

            // =================================================
            // SUBJECTS
            // =================================================

            if (subjectsData?.success) {
                setSubjects(
                    Array.isArray(subjectsData.subjects)
                        ? subjectsData.subjects
                        : []
                );
            } else if (
                Array.isArray(subjectsData)
            ) {
                setSubjects(subjectsData);
            } else {
                setSubjects([]);
            }

            // =================================================
            // CLASSES
            // =================================================

            if (classesData?.success) {
                setClasses(
                    Array.isArray(classesData.classes)
                        ? classesData.classes
                        : []
                );
            } else if (Array.isArray(classesData)) {
                setClasses(classesData);
            } else {
                setClasses([]);
            }
        } catch (err) {
            console.error(
                "HOD Dashboard Error:",
                err
            );

            setError(
                "Failed to load dashboard data"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadDashboardData();
    }, [departmentSlug]);

    // =====================================================
    // FILTER DEPARTMENT DATA
    // =====================================================

    const departmentStudents = useMemo(() => {
        return students.filter(isSameDepartment);
    }, [students, currentDepartment]);

    const departmentStaff = useMemo(() => {
        return staff.filter(isSameDepartment);
    }, [staff, currentDepartment]);

    const departmentSubjects = useMemo(() => {
        return subjects.filter(isSameDepartment);
    }, [subjects, currentDepartment]);

    const departmentClasses = useMemo(() => {
        return classes.filter(isSameDepartment);
    }, [classes, currentDepartment]);

    // =====================================================
    // YEAR HELPER
    // =====================================================

    const getYear = (item) => {
        const value =
            item?.year ||
            item?.academic_year_level ||
            item?.year_level ||
            item?.class_year ||
            "";

        return String(value)
            .trim()
            .toLowerCase()
            .replace("year", "")
            .trim();
    };

    // =====================================================
    // YEAR DATA
    // =====================================================

    const yearData = useMemo(() => {
        const years = {
            1: {
                students: 0,
                staff: 0,
                subjects: 0,
                classes: 0,
            },

            2: {
                students: 0,
                staff: 0,
                subjects: 0,
                classes: 0,
            },

            3: {
                students: 0,
                staff: 0,
                subjects: 0,
                classes: 0,
            },

            4: {
                students: 0,
                staff: 0,
                subjects: 0,
                classes: 0,
            },
        };

        departmentStudents.forEach((student) => {
            const year = getYear(student);

            if (years[year]) {
                years[year].students += 1;
            }
        });

        departmentStaff.forEach((member) => {
            const year = getYear(member);

            if (years[year]) {
                years[year].staff += 1;
            }
        });

        departmentSubjects.forEach((subject) => {
            const year = getYear(subject);

            if (years[year]) {
                years[year].subjects += 1;
            }
        });

        departmentClasses.forEach((classItem) => {
            const year = getYear(classItem);

            if (years[year]) {
                years[year].classes += 1;
            }
        });

        return years;
    }, [
        departmentStudents,
        departmentStaff,
        departmentSubjects,
        departmentClasses,
    ]);

    // =====================================================
    // PATH HELPERS
    // =====================================================

    const getDepartmentPath = (page) => {
        return `/hod/${departmentSlug}/${page}`;
    };

    const getYearPath = (year, page) => {
        return `/hod/${departmentSlug}/year/${year}/${page}`;
    };

    // =====================================================
    // YEAR CARDS
    // =====================================================

    const yearCards = [
        {
            key: 2,
            title: "Year 2",
            description:
                "Manage second year academic information",
            icon: <FaGraduationCap />,
        },

        {
            key: 3,
            title: "Year 3",
            description:
                "Manage third year academic information",
            icon: <FaGraduationCap />,
        },
    ];

    // =====================================================
    // MANAGEMENT CARDS
    // =====================================================

    const managementCards = [
        {
            title: "Students",
            description:
                "Manage department students",
            icon: <FaUserGraduate />,
            color: "text-blue-600",
            path: getDepartmentPath("students"),
        },

        {
            title: "Staff",
            description:
                "Manage department teaching staff",
            icon: <FaUsers />,
            color: "text-green-600",
            path: getDepartmentPath("staff"),
        },

        {
            title: "Subjects",
            description:
                "Manage department subjects",
            icon: <FaBook />,
            color: "text-purple-600",
            path: getDepartmentPath("subjects"),
        },

        {
            title: "Timetable",
            description:
                "Manage department timetable",
            icon: <FaCalendarAlt />,
            color: "text-indigo-600",
            path: getDepartmentPath("timetable"),
        },

        // =================================================
        // ATTENDANCE ADDED BACK
        // =================================================

        {
            title: "Attendance",
            description:
                "Monitor department attendance",
            icon: <FaClipboardCheck />,
            color: "text-orange-600",
            path: getDepartmentPath("attendance"),
        },
    ];

    // =====================================================
    // REPORT CARDS
    // =====================================================

    const reportCards = [
        {
            title: "Daily Attendance",
            description:
                "View daily attendance reports",
            icon: <FaClipboardCheck />,
            path: getDepartmentPath(
                "reports/daily"
            ),
        },

        {
            title: "Subject Attendance",
            description:
                "View subject-wise attendance",
            icon: <FaBook />,
            path: getDepartmentPath(
                "reports/subject"
            ),
        },

        {
            title: "Class Attendance",
            description:
                "View class attendance reports",
            icon: <FaUsers />,
            path: getDepartmentPath(
                "reports/class"
            ),
        },

        {
            title: "Student Attendance",
            description:
                "View student attendance reports",
            icon: <FaUserGraduate />,
            path: getDepartmentPath(
                "reports/student"
            ),
        },

        {
            title: "Department Report",
            description:
                "View complete department attendance",
            icon: <FaBuilding />,
            path: getDepartmentPath(
                "reports/department"
            ),
        },

        {
            title: "Attendance Percentage",
            description:
                "View attendance percentage",
            icon: <FaChartBar />,
            path: getDepartmentPath(
                "reports/percentage"
            ),
        },
    ];

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
                <div className="text-center">
                    <FaSyncAlt className="mx-auto mb-4 animate-spin text-4xl text-indigo-600" />

                    <p className="text-sm font-medium text-slate-600">
                        Loading HOD Dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                        <FaBuilding />

                        <span>
                            HOD Dashboard
                        </span>

                        <span>/</span>

                        <span className="font-medium text-indigo-600">
                            {departmentName}
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                        {departmentName}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Department overview and management
                    </p>
                </div>

                <div className="flex items-center gap-3">

                    <button
                        type="button"
                        onClick={() =>
                            loadDashboardData(true)
                        }
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FaSyncAlt
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

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                    <FaExclamationTriangle />

                    <span>{error}</span>

                </div>
            )}

            {/* =================================================
                OVERVIEW STATS
            ================================================= */}

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {/* Students */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Students
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {
                                    departmentStudents.length
                                }
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                            <FaUserGraduate />
                        </div>

                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-green-600">

                        <FaCheckCircle />

                        <span>
                            Department students
                        </span>

                    </div>

                </div>

                {/* Staff */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Staff
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {
                                    departmentStaff.length
                                }
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-xl text-green-600">
                            <FaUsers />
                        </div>

                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-green-600">

                        <FaCheckCircle />

                        <span>
                            Department staff
                        </span>

                    </div>

                </div>

                {/* Subjects */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Subjects
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {
                                    departmentSubjects.length
                                }
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-xl text-purple-600">
                            <FaBook />
                        </div>

                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-green-600">

                        <FaCheckCircle />

                        <span>
                            Department subjects
                        </span>

                    </div>

                </div>

                {/* Classes */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Classes
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {
                                    departmentClasses.length
                                }
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
                            <FaCalendarAlt />
                        </div>

                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-green-600">

                        <FaCheckCircle />

                        <span>
                            Department classes
                        </span>

                    </div>

                </div>

            </div>

            {/* =================================================
                YEAR MANAGEMENT
            ================================================= */}

            <div className="mb-8">

                <div className="mb-5 flex items-center justify-between">

                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Year-wise Management
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage academic information by year
                        </p>
                    </div>

                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                    {yearCards.map((yearCard) => {

                        const data =
                            yearData[
                                yearCard.key
                            ];

                        return (
                            <div
                                key={
                                    yearCard.key
                                }
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                            >

                                {/* Year Header */}

                                <div className="border-b border-slate-100 p-5">

                                    <div className="flex items-start justify-between">

                                        <div className="flex items-center gap-4">

                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
                                                {
                                                    yearCard.icon
                                                }
                                            </div>

                                            <div>

                                                <h3 className="font-bold text-slate-800">
                                                    {
                                                        yearCard.title
                                                    }
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {
                                                        yearCard.description
                                                    }
                                                </p>

                                            </div>

                                        </div>

                                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                                            Year{" "}
                                            {
                                                yearCard.key
                                            }
                                        </span>

                                    </div>

                                </div>

                                {/* Year Statistics */}

                                <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">

                                    <div className="bg-white p-4 text-center">

                                        <p className="text-xs text-slate-500">
                                            Students
                                        </p>

                                        <p className="mt-1 text-xl font-bold text-slate-800">
                                            {
                                                data.students
                                            }
                                        </p>

                                    </div>

                                    <div className="bg-white p-4 text-center">

                                        <p className="text-xs text-slate-500">
                                            Staff
                                        </p>

                                        <p className="mt-1 text-xl font-bold text-slate-800">
                                            {
                                                data.staff
                                            }
                                        </p>

                                    </div>

                                    <div className="bg-white p-4 text-center">

                                        <p className="text-xs text-slate-500">
                                            Subjects
                                        </p>

                                        <p className="mt-1 text-xl font-bold text-slate-800">
                                            {
                                                data.subjects
                                            }
                                        </p>

                                    </div>

                                    <div className="bg-white p-4 text-center">

                                        <p className="text-xs text-slate-500">
                                            Classes
                                        </p>

                                        <p className="mt-1 text-xl font-bold text-slate-800">
                                            {
                                                data.classes
                                            }
                                        </p>

                                    </div>

                                </div>

                                {/* Year Links */}

                                <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">

                                    <Link
                                        to={getYearPath(
                                            yearCard.key,
                                            "students"
                                        )}
                                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                    >

                                        <span className="flex items-center gap-3">
                                            <FaUserGraduate />
                                            Students
                                        </span>

                                        <FaEye className="text-xs" />

                                    </Link>

                                    <Link
                                        to={getYearPath(
                                            yearCard.key,
                                            "subjects"
                                        )}
                                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                    >

                                        <span className="flex items-center gap-3">
                                            <FaBook />
                                            Subjects
                                        </span>

                                        <FaEye className="text-xs" />

                                    </Link>

                                    <Link
                                        to={getYearPath(
                                            yearCard.key,
                                            "timetable"
                                        )}
                                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                    >

                                        <span className="flex items-center gap-3">
                                            <FaCalendarAlt />
                                            Timetable
                                        </span>

                                        <FaEye className="text-xs" />

                                    </Link>

                                    <Link
                                        to={getYearPath(
                                            yearCard.key,
                                            "attendance"
                                        )}
                                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                    >

                                        <span className="flex items-center gap-3">
                                            <FaClipboardCheck />
                                            Attendance
                                        </span>

                                        <FaEye className="text-xs" />

                                    </Link>

                                </div>

                            </div>
                        );
                    })}

                </div>

            </div>

            {/* =================================================
                DEPARTMENT MANAGEMENT
            ================================================= */}

            <div className="mb-8">

                <div className="mb-5">

                    <h2 className="text-xl font-bold text-slate-800">
                        Department Management
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage department academic resources
                    </p>

                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                    {managementCards.map(
                        (card) => (
                            <div
                                key={
                                    card.title
                                }
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >

                                <div
                                    className={`mb-4 text-2xl ${card.color}`}
                                >
                                    {
                                        card.icon
                                    }
                                </div>

                                <h3 className="font-bold text-slate-800">
                                    {
                                        card.title
                                    }
                                </h3>

                                <p className="mt-1 min-h-10 text-sm text-slate-500">
                                    {
                                        card.description
                                    }
                                </p>

                                <div className="mt-4">

                                    <Link
                                        to={
                                            card.path
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                                    >
                                        <FaEye />
                                        Manage
                                    </Link>

                                </div>

                            </div>
                        )
                    )}

                </div>

            </div>

            {/* =================================================
                REPORTS
            ================================================= */}

            <div className="mb-8">

                <div className="mb-5">

                    <h2 className="text-xl font-bold text-slate-800">
                        Attendance Reports
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        View and analyze attendance reports
                    </p>

                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    {reportCards.map(
                        (card) => (
                            <Link
                                key={
                                    card.title
                                }
                                to={
                                    card.path
                                }
                                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
                            >

                                <div className="mb-4 flex items-center justify-between">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                                        {
                                            card.icon
                                        }
                                    </div>

                                    <FaArrowLeft className="rotate-180 text-xs text-slate-300 transition group-hover:text-indigo-600" />

                                </div>

                                <h3 className="font-bold text-slate-800">
                                    {
                                        card.title
                                    }
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    {
                                        card.description
                                    }
                                </p>

                                <div className="mt-4 text-xs font-semibold text-indigo-600">
                                    View Report →
                                </div>

                            </Link>
                        )
                    )}

                </div>

            </div>

            {/* =================================================
                PERMISSION SUMMARY
            ================================================= */}

            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-lg text-green-600">
                        <FaCheckCircle />
                    </div>

                    <div>

                        <h2 className="font-bold text-slate-800">
                            Permission Summary
                        </h2>

                        <p className="text-sm text-slate-500">
                            HOD department access
                        </p>

                    </div>

                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-xl bg-slate-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaUserGraduate />
                            Students
                        </div>

                        <p className="mt-1 text-xs text-green-600">
                            Full department access
                        </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaUsers />
                            Staff
                        </div>

                        <p className="mt-1 text-xs text-green-600">
                            Full department access
                        </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaBook />
                            Subjects
                        </div>

                        <p className="mt-1 text-xs text-green-600">
                            Full department access
                        </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaChartBar />
                            Reports
                        </div>

                        <p className="mt-1 text-xs text-green-600">
                            Full reporting access
                        </p>

                    </div>

                </div>

            </div>

            {/* =================================================
                SYSTEM STATUS
            ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center justify-between">

                    <div>

                        <h2 className="font-bold text-slate-800">
                            System Status
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Department management system status
                        </p>

                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-600">

                        <span className="h-2 w-2 rounded-full bg-green-500" />

                        System Online

                    </div>

                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    <div className="rounded-xl border border-slate-100 p-4">

                        <div className="flex items-center gap-3">

                            <FaCheckCircle className="text-green-500" />

                            <div>

                                <p className="text-sm font-semibold text-slate-700">
                                    Database
                                </p>

                                <p className="text-xs text-green-600">
                                    Connected
                                </p>

                            </div>

                        </div>

                    </div>

                    <div className="rounded-xl border border-slate-100 p-4">

                        <div className="flex items-center gap-3">

                            <FaCheckCircle className="text-green-500" />

                            <div>

                                <p className="text-sm font-semibold text-slate-700">
                                    Authentication
                                </p>

                                <p className="text-xs text-green-600">
                                    Active
                                </p>

                            </div>

                        </div>

                    </div>

                    <div className="rounded-xl border border-slate-100 p-4">

                        <div className="flex items-center gap-3">

                            <FaCheckCircle className="text-green-500" />

                            <div>

                                <p className="text-sm font-semibold text-slate-700">
                                    API Server
                                </p>

                                <p className="text-xs text-green-600">
                                    Online
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default HodDashboard;