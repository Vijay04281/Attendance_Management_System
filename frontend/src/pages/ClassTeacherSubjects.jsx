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

function ClassTeacherSubjects() {
    const [staff, setStaff] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [dashboardLoading, setDashboardLoading] = useState(true);

    const [error, setError] = useState("");
    const [dashboardError, setDashboardError] = useState("");

    const [refreshing, setRefreshing] = useState(false);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error("Authentication token not found");
            }

            const response = await fetch(
                `${API_BASE_URL}/class-teacher/staff`,
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
                        "Failed to load class subjects"
                );
            }

            let staffList = [];

            if (Array.isArray(data.staff)) {
                staffList = data.staff;
            } else if (Array.isArray(data.data)) {
                staffList = data.data;
            } else if (Array.isArray(data)) {
                staffList = data;
            }

            setStaff(staffList);
        } catch (err) {
            console.error(
                "Class Teacher Subjects Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to load class subjects"
            );

            setStaff([]);
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
                "Dashboard Error:",
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

    const loadData = async () => {
        setRefreshing(true);

        await Promise.all([
            fetchStaff(),
            fetchDashboard(),
        ]);

        setRefreshing(false);
    };

    useEffect(() => {
        fetchStaff();
        fetchDashboard();
    }, []);

    const classInfo =
        dashboardData?.class ||
        dashboardData?.data?.class ||
        {};

    const filteredStaff = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return staff;
        }

        return staff.filter((item) => {
            const staffName = String(
                item.staff_name ||
                    item.name ||
                    item.staff ||
                    ""
            ).toLowerCase();

            const staffCode = String(
                item.staff_code ||
                    item.staff_id ||
                    ""
            ).toLowerCase();

            const subjectName = String(
                item.subject_name ||
                    item.subject ||
                    ""
            ).toLowerCase();

            const subjectCode = String(
                item.subject_code ||
                    item.code ||
                    ""
            ).toLowerCase();

            return (
                staffName.includes(value) ||
                staffCode.includes(value) ||
                subjectName.includes(value) ||
                subjectCode.includes(value)
            );
        });
    }, [staff, search]);

    const uniqueSubjects = useMemo(() => {
        const subjects = staff.map((item) => {
            return (
                item.subject_id ||
                item.subject_code ||
                item.subject_name ||
                item.subject
            );
        });

        return new Set(
            subjects.filter(Boolean)
        ).size;
    }, [staff]);

    const uniqueStaff = useMemo(() => {
        const teachers = staff.map((item) => {
            return (
                item.staff_id ||
                item.staff_code ||
                item.staff_name ||
                item.name
            );
        });

        return new Set(
            teachers.filter(Boolean)
        ).size;
    }, [staff]);

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

            <div className="mx-auto max-w-7xl space-y-6">

                {/* =================================================
                    HEADER
                ================================================== */}

                <div className="overflow-hidden rounded-3xl bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-500 p-6 text-white shadow-lg md:p-8">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <div className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                                Class Teacher
                            </div>

                            <h1 className="text-2xl font-bold md:text-3xl">
                                Subjects
                            </h1>

                            <p className="mt-2 text-sm text-purple-100 md:text-base">
                                View all subjects and staff handling your class.
                            </p>

                        </div>

                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">

                            <p className="text-xs uppercase tracking-wider text-purple-100">
                                Class
                            </p>

                            <p className="mt-1 text-xl font-bold">
                                {classInfo.year
                                    ? `Year ${classInfo.year}`
                                    : "Class"}
                                {classInfo.section
                                    ? ` - ${classInfo.section}`
                                    : ""}
                            </p>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    CLASS INFORMATION
                ================================================== */}

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
                            Year
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            {classInfo.year || "-"}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Subjects
                        </p>

                        <p className="mt-2 text-lg font-bold text-violet-600">
                            {uniqueSubjects}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Staff
                        </p>

                        <p className="mt-2 text-lg font-bold text-blue-600">
                            {uniqueStaff}
                        </p>

                    </div>

                </div>

                {/* =================================================
                    SEARCH
                ================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                        <div>

                            <h2 className="text-lg font-bold text-slate-800">
                                Class Subjects
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Search by subject or staff name.
                            </p>

                        </div>

                        <div className="w-full lg:w-96">

                            <label
                                htmlFor="subject-search"
                                className="sr-only"
                            >
                                Search subjects
                            </label>

                            <div className="relative">

                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    🔎
                                </span>

                                <input
                                    id="subject-search"
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search subject, code or staff..."
                                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                />

                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                        <h3 className="font-semibold text-red-800">
                            Unable to load subjects
                        </h3>

                        <p className="mt-1 text-sm text-red-700">
                            {error}
                        </p>

                    </div>
                )}

                {/* =================================================
                    SUBJECT TABLE
                ================================================== */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5 md:p-6">

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-slate-800">
                                    Subjects & Staff
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Staff assigned to subjects for this class.
                                </p>

                            </div>

                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                                {filteredStaff.length} Records
                            </span>

                        </div>

                    </div>

                    {loading || dashboardLoading ? (
                        <div className="p-12 text-center">

                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />

                            <p className="mt-4 text-sm text-slate-500">
                                Loading subjects...
                            </p>

                        </div>
                    ) : dashboardError ? (
                        <div className="p-10 text-center">

                            <p className="text-sm text-red-600">
                                {dashboardError}
                            </p>

                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="p-12 text-center">

                            <div className="text-4xl">
                                📚
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-slate-800">
                                No subjects found
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                No subject or staff assignment matches your search.
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
                                            Staff Code
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Department
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {filteredStaff.map(
                                        (item, index) => {

                                            const subjectName =
                                                item.subject_name ||
                                                item.subject ||
                                                "-";

                                            const subjectCode =
                                                item.subject_code ||
                                                item.code ||
                                                "-";

                                            const staffName =
                                                item.staff_name ||
                                                item.name ||
                                                item.staff ||
                                                "-";

                                            const staffCode =
                                                item.staff_code ||
                                                item.staff_id ||
                                                "-";

                                            const department =
                                                item.department_name ||
                                                item.department ||
                                                classInfo.department_name ||
                                                classInfo.department ||
                                                "-";

                                            return (
                                                <tr
                                                    key={`subject-${item.subject_id || subjectCode || index}-${item.staff_id || staffCode || index}-${index}`}
                                                    className="transition hover:bg-violet-50/40"
                                                >

                                                    <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                                        {index + 1}
                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-lg">
                                                                📚
                                                            </div>

                                                            <div>
                                                                <p className="font-semibold text-slate-800">
                                                                    {
                                                                        subjectName
                                                                    }
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-slate-400">
                                                                    Subject
                                                                </p>
                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                                                            {
                                                                subjectCode
                                                            }
                                                        </span>

                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                                                {String(
                                                                    staffName
                                                                )
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <span className="font-medium text-slate-700">
                                                                {
                                                                    staffName
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <span className="text-sm font-medium text-slate-600">
                                                            {
                                                                staffCode
                                                            }
                                                        </span>

                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {
                                                            department
                                                        }
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
                        filteredStaff.length > 0 && (
                            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                    <p className="text-sm text-slate-600">
                                        Showing{" "}
                                        <span className="font-bold text-slate-800">
                                            {
                                                filteredStaff.length
                                            }
                                        </span>{" "}
                                        subject assignments
                                    </p>

                                    <button
                                        type="button"
                                        onClick={loadData}
                                        disabled={refreshing}
                                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                    >
                                        {refreshing
                                            ? "Refreshing..."
                                            : "Refresh Data"}
                                    </button>

                                </div>

                            </div>
                        )}

                </div>

                {/* =================================================
                    INFORMATION
                ================================================== */}

                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-6">

                    <div className="flex items-start gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xl">
                            ℹ
                        </div>

                        <div>

                            <h3 className="font-bold text-violet-900">
                                Class Subject Information
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-violet-700">
                                This page displays the subjects assigned to
                                your class and the staff members responsible
                                for handling those subjects.
                            </p>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}

export default ClassTeacherSubjects;