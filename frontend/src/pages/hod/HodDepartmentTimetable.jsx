import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaClock,
    FaChalkboardTeacher,
    FaSearch,
} from "react-icons/fa";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const HodDepartmentTimetable = () => {
    const { department } = useParams();

    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedDay, setSelectedDay] =
        useState("ALL");

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        "";

    const departmentNames = {
        "computer-science": "Computer Science",
        "information-technology": "Information Technology",
        electronics: "Electronics",
        "electronics-and-communication":
            "Electronics & Communication",
        mechanical: "Mechanical Engineering",
        civil: "Civil Engineering",
        "artificial-intelligence":
            "Artificial Intelligence",
    };

    const departmentName =
        departmentNames[department] ||
        "Computer Science";

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_BASE_URL}/timetables`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type":
                                "application/json",
                            ...(token
                                ? {
                                      Authorization:
                                          `Bearer ${token}`,
                                  }
                                : {}),
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to fetch timetable"
                    );
                }

                const timetableList = Array.isArray(
                    data
                )
                    ? data
                    : Array.isArray(data.timetables)
                    ? data.timetables
                    : Array.isArray(data.timetable)
                    ? data.timetable
                    : [];

                setTimetable(timetableList);
            } catch (err) {
                console.error(
                    "HOD Department Timetable Error:",
                    err
                );

                setError(
                    err.message ||
                        "Failed to load timetable"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTimetable();
    }, [token]);

    const departmentTimetable = useMemo(() => {
        return timetable.filter((entry) => {
            const entryDepartmentSlug =
                entry.department_slug ||
                entry.departmentSlug ||
                "";

            const entryDepartmentName =
                entry.department ||
                entry.department_name ||
                entry.departmentName ||
                "";

            if (
                entryDepartmentSlug &&
                String(entryDepartmentSlug)
                    .toLowerCase()
                    .trim() ===
                    String(department)
                        .toLowerCase()
                        .trim()
            ) {
                return true;
            }

            if (
                entryDepartmentName &&
                String(entryDepartmentName)
                    .toLowerCase()
                    .trim() ===
                    String(departmentName)
                        .toLowerCase()
                        .trim()
            ) {
                return true;
            }

            const normalizedEntryDepartment =
                String(entryDepartmentName)
                    .toLowerCase()
                    .trim()
                    .replace(/&/g, "and")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");

            const normalizedDepartment =
                String(departmentName)
                    .toLowerCase()
                    .trim()
                    .replace(/&/g, "and")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");

            return (
                normalizedEntryDepartment ===
                normalizedDepartment
            );
        });
    }, [
        timetable,
        department,
        departmentName,
    ]);

    const getDay = (entry) =>
        entry.day ||
        entry.day_name ||
        entry.week_day ||
        entry.weekday ||
        "";

    const getSubject = (entry) =>
        entry.subject_name ||
        entry.subjectName ||
        entry.subject ||
        entry.name ||
        "Subject";

    const getSubjectCode = (entry) =>
        entry.subject_code ||
        entry.subjectCode ||
        entry.code ||
        "";

    const getStaff = (entry) =>
        entry.staff_name ||
        entry.staffName ||
        entry.teacher_name ||
        entry.teacherName ||
        entry.faculty_name ||
        entry.facultyName ||
        entry.staff ||
        "Staff not assigned";

    const getYear = (entry) =>
        entry.year ||
        entry.class_year ||
        entry.student_year ||
        "-";

    const getSection = (entry) =>
        entry.section ||
        entry.class_section ||
        entry.student_section ||
        "-";

    const getStartTime = (entry) =>
        entry.start_time ||
        entry.startTime ||
        entry.from_time ||
        entry.fromTime ||
        "";

    const getEndTime = (entry) =>
        entry.end_time ||
        entry.endTime ||
        entry.to_time ||
        entry.toTime ||
        "";

    const getTime = (entry) => {
        const start = getStartTime(entry);
        const end = getEndTime(entry);

        if (start && end) {
            return `${start} - ${end}`;
        }

        if (start) {
            return String(start);
        }

        return "-";
    };

    const days = [
        "ALL",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const filteredTimetable = useMemo(() => {
        const keyword =
            search.trim().toLowerCase();

        return departmentTimetable.filter((entry) => {
            const day = getDay(entry);

            const dayMatches =
                selectedDay === "ALL" ||
                String(day).toLowerCase() ===
                    selectedDay.toLowerCase();

            if (!dayMatches) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            const subject =
                getSubject(entry);

            const code =
                getSubjectCode(entry);

            const staff =
                getStaff(entry);

            const year =
                getYear(entry);

            const section =
                getSection(entry);

            return (
                String(subject)
                    .toLowerCase()
                    .includes(keyword) ||
                String(code)
                    .toLowerCase()
                    .includes(keyword) ||
                String(staff)
                    .toLowerCase()
                    .includes(keyword) ||
                String(year)
                    .toLowerCase()
                    .includes(keyword) ||
                String(section)
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }, [
        departmentTimetable,
        search,
        selectedDay,
    ]);

    const groupedTimetable = useMemo(() => {
        const groups = {};

        filteredTimetable.forEach((entry) => {
            const day =
                getDay(entry) || "Other";

            if (!groups[day]) {
                groups[day] = [];
            }

            groups[day].push(entry);
        });

        return groups;
    }, [filteredTimetable]);

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">

                {/* =====================================================
                    HEADER
                ====================================================== */}
                <div className="mb-6">
                    <div className="mb-4">
                        <Link
                            to={`/hod/${department}`}
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                        >
                            <FaArrowLeft />
                            Back to Dashboard
                        </Link>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                            <div>
                                <div className="mb-2 flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                                        <FaCalendarAlt className="text-xl" />
                                    </div>

                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900">
                                            Department Timetable
                                        </h1>

                                        <p className="text-sm text-slate-500">
                                            {departmentName}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-500">
                                    View the complete timetable
                                    for the department.
                                </p>
                            </div>

                            <div className="flex min-w-40 flex-col items-center justify-center rounded-xl bg-orange-50 px-6 py-4">
                                <FaCalendarAlt className="mb-1 text-orange-600" />

                                <span className="text-2xl font-bold text-slate-900">
                                    {
                                        departmentTimetable.length
                                    }
                                </span>

                                <span className="text-xs font-medium text-slate-500">
                                    Timetable Entries
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    FILTERS
                ====================================================== */}
                <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">

                    <div className="mb-4 relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Search subject, subject code, staff, year or section..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {days.map((day) => (
                            <button
                                key={day}
                                type="button"
                                onClick={() =>
                                    setSelectedDay(
                                        day
                                    )
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    selectedDay ===
                                    day
                                        ? "bg-orange-600 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {day === "ALL"
                                    ? "All Days"
                                    : day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* =====================================================
                    LOADING
                ====================================================== */}
                {loading && (
                    <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-600" />

                        <p className="text-sm text-slate-500">
                            Loading department timetable...
                        </p>
                    </div>
                )}

                {/* =====================================================
                    ERROR
                ====================================================== */}
                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="font-semibold text-red-700">
                            Failed to load timetable
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                )}

                {/* =====================================================
                    TIMETABLE
                ====================================================== */}
                {!loading &&
                    !error &&
                    filteredTimetable.length > 0 && (
                        <div className="space-y-6">
                            {Object.entries(
                                groupedTimetable
                            ).map(
                                (
                                    [
                                        day,
                                        entries,
                                    ]
                                ) => (
                                    <div
                                        key={day}
                                        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                                    >
                                        {/* Day Header */}
                                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                                <FaCalendarAlt />
                                            </div>

                                            <div>
                                                <h2 className="font-semibold text-slate-900">
                                                    {day}
                                                </h2>

                                                <p className="text-xs text-slate-500">
                                                    {
                                                        entries.length
                                                    }{" "}
                                                    class{" "}
                                                    {entries.length ===
                                                    1
                                                        ? "entry"
                                                        : "entries"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Entries */}
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-100">
                                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                            Time
                                                        </th>

                                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                            Subject
                                                        </th>

                                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                            Staff
                                                        </th>

                                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                            Year
                                                        </th>

                                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                            Section
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-slate-100">
                                                    {entries.map(
                                                        (
                                                            entry,
                                                            index
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    entry.timetable_id ||
                                                                    entry.id ||
                                                                    index
                                                                }
                                                                className="transition hover:bg-slate-50"
                                                            >
                                                                {/* Time */}
                                                                <td className="whitespace-nowrap px-6 py-4">
                                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                                        <FaClock className="text-orange-500" />

                                                                        {getTime(
                                                                            entry
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* Subject */}
                                                                <td className="px-6 py-4">
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-slate-900">
                                                                            {getSubject(
                                                                                entry
                                                                            )}
                                                                        </p>

                                                                        {getSubjectCode(
                                                                            entry
                                                                        ) && (
                                                                            <p className="text-xs text-slate-500">
                                                                                {
                                                                                    getSubjectCode(
                                                                                        entry
                                                                                    )
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* Staff */}
                                                                <td className="whitespace-nowrap px-6 py-4">
                                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                        <FaChalkboardTeacher className="text-slate-400" />

                                                                        {getStaff(
                                                                            entry
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* Year */}
                                                                <td className="whitespace-nowrap px-6 py-4">
                                                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                                        Year{" "}
                                                                        {getYear(
                                                                            entry
                                                                        )}
                                                                    </span>
                                                                </td>

                                                                {/* Section */}
                                                                <td className="whitespace-nowrap px-6 py-4">
                                                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                                        Section{" "}
                                                                        {getSection(
                                                                            entry
                                                                        )}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                {/* =====================================================
                    NO RESULTS
                ====================================================== */}
                {!loading &&
                    !error &&
                    filteredTimetable.length === 0 && (
                        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                <FaCalendarAlt className="text-2xl text-slate-400" />
                            </div>

                            <h2 className="text-lg font-semibold text-slate-900">
                                No timetable found
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {search ||
                                selectedDay !==
                                    "ALL"
                                    ? "Try changing your filters."
                                    : `No timetable entries were found for ${departmentName}.`}
                            </p>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default HodDepartmentTimetable;