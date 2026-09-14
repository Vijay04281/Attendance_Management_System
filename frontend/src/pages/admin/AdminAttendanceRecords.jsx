import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaCalendarCheck,
    FaCheckCircle,
    FaClock,
    FaEdit,
    FaEye,
    FaFilter,
    FaSearch,
    FaSyncAlt,
    FaTimesCircle,
    FaTrash,
    FaUserGraduate,
    FaUsers,
    FaTimes,
} from "react-icons/fa";

// =====================================================
// CONFIG
// =====================================================

const API_BASE_URL = "https://attendance-management-system-gpci.onrender.com/api";

// =====================================================
// API REQUEST
// =====================================================

const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token
                    ? {
                          Authorization: `Bearer ${token}`,
                      }
                    : {}),
                ...(options.headers || {}),
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
// HELPERS
// =====================================================

const getArray = (response, keys = []) => {
    if (Array.isArray(response)) {
        return response;
    }

    if (!response || typeof response !== "object") {
        return [];
    }

    for (const key of keys) {
        if (Array.isArray(response[key])) {
            return response[key];
        }
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

    return [];
};

const getNumber = (value, fallback = 0) => {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
};

const formatDate = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getStudentName = (item) => {
    const firstName =
        item.first_name ||
        item.firstName ||
        "";

    const lastName =
        item.last_name ||
        item.lastName ||
        "";

    return (
        item.student_name ||
        item.studentName ||
        item.full_name ||
        item.fullName ||
        item.name ||
        `${firstName} ${lastName}`.trim() ||
        "Unknown Student"
    );
};

const getStatus = (item) => {
    return String(
        item.status ||
            item.attendance_status ||
            item.record_status ||
            "present"
    ).toLowerCase();
};

const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "present") {
        return "bg-green-100 text-green-700";
    }

    if (value === "absent") {
        return "bg-red-100 text-red-700";
    }

    if (value === "late") {
        return "bg-yellow-100 text-yellow-700";
    }

    if (value === "excused") {
        return "bg-blue-100 text-blue-700";
    }

    return "bg-gray-100 text-gray-700";
};

// =====================================================
// NORMALIZE RECORD
// =====================================================

