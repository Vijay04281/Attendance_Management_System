import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaChalkboardTeacher,
    FaEdit,
    FaPlus,
    FaSearch,
    FaTrash,
    FaSyncAlt,
    FaSchool,
    FaCalendarAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaFilter,
    FaTimes
} from "react-icons/fa";

// =====================================================
// API CONFIG
// =====================================================

const API_BASE_URL = "https://attendance-management-system-gpci.onrender.com/api";

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getToken = () => {
    return localStorage.getItem("token");
};

const getArrayFromResponse = (response, possibleKeys = []) => {
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

function AdminClassTeacherAssignments() {
    // =================================================
    // STATE
    // =================================================

    const [assignments, setAssignments] = useState([]);
    const [staff, setStaff] = useState([]);
    const [classes, setClasses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [academicYearFilter, setAcademicYearFilter] =
        useState("ALL");

    const [showModal, setShowModal] = useState(false);
    const [editingAssignment, setEditingAssignment] =
        useState(null);

    const [form, setForm] = useState({
        teacher_user_id: "",
        class_id: "",
        academic_year: "",
        semester: "",
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
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
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
    // LOAD DATA
    // =================================================

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [
                assignmentResponse,
                staffResponse,
                classResponse
            ] = await Promise.all([
                apiRequest("/class-teacher-assignments"),
                apiRequest("/staff"),
                apiRequest("/classes")
            ]);

            const assignmentData =
                getArrayFromResponse(
                    assignmentResponse,
                    [
                        "assignments",
                        "classTeacherAssignments",
                        "data"
                    ]
                );

            const staffData =
                getArrayFromResponse(
                    staffResponse,
                    [
                        "staff",
                        "data"
                    ]
                );

            const classData =
                getArrayFromResponse(
                    classResponse,
                    [
                        "classes",
                        "data"
                    ]
                );

            setAssignments(assignmentData);
            setStaff(staffData);
            setClasses(classData);
        } catch (err) {
            console.error(
                "Class Teacher Assignment Load Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to load class teacher assignments."
            );
        } finally {
            setLoading(false);
        }
    }, [apiRequest]);

    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {
        loadData();
    }, [loadData]);

    // =================================================
    // RESET FORM
    // =================================================

    const resetForm = () => {
        setForm({
            teacher_user_id: "",
            class_id: "",
            academic_year: "",
            semester: "",
            status: "ACTIVE"
        });

        setEditingAssignment(null);
    };

    // =================================================
    // ADD
    // =================================================

    const handleAdd = () => {
        resetForm();

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    // =================================================
    // EDIT
    // =================================================

    const handleEdit = (assignment) => {
        setEditingAssignment(assignment);

        setForm({
            teacher_user_id:
                assignment.teacher_user_id
                    ? String(
                          assignment.teacher_user_id
                      )
                    : "",

            class_id:
                assignment.class_id
                    ? String(
                          assignment.class_id
                      )
                    : "",

            academic_year:
                assignment.academic_year || "",

            semester:
                assignment.semester !== null &&
                assignment.semester !== undefined
                    ? String(
                          assignment.semester
                      )
                    : "",

            status:
                assignment.status || "ACTIVE"
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

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // =================================================
    // SUBMIT
    // =================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!form.teacher_user_id) {
            setError(
                "Please select a class teacher."
            );
            return;
        }

        if (!form.class_id) {
            setError(
                "Please select a class."
            );
            return;
        }

        if (!form.academic_year.trim()) {
            setError(
                "Please enter the academic year."
            );
            return;
        }

        setSaving(true);

        try {
            const payload = {
                teacher_user_id:
                    Number(
                        form.teacher_user_id
                    ),

                class_id:
                    Number(
                        form.class_id
                    ),

                academic_year:
                    form.academic_year.trim(),

                semester:
                    form.semester.trim()
                        ? Number(
                              form.semester
                          )
                        : null,

                status:
                    form.status
            };

            // -----------------------------------------
            // UPDATE
            // -----------------------------------------

            if (editingAssignment) {
                await apiRequest(
                    `/class-teacher-assignments/${editingAssignment.assignment_id}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

                setSuccess(
                    "Class teacher assignment updated successfully."
                );
            }

            // -----------------------------------------
            // CREATE
            // -----------------------------------------

            else {
                await apiRequest(
                    "/class-teacher-assignments",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

                setSuccess(
                    "Class teacher assigned successfully."
                );
            }

            setShowModal(false);

            resetForm();

            await loadData();
        } catch (err) {
            console.error(
                "Class Teacher Assignment Save Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to save class teacher assignment."
            );
        } finally {
            setSaving(false);
        }
    };

    // =================================================
    // DELETE
    // =================================================

    const handleDelete = async (assignment) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this class teacher assignment?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await apiRequest(
                `/class-teacher-assignments/${assignment.assignment_id}`,
                {
                    method: "DELETE"
                }
            );

            setSuccess(
                "Class teacher assignment deleted successfully."
            );

            await loadData();
        } catch (err) {
            console.error(
                "Class Teacher Assignment Delete Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to delete class teacher assignment."
            );
        }
    };

    // =================================================
    // GET STAFF
    // =================================================

    const getStaff = (teacherUserId) => {
        return staff.find(
            (item) =>
                Number(
                    item.user_id
                ) ===
                Number(
                    teacherUserId
                )
        );
    };

    // =================================================
    // GET STAFF NAME
    // =================================================

    const getStaffName = (
        teacherUserId
    ) => {
        const teacher =
            getStaff(
                teacherUserId
            );

        if (!teacher) {
            return `User ID: ${teacherUserId}`;
        }

        return (
            teacher.name ||
            teacher.staff_name ||
            teacher.full_name ||
            teacher.staff_code ||
            `User ID: ${teacherUserId}`
        );
    };

    // =================================================
    // GET STAFF CODE
    // =================================================

    const getStaffCode = (
        teacherUserId
    ) => {
        const teacher =
            getStaff(
                teacherUserId
            );

        if (!teacher) {
            return "-";
        }

        return (
            teacher.staff_code ||
            teacher.staffCode ||
            "-"
        );
    };

    // =================================================
    // GET CLASS
    // =================================================

    const getClassInfo = (
        classId
    ) => {
        const classItem =
            classes.find(
                (item) =>
                    Number(
                        item.class_id
                    ) ===
                    Number(
                        classId
                    )
            );

        if (!classItem) {
            return {
                name:
                    `Class ID: ${classId}`,
                department: "-",
                year: "-",
                section: "-"
            };
        }

        const className =
            `${classItem.year || ""} ${
                classItem.section || ""
            }`.trim();

        return {
            name:
                className ||
                `Class ID: ${classId}`,

            department:
                classItem.department_name ||
                classItem.department ||
                classItem.department_code ||
                "-",

            year:
                classItem.year ||
                "-",

            section:
                classItem.section ||
                "-"
        };
    };

    // =================================================
    // ACADEMIC YEARS
    // =================================================

    const academicYears =
        useMemo(() => {
            const years =
                assignments
                    .map(
                        (item) =>
                            item.academic_year
                    )
                    .filter(Boolean);

            return [
                ...new Set(years)
            ];
        }, [assignments]);

    // =================================================
    // FILTER ASSIGNMENTS
    // =================================================

    const filteredAssignments =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return assignments.filter(
                (assignment) => {
                    const teacherName =
                        getStaffName(
                            assignment.teacher_user_id
                        ).toLowerCase();

                    const teacherCode =
                        getStaffCode(
                            assignment.teacher_user_id
                        ).toLowerCase();

                    const classInfo =
                        getClassInfo(
                            assignment.class_id
                        );

                    const className =
                        classInfo.name
                            .toLowerCase();

                    const department =
                        classInfo.department
                            .toLowerCase();

                    const academicYear =
                        String(
                            assignment.academic_year ||
                                ""
                        ).toLowerCase();

                    const matchesSearch =
                        !query ||
                        teacherName.includes(
                            query
                        ) ||
                        teacherCode.includes(
                            query
                        ) ||
                        className.includes(
                            query
                        ) ||
                        department.includes(
                            query
                        ) ||
                        academicYear.includes(
                            query
                        );

                    const assignmentStatus =
                        String(
                            assignment.status ||
                                "ACTIVE"
                        ).toUpperCase();

                    const matchesStatus =
                        statusFilter ===
                            "ALL" ||
                        assignmentStatus ===
                            statusFilter;

                    const matchesAcademicYear =
                        academicYearFilter ===
                            "ALL" ||
                        String(
                            assignment.academic_year ||
                                ""
                        ) ===
                            academicYearFilter;

                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesAcademicYear
                    );
                }
            );
        }, [
            assignments,
            search,
            statusFilter,
            academicYearFilter,
            staff,
            classes
        ]);

    // =================================================
    // STATISTICS
    // =================================================

    const statistics =
        useMemo(() => {
            const total =
                assignments.length;

            const active =
                assignments.filter(
                    (item) =>
                        String(
                            item.status ||
                                "ACTIVE"
                        ).toUpperCase() ===
                        "ACTIVE"
                ).length;

            const inactive =
                assignments.filter(
                    (item) =>
                        String(
                            item.status ||
                                ""
                        ).toUpperCase() ===
                        "INACTIVE"
                ).length;

            const uniqueClasses =
                new Set(
                    assignments.map(
                        (item) =>
                            item.class_id
                    )
                ).size;

            return {
                total,
                active,
                inactive,
                uniqueClasses
            };
        }, [assignments]);

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
                                <FaChalkboardTeacher
                                    size={22}
                                />
                            </div>

                            <div>

                                <h1 className="text-2xl font-bold text-gray-800">
                                    Class Teacher Assignments
                                </h1>

                                <p className="text-sm text-gray-500">
                                    Assign teachers to classes
                                    and maintain class teacher
                                    records.
                                </p>

                            </div>

                        </div>
                    </div>

                    <div className="flex gap-2">

                        <button
                            type="button"
                            onClick={
                                loadData
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

                            Assign Class Teacher
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

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* Total */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-gray-500">
                                    Total Assignments
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-800">
                                    {
                                        statistics.total
                                    }
                                </p>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                <FaChalkboardTeacher />
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

                    {/* Classes */}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-gray-500">
                                    Classes Covered
                                </p>

                                <p className="mt-1 text-2xl font-bold text-blue-600">
                                    {
                                        statistics.uniqueClasses
                                    }
                                </p>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <FaSchool />
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

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

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
                                placeholder="Search teacher, staff code, class..."
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

                        {/* Academic Year */}

                        <select
                            value={
                                academicYearFilter
                            }
                            onChange={(e) =>
                                setAcademicYearFilter(
                                    e.target.value
                                )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >

                            <option value="ALL">
                                All Academic Years
                            </option>

                            {academicYears.map(
                                (year) => (
                                    <option
                                        key={
                                            year
                                        }
                                        value={
                                            year
                                        }
                                    >
                                        {
                                            year
                                        }
                                    </option>
                                )
                            )}

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
                                Assignment List
                            </h2>

                            <p className="text-sm text-gray-500">

                                Showing{" "}

                                {
                                    filteredAssignments.length
                                }

                                {" "}of{" "}

                                {
                                    assignments.length
                                }

                                {" "}assignments

                            </p>

                        </div>

                    </div>

                    {/* Loading */}

                    {loading ? (
                        <div className="flex min-h-75 items-center justify-center">

                            <div className="text-center">

                                <FaSyncAlt className="mx-auto mb-3 animate-spin text-2xl text-indigo-600" />

                                <p className="text-sm text-gray-500">
                                    Loading class teacher
                                    assignments...
                                </p>

                            </div>

                        </div>
                    ) : filteredAssignments.length === 0 ? (

                        /* Empty */

                        <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">

                            <FaChalkboardTeacher className="mb-4 text-4xl text-gray-300" />

                            <h3 className="text-lg font-semibold text-gray-700">
                                No assignments found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-gray-500">
                                No class teacher assignments
                                match your current filters.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleAdd
                                }
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                <FaPlus />

                                Create Assignment
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
                                            Class Teacher
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Class
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Academic Year
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Semester
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

                                    {filteredAssignments.map(
                                        (
                                            assignment,
                                            index
                                        ) => {

                                            const classInfo =
                                                getClassInfo(
                                                    assignment.class_id
                                                );

                                            const isActive =
                                                String(
                                                    assignment.status ||
                                                        "ACTIVE"
                                                ).toUpperCase() ===
                                                "ACTIVE";

                                            return (
                                                <tr
                                                    key={
                                                        assignment.assignment_id
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

                                                    {/* Teacher */}

                                                    <td className="whitespace-nowrap px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">

                                                                {getStaffName(
                                                                    assignment.teacher_user_id
                                                                )
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}

                                                            </div>

                                                            <div>

                                                                <div className="font-medium text-gray-800">

                                                                    {
                                                                        getStaffName(
                                                                            assignment.teacher_user_id
                                                                        )
                                                                    }

                                                                </div>

                                                                <div className="text-xs text-gray-500">

                                                                    {
                                                                        getStaffCode(
                                                                            assignment.teacher_user_id
                                                                        )
                                                                    }

                                                                </div>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* Class */}

                                                    <td className="px-5 py-4">

                                                        <div className="font-medium text-gray-800">

                                                            {
                                                                classInfo.name
                                                            }

                                                        </div>

                                                        <div className="text-xs text-gray-500">

                                                            {
                                                                classInfo.department
                                                            }

                                                        </div>

                                                    </td>

                                                    {/* Academic Year */}

                                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">

                                                        <div className="flex items-center gap-2">

                                                            <FaCalendarAlt className="text-gray-400" />

                                                            {
                                                                assignment.academic_year ||
                                                                "-"
                                                            }

                                                        </div>

                                                    </td>

                                                    {/* Semester */}

                                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">

                                                        {
                                                            assignment.semester ||
                                                            "All"
                                                        }

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
                                                                        assignment
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
                                                                    handleDelete(
                                                                        assignment
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

                                    {editingAssignment
                                        ? "Edit Class Teacher Assignment"
                                        : "Assign Class Teacher"}

                                </h2>

                                <p className="text-xs text-gray-500">
                                    Maintain class teacher
                                    allocation.
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

                        {/* Modal Form */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-5 p-6"
                        >

                            {/* Teacher */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">

                                    Class Teacher

                                    <span className="text-red-500">
                                        {" "}*
                                    </span>

                                </label>

                                <div className="relative">

                                    <FaChalkboardTeacher className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <select
                                        name="teacher_user_id"
                                        value={
                                            form.teacher_user_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    >

                                        <option value="">
                                            Select Class Teacher
                                        </option>

                                        {staff
                                            .filter(
                                                (
                                                    teacher
                                                ) =>
                                                    teacher.user_id
                                            )
                                            .map(
                                                (
                                                    teacher
                                                ) => (

                                                    <option
                                                        key={
                                                            teacher.staff_id ||
                                                            teacher.user_id
                                                        }
                                                        value={
                                                            teacher.user_id
                                                        }
                                                    >

                                                        {
                                                            teacher.name ||
                                                            teacher.staff_name ||
                                                            teacher.full_name ||
                                                            teacher.staff_code ||
                                                            `User ${teacher.user_id}`
                                                        }

                                                        {" - "}

                                                        {
                                                            teacher.staff_code ||
                                                            ""
                                                        }

                                                    </option>

                                                )
                                            )}

                                    </select>

                                </div>

                                <p className="mt-1 text-xs text-gray-500">
                                    Only staff records with a
                                    valid user ID are available.
                                </p>

                            </div>

                            {/* Class */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">

                                    Class

                                    <span className="text-red-500">
                                        {" "}*
                                    </span>

                                </label>

                                <div className="relative">

                                    <FaSchool className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <select
                                        name="class_id"
                                        value={
                                            form.class_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    >

                                        <option value="">
                                            Select Class
                                        </option>

                                        {classes.map(
                                            (
                                                classItem
                                            ) => (

                                                <option
                                                    key={
                                                        classItem.class_id
                                                    }
                                                    value={
                                                        classItem.class_id
                                                    }
                                                >

                                                    {
                                                        classItem.year ||
                                                        ""
                                                    }

                                                    {" "}

                                                    {
                                                        classItem.section ||
                                                        ""
                                                    }

                                                    {classItem.department_name
                                                        ? ` - ${classItem.department_name}`
                                                        : classItem.department
                                                        ? ` - ${classItem.department}`
                                                        : classItem.department_code
                                                        ? ` - ${classItem.department_code}`
                                                        : ""}

                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>

                            </div>

                            {/* Academic Year */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">

                                    Academic Year

                                    <span className="text-red-500">
                                        {" "}*
                                    </span>

                                </label>

                                <div className="relative">

                                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                                    <input
                                        type="text"
                                        name="academic_year"
                                        value={
                                            form.academic_year
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: 2026-2027"
                                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />

                                </div>

                            </div>

                            {/* Semester */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Semester
                                </label>

                                <select
                                    name="semester"
                                    value={
                                        form.semester
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                >

                                    <option value="">
                                        All Semesters
                                    </option>

                                    <option value="1">
                                        Semester 1
                                    </option>

                                    <option value="2">
                                        Semester 2
                                    </option>

                                    <option value="3">
                                        Semester 3
                                    </option>

                                    <option value="4">
                                        Semester 4
                                    </option>

                                    <option value="5">
                                        Semester 5
                                    </option>

                                    <option value="6">
                                        Semester 6
                                    </option>

                                    <option value="7">
                                        Semester 7
                                    </option>

                                    <option value="8">
                                        Semester 8
                                    </option>

                                </select>

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

                                    {saving && (
                                        <FaSyncAlt className="animate-spin" />
                                    )}

                                    {editingAssignment
                                        ? "Update Assignment"
                                        : "Assign Teacher"}

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

export default AdminClassTeacherAssignments;