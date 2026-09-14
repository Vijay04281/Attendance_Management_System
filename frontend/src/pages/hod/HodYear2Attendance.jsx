import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaCalendarCheck,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSearch,
    FaSyncAlt,
    FaTimesCircle,
    FaUserGraduate,
} from "react-icons/fa";

const HodYear2Attendance = () => {
    const { department } = useParams();

    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const token = localStorage.getItem("token");

    const departmentName = useMemo(() => {
        const departmentMap = {
            "computer-science": "Computer Science",
            "information-technology": "Information Technology",
            electronics: "Electronics",
        };

        return departmentMap[department] || "Computer Science";
    }, [department]);

    const fetchAttendance = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            /*
             * This page uses the existing student attendance endpoint.
             * It loads attendance records for the logged-in user.
             * If a dedicated HOD attendance endpoint is added later,
             * only this API URL needs to be changed.
             */
            const response = await fetch(
                "http://localhost:5000/api/attendance",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message || "Failed to load attendance"
                );
            }

            const list = Array.isArray(data)
                ? data
                : data.attendance || data.data || [];

            setAttendance(list);
        } catch (err) {
            console.error("Attendance fetch error:", err);

            /*
             * The backend currently may not expose a generic
             * /api/attendance GET endpoint for HOD.
             *
             * We keep the page usable instead of crashing.
             */
            setError(
                err.message ||
                    "Attendance data could not be loaded"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const filteredAttendance = useMemo(() => {
        if (!search.trim()) {
            return attendance;
        }

        const searchText = search.toLowerCase();

        return attendance.filter((item) => {
            const student = String(
                item.student_name ||
                    item.name ||
                    item.register_number ||
                    ""
            ).toLowerCase();

            const subject = String(
                item.subject_name ||
                    item.subject_code ||
                    ""
            ).toLowerCase();

            const status = String(
                item.status || ""
            ).toLowerCase();

            return (
                student.includes(searchText) ||
                subject.includes(searchText) ||
                status.includes(searchText)
            );
        });
    }, [attendance, search]);

    const totalRecords = filteredAttendance.length;

    const presentCount = filteredAttendance.filter(
        (item) =>
            String(item.status || "").toLowerCase() ===
            "present"
    ).length;

    const absentCount = filteredAttendance.filter(
        (item) =>
            String(item.status || "").toLowerCase() ===
            "absent"
    ).length;

    const attendancePercentage =
        totalRecords > 0
            ? Math.round(
                  (presentCount / totalRecords) * 100
              )
            : 0;

    const getStatus = (item) => {
        return String(item.status || "Unknown");
    };

    const getStudentName = (item) => {
        return (
            item.student_name ||
            item.name ||
            "-"
        );
    };

    const getRegisterNumber = (item) => {
        return (
            item.register_number ||
            item.roll_number ||
            item.student_id ||
            "-"
        );
    };

    const getSubject = (item) => {
        return (
            item.subject_name ||
            item.subject_code ||
            "-"
        );
    };

    const getDate = (item) => {
        const date =
            item.scanned_at ||
            item.session_date ||
            item.date;

        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-indigo-700 px-6 py-5 text-white shadow">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-3">
                                <FaCalendarCheck className="text-2xl" />

                                <h1 className="text-2xl font-bold">
                                    Year 2 Attendance
                                </h1>
                            </div>

                            <p className="text-sm text-indigo-100">
                                {departmentName} Department
                            </p>
                        </div>

                        <Link
                            to={`/hod/${department}`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                            <FaArrowLeft />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-7xl p-6">
                {/* Controls */}
                <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Year 2 Attendance Monitoring
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Monitor attendance records for Year 2
                                students.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => fetchAttendance(true)}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                            <FaSyncAlt
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            Refresh
                        </button>
                    </div>

                    <div className="relative mt-5">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search student, register number, subject or status..."
                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                        <FaExclamationTriangle className="mt-0.5" />

                        <div>
                            <p className="font-semibold">
                                Attendance API
                            </p>

                            <p className="mt-1">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                        <FaSyncAlt className="mx-auto mb-4 animate-spin text-3xl text-indigo-600" />

                        <p className="text-sm text-slate-600">
                            Loading Year 2 attendance...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Statistics */}
                        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">
                                            Total Records
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-slate-800">
                                            {totalRecords}
                                        </p>
                                    </div>

                                    <FaUserGraduate className="text-2xl text-indigo-500" />
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">
                                            Present
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-green-600">
                                            {presentCount}
                                        </p>
                                    </div>

                                    <FaCheckCircle className="text-2xl text-green-500" />
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">
                                            Absent
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-red-600">
                                            {absentCount}
                                        </p>
                                    </div>

                                    <FaTimesCircle className="text-2xl text-red-500" />
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Attendance %
                                </p>

                                <p
                                    className={`mt-2 text-3xl font-bold ${
                                        attendancePercentage >=
                                        75
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {attendancePercentage}%
                                </p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-92">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-600">
                                                #
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-600">
                                                Student
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-600">
                                                Register Number
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-600">
                                                Subject
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-600">
                                                Date
                                            </th>

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase text-slate-600">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAttendance.length ===
                                        0 ? (
                                            <tr>
                                                <td
                                                    colSpan="6"
                                                    className="px-5 py-12 text-center"
                                                >
                                                    <FaCalendarCheck className="mx-auto mb-3 text-4xl text-slate-300" />

                                                    <p className="font-semibold text-slate-600">
                                                        No attendance
                                                        records found
                                                    </p>

                                                    <p className="mt-1 text-sm text-slate-400">
                                                        Attendance records
                                                        will appear here
                                                        when available.
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAttendance.map(
                                                (item, index) => {
                                                    const status =
                                                        getStatus(
                                                            item
                                                        ).toLowerCase();

                                                    return (
                                                        <tr
                                                            key={
                                                                item.attendance_id ||
                                                                item.id ||
                                                                index
                                                            }
                                                            className="hover:bg-slate-50"
                                                        >
                                                            <td className="px-5 py-4 text-sm text-slate-500">
                                                                {index +
                                                                    1}
                                                            </td>

                                                            <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                                                                {getStudentName(
                                                                    item
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4 text-sm text-indigo-600">
                                                                {getRegisterNumber(
                                                                    item
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4 text-sm text-slate-700">
                                                                {getSubject(
                                                                    item
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                                {getDate(
                                                                    item
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4 text-center">
                                                                <span
                                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                                                        status ===
                                                                        "present"
                                                                            ? "bg-green-50 text-green-700"
                                                                            : status ===
                                                                                "absent"
                                                                              ? "bg-red-50 text-red-700"
                                                                              : "bg-slate-100 text-slate-600"
                                                                    }`}
                                                                >
                                                                    {getStatus(
                                                                        item
                                                                    )}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default HodYear2Attendance;