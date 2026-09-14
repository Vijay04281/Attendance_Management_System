import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
    FaTachometerAlt,
    FaBuilding,
    FaUserGraduate,
    FaUsers,
    FaBook,
    FaCalendarAlt,
    FaClipboardCheck,
    FaChartBar,
    FaChevronDown,
    FaChevronRight,
    FaSignOutAlt,
    FaQrcode,
    FaSchool,
    FaUser,
    FaLink,
    FaUserTie,
    FaClock,
    FaDatabase,
    FaBell,
    FaHistory,
} from "react-icons/fa";

const Sidebar = () => {
    const navigate = useNavigate();

    // =====================================================
    // HOD STATE
    // =====================================================

    const [yearsOpen, setYearsOpen] = useState(true);
    const [year2Open, setYear2Open] = useState(true);
    const [year3Open, setYear3Open] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);

    // =====================================================
    // ADMIN STATE
    // =====================================================

    const [masterDataOpen, setMasterDataOpen] = useState(true);
    const [academicSetupOpen, setAcademicSetupOpen] = useState(true);
    const [attendanceOpen, setAttendanceOpen] = useState(true);
    const [systemOpen, setSystemOpen] = useState(false);

    // =====================================================
    // GET USER
    // =====================================================

    const storedUser = localStorage.getItem("user");

    let user = {};

    try {
        user = storedUser ? JSON.parse(storedUser) : {};
    } catch (error) {
        console.error("Invalid user data:", error);
        user = {};
    }

    // =====================================================
    // ROLE
    // =====================================================

    const role = String(
        user?.role ||
            user?.user_role ||
            user?.userRole ||
            ""
    )
        .trim()
        .toUpperCase();

    // =====================================================
    // DEPARTMENT
    // =====================================================

    const departmentSlug =
        user?.department_slug ||
        user?.departmentSlug ||
        "computer-science";

    const departmentName =
        user?.department ||
        user?.department_name ||
        user?.departmentName ||
        "Computer Science";

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("currentUser");

        navigate("/login", { replace: true });
    };

    // =====================================================
    // COMMON MENU LINK
    // =====================================================

    const menuLink = (
        to,
        icon,
        label,
        end = false
    ) => {
        const Icon = icon;

        return (
            <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                            ? "bg-indigo-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    }`
                }
            >
                <Icon className="text-lg" />

                <span>{label}</span>
            </NavLink>
        );
    };

    // =====================================================
    // ADMIN SUB MENU LINK
    // =====================================================

    const adminSubLink = (
        to,
        icon,
        label
    ) => {
        const Icon = icon;

        return (
            <NavLink
                to={to}
                className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        isActive
                            ? "bg-indigo-100 font-semibold text-indigo-700"
                            : "text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
                    }`
                }
            >
                <Icon className="text-sm" />

                <span>{label}</span>
            </NavLink>
        );
    };

    // =====================================================
    // HOD YEAR PAGE LINK
    // =====================================================

    const yearPageLink = (
        year,
        page,
        icon,
        label
    ) => {
        const Icon = icon;

        return (
            <NavLink
                to={`/hod/${departmentSlug}/year/${year}/${page}`}
                className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        isActive
                            ? "bg-indigo-100 font-semibold text-indigo-700"
                            : "text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
                    }`
                }
            >
                <Icon className="text-sm" />

                <span>{label}</span>
            </NavLink>
        );
    };

    // =====================================================
    // HOD SIDEBAR
    // =====================================================

    if (role === "HOD") {
        return (
            <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">

                {/* HEADER */}

                <div className="border-b border-slate-200 px-5 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                            <FaSchool className="text-xl" />
                        </div>

                        <div className="min-w-0">

                            <h1 className="text-lg font-bold text-slate-800">
                                Attendance
                            </h1>

                            <p className="text-xs text-slate-500">
                                HOD Portal
                            </p>

                        </div>

                    </div>

                </div>

                {/* DEPARTMENT INFORMATION */}

                <div className="border-b border-slate-200 px-4 py-4">

                    <div className="rounded-xl bg-indigo-50 p-3">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                <FaBuilding />
                            </div>

                            <div className="min-w-0">

                                <p className="text-xs text-slate-500">
                                    Department
                                </p>

                                <p className="truncate text-sm font-bold text-indigo-800">
                                    {departmentName}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                {/* NAVIGATION */}

                <nav className="flex-1 overflow-y-auto px-4 py-5">

                    <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Main Menu
                    </p>

                    <div className="space-y-1">

                        {menuLink(
                            `/hod/${departmentSlug}`,
                            FaTachometerAlt,
                            "Dashboard",
                            true
                        )}

                        {menuLink(
                            `/hod/${departmentSlug}/students`,
                            FaUserGraduate,
                            "Students"
                        )}

                        {menuLink(
                            `/hod/${departmentSlug}/staff`,
                            FaUsers,
                            "Staff"
                        )}

                        {menuLink(
                            `/hod/${departmentSlug}/subjects`,
                            FaBook,
                            "Subjects"
                        )}

                        {menuLink(
                            `/hod/${departmentSlug}/timetable`,
                            FaCalendarAlt,
                            "Timetable"
                        )}

                        {menuLink(
                            `/hod/${departmentSlug}/attendance`,
                            FaClipboardCheck,
                            "Attendance"
                        )}

                    </div>

                    {/* YEARS */}

                    <div className="mt-6">

                        <button
                            type="button"
                            onClick={() =>
                                setYearsOpen(!yearsOpen)
                            }
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:bg-slate-50"
                        >

                            <span>Years</span>

                            {yearsOpen ? (
                                <FaChevronDown />
                            ) : (
                                <FaChevronRight />
                            )}

                        </button>

                        {yearsOpen && (
                            <div className="mt-2 space-y-2 border-l-2 border-indigo-100 pl-3">

                                {/* YEAR 2 */}

                                <div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setYear2Open(
                                                !year2Open
                                            )
                                        }
                                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                    >

                                        <div className="flex items-center gap-3">

                                            <FaUserGraduate className="text-indigo-500" />

                                            <span>
                                                Year 2
                                            </span>

                                        </div>

                                        {year2Open ? (
                                            <FaChevronDown className="text-xs" />
                                        ) : (
                                            <FaChevronRight className="text-xs" />
                                        )}

                                    </button>

                                    {year2Open && (
                                        <div className="mt-1 ml-2 space-y-1 border-l border-slate-200 pl-2">

                                            {yearPageLink(
                                                2,
                                                "students",
                                                FaUserGraduate,
                                                "Students"
                                            )}

                                            {yearPageLink(
                                                2,
                                                "subjects",
                                                FaBook,
                                                "Subjects"
                                            )}

                                            {yearPageLink(
                                                2,
                                                "timetable",
                                                FaCalendarAlt,
                                                "Timetable"
                                            )}

                                            {yearPageLink(
                                                2,
                                                "attendance",
                                                FaClipboardCheck,
                                                "Attendance"
                                            )}

                                        </div>
                                    )}

                                </div>

                                {/* YEAR 3 */}

                                <div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setYear3Open(
                                                !year3Open
                                            )
                                        }
                                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                    >

                                        <div className="flex items-center gap-3">

                                            <FaUserGraduate className="text-indigo-500" />

                                            <span>
                                                Year 3
                                            </span>

                                        </div>

                                        {year3Open ? (
                                            <FaChevronDown className="text-xs" />
                                        ) : (
                                            <FaChevronRight className="text-xs" />
                                        )}

                                    </button>

                                    {year3Open && (
                                        <div className="mt-1 ml-2 space-y-1 border-l border-slate-200 pl-2">

                                            {yearPageLink(
                                                3,
                                                "students",
                                                FaUserGraduate,
                                                "Students"
                                            )}

                                            {yearPageLink(
                                                3,
                                                "subjects",
                                                FaBook,
                                                "Subjects"
                                            )}

                                            {yearPageLink(
                                                3,
                                                "timetable",
                                                FaCalendarAlt,
                                                "Timetable"
                                            )}

                                            {yearPageLink(
                                                3,
                                                "attendance",
                                                FaClipboardCheck,
                                                "Attendance"
                                            )}

                                        </div>
                                    )}

                                </div>

                            </div>
                        )}

                    </div>

                    {/* ATTENDANCE REPORTS */}

                    <div className="mt-6">

                        <button
                            type="button"
                            onClick={() =>
                                setReportsOpen(
                                    !reportsOpen
                                )
                            }
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:bg-slate-50"
                        >

                            <span>
                                Attendance Reports
                            </span>

                            {reportsOpen ? (
                                <FaChevronDown />
                            ) : (
                                <FaChevronRight />
                            )}

                        </button>

                        {reportsOpen && (
                            <div className="mt-2 space-y-1">

                                {menuLink(
                                    `/hod/${departmentSlug}/reports/daily`,
                                    FaChartBar,
                                    "Daily Attendance"
                                )}

                                {menuLink(
                                    `/hod/${departmentSlug}/reports/subject`,
                                    FaChartBar,
                                    "Subject Attendance"
                                )}

                                {menuLink(
                                    `/hod/${departmentSlug}/reports/class`,
                                    FaChartBar,
                                    "Class Attendance"
                                )}

                                {menuLink(
                                    `/hod/${departmentSlug}/reports/student`,
                                    FaChartBar,
                                    "Student Attendance"
                                )}

                                {menuLink(
                                    `/hod/${departmentSlug}/reports/department`,
                                    FaChartBar,
                                    "Department Attendance"
                                )}

                                {menuLink(
                                    `/hod/${departmentSlug}/reports/percentage`,
                                    FaChartBar,
                                    "Attendance Percentage"
                                )}

                            </div>
                        )}

                    </div>

                </nav>

                {/* USER / LOGOUT */}

                <div className="border-t border-slate-200 p-4">

                    <div className="mb-3 rounded-xl bg-slate-50 p-3">

                        <p className="truncate text-sm font-semibold text-slate-800">
                            {user?.name ||
                                user?.username ||
                                "HOD"}
                        </p>

                        <p className="text-xs text-slate-500">
                            HOD
                        </p>

                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >

                        <FaSignOutAlt />

                        Logout

                    </button>

                </div>

            </aside>
        );
    }

    // =====================================================
    // ADMIN SIDEBAR
    // =====================================================

    if (role === "ADMIN") {
        return (
            <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">

                {/* HEADER */}

                <div className="border-b border-slate-200 px-5 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                            <FaSchool className="text-xl" />
                        </div>

                        <div className="min-w-0">

                            <h1 className="text-lg font-bold text-slate-800">
                                Attendance
                            </h1>

                            <p className="text-xs text-slate-500">
                                Admin Portal
                            </p>

                        </div>

                    </div>

                </div>

                {/* ADMIN NAVIGATION */}

                <nav className="flex-1 overflow-y-auto px-4 py-5">

                    {/* MAIN MENU */}

                    <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Main Menu
                    </p>

                    <div className="space-y-1">

                        {menuLink(
                            "/admin",
                            FaTachometerAlt,
                            "Dashboard",
                            true
                        )}

                    </div>

                    {/* MASTER DATA */}

                    <div className="mt-6">

                        <button
                            type="button"
                            onClick={() =>
                                setMasterDataOpen(
                                    !masterDataOpen
                                )
                            }
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:bg-slate-50"
                        >

                            <span>
                                Master Data
                            </span>

                            {masterDataOpen ? (
                                <FaChevronDown />
                            ) : (
                                <FaChevronRight />
                            )}

                        </button>

                        {masterDataOpen && (
                            <div className="mt-2 space-y-1 border-l-2 border-indigo-100 pl-3">

                                {adminSubLink(
                                    "/admin/departments",
                                    FaBuilding,
                                    "Departments"
                                )}

                                {adminSubLink(
                                    "/admin/staff",
                                    FaUsers,
                                    "Staff"
                                )}

                                {adminSubLink(
                                    "/admin/students",
                                    FaUserGraduate,
                                    "Students"
                                )}

                                {adminSubLink(
                                    "/admin/classes",
                                    FaSchool,
                                    "Classes"
                                )}

                                {adminSubLink(
                                    "/admin/subjects",
                                    FaBook,
                                    "Subjects"
                                )}

                            </div>
                        )}

                    </div>

                    {/* ACADEMIC SETUP */}

                    <div className="mt-6">

                        <button
                            type="button"
                            onClick={() =>
                                setAcademicSetupOpen(
                                    !academicSetupOpen
                                )
                            }
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:bg-slate-50"
                        >

                            <span>
                                Academic Setup
                            </span>

                            {academicSetupOpen ? (
                                <FaChevronDown />
                            ) : (
                                <FaChevronRight />
                            )}

                        </button>

                        {academicSetupOpen && (
                            <div className="mt-2 space-y-1 border-l-2 border-indigo-100 pl-3">

                                {adminSubLink(
                                    "/admin/subject-allocations",
                                    FaLink,
                                    "Subject Allocations"
                                )}

                                {adminSubLink(
                                    "/admin/class-teacher-assignments",
                                    FaUserTie,
                                    "Class Teacher Assignments"
                                )}

                                {adminSubLink(
                                    "/admin/timetable",
                                    FaClock,
                                    "Timetable"
                                )}

                            </div>
                        )}

                    </div>

                    {/* ATTENDANCE */}

                    <div className="mt-6">

                        <button
                            type="button"
                            onClick={() =>
                                setAttendanceOpen(
                                    !attendanceOpen
                                )
                            }
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:bg-slate-50"
                        >

                            <span>
                                Attendance
                            </span>

                            {attendanceOpen ? (
                                <FaChevronDown />
                            ) : (
                                <FaChevronRight />
                            )}

                        </button>

                        {attendanceOpen && (
                            <div className="mt-2 space-y-1 border-l-2 border-indigo-100 pl-3">

                                {adminSubLink(
                                    "/admin/attendance",
                                    FaClipboardCheck,
                                    "Attendance"
                                )}

                                {adminSubLink(
                                    "/admin/attendance/sessions",
                                    FaCalendarAlt,
                                    "Attendance Sessions"
                                )}

                                {adminSubLink(
                                    "/admin/attendance/records",
                                    FaDatabase,
                                    "Attendance Records"
                                )}

                                {adminSubLink(
                                    "/admin/attendance/reports",
                                    FaChartBar,
                                    "Attendance Reports"
                                )}

                            </div>
                        )}

                    </div>

                    {/* SYSTEM */}

                    <div className="mt-6">

                        <button
                            type="button"
                            onClick={() =>
                                setSystemOpen(
                                    !systemOpen
                                )
                            }
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:bg-slate-50"
                        >

                            <span>
                                System
                            </span>

                            {systemOpen ? (
                                <FaChevronDown />
                            ) : (
                                <FaChevronRight />
                            )}

                        </button>

                        {systemOpen && (
                            <div className="mt-2 space-y-1 border-l-2 border-indigo-100 pl-3">

                                {adminSubLink(
                                    "/admin/qr-codes",
                                    FaQrcode,
                                    "QR Codes"
                                )}

                                {adminSubLink(
                                    "/admin/notifications",
                                    FaBell,
                                    "Notifications"
                                )}

                                {adminSubLink(
                                    "/admin/audit-logs",
                                    FaHistory,
                                    "Audit Logs"
                                )}

                            </div>
                        )}

                    </div>

                </nav>

                {/* USER / LOGOUT */}

                <div className="border-t border-slate-200 p-4">

                    <div className="mb-3 rounded-xl bg-slate-50 p-3">

                        <p className="truncate text-sm font-semibold text-slate-800">
                            {user?.name ||
                                user?.username ||
                                "Administrator"}
                        </p>

                        <p className="text-xs text-slate-500">
                            Administrator
                        </p>

                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >

                        <FaSignOutAlt />

                        Logout

                    </button>

                </div>

            </aside>
        );
    }

    // =====================================================
    // SUBJECT STAFF SIDEBAR
    // =====================================================

    if (role === "STAFF") {
        return (
            <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">

                {/* HEADER */}

                <div className="border-b border-slate-200 px-5 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                            <FaSchool className="text-xl" />
                        </div>

                        <div className="min-w-0">

                            <h1 className="text-lg font-bold text-slate-800">
                                Attendance
                            </h1>

                            <p className="text-xs text-slate-500">
                                Subject Staff Portal
                            </p>

                        </div>

                    </div>

                </div>

                {/* STAFF INFORMATION */}

                <div className="border-b border-slate-200 px-4 py-4">

                    <div className="rounded-xl bg-indigo-50 p-3">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                <FaUserTie />
                            </div>

                            <div className="min-w-0">

                                <p className="text-xs text-slate-500">
                                    Logged in as
                                </p>

                                <p className="truncate text-sm font-bold text-indigo-800">
                                    {user?.name ||
                                        user?.username ||
                                        "Subject Staff"}
                                </p>

                                <p className="text-xs text-indigo-600">
                                    Subject Staff
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                {/* NAVIGATION */}

                <nav className="flex-1 overflow-y-auto px-4 py-5">

                    <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Subject Staff
                    </p>

                    <div className="space-y-1">

                        {/* DASHBOARD */}

                        {menuLink(
                            "/staff",
                            FaTachometerAlt,
                            "Dashboard",
                            true
                        )}

                        {/* START ATTENDANCE */}

                        {menuLink(
                            "/staff/start-attendance",
                            FaQrcode,
                            "Start Attendance"
                        )}

                        {/* STUDENTS */}

                        {menuLink(
                            "/staff/students",
                            FaUserGraduate,
                            "Students"
                        )}

                        {/* ATTENDANCE */}

                        {menuLink(
                            "/staff/attendance",
                            FaClipboardCheck,
                            "Attendance"
                        )}

                        {/* CLASS */}

                        {menuLink(
                            "/staff/class",
                            FaSchool,
                            "Class"
                        )}

                    </div>

                </nav>

                {/* USER / LOGOUT */}

                <div className="border-t border-slate-200 p-4">

                    <div className="mb-3 rounded-xl bg-slate-50 p-3">

                        <p className="truncate text-sm font-semibold text-slate-800">
                            {user?.name ||
                                user?.username ||
                                "Subject Staff"}
                        </p>

                        <p className="text-xs text-slate-500">
                            Subject Staff
                        </p>

                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >

                        <FaSignOutAlt />

                        Logout

                    </button>

                </div>

            </aside>
        );
    }

    // =====================================================
    // STUDENT SIDEBAR
    // =====================================================

    if (role === "STUDENT") {
        return (
            <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">

                {/* HEADER */}

                <div className="border-b border-slate-200 px-5 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                            <FaSchool />
                        </div>

                        <div>

                            <h1 className="text-lg font-bold text-slate-800">
                                Attendance
                            </h1>

                            <p className="text-xs text-slate-500">
                                Student Portal
                            </p>

                        </div>

                    </div>

                </div>

                {/* NAVIGATION */}

                <nav className="flex-1 overflow-y-auto px-4 py-5">

                    <div className="space-y-1">

                        {menuLink(
                            "/student",
                            FaTachometerAlt,
                            "Dashboard",
                            true
                        )}

                        {menuLink(
                            "/student/scan-qr",
                            FaQrcode,
                            "Scan QR"
                        )}

                        {menuLink(
                            "/student/attendance",
                            FaClipboardCheck,
                            "My Attendance"
                        )}

                        {menuLink(
                            "/student/timetable",
                            FaCalendarAlt,
                            "Timetable"
                        )}

                    </div>

                </nav>

                {/* LOGOUT */}

                <div className="border-t border-slate-200 p-4">

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >

                        <FaSignOutAlt />

                        Logout

                    </button>

                </div>

            </aside>
        );
    }

    // =====================================================
    // CLASS TEACHER SIDEBAR
    // =====================================================

    if (role === "TEACHER") {
        return (
            <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">

                {/* HEADER */}

                <div className="border-b border-slate-200 px-5 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                            <FaSchool className="text-xl" />
                        </div>

                        <div className="min-w-0">

                            <h1 className="text-lg font-bold text-slate-800">
                                Attendance
                            </h1>

                            <p className="text-xs text-slate-500">
                                Class Teacher Portal
                            </p>

                        </div>

                    </div>

                </div>

                {/* CLASS TEACHER INFO */}

                <div className="border-b border-slate-200 px-4 py-4">

                    <div className="rounded-xl bg-indigo-50 p-3">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                <FaUsers />
                            </div>

                            <div className="min-w-0">

                                <p className="text-xs text-slate-500">
                                    Logged in as
                                </p>

                                <p className="truncate text-sm font-bold text-indigo-800">
                                    {user?.name ||
                                        user?.username ||
                                        "Class Teacher"}
                                </p>

                                <p className="text-xs text-indigo-600">
                                    Class Teacher
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                {/* NAVIGATION */}

                <nav className="flex-1 overflow-y-auto px-4 py-5">

                    <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Class Management
                    </p>

                    <div className="space-y-1">

                        {menuLink(
                            "/class-teacher",
                            FaTachometerAlt,
                            "Dashboard",
                            true
                        )}

                        {menuLink(
                            "/class-teacher/class",
                            FaSchool,
                            "My Class"
                        )}

                        {menuLink(
                            "/class-teacher/students",
                            FaUserGraduate,
                            "Students"
                        )}

                        {menuLink(
                            "/class-teacher/timetable",
                            FaCalendarAlt,
                            "Timetable"
                        )}

                        {menuLink(
                            "/class-teacher/staff",
                            FaUsers,
                            "Class Staff"
                        )}

                    </div>

                    {/* REPORTS */}

                    <div className="mt-6">

                        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Reports
                        </p>

                        <div className="space-y-1">

                            {menuLink(
                                "/class-teacher/reports",
                                FaClipboardCheck,
                                "Attendance Reports"
                            )}

                        </div>

                    </div>

                    {/* ACCOUNT */}

                    <div className="mt-6">

                        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Account
                        </p>

                        <div className="space-y-1">

                            {menuLink(
                                "/class-teacher/profile",
                                FaUser,
                                "Profile"
                            )}

                        </div>

                    </div>

                </nav>

                {/* USER / LOGOUT */}

                <div className="border-t border-slate-200 p-4">

                    <div className="mb-3 rounded-xl bg-slate-50 p-3">

                        <p className="truncate text-sm font-semibold text-slate-800">
                            {user?.name ||
                                user?.username ||
                                "Class Teacher"}
                        </p>

                        <p className="text-xs text-slate-500">
                            Class Teacher
                        </p>

                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >

                        <FaSignOutAlt />

                        Logout

                    </button>

                </div>

            </aside>
        );
    }

    // =====================================================
    // DEFAULT SIDEBAR
    // =====================================================

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <FaSchool />
                </div>

                <div>

                    <h1 className="text-lg font-bold text-slate-800">
                        Attendance
                    </h1>

                    <p className="text-xs text-slate-500">
                        Management System
                    </p>

                </div>

            </div>

            <button
                onClick={handleLogout}
                className="mt-6 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >

                <FaSignOutAlt />

                Logout

            </button>

        </aside>
    );
};

export default Sidebar;