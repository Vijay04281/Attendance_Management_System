import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    FaUserGraduate,
    FaSearch,
    FaArrowLeft,
    FaSyncAlt,
    FaPlus,
    FaEdit,
    FaTrash,
} from "react-icons/fa";

const HodYear3Students = () => {
    const { department } = useParams();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const token = localStorage.getItem("token");

    const getRollNumber = (student) => {
        return (
            student?.register_number ||
            student?.roll_number ||
            "-"
        );
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/students",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
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
                : data?.students || data?.data || [];

            setStudents(studentList);
        } catch (err) {
            console.error("Year 3 students error:", err);
            setError(err.message || "Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const studentYear = String(
                student?.year ?? ""
            ).trim();

            const studentDepartment = String(
                student?.department ||
                student?.department_name ||
                ""
            )
                .trim()
                .toLowerCase();

            const departmentMatch =
                !department ||
                department === "all" ||
                department === "computer-science"
                    ? studentDepartment === "" ||
                      studentDepartment.includes("computer science") ||
                      studentDepartment.includes("computer-science") ||
                      studentDepartment.includes("cse")
                    : studentDepartment.includes(
                          String(department)
                              .replaceAll("-", " ")
                              .toLowerCase()
                      );

            const yearMatch = studentYear === "3";

            const searchText = `
                ${student?.name || ""}
                ${getRollNumber(student)}
                ${student?.register_number || ""}
                ${student?.email || ""}
                ${student?.section || ""}
            `.toLowerCase();

            const searchMatch = searchText.includes(
                search.toLowerCase()
            );

            return (
                yearMatch &&
                departmentMatch &&
                searchMatch
            );
        });
    }, [students, search, department]);

    const handleAdd = () => {
        alert("Add Student feature will be connected next.");
    };

    const handleEdit = (student) => {
        alert(
            `Edit Student: ${
                student?.name || "Selected Student"
            }`
        );
    };

    const handleDelete = (student) => {
        const confirmed = window.confirm(
            `Delete ${student?.name || "this student"}?`
        );

        if (!confirmed) return;

        alert(
            "Delete API will be connected next."
        );
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                    <div className="flex items-center gap-3">
                        <Link
                            to={`/hod/${
                                department || "computer-science"
                            }`}
                            className="rounded-lg bg-white p-3 text-slate-600 shadow-sm transition hover:bg-slate-100"
                        >
                            <FaArrowLeft />
                        </Link>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                Year 3 Students
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage Year 3 students
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">

                    <button
                        onClick={fetchStudents}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <FaSyncAlt />
                        Refresh
                    </button>

                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <FaPlus />
                        Add Student
                    </button>

                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-slate-500">
                                Year
                            </p>

                            <h2 className="mt-1 text-2xl font-bold text-slate-800">
                                3
                            </h2>
                        </div>

                        <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                            <FaUserGraduate size={22} />
                        </div>

                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Total Students
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-slate-800">
                        {filteredStudents.length}
                    </h2>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Department
                    </p>

                    <h2 className="mt-1 text-xl font-bold capitalize text-slate-800">
                        {(department || "Computer Science")
                            .replaceAll("-", " ")}
                    </h2>
                </div>

            </div>

            {/* Search */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search by name, register number, email or section..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>

            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full text-left">

                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    #
                                </th>

                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Register Number
                                </th>

                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Student Name
                                </th>

                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Email
                                </th>

                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Section
                                </th>

                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-sm text-slate-500"
                                    >
                                        Loading Year 3 students...
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center">

                                            <FaUserGraduate
                                                size={35}
                                                className="text-slate-300"
                                            />

                                            <p className="mt-3 font-medium text-slate-600">
                                                No Year 3 students found
                                            </p>

                                            <p className="mt-1 text-sm text-slate-400">
                                                Try changing your search
                                                or add a new student.
                                            </p>

                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(
                                    (student, index) => (
                                        <tr
                                            key={
                                                student?.id ||
                                                student?.student_id ||
                                                index
                                            }
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {index + 1}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="font-medium text-indigo-600">
                                                    {getRollNumber(
                                                        student
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800">
                                                    {student?.name ||
                                                        "-"}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {student?.email ||
                                                    "-"}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {student?.section ||
                                                    "-"}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        onClick={() =>
                                                            handleEdit(
                                                                student
                                                            )
                                                        }
                                                        className="rounded-lg bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                student
                                                            )
                                                        }
                                                        className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
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

        </div>
    );
};

export default HodYear3Students;