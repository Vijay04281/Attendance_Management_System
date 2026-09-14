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

const getStudentName = (student) => {
    return (
        student.name ||
        student.student_name ||
        student.studentName ||
        student.full_name ||
        "Unknown Student"
    );
};

const getRegisterNumber = (student) => {
    return (
        student.register_number ||
        student.register_no ||
        student.reg_no ||
        student.registerNumber ||
        "-"
    );
};

const getStudentEmail = (student) => {
    return (
        student.email ||
        student.email_address ||
        "-"
    );
};

const getDepartment = (student, classInfo) => {
    return (
        student.department ||
        student.department_name ||
        classInfo?.department ||
        classInfo?.department_name ||
        "-"
    );
};

const getYear = (student, classInfo) => {
    return (
        student.year ||
        student.class_year ||
        classInfo?.year ||
        classInfo?.class_year ||
        "-"
    );
};

const getSection = (student, classInfo) => {
    return (
        student.section ||
        student.class_section ||
        classInfo?.section ||
        classInfo?.class_section ||
        "-"
    );
};

function ClassTeacherAbsent() {
    const [selectedDate, setSelectedDate] = useState(getToday());

    const [absentStudents, setAbsentStudents] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [dashboardLoading, setDashboardLoading] = useState(true);

    const [error, setError] = useState("");
    const [dashboardError, setDashboardError] = useState("");

    const [refreshing, setRefreshing] = useState(false);

    const fetchAbsentStudents = async (date = selectedDate) => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error("Authentication token not found");
            }

            const response = await fetch(
                `${API_BASE_URL}/class-teacher/absent-students?date=${date}`,
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
                        "Failed to load absent students"
                );
            }

            let students = [];

            if (Array.isArray(data?.absent_students)) {
                students = data.absent_students;
            } else if (Array.isArray(data?.absentStudents)) {
                students = data.absentStudents;
            } else if (Array.isArray(data?.students)) {
                students = data.students;
            } else if (Array.isArray(data?.data?.absent_students)) {
                students = data.data.absent_students;
            } else if (Array.isArray(data?.data?.students)) {
                students = data.data.students;
            } else if (Array.isArray(data?.data)) {
                students = data.data;
            } else if (Array.isArray(data)) {
                students = data;
            }

            setAbsentStudents(students);
        } catch (err) {
            console.error(
                "Class Teacher Absent Students Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to load absent students"
            );

            setAbsentStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboard = async () => {
        try {
            setDashboardLoading(true);
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
                        "Failed to load class information"
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
                    "Failed to load class information"
            );
        } finally {
            setDashboardLoading(false);
        }
    };

    const loadAllData = async () => {
        setRefreshing(true);

        try {
            await Promise.all([
                fetchAbsentStudents(selectedDate),
                fetchDashboard(),
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAbsentStudents(selectedDate);
    }, [selectedDate]);

    useEffect(() => {
        fetchDashboard();
    }, []);

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
                statistics.totalStudents ??
                dashboardData?.total_students ??
                dashboardData?.totalStudents ??
                dashboardData?.data?.total_students ??
                dashboardData?.data?.totalStudents ??
                0
        ) || 0;

    const filteredStudents = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return absentStudents;
        }

        return absentStudents.filter((student) => {
            const registerNumber = String(
                getRegisterNumber(student)
            ).toLowerCase();

            const name = String(
                getStudentName(student)
            ).toLowerCase();

            const email = String(
                getStudentEmail(student)
            ).toLowerCase();

            return (
                registerNumber.includes(value) ||
                name.includes(value) ||
                email.includes(value)
            );
        });
    }, [absentStudents, search]);

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
        setSearch("");
    };

    const handleRefresh = async () => {
        await loadAllData();
    };

    const className =
        classInfo?.class_name ||
        classInfo?.className ||
        classInfo?.name ||
        `Class ${classInfo?.year || ""}`;

    const teacherName =
        teacherInfo?.name ||
        teacherInfo?.full_name ||
        teacherInfo?.teacher_name ||
        teacherInfo?.username ||
        "Class Teacher";

    const teacherUsername =
        teacherInfo?.username ||
        "";

    const department =
        classInfo?.department_name ||
        classInfo?.department ||
        "Computer Science";

    const year =
        classInfo?.year ||
        classInfo?.class_year ||
        "-";

    const section =
        classInfo?.section ||
        classInfo?.class_section ||
        "-";

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div className="overflow-hidden rounded-3xl bg-linear-to-r from-red-600 via-rose-600 to-orange-500 p-6 text-white shadow-lg md:p-8">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div>
                            <div className="mb-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                                Class Teacher
                            </div>

                            <h1 className="text-2xl font-bold md:text-3xl">
                                Absent Students
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-red-100 md:text-base">
                                View students marked absent for the selected date.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">

                            <p className="text-xs uppercase tracking-wider text-red-100">
                                Teacher
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                                {teacherName}
                            </p>

                            {teacherUsername && (
                                <p className="text-sm text-red-100">
                                    {teacherUsername}
                                </p>
                            )}

                        </div>

                    </div>
                </div>

                {/* =====================================================
                    CLASS INFORMATION
                ====================================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Department
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            {department}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Year
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            {year}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Section
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            {section}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Students
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            {totalStudents}
                        </p>

                    </div>

                </div>

                {/* =====================================================
                    FILTER
                ====================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Attendance Date
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Select a date to view absent students.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">

                            <div>

                                <label
                                    htmlFor="absent-date"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Date
                                </label>

                                <input
                                    id="absent-date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                />

                            </div>

                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:self-end"
                            >
                                {refreshing
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </button>

                        </div>

                    </div>

                </div>

                {/* =====================================================
                    DATE DISPLAY
                ====================================================== */}

                <div className="rounded-2xl border border-red-100 bg-red-50 p-5">

                    <p className="text-sm font-medium text-red-700">
                        Showing absentees for
                    </p>

                    <p className="mt-1 text-xl font-bold text-red-900">
                        {formatDate(selectedDate)}
                    </p>

                </div>

                {/* =====================================================
                    STAT CARDS
                ====================================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-red-700">
                                    Absent Students
                                </p>

                                <p className="mt-2 text-3xl font-bold text-red-700">
                                    {absentStudents.length}
                                </p>

                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl">
                                !
                            </div>

                        </div>

                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-blue-700">
                                    Class Strength
                                </p>

                                <p className="mt-2 text-3xl font-bold text-blue-700">
                                    {totalStudents}
                                </p>

                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl">
                                👥
                            </div>

                        </div>

                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-emerald-700">
                                    Attendance Status
                                </p>

                                <p className="mt-2 text-xl font-bold text-emerald-700">
                                    {absentStudents.length === 0
                                        ? "All Present"
                                        : "Absentees Found"}
                                </p>

                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl">
                                {absentStudents.length === 0
                                    ? "✓"
                                    : "!"}
                            </div>

                        </div>

                    </div>

                </div>

                {/* =====================================================
                    DASHBOARD ERROR
                ====================================================== */}

                {dashboardError && (
                    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

                        <div className="flex items-start gap-3">

                            <div className="mt-0.5 text-yellow-600">
                                ⚠
                            </div>

                            <div>

                                <h3 className="font-semibold text-yellow-800">
                                    Class information unavailable
                                </h3>

                                <p className="mt-1 text-sm text-yellow-700">
                                    {dashboardError}
                                </p>

                            </div>

                        </div>

                    </div>
                )}

                {/* =====================================================
                    ABSENT STUDENT TABLE
                ====================================================== */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5 md:p-6">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-slate-800">
                                    Absent Student List
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Students marked absent for{" "}
                                    {formatDate(selectedDate)}.
                                </p>

                            </div>

                            <div className="w-full lg:w-80">

                                <label
                                    htmlFor="student-search"
                                    className="sr-only"
                                >
                                    Search students
                                </label>

                                <div className="relative">

                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        🔎
                                    </span>

                                    <input
                                        id="student-search"
                                        type="text"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Search name or register number..."
                                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                    />

                                </div>

                            </div>

                        </div>

                    </div>

                    {loading ? (
                        <div className="p-10 text-center">

                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />

                            <p className="mt-4 text-sm text-slate-500">
                                Loading absent students...
                            </p>

                        </div>
                    ) : absentStudents.length === 0 ? (
                        <div className="p-12 text-center">

                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                                ✓
                            </div>

                            <h3 className="mt-5 text-xl font-bold text-slate-800">
                                No absent students
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                All students are present, or attendance
                                has not been closed for this date.
                            </p>

                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="p-12 text-center">

                            <div className="text-4xl">
                                🔎
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-slate-800">
                                No matching students
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Try searching with a different name
                                or register number.
                            </p>

                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Clear Search
                            </button>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="min-w-237.5 w-full text-left">

                                <thead className="bg-slate-50">

                                    <tr>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            #
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Register Number
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Student
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Email
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Department
                                        </th>

                                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Year
                                        </th>

                                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Section
                                        </th>

                                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Status
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {filteredStudents.map(
                                        (student, index) => {

                                            const registerNumber =
                                                getRegisterNumber(
                                                    student
                                                );

                                            const studentName =
                                                getStudentName(
                                                    student
                                                );

                                            const email =
                                                getStudentEmail(
                                                    student
                                                );

                                            const studentDepartment =
                                                getDepartment(
                                                    student,
                                                    classInfo
                                                );

                                            const studentYear =
                                                getYear(
                                                    student,
                                                    classInfo
                                                );

                                            const studentSection =
                                                getSection(
                                                    student,
                                                    classInfo
                                                );

                                            return (
                                                <tr
                                                    key={`absent-${student.student_id || student.user_id || registerNumber}-${index}`}
                                                    className="transition hover:bg-red-50/40"
                                                >

                                                    <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                                        {index + 1}
                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                                            {
                                                                registerNumber
                                                            }
                                                        </span>

                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
                                                                {studentName
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div>

                                                                <p className="font-semibold text-slate-800">
                                                                    {
                                                                        studentName
                                                                    }
                                                                </p>

                                                                {student.user_id && (
                                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                                        User ID:{" "}
                                                                        {
                                                                            student.user_id
                                                                        }
                                                                    </p>
                                                                )}

                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {email}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {
                                                            studentDepartment
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-center text-sm font-medium text-slate-700">
                                                        {
                                                            studentYear
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-center text-sm font-medium text-slate-700">
                                                        {
                                                            studentSection
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-center">

                                                        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
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

                    {!loading &&
                        absentStudents.length > 0 && (
                            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">

                                <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">

                                    <p className="text-slate-600">
                                        Showing{" "}
                                        <span className="font-bold text-slate-800">
                                            {
                                                filteredStudents.length
                                            }
                                        </span>{" "}
                                        of{" "}
                                        <span className="font-bold text-slate-800">
                                            {
                                                absentStudents.length
                                            }
                                        </span>{" "}
                                        absent students
                                    </p>

                                    <p className="font-medium text-red-600">
                                        Date:{" "}
                                        {formatDate(
                                            selectedDate
                                        )}
                                    </p>

                                </div>

                            </div>
                        )}

                </div>

                {/* =====================================================
                    INFORMATION CARD
                ====================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="flex items-start gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl">
                            ℹ
                        </div>

                        <div>

                            <h3 className="font-bold text-slate-800">
                                About absent students
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                This list is generated from attendance
                                records for the selected date. Students
                                appear here when their attendance status
                                is recorded as absent.
                            </p>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}

export default ClassTeacherAbsent;