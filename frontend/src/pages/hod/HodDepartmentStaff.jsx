import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaChalkboardTeacher,
    FaEnvelope,
    FaIdBadge,
    FaSearch,
    FaUserTie,
} from "react-icons/fa";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "https://attendance-management-system-gpci.onrender.com/api";

const HodDepartmentStaff = () => {
    const { department } = useParams();

    const [staff, setStaff] = useState([]);
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
        const fetchStaff = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_BASE_URL}/staff`,
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
                            "Failed to fetch staff"
                    );
                }

                const staffList = Array.isArray(data)
                    ? data
                    : Array.isArray(data.staff)
                    ? data.staff
                    : [];

                setStaff(staffList);
            } catch (err) {
                console.error(
                    "HOD Department Staff Error:",
                    err
                );

                setError(
                    err.message ||
                        "Failed to load staff"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchStaff();
    }, [token]);

    const departmentStaff = useMemo(() => {
        return staff.filter((member) => {
            const staffDepartmentSlug =
                member.department_slug ||
                member.departmentSlug ||
                "";

            const staffDepartmentName =
                member.department ||
                member.department_name ||
                member.departmentName ||
                "";

            if (
                staffDepartmentSlug &&
                String(staffDepartmentSlug)
                    .toLowerCase()
                    .trim() ===
                    String(department)
                        .toLowerCase()
                        .trim()
            ) {
                return true;
            }

            if (
                staffDepartmentName &&
                String(staffDepartmentName)
                    .toLowerCase()
                    .trim() ===
                    String(departmentName)
                        .toLowerCase()
                        .trim()
            ) {
                return true;
            }

            const normalizedStaffDepartment =
                String(staffDepartmentName)
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
                normalizedStaffDepartment ===
                normalizedDepartment
            );
        });
    }, [staff, department, departmentName]);

    const filteredStaff = useMemo(() => {
        const keyword =
            search.trim().toLowerCase();

        if (!keyword) {
            return departmentStaff;
        }

        return departmentStaff.filter((member) => {
            const name =
                member.name ||
                member.full_name ||
                member.staff_name ||
                member.username ||
                "";

            const email =
                member.email ||
                member.staff_email ||
                "";

            const staffId =
                member.staff_code ||
                member.employee_id ||
                member.employee_code ||
                member.staff_id ||
                member.user_id ||
                "";

            const designation =
                member.designation ||
                member.role_name ||
                member.position ||
                member.role ||
                "";

            return (
                String(name)
                    .toLowerCase()
                    .includes(keyword) ||
                String(email)
                    .toLowerCase()
                    .includes(keyword) ||
                String(staffId)
                    .toLowerCase()
                    .includes(keyword) ||
                String(designation)
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }, [departmentStaff, search]);

    const getStaffName = (member) =>
        member.name ||
        member.full_name ||
        member.staff_name ||
        member.username ||
        "Unknown Staff";

    const getStaffEmail = (member) =>
        member.email ||
        member.staff_email ||
        "-";

    const getStaffId = (member) =>
        member.staff_code ||
        member.employee_id ||
        member.employee_code ||
        member.staff_id ||
        member.user_id ||
        "-";

    const getDesignation = (member) =>
        member.designation ||
        member.role_name ||
        member.position ||
        member.role ||
        "Teaching Staff";

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
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                        <FaChalkboardTeacher className="text-xl" />
                                    </div>

                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900">
                                            Department Staff
                                        </h1>

                                        <p className="text-sm text-slate-500">
                                            {departmentName}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-500">
                                    View all teaching staff belonging
                                    to this department.
                                </p>
                            </div>

                            <div className="flex min-w-40 flex-col items-center justify-center rounded-xl bg-indigo-50 px-6 py-4">
                                <FaUserTie className="mb-1 text-indigo-600" />

                                <span className="text-2xl font-bold text-slate-900">
                                    {
                                        departmentStaff.length
                                    }
                                </span>

                                <span className="text-xs font-medium text-slate-500">
                                    Total Staff
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
                            placeholder="Search staff by name, ID, email or designation..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                {/* =====================================================
                    LOADING
                ====================================================== */}
                {loading && (
                    <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

                        <p className="text-sm text-slate-500">
                            Loading department staff...
                        </p>
                    </div>
                )}

                {/* =====================================================
                    ERROR
                ====================================================== */}
                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="font-semibold text-red-700">
                            Failed to load staff
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                )}

                {/* =====================================================
                    STAFF TABLE
                ====================================================== */}
                {!loading &&
                    !error &&
                    filteredStaff.length > 0 && (
                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Staff ID
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Staff
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Email
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Designation
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Department
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStaff.map(
                                            (
                                                member,
                                                index
                                            ) => (
                                                <tr
                                                    key={
                                                        member.staff_id ||
                                                        member.user_id ||
                                                        member.employee_id ||
                                                        index
                                                    }
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                            <FaIdBadge className="text-indigo-500" />

                                                            {getStaffId(
                                                                member
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                                                                {getStaffName(
                                                                    member
                                                                )
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {getStaffName(
                                                                        member
                                                                    )}
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    Staff Member
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <FaEnvelope className="text-slate-400" />

                                                            {getStaffEmail(
                                                                member
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                            {getDesignation(
                                                                member
                                                            )}
                                                        </span>
                                                    </td>

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
                    filteredStaff.length === 0 && (
                        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                <FaUserTie className="text-2xl text-slate-400" />
                            </div>

                            <h2 className="text-lg font-semibold text-slate-900">
                                No staff found
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {search
                                    ? "Try changing your search."
                                    : `No staff records were found for ${departmentName}.`}
                            </p>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default HodDepartmentStaff;