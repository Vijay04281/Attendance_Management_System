import React, { useEffect, useState } from "react";
import {
    FaBuilding,
    FaUsers,
    FaUserGraduate,
    FaBook,
    FaChartBar,
    FaArrowRight,
    FaSyncAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        departments: 0,
        students: 0,
        staff: 0,
        subjects: 0,
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // =====================================================
    // API REQUEST
    // =====================================================

    const apiRequest = async (endpoint) => {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token
                        ? {
                              Authorization: `Bearer ${token}`,
                          }
                        : {}),
                },
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                    data.error ||
                    `Request failed with status ${response.status}`
            );
        }

        return data;
    };

    // =====================================================
    // EXTRACT ARRAY
    // =====================================================

    const extractArray = (response) => {
        if (Array.isArray(response)) {
            return response;
        }

        if (!response || typeof response !== "object") {
            return [];
        }

        if (Array.isArray(response.data)) {
            return response.data;
        }

        if (Array.isArray(response.results)) {
            return response.results;
        }

        if (Array.isArray(response.rows)) {
            return response.rows;
        }

        if (Array.isArray(response.departments)) {
            return response.departments;
        }

        if (Array.isArray(response.students)) {
            return response.students;
        }

        if (Array.isArray(response.staff)) {
            return response.staff;
        }

        if (Array.isArray(response.subjects)) {
            return response.subjects;
        }

        return [];
    };

    // =====================================================
    // LOAD STATISTICS
    // =====================================================

    const loadStatistics = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            /*
             * We intentionally load the individual resources here.
             *
             * This makes the dashboard compatible with the existing
             * backend routes:
             *
             * /departments
             * /students
             * /staff
             * /subjects
             */

            const [
                departmentsResponse,
                studentsResponse,
                staffResponse,
                subjectsResponse,
            ] = await Promise.all([
                apiRequest("/departments"),
                apiRequest("/students"),
                apiRequest("/staff"),
                apiRequest("/subjects"),
            ]);

            const departments =
                extractArray(departmentsResponse);

            const students =
                extractArray(studentsResponse);

            const staff =
                extractArray(staffResponse);

            const subjects =
                extractArray(subjectsResponse);

            setStats({
                departments: departments.length,
                students: students.length,
                staff: staff.length,
                subjects: subjects.length,
            });
        } catch (error) {
            console.error(
                "Admin dashboard statistics error:",
                error
            );

            setError(
                error.message ||
                    "Unable to load dashboard statistics"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =====================================================
    // LOAD ON PAGE OPEN
    // =====================================================

    useEffect(() => {
        loadStatistics();
    }, []);

    // =====================================================
    // QUICK ACTIONS
    // =====================================================

    const quickActions = [
        {
            title: "Departments",
            description: "Manage college departments",
            icon: FaBuilding,
            path: "/admin/departments",
        },
        {
            title: "Students",
            description: "Manage student records",
            icon: FaUserGraduate,
            path: "/admin/students",
        },
        {
            title: "Staff",
            description: "Manage teaching staff",
            icon: FaUsers,
            path: "/admin/staff",
        },
        {
            title: "Subjects",
            description: "Manage subjects",
            icon: FaBook,
            path: "/admin/subjects",
        },
    ];

    // =====================================================
    // STAT CARDS
    // =====================================================

    const statCards = [
        {
            title: "Departments",
            value: stats.departments,
            description: "Total departments",
            icon: FaBuilding,
        },
        {
            title: "Students",
            value: stats.students,
            description: "Registered students",
            icon: FaUserGraduate,
        },
        {
            title: "Staff",
            value: stats.staff,
            description: "Teaching staff",
            icon: FaUsers,
        },
        {
            title: "Subjects",
            value: stats.subjects,
            description: "Available subjects",
            icon: FaBook,
        },
    ];

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="min-h-screen bg-slate-50">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="mb-8">

                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                    <div>

                        <p className="mb-1 text-sm font-medium text-indigo-600">
                            Administration
                        </p>

                        <h1 className="text-3xl font-bold text-slate-800">
                            Admin Dashboard
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage departments, students, staff and
                            subjects from one place.
                        </p>

                    </div>

                    <div className="flex items-center gap-3">

                        {/* Refresh Button */}

                        <button
                            type="button"
                            onClick={() =>
                                loadStatistics(true)
                            }
                            disabled={refreshing}
                            className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            <FaSyncAlt
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            {refreshing
                                ? "Refreshing"
                                : "Refresh"}

                        </button>

                        {/* Dashboard Icon */}

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                            <FaChartBar className="text-xl" />
                        </div>

                    </div>

                </div>

            </div>

            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                    <p className="text-sm font-medium text-red-700">
                        Dashboard data could not be loaded.
                    </p>

                    <p className="mt-1 text-xs text-red-600">
                        {error}
                    </p>

                </div>
            )}

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                {statCards.map((card) => {

                    const Icon = card.icon;

                    return (
                        <div
                            key={card.title}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                        >

                            <div className="flex items-start justify-between">

                                <div>

                                    <p className="text-sm font-medium text-slate-500">
                                        {card.title}
                                    </p>

                                    {loading ? (
                                        <div className="mt-2 h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
                                    ) : (
                                        <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                            {card.value}
                                        </h2>
                                    )}

                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <Icon className="text-lg" />
                                </div>

                            </div>

                            <p className="mt-3 text-xs text-slate-400">
                                {card.description}
                            </p>

                        </div>
                    );
                })}

            </div>

            {/* =================================================
                MANAGEMENT SECTION
            ================================================= */}

            <div className="mt-8">

                <div className="mb-4">

                    <h2 className="text-xl font-bold text-slate-800">
                        Management
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Quickly access the main administration
                        modules.
                    </p>

                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    {quickActions.map((action) => {

                        const Icon = action.icon;

                        return (
                            <button
                                key={action.title}
                                type="button"
                                onClick={() =>
                                    navigate(action.path)
                                }
                                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
                            >

                                <div className="flex items-center gap-4">

                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                                        <Icon className="text-xl" />
                                    </div>

                                    <div>

                                        <h3 className="text-base font-bold text-slate-800">
                                            {action.title}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {action.description}
                                        </p>

                                    </div>

                                </div>

                                <FaArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" />

                            </button>
                        );
                    })}

                </div>

            </div>

            {/* =================================================
                SYSTEM INFORMATION
            ================================================= */}

            <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                                <FaChartBar />
                            </div>

                            <h2 className="text-lg font-bold text-indigo-900">
                                Attendance Management System
                            </h2>

                        </div>

                        <p className="mt-3 text-sm leading-6 text-indigo-700">
                            Use the administration panel to maintain
                            the core data used throughout the
                            attendance system.
                        </p>

                    </div>

                    <div className="rounded-xl bg-white px-5 py-4 shadow-sm">

                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            System Role
                        </p>

                        <p className="mt-1 text-sm font-bold text-indigo-700">
                            Administrator
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default AdminDashboard;