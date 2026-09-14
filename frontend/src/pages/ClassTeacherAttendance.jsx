import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "https://attendance-management-system-gpci.onrender.com/api";

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        ""
    );
};

const getToday = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getAttendanceList = (data) => {
    if (Array.isArray(data?.attendance)) {
        return data.attendance;
    }

    if (Array.isArray(data?.data?.attendance)) {
        return data.data.attendance;
    }

    if (Array.isArray(data?.subject_attendance)) {
        return data.subject_attendance;
    }

    if (Array.isArray(data?.data?.subject_attendance)) {
        return data.data.subject_attendance;
    }

    if (Array.isArray(data?.subjects)) {
        return data.subjects;
    }

    if (Array.isArray(data?.data?.subjects)) {
        return data.data.subjects;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data)) {
        return data;
    }

    return [];
};

function ClassTeacherAttendance() {
    const [selectedDate, setSelectedDate] = useState(getToday());

    const [attendance, setAttendance] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");
    const [dashboardError, setDashboardError] = useState("");

    const fetchAttendance = async () => {
        try {
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error("Authentication token not found");
            }

            const response = await fetch(
                `${API_BASE_URL}/class-teacher/subject-attendance?date=${selectedDate}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to load attendance"
                );
            }

            setAttendance(getAttendanceList(data));
        } catch (err) {
            console.error(
                "Class Teacher Attendance Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to load attendance"
            );

            setAttendance([]);
        }
    };

    const fetchDashboard = async () => {
        try {
            setDashboardError("");

            const token = getToken();

            if (!token) {
                throw new Error("Authentication token not found");
            }

            const response = await fetch(
                `${API_BASE_URL}/class-teacher/dashboard`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to load dashboard"
                );
            }

            setDashboardData(data);
        } catch (err) {
            console.error(
                "Class Teacher Dashboard Error:",
                err
            );

            setDashboardError(
                err.message ||
                    "Failed to load dashboard"
            );
        }
    };

    const loadData = async () => {
        try {
            setRefreshing(true);
            setLoading(true);

            await Promise.all([
                fetchAttendance(),
                fetchDashboard(),
            ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const classInfo =
        dashboardData?.class ||
        dashboardData?.data?.class ||
        {};

    const teacherInfo =
        dashboardData?.teacher ||
        dashboardData?.data?.teacher ||
        {};

    const statistics =
        dashboardData?.statistics ||
        dashboardData?.data?.statistics ||
        {};

    const totalStudents = Number(
        statistics.total_students ??
            statistics.totalStudents ??
            classInfo.student_count ??
            classInfo.total_students ??
            0
    );

    const totalPresent = Number(
        statistics.present ??
            statistics.present_students ??
            statistics.total_present ??
            0
    );

    const totalAbsent = Number(
        statistics.absent ??
            statistics.absent_students ??
            statistics.total_absent ??
            0
    );

    const attendancePercentage = Number(
        statistics.attendance_percentage ??
            statistics.attendancePercentage ??
            statistics.attendance_percent ??
            0
    );

    const totalSessions = Number(
        statistics.sessions_today ??
            statistics.total_sessions ??
            statistics.sessions ??
            0
    );

    const totals = useMemo(() => {
        let present = 0;
        let absent = 0;
        let late = 0;

        attendance.forEach((item) => {
            present += Number(
                item.present ??
                    item.present_count ??
                    item.total_present ??
                    0
            );

            absent += Number(
                item.absent ??
                    item.absent_count ??
                    item.total_absent ??
                    0
            );

            late += Number(
                item.late ??
                    item.late_count ??
                    0
            );
        });

        return {
            present,
            absent,
            late,
        };
    }, [attendance]);

    const displayPresent =
        totals.present > 0
            ? totals.present
            : totalPresent;

    const displayAbsent =
        totals.absent > 0
            ? totals.absent
            : totalAbsent;

    const displayTotal =
        totalStudents ||
        displayPresent +
            displayAbsent;

    const displayPercentage =
        displayTotal > 0
            ? ((displayPresent / displayTotal) * 100).toFixed(1)
            : Number(attendancePercentage || 0).toFixed(1);

    const getSubjectName = (item) => {
        return (
            item.subject_name ||
            item.subject ||
            item.name ||
            "-"
        );
    };

    const getSubjectCode = (item) => {
        return (
            item.subject_code ||
            item.code ||
            "-"
        );
    };

    const getStaffName = (item) => {
        return (
            item.staff_name ||
            item.staff ||
            item.teacher_name ||
            item.name ||
            "-"
        );
    };

    const getPresent = (item) => {
        return Number(
            item.present ??
                item.present_count ??
                item.total_present ??
                0
        );
    };

    const getAbsent = (item) => {
        return Number(
            item.absent ??
                item.absent_count ??
                item.total_absent ??
                0
        );
    };

    const getLate = (item) => {
        return Number(
            item.late ??
                item.late_count ??
                0
        );
    };

    const getTotal = (item) => {
        return Number(
            item.total ??
                item.total_students ??
                item.student_count ??
                getPresent(item) +
                    getAbsent(item) +
                    getLate(item)
        );
    };

    const getPercentage = (item) => {
        const percentage =
            item.attendance_percentage ??
            item.attendancePercentage ??
            item.percentage;

        if (percentage !== undefined && percentage !== null) {
            return Number(percentage).toFixed(1);
        }

        const total = getTotal(item);
        const present = getPresent(item);

        if (!total) return "0.0";

        return ((present / total) * 100).toFixed(1);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* HEADER */}
                <div className="overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg md:p-8">

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                        <div>
                            <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                                Class Teacher
                            </div>

                            <h1 className="text-2xl font-bold md:text-3xl">
                                Attendance
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-blue-100 md:text-base">
                                Monitor subject-wise attendance for your class.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                            <p className="text-xs uppercase tracking-wider text-blue-100">
                                Attendance Date
                            </p>

                            <p className="mt-1 text-xl font-bold">
                                {formatDate(selectedDate)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* DATE + REFRESH */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Select Attendance Date
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Choose a date to view subject attendance.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">

                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(event) =>
                                    setSelectedDate(
                                        event.target.value
                                    )
                                }
                                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                            <button
                                type="button"
                                onClick={loadData}
                                disabled={refreshing}
                                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {refreshing
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </button>

                        </div>
                    </div>
                </div>

                {/* CLASS INFO */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Department
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            {classInfo.department_name ||
                                classInfo.department ||
                                "Computer Science"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Class
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            Year {classInfo.year || "-"}
                            {classInfo.section
                                ? ` - ${classInfo.section}`
                                : ""}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Teacher
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            {teacherInfo.name ||
                                teacherInfo.username ||
                                "Class Teacher"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Sessions
                        </p>

                        <p className="mt-2 text-lg font-bold text-blue-600">
                            {totalSessions}
                        </p>
                    </div>

                </div>

                {/* STATISTICS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Total Students
                        </p>

                        <p className="mt-2 text-3xl font-bold text-slate-800">
                            {displayTotal}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Present
                        </p>

                        <p className="mt-2 text-3xl font-bold text-emerald-700">
                            {displayPresent}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                            Absent
                        </p>

                        <p className="mt-2 text-3xl font-bold text-red-700">
                            {displayAbsent}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Late
                        </p>

                        <p className="mt-2 text-3xl font-bold text-amber-700">
                            {totals.late}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Attendance
                        </p>

                        <p className="mt-2 text-3xl font-bold text-blue-700">
                            {displayPercentage}%
                        </p>
                    </div>

                </div>

                {/* PROGRESS */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Class Attendance
                            </h2>

                            <p className="text-sm text-slate-500">
                                Overall attendance for {formatDate(selectedDate)}
                            </p>
                        </div>

                        <span className="text-2xl font-bold text-blue-600">
                            {displayPercentage}%
                        </span>
                    </div>

                    <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-blue-500 to-violet-600 transition-all"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        Number(displayPercentage)
                                    )
                                )}%`,
                            }}
                        />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-5 text-sm">
                        <span className="flex items-center gap-2 text-slate-600">
                            <span className="h-3 w-3 rounded-full bg-emerald-500" />
                            Present: {displayPresent}
                        </span>

                        <span className="flex items-center gap-2 text-slate-600">
                            <span className="h-3 w-3 rounded-full bg-red-500" />
                            Absent: {displayAbsent}
                        </span>

                        <span className="flex items-center gap-2 text-slate-600">
                            <span className="h-3 w-3 rounded-full bg-amber-500" />
                            Late: {totals.late}
                        </span>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                        <h3 className="font-semibold text-red-800">
                            Unable to load attendance
                        </h3>

                        <p className="mt-1 text-sm text-red-700">
                            {error}
                        </p>
                    </div>
                )}

                {dashboardError && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                        <p className="text-sm text-amber-700">
                            Class information could not be loaded:
                            {" "}
                            {dashboardError}
                        </p>
                    </div>
                )}

                {/* SUBJECT ATTENDANCE TABLE */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5 md:p-6">

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Subject-wise Attendance
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Attendance breakdown by subject.
                                </p>
                            </div>

                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                {attendance.length} Subjects
                            </span>

                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                            <p className="mt-4 text-sm text-slate-500">
                                Loading attendance...
                            </p>
                        </div>
                    ) : attendance.length === 0 ? (
                        <div className="p-12 text-center">

                            <div className="text-5xl">
                                📊
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-slate-800">
                                No attendance data
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                No subject attendance records were found for{" "}
                                {formatDate(selectedDate)}.
                            </p>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="min-w-full text-left">

                                <thead className="bg-slate-50">
                                    <tr>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            #
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Subject
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Code
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Staff
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Present
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Absent
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Late
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Attendance
                                        </th>

                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {attendance.map((item, index) => {

                                        const subjectName =
                                            getSubjectName(item);

                                        const subjectCode =
                                            getSubjectCode(item);

                                        const staffName =
                                            getStaffName(item);

                                        const present =
                                            getPresent(item);

                                        const absent =
                                            getAbsent(item);

                                        const late =
                                            getLate(item);

                                        const percentage =
                                            getPercentage(item);

                                        return (
                                            <tr
                                                key={`attendance-${item.subject_id || subjectCode || index}-${index}`}
                                                className="transition hover:bg-blue-50/40"
                                            >

                                                <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                                    {index + 1}
                                                </td>

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">
                                                            📚
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-slate-800">
                                                                {subjectName}
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-slate-400">
                                                                Subject
                                                            </p>
                                                        </div>

                                                    </div>

                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                                                        {subjectCode}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {staffName}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700">
                                                        {present}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-bold text-red-700">
                                                        {absent}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-700">
                                                        {late}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">

                                                    <div className="min-w-32">

                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-semibold text-slate-600">
                                                                {percentage}%
                                                            </span>
                                                        </div>

                                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className="h-full rounded-full bg-blue-600"
                                                                style={{
                                                                    width: `${Math.min(
                                                                        100,
                                                                        Math.max(
                                                                            0,
                                                                            Number(
                                                                                percentage
                                                                            )
                                                                        )
                                                                    )}%`,
                                                                }}
                                                            />
                                                        </div>

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    })}

                                </tbody>
                            </table>

                        </div>
                    )}

                    {!loading &&
                        attendance.length > 0 && (
                            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                    <p className="text-sm text-slate-600">
                                        Showing{" "}
                                        <span className="font-bold text-slate-800">
                                            {attendance.length}
                                        </span>{" "}
                                        subject attendance records
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        Date: {formatDate(selectedDate)}
                                    </p>

                                </div>

                            </div>
                        )}

                </div>

                {/* INFORMATION */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

                    <div className="flex items-start gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl">
                            ℹ
                        </div>

                        <div>
                            <h3 className="font-bold text-blue-900">
                                Attendance Information
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-blue-700">
                                Attendance shown here is based on the
                                attendance sessions recorded by staff
                                handling subjects for your class.
                            </p>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}

export default ClassTeacherAttendance;