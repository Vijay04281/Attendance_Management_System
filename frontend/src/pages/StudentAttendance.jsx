import { useEffect, useMemo, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import {
    FaBook,
    FaCheckCircle,
    FaClock,
    FaExclamationTriangle,
    FaRedo,
    FaSearch,
    FaCalendarAlt,
    FaChartPie,
} from "react-icons/fa";

const API_URL = "http://localhost:5000/api";

function StudentAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    // =====================================================
    // FETCH ATTENDANCE
    // =====================================================

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const token =
                localStorage.getItem("token");

            const user = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            if (!token) {
                console.error(
                    "Authentication token not found"
                );

                setAttendance([]);
                return;
            }

            if (!user.user_id) {
                console.error(
                    "User ID not found"
                );

                setAttendance([]);
                return;
            }

            const response = await fetch(
                `${API_URL}/attendance/student/${user.user_id}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type":
                            "application/json",
                    },
                }
            );

            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "Invalid response received from server."
                );
            }

            console.log(
                "Student attendance response:",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to fetch attendance."
                );
            }

            if (data.success) {
                setAttendance(
                    Array.isArray(data.attendance)
                        ? data.attendance
                        : []
                );
            } else {
                console.error(
                    "Attendance API error:",
                    data.message
                );

                setAttendance([]);
            }
        } catch (error) {
            console.error(
                "Attendance fetch error:",
                error
            );

            setAttendance([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =====================================================
    // FILTERED ATTENDANCE
    // =====================================================

    const filteredAttendance = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        return attendance.filter((item) => {
            const subject =
                String(
                    item.subject_name || ""
                ).toLowerCase();

            const subjectCode =
                String(
                    item.subject_code || ""
                ).toLowerCase();

            const staff =
                String(
                    item.staff_name || ""
                ).toLowerCase();

            const status =
                String(
                    item.status || ""
                ).toLowerCase();

            const matchesSearch =
                !searchValue ||
                subject.includes(searchValue) ||
                subjectCode.includes(searchValue) ||
                staff.includes(searchValue) ||
                status.includes(searchValue);

            let matchesDate = true;

            if (dateFilter) {
                const attendanceDate =
                    item.scanned_at
                        ? new Date(item.scanned_at)
                        : null;

                if (
                    attendanceDate &&
                    !Number.isNaN(
                        attendanceDate.getTime()
                    )
                ) {
                    const year =
                        attendanceDate.getFullYear();

                    const month =
                        String(
                            attendanceDate.getMonth() + 1
                        ).padStart(2, "0");

                    const day =
                        String(
                            attendanceDate.getDate()
                        ).padStart(2, "0");

                    const formattedDate =
                        `${year}-${month}-${day}`;

                    matchesDate =
                        formattedDate ===
                        dateFilter;
                } else {
                    matchesDate = false;
                }
            }

            return (
                matchesSearch &&
                matchesDate
            );
        });
    }, [
        attendance,
        search,
        dateFilter,
    ]);

    // =====================================================
    // SUMMARY
    // =====================================================

    const summary = useMemo(() => {
        const present =
            attendance.filter(
                (item) =>
                    String(
                        item.status
                    ).toUpperCase() === "PRESENT"
            ).length;

        const late =
            attendance.filter(
                (item) =>
                    String(
                        item.status
                    ).toUpperCase() === "LATE"
            ).length;

        const absent =
            attendance.filter(
                (item) =>
                    String(
                        item.status
                    ).toUpperCase() === "ABSENT"
            ).length;

        const total =
            attendance.length;

        const attended =
            present + late;

        const percentage =
            total > 0
                ? Math.round(
                      (attended / total) * 100
                  )
                : 0;

        return {
            present,
            late,
            absent,
            total,
            attended,
            percentage,
        };
    }, [attendance]);

    // =====================================================
    // PIE DATA
    // =====================================================

    const pieData = [
        {
            name: "Present",
            value: summary.present,
        },
        {
            name: "Late",
            value: summary.late,
        },
        {
            name: "Absent",
            value: summary.absent,
        },
    ].filter(
        (item) => item.value > 0
    );

    const COLORS = [
        "#22c55e",
        "#eab308",
        "#ef4444",
    ];

    // =====================================================
    // SUBJECT DATA
    // =====================================================

    const subjectData = useMemo(() => {
        const subjects = {};

        attendance.forEach((item) => {
            const subject =
                item.subject_name ||
                item.subject_code ||
                "Unknown";

            if (!subjects[subject]) {
                subjects[subject] = {
                    subject,
                    subjectCode:
                        item.subject_code || "",
                    present: 0,
                    late: 0,
                    absent: 0,
                    total: 0,
                };
            }

            subjects[subject].total += 1;

            const status =
                String(
                    item.status
                ).toUpperCase();

            if (status === "PRESENT") {
                subjects[subject].present += 1;
            } else if (status === "LATE") {
                subjects[subject].late += 1;
            } else if (status === "ABSENT") {
                subjects[subject].absent += 1;
            }
        });

        return Object.values(
            subjects
        ).map((item) => ({
            ...item,
            percentage:
                item.total > 0
                    ? Math.round(
                          ((item.present +
                              item.late) /
                              item.total) *
                              100
                      )
                    : 0,
        }));
    }, [attendance]);

    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDateTime = (value) => {
        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short",
            }
        );
    };

    // =====================================================
    // STATUS BADGE
    // =====================================================

    const getStatusClass = (
        status
    ) => {
        const value =
            String(
                status || ""
            ).toUpperCase();

        if (value === "PRESENT") {
            return "bg-green-100 text-green-700";
        }

        if (value === "LATE") {
            return "bg-yellow-100 text-yellow-700";
        }

        if (value === "ABSENT") {
            return "bg-red-100 text-red-700";
        }

        return "bg-slate-100 text-slate-600";
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="flex min-h-96 items-center justify-center">
                <div className="text-center">

                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>

                    <p className="text-slate-500">
                        Loading attendance...
                    </p>

                </div>
            </div>
        );
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

                <div>

                    <div className="mb-2 flex items-center gap-2">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                            <FaChartPie />
                        </div>

                        <span className="text-sm font-semibold text-indigo-600">
                            Attendance
                        </span>

                    </div>

                    <h1 className="text-3xl font-bold text-slate-800">
                        My Attendance
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Track your attendance performance
                        and subject-wise records.
                    </p>

                </div>

                <button
                    type="button"
                    onClick={() =>
                        fetchAttendance(true)
                    }
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >

                    <FaRedo
                        className={
                            refreshing
                                ? "animate-spin"
                                : ""
                        }
                    />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}

                </button>

            </div>

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {/* Total */}

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Total Classes
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {summary.total}
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                            <FaBook />
                        </div>

                    </div>

                </div>

                {/* Present */}

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Present
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-green-600">
                                {summary.present}
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                            <FaCheckCircle />
                        </div>

                    </div>

                </div>

                {/* Late */}

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Late
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-yellow-600">
                                {summary.late}
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                            <FaClock />
                        </div>

                    </div>

                </div>

                {/* Percentage */}

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Attendance
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-indigo-600">
                                {summary.percentage}%
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                            <FaChartPie />
                        </div>

                    </div>

                </div>

            </div>

            {/* =================================================
                LOW ATTENDANCE WARNING
            ================================================= */}

            {summary.total > 0 &&
                summary.percentage < 75 && (
                    <div className="flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

                        <div className="mt-0.5 text-yellow-600">
                            <FaExclamationTriangle />
                        </div>

                        <div>

                            <p className="font-semibold text-yellow-800">
                                Attendance Warning
                            </p>

                            <p className="mt-1 text-sm text-yellow-700">
                                Your attendance is below
                                75%. Try to attend your
                                upcoming classes regularly.
                            </p>

                        </div>

                    </div>
                )}

            {/* =================================================
                CHARTS
            ================================================= */}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Pie */}

                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

                    <div className="mb-4">

                        <h2 className="text-lg font-semibold text-slate-800">
                            Attendance Overview
                        </h2>

                        <p className="text-sm text-slate-500">
                            Present, late and absent
                            distribution
                        </p>

                    </div>

                    {pieData.length === 0 ? (
                        <div className="flex h-72 items-center justify-center text-slate-500">
                            No attendance data available
                        </div>
                    ) : (
                        <div className="h-72">

                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <PieChart>

                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={105}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >

                                        {pieData.map(
                                            (
                                                entry,
                                                index
                                            ) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        COLORS[
                                                            index
                                                        ]
                                                    }
                                                />
                                            )
                                        )}

                                    </Pie>

                                    <Tooltip />

                                    <Legend />

                                </PieChart>
                            </ResponsiveContainer>

                        </div>
                    )}

                </div>

                {/* Percentage */}

                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

                    <div className="mb-4">

                        <h2 className="text-lg font-semibold text-slate-800">
                            Overall Attendance
                        </h2>

                        <p className="text-sm text-slate-500">
                            Your current attendance percentage
                        </p>

                    </div>

                    <div className="flex h-72 flex-col items-center justify-center">

                        <div
                            className="relative flex h-48 w-48 items-center justify-center rounded-full"
                            style={{
                                background: `conic-gradient(
                                    ${
                                        summary.percentage >=
                                        75
                                            ? "#22c55e"
                                            : "#ef4444"
                                    } ${
                                        summary.percentage
                                    }%,
                                    #e2e8f0 ${
                                        summary.percentage
                                    }% 100%
                                )`,
                            }}
                        >

                            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white">

                                <div className="text-center">

                                    <p className="text-4xl font-bold text-slate-800">
                                        {summary.percentage}%
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Attendance
                                    </p>

                                </div>

                            </div>

                        </div>

                        <p
                            className={`mt-5 text-sm font-semibold ${
                                summary.percentage >=
                                75
                                    ? "text-green-600"
                                    : "text-red-600"
                            }`}
                        >
                            {summary.percentage >=
                            75
                                ? "Good attendance"
                                : "Attendance below 75%"}
                        </p>

                    </div>

                </div>

            </div>

            {/* =================================================
                SUBJECT-WISE
            ================================================= */}

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

                <div className="mb-5">

                    <h2 className="text-lg font-semibold text-slate-800">
                        Subject-wise Attendance
                    </h2>

                    <p className="text-sm text-slate-500">
                        Attendance percentage for each subject
                    </p>

                </div>

                {subjectData.length === 0 ? (
                    <div className="flex h-72 items-center justify-center text-slate-500">
                        No subject attendance data available
                    </div>
                ) : (
                    <div className="h-80">

                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <BarChart
                                data={subjectData}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 0,
                                    bottom: 60,
                                }}
                            >

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                />

                                <XAxis
                                    dataKey="subject"
                                    angle={-25}
                                    textAnchor="end"
                                    interval={0}
                                />

                                <YAxis
                                    domain={[
                                        0,
                                        100,
                                    ]}
                                    unit="%"
                                />

                                <Tooltip
                                    formatter={(
                                        value
                                    ) => [
                                        `${value}%`,
                                        "Attendance",
                                    ]}
                                />

                                <Bar
                                    dataKey="percentage"
                                    fill="#6366f1"
                                    radius={[
                                        6,
                                        6,
                                        0,
                                        0,
                                    ]}
                                />

                            </BarChart>
                        </ResponsiveContainer>

                    </div>
                )}

            </div>

            {/* =================================================
                SUBJECT SUMMARY
            ================================================= */}

            {subjectData.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

                    <div className="border-b p-5">

                        <h2 className="text-lg font-semibold text-slate-800">
                            Subject Summary
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Detailed attendance by subject
                        </p>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full">

                            <thead className="bg-slate-50">

                                <tr>

                                    <th className="p-4 text-left text-sm font-semibold text-slate-600">
                                        Subject
                                    </th>

                                    <th className="p-4 text-center text-sm font-semibold text-slate-600">
                                        Present
                                    </th>

                                    <th className="p-4 text-center text-sm font-semibold text-slate-600">
                                        Late
                                    </th>

                                    <th className="p-4 text-center text-sm font-semibold text-slate-600">
                                        Absent
                                    </th>

                                    <th className="p-4 text-center text-sm font-semibold text-slate-600">
                                        Total
                                    </th>

                                    <th className="p-4 text-center text-sm font-semibold text-slate-600">
                                        Percentage
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {subjectData.map(
                                    (subject) => (
                                        <tr
                                            key={
                                                subject.subject
                                            }
                                            className="border-t transition hover:bg-slate-50"
                                        >

                                            <td className="p-4">

                                                <p className="font-medium text-slate-800">
                                                    {
                                                        subject.subject
                                                    }
                                                </p>

                                                {subject.subjectCode && (
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {
                                                            subject.subjectCode
                                                        }
                                                    </p>
                                                )}

                                            </td>

                                            <td className="p-4 text-center font-semibold text-green-600">
                                                {
                                                    subject.present
                                                }
                                            </td>

                                            <td className="p-4 text-center font-semibold text-yellow-600">
                                                {
                                                    subject.late
                                                }
                                            </td>

                                            <td className="p-4 text-center font-semibold text-red-600">
                                                {
                                                    subject.absent
                                                }
                                            </td>

                                            <td className="p-4 text-center font-semibold text-slate-700">
                                                {
                                                    subject.total
                                                }
                                            </td>

                                            <td className="p-4 text-center">

                                                <span
                                                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                                        subject.percentage >=
                                                        75
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {
                                                        subject.percentage
                                                    }%
                                                </span>

                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>
            )}

            {/* =================================================
                ATTENDANCE RECORDS
            ================================================= */}

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

                <div className="border-b p-5">

                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                        <div>

                            <h2 className="text-lg font-semibold text-slate-800">
                                Attendance Records
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Complete attendance history
                            </p>

                        </div>

                        <div className="text-sm font-medium text-slate-500">
                            {filteredAttendance.length} record
                            {filteredAttendance.length !==
                            1
                                ? "s"
                                : ""}
                        </div>

                    </div>

                    {/* Filters */}

                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">

                        <div className="relative">

                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search subject, staff or status..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                            />

                        </div>

                        <div className="relative">

                            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) =>
                                    setDateFilter(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                            />

                        </div>

                    </div>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full">

                        <thead className="bg-slate-50">

                            <tr>

                                <th className="p-4 text-left text-sm font-semibold text-slate-600">
                                    Subject
                                </th>

                                <th className="p-4 text-left text-sm font-semibold text-slate-600">
                                    Staff
                                </th>

                                <th className="p-4 text-left text-sm font-semibold text-slate-600">
                                    Date & Time
                                </th>

                                <th className="p-4 text-left text-sm font-semibold text-slate-600">
                                    Status
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredAttendance.length ===
                            0 ? (
                                <tr>

                                    <td
                                        colSpan="4"
                                        className="p-12 text-center"
                                    >

                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                            <FaBook />
                                        </div>

                                        <p className="mt-4 font-medium text-slate-600">
                                            No attendance records found
                                        </p>

                                        <p className="mt-1 text-sm text-slate-400">
                                            Try changing your search
                                            or date filter.
                                        </p>

                                    </td>

                                </tr>
                            ) : (
                                filteredAttendance.map(
                                    (item) => (
                                        <tr
                                            key={
                                                item.attendance_id
                                            }
                                            className="border-t transition hover:bg-slate-50"
                                        >

                                            <td className="p-4">

                                                <p className="font-medium text-slate-800">
                                                    {item.subject_name ||
                                                        "-"}
                                                </p>

                                                {item.subject_code && (
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {
                                                            item.subject_code
                                                        }
                                                    </p>
                                                )}

                                            </td>

                                            <td className="p-4 text-slate-600">
                                                {item.staff_name ||
                                                    "-"}
                                            </td>

                                            <td className="p-4 text-sm text-slate-600">
                                                {formatDateTime(
                                                    item.scanned_at
                                                )}
                                            </td>

                                            <td className="p-4">

                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                        item.status
                                                    )}`}
                                                >

                                                    {String(
                                                        item.status ||
                                                            ""
                                                    ).toUpperCase() ===
                                                    "PRESENT" && (
                                                        <FaCheckCircle />
                                                    )}

                                                    {String(
                                                        item.status ||
                                                            ""
                                                    ).toUpperCase() ===
                                                    "LATE" && (
                                                        <FaClock />
                                                    )}

                                                    {String(
                                                        item.status ||
                                                            ""
                                                    ).toUpperCase() ===
                                                    "ABSENT" && (
                                                        <FaExclamationTriangle />
                                                    )}

                                                    {String(
                                                        item.status ||
                                                            "UNKNOWN"
                                                    ).toUpperCase()}

                                                </span>

                                            </td>

                                        </tr>
                                    )
                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default StudentAttendance;