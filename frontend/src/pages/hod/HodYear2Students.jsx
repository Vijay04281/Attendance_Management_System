import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaEdit,
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaTrash,
    FaUserGraduate,
} from "react-icons/fa";

const HodYear2Students = () => {
    const { department } = useParams();

    const [students, setStudents] = useState([]);
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

    const fetchStudents = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await fetch(
                "https://attendance-management-system-gpci.onrender.com/api/students",
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
                    data?.message || "Failed to load students"
                );
            }

            const studentList = Array.isArray(data)
                ? data
                : data.students || data.data || [];

            setStudents(studentList);
        } catch (err) {
            console.error("Students fetch error:", err);
            setError(err.message || "Unable to load students");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const filteredStudents = useMemo(() => {
        const departmentStudents = students.filter((student) => {
            const studentDepartment =
                student.department ||
                student.department_name ||
                student.departmentName ||
                "";

            const studentYear = String(
                student.year || student.academic_year || ""
            );

            return (
                studentDepartment.toLowerCase() ===
                    departmentName.toLowerCase() &&
                studentYear === "2"
            );
        });

        if (!search.trim()) {
            return departmentStudents;
        }

        const searchText = search.toLowerCase();

        return departmentStudents.filter((student) => {
            const registerNumber = String(
                student.register_number ||
                    student.roll_number ||
                    student.student_id ||
                    ""
            ).toLowerCase();

            const name = String(student.name || "").toLowerCase();

            const email = String(student.email || "").toLowerCase();

            const section = String(student.section || "").toLowerCase();

            return (
                registerNumber.includes(searchText) ||
                name.includes(searchText) ||
                email.includes(searchText) ||
                section.includes(searchText)
            );
        });
    }, [students, search, departmentName]);

    const getRegisterNumber = (student) => {
        return (
            student.register_number ||
            student.roll_number ||
            student.student_id ||
            "-"
        );
    };

    const handleDelete = (student) => {
        alert(
            `Delete functionality for ${student.name || "this student"} will be connected to the backend next.`
        );
    };

    const handleEdit = (student) => {
        alert(
            `Edit functionality for ${student.name || "this student"} will be connected to the backend next.`
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-indigo-700 px-6 py-5 text-white shadow">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-3">
                                <FaUserGraduate className="text-2xl" />

                                <h1 className="text-2xl font-bold">
                                    Year 2 Students
                                </h1>
                            </div>

                            <p className="text-sm text-indigo-100">
                                {departmentName} Department
                            </p>
                        </div>

                        <Link
                            to={`/hod/${department}`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        >
                            <FaArrowLeft />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main */}
            <main className="mx-auto max-w-7xl p-6">
                {/* Top controls */}
                <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Year 2 Student Management
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                View and manage students belonging to Year 2.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => fetchStudents(true)}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FaSyncAlt
                                className={refreshing ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search register number, name, email or section..."
                                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                alert(
                                    "Add Student functionality will be connected to the backend next."
                                )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            <FaPlus />
                            Add Student
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                        <FaSyncAlt className="mx-auto mb-4 animate-spin text-3xl text-indigo-600" />

                        <p className="text-sm font-medium text-slate-600">
                            Loading Year 2 students...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Total Students
                                </p>

                                <p className="mt-2 text-3xl font-bold text-slate-800">
                                    {filteredStudents.length}
                                </p>
                            </div>

                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Department
                                </p>

                                <p className="mt-2 font-bold text-slate-800">
                                    {departmentName}
                                </p>
                            </div>

                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Academic Year
                                </p>

                                <p className="mt-2 font-bold text-indigo-600">
                                    Year 2
                                </p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-92">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                #
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                Register Number
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                Student Name
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                Email
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                                Section
                                            </th>

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStudents.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="6"
                                                    className="px-5 py-12 text-center"
                                                >
                                                    <FaUserGraduate className="mx-auto mb-3 text-4xl text-slate-300" />

                                                    <p className="font-semibold text-slate-600">
                                                        No Year 2 students
                                                        found
                                                    </p>

                                                    <p className="mt-1 text-sm text-slate-400">
                                                        Try changing your
                                                        search or add a new
                                                        student.
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStudents.map(
                                                (student, index) => (
                                                    <tr
                                                        key={
                                                            student.id ||
                                                            student.student_id ||
                                                            index
                                                        }
                                                        className="transition hover:bg-slate-50"
                                                    >
                                                        <td className="px-5 py-4 text-sm font-medium text-slate-500">
                                                            {index + 1}
                                                        </td>

                                                        <td className="px-5 py-4 text-sm font-semibold text-indigo-600">
                                                            {getRegisterNumber(
                                                                student
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                                                            {student.name ||
                                                                "-"}
                                                        </td>

                                                        <td className="px-5 py-4 text-sm text-slate-600">
                                                            {student.email ||
                                                                "-"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                                                {student.section ||
                                                                    "-"}
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex justify-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            student
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-slate-200 p-2 text-indigo-600 transition hover:bg-indigo-50"
                                                                    title="Edit"
                                                                >
                                                                    <FaEdit />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            student
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-slate-200 p-2 text-red-600 transition hover:bg-red-50"
                                                                    title="Delete"
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
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

export default HodYear2Students;