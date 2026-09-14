import React, { useEffect, useMemo, useState } from "react";
import {
  FaUserTie,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaUsers,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaBuilding,
} from "react-icons/fa";

// =====================================================
// CONFIGURATION
// =====================================================

const API_BASE_URL = "https://attendance-management-system-gpci.onrender.com/api";

// =====================================================
// HELPERS
// =====================================================

const getToken = () => {
  return localStorage.getItem("token");
};

// -----------------------------------------------------
// GET STAFF ID
// -----------------------------------------------------

const getStaffId = (staff) => {
  return (
    staff.staff_id ??
    staff.id ??
    staff.staffId
  );
};

// -----------------------------------------------------
// GET STAFF CODE
// -----------------------------------------------------

const getStaffCode = (staff) => {
  return (
    staff.staff_code ??
    staff.staffCode ??
    staff.code ??
    "-"
  );
};

// -----------------------------------------------------
// GET STAFF NAME
// -----------------------------------------------------

const getStaffName = (staff) => {
  if (staff.name) {
    return String(staff.name);
  }

  if (staff.full_name) {
    return String(staff.full_name);
  }

  const firstName =
    staff.first_name ??
    staff.firstName ??
    "";

  const lastName =
    staff.last_name ??
    staff.lastName ??
    "";

  const combined =
    `${firstName} ${lastName}`.trim();

  return (
    combined ||
    staff.staff_name ||
    "-"
  );
};

// -----------------------------------------------------
// GET USERNAME
// -----------------------------------------------------

const getUsername = (staff) => {
  return (
    staff.username ??
    staff.user_name ??
    staff.login_username ??
    "-"
  );
};

// -----------------------------------------------------
// GET EMAIL
// -----------------------------------------------------

const getEmail = (staff) => {
  return (
    staff.email ??
    staff.email_address ??
    "-"
  );
};

// -----------------------------------------------------
// GET PHONE
// -----------------------------------------------------

const getPhone = (staff) => {
  return (
    staff.phone ??
    staff.phone_number ??
    staff.mobile ??
    staff.mobile_number ??
    "-"
  );
};

// -----------------------------------------------------
// GET STATUS
// -----------------------------------------------------

const getStatus = (staff) => {
  if (
    staff.status === undefined ||
    staff.status === null ||
    staff.status === ""
  ) {
    return "active";
  }

  return String(
    staff.status
  ).toLowerCase();
};

// -----------------------------------------------------
// IS ACTIVE
// -----------------------------------------------------

const isActive = (staff) => {
  const status = getStatus(staff);

  return (
    status === "active" ||
    status === "1" ||
    status === "true" ||
    status === "enabled"
  );
};

// -----------------------------------------------------
// GET ROLE
// -----------------------------------------------------

const getRole = (staff) => {
  return (
    staff.role ??
    staff.user_role ??
    staff.staff_role ??
    staff.designation ??
    "-"
  );
};

// -----------------------------------------------------
// FORMAT ROLE
// -----------------------------------------------------

const formatRole = (role) => {
  if (!role || role === "-") {
    return "-";
  }

  return String(role)
    .toUpperCase()
    .replace(/_/g, " ");
};

// -----------------------------------------------------
// NORMALIZE ROLE
// -----------------------------------------------------

const normalizeRole = (role) => {
  const value = String(role || "")
    .trim()
    .toLowerCase();

  if (value === "hod") {
    return "HOD";
  }

  if (
    value === "teacher" ||
    value === "class_teacher"
  ) {
    return "TEACHER";
  }

  return "STAFF";
};

// -----------------------------------------------------
// GET DEPARTMENT ID
// -----------------------------------------------------

const getDepartmentId = (department) => {
  if (!department) {
    return null;
  }

  return (
    department.department_id ??
    department.departmentId ??
    department.id ??
    null
  );
};

// -----------------------------------------------------
// GET DEPARTMENT NAME
// -----------------------------------------------------

const getDepartmentName = (department) => {
  if (!department) {
    return "-";
  }

  if (typeof department === "string") {
    return department;
  }

  return (
    department.department_name ??
    department.departmentName ??
    department.name ??
    department.department ??
    "-"
  );
};

