import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaGraduationCap,
    FaSearch,
    FaEnvelope,
    FaIdCard,
    FaBuilding,
} from "react-icons/fa";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const HodDepartmentStudents = () => {
    const { department } = useParams();

    const [students, setStudents] = useState([]);
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
        const fetchStudents = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_BASE_URL}/students`,
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
                            "Failed to fetch students"
                    );
                }

                const studentList = Array.isArray(data)
                    ? data
                    : Array.isArray(data.students)
                    ? data.students
                    : [];

                setStudents(studentList);
            } catch (err) {
                console.error(
                    "HOD Department Students Error:",
                    err
                );

                setError(
                    err.message ||
                        "Failed to load students"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [token]);

    /*
     * Filter students by department.
     */
    const departmentStudents = useMemo(() => {
        return students.filter((student) => {
            const studentDepartment =
                student.department_slug ||
                student.departmentSlug ||
                "";

            const studentDepartmentName =
                student.department ||
                student.department_name ||
                student.departmentName ||
                "";

            if (
                studentDepartment &&
                String(studentDepartment)
                    .toLowerCase()
                    .trim() ===
                    String(department)
                        .toLowerCase()
                        .trim()
            ) {
                return true;
            }

            if (
                studentDepartmentName &&
                String(studentDepartmentName)
                    .toLowerCase()
                    .trim() ===
                    String(departmentName)
                        .toLowerCase()
                        .trim()
            ) {
                return true;
            }

            const normalizedStudentDepartment =
                String(studentDepartmentName)
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
                normalizedStudentDepartment ===
                normalizedDepartment
            );
        });
    }, [students, department, departmentName]);

    const getStudentName = (student) =>
        student.name ||
        student.full_name ||
        student.student_name ||
        "Unknown Student";

    const getRegisterNumber = (student) =>
        student.register_number ||
        student.registerNo ||
        student.register_no ||
        student.reg_no ||
        student.roll_number ||
        "-";

    const getEmail = (student) =>
        student.email ||
        student.student_email ||
        "-";

    const getYear = (student) =>
        student.year ||
        student.student_year ||
        "-";

    const getSection = (student) =>
        student.section ||
        student.student_section ||
        "-";

    const getStudentId = (student) =>
        student.student_id ||
        student.user_id ||
        student.id ||
        "-";

    /*
     * Search students.
     */
    const filteredStudents = useMemo(() => {
        const keyword =
            search.trim().toLowerCase();

        if (!keyword) {
            return departmentStudents;
        }

        return departmentStudents.filter(
            (student) => {
                const name =
                    getStudentName(student);

                const registerNumber =
                    getRegisterNumber(student);

                const email =
                    getEmail(student);

                const year =
                    getYear(student);

                const section =
                    getSection(student);

                return (
                    String(name)
                        .toLowerCase()
                        .includes(keyword) ||
                    String(registerNumber)
                        .toLowerCase()
                        .includes(keyword) ||
                    String(email)
                        .toLowerCase()
                        .includes(keyword) ||
                    String(year)
                        .toLowerCase()
                        .includes(keyword) ||
                    String(section)
                        .toLowerCase()
                        .includes(keyword)
                );
            }
        );
    }, [departmentStudents, search]);

    /*
     * Only Year 2 and Year 3 are displayed.
     */
    const year2Students = useMemo(() => {
        return filteredStudents.filter((student) => {
            return String(getYear(student))
                .trim()
                .toLowerCase()
                .replace("year", "")
                .trim() === "2";
        });
    }, [filteredStudents]);

    const year3Students = useMemo(() => {
        return filteredStudents.filter((student) => {
            return String(getYear(student))
                .trim()
                .toLowerCase()
                .replace("year", "")
                .trim() === "3";
        });
    }, [filteredStudents]);

    /*
     * Reusable student table.
     */
    const StudentTable = ({ students }) => {
        return (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Register No
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Student
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Email
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Year
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Section
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Student ID
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {students.map(
                                (
                                    student,
                                    index
                                ) => (
                                    <tr
                                        key={
                                            student.student_id ||
                                            student.user_id ||
                                            student.id ||
                                            index
                                        }
                                        className="transition hover:bg-slate-50"
                                    >
                                        {/* Register Number */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <FaIdCard className="text-blue-500" />

                                                {getRegisterNumber(
                                                    student
                                                )}
                                            </div>
                                        </td>

                                        {/* Student */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                                                    {getStudentName(
                                                        student
                                                    )
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {getStudentName(
                                                            student
                                                        )}
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        Student
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <FaEnvelope className="text-slate-400" />

                                                {getEmail(
                                                    student
                                                )}
                                            </div>
                                        </td>

                                        {/* Year */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                                                Year{" "}
                                                {getYear(
                                                    student
                                                )}
                                            </span>
                                        </td>

                                        {/* Section */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                Section{" "}
                                                {getSection(
                                                    student
                                                )}
                                            </span>
                                        </td>

                                        {/* Student ID */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <FaBuilding className="text-slate-400" />

                                                {getStudentId(
                                                    student
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    /*
     * Empty year section.
     */
    const EmptyYear = ({ year }) => {
        return (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <FaGraduationCap className="text-xl text-slate-400" />
                </div>

                <p className="font-semibold text-slate-700">
                    No Year {year} students found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                    {search
                        ? "Try changing your search."
                        : `There are currently no Year ${year} students in ${departmentName}.`}
                </p>
            </div>
        );
    };

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
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                        <FaGraduationCap className="text-xl" />
                                    </div>

                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900">
                                            Department Students
                                        </h1>

                                        <p className="text-sm text-slate-500">
                                            {departmentName}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-500">
                                    View Year 2 and Year 3 students
                                    belonging to the{" "}
                                    {departmentName} department.
                                </p>
                            </div>

                            <div className="flex min-w-40 flex-col items-center justify-center rounded-xl bg-blue-50 px-6 py-4">
                                <FaGraduationCap className="mb-1 text-blue-600" />

                                <span className="text-2xl font-bold text-slate-900">
                                    {year2Students.length +
                                        year3Students.length}
                                </span>

                                <span className="text-xs font-medium text-slate-500">
                                    Year 2 & Year 3 Students
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
                            placeholder="Search by register number, student name, email, year or section..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                {/* =====================================================
                    LOADING
                ====================================================== */}
                {loading && (
                    <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                        <p className="text-sm text-slate-500">
                            Loading department students...
                        </p>
                    </div>
                )}

                {/* =====================================================
                    ERROR
                ====================================================== */}
                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="font-semibold text-red-700">
                            Failed to load students
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                )}

                {/* =====================================================
                    YEAR 2
                ====================================================== */}
                {!loading && !error && (
                    <div className="mb-8">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                                    <FaGraduationCap />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Year 2
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Year 2 students
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
                                {year2Students.length} Students
                            </div>
                        </div>

                        {year2Students.length > 0 ? (
                            <StudentTable
                                students={
                                    year2Students
                                }
                            />
                        ) : (
                            <EmptyYear year={2} />
                        )}
                    </div>
                )}

                {/* =====================================================
                    YEAR 3
                ====================================================== */}
                {!loading && !error && (
                    <div className="mb-8">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                    <FaGraduationCap />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Year 3
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Year 3 students
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                                {year3Students.length} Students
                            </div>
                        </div>

                        {year3Students.length > 0 ? (
                            <StudentTable
                                students={
                                    year3Students
                                }
                            />
                        ) : (
                            <EmptyYear year={3} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HodDepartmentStudents;