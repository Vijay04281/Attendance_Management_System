import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FaBuilding,
    FaEdit,
    FaPlus,
    FaSearch,
    FaTrash,
    FaSyncAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaFilter,
    FaTimes,
    FaSave
} from "react-icons/fa";

// =====================================================
// API CONFIG
// =====================================================

const API_BASE_URL = "http://localhost:5000/api";

// =====================================================
// HELPERS
// =====================================================

const getToken = () => {
    return localStorage.getItem("token");
};

const getArrayFromResponse = (
    response,
    possibleKeys = []
) => {
    if (!response) {
        return [];
    }

    if (Array.isArray(response)) {
        return response;
    }

    for (const key of possibleKeys) {
        if (Array.isArray(response[key])) {
            return response[key];
        }
    }

    if (Array.isArray(response.data)) {
        return response.data;
    }

    return [];
};

// =====================================================
// COMPONENT
// =====================================================

function AdminDepartments() {
    // =================================================
    // STATE
    // =================================================

    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [showModal, setShowModal] =
        useState(false);

    const [editingDepartment, setEditingDepartment] =
        useState(null);

    const [form, setForm] = useState({
        department_name: "",
        department_code: "",
        status: "ACTIVE"
    });

    // =================================================
    // API REQUEST
    // =================================================

    const apiRequest = useCallback(
        async (url, options = {}) => {
            const token = getToken();

            if (!token) {
                throw new Error(
                    "Authentication token not found. Please login again."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}${url}`,
                {
                    ...options,
                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,

                        ...(options.headers || {})
                    }
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
                        `Request failed with status ${response.status}`
                );
            }

            return data;
        },
        []
    );

    // =================================================
    // LOAD DEPARTMENTS
    // =================================================

    const loadDepartments = useCallback(
        async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await apiRequest(
                        "/departments"
                    );

                const departmentData =
                    getArrayFromResponse(
                        response,
                        [
                            "departments",
                            "data"
                        ]
                    );

                setDepartments(
                    departmentData
                );
            } catch (err) {
                console.error(
                    "Department Load Error:",
                    err
                );

                setError(
                    err.message ||
                        "Failed to load departments."
                );
            } finally {
                setLoading(false);
            }
        },
        [apiRequest]
    );

    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    // =================================================
    // RESET FORM
    // =================================================

    const resetForm = () => {
        setForm({
            department_name: "",
            department_code: "",
            status: "ACTIVE"
        });

        setEditingDepartment(null);
    };

    // =================================================
    // OPEN ADD
    // =================================================

    const handleAdd = () => {
        resetForm();

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    // =================================================
    // OPEN EDIT
    // =================================================

    const handleEdit = (department) => {
        setEditingDepartment(
            department
        );

        setForm({
            department_name:
                department.department_name ||
                department.name ||
                "",

            department_code:
                department.department_code ||
                department.code ||
                "",

            status:
                department.status ||
                "ACTIVE"
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    // =================================================
    // CLOSE MODAL
    // =================================================

    const handleCloseModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);
        resetForm();
    };

    // =================================================
    // FORM CHANGE
    // =================================================

    const handleChange = (event) => {
        const {
            name,
            value
        } = event.target;

        setForm(
            (previous) => ({
                ...previous,
                [name]: value
            })
        );
    };

    // =================================================
    // SUBMIT
    // =================================================

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !form.department_name.trim()
        ) {
            setError(
                "Please enter the department name."
            );
            return;
        }

        if (
            !form.department_code.trim()
        ) {
            setError(
                "Please enter the department code."
            );
            return;
        }

        setSaving(true);

        try {
            const payload = {
                department_name:
                    form.department_name.trim(),

                department_code:
                    form.department_code
                        .trim()
                        .toUpperCase(),

                status:
                    form.status
            };

            // -----------------------------------------
            // UPDATE
            // -----------------------------------------

            if (editingDepartment) {
                const departmentId =
                    editingDepartment.department_id ||
                    editingDepartment.id;

                await apiRequest(
                    `/departments/${departmentId}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

                setSuccess(
                    "Department updated successfully."
                );
            }

            // -----------------------------------------
            // CREATE
            // -----------------------------------------

            else {
                await apiRequest(
                    "/departments",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

                setSuccess(
                    "Department created successfully."
                );
            }

            setShowModal(false);

            resetForm();

            await loadDepartments();
        } catch (err) {
            console.error(
                "Department Save Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to save department."
            );
        } finally {
            setSaving(false);
        }
    };

    // =================================================
    // DELETE
    // =================================================

    const handleDelete = async (
        department
    ) => {
        const departmentName =
            department.department_name ||
            department.name ||
            "this department";

        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${departmentName}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            const departmentId =
                department.department_id ||
                department.id;

            await apiRequest(
                `/departments/${departmentId}`,
                {
                    method: "DELETE"
                }
            );

            setSuccess(
                "Department deleted successfully."
            );

            await loadDepartments();
        } catch (err) {
            console.error(
                "Department Delete Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to delete department."
            );
        }
    };

    // =================================================
    // FILTER
    // =================================================

    const filteredDepartments =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return departments.filter(
                (department) => {
                    const name =
                        String(
                            department.department_name ||
                                department.name ||
                                ""
                        ).toLowerCase();

                    const code =
                        String(
                            department.department_code ||
                                department.code ||
                                ""
                        ).toLowerCase();

                    const status =
                        String(
                            department.status ||
                                "ACTIVE"
                        ).toUpperCase();

                    const matchesSearch =
                        !query ||
                        name.includes(
                            query
                        ) ||
                        code.includes(
                            query
                        );

                    const matchesStatus =
                        statusFilter ===
                            "ALL" ||
                        status ===
                            statusFilter;

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                }
            );
        }, [
            departments,
            search,
            statusFilter
        ]);

    // =================================================
    // STATISTICS
    // =================================================

    const statistics =
        useMemo(() => {
            const total =
                departments.length;

            const active =
                departments.filter(
                    (department) =>
                        String(
                            department.status ||
                                "ACTIVE"
                        ).toUpperCase() ===
                        "ACTIVE"
                ).length;

            const inactive =
                departments.filter(
                    (department) =>
                        String(
                            department.status ||
                                ""
                        ).toUpperCase() ===
                        "INACTIVE"
                ).length;

            return {
                total,
                active,
                inactive
            };
        }, [departments]);

    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">

            <div className="mx-auto max-w-7xl">

                {/* =====================================
                    HEADER
                ====================================== */}

                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>

                        <div className="flex items-center gap-3">

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">

                                <FaBuilding
                                    size={22}
                                />

                            </div>

                            <div>

                                <h1 className="text-2xl font-bold text-gray-800">
                                    Departments
                                </h1>

                                <p className="text-sm text-gray-500">
                                    Manage academic departments
                                    in the attendance management
                                    system.
                                </p>

                            </div>

                        </div>

                    </div>

                    <div className="flex gap-2">

                        <button
                            type="button"
                            onClick={
                                loadDepartments
                            }
                            disabled={
                                loading
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                            onClick={
                                handleAdd
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                        >

                            <FaPlus />

                            Add Department

                        </button>

                    </div>

                </div>

                {/* =====================================
                    ERROR
                ====================================== */}

                {error && (

                    <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                        <FaTimesCircle className="mt-0.5 shrink-0" />

                        <div className="flex-1">
                            {error}
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

                {/* =====================================
                    SUCCESS
                ====================================== */}

                {success && (

                    <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">

                        <FaCheckCircle className="mt-0.5 shrink-0" />

                        <div className="flex-1">
                            {success}
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

                {/* =====================================
                    STATISTICS
                ====================================== */}

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                    {/* Total */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-gray-500">
                                    Total Departments
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-800">
                                    {
                                        statistics.total
                                    }
                                </p>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">

                                <FaBuilding />

                            </div>

                        </div>

                    </div>

                    {/* Active */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-gray-500">
                                    Active
                                </p>

                                <p className="mt-1 text-2xl font-bold text-green-600">
                                    {
                                        statistics.active
                                    }
                                </p>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-green-600">

                                <FaCheckCircle />

                            </div>

                        </div>

                    </div>

                    {/* Inactive */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-gray-500">
                                    Inactive
                                </p>

                                <p className="mt-1 text-2xl font-bold text-red-600">
                                    {
                                        statistics.inactive
                                    }
                                </p>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-600">

                                <FaTimesCircle />

                            </div>

                        </div>

                    </div>

                </div>

                {/* =====================================
                    FILTERS
                ====================================== */}

                <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">

                        <FaFilter />

                        Filters

                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                        {/* Search */}

                        <div className="relative md:col-span-2">

                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                            <input
                                type="text"
                                value={
                                    search
                                }
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search department name or code..."
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                        </div>

                        {/* Status */}

                        <select
                            value={
                                statusFilter
                            }
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >

                            <option value="ALL">
                                All Status
                            </option>

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="INACTIVE">
                                Inactive
                            </option>

                        </select>

                    </div>

                </div>

                {/* =====================================
                    TABLE
                ====================================== */}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">

                        <div>

                            <h2 className="font-semibold text-gray-800">
                                Department List
                            </h2>

                            <p className="text-sm text-gray-500">

                                Showing{" "}

                                {
                                    filteredDepartments.length
                                }

                                {" "}of{" "}

                                {
                                    departments.length
                                }

                                {" "}departments

                            </p>

                        </div>

                    </div>

                    {/* Loading */}

                    {loading ? (

                        <div className="flex min-h-75 items-center justify-center">

                            <div className="text-center">

                                <FaSyncAlt className="mx-auto mb-3 animate-spin text-2xl text-indigo-600" />

                                <p className="text-sm text-gray-500">
                                    Loading departments...
                                </p>

                            </div>

                        </div>

                    ) : filteredDepartments.length === 0 ? (

                        /* Empty */

                        <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">

                            <FaBuilding className="mb-4 text-4xl text-gray-300" />

                            <h3 className="text-lg font-semibold text-gray-700">
                                No departments found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-gray-500">
                                No departments match your
                                current filters.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleAdd
                                }
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >

                                <FaPlus />

                                Create Department

                            </button>

                        </div>

                    ) : (

                        /* Table */

                        <div className="overflow-x-auto">

                            <table className="min-w-full divide-y divide-gray-200">

                                <thead className="bg-gray-50">

                                    <tr>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            #
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Department
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Code
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>

                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Actions
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-200 bg-white">

                                    {filteredDepartments.map(
                                        (
                                            department,
                                            index
                                        ) => {

                                            const name =
                                                department.department_name ||
                                                department.name ||
                                                "-";

                                            const code =
                                                department.department_code ||
                                                department.code ||
                                                "-";

                                            const status =
                                                String(
                                                    department.status ||
                                                        "ACTIVE"
                                                ).toUpperCase();

                                            const isActive =
                                                status ===
                                                "ACTIVE";

                                            return (

                                                <tr
                                                    key={
                                                        department.department_id ||
                                                        department.id ||
                                                        index
                                                    }
                                                    className="transition hover:bg-gray-50"
                                                >

                                                    {/* Number */}

                                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">

                                                        {
                                                            index +
                                                            1
                                                        }

                                                    </td>

                                                    {/* Department */}

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">

                                                                <FaBuilding />

                                                            </div>

                                                            <div>

                                                                <div className="font-medium text-gray-800">

                                                                    {
                                                                        name
                                                                    }

                                                                </div>

                                                                <div className="text-xs text-gray-500">

                                                                    Department

                                                                </div>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* Code */}

                                                    <td className="whitespace-nowrap px-5 py-4">

                                                        <span className="rounded-md bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">

                                                            {
                                                                code
                                                            }

                                                        </span>

                                                    </td>

                                                    {/* Status */}

                                                    <td className="whitespace-nowrap px-5 py-4">

                                                        {isActive ? (

                                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">

                                                                <FaCheckCircle />

                                                                Active

                                                            </span>

                                                        ) : (

                                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">

                                                                <FaTimesCircle />

                                                                Inactive

                                                            </span>

                                                        )}

                                                    </td>

                                                    {/* Actions */}

                                                    <td className="whitespace-nowrap px-5 py-4 text-right">

                                                        <div className="flex justify-end gap-2">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        department
                                                                    )
                                                                }
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                                                title="Edit Department"
                                                            >

                                                                <FaEdit />

                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        department
                                                                    )
                                                                }
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                                title="Delete Department"
                                                            >

                                                                <FaTrash />

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

            {/* =========================================
                MODAL
            ========================================== */}

            {showModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                        {/* Modal Header */}

                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

                            <div>

                                <h2 className="text-lg font-bold text-gray-800">

                                    {editingDepartment
                                        ? "Edit Department"
                                        : "Add Department"}

                                </h2>

                                <p className="text-xs text-gray-500">

                                    Maintain department
                                    information.

                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleCloseModal
                                }
                                disabled={
                                    saving
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                            >

                                <FaTimes />

                            </button>

                        </div>

                        {/* Modal Body */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-5 p-6"
                        >

                            {/* Department Name */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">

                                    Department Name

                                    <span className="text-red-500">
                                        {" "}*
                                    </span>

                                </label>

                                <div className="relative">

                                    <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <input
                                        type="text"
                                        name="department_name"
                                        value={
                                            form.department_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: Computer Science and Engineering"
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />

                                </div>

                            </div>

                            {/* Department Code */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">

                                    Department Code

                                    <span className="text-red-500">
                                        {" "}*
                                    </span>

                                </label>

                                <div className="relative">

                                    <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <input
                                        type="text"
                                        name="department_code"
                                        value={
                                            form.department_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: CSE"
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />

                                </div>

                                <p className="mt-1 text-xs text-gray-500">
                                    The department code will be
                                    stored in uppercase.
                                </p>

                            </div>

                            {/* Status */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={
                                        form.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                >

                                    <option value="ACTIVE">
                                        Active
                                    </option>

                                    <option value="INACTIVE">
                                        Inactive
                                    </option>

                                </select>

                            </div>

                            {/* Form Error */}

                            {error && (

                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

                                    {error}

                                </div>

                            )}

                            {/* Buttons */}

                            <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                                <button
                                    type="button"
                                    onClick={
                                        handleCloseModal
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >

                                    Cancel

                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    {saving ? (
                                        <FaSyncAlt className="animate-spin" />
                                    ) : (
                                        <FaSave />
                                    )}

                                    {editingDepartment
                                        ? "Update Department"
                                        : "Save Department"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default AdminDepartments;