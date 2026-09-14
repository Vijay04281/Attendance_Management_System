import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaBook,
    FaSearch,
    FaCode,
    FaGraduationCap,
} from "react-icons/fa";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const HodDepartmentSubjects = () => {
    const { department } = useParams();

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

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
        const fetchSubjects = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_BASE_URL}/subjects`,
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
                            "Failed to fetch subjects"
                    );
                }

                const subjectList = Array.isArray(data)
                    ? data
                    : Array.isArray(data.subjects)
                    ? data.subjects
                    : [];

                setSubjects(subjectList);
            } catch (err) {
                console.error(
                    "HOD Department Subjects Error:",
                    err
                );

                setError(
                    err.message ||
                        "Failed to load subjects"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, [token]);

    const departmentSubjects = useMemo(() => {
        return subjects.filter((subject) => {
            const subjectDepartmentSlug =
                subject.department_slug ||
                subject.departmentSlug ||
                "";

            const subjectDepartmentName =
                subject.department ||
                subject.department_name ||
                subject.departmentName ||
                "";

            if (
                subjectDepartmentSlug &&
                String(subjectDepartmentSlug)
                    .toLowerCase()
                    .trim() ===
                    String(department)
                        .toLowerCase()
                        .trim()
            ) {
                return true;
            }

            if (
                subjectDepartmentName &&
                String(subjectDepartmentName)
                    .toLowerCase()
                    .trim() ===
                    String(departmentName)
                        .toLowerCase()
                        .trim()
            ) {
                return true;
            }

            const normalizedSubjectDepartment =
                String(subjectDepartmentName)
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
                normalizedSubjectDepartment ===
                normalizedDepartment
            );
        });
    }, [
        subjects,
        department,
        departmentName,
    ]);

    const filteredSubjects = useMemo(() => {
        const keyword =
            search.trim().toLowerCase();

        if (!keyword) {
            return departmentSubjects;
        }

        return departmentSubjects.filter(
            (subject) => {
                const code =
                    subject.subject_code ||
                    subject.subjectCode ||
                    subject.code ||
                    "";

                const name =
                    subject.subject_name ||
                    subject.subjectName ||
                    subject.name ||
                    "";

                const year =
                    subject.year ||
                    subject.subject_year ||
                    "";

                const semester =
                    subject.semester ||
                    subject.sem ||
                    "";

                return (
                    String(code)
                        .toLowerCase()
                        .includes(keyword) ||
                    String(name)
                        .toLowerCase()
                        .includes(keyword) ||
                    String(year)
                        .toLowerCase()
                        .includes(keyword) ||
                    String(semester)
                        .toLowerCase()
                        .includes(keyword)
                );
            }
        );
    }, [departmentSubjects, search]);

    const getSubjectCode = (subject) =>
        subject.subject_code ||
        subject.subjectCode ||
        subject.code ||
        "-";

    const getSubjectName = (subject) =>
        subject.subject_name ||
        subject.subjectName ||
        subject.name ||
        "Unknown Subject";

    const getYear = (subject) =>
        subject.year ||
        subject.subject_year ||
        "-";

    const getSemester = (subject) =>
        subject.semester ||
        subject.sem ||
        "-";

    const getCredits = (subject) =>
        subject.credits ||
        subject.credit ||
        "-";

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
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                                        <FaBook className="text-xl" />
                                    </div>

                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900">
                                            Department Subjects
                                        </h1>

                                        <p className="text-sm text-slate-500">
                                            {departmentName}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-500">
                                    View all subjects offered by
                                    this department.
                                </p>
                            </div>

                            <div className="flex min-w-40 flex-col items-center justify-center rounded-xl bg-purple-50 px-6 py-4">
                                <FaBook className="mb-1 text-purple-600" />

                                <span className="text-2xl font-bold text-slate-900">
                                    {
                                        departmentSubjects.length
                                    }
                                </span>

                                <span className="text-xs font-medium text-slate-500">
                                    Total Subjects
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    SEARCH
                ====================================================== */}
                <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Search by subject code, subject name, year or semester..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100"
                        />
                    </div>
                </div>

                {/* =====================================================
                    LOADING
                ====================================================== */}
                {loading && (
                    <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600" />

                        <p className="text-sm text-slate-500">
                            Loading department subjects...
                        </p>
                    </div>
                )}

                {/* =====================================================
                    ERROR
                ====================================================== */}
                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="font-semibold text-red-700">
                            Failed to load subjects
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                )}

                {/* =====================================================
                    SUBJECT TABLE
                ====================================================== */}
                {!loading &&
                    !error &&
                    filteredSubjects.length > 0 && (
                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Subject Code
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Subject
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Year
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Semester
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Credits
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Department
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {filteredSubjects.map(
                                            (
                                                subject,
                                                index
                                            ) => (
                                                <tr
                                                    key={
                                                        subject.subject_id ||
                                                        subject.id ||
                                                        index
                                                    }
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    {/* Subject Code */}
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                            <FaCode className="text-purple-500" />

                                                            {getSubjectCode(
                                                                subject
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Subject */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                                                <FaBook />
                                                            </div>

                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {getSubjectName(
                                                                        subject
                                                                    )}
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    Department Subject
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Year */}
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                            Year{" "}
                                                            {getYear(
                                                                subject
                                                            )}
                                                        </span>
                                                    </td>

                                                    {/* Semester */}
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                            Semester{" "}
                                                            {getSemester(
                                                                subject
                                                            )}
                                                        </span>
                                                    </td>

                                                    {/* Credits */}
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <FaGraduationCap className="text-slate-400" />

                                                            {getCredits(
                                                                subject
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Department */}
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                        {departmentName}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                {/* =====================================================
                    NO RESULTS
                ====================================================== */}
                {!loading &&
                    !error &&
                    filteredSubjects.length === 0 && (
                        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                <FaBook className="text-2xl text-slate-400" />
                            </div>

                            <h2 className="text-lg font-semibold text-slate-900">
                                No subjects found
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {search
                                    ? "Try changing your search."
                                    : `No subjects were found for ${departmentName}.`}
                            </p>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default HodDepartmentSubjects;