const normalizeRecord = (item, index) => {
    const studentName = getStudentName(item);

    const registerNumber =
        item.register_number ||
        item.registerNumber ||
        item.roll_number ||
        item.rollNumber ||
        item.admission_number ||
        item.admissionNumber ||
        "-";

    const sessionId =
        item.session_id ||
        item.attendance_session_id ||
        item.sessionId ||
        item.attendanceSessionId ||
        null;

    const subjectName =
        item.subject_name ||
        item.subjectName ||
        item.subject ||
        "-";

    const className =
        item.class_name ||
        item.className ||
        item.class ||
        "-";

    const staffName =
        item.staff_name ||
        item.staffName ||
        item.teacher_name ||
        item.teacherName ||
        "-";

    const status = getStatus(item);

    return {
        id:
            item.attendance_record_id ||
            item.record_id ||
            item.id ||
            index,

        studentId:
            item.student_id ||
            item.studentId ||
            null,

        studentName,

        registerNumber,

        sessionId,

        subjectName,

        className,

        staffName,

        status,

        remarks:
            item.remarks ||
            item.remark ||
            item.notes ||
            "",

        markedAt:
            item.marked_at ||
            item.markedAt ||
            item.created_at ||
            item.createdAt ||
            item.attendance_date ||
            item.date ||
            null,

        updatedAt:
            item.updated_at ||
            item.updatedAt ||
            null,

        raw: item,
    };
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const AdminAttendanceRecords = () => {
    // =================================================
    // STATE
    // =================================================

    const [records, setRecords] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] =
        useState("all");

    const [dateFilter, setDateFilter] =
        useState("");

    const [sessionFilter, setSessionFilter] =
        useState("");

    const [selectedRecord, setSelectedRecord] =
        useState(null);

    const [editingRecord, setEditingRecord] =
        useState(null);

    const [deletingRecord, setDeletingRecord] =
        useState(null);

    const [showFilters, setShowFilters] =
        useState(false);

    const [saving, setSaving] = useState(false);

    // =================================================
    // LOAD RECORDS
    // =================================================

    const loadRecords = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const response = await apiRequest(
                    "/attendance-records"
                );

                const data = getArray(response, [
                    "records",
                    "attendance_records",
                    "attendanceRecords",
                    "data",
                    "results",
                ]);

                setRecords(
                    data.map(normalizeRecord)
                );
            } catch (err) {
                console.error(
                    "Attendance records error:",
                    err
                );

                setError(
                    err.message ||
                        "Unable to load attendance records"
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    // =================================================
    // FILTERED RECORDS
    // =================================================

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const searchValue =
                search.trim().toLowerCase();

            const matchesSearch =
                !searchValue ||
                record.studentName
                    .toLowerCase()
                    .includes(searchValue) ||
                String(record.registerNumber)
                    .toLowerCase()
                    .includes(searchValue) ||
                String(record.subjectName)
                    .toLowerCase()
                    .includes(searchValue) ||
                String(record.className)
                    .toLowerCase()
                    .includes(searchValue) ||
                String(record.staffName)
                    .toLowerCase()
                    .includes(searchValue) ||
                String(record.sessionId || "")
                    .toLowerCase()
                    .includes(searchValue);

            const matchesStatus =
                statusFilter === "all" ||
                record.status === statusFilter;

            const matchesSession =
                !sessionFilter ||
                String(record.sessionId || "") ===
                    String(sessionFilter);

            const recordDate = record.markedAt
                ? new Date(record.markedAt)
                : null;

            const matchesDate =
                !dateFilter ||
                (recordDate &&
                    !Number.isNaN(
                        recordDate.getTime()
                    ) &&
                    recordDate
                        .toISOString()
                        .slice(0, 10) ===
                        dateFilter);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesSession &&
                matchesDate
            );
        });
    }, [
        records,
        search,
        statusFilter,
        dateFilter,
        sessionFilter,
    ]);

    // =================================================
    // STATISTICS
    // =================================================

    const statistics = useMemo(() => {
        const total = records.length;

        const present = records.filter(
            (record) =>
                record.status === "present"
        ).length;

        const absent = records.filter(
            (record) =>
                record.status === "absent"
        ).length;

        const late = records.filter(
            (record) =>
                record.status === "late"
        ).length;

        const excused = records.filter(
            (record) =>
                record.status === "excused"
        ).length;

        const uniqueStudents =
            new Set(
                records
                    .map(
                        (record) =>
                            record.studentId
                    )
                    .filter(Boolean)
            ).size;

        const percentage =
            total > 0
                ? (present / total) * 100
                : 0;

        return {
            total,
            present,
            absent,
            late,
            excused,
            uniqueStudents,
            percentage,
        };
    }, [records]);

    // =================================================
    // SESSIONS
    // =================================================

    const sessions = useMemo(() => {
        const values = records
            .map((record) => record.sessionId)
            .filter(
                (value) =>
                    value !== null &&
                    value !== undefined &&
                    value !== ""
            );

        return [...new Set(values)];
    }, [records]);

    // =================================================
    // UPDATE RECORD
    // =================================================

    const updateRecord = async () => {
        if (!editingRecord) {
            return;
        }

        try {
            setSaving(true);

            await apiRequest(
                `/attendance-records/${editingRecord.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        status:
                            editingRecord.status,
                        remarks:
                            editingRecord.remarks || "",
                    }),
                }
            );

            setEditingRecord(null);

            await loadRecords(true);
        } catch (err) {
            console.error(
                "Update attendance record error:",
                err
            );

            alert(
                err.message ||
                    "Unable to update attendance record"
            );
        } finally {
            setSaving(false);
        }
    };

    // =================================================
    // DELETE RECORD
    // =================================================

    const deleteRecord = async () => {
        if (!deletingRecord) {
            return;
        }

        try {
            setSaving(true);

            await apiRequest(
                `/attendance-records/${deletingRecord.id}`,
                {
                    method: "DELETE",
                }
            );

            setDeletingRecord(null);

            await loadRecords(true);
        } catch (err) {
            console.error(
                "Delete attendance record error:",
                err
            );

            alert(
                err.message ||
                    "Unable to delete attendance record"
            );
        } finally {
            setSaving(false);
        }
    };

    // =================================================
    // CLEAR FILTERS
    // =================================================

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setDateFilter("");
        setSessionFilter("");
    };

    // =================================================
    // LOADING
    // =================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-6">

                <div className="animate-pulse">

                    <div className="mb-2 h-8 w-64 rounded bg-slate-200" />

                    <div className="mb-8 h-4 w-96 rounded bg-slate-200" />

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                        {[1, 2, 3, 4].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="h-32 rounded-2xl bg-white"
                                />
                            )
                        )}

                    </div>

                    <div className="mt-6 h-96 rounded-2xl bg-white" />

                </div>

            </div>
        );
    }

    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="mb-6">

                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

                    <div>

                        <p className="mb-1 text-sm font-medium text-indigo-600">
                            Attendance Management
                        </p>

                        <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                            Attendance Records
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            View and maintain individual
                            student attendance records.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            loadRecords(true)
                        }
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        <FaSyncAlt
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

            </div>

            {/* =========================================
                ERROR
            ========================================= */}

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                    <p className="text-sm font-semibold text-red-700">
                        Unable to load attendance
                        records
                    </p>

                    <p className="mt-1 text-xs text-red-600">
                        {error}
                    </p>

                </div>
            )}

            {/* =========================================
                STATISTICS
            ========================================= */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                {/* Total */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Total Records
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-800">
                                {statistics.total}
                            </p>

                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <FaCalendarCheck />
                        </div>

                    </div>

                </div>

                {/* Present */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Present
                            </p>

                            <p className="mt-2 text-3xl font-bold text-green-600">
                                {statistics.present}
                            </p>

                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <FaCheckCircle />
                        </div>

                    </div>

                </div>

                {/* Absent */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Absent
                            </p>

                            <p className="mt-2 text-3xl font-bold text-red-600">
                                {statistics.absent}
                            </p>

                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <FaTimesCircle />
                        </div>

                    </div>

                </div>

                {/* Attendance */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Attendance Rate
                            </p>

                            <p className="mt-2 text-3xl font-bold text-indigo-600">
                                {statistics.percentage.toFixed(
                                    1
                                )}
                                %
                            </p>

                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <FaChartBarIcon />
                        </div>

                    </div>

                </div>

            </div>

            {/* =========================================
                SEARCH + FILTERS
            ========================================= */}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex flex-col gap-4 lg:flex-row">

                    {/* Search */}

                    <div className="relative flex-1">

                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search student, register number, subject, class..."
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />

                    </div>

                    {/* Filter Button */}

                    <button
                        type="button"
                        onClick={() =>
                            setShowFilters(
                                !showFilters
                            )
                        }
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                            showFilters
                                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                        }`}
                    >

                        <FaFilter />

                        Filters

                    </button>

                    {/* Clear */}

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:text-red-600"
                    >
                        Clear
                    </button>

                </div>

                {/* Filters */}

                {showFilters && (
                    <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-3">

                        {/* Status */}

                        <div>

                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Status
                            </label>

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target
                                            .value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                            >

                                <option value="all">
                                    All Statuses
                                </option>

                                <option value="present">
                                    Present
                                </option>

                                <option value="absent">
                                    Absent
                                </option>

                                <option value="late">
                                    Late
                                </option>

                                <option value="excused">
                                    Excused
                                </option>

                            </select>

                        </div>

                        {/* Date */}

                        <div>

                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Date
                            </label>

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(event) =>
                                    setDateFilter(
                                        event.target
                                            .value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                            />

                        </div>

                        {/* Session */}

                        <div>

                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Session
                            </label>

                            <select
                                value={
                                    sessionFilter
                                }
                                onChange={(event) =>
                                    setSessionFilter(
                                        event.target
                                            .value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                            >

                                <option value="">
                                    All Sessions
                                </option>

                                {sessions.map(
                                    (sessionId) => (
                                        <option
                                            key={
                                                sessionId
                                            }
                                            value={
                                                sessionId
                                            }
                                        >
                                            Session #
                                            {sessionId}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>

                    </div>
                )}

            </div>

            {/* =========================================
                TABLE
            ========================================= */}

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center">

                    <div>

                        <h2 className="text-lg font-bold text-slate-800">
                            Attendance Records
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Showing{" "}
                            <span className="font-semibold text-slate-700">
                                {
                                    filteredRecords.length
                                }
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-700">
                                {records.length}
                            </span>{" "}
                            records
                        </p>

                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">

                        <FaUsers />

                        {statistics.uniqueStudents}{" "}
                        students

                    </div>

                </div>

                {filteredRecords.length === 0 ? (
                    <div className="p-12 text-center">

                        <FaCalendarCheck className="mx-auto text-4xl text-slate-300" />

                        <h3 className="mt-4 text-base font-semibold text-slate-700">
                            No attendance records
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            No records match the current
                            search or filters.
                        </p>

                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead className="bg-slate-50">

                                <tr>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Student
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Class
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Subject
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Staff
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Date
                                    </th>

                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {filteredRecords.map(
                                    (record) => (
                                        <tr
                                            key={
                                                record.id
                                            }
                                            className="transition hover:bg-slate-50"
                                        >

                                            {/* Student */}

                                            <td className="px-5 py-4">

                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                                        <FaUserGraduate />
                                                    </div>

                                                    <div>

                                                        <p className="font-semibold text-slate-800">
                                                            {
                                                                record.studentName
                                                            }
                                                        </p>

                                                        <p className="text-xs text-slate-400">
                                                            {
                                                                record.registerNumber
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* Class */}

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {
                                                    record.className
                                                }
                                            </td>

                                            {/* Subject */}

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {
                                                    record.subjectName
                                                }
                                            </td>

                                            {/* Staff */}

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {
                                                    record.staffName
                                                }
                                            </td>

                                            {/* Date */}

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                <div>
                                                    {
                                                        formatDate(
                                                            record.markedAt
                                                        )
                                                    }
                                                </div>

                                                <div className="text-xs text-slate-400">
                                                    {
                                                        formatDateTime(
                                                            record.markedAt
                                                        )
                                                    }
                                                </div>
                                            </td>

                                            {/* Status */}

                                            <td className="px-5 py-4 text-center">

                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                        record.status
                                                    )}`}
                                                >
                                                    {record.status
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase() +
                                                        record.status.slice(
                                                            1
                                                        )}
                                                </span>

                                            </td>

                                            {/* Actions */}

                                            <td className="px-5 py-4">

                                                <div className="flex items-center justify-center gap-2">

                                                    {/* View */}

                                                    <button
                                                        type="button"
                                                        title="View"
                                                        onClick={() =>
                                                            setSelectedRecord(
                                                                record
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                                                    >
                                                        <FaEye />
                                                    </button>

                                                    {/* Edit */}

                                                    <button
                                                        type="button"
                                                        title="Edit"
                                                        onClick={() =>
                                                            setEditingRecord(
                                                                {
                                                                    ...record,
                                                                }
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-600 hover:text-white"
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    {/* Delete */}

                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        onClick={() =>
                                                            setDeletingRecord(
                                                                record
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                                                    >
                                                        <FaTrash />
                                                    </button>

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

            {/* =========================================
                VIEW MODAL
            ========================================= */}

            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b border-slate-200 p-5">

                            <div>

                                <h2 className="text-lg font-bold text-slate-800">
                                    Attendance Details
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Record #
                                    {
                                        selectedRecord.id
                                    }
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedRecord(
                                        null
                                    )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <div className="space-y-4 p-5">

                            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">

                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                    <FaUserGraduate />
                                </div>

                                <div>

                                    <p className="font-bold text-slate-800">
                                        {
                                            selectedRecord.studentName
                                        }
                                    </p>

                                    <p className="text-sm text-slate-500">
                                        {
                                            selectedRecord.registerNumber
                                        }
                                    </p>

                                </div>

                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>
                                    <p className="text-xs font-medium text-slate-400">
                                        Class
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                        {
                                            selectedRecord.className
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-400">
                                        Subject
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                        {
                                            selectedRecord.subjectName
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-400">
                                        Staff
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                        {
                                            selectedRecord.staffName
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-400">
                                        Session ID
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                        {selectedRecord.sessionId ||
                                            "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-400">
                                        Date
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                        {formatDate(
                                            selectedRecord.markedAt
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-400">
                                        Status
                                    </p>

                                    <span
                                        className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                            selectedRecord.status
                                        )}`}
                                    >
                                        {
                                            selectedRecord.status
                                        }
                                    </span>
                                </div>

                            </div>

                            <div>

                                <p className="text-xs font-medium text-slate-400">
                                    Remarks
                                </p>

                                <div className="mt-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                                    {
                                        selectedRecord.remarks ||
                                        "No remarks"
                                    }
                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {/* =========================================
                EDIT MODAL
            ========================================= */}

            {editingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b border-slate-200 p-5">

                            <h2 className="text-lg font-bold text-slate-800">
                                Edit Attendance
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    setEditingRecord(
                                        null
                                    )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <div className="space-y-4 p-5">

                            <div className="rounded-xl bg-slate-50 p-4">

                                <p className="text-sm font-bold text-slate-800">
                                    {
                                        editingRecord.studentName
                                    }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {
                                        editingRecord.registerNumber
                                    }
                                </p>

                            </div>

                            {/* Status */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-slate-600">
                                    Attendance Status
                                </label>

                                <select
                                    value={
                                        editingRecord.status
                                    }
                                    onChange={(event) =>
                                        setEditingRecord(
                                            {
                                                ...editingRecord,
                                                status:
                                                    event
                                                        .target
                                                        .value,
                                            }
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                >

                                    <option value="present">
                                        Present
                                    </option>

                                    <option value="absent">
                                        Absent
                                    </option>

                                    <option value="late">
                                        Late
                                    </option>

                                    <option value="excused">
                                        Excused
                                    </option>

                                </select>

                            </div>

                            {/* Remarks */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-slate-600">
                                    Remarks
                                </label>

                                <textarea
                                    value={
                                        editingRecord.remarks ||
                                        ""
                                    }
                                    onChange={(event) =>
                                        setEditingRecord(
                                            {
                                                ...editingRecord,
                                                remarks:
                                                    event
                                                        .target
                                                        .value,
                                            }
                                        )
                                    }
                                    rows={4}
                                    placeholder="Enter remarks..."
                                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                />

                            </div>

                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 p-5">

                            <button
                                type="button"
                                onClick={() =>
                                    setEditingRecord(
                                        null
                                    )
                                }
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={updateRecord}
                                disabled={saving}
                                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* =========================================
                DELETE MODAL
            ========================================= */}

            {deletingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

                        <div className="p-6 text-center">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <FaTrash />
                            </div>

                            <h2 className="mt-4 text-lg font-bold text-slate-800">
                                Delete Attendance Record?
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                This will permanently delete
                                the attendance record for{" "}
                                <span className="font-semibold text-slate-700">
                                    {
                                        deletingRecord.studentName
                                    }
                                </span>
                                .
                            </p>

                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 p-5">

                            <button
                                type="button"
                                onClick={() =>
                                    setDeletingRecord(
                                        null
                                    )
                                }
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deleteRecord}
                                disabled={saving}
                                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {saving
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

// =====================================================
// SMALL ICON COMPONENT
// =====================================================

const FaChartBarIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            className="h-4 w-4 fill-current"
        >
            <path d="M160 80c0-26.5-21.5-48-48-48S64 53.5 64 80V432c0 26.5 21.5 48 48 48s48-21.5 48-48V80zm144 128c0-26.5-21.5-48-48-48s-48 21.5-48 48V432c0 26.5 21.5 48 48 48s48-21.5 48-48V208zm96-128c0-26.5-21.5-48-48-48s-48 21.5-48 48V432c0 26.5 21.5 48 48 48s48-21.5 48-48V80z" />
        </svg>
    );
};

export default AdminAttendanceRecords;