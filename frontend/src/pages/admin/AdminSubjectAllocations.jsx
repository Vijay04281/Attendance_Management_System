import React, { useEffect, useMemo, useState } from "react";
import {
  FaBook,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUserTie,
  FaUsers,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaSyncAlt,
  FaGraduationCap,
} from "react-icons/fa";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL = "http://localhost:5000/api";

// =====================================================
// TOKEN
// =====================================================

const getToken = () => {
  return localStorage.getItem("token");
};

// =====================================================
// GENERIC API REQUEST
// =====================================================

const apiRequest = async (url, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed with status ${response.status}`
    );
  }

  return data;
};

// =====================================================
// EXTRACT ARRAY FROM API RESPONSE
// =====================================================

const extractArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.rows)) {
    return response.rows;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.allocations)) {
    return response.allocations;
  }

  if (Array.isArray(response?.subjects)) {
    return response.subjects;
  }

  if (Array.isArray(response?.staff)) {
    return response.staff;
  }

  if (Array.isArray(response?.classes)) {
    return response.classes;
  }

  return [];
};

// =====================================================
// NORMALIZE ALLOCATION
// =====================================================

const normalizeAllocation = (item) => {
  return {
    ...item,

    allocation_id:
      item.allocation_id ??
      item.subject_allocation_id ??
      item.id ??
      item.allocationId,

    staff_id:
      item.staff_id ??
      item.teacher_id ??
      item.staffId ??
      item.teacherId ??
      item.user_id,

    subject_id:
      item.subject_id ??
      item.subjectId,

    class_id:
      item.class_id ??
      item.classId,

    academic_year:
      item.academic_year ??
      item.academicYear ??
      "",

    semester:
      item.semester ??
      "",

    status:
      item.status ?? "active",

    staff_name:
      item.staff_name ??
      item.teacher_name ??
      item.staffName ??
      item.teacherName ??
      "",

    staff_code:
      item.staff_code ??
      item.staffCode ??
      "",

    subject_name:
      item.subject_name ??
      item.name ??
      item.subjectName ??
      "",

    subject_code:
      item.subject_code ??
      item.code ??
      item.subjectCode ??
      "",

    class_name:
      item.class_name ??
      item.className ??
      "",

    department_name:
      item.department_name ??
      item.departmentName ??
      "",

    department_code:
      item.department_code ??
      item.departmentCode ??
      "",
  };
};

// =====================================================
// NORMALIZE STAFF
// =====================================================

const normalizeStaff = (item) => {
  const firstName =
    item.first_name ??
    item.firstname ??
    item.firstName ??
    "";

  const lastName =
    item.last_name ??
    item.lastname ??
    item.lastName ??
    "";

  const fullName =
    item.full_name ??
    item.fullName ??
    item.name ??
    `${firstName} ${lastName}`.trim();

  return {
    ...item,

    staff_id:
      item.staff_id ??
      item.id ??
      item.user_id,

    staff_name: fullName || "Unknown Staff",

    staff_code:
      item.staff_code ??
      item.employee_id ??
      item.employee_code ??
      "",

    department_id:
      item.department_id ??
      null,

    department_name:
      item.department_name ??
      item.departmentName ??
      "",

    status:
      item.status ?? "active",
  };
};

// =====================================================
// NORMALIZE SUBJECT
// =====================================================

const normalizeSubject = (item) => {
  return {
    ...item,

    subject_id:
      item.subject_id ??
      item.id ??
      item.subjectId,

    subject_name:
      item.subject_name ??
      item.name ??
      item.subjectName ??
      "",

    subject_code:
      item.subject_code ??
      item.code ??
      item.subjectCode ??
      "",

    department_id:
      item.department_id ??
      null,

    department_name:
      item.department_name ??
      item.departmentName ??
      "",

    semester:
      item.semester ??
      "",

    status:
      item.status ?? "active",
  };
};

// =====================================================
// NORMALIZE CLASS
// =====================================================

const normalizeClass = (item) => {
  return {
    ...item,

    class_id:
      item.class_id ??
      item.id ??
      item.classId,

    department_id:
      item.department_id ??
      null,

    department_name:
      item.department_name ??
      item.departmentName ??
      "",

    department_code:
      item.department_code ??
      item.departmentCode ??
      "",

    year:
      item.year ?? "",

    section:
      item.section ?? "",

    status:
      item.status ?? "active",
  };
};

// =====================================================
// EMPTY FORM
// =====================================================

const emptyForm = {
  staff_id: "",
  subject_id: "",
  class_id: "",
  academic_year: "",
  semester: "",
  status: "active",
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const AdminSubjectAllocations = () => {
  // ===================================================
  // STATE
  // ===================================================

  const [allocations, setAllocations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // ===================================================
  // LOAD ALL DATA
  // ===================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        allocationResponse,
        staffResponse,
        subjectResponse,
        classResponse,
      ] = await Promise.all([
        apiRequest("/subject-allocations"),
        apiRequest("/staff"),
        apiRequest("/subjects"),
        apiRequest("/classes"),
      ]);

      const allocationData = extractArray(allocationResponse);
      const staffData = extractArray(staffResponse);
      const subjectData = extractArray(subjectResponse);
      const classData = extractArray(classResponse);

      const normalizedStaff = staffData
        .map(normalizeStaff)
        .filter((item) => {
          const status = String(item.status || "").toLowerCase();
          return !status || status === "active";
        });

      const normalizedSubjects = subjectData
        .map(normalizeSubject)
        .filter((item) => {
          const status = String(item.status || "").toLowerCase();
          return !status || status === "active";
        });

      const normalizedClasses = classData
        .map(normalizeClass)
        .filter((item) => {
          const status = String(item.status || "").toLowerCase();

          return (
            !status ||
            status === "active" ||
            status === "1" ||
            item.status === 1
          );
        });

      // -------------------------------------------------
      // Build lookup maps
      // -------------------------------------------------

      const staffMap = {};
      normalizedStaff.forEach((item) => {
        staffMap[item.staff_id] = item;
      });

      const subjectMap = {};
      normalizedSubjects.forEach((item) => {
        subjectMap[item.subject_id] = item;
      });

      const classMap = {};
      normalizedClasses.forEach((item) => {
        classMap[item.class_id] = item;
      });

      // -------------------------------------------------
      // Attach related information to allocations
      // -------------------------------------------------

      const normalizedAllocations = allocationData
        .map(normalizeAllocation)
        .map((allocation) => {
          const staffItem = staffMap[allocation.staff_id];
          const subjectItem = subjectMap[allocation.subject_id];
          const classItem = classMap[allocation.class_id];

          const staffName =
            allocation.staff_name ||
            staffItem?.staff_name ||
            "Unknown Staff";

          const subjectName =
            allocation.subject_name ||
            subjectItem?.subject_name ||
            "Unknown Subject";

          const subjectCode =
            allocation.subject_code ||
            subjectItem?.subject_code ||
            "";

          const className =
            allocation.class_name ||
            (classItem
              ? `${classItem.year || ""}${classItem.year ? " - " : ""}${
                  classItem.section || ""
                }`.trim()
              : "Unknown Class");

          return {
            ...allocation,

            staff_name: staffName,

            staff_code:
              allocation.staff_code ||
              staffItem?.staff_code ||
              "",

            subject_name: subjectName,

            subject_code: subjectCode,

            class_name: className,

            department_name:
              allocation.department_name ||
              classItem?.department_name ||
              subjectItem?.department_name ||
              "",

            department_code:
              allocation.department_code ||
              classItem?.department_code ||
              "",
          };
        });

      setStaff(normalizedStaff);
      setSubjects(normalizedSubjects);
      setClasses(normalizedClasses);
      setAllocations(normalizedAllocations);
    } catch (err) {
      console.error("Failed to load subject allocations:", err);

      setError(
        err.message ||
          "Unable to load subject allocation information."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadData();
  }, []);

  // ===================================================
  // AUTO CLEAR MESSAGES
  // ===================================================

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);

  // ===================================================
  // HANDLE FORM CHANGE
  // ===================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ===================================================
  // OPEN ADD MODAL
  // ===================================================

  const openAddModal = () => {
    setEditingAllocation(null);

    setForm({
      ...emptyForm,
    });

    setError("");
    setShowModal(true);
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (allocation) => {
    setEditingAllocation(allocation);

    setForm({
      staff_id:
        allocation.staff_id !== null &&
        allocation.staff_id !== undefined
          ? String(allocation.staff_id)
          : "",

      subject_id:
        allocation.subject_id !== null &&
        allocation.subject_id !== undefined
          ? String(allocation.subject_id)
          : "",

      class_id:
        allocation.class_id !== null &&
        allocation.class_id !== undefined
          ? String(allocation.class_id)
          : "",

      academic_year:
        allocation.academic_year !== null &&
        allocation.academic_year !== undefined
          ? String(allocation.academic_year)
          : "",

      semester:
        allocation.semester !== null &&
        allocation.semester !== undefined
          ? String(allocation.semester)
          : "",

      status:
        allocation.status || "active",
    });

    setError("");
    setShowModal(true);
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingAllocation(null);
    setForm(emptyForm);
  };

  // ===================================================
  // SUBMIT FORM
  // ===================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------------------------------
    // Validation
    // -------------------------------------------------

    if (!form.staff_id) {
      setError("Please select a staff member.");
      return;
    }

    if (!form.subject_id) {
      setError("Please select a subject.");
      return;
    }

    if (!form.class_id) {
      setError("Please select a class.");
      return;
    }

    if (!form.academic_year.trim()) {
      setError("Please enter the academic year.");
      return;
    }

    if (!form.semester) {
      setError("Please select the semester.");
      return;
    }

    // -------------------------------------------------
    // Payload
    // -------------------------------------------------

    const payload = {
      staff_id: Number(form.staff_id),
      subject_id: Number(form.subject_id),
      class_id: Number(form.class_id),
      academic_year: form.academic_year.trim(),
      semester: Number(form.semester),
      status: form.status,
    };

    try {
      setSaving(true);

      // ------------------------------------------------
      // UPDATE
      // ------------------------------------------------

      if (editingAllocation) {
        const allocationId =
          editingAllocation.allocation_id ??
          editingAllocation.subject_allocation_id ??
          editingAllocation.id;

        if (!allocationId) {
          throw new Error("Subject allocation ID is missing.");
        }

        await apiRequest(
          `/subject-allocations/${allocationId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        setSuccess("Subject allocation updated successfully.");
      }

      // ------------------------------------------------
      // CREATE
      // ------------------------------------------------

      else {
        await apiRequest("/subject-allocations", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Subject allocated successfully.");
      }

      closeModal();

      await loadData();
    } catch (err) {
      console.error("Failed to save subject allocation:", err);

      setError(
        err.message ||
          "Unable to save subject allocation."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE ALLOCATION
  // ===================================================

  const handleDelete = async (allocation) => {
    const allocationId =
      allocation.allocation_id ??
      allocation.subject_allocation_id ??
      allocation.id;

    if (!allocationId) {
      setError("Subject allocation ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove the subject allocation for ${
        allocation.staff_name || "this staff member"
      }?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await apiRequest(
        `/subject-allocations/${allocationId}`,
        {
          method: "DELETE",
        }
      );

      setSuccess("Subject allocation deleted successfully.");

      await loadData();
    } catch (err) {
      console.error("Failed to delete subject allocation:", err);

      setError(
        err.message ||
          "Unable to delete subject allocation."
      );
    }
  };

  // ===================================================
  // FILTER OPTIONS
  // ===================================================

  const academicYears = useMemo(() => {
    const years = allocations
      .map((item) => item.academic_year)
      .filter(
        (year) =>
          year !== null &&
          year !== undefined &&
          String(year).trim() !== ""
      )
      .map((year) => String(year));

    return [...new Set(years)].sort();
  }, [allocations]);

  // ===================================================
  // FILTERED ALLOCATIONS
  // ===================================================

  const filteredAllocations = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return allocations.filter((allocation) => {
      // -----------------------------------------------
      // Search
      // -----------------------------------------------

      const searchableText = [
        allocation.staff_name,
        allocation.staff_code,
        allocation.subject_name,
        allocation.subject_code,
        allocation.class_name,
        allocation.department_name,
        allocation.department_code,
        allocation.academic_year,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableText.includes(search);

      // -----------------------------------------------
      // Status
      // -----------------------------------------------

      const matchesStatus =
        statusFilter === "all" ||
        String(allocation.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      // -----------------------------------------------
      // Academic Year
      // -----------------------------------------------

      const matchesAcademicYear =
        academicYearFilter === "all" ||
        String(allocation.academic_year) ===
          String(academicYearFilter);

      // -----------------------------------------------
      // Semester
      // -----------------------------------------------

      const matchesSemester =
        semesterFilter === "all" ||
        String(allocation.semester) ===
          String(semesterFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAcademicYear &&
        matchesSemester
      );
    });
  }, [
    allocations,
    searchTerm,
    statusFilter,
    academicYearFilter,
    semesterFilter,
  ]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {
    const total = allocations.length;

    const active = allocations.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "active"
    ).length;

    const inactive = allocations.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "inactive"
    ).length;

    const uniqueStaff = new Set(
      allocations
        .map((item) => item.staff_id)
        .filter(
          (id) =>
            id !== null &&
            id !== undefined &&
            id !== ""
        )
    ).size;

    const uniqueSubjects = new Set(
      allocations
        .map((item) => item.subject_id)
        .filter(
          (id) =>
            id !== null &&
            id !== undefined &&
            id !== ""
        )
    ).size;

    const uniqueClasses = new Set(
      allocations
        .map((item) => item.class_id)
        .filter(
          (id) =>
            id !== null &&
            id !== undefined &&
            id !== ""
        )
    ).size;

    return {
      total,
      active,
      inactive,
      uniqueStaff,
      uniqueSubjects,
      uniqueClasses,
    };
  }, [allocations]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Subject Allocations
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Allocate subjects to staff members for specific classes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSyncAlt
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FaPlus />

            Allocate Subject
          </button>
        </div>
      </div>

      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <FaCheckCircle />

          <span>{success}</span>
        </div>
      )}

      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FaTimesCircle className="mt-0.5 shrink-0" />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {/* Total */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Allocations
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-800">
                {statistics.total}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <FaBook />
            </div>
          </div>
        </div>

        {/* Active */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {statistics.active}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <FaCheckCircle />
            </div>
          </div>
        </div>

        {/* Inactive */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Inactive
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {statistics.inactive}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <FaTimesCircle />
            </div>
          </div>
        </div>

        {/* Staff */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Staff
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-600">
                {statistics.uniqueStaff}
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
              <FaUserTie />
            </div>
          </div>
        </div>

        {/* Subjects */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Subjects
              </p>

              <p className="mt-2 text-2xl font-bold text-orange-600">
                {statistics.uniqueSubjects}
              </p>
            </div>

            <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
              <FaGraduationCap />
            </div>
          </div>
        </div>

        {/* Classes */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Classes
              </p>

              <p className="mt-2 text-2xl font-bold text-indigo-600">
                {statistics.uniqueClasses}
              </p>
            </div>

            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <FaUsers />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FaFilter />

          Filters
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          {/* Search */}

          <div className="relative lg:col-span-2">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search staff, subject, class..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Academic Year */}

          <select
            value={academicYearFilter}
            onChange={(event) =>
              setAcademicYearFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Academic Years</option>

            {academicYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Semester */}

          <select
            value={semesterFilter}
            onChange={(event) =>
              setSemesterFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Subject Allocation List
            </h2>

            <p className="text-sm text-gray-500">
              Showing {filteredAllocations.length} of{" "}
              {allocations.length} allocations
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-75 items-center justify-center">
            <div className="text-center">
              <FaSyncAlt className="mx-auto animate-spin text-3xl text-blue-600" />

              <p className="mt-3 text-sm text-gray-500">
                Loading subject allocations...
              </p>
            </div>
          </div>
        ) : filteredAllocations.length === 0 ? (
          <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-full bg-gray-100 p-5 text-gray-400">
              <FaBook className="text-3xl" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-700">
              No subject allocations found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              No allocation matches the current filters.
              Create a new allocation or change the filters.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <FaPlus />

              Allocate Subject
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    #
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Staff
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Subject
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Class
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Academic Year
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Semester
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredAllocations.map(
                  (allocation, index) => (
                    <tr
                      key={
                        allocation.allocation_id ??
                        allocation.subject_allocation_id ??
                        allocation.id ??
                        index
                      }
                      className="transition hover:bg-gray-50"
                    >
                      {/* Number */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      {/* Staff */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                            <FaUserTie />
                          </div>

                          <div>
                            <p className="font-medium text-gray-800">
                              {allocation.staff_name ||
                                "Unknown Staff"}
                            </p>

                            {allocation.staff_code && (
                              <p className="text-xs text-gray-500">
                                {allocation.staff_code}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subject */}

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {allocation.subject_name ||
                              "Unknown Subject"}
                          </p>

                          {allocation.subject_code && (
                            <p className="text-xs text-gray-500">
                              {allocation.subject_code}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Class */}

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {allocation.class_name ||
                              "Unknown Class"}
                          </p>

                          {allocation.department_name && (
                            <p className="text-xs text-gray-500">
                              {allocation.department_name}
                              {allocation.department_code
                                ? ` (${allocation.department_code})`
                                : ""}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Academic Year */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {allocation.academic_year || "-"}
                      </td>

                      {/* Semester */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {allocation.semester
                          ? `Semester ${allocation.semester}`
                          : "-"}
                      </td>

                      {/* Status */}

                      <td className="whitespace-nowrap px-5 py-4">
                        {String(
                          allocation.status || ""
                        ).toLowerCase() === "active" ? (
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
                              openEditModal(allocation)
                            }
                            title="Edit allocation"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(allocation)
                            }
                            title="Delete allocation"
                            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
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

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingAllocation
                    ? "Edit Subject Allocation"
                    : "Allocate Subject"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Assign a subject to a staff member and class.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Staff */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Staff Member
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="staff_id"
                    value={form.staff_id}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="">
                      Select Staff Member
                    </option>

                    {staff.map((item) => (
                      <option
                        key={item.staff_id}
                        value={item.staff_id}
                      >
                        {item.staff_name}
                        {item.staff_code
                          ? ` (${item.staff_code})`
                          : ""}
                        {item.department_name
                          ? ` - ${item.department_name}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Subject
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="subject_id"
                    value={form.subject_id}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="">
                      Select Subject
                    </option>

                    {subjects.map((item) => (
                      <option
                        key={item.subject_id}
                        value={item.subject_id}
                      >
                        {item.subject_name}
                        {item.subject_code
                          ? ` (${item.subject_code})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Class
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="class_id"
                    value={form.class_id}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="">
                      Select Class
                    </option>

                    {classes.map((item) => {
                      const classLabel = [
                        item.year
                          ? `Year ${item.year}`
                          : "",
                        item.section
                          ? `Section ${item.section}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" - ");

                      return (
                        <option
                          key={item.class_id}
                          value={item.class_id}
                        >
                          {classLabel ||
                            `Class ${item.class_id}`}
                          {item.department_code
                            ? ` - ${item.department_code}`
                            : item.department_name
                            ? ` - ${item.department_name}`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Academic Year */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Academic Year
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="academic_year"
                    value={form.academic_year}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Example: 2026-2027"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Semester */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Semester
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="">
                      Select Semester
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
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              {/* =================================================
                  MODAL FOOTER
              ================================================= */}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <FaSyncAlt className="animate-spin" />

                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />

                      {editingAllocation
                        ? "Update Allocation"
                        : "Allocate Subject"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubjectAllocations;