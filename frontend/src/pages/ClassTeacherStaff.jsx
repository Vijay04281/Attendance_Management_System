import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// =====================================================
// AUTH
// =====================================================

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        ""
    );
};

// =====================================================
// API HELPER
// =====================================================

const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    if (!token) {
        throw new Error("Authentication token not found");
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            method: options.method || "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
            body: options.body
                ? JSON.stringify(options.body)
                : undefined,
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
            data?.message ||
                data?.error ||
                data?.data?.message ||
                `Request failed with status ${response.status}`
        );
    }

    return data;
};

// =====================================================
// RESPONSE HELPERS
// =====================================================

const extractArray = (data, possibleKeys = []) => {
    if (Array.isArray(data)) {
        return data;
    }

    for (const key of possibleKeys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }

        if (Array.isArray(data?.data?.[key])) {
            return data.data[key];
        }

        if (Array.isArray(data?.result?.[key])) {
            return data.result[key];
        }
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data?.result)) {
        return data.result;
    }

    return [];
};

const extractObject = (data, possibleKeys = []) => {
    if (!data || typeof data !== "object") {
        return {};
    }

    for (const key of possibleKeys) {
        if (
            data[key] &&
            typeof data[key] === "object" &&
            !Array.isArray(data[key])
        ) {
            return data[key];
        }

        if (
            data?.data?.[key] &&
            typeof data.data[key] === "object" &&
            !Array.isArray(data.data[key])
        ) {
            return data.data[key];
        }

        if (
            data?.result?.[key] &&
            typeof data.result[key] === "object" &&
            !Array.isArray(data.result[key])
        ) {
            return data.result[key];
        }
    }

    if (
        data?.data &&
        typeof data.data === "object" &&
        !Array.isArray(data.data)
    ) {
        return data.data;
    }

    if (
        data?.result &&
        typeof data.result === "object" &&
        !Array.isArray(data.result)
    ) {
        return data.result;
    }

    return data;
};

// =====================================================
// NORMALIZE STAFF
// =====================================================

const normalizeStaffRecord = (item = {}) => {
    return {
        ...item,

        staff_id:
            item.staff_id ??
            item.staffId ??
            item.id ??
            null,

        staff_code:
            item.staff_code ??
            item.staffCode ??
            item.code ??
            "",

        staff_name:
            item.staff_name ??
            item.staffName ??
            item.name ??
            item.full_name ??
            item.fullName ??
            "",

        email:
            item.email ??
            item.staff_email ??
            item.staffEmail ??
            "",

        phone:
            item.phone ??
            item.staff_phone ??
            item.staffPhone ??
            "",

        subject_id:
            item.subject_id ??
            item.subjectId ??
            null,

        subject_code:
            item.subject_code ??
            item.subjectCode ??
            item.code ??
            "",

        subject_name:
            item.subject_name ??
            item.subjectName ??
            item.subject ??
            "",

        department_id:
            item.department_id ??
            item.departmentId ??
            null,

        department_name:
            item.department_name ??
            item.departmentName ??
            item.department ??
            "",

        class_id:
            item.class_id ??
            item.classId ??
            null,

        year:
            item.year ??
            item.class_year ??
            item.classYear ??
            null,

        section:
            item.section ??
            item.class_section ??
            item.classSection ??
            "",
    };
};

// =====================================================
// COMPONENT
// =====================================================

function ClassTeacherStaff() {
    const [staff, setStaff] = useState([]);
    const [classInfo, setClassInfo] = useState({});

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [classLoading, setClassLoading] = useState(true);

    const [error, setError] = useState("");
    const [classError, setClassError] = useState("");

    const [refreshing, setRefreshing] = useState(false);

    // =================================================
    // LOAD CLASS
    // =================================================

    const fetchClass = async () => {
        try {
            setClassLoading(true);
            setClassError("");

            const data = await apiRequest(
                "/class-teacher/class"
            );

            console.log(
                "Class Teacher Class Response:",
                data
            );

            const classData = extractObject(data, [
                "class",
                "classInfo",
                "class_info",
            ]);

            setClassInfo(classData || {});
        } catch (err) {
            console.error(
                "Class Teacher Class Error:",
                err
            );

            setClassError(
                err.message ||
                    "Failed to load class information"
            );

            setClassInfo({});
        } finally {
            setClassLoading(false);
        }
    };

    // =================================================
    // LOAD CLASS STAFF
    // =================================================

    const fetchStaff = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest(
                "/class-teacher/staff"
            );

            console.log(
                "Class Teacher Staff Response:",
                data
            );

            const staffList = extractArray(data, [
                "staff",
                "staffList",
                "staff_list",
                "classStaff",
                "class_staff",
                "records",
                "rows",
            ]);

            const normalizedStaff = staffList
                .map(normalizeStaffRecord)
                .filter((item) => {
                    return (
                        item.staff_id ||
                        item.staff_code ||
                        item.staff_name
                    );
                });

            setStaff(normalizedStaff);
        } catch (err) {
            console.error(
                "Class Teacher Staff Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to load class staff"
            );

            setStaff([]);
        } finally {
            setLoading(false);
        }
    };

    // =================================================
    // LOAD EVERYTHING
    // =================================================

    const loadData = async () => {
        try {
            setRefreshing(true);

            await Promise.all([
                fetchClass(),
                fetchStaff(),
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {
        loadData();
    }, []);

    // =================================================
    // FILTER STAFF
    // =================================================

    const filteredStaff = useMemo(() => {
        const value = search
            .trim()
            .toLowerCase();

        if (!value) {
            return staff;
        }

        return staff.filter((item) => {
            const staffName = String(
                item.staff_name || ""
            ).toLowerCase();

            const staffCode = String(
                item.staff_code || ""
            ).toLowerCase();

            const email = String(
                item.email || ""
            ).toLowerCase();

            const phone = String(
                item.phone || ""
            ).toLowerCase();

            const department = String(
                item.department_name || ""
            ).toLowerCase();

            const subjectName = String(
                item.subject_name || ""
            ).toLowerCase();

            const subjectCode = String(
                item.subject_code || ""
            ).toLowerCase();

            return (
                staffName.includes(value) ||
                staffCode.includes(value) ||
                email.includes(value) ||
                phone.includes(value) ||
                department.includes(value) ||
                subjectName.includes(value) ||
                subjectCode.includes(value)
            );
        });
    }, [staff, search]);

    // =================================================
    // UNIQUE STAFF
    // =================================================

    const uniqueStaff = useMemo(() => {
        const ids = staff.map((item) => {
            return (
                item.staff_id ||
                item.staff_code ||
                item.staff_name
            );
        });

        return new Set(
            ids.filter(Boolean)
        ).size;
    }, [staff]);

    // =================================================
    // UNIQUE SUBJECTS
    // =================================================

    const uniqueSubjects = useMemo(() => {
        const subjects = staff.map((item) => {
            return (
                item.subject_id ||
                item.subject_code ||
                item.subject_name
            );
        });

        return new Set(
            subjects.filter(Boolean)
        ).size;
    }, [staff]);

    // =================================================
    // CLASS DISPLAY
    // =================================================

    const departmentName =
        classInfo.department_name ||
        classInfo.department ||
        classInfo.departmentName ||
        "-";

    const departmentCode =
        classInfo.department_code ||
        classInfo.departmentCode ||
        "";

    const classYear =
        classInfo.year ||
        classInfo.class_year ||
        classInfo.classYear ||
        "";

    const classSection =
        classInfo.section ||
        classInfo.class_section ||
        classInfo.classSection ||
        "";

    const academicYear =
        classInfo.academic_year ||
        classInfo.academicYear ||
        "-";

    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

            <div className="mx-auto max-w-7xl space-y-6">

                {/* =================================================
                    HEADER
                ================================================== */}

                <div className="overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg md:p-8">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <div className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                                Class Teacher
                            </div>

                            <h1 className="text-2xl font-bold md:text-3xl">
                                Class Staff
                            </h1>

                            <p className="mt-2 text-sm text-blue-100 md:text-base">
                                View staff members handling subjects for your class.
                            </p>

                        </div>

                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">

                            <p className="text-xs uppercase tracking-wider text-blue-100">
                                Class
                            </p>

                            <p className="mt-1 text-xl font-bold">

                                {classYear
                                    ? `Year ${classYear}`
                                    : "Class"}

                                {classSection
                                    ? ` - ${classSection}`
                                    : ""}

                            </p>

                            {departmentName !== "-" && (
                                <p className="mt-1 text-sm text-blue-100">
                                    {departmentName}
                                    {departmentCode
                                        ? ` (${departmentCode})`
                                        : ""}
                                </p>
                            )}

                        </div>

                    </div>

                </div>

                {/* =================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                        <h3 className="font-semibold text-red-800">
                            Unable to load staff
                        </h3>

                        <p className="mt-1 text-sm text-red-700">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={loadData}
                            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                        >
                            Try Again
                        </button>

                    </div>
                )}

                {/* =================================================
                    CLASS ERROR
                ================================================== */}

                {classError && !error && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

                        <h3 className="font-semibold text-amber-800">
                            Class information unavailable
                        </h3>

                        <p className="mt-1 text-sm text-amber-700">
                            {classError}
                        </p>

                    </div>
                )}

                {/* =================================================
                    SUMMARY CARDS
                ================================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* STAFF */}

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-blue-700">
                                    Staff
                                </p>

                                <p className="mt-2 text-3xl font-bold text-blue-800">
                                    {uniqueStaff}
                                </p>

                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl">
                                👨‍🏫
                            </div>

                        </div>

                    </div>

                    {/* SUBJECTS */}

                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-violet-700">
                                    Subjects
                                </p>

                                <p className="mt-2 text-3xl font-bold text-violet-800">
                                    {uniqueSubjects}
                                </p>

                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl">
                                📚
                            </div>

                        </div>

                    </div>

                    {/* DEPARTMENT */}

                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div className="min-w-0">

                                <p className="text-sm font-medium text-cyan-700">
                                    Department
                                </p>

                                <p className="mt-2 truncate text-lg font-bold text-cyan-800">
                                    {departmentName}
                                </p>

                                {departmentCode && (
                                    <p className="mt-1 text-xs text-cyan-600">
                                        {departmentCode}
                                    </p>
                                )}

                            </div>

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                                🏫
                            </div>

                        </div>

                    </div>

                    {/* CLASS */}

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-emerald-700">
                                    Class
                                </p>

                                <p className="mt-2 text-xl font-bold text-emerald-800">

                                    {classYear
                                        ? `Year ${classYear}`
                                        : "-"}

                                </p>

                                <p className="text-xs text-emerald-600">
                                    Section{" "}
                                    {classSection || "-"}
                                </p>

                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl">
                                🎓
                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    SEARCH
                ================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                        <div>

                            <h2 className="text-lg font-bold text-slate-800">
                                Staff Directory
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Search staff, subject or department.
                            </p>

                        </div>

                        <div className="w-full lg:w-96">

                            <label
                                htmlFor="staff-search"
                                className="sr-only"
                            >
                                Search staff
                            </label>

                            <div className="relative">

                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    🔎
                                </span>

                                <input
                                    id="staff-search"
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search staff, subject or code..."
                                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    STAFF TABLE
                ================================================== */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5 md:p-6">

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-slate-800">
                                    Staff Handling Class
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Faculty assigned to your class subjects.
                                </p>

                            </div>

                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                {filteredStaff.length} Records
                            </span>

                        </div>

                    </div>

                    {/* LOADING */}

                    {loading || classLoading ? (

                        <div className="p-12 text-center">

                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                            <p className="mt-4 text-sm text-slate-500">
                                Loading class staff...
                            </p>

                        </div>

                    ) : filteredStaff.length === 0 ? (

                        /* EMPTY */

                        <div className="p-12 text-center">

                            <div className="text-4xl">
                                👨‍🏫
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-slate-800">
                                No staff found
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                No staff assignments were found for this class.
                            </p>

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                >
                                    Clear Search
                                </button>
                            )}

                            {!search && (
                                <button
                                    type="button"
                                    onClick={loadData}
                                    className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    Refresh Data
                                </button>
                            )}

                        </div>

                    ) : (

                        /* TABLE */

                        <div className="overflow-x-auto">

                            <table className="min-w-full text-left">

                                <thead className="bg-slate-50">

                                    <tr>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            #
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Staff
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Staff Code
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Subject
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Subject Code
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Department
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {filteredStaff.map(
                                        (item, index) => {

                                            const staffName =
                                                item.staff_name ||
                                                "Unknown Staff";

                                            const staffCode =
                                                item.staff_code ||
                                                "-";

                                            const subjectName =
                                                item.subject_name ||
                                                "-";

                                            const subjectCode =
                                                item.subject_code ||
                                                "-";

                                            const department =
                                                item.department_name ||
                                                departmentName ||
                                                "-";

                                            return (

                                                <tr
                                                    key={
                                                        `staff-${item.staff_id || staffCode || index}-` +
                                                        `${item.subject_id || subjectCode || index}-` +
                                                        `${index}`
                                                    }
                                                    className="transition hover:bg-blue-50/40"
                                                >

                                                    {/* NUMBER */}

                                                    <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                                        {index + 1}
                                                    </td>

                                                    {/* STAFF */}

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">

                                                                {String(
                                                                    staffName
                                                                )
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}

                                                            </div>

                                                            <div>

                                                                <p className="font-semibold text-slate-800">
                                                                    {
                                                                        staffName
                                                                    }
                                                                </p>

                                                                {item.email && (
                                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                                        {
                                                                            item.email
                                                                        }
                                                                    </p>
                                                                )}

                                                                {item.phone && (
                                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                                        {
                                                                            item.phone
                                                                        }
                                                                    </p>
                                                                )}

                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* STAFF CODE */}

                                                    <td className="px-5 py-4">

                                                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                                                            {
                                                                staffCode
                                                            }
                                                        </span>

                                                    </td>

                                                    {/* SUBJECT */}

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-2">

                                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                                                                📚
                                                            </span>

                                                            <span className="font-medium text-slate-700">
                                                                {
                                                                    subjectName
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>

                                                    {/* SUBJECT CODE */}

                                                    <td className="px-5 py-4">

                                                        <span className="text-sm font-semibold text-slate-600">
                                                            {
                                                                subjectCode
                                                            }
                                                        </span>

                                                    </td>

                                                    {/* DEPARTMENT */}

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

                    {/* FOOTER */}

                    {!loading &&
                        filteredStaff.length > 0 && (

                            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <div>

                                        <p className="text-sm text-slate-600">

                                            Showing{" "}

                                            <span className="font-bold text-slate-800">
                                                {
                                                    filteredStaff.length
                                                }
                                            </span>{" "}

                                            staff assignment records

                                        </p>

                                        {classYear && (
                                            <p className="mt-1 text-xs text-slate-400">

                                                Class: Year{" "}
                                                {classYear}

                                                {classSection
                                                    ? ` - ${classSection}`
                                                    : ""}

                                            </p>
                                        )}

                                    </div>

                                    <button
                                        type="button"
                                        onClick={loadData}
                                        disabled={refreshing}
                                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                    CLASS INFORMATION
                ================================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-4">

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Department
                            </p>

                            <p className="mt-2 font-bold text-slate-800">
                                {departmentName}
                            </p>

                            {departmentCode && (
                                <p className="mt-1 text-xs text-slate-400">
                                    Code: {departmentCode}
                                </p>
                            )}

                        </div>

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Year
                            </p>

                            <p className="mt-2 font-bold text-slate-800">
                                {classYear || "-"}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Section
                            </p>

                            <p className="mt-2 font-bold text-slate-800">
                                {classSection || "-"}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Academic Year
                            </p>

                            <p className="mt-2 font-bold text-blue-600">
                                {academicYear}
                            </p>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    INFORMATION
                ================================================== */}

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

                    <div className="flex items-start gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                            ℹ
                        </div>

                        <div>

                            <h3 className="font-bold text-blue-900">
                                Class Staff Information
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-blue-700">

                                Staff displayed here are loaded from the
                                Class Teacher staff endpoint and are
                                restricted by the class assigned to the
                                logged-in Class Teacher.

                                {departmentName !== "-" &&
                                    ` Department: ${departmentName}.`}

                                {classYear &&
                                    ` Year: ${classYear}.`}

                                {classSection &&
                                    ` Section: ${classSection}.`}

                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default ClassTeacherStaff;