import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaCalendarCheck,
    FaCheckCircle,
    FaClock,
    FaExclamationTriangle,
    FaEye,
    FaPercentage,
    FaSearch,
    FaSyncAlt,
    FaTimes,
    FaUsers,
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:5000/api";

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access_token") ||
        ""
    );
};

const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

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

const getArray = (response, keys = []) => {
    if (Array.isArray(response)) {
        return response;
    }

    for (const key of keys) {
        if (Array.isArray(response?.[key])) {
            return response[key];
        }
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    return [];
};

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (value) => {
    if (!value) return "-";

    const time = String(value).slice(0, 5);

    const parts = time.split(":");

    if (parts.length !== 2) {
        return time;
    }

    const hour = Number(parts[0]);
    const minute = parts[1];

    if (Number.isNaN(hour)) {
        return time;
    }

    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour =
        hour % 12 === 0 ? 12 : hour % 12;

    return `${displayHour}:${minute} ${suffix}`;
};

const formatStatus = (status) => {
    if (!status) return "-";

    return String(status)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
};

const getStatusClass = (status) => {
    const value = String(status || "")
        .toUpperCase()
        .trim();

    if (
        value === "COMPLETED" ||
        value === "CLOSED" ||
        value === "ACTIVE"
    ) {
        return "bg-green-100 text-green-700";
    }

    if (
        value === "RUNNING" ||
        value === "OPEN"
    ) {
        return "bg-blue-100 text-blue-700";
    }

    if (
        value === "CANCELLED" ||
        value === "CANCELED" ||
        value === "INACTIVE"
    ) {
        return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
};

const getSessionId = (item) => {
    return (
        item.attendance_session_id ||
        item.session_id ||
        item.attendance_id ||
        item.id
    );
};

const getClassName = (item) => {
    const year =
        item.year !== undefined &&
        item.year !== null
            ? item.year
            : "";

    const section =
        item.section !== undefined &&
        item.section !== null
            ? item.section
            : "";

    const department =
        item.department_name ||
        item.department ||
        "";

    const className = [
        year ? `Year ${year}` : "",
        section ? `Section ${section}` : "",
    ]
        .filter(Boolean)
        .join(" - ");

    if (className && department) {
        return `${className} (${department})`;
    }

    return (
        className ||
        department ||
        item.class_name ||
        "-"
    );
};

const getSubjectName = (item) => {
    const code =
        item.subject_code ||
        "";

    const name =
        item.subject_name ||
        item.subject ||
        "";

    if (code && name) {
        return `${code} - ${name}`;
    }

    return (
        name ||
        code ||
        "-"
    );
};

const getStaffName = (item) => {
    const name =
        item.staff_name ||
        item.teacher_name ||
        item.name ||
        "";

    const code =
        item.staff_code ||
        "";

    if (name && code) {
        return `${name} (${code})`;
    }

    return name || code || "-";
};

export default function AdminAttendance() {
    const [sessions, setSessions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [selectedSession, setSelectedSession] =
        useState(null);

    const [details, setDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] =
        useState(false);

    const [showDetails, setShowDetails] =
        useState(false);

    const loadSessions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await apiRequest(
                "/attendance-sessions"
            );

            const data = getArray(response, [
                "sessions",
                "attendanceSessions",
                "attendance_sessions",
            ]);

            setSessions(data);
        } catch (err) {
            console.error(
                "Admin attendance load error:",
                err
            );

            setError(
                err.message ||
                    "Unable to load attendance sessions."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const openDetails = async (session) => {
        const sessionId =
            getSessionId(session);

        if (!sessionId) {
            setError(
                "Attendance session ID was not found."
            );
            return;
        }

        try {
            setError("");
            setSuccess("");

            setSelectedSession(session);
            setDetails(null);
            setShowDetails(true);
            setDetailsLoading(true);

            let response;

            try {
                response = await apiRequest(
                    `/attendance-sessions/${sessionId}`
                );
            } catch {
                response = await apiRequest(
                    `/attendance/${sessionId}`
                );
            }

            setDetails(
                response.session ||
                    response.attendance ||
                    response.data ||
                    response
            );
        } catch (err) {
            console.error(
                "Attendance details error:",
                err
            );

            setError(
                err.message ||
                    "Unable to load attendance details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setShowDetails(false);
        setSelectedSession(null);
        setDetails(null);
    };

    const filteredSessions = useMemo(() => {
        const query =
            search.trim().toLowerCase();

        return [...sessions]
            .filter((item) => {
                if (
                    statusFilter !== "ALL" &&
                    String(
                        item.status || ""
                    ).toUpperCase() !==
                        statusFilter
                ) {
                    return false;
                }

                if (!query) {
                    return true;
                }

                const searchable = [
                    item.session_id,
                    item.attendance_session_id,
                    item.attendance_id,
                    item.class_id,
                    item.subject_id,
                    item.staff_id,
                    item.subject_code,
                    item.subject_name,
                    item.staff_code,
                    item.staff_name,
                    item.teacher_name,
                    item.department,
                    item.department_name,
                    item.year,
                    item.section,
                    item.status,
                    item.date,
                    item.attendance_date,
                ]
                    .filter(
                        (value) =>
                            value !==
                                undefined &&
                            value !== null
                    )
                    .join(" ")
                    .toLowerCase();

                return searchable.includes(query);
            })
            .sort((a, b) => {
                const dateA =
                    a.attendance_date ||
                    a.date ||
                    a.created_at ||
                    "";

                const dateB =
                    b.attendance_date ||
                    b.date ||
                    b.created_at ||
                    "";

                return String(dateB).localeCompare(
                    String(dateA)
                );
            });
    }, [
        sessions,
        search,
        statusFilter,
    ]);

    const stats = useMemo(() => {
        const total = sessions.length;

        const active = sessions.filter(
            (item) => {
                const status = String(
                    item.status || ""
                ).toUpperCase();

                return (
                    status === "ACTIVE" ||
                    status === "OPEN" ||
                    status === "RUNNING"
                );
            }
        ).length;

        const completed =
            sessions.filter(
                (item) => {
                    const status =
                        String(
                            item.status || ""
                        ).toUpperCase();

                    return (
                        status ===
                            "COMPLETED" ||
                        status === "CLOSED"
                    );
                }
            ).length;

        const cancelled =
            sessions.filter(
                (item) => {
                    const status =
                        String(
                            item.status || ""
                        ).toUpperCase();

                    return (
                        status ===
                            "CANCELLED" ||
                        status ===
                            "CANCELED"
                    );
                }
            ).length;

        return {
            total,
            active,
            completed,
            cancelled,
        };
    }, [sessions]);

    const getDateValue = (item) => {
        return (
            item.attendance_date ||
            item.date ||
            item.session_date ||
            item.created_at
        );
    };

    const getStartTime = (item) => {
        return (
            item.start_time ||
            item.session_start_time ||
            item.open_time
        );
    };

    const getEndTime = (item) => {
        return (
            item.end_time ||
            item.session_end_time ||
            item.close_time
        );
    };

    const getSessionStatus = (item) => {
        return (
            item.status ||
            item.session_status ||
            "UNKNOWN"
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
                            <FaCalendarCheck className="text-xl" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Attendance
                            </h1>

                            <p className="text-sm text-gray-500">
                                Monitor and maintain attendance
                                sessions across the system
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={loadSessions}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FaSyncAlt
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />
                        Refresh
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        <FaExclamationTriangle className="mt-0.5 shrink-0" />

                        <div className="flex-1">
                            <p className="font-semibold">
                                Error
                            </p>

                            <p className="mt-1 text-sm">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                            className="text-red-500 hover:text-red-700"
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
                        <FaCheckCircle className="mt-0.5 shrink-0" />

                        <div className="flex-1">
                            <p className="font-semibold">
                                Success
                            </p>

                            <p className="mt-1 text-sm">
                                {success}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setSuccess("")
                            }
                            className="text-green-500 hover:text-green-700"
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}

                {/* Statistics */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Total Sessions
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {stats.total}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                <FaCalendarCheck />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Active
                                </p>

                                <p className="mt-1 text-2xl font-bold text-green-600">
                                    {stats.active}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                <FaClock />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Completed
                                </p>

                                <p className="mt-1 text-2xl font-bold text-blue-600">
                                    {stats.completed}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <FaPercentage />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Cancelled
                                </p>

                                <p className="mt-1 text-2xl font-bold text-red-600">
                                    {stats.cancelled}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                <FaTimes />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                Search Attendance
                            </label>

                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="Search class, subject, staff, department..."
                                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">
                                    All Status
                                </option>

                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="OPEN">
                                    Open
                                </option>

                                <option value="RUNNING">
                                    Running
                                </option>

                                <option value="COMPLETED">
                                    Completed
                                </option>

                                <option value="CLOSED">
                                    Closed
                                </option>

                                <option value="CANCELLED">
                                    Cancelled
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Attendance Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Attendance Sessions
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Showing{" "}
                            {
                                filteredSessions.length
                            }{" "}
                            of {sessions.length} sessions
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex min-h-75 items-center justify-center">
                            <div className="text-center">
                                <FaSyncAlt className="mx-auto animate-spin text-2xl text-indigo-600" />

                                <p className="mt-3 text-sm text-gray-500">
                                    Loading attendance...
                                </p>
                            </div>
                        </div>
                    ) : filteredSessions.length ===
                      0 ? (
                        <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">
                            <FaCalendarCheck className="text-4xl text-gray-300" />

                            <h3 className="mt-4 text-lg font-semibold text-gray-700">
                                No attendance sessions found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-gray-500">
                                Attendance sessions created by
                                subject teachers will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-275 w-full">
                                <thead className="bg-gray-50">
                                    <tr className="border-b border-gray-200">
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            #
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Date
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Class
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Subject
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Staff
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Time
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Status
                                        </th>

                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {filteredSessions.map(
                                        (
                                            item,
                                            index
                                        ) => {
                                            const status =
                                                getSessionStatus(
                                                    item
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        getSessionId(
                                                            item
                                                        ) ||
                                                        index
                                                    }
                                                    className="transition hover:bg-gray-50"
                                                >
                                                    <td className="px-5 py-4 text-sm font-medium text-gray-500">
                                                        {index +
                                                            1}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatDate(
                                                                getDateValue(
                                                                    item
                                                                )
                                                            )}
                                                        </div>

                                                        {item.created_at && (
                                                            <div className="mt-1 text-xs text-gray-400">
                                                                Created:{" "}
                                                                {formatDate(
                                                                    item.created_at
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex items-start gap-2">
                                                            <FaUsers className="mt-0.5 text-gray-400" />

                                                            <div>
                                                                <div className="text-sm font-semibold text-gray-900">
                                                                    {getClassName(
                                                                        item
                                                                    )}
                                                                </div>

                                                                {item.class_id && (
                                                                    <div className="mt-1 text-xs text-gray-400">
                                                                        Class ID:{" "}
                                                                        {
                                                                            item.class_id
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {getSubjectName(
                                                                item
                                                            )}
                                                        </div>

                                                        {item.subject_id && (
                                                            <div className="mt-1 text-xs text-gray-400">
                                                                Subject ID:{" "}
                                                                {
                                                                    item.subject_id
                                                                }
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {getStaffName(
                                                                item
                                                            )}
                                                        </div>

                                                        {item.staff_id && (
                                                            <div className="mt-1 text-xs text-gray-400">
                                                                Staff ID:{" "}
                                                                {
                                                                    item.staff_id
                                                                }
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                                            <FaClock className="text-gray-400" />

                                                            <span>
                                                                {formatTime(
                                                                    getStartTime(
                                                                        item
                                                                    )
                                                                )}
                                                                {" - "}
                                                                {formatTime(
                                                                    getEndTime(
                                                                        item
                                                                    )
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                                status
                                                            )}`}
                                                        >
                                                            {formatStatus(
                                                                status
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDetails(
                                                                        item
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100"
                                                            >
                                                                <FaEye />
                                                                View
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {showDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Attendance Session Details
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    View attendance information for
                                    this session.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeDetails
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-6">
                            {detailsLoading ? (
                                <div className="flex min-h-62.5 items-center justify-center">
                                    <div className="text-center">
                                        <FaSyncAlt className="mx-auto animate-spin text-2xl text-indigo-600" />

                                        <p className="mt-3 text-sm text-gray-500">
                                            Loading details...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="rounded-lg border border-gray-200 p-4">
                                            <p className="text-xs font-semibold uppercase text-gray-400">
                                                Date
                                            </p>

                                            <p className="mt-1 font-semibold text-gray-900">
                                                {formatDate(
                                                    getDateValue(
                                                        selectedSession
                                                    )
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-4">
                                            <p className="text-xs font-semibold uppercase text-gray-400">
                                                Status
                                            </p>

                                            <span
                                                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                    getSessionStatus(
                                                        selectedSession
                                                    )
                                                )}`}
                                            >
                                                {formatStatus(
                                                    getSessionStatus(
                                                        selectedSession
                                                    )
                                                )}
                                            </span>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-4">
                                            <p className="text-xs font-semibold uppercase text-gray-400">
                                                Class
                                            </p>

                                            <p className="mt-1 font-semibold text-gray-900">
                                                {getClassName(
                                                    selectedSession
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-4">
                                            <p className="text-xs font-semibold uppercase text-gray-400">
                                                Subject
                                            </p>

                                            <p className="mt-1 font-semibold text-gray-900">
                                                {getSubjectName(
                                                    selectedSession
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-4">
                                            <p className="text-xs font-semibold uppercase text-gray-400">
                                                Staff
                                            </p>

                                            <p className="mt-1 font-semibold text-gray-900">
                                                {getStaffName(
                                                    selectedSession
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-4">
                                            <p className="text-xs font-semibold uppercase text-gray-400">
                                                Time
                                            </p>

                                            <p className="mt-1 font-semibold text-gray-900">
                                                {formatTime(
                                                    getStartTime(
                                                        selectedSession
                                                    )
                                                )}
                                                {" - "}
                                                {formatTime(
                                                    getEndTime(
                                                        selectedSession
                                                    )
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Details returned from backend */}
                                    {details &&
                                        typeof details ===
                                            "object" && (
                                            <div className="mt-6">
                                                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
                                                    Attendance Information
                                                </h3>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                    <div className="rounded-lg bg-gray-50 p-4">
                                                        <p className="text-xs font-medium text-gray-500">
                                                            Total Students
                                                        </p>

                                                        <p className="mt-1 text-xl font-bold text-gray-900">
                                                            {details.total_students ??
                                                                details.totalStudents ??
                                                                details.total ??
                                                                "-"}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-lg bg-green-50 p-4">
                                                        <p className="text-xs font-medium text-green-700">
                                                            Present
                                                        </p>

                                                        <p className="mt-1 text-xl font-bold text-green-700">
                                                            {details.present_count ??
                                                                details.presentCount ??
                                                                details.present ??
                                                                "-"}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-lg bg-red-50 p-4">
                                                        <p className="text-xs font-medium text-red-700">
                                                            Absent
                                                        </p>

                                                        <p className="mt-1 text-xl font-bold text-red-700">
                                                            {details.absent_count ??
                                                                details.absentCount ??
                                                                details.absent ??
                                                                "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </>
                            )}

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        closeDetails
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}