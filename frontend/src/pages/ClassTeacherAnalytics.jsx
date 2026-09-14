import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getPercentageClass = (percentage) => {
    if (percentage >= 75) {
        return "text-emerald-600";
    }

    if (percentage >= 50) {
        return "text-amber-600";
    }

    return "text-red-600";
};

const getProgressClass = (percentage) => {
    if (percentage >= 75) {
        return "bg-emerald-500";
    }

    if (percentage >= 50) {
        return "bg-amber-500";
    }

    return "bg-red-500";
};

function ClassTeacherAnalytics() {
    const [selectedDate, setSelectedDate] = useState(getToday());

    const [attendance, setAttendance] = useState([]);
    const [absentStudents, setAbsentStudents] = useState([]);
    const [staff, setStaff] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [refreshing, setRefreshing] = useState(false);

    const fetchAPI = async (url) => {
        const token = getToken();

        if (!token) {
            throw new Error("Authentication token not found");
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data?.message ||
                    "Failed to load analytics data"
            );
        }

        return data;
    };

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                dashboardResponse,
                attendanceResponse,
                absentResponse,
                staffResponse,
            ] = await Promise.all([
                fetchAPI(
                    `${API_BASE_URL}/class-teacher/dashboard`
                ),
                fetchAPI(
                    `${API_BASE_URL}/class-teacher/subject-attendance?date=${selectedDate}`
                ),
                fetchAPI(
                    `${API_BASE_URL}/class-teacher/absent-students?date=${selectedDate}`
                ),
                fetchAPI(
                    `${API_BASE_URL}/class-teacher/staff`
                ),
            ]);

            setDashboardData(dashboardResponse);

            if (
                Array.isArray(
                    attendanceResponse.attendance
                )
            ) {
                setAttendance(
                    attendanceResponse.attendance
                );
            } else if (
                Array.isArray(attendanceResponse.data)
            ) {
                setAttendance(
                    attendanceResponse.data
                );
            } else {
                setAttendance([]);
            }

            if (
                Array.isArray(
                    absentResponse.absent_students
                )
            ) {
                setAbsentStudents(
                    absentResponse.absent_students
                );
            } else if (
                Array.isArray(absentResponse.students)
            ) {
                setAbsentStudents(
                    absentResponse.students
                );
            } else if (
                Array.isArray(absentResponse.data)
            ) {
                setAbsentStudents(
                    absentResponse.data
                );
            } else {
                setAbsentStudents([]);
            }

            if (Array.isArray(staffResponse.staff)) {
                setStaff(staffResponse.staff);
            } else if (
                Array.isArray(staffResponse.data)
            ) {
                setStaff(staffResponse.data);
            } else {
                setStaff([]);
            }
        } catch (err) {
            console.error(
                "Class Teacher Analytics Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to load analytics"
            );
        } finally {
            setLoading(false);
        }
    };

    const refreshAnalytics = async () => {
        setRefreshing(true);

        await loadAnalytics();

        setRefreshing(false);
    };

    useEffect(() => {
        loadAnalytics();
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

    const totalStudents =
        Number(
            statistics.total_students ??
                dashboardData?.total_students ??
                dashboardData?.data?.total_students ??
                0
        ) || 0;

    const subjectRows = useMemo(() => {
        return attendance.map((item, index) => {
            const present =
                Number(
                    item.present ??
                        item.present_count ??
                        item.present_students ??
                        0
                );

            const absent =
                Number(
                    item.absent ??
                        item.absent_count ??
                        item.absent_students ??
                        0
                );

            const late =
                Number(
                    item.late ??
                        item.late_count ??
                        item.late_students ??
                        0
                );

            const total =
                Number(
                    item.total_students ??
                        item.total ??
                        0
                ) ||
                present +
                    absent +
                    late;

            const percentage =
                total > 0
                    ? ((present + late) /
                          total) *
                      100
                    : 0;

            return {
                id: `${item.subject_id || index}-${index}`,
                subject:
                    item.subject_name ||
                    item.subject ||
                    "-",
                code:
                    item.subject_code ||
                    item.code ||
                    "-",
                staff:
                    item.staff_name ||
                    item.staff ||
                    item.teacher_name ||
                    "-",
                present,
                absent,
                late,
                total,
                percentage,
            };
        });
    }, [attendance]);

    const totalPresent = subjectRows.reduce(
        (sum, row) => sum + row.present,
        0
    );

    const totalAbsent = subjectRows.reduce(
        (sum, row) => sum + row.absent,
        0
    );

    const totalLate = subjectRows.reduce(
        (sum, row) => sum + row.late,
        0
    );

    const totalRecords =
        totalPresent +
        totalAbsent +
        totalLate;

    const overallPercentage =
        totalRecords > 0
            ? ((totalPresent + totalLate) /
                  totalRecords) *
              100
            : 0;

    const averageSubjectAttendance =
        subjectRows.length > 0
            ? subjectRows.reduce(
                  (sum, row) =>
                      sum + row.percentage,
                  0
              ) / subjectRows.length
            : 0;

    const highestSubject = useMemo(() => {
        if (subjectRows.length === 0) {
            return null;
        }

        return [...subjectRows].sort(
            (a, b) =>
                b.percentage - a.percentage
        )[0];
    }, [subjectRows]);

    const lowestSubject = useMemo(() => {
        if (subjectRows.length === 0) {
            return null;
        }

        return [...subjectRows].sort(
            (a, b) =>
                a.percentage - b.percentage
        )[0];
    }, [subjectRows]);

    const absentPercentage =
        totalRecords > 0
            ? (totalAbsent / totalRecords) * 100
            : 0;

    const presentPercentage =
        totalRecords > 0
            ? (totalPresent / totalRecords) * 100
            : 0;

    const latePercentage =
        totalRecords > 0
            ? (totalLate / totalRecords) * 100
            : 0;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

            <div className="mx-auto max-w-7xl space-y-6">

                {/* =================================================
                    HEADER
                ================================================== */}

                <div className="overflow-hidden rounded-3xl bg-linear-to-r from-cyan-600 via-blue-600 to-indigo-700 p-6 text-white shadow-lg md:p-8">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <div className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                                Class Teacher
                            </div>

                            <h1 className="text-2xl font-bold md:text-3xl">
                                Attendance Analytics
                            </h1>

                            <p className="mt-2 text-sm text-blue-100 md:text-base">
                                Analyze class attendance performance and subject trends.
                            </p>

                        </div>

                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">

                            <p className="text-xs uppercase tracking-wider text-blue-100">
                                Teacher
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                                {teacherInfo.name ||
                                    teacherInfo.username ||
                                    "Class Teacher"}
                            </p>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    DATE FILTER
                ================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                        <div>

                            <h2 className="text-lg font-bold text-slate-800">
                                Analytics Date
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Select the date used for the attendance analysis.
                            </p>

                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">

                            <div>

                                <label
                                    htmlFor="analytics-date"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Date
                                </label>

                                <input
                                    id="analytics-date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(event) =>
                                        setSelectedDate(
                                            event.target.value
                                        )
                                    }
                                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                            <button
                                type="button"
                                onClick={refreshAnalytics}
                                disabled={refreshing}
                                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:self-end"
                            >
                                {refreshing
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </button>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                        <h3 className="font-semibold text-red-800">
                            Unable to load analytics
                        </h3>

                        <p className="mt-1 text-sm text-red-700">
                            {error}
                        </p>

                    </div>
                )}

                {/* =================================================
                    TOP STATISTICS
                ================================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">

                        <p className="text-sm font-medium text-blue-700">
                            Class Strength
                        </p>

                        <p className="mt-2 text-3xl font-bold text-blue-800">
                            {totalStudents}
                        </p>

                        <p className="mt-1 text-xs text-blue-600">
                            Total students
                        </p>

                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">

                        <p className="text-sm font-medium text-emerald-700">
                            Attendance
                        </p>

                        <p className="mt-2 text-3xl font-bold text-emerald-800">
                            {overallPercentage.toFixed(
                                1
                            )}
                            %
                        </p>

                        <p className="mt-1 text-xs text-emerald-600">
                            Overall attendance
                        </p>

                    </div>

                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">

                        <p className="text-sm font-medium text-violet-700">
                            Subjects
                        </p>

                        <p className="mt-2 text-3xl font-bold text-violet-800">
                            {subjectRows.length}
                        </p>

                        <p className="mt-1 text-xs text-violet-600">
                            Subjects with attendance data
                        </p>

                    </div>

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">

                        <p className="text-sm font-medium text-red-700">
                            Absentees
                        </p>

                        <p className="mt-2 text-3xl font-bold text-red-800">
                            {absentStudents.length}
                        </p>

                        <p className="mt-1 text-xs text-red-600">
                            Students absent
                        </p>

                    </div>

                </div>

                {/* =================================================
                    ATTENDANCE DISTRIBUTION
                ================================================== */}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Attendance Distribution
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Present, absent and late breakdown.
                                </p>
                            </div>

                            <div className="text-2xl">
                                📊
                            </div>

                        </div>

                        <div className="mt-8 space-y-6">

                            <div>

                                <div className="mb-2 flex items-center justify-between">

                                    <span className="text-sm font-medium text-slate-600">
                                        Present
                                    </span>

                                    <span className="font-bold text-emerald-600">
                                        {totalPresent}{" "}
                                        ({presentPercentage.toFixed(
                                            1
                                        )}
                                        %)
                                    </span>

                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{
                                            width: `${Math.min(
                                                presentPercentage,
                                                100
                                            )}%`,
                                        }}
                                    />

                                </div>

                            </div>

                            <div>

                                <div className="mb-2 flex items-center justify-between">

                                    <span className="text-sm font-medium text-slate-600">
                                        Absent
                                    </span>

                                    <span className="font-bold text-red-600">
                                        {totalAbsent}{" "}
                                        ({absentPercentage.toFixed(
                                            1
                                        )}
                                        %)
                                    </span>

                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                                    <div
                                        className="h-full rounded-full bg-red-500"
                                        style={{
                                            width: `${Math.min(
                                                absentPercentage,
                                                100
                                            )}%`,
                                        }}
                                    />

                                </div>

                            </div>

                            <div>

                                <div className="mb-2 flex items-center justify-between">

                                    <span className="text-sm font-medium text-slate-600">
                                        Late
                                    </span>

                                    <span className="font-bold text-amber-600">
                                        {totalLate}{" "}
                                        ({latePercentage.toFixed(
                                            1
                                        )}
                                        %)
                                    </span>

                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                                    <div
                                        className="h-full rounded-full bg-amber-500"
                                        style={{
                                            width: `${Math.min(
                                                latePercentage,
                                                100
                                            )}%`,
                                        }}
                                    />

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* =================================================
                        PERFORMANCE
                    ================================================== */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                        <h2 className="text-lg font-bold text-slate-800">
                            Performance Overview
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Overall class performance indicators.
                        </p>

                        <div className="mt-6 space-y-4">

                            <div className="rounded-xl bg-slate-50 p-4">

                                <div className="flex items-center justify-between">

                                    <span className="text-sm font-medium text-slate-600">
                                        Overall Attendance
                                    </span>

                                    <span
                                        className={`text-lg font-bold ${getPercentageClass(
                                            overallPercentage
                                        )}`}
                                    >
                                        {overallPercentage.toFixed(
                                            1
                                        )}
                                        %
                                    </span>

                                </div>

                                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">

                                    <div
                                        className={`h-full rounded-full ${getProgressClass(
                                            overallPercentage
                                        )}`}
                                        style={{
                                            width: `${Math.min(
                                                overallPercentage,
                                                100
                                            )}%`,
                                        }}
                                    />

                                </div>

                            </div>

                            <div className="rounded-xl bg-slate-50 p-4">

                                <div className="flex items-center justify-between">

                                    <span className="text-sm font-medium text-slate-600">
                                        Average Subject Attendance
                                    </span>

                                    <span
                                        className={`text-lg font-bold ${getPercentageClass(
                                            averageSubjectAttendance
                                        )}`}
                                    >
                                        {averageSubjectAttendance.toFixed(
                                            1
                                        )}
                                        %
                                    </span>

                                </div>

                                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">

                                    <div
                                        className={`h-full rounded-full ${getProgressClass(
                                            averageSubjectAttendance
                                        )}`}
                                        style={{
                                            width: `${Math.min(
                                                averageSubjectAttendance,
                                                100
                                            )}%`,
                                        }}
                                    />

                                </div>

                            </div>

                            <div className="grid grid-cols-2 gap-3">

                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                                    <p className="text-xs font-medium text-emerald-700">
                                        Best Subject
                                    </p>

                                    <p className="mt-1 truncate font-bold text-emerald-900">
                                        {highestSubject?.subject ||
                                            "No data"}
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-emerald-600">
                                        {highestSubject
                                            ? `${highestSubject.percentage.toFixed(
                                                  1
                                              )}%`
                                            : "-"}
                                    </p>

                                </div>

                                <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                                    <p className="text-xs font-medium text-red-700">
                                        Lowest Subject
                                    </p>

                                    <p className="mt-1 truncate font-bold text-red-900">
                                        {lowestSubject?.subject ||
                                            "No data"}
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-red-600">
                                        {lowestSubject
                                            ? `${lowestSubject.percentage.toFixed(
                                                  1
                                              )}%`
                                            : "-"}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    SUBJECT ANALYTICS
                ================================================== */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5 md:p-6">

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-slate-800">
                                    Subject Analytics
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Compare attendance across subjects.
                                </p>

                            </div>

                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                {subjectRows.length} Subjects
                            </span>

                        </div>

                    </div>

                    {loading ? (
                        <div className="p-12 text-center">

                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                            <p className="mt-4 text-sm text-slate-500">
                                Loading analytics...
                            </p>

                        </div>
                    ) : subjectRows.length === 0 ? (
                        <div className="p-12 text-center">

                            <div className="text-4xl">
                                📈
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-slate-800">
                                No analytics data
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                There is no attendance data for{" "}
                                {formatDate(selectedDate)}.
                            </p>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="min-w-full text-left">

                                <thead className="bg-slate-50">

                                    <tr>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Subject
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Staff
                                        </th>

                                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Present
                                        </th>

                                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Absent
                                        </th>

                                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Late
                                        </th>

                                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Percentage
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {subjectRows.map(
                                        (row) => (
                                            <tr
                                                key={row.id}
                                                className="transition hover:bg-slate-50"
                                            >

                                                <td className="px-5 py-4">

                                                    <p className="font-semibold text-slate-800">
                                                        {
                                                            row.subject
                                                        }
                                                    </p>

                                                    <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                                        {
                                                            row.code
                                                        }
                                                    </span>

                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {row.staff}
                                                </td>

                                                <td className="px-5 py-4 text-center font-semibold text-emerald-600">
                                                    {
                                                        row.present
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-center font-semibold text-red-600">
                                                    {
                                                        row.absent
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-center font-semibold text-amber-600">
                                                    {row.late}
                                                </td>

                                                <td className="min-w-50 px-5 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">

                                                            <div
                                                                className={`h-full rounded-full ${getProgressClass(
                                                                    row.percentage
                                                                )}`}
                                                                style={{
                                                                    width: `${Math.min(
                                                                        row.percentage,
                                                                        100
                                                                    )}%`,
                                                                }}
                                                            />

                                                        </div>

                                                        <span
                                                            className={`w-14 text-right text-sm font-bold ${getPercentageClass(
                                                                row.percentage
                                                            )}`}
                                                        >
                                                            {row.percentage.toFixed(
                                                                1
                                                            )}
                                                            %
                                                        </span>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {/* =================================================
                    CLASS INFORMATION
                ================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-4">

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Department
                            </p>

                            <p className="mt-2 font-bold text-slate-800">
                                {classInfo.department_name ||
                                    classInfo.department ||
                                    "Computer Science"}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Year
                            </p>

                            <p className="mt-2 font-bold text-slate-800">
                                {classInfo.year || "-"}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Section
                            </p>

                            <p className="mt-2 font-bold text-slate-800">
                                {classInfo.section || "-"}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Analysis Date
                            </p>

                            <p className="mt-2 font-bold text-blue-600">
                                {formatDate(selectedDate)}
                            </p>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}

export default ClassTeacherAnalytics;