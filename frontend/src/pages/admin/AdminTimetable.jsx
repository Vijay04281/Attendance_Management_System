import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaCalendarAlt,
    FaClock,
    FaEdit,
    FaPlus,
    FaSearch,
    FaTrash,
    FaUsers,
    FaUserTie,
    FaBook,
    FaSyncAlt,
    FaTimes,
    FaExclamationTriangle,
    FaCheckCircle,
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:5000/api";

const DAYS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
];

const INITIAL_FORM = {
    class_id: "",
    subject_id: "",
    staff_id: "",
    day_of_week: "MONDAY",
    start_time: "",
    end_time: "",
};

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
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

const formatDay = (day) => {
    if (!day) return "-";

    return day
        .toLowerCase()
        .replace(/^\w/, (letter) => letter.toUpperCase());
};

const formatTime = (time) => {
    if (!time) return "-";

    const value = String(time).slice(0, 5);
    const [hours, minutes] = value.split(":");

    if (hours === undefined || minutes === undefined) {
        return value;
    }

    const hour = Number(hours);

    if (Number.isNaN(hour)) {
        return value;
    }

    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour =
        hour % 12 === 0 ? 12 : hour % 12;

    return `${displayHour}:${minutes} ${suffix}`;
};

const getClassLabel = (item) => {
    if (!item) return "-";

    const year =
        item.year !== undefined && item.year !== null
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

    return className || department || `Class #${item.class_id || "-"}`;
};

const getSubjectLabel = (item) => {
    if (!item) return "-";

    const code =
        item.subject_code ||
        item.code ||
        "";

    const name =
        item.subject_name ||
        item.name ||
        "";

    if (code && name) {
        return `${code} - ${name}`;
    }

    return (
        name ||
        code ||
        `Subject #${item.subject_id || "-"}`
    );
};

const getStaffLabel = (item) => {
    if (!item) return "-";

    const code =
        item.staff_code ||
        "";

    const name =
        item.staff_name ||
        item.name ||
        "";

    if (code && name) {
        return `${name} (${code})`;
    }

    return (
        name ||
        code ||
        `Staff #${item.staff_id || "-"}`
    );
};

const getErrorMessage = (error) => {
    if (!error) {
        return "Something went wrong.";
    }

    if (error.message) {
        return error.message;
    }

    return "Something went wrong.";
};