// -----------------------------------------------------
// GET DEPARTMENT CODE
// -----------------------------------------------------

const getDepartmentCode = (department) => {
  if (!department) {
    return "";
  }

  if (typeof department === "string") {
    return "";
  }

  return (
    department.department_code ??
    department.departmentCode ??
    department.code ??
    ""
  );
};

// -----------------------------------------------------
// GET STAFF DEPARTMENT ID
// -----------------------------------------------------

const getStaffDepartmentId = (staff) => {
  return (
    staff.department_id ??
    staff.departmentId ??
    staff.dept_id ??
    staff.department?.department_id ??
    staff.department?.departmentId ??
    staff.department?.id ??
    null
  );
};

// -----------------------------------------------------
// GET STAFF DEPARTMENT NAME
// -----------------------------------------------------

const getStaffDepartmentName = (staff) => {
  if (staff.department_name) {
    return staff.department_name;
  }

  if (staff.departmentName) {
    return staff.departmentName;
  }

  if (staff.department?.department_name) {
    return staff.department.department_name;
  }

  if (staff.department?.departmentName) {
    return staff.department.departmentName;
  }

  if (staff.department?.name) {
    return staff.department.name;
  }

  if (
    typeof staff.department === "string"
  ) {
    return staff.department;
  }

  return "-";
};

// -----------------------------------------------------
// EXTRACT ARRAY
// -----------------------------------------------------

