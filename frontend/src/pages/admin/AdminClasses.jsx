import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FaBook,
    FaEdit,
    FaPlus,
    FaSearch,
    FaTrash,
    FaSyncAlt,
    FaTimes,
    FaSave,
    FaFilter,
    FaGraduationCap,
    FaBuilding,
    FaCheckCircle
} from "react-icons/fa";

// =====================================================
// API CONFIG
// =====================================================

const API_BASE_URL = "https://attendance-management-system-gpci.onrender.com/api";

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

function AdminClasses() {
    // =================================================
    // STATE
    // =================================================

    const [classes, setClasses] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingDepartments, setLoadingDepartments] =
        useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] =
        useState("ALL");
    const [yearFilter, setYearFilter] =
        useState("ALL");

    const [showModal, setShowModal] =
        useState(false);

    const [editingClass, setEditingClass] =
        useState(null);

    const [form, setForm] = useState({
        department_id: "",
        year: "",
        section: ""
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
    // LOAD CLASSES
    // =================================================

    const loadClasses = useCallback(
        async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await apiRequest("/classes");

                const classData =
                    getArrayFromResponse(
                        response,
                        [
                            "classes",
                            "data"
                        ]
                    );

                setClasses(classData);
            } catch (err) {
                console.error(
                    "Class Load Error:",
                    err
                );

                setError(
                    err.message ||
                        "Failed to load classes."
                );
            } finally {
                setLoading(false);
            }
        },
        [apiRequest]
    );

    // =================================================
    // LOAD DEPARTMENTS
    // =================================================

    const loadDepartments =
        useCallback(async () => {
            try {
                setLoadingDepartments(true);

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
                setLoadingDepartments(false);
            }
        }, [apiRequest]);

    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {
        loadClasses();
        loadDepartments();
    }, [
        loadClasses,
        loadDepartments
    ]);

    // =================================================
    // RESET FORM
    // =================================================

    const resetForm = () => {
        setForm({
            department_id: "",
            year: "",
            section: ""
        });

        setEditingClass(null);
    };

    // =================================================
    // OPEN ADD MODAL
    // =================================================

    const handleAdd = () => {
        resetForm();

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    // =================================================
    // OPEN EDIT MODAL
    // =================================================

    const handleEdit = (classItem) => {
        setEditingClass(classItem);

        setForm({
            department_id:
                classItem.department_id ??
                "",

            year:
                classItem.year ??
                "",

            section:
                classItem.section ??
                ""
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

        if (!form.department_id) {
            setError(
                "Please select a department."
            );
            return;
        }

        if (!form.year) {
            setError(
                "Please select a year."
            );
            return;
        }

        if (!form.section.trim()) {
            setError(
                "Please enter the section."
            );
            return;
        }

        setSaving(true);

        try {
            const payload = {
                department_id:
                    Number(
                        form.department_id
                    ),

                year:
                    Number(form.year),

                section:
                    form.section
                        .trim()
                        .toUpperCase()
            };

            // -----------------------------------------
            // UPDATE
            // -----------------------------------------

            if (editingClass) {
                const classId =
                    editingClass.class_id ||
                    editingClass.id;

                await apiRequest(
                    `/classes/${classId}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

                setSuccess(
                    "Class updated successfully."
                );
            }

            // -----------------------------------------
            // CREATE
            // -----------------------------------------

            else {
                await apiRequest(
                    "/classes",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

                setSuccess(
                    "Class created successfully."
                );
            }

            setShowModal(false);
            resetForm();

            await loadClasses();
        } catch (err) {
            console.error(
                "Class Save Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to save class."
            );
        } finally {
            setSaving(false);
        }
    };

    // =================================================
    // DELETE CLASS
    // =================================================

    const handleDelete = async (
        classItem
    ) => {
        const className =
            getClassDisplayName(
                classItem
            );

        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${className}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            const classId =
                classItem.class_id ||
                classItem.id;

            await apiRequest(
                `/classes/${classId}`,
                {
                    method: "DELETE"
                }
            );

            setSuccess(
                "Class deleted successfully."
            );

            await loadClasses();
        } catch (err) {
            console.error(
                "Class Delete Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to delete class."
            );
        }
    };

    // =================================================
    // GET DEPARTMENT NAME
    // =================================================

    const getDepartmentName = (
        classItem
    ) => {
        if (
            classItem.department_name
        ) {
            return classItem.department_name;
        }

        if (
            classItem.departmentName
        ) {
            return classItem.departmentName;
        }

        const department =
            departments.find(
                (item) =>
                    Number(
                        item.department_id ||
                            item.id
                    ) ===
                    Number(
                        classItem.department_id
                    )
            );

        return (
            department?.department_name ||
            department?.name ||
            "Unknown Department"
        );
    };

    // =================================================
    // GET DEPARTMENT CODE
    // =================================================

    const getDepartmentCode = (
        classItem
    ) => {
        if (
            classItem.department_code
        ) {
            return classItem.department_code;
        }

        if (
            classItem.departmentCode
        ) {
            return classItem.departmentCode;
        }

        const department =
            departments.find(
                (item) =>
                    Number(
                        item.department_id ||
                            item.id
                    ) ===
                    Number(
                        classItem.department_id
                    )
            );

        return (
            department?.department_code ||
            department?.code ||
            "-"
        );
    };

    // =================================================
    // CLASS DISPLAY NAME
    // =================================================

    const getClassDisplayName = (
        classItem
    ) => {
        const department =
            getDepartmentCode(
                classItem
            );

        const year =
            classItem.year ||
            "-";

        const section =
            classItem.section ||
            "-";

        return `${department} - Year ${year} - Section ${section}`;
    };

    // =================================================
    // FILTERED CLASSES
    // =================================================

    const filteredClasses =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return classes.filter(
                (classItem) => {
                    const departmentName =
                        String(
                            getDepartmentName(
                                classItem
                            )
                        ).toLowerCase();

                    const departmentCode =
                        String(
                            getDepartmentCode(
                                classItem
                            )
                        ).toLowerCase();

                    const section =
                        String(
                            classItem.section ||
                                ""
                        ).toLowerCase();

                    const year =
                        String(
                            classItem.year ||
                                ""
                        ).toLowerCase();

                    const matchesSearch =
                        !query ||
                        departmentName.includes(
                            query
                        ) ||
                        departmentCode.includes(
                            query
                        ) ||
                        section.includes(
                            query
                        ) ||
                        year.includes(
                            query
                        );

                    const matchesDepartment =
                        departmentFilter ===
                            "ALL" ||
                        String(
                            classItem.department_id
                        ) ===
                            String(
                                departmentFilter
                            );

                    const matchesYear =
                        yearFilter ===
                            "ALL" ||
                        String(
                            classItem.year
                        ) ===
                            String(
                                yearFilter
                            );

                    return (
                        matchesSearch &&
                        matchesDepartment &&
                        matchesYear
                    );
                }
            );
        }, [
            classes,
            search,
            departmentFilter,
            yearFilter,
            departments
        ]);

    // =================================================
    // YEAR OPTIONS
    // =================================================

    const yearOptions =
        useMemo(() => {
            const years =
                classes
                    .map(
                        (item) =>
                            Number(
                                item.year
                            )
                    )
                    .filter(
                        (year) =>
                            !Number.isNaN(
                                year
                            )
                    );

            return [
                ...new Set(years)
            ].sort(
                (a, b) => a - b
            );
        }, [classes]);

    // =================================================
    // STATISTICS
    // =================================================

    const statistics =
        useMemo(() => {
            const total =
                classes.length;

            const firstYear =
                classes.filter(
                    (item) =>
                        Number(
                            item.year
                        ) === 1
                ).length;

            const secondYear =
                classes.filter(
                    (item) =>
                        Number(
                            item.year
                        ) === 2
                ).length;

            const thirdYear =
                classes.filter(
                    (item) =>
                        Number(
                            item.year
                        ) === 3
                ).length;

            const fourthYear =
                classes.filter(
                    (item) =>
                        Number(
                            item.year
                        ) === 4
                ).length;

            return {
                total,
                firstYear,
                secondYear,
                thirdYear,
                fourthYear
            };
        }, [classes]);

    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">

            <div className="mx-auto max-w-7xl">

                {/* =====================================
                    HEADER
                ===================================== */}

                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                        <div className="flex items-center gap-3">

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
                                <FaGraduationCap
                                    size={22}
                                />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    Classes
                                </h1>

                                <p className="text-sm text-gray-500">
                                    Manage academic classes,
                                    years and sections.
                                </p>
                            </div>

                        </div>
                    </div>

                    <div className="flex gap-2">

                        <button
                            type="button"
                            onClick={() => {
                                loadClasses();
                                loadDepartments();
                            }}
                            disabled={
                                loading ||
                                loadingDepartments
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
                            onClick={handleAdd}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <FaPlus />

                            Add Class
                        </button>

                    </div>
                </div>

                {/* =====================================
                    ERROR
                ===================================== */}

                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

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
                ===================================== */}

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
                ===================================== */}

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    {/* TOTAL */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm text-gray-500">
                                    Total Classes
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-800">
                                    {statistics.total}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                <FaGraduationCap />
                            </div>

                        </div>
                    </div>

                    {/* FIRST YEAR */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm text-gray-500">
                                    Year 1
                                </p>

                                <p className="mt-1 text-2xl font-bold text-blue-600">
                                    {statistics.firstYear}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <FaBook />
                            </div>

                        </div>
                    </div>

                    {/* SECOND YEAR */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm text-gray-500">
                                    Year 2
                                </p>

                                <p className="mt-1 text-2xl font-bold text-purple-600">
                                    {statistics.secondYear}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                <FaBook />
                            </div>

                        </div>
                    </div>

                    {/* THIRD YEAR */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm text-gray-500">
                                    Year 3
                                </p>

                                <p className="mt-1 text-2xl font-bold text-orange-600">
                                    {statistics.thirdYear}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                <FaBook />
                            </div>

                        </div>
                    </div>

                    {/* FOURTH YEAR */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm text-gray-500">
                                    Year 4
                                </p>

                                <p className="mt-1 text-2xl font-bold text-green-600">
                                    {statistics.fourthYear}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                <FaBook />
                            </div>

                        </div>
                    </div>

                </div>

                {/* =====================================
                    FILTERS
                ===================================== */}

                <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FaFilter />
                        Filters
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

                        {/* SEARCH */}

                        <div className="relative md:col-span-2">

                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search department, year or section..."
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                        </div>

                        {/* DEPARTMENT */}

                        <select
                            value={
                                departmentFilter
                            }
                            onChange={(event) =>
                                setDepartmentFilter(
                                    event.target.value
                                )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="ALL">
                                All Departments
                            </option>

                            {departments.map(
                                (department) => (
                                    <option
                                        key={
                                            department.department_id ||
                                            department.id
                                        }
                                        value={
                                            department.department_id ||
                                            department.id
                                        }
                                    >
                                        {department.department_name ||
                                            department.name ||
                                            department.department_code ||
                                            department.code}
                                    </option>
                                )
                            )}
                        </select>

                        {/* YEAR */}

                        <select
                            value={yearFilter}
                            onChange={(event) =>
                                setYearFilter(
                                    event.target.value
                                )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="ALL">
                                All Years
                            </option>

                            {yearOptions.map(
                                (year) => (
                                    <option
                                        key={year}
                                        value={year}
                                    >
                                        Year {year}
                                    </option>
                                )
                            )}
                        </select>

                    </div>
                </div>

                {/* =====================================
                    TABLE
                ===================================== */}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">

                        <div>
                            <h2 className="font-semibold text-gray-800">
                                Class List
                            </h2>

                            <p className="text-sm text-gray-500">
                                Showing{" "}
                                {
                                    filteredClasses.length
                                }{" "}
                                of{" "}
                                {classes.length}{" "}
                                classes
                            </p>
                        </div>

                    </div>

                    {/* LOADING */}

                    {loading ? (
                        <div className="flex min-h-75 items-center justify-center">

                            <div className="text-center">

                                <FaSyncAlt className="mx-auto mb-3 animate-spin text-2xl text-indigo-600" />

                                <p className="text-sm text-gray-500">
                                    Loading classes...
                                </p>

                            </div>

                        </div>
                    ) : filteredClasses.length ===
                      0 ? (
                        <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">

                            <FaGraduationCap className="mb-4 text-4xl text-gray-300" />

                            <h3 className="text-lg font-semibold text-gray-700">
                                No classes found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-gray-500">
                                No classes match your current filters.
                            </p>

                            <button
                                type="button"
                                onClick={handleAdd}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                <FaPlus />
                                Create Class
                            </button>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="min-w-full divide-y divide-gray-200">

                                <thead className="bg-gray-50">

                                    <tr>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            #
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Class
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Department
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Year
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Section
                                        </th>

                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Actions
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-200 bg-white">

                                    {filteredClasses.map(
                                        (
                                            classItem,
                                            index
                                        ) => (
                                            <tr
                                                key={
                                                    classItem.class_id ||
                                                    classItem.id ||
                                                    index
                                                }
                                                className="transition hover:bg-gray-50"
                                            >

                                                {/* NUMBER */}

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                                                    {index +
                                                        1}
                                                </td>

                                                {/* CLASS */}

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                                            <FaGraduationCap />
                                                        </div>

                                                        <div>

                                                            <div className="font-semibold text-gray-800">
                                                                {
                                                                    getClassDisplayName(
                                                                        classItem
                                                                    )
                                                                }
                                                            </div>

                                                            <div className="text-xs text-gray-500">
                                                                Class ID:{" "}
                                                                {classItem.class_id ||
                                                                    classItem.id ||
                                                                    "-"}
                                                            </div>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* DEPARTMENT */}

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center gap-2">

                                                        <FaBuilding className="text-gray-400" />

                                                        <div>

                                                            <div className="text-sm font-medium text-gray-800">
                                                                {
                                                                    getDepartmentName(
                                                                        classItem
                                                                    )
                                                                }
                                                            </div>

                                                            <div className="text-xs text-gray-500">
                                                                {
                                                                    getDepartmentCode(
                                                                        classItem
                                                                    )
                                                                }
                                                            </div>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* YEAR */}

                                                <td className="whitespace-nowrap px-5 py-4">

                                                    <span className="rounded-md bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                                                        Year{" "}
                                                        {
                                                            classItem.year
                                                        }
                                                    </span>

                                                </td>

                                                {/* SECTION */}

                                                <td className="whitespace-nowrap px-5 py-4">

                                                    <span className="rounded-md bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                                                        {
                                                            classItem.section
                                                        }
                                                    </span>

                                                </td>

                                                {/* ACTIONS */}

                                                <td className="whitespace-nowrap px-5 py-4 text-right">

                                                    <div className="flex justify-end gap-2">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    classItem
                                                                )
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                                            title="Edit Class"
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    classItem
                                                                )
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                            title="Delete Class"
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

            {/* =========================================
                ADD / EDIT MODAL
            ========================================= */}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                        {/* MODAL HEADER */}

                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

                            <div>

                                <h2 className="text-lg font-bold text-gray-800">
                                    {editingClass
                                        ? "Edit Class"
                                        : "Add Class"}
                                </h2>

                                <p className="text-xs text-gray-500">
                                    Maintain academic class information.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleCloseModal
                                }
                                disabled={saving}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-5 p-6"
                        >

                            {/* DEPARTMENT */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Department
                                    <span className="text-red-500">
                                        {" "}
                                        *
                                    </span>
                                </label>

                                <div className="relative">

                                    <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <select
                                        name="department_id"
                                        value={
                                            form.department_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            loadingDepartments
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                                    >

                                        <option value="">
                                            {loadingDepartments
                                                ? "Loading departments..."
                                                : "Select Department"}
                                        </option>

                                        {departments.map(
                                            (
                                                department
                                            ) => (
                                                <option
                                                    key={
                                                        department.department_id ||
                                                        department.id
                                                    }
                                                    value={
                                                        department.department_id ||
                                                        department.id
                                                    }
                                                >
                                                    {department.department_name ||
                                                        department.name ||
                                                        department.department_code ||
                                                        department.code}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                            </div>

                            {/* YEAR */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Year
                                    <span className="text-red-500">
                                        {" "}
                                        *
                                    </span>
                                </label>

                                <div className="relative">

                                    <FaGraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <select
                                        name="year"
                                        value={
                                            form.year
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    >

                                        <option value="">
                                            Select Year
                                        </option>

                                        <option value="1">
                                            Year 1
                                        </option>

                                        <option value="2">
                                            Year 2
                                        </option>

                                        <option value="3">
                                            Year 3
                                        </option>

                                        <option value="4">
                                            Year 4
                                        </option>

                                    </select>

                                </div>

                            </div>

                            {/* SECTION */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Section
                                    <span className="text-red-500">
                                        {" "}
                                        *
                                    </span>
                                </label>

                                <div className="relative">

                                    <FaBook className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <input
                                        type="text"
                                        name="section"
                                        value={
                                            form.section
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: A"
                                        maxLength={
                                            20
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />

                                </div>

                                <p className="mt-1 text-xs text-gray-500">
                                    Example: A, B, C or
                                    Section A.
                                </p>

                            </div>

                            {/* ERROR */}

                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* BUTTONS */}

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

                                    {editingClass
                                        ? "Update Class"
                                        : "Save Class"}

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
// EXPORT
// =====================================================

export default AdminClasses;