export default function AdminTimetable() {
    const [timetables, setTimetables] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [staff, setStaff] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [dayFilter, setDayFilter] = useState("ALL");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState(INITIAL_FORM);

    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [
                timetableResponse,
                classResponse,
                subjectResponse,
                staffResponse,
            ] = await Promise.all([
                apiRequest("/timetables"),
                apiRequest("/classes"),
                apiRequest("/subjects"),
                apiRequest("/staff"),
            ]);

            setTimetables(
                getArray(timetableResponse, [
                    "timetables",
                    "timetable",
                ])
            );

            setClasses(
                getArray(classResponse, [
                    "classes",
                ])
            );

            setSubjects(
                getArray(subjectResponse, [
                    "subjects",
                ])
            );

            setStaff(
                getArray(staffResponse, [
                    "staff",
                ])
            );
        } catch (err) {
            console.error(
                "Admin timetable load error:",
                err
            );

            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openAddModal = () => {
        clearMessages();

        setEditingId(null);

        setForm({
            ...INITIAL_FORM,
        });

        setShowModal(true);
    };

    const openEditModal = (item) => {
        clearMessages();

        setEditingId(item.timetable_id);

        setForm({
            class_id:
                item.class_id !== undefined
                    ? String(item.class_id)
                    : "",
            subject_id:
                item.subject_id !== undefined
                    ? String(item.subject_id)
                    : "",
            staff_id:
                item.staff_id !== undefined
                    ? String(item.staff_id)
                    : "",
            day_of_week:
                item.day_of_week || "MONDAY",
            start_time: item.start_time
                ? String(item.start_time).slice(0, 5)
                : "",
            end_time: item.end_time
                ? String(item.end_time).slice(0, 5)
                : "",
        });

        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingId(null);
        setForm({
            ...INITIAL_FORM,
        });
    };

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const validateForm = () => {
        if (!form.class_id) {
            return "Please select a class.";
        }

        if (!form.subject_id) {
            return "Please select a subject.";
        }

        if (!form.staff_id) {
            return "Please select a staff member.";
        }

        if (!form.day_of_week) {
            return "Please select a day.";
        }

        if (!form.start_time) {
            return "Please select the start time.";
        }

        if (!form.end_time) {
            return "Please select the end time.";
        }

        if (
            form.start_time >= form.end_time
        ) {
            return "End time must be later than start time.";
        }

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        clearMessages();

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);

            const payload = {
                class_id: Number(form.class_id),
                subject_id: Number(
                    form.subject_id
                ),
                staff_id: Number(form.staff_id),
                day_of_week:
                    form.day_of_week,
                start_time:
                    form.start_time,
                end_time:
                    form.end_time,
            };

            if (editingId) {
                await apiRequest(
                    `/timetables/${editingId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(
                            payload
                        ),
                    }
                );

                setSuccess(
                    "Timetable entry updated successfully."
                );
            } else {
                await apiRequest(
                    "/timetables",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            payload
                        ),
                    }
                );

                setSuccess(
                    "Timetable entry created successfully."
                );
            }

            closeModal();

            await loadData();
        } catch (err) {
            console.error(
                "Timetable save error:",
                err
            );

            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            setDeleting(true);
            clearMessages();

            await apiRequest(
                `/timetables/${deleteId}`,
                {
                    method: "DELETE",
                }
            );

            setSuccess(
                "Timetable entry deleted successfully."
            );

            setDeleteId(null);

            await loadData();
        } catch (err) {
            console.error(
                "Timetable delete error:",
                err
            );

            setError(getErrorMessage(err));
        } finally {
            setDeleting(false);
        }
    };

    const filteredTimetables = useMemo(() => {
        const query =
            search.trim().toLowerCase();

        const dayOrder = DAYS.reduce(
            (result, day, index) => {
                result[day] = index;
                return result;
            },
            {}
        );

        return [...timetables]
            .filter((item) => {
                if (
                    dayFilter !== "ALL" &&
                    item.day_of_week !== dayFilter
                ) {
                    return false;
                }

                if (!query) {
                    return true;
                }

                const searchable = [
                    getClassLabel(item),
                    getSubjectLabel(item),
                    getStaffLabel(item),
                    item.day_of_week,
                    item.department_name,
                    item.department,
                    item.year,
                    item.section,
                    item.subject_code,
                    item.subject_name,
                    item.staff_code,
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
                const dayDifference =
                    (dayOrder[
                        a.day_of_week
                    ] ?? 999) -
                    (dayOrder[
                        b.day_of_week
                    ] ?? 999);

                if (dayDifference !== 0) {
                    return dayDifference;
                }

                return String(
                    a.start_time || ""
                ).localeCompare(
                    String(
                        b.start_time || ""
                    )
                );
            });
    }, [
        timetables,
        search,
        dayFilter,
    ]);

    const stats = useMemo(() => {
        const uniqueClasses =
            new Set(
                timetables
                    .map(
                        (item) =>
                            item.class_id
                    )
                    .filter(Boolean)
            ).size;

        const uniqueStaff =
            new Set(
                timetables
                    .map(
                        (item) =>
                            item.staff_id
                    )
                    .filter(Boolean)
            ).size;

        const activeDays =
            new Set(
                timetables
                    .map(
                        (item) =>
                            item.day_of_week
                    )
                    .filter(Boolean)
            ).size;

        return {
            total: timetables.length,
            classes: uniqueClasses,
            staff: uniqueStaff,
            days: activeDays,
        };
    }, [timetables]);

    const selectedClass = classes.find(
        (item) =>
            String(item.class_id) ===
            String(form.class_id)
    );

    const selectedSubject =
        subjects.find(
            (item) =>
                String(
                    item.subject_id
                ) ===
                String(form.subject_id)
        );

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
                                <FaCalendarAlt className="text-xl" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Timetable
                                </h1>

                                <p className="text-sm text-gray-500">
                                    Manage class, subject and
                                    staff timetable schedules
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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

                        <button
                            type="button"
                            onClick={openAddModal}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <FaPlus />
                            Add Timetable
                        </button>
                    </div>
                </div>

                {/* Messages */}
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
                                    Total Entries
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {stats.total}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                <FaCalendarAlt />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Classes
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {stats.classes}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <FaUsers />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Staff
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {stats.staff}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                <FaUserTie />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Active Days
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {stats.days}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                <FaClock />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                Search
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
                                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                Day
                            </label>

                            <select
                                value={dayFilter}
                                onChange={(event) =>
                                    setDayFilter(
                                        event.target
                                            .value
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">
                                    All Days
                                </option>

                                {DAYS.map((day) => (
                                    <option
                                        key={day}
                                        value={day}
                                    >
                                        {formatDay(day)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                        <div>
                            <h2 className="font-semibold text-gray-900">
                                Timetable Entries
                            </h2>

                            <p className="text-sm text-gray-500">
                                Showing{" "}
                                {
                                    filteredTimetables.length
                                }{" "}
                                of{" "}
                                {timetables.length}{" "}
                                entries
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-75 items-center justify-center">
                            <div className="text-center">
                                <FaSyncAlt className="mx-auto animate-spin text-2xl text-indigo-600" />

                                <p className="mt-3 text-sm text-gray-500">
                                    Loading timetable...
                                </p>
                            </div>
                        </div>
                    ) : filteredTimetables.length ===
                      0 ? (
                        <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">
                            <FaCalendarAlt className="text-4xl text-gray-300" />

                            <h3 className="mt-4 text-lg font-semibold text-gray-700">
                                No timetable entries found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-gray-500">
                                Add a timetable entry or
                                change the search/filter
                                criteria.
                            </p>

                            <button
                                type="button"
                                onClick={openAddModal}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                <FaPlus />
                                Add Timetable
                            </button>
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
                                            Day
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Time
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

                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {filteredTimetables.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <tr
                                                key={
                                                    item.timetable_id ||
                                                    `${item.class_id}-${item.subject_id}-${item.day_of_week}-${item.start_time}-${index}`
                                                }
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="px-5 py-4 text-sm font-medium text-gray-500">
                                                    {index +
                                                        1}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                                                        {formatDay(
                                                            item.day_of_week
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                                        <FaClock className="text-gray-400" />

                                                        <span>
                                                            {formatTime(
                                                                item.start_time
                                                            )}{" "}
                                                            -{" "}
                                                            {formatTime(
                                                                item.end_time
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {getClassLabel(
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
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-start gap-2">
                                                        <FaBook className="mt-0.5 text-gray-400" />

                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {getSubjectLabel(
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
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-start gap-2">
                                                        <FaUserTie className="mt-0.5 text-gray-400" />

                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {getStaffLabel(
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
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    item
                                                                )
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeleteId(
                                                                    item.timetable_id
                                                                )
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                            title="Delete"
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
            </div>

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingId
                                        ? "Edit Timetable"
                                        : "Add Timetable"}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Configure class schedule,
                                    subject, staff and time.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="p-6"
                        >
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                {/* Class */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Class
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="class_id"
                                        value={
                                            form.class_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                                    >
                                        <option value="">
                                            Select Class
                                        </option>

                                        {classes.map(
                                            (item) => (
                                                <option
                                                    key={
                                                        item.class_id
                                                    }
                                                    value={
                                                        item.class_id
                                                    }
                                                >
                                                    {getClassLabel(
                                                        item
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    {selectedClass && (
                                        <p className="mt-1 text-xs text-gray-400">
                                            Class ID:{" "}
                                            {
                                                selectedClass.class_id
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Subject
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="subject_id"
                                        value={
                                            form.subject_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                                    >
                                        <option value="">
                                            Select Subject
                                        </option>

                                        {subjects.map(
                                            (item) => (
                                                <option
                                                    key={
                                                        item.subject_id
                                                    }
                                                    value={
                                                        item.subject_id
                                                    }
                                                >
                                                    {getSubjectLabel(
                                                        item
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    {selectedSubject && (
                                        <p className="mt-1 text-xs text-gray-400">
                                            Subject ID:{" "}
                                            {
                                                selectedSubject.subject_id
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Staff */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Staff
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="staff_id"
                                        value={
                                            form.staff_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                                    >
                                        <option value="">
                                            Select Staff
                                        </option>

                                        {staff.map(
                                            (item) => (
                                                <option
                                                    key={
                                                        item.staff_id
                                                    }
                                                    value={
                                                        item.staff_id
                                                    }
                                                >
                                                    {getStaffLabel(
                                                        item
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* Day */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Day
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="day_of_week"
                                        value={
                                            form.day_of_week
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                                    >
                                        {DAYS.map(
                                            (day) => (
                                                <option
                                                    key={
                                                        day
                                                    }
                                                    value={
                                                        day
                                                    }
                                                >
                                                    {formatDay(
                                                        day
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* Start Time */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Start Time
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="time"
                                        name="start_time"
                                        value={
                                            form.start_time
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                                    />
                                </div>

                                {/* End Time */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        End Time
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="time"
                                        name="end_time"
                                        value={
                                            form.end_time
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                                <div className="flex gap-3">
                                    <FaClock className="mt-0.5 shrink-0 text-blue-600" />

                                    <div className="text-sm text-blue-800">
                                        <p className="font-semibold">
                                            Schedule validation
                                        </p>

                                        <p className="mt-1">
                                            The backend will prevent
                                            overlapping schedules
                                            for the same class or
                                            staff member.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? (
                                        <>
                                            <FaSyncAlt className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle />
                                            {editingId
                                                ? "Update Timetable"
                                                : "Create Timetable"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <FaTrash />
                        </div>

                        <h2 className="mt-4 text-lg font-bold text-gray-900">
                            Delete timetable entry?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            This timetable entry will be permanently
                            removed. This action cannot be undone.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteId(null)
                                }
                                disabled={deleting}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting ? (
                                    <>
                                        <FaSyncAlt className="animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FaTrash />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}