const extractArray = (
  result,
  possibleKeys = []
) => {
  if (Array.isArray(result)) {
    return result;
  }

  if (
    !result ||
    typeof result !== "object"
  ) {
    return [];
  }

  for (const key of possibleKeys) {
    if (Array.isArray(result[key])) {
      return result[key];
    }
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (
    result.data &&
    Array.isArray(result.data.data)
  ) {
    return result.data.data;
  }

  return [];
};

// =====================================================
// API REQUEST
// =====================================================

const apiRequest = async (
  url,
  options = {}
) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${url}`,
    {
      ...options,
      headers,
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
        data.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

// =====================================================
// EMPTY FORM
// =====================================================

const emptyForm = {
  staff_code: "",
  username: "",
  password: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  department_id: "",
  role: "STAFF",
  designation: "",
  status: "active",
};

// =====================================================
// COMPONENT
// =====================================================

const AdminStaff = () => {
  // ---------------------------------------------------
  // STATE
  // ---------------------------------------------------

  const [staff, setStaff] = useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [departmentsLoading, setDepartmentsLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [departmentFilter, setDepartmentFilter] =
    useState("all");

  const [showModal, setShowModal] =
    useState(false);

  const [editingStaff, setEditingStaff] =
    useState(null);

  const [form, setForm] =
    useState({
      ...emptyForm,
    });

  // ===================================================
  // LOAD STAFF
  // ===================================================

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await apiRequest("/staff");

      const staffList =
        extractArray(response, [
          "staff",
          "staffs",
          "employees",
          "results",
        ]);

      setStaff(staffList);
    } catch (err) {
      console.error(
        "Load staff error:",
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

  // ===================================================
  // LOAD DEPARTMENTS
  // ===================================================

  const loadDepartments = async () => {
    try {
      setDepartmentsLoading(true);

      const response =
        await apiRequest("/departments");

      const departmentList =
        extractArray(response, [
          "departments",
          "department",
          "results",
        ]);

      setDepartments(
        departmentList
      );
    } catch (err) {
      console.error(
        "Load departments error:",
        err
      );

      setError(
        err.message ||
          "Failed to load departments"
      );

      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadStaff();
    loadDepartments();
  }, []);

  // ===================================================
  // SUCCESS MESSAGE TIMER
  // ===================================================

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () =>
      clearTimeout(timer);
  }, [success]);

  // ===================================================
  // FILTERED STAFF
  // ===================================================

  const filteredStaff = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return staff.filter((member) => {
      const name =
        getStaffName(member)
          .toLowerCase();

      const staffCode =
        String(
          getStaffCode(member)
        ).toLowerCase();

      const username =
        String(
          getUsername(member)
        ).toLowerCase();

      const email =
        String(
          getEmail(member)
        ).toLowerCase();

      const phone =
        String(
          getPhone(member)
        ).toLowerCase();

      const role =
        formatRole(
          getRole(member)
        ).toLowerCase();

      const department =
        getStaffDepartmentName(
          member
        ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        staffCode.includes(searchValue) ||
        username.includes(searchValue) ||
        email.includes(searchValue) ||
        phone.includes(searchValue) ||
        role.includes(searchValue) ||
        department.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        (
          statusFilter === "active" &&
          isActive(member)
        ) ||
        (
          statusFilter === "inactive" &&
          !isActive(member)
        );

      const staffRole =
        String(
          getRole(member)
        ).toLowerCase();

      const matchesRole =
        roleFilter === "all" ||
        staffRole ===
          roleFilter.toLowerCase();

      const staffDepartmentId =
        getStaffDepartmentId(
          member
        );

      const matchesDepartment =
        departmentFilter === "all" ||
        String(
          staffDepartmentId
        ) ===
          String(
            departmentFilter
          );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRole &&
        matchesDepartment
      );
    });
  }, [
    staff,
    search,
    statusFilter,
    roleFilter,
    departmentFilter,
  ]);

  // ===================================================
  // AVAILABLE ROLES
  // ===================================================

  const availableRoles = useMemo(() => {
    const roles = staff
      .map((member) =>
        getRole(member)
      )
      .filter(
        (role) =>
          role &&
          role !== "-" &&
          String(role).trim() !== ""
      )
      .map((role) =>
        String(role)
      );

    return [
      ...new Set(roles),
    ];
  }, [staff]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {
    const total = staff.length;

    const active =
      staff.filter((member) =>
        isActive(member)
      ).length;

    const inactive =
      total - active;

    const teachers =
      staff.filter((member) => {
        const role =
          String(
            getRole(member)
          ).toLowerCase();

        return (
          role.includes("teacher") ||
          role.includes("faculty")
        );
      }).length;

    return {
      total,
      active,
      inactive,
      teachers,
    };
  }, [staff]);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ===================================================
  // OPEN ADD MODAL
  // ===================================================

  const openAddModal = () => {
    setEditingStaff(null);

    setForm({
      ...emptyForm,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (member) => {
    setEditingStaff(member);

    const fullName =
      getStaffName(member);

    const nameParts =
      fullName
        .trim()
        .split(/\s+/);

    const firstName =
      member.first_name ??
      member.firstName ??
      nameParts[0] ??
      "";

    const lastName =
      member.last_name ??
      member.lastName ??
      nameParts
        .slice(1)
        .join(" ");

    const departmentId =
      getStaffDepartmentId(
        member
      );

    setForm({
      staff_code:
        member.staff_code ??
        member.staffCode ??
        "",

      username:
        member.username ??
        member.user_name ??
        "",

      password: "",

      first_name:
        firstName,

      last_name:
        lastName,

      email:
        member.email ??
        "",

      phone:
        member.phone ??
        member.phone_number ??
        member.mobile ??
        "",

      department_id:
        departmentId
          ? String(departmentId)
          : "",

      role:
        normalizeRole(
          member.role
        ),

      designation:
        member.designation ??
        "",

      status:
        isActive(member)
          ? "active"
          : "inactive",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingStaff(null);

    setForm({
      ...emptyForm,
    });
  };

  // ===================================================
  // SAVE STAFF
  // ===================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------------------------------
    // CLEAN VALUES
    // -------------------------------------------------

    const staffCode =
      form.staff_code.trim();

    const username =
      form.username.trim();

    const firstName =
      form.first_name.trim();

    const lastName =
      form.last_name.trim();

    const email =
      form.email.trim();

    const phone =
      form.phone.trim();

    const designation =
      form.designation.trim();

    const departmentId =
      String(
        form.department_id || ""
      ).trim();

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!staffCode) {
      setError(
        "Staff code is required."
      );
      return;
    }

    if (!username) {
      setError(
        "Username is required."
      );
      return;
    }

    if (!firstName) {
      setError(
        "First name is required."
      );
      return;
    }

    if (!email) {
      setError(
        "Email is required."
      );
      return;
    }

    if (!departmentId) {
      setError(
        "Please select a department."
      );
      return;
    }

    if (
      !editingStaff &&
      !form.password.trim()
    ) {
      setError(
        "Password is required when creating staff."
      );
      return;
    }

    // -------------------------------------------------
    // FULL NAME
    // -------------------------------------------------

    const fullName =
      `${firstName} ${lastName}`.trim();

    if (!fullName) {
      setError(
        "Staff name is required."
      );
      return;
    }

    // -------------------------------------------------
    // ROLE
    // -------------------------------------------------

    const backendRole =
      normalizeRole(
        form.role
      );

    // -------------------------------------------------
    // PAYLOAD
    // -------------------------------------------------

    const payload = {
      staff_code: staffCode,

      name: fullName,

      email: email || null,

      phone: phone || null,

      role: backendRole,

      department_id:
        Number(departmentId),

      username,

      designation:
        designation || null,

      status:
        form.status,
    };

    // -------------------------------------------------
    // PASSWORD
    // -------------------------------------------------

    if (form.password.trim()) {
      payload.password =
        form.password.trim();
    }

    try {
      setSaving(true);

      console.log(
        "Saving staff payload:",
        payload
      );

      // ------------------------------------------------
      // UPDATE
      // ------------------------------------------------

      if (editingStaff) {
        const id =
          getStaffId(
            editingStaff
          );

        if (!id) {
          throw new Error(
            "Unable to determine staff ID."
          );
        }

        await apiRequest(
          `/staff/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(
              payload
            ),
          }
        );

        setSuccess(
          "Staff member updated successfully."
        );
      }

      // ------------------------------------------------
      // CREATE
      // ------------------------------------------------

      else {
        await apiRequest(
          "/staff",
          {
            method: "POST",
            body: JSON.stringify(
              payload
            ),
          }
        );

        setSuccess(
          "Staff member created successfully."
        );
      }

      // ------------------------------------------------
      // CLOSE MODAL
      // ------------------------------------------------

      setShowModal(false);
      setEditingStaff(null);

      setForm({
        ...emptyForm,
      });

      // ------------------------------------------------
      // RELOAD
      // ------------------------------------------------

      await loadStaff();
    } catch (err) {
      console.error(
        "Save staff error:",
        err
      );

      setError(
        err.message ||
          "Failed to save staff member."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE STAFF
  // ===================================================

  const handleDelete = async (member) => {
    const id =
      getStaffId(member);

    if (!id) {
      setError(
        "Unable to determine staff ID."
      );
      return;
    }

    const name =
      getStaffName(member);

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiRequest(
        `/staff/${id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Staff member deleted successfully."
      );

      await loadStaff();
    } catch (err) {
      console.error(
        "Delete staff error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete staff member."
      );
    }
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    setError("");
    setSuccess("");

    await Promise.all([
      loadStaff(),
      loadDepartments(),
    ]);

    setSuccess(
      "Staff list refreshed successfully."
    );
  };

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
          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FaUserTie size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Staff Management
              </h1>

              <p className="text-sm text-gray-500">
                Manage teaching and staff accounts
              </p>
            </div>

          </div>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={handleRefresh}
            disabled={
              loading ||
              departmentsLoading
            }
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSyncAlt
              className={
                loading ||
                departmentsLoading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <FaPlus />

            Add Staff
          </button>

        </div>
      </div>

      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          <FaCheckCircle />

          <span>
            {success}
          </span>

        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <FaTimesCircle />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="ml-auto rounded p-1 hover:bg-red-100"
          >
            <FaTimes />
          </button>

        </div>
      )}

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Staff
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-800">
                {statistics.total}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FaUsers />
            </div>

          </div>

        </div>

        {/* ACTIVE */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Active Staff
              </p>

              <p className="mt-1 text-2xl font-bold text-green-600">
                {statistics.active}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <FaCheckCircle />
            </div>

          </div>

        </div>

        {/* INACTIVE */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Inactive Staff
              </p>

              <p className="mt-1 text-2xl font-bold text-red-600">
                {statistics.inactive}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <FaTimesCircle />
            </div>

          </div>

        </div>

        {/* TEACHERS */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Teaching Staff
              </p>

              <p className="mt-1 text-2xl font-bold text-purple-600">
                {statistics.teachers}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <FaUserTie />
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FaFilter />

          Filters
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

          {/* SEARCH */}

          <div className="relative">

            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search staff..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* ROLE */}

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >

            <option value="all">
              All Roles
            </option>

            {availableRoles.map(
              (role) => (
                <option
                  key={role}
                  value={role}
                >
                  {formatRole(role)}
                </option>
              )
            )}

          </select>

          {/* DEPARTMENT FILTER */}

          <select
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >

            <option value="all">
              All Departments
            </option>

            {departments.map(
              (department) => {
                const id =
                  getDepartmentId(
                    department
                  );

                return (
                  <option
                    key={id}
                    value={id}
                  >
                    {getDepartmentName(
                      department
                    )}
                  </option>
                );
              }
            )}

          </select>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >

            <option value="all">
              All Status
            </option>

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
          STAFF TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="font-semibold text-gray-800">
              Staff List
            </h2>

            <p className="text-xs text-gray-500">
              Showing{" "}
              {filteredStaff.length}{" "}
              of{" "}
              {staff.length}{" "}
              staff members
            </p>

          </div>

        </div>

        {loading ? (

          <div className="flex min-h-75 items-center justify-center">

            <div className="text-center">

              <FaSyncAlt className="mx-auto mb-3 animate-spin text-2xl text-blue-600" />

              <p className="text-sm text-gray-500">
                Loading staff...
              </p>

            </div>

          </div>

        ) : filteredStaff.length === 0 ? (

          <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <FaUserTie size={25} />
            </div>

            <h3 className="font-semibold text-gray-700">
              No staff found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or add a new staff member.
            </p>

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
                    Username
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Contact
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Department
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Role
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Designation
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">

                {filteredStaff.map(
                  (member, index) => {

                    const id =
                      getStaffId(member);

                    const name =
                      getStaffName(member);

                    const staffCode =
                      getStaffCode(member);

                    const username =
                      getUsername(member);

                    const email =
                      getEmail(member);

                    const phone =
                      getPhone(member);

                    const department =
                      getStaffDepartmentName(
                        member
                      );

                    const departmentId =
                      getStaffDepartmentId(
                        member
                      );

                    const role =
                      getRole(member);

                    const designation =
                      member.designation ??
                      "-";

                    const active =
                      isActive(member);

                    return (

                      <tr
                        key={
                          id ?? index
                        }
                        className="transition hover:bg-gray-50"
                      >

                        {/* NUMBER */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>

                        {/* STAFF */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                              {name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <div className="font-medium text-gray-800">
                                {name}
                              </div>

                              {staffCode !==
                                "-" && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <FaIdCard />

                                  {staffCode}
                                </div>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* USERNAME */}

                        <td className="whitespace-nowrap px-5 py-4">

                          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {username}
                          </span>

                        </td>

                        {/* CONTACT */}

                        <td className="px-5 py-4">

                          <div className="space-y-1 text-sm">

                            <div className="flex items-center gap-2 text-gray-600">

                              <FaEnvelope className="text-gray-400" />

                              <span>
                                {email}
                              </span>

                            </div>

                            {phone !==
                              "-" && (
                              <div className="flex items-center gap-2 text-gray-500">

                                <FaPhone className="text-gray-400" />

                                <span>
                                  {phone}
                                </span>

                              </div>
                            )}

                          </div>

                        </td>

                        {/* DEPARTMENT */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                              <FaBuilding />
                            </div>

                            <div>

                              <div className="text-sm font-medium text-gray-700">
                                {department}
                              </div>

                              {departmentId && (
                                <div className="text-xs text-gray-400">
                                  ID:{" "}
                                  {departmentId}
                                </div>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* ROLE */}

                        <td className="whitespace-nowrap px-5 py-4">

                          <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                            {formatRole(
                              role
                            )}
                          </span>

                        </td>

                        {/* DESIGNATION */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {designation}
                        </td>

                        {/* STATUS */}

                        <td className="whitespace-nowrap px-5 py-4">

                          {active ? (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">

                              <FaCheckCircle />

                              Active

                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">

                              <FaTimesCircle />

                              Inactive

                            </span>

                          )}

                        </td>

                        {/* ACTIONS */}

                        <td className="whitespace-nowrap px-5 py-4 text-right">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  member
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                              title="Edit staff"
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  member
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                              title="Delete staff"
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

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

              <div>

                <h2 className="text-lg font-bold text-gray-800">

                  {editingStaff
                    ? "Edit Staff"
                    : "Add Staff"}

                </h2>

                <p className="mt-1 text-xs text-gray-500">

                  {editingStaff
                    ? "Update staff account information"
                    : "Create a new staff account"}

                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <FaTimes />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* STAFF CODE */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">

                  Staff Code

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>

                <div className="relative">

                  <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    name="staff_code"
                    value={
                      form.staff_code
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="STF001"
                    required
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <p className="mt-1 text-xs text-gray-400">
                  Unique staff identification code
                </p>

              </div>

              {/* NAME */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">

                    First Name

                    <span className="ml-1 text-red-500">
                      *
                    </span>

                  </label>

                  <input
                    type="text"
                    name="first_name"
                    value={
                      form.first_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="First name"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="last_name"
                    value={
                      form.last_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Last name"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

              {/* USERNAME / PASSWORD */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">

                    Username

                    <span className="ml-1 text-red-500">
                      *
                    </span>

                  </label>

                  <input
                    type="text"
                    name="username"
                    value={
                      form.username
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Login username"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">

                    {editingStaff
                      ? "New Password"
                      : "Password"}

                    {!editingStaff && (
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    )}

                  </label>

                  <input
                    type="password"
                    name="password"
                    value={
                      form.password
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={
                      editingStaff
                        ? "Leave blank to keep current"
                        : "Password"
                    }
                    required={
                      !editingStaff
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

              {/* EMAIL / PHONE */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">

                    Email

                    <span className="ml-1 text-red-500">
                      *
                    </span>

                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="staff@example.com"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Phone
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Phone number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

              {/* =================================================
                  DEPARTMENT
              ================================================= */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">

                  Department

                  <span className="ml-1 text-red-500">
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
                    required
                    disabled={
                      departmentsLoading
                    }
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >

                    <option value="">
                      {departmentsLoading
                        ? "Loading departments..."
                        : "Select Department"}
                    </option>

                    {departments.map(
                      (department) => {
                        const id =
                          getDepartmentId(
                            department
                          );

                        const name =
                          getDepartmentName(
                            department
                          );

                        const code =
                          getDepartmentCode(
                            department
                          );

                        return (
                          <option
                            key={id}
                            value={id}
                          >
                            {name}
                            {code
                              ? ` (${code})`
                              : ""}
                          </option>
                        );
                      }
                    )}

                  </select>

                </div>

                {!departmentsLoading &&
                  departments.length ===
                    0 && (
                    <p className="mt-1 text-xs text-red-500">
                      No departments found. Please create a department first.
                    </p>
                  )}

                {departments.length > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    Select the department where this staff member belongs.
                  </p>
                )}

              </div>

              {/* ROLE / DESIGNATION */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Role
                  </label>

                  <select
                    name="role"
                    value={
                      form.role
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="STAFF">
                      Staff
                    </option>

                    <option value="TEACHER">
                      Teacher
                    </option>

                    <option value="HOD">
                      HOD
                    </option>

                  </select>

                  <p className="mt-1 text-xs text-gray-400">
                    Class Teacher uses Teacher role
                  </p>

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Designation
                  </label>

                  <input
                    type="text"
                    name="designation"
                    value={
                      form.designation
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Assistant Professor"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

              {/* STATUS */}

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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    departmentsLoading ||
                    departments.length === 0
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <FaSyncAlt className="animate-spin" />

                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave />

                      {editingStaff
                        ? "Update Staff"
                        : "Create Staff"}
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

export default AdminStaff;