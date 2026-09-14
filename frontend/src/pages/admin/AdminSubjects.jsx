import React, { useEffect, useMemo, useState } from "react";
import {
  FaBook,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTrash,
  FaTimes,
  FaSave,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaLayerGroup,
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

const getSubjectId = (subject) => {
  return (
    subject.subject_id ??
    subject.id ??
    subject.subjectId
  );
};

const getSubjectCode = (subject) => {
  return (
    subject.subject_code ??
    subject.code ??
    subject.subjectCode ??
    ""
  );
};

const getSubjectName = (subject) => {
  return (
    subject.subject_name ??
    subject.name ??
    subject.subjectName ??
    ""
  );
};

const getStatus = (subject) => {
  if (
    subject.status === undefined ||
    subject.status === null ||
    subject.status === ""
  ) {
    return "active";
  }

  return String(subject.status).toLowerCase();
};

const isActive = (subject) => {
  const status = getStatus(subject);

  return (
    status === "active" ||
    status === "1" ||
    status === "true" ||
    status === "enabled"
  );
};

const extractArray = (result, possibleKeys = []) => {
  if (Array.isArray(result)) {
    return result;
  }

  if (!result || typeof result !== "object") {
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

  if (result.data && Array.isArray(result.data.data)) {
    return result.data.data;
  }

  return [];
};

// =====================================================
// API REQUEST
// =====================================================

const apiRequest = async (url, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  let data;

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
  subject_code: "",
  subject_name: "",
  credits: "",
  year: "",
  semester: "",
  status: "active",
};

// =====================================================
// COMPONENT
// =====================================================

const AdminSubjects = () => {
  // ---------------------------------------------------
  // STATE
  // ---------------------------------------------------

  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // ---------------------------------------------------
  // LOAD SUBJECTS
  // ---------------------------------------------------

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/subjects");

      const subjectList = extractArray(response, [
        "subjects",
        "subject",
        "results",
      ]);

      setSubjects(subjectList);
    } catch (err) {
      console.error("Load subjects error:", err);
      setError(err.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // LOAD DEPARTMENTS
  // ---------------------------------------------------

  const loadDepartments = async () => {
    try {
      const response = await apiRequest("/departments");

      const departmentList = extractArray(response, [
        "departments",
        "department",
        "results",
      ]);

      setDepartments(departmentList);
    } catch (err) {
      console.error("Load departments error:", err);

      // Department loading should not break subject page.
      setDepartments([]);
    }
  };

  // ---------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------

  useEffect(() => {
    loadSubjects();
    loadDepartments();
  }, []);

  // ---------------------------------------------------
  // CLEAR MESSAGES
  // ---------------------------------------------------

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);

  // ---------------------------------------------------
  // DEPARTMENT NAME
  // ---------------------------------------------------

  const getDepartmentName = (subject) => {
    const departmentId =
      subject.department_id ??
      subject.departmentId ??
      subject.department?.department_id ??
      subject.department?.id;

    if (!departmentId) {
      return (
        subject.department_name ||
        subject.department?.department_name ||
        subject.department?.name ||
        "-"
      );
    }

    const department = departments.find(
      (item) =>
        String(item.department_id ?? item.id) === String(departmentId)
    );

    if (department) {
      return (
        department.department_name ??
        department.name ??
        department.department_code ??
        "-"
      );
    }

    return (
      subject.department_name ||
      subject.department?.department_name ||
      "-"
    );
  };

  // ---------------------------------------------------
  // FILTERED SUBJECTS
  // ---------------------------------------------------

  const filteredSubjects = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      const code = getSubjectCode(subject).toLowerCase();
      const name = getSubjectName(subject).toLowerCase();
      const department = getDepartmentName(subject).toLowerCase();

      const year = String(
        subject.year ??
          subject.study_year ??
          subject.academic_year ??
          ""
      );

      const status = getStatus(subject);

      const matchesSearch =
        !searchValue ||
        code.includes(searchValue) ||
        name.includes(searchValue) ||
        department.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive(subject)) ||
        (statusFilter === "inactive" && !isActive(subject));

      const subjectDepartmentId =
        subject.department_id ??
        subject.departmentId ??
        subject.department?.department_id ??
        subject.department?.id;

      const matchesDepartment =
        departmentFilter === "all" ||
        String(subjectDepartmentId) === String(departmentFilter);

      const matchesYear =
        yearFilter === "all" ||
        year === String(yearFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment &&
        matchesYear
      );
    });
  }, [
    subjects,
    search,
    statusFilter,
    departmentFilter,
    yearFilter,
    departments,
  ]);

  // ---------------------------------------------------
  // STATISTICS
  // ---------------------------------------------------

  const statistics = useMemo(() => {
    const total = subjects.length;

    const active = subjects.filter((subject) =>
      isActive(subject)
    ).length;

    const inactive = total - active;

    const uniqueDepartments = new Set(
      subjects
        .map(
          (subject) =>
            subject.department_id ??
            subject.departmentId ??
            subject.department?.department_id ??
            subject.department?.id
        )
        .filter(Boolean)
    ).size;

    return {
      total,
      active,
      inactive,
      departments: uniqueDepartments,
    };
  }, [subjects]);

  // ---------------------------------------------------
  // FORM HANDLERS
  // ---------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ---------------------------------------------------
  // OPEN ADD MODAL
  // ---------------------------------------------------

  const openAddModal = () => {
    setEditingSubject(null);

    setForm({
      ...emptyForm,
    });

    setError("");
    setShowModal(true);
  };

  // ---------------------------------------------------
  // OPEN EDIT MODAL
  // ---------------------------------------------------

  const openEditModal = (subject) => {
    setEditingSubject(subject);

    setForm({
      subject_code: getSubjectCode(subject),
      subject_name: getSubjectName(subject),
      credits:
        subject.credits ??
        subject.credit ??
        subject.credit_hours ??
        "",
      year:
        subject.year ??
        subject.study_year ??
        subject.academic_year ??
        "",
      semester:
        subject.semester ??
        subject.sem ??
        "",
      status: isActive(subject) ? "active" : "inactive",
      department_id:
        subject.department_id ??
        subject.departmentId ??
        subject.department?.department_id ??
        "",
    });

    setError("");
    setShowModal(true);
  };

  // ---------------------------------------------------
  // CLOSE MODAL
  // ---------------------------------------------------

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingSubject(null);
    setForm(emptyForm);
  };

  // ---------------------------------------------------
  // SAVE SUBJECT
  // ---------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const subjectCode = form.subject_code.trim();
    const subjectName = form.subject_name.trim();

    if (!subjectCode) {
      setError("Subject code is required.");
      return;
    }

    if (!subjectName) {
      setError("Subject name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        subject_code: subjectCode,
        subject_name: subjectName,
        status: form.status,
      };

      // Add optional fields only when entered.
      if (form.department_id !== "") {
        payload.department_id = Number(form.department_id);
      }

      if (form.credits !== "") {
        payload.credits = Number(form.credits);
      }

      if (form.year !== "") {
        payload.year = Number(form.year);
      }

      if (form.semester !== "") {
        payload.semester = Number(form.semester);
      }

      if (editingSubject) {
        const id = getSubjectId(editingSubject);

        if (!id) {
          throw new Error("Unable to determine subject ID.");
        }

        await apiRequest(`/subjects/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setSuccess("Subject updated successfully.");
      } else {
        await apiRequest("/subjects", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Subject created successfully.");
      }

      closeModal();
      await loadSubjects();
    } catch (err) {
      console.error("Save subject error:", err);
      setError(err.message || "Failed to save subject.");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------
  // DELETE SUBJECT
  // ---------------------------------------------------

  const handleDelete = async (subject) => {
    const id = getSubjectId(subject);

    if (!id) {
      setError("Unable to determine subject ID.");
      return;
    }

    const code = getSubjectCode(subject);
    const name = getSubjectName(subject);

    const confirmed = window.confirm(
      `Are you sure you want to delete ${code} - ${name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await apiRequest(`/subjects/${id}`, {
        method: "DELETE",
      });

      setSuccess("Subject deleted successfully.");

      await loadSubjects();
    } catch (err) {
      console.error("Delete subject error:", err);
      setError(err.message || "Failed to delete subject.");
    }
  };

  // ---------------------------------------------------
  // REFRESH
  // ---------------------------------------------------

  const handleRefresh = async () => {
    setError("");
    setSuccess("");

    await Promise.all([
      loadSubjects(),
      loadDepartments(),
    ]);

    setSuccess("Subjects refreshed successfully.");
  };

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <FaBook size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Subjects
              </h1>

              <p className="text-sm text-gray-500">
                Manage subjects and academic subject details
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSyncAlt
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <FaPlus />

            Add Subject
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
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FaTimesCircle />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
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
        {/* Total */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Subjects
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-800">
                {statistics.total}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <FaBook />
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active
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

        {/* Inactive */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Inactive
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

        {/* Departments */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Departments
              </p>

              <p className="mt-1 text-2xl font-bold text-purple-600">
                {statistics.departments}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <FaLayerGroup />
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search subject..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Department */}
          <select
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">
              All Departments
            </option>

            {departments.map((department) => {
              const id =
                department.department_id ??
                department.id;

              const name =
                department.department_name ??
                department.name ??
                department.department_code ??
                `Department ${id}`;

              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>

          {/* Year */}
          <select
            value={yearFilter}
            onChange={(event) =>
              setYearFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">
              All Years
            </option>

            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
          SUBJECT TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">
              Subject List
            </h2>

            <p className="text-xs text-gray-500">
              Showing {filteredSubjects.length} of{" "}
              {subjects.length} subjects
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-75 items-center justify-center">
            <div className="text-center">
              <FaSyncAlt className="mx-auto mb-3 animate-spin text-2xl text-indigo-600" />

              <p className="text-sm text-gray-500">
                Loading subjects...
              </p>
            </div>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <FaBook size={25} />
            </div>

            <h3 className="font-semibold text-gray-700">
              No subjects found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or add a new subject.
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
                    Subject Code
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Subject Name
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Department
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Year
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Semester
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Credits
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
                {filteredSubjects.map((subject, index) => {
                  const id = getSubjectId(subject);

                  const code = getSubjectCode(subject);

                  const name = getSubjectName(subject);

                  const department = getDepartmentName(subject);

                  const year =
                    subject.year ??
                    subject.study_year ??
                    subject.academic_year ??
                    "-";

                  const semester =
                    subject.semester ??
                    subject.sem ??
                    "-";

                  const credits =
                    subject.credits ??
                    subject.credit ??
                    subject.credit_hours ??
                    "-";

                  const active = isActive(subject);

                  return (
                    <tr
                      key={id ?? index}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {index + 1}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {code || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-800">
                          {name || "-"}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {department}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {year}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {semester}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {credits}
                      </td>

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

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(subject)
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                            title="Edit subject"
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(subject)
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                            title="Delete subject"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editingSubject
                    ? "Edit Subject"
                    : "Add Subject"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {editingSubject
                    ? "Update subject information"
                    : "Create a new subject"}
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

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* Subject Code */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Subject Code
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="subject_code"
                  value={form.subject_code}
                  onChange={handleChange}
                  placeholder="Example: CS101"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Subject Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Subject Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="subject_name"
                  value={form.subject_name}
                  onChange={handleChange}
                  placeholder="Example: Database Management Systems"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Department */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Department
                </label>

                <select
                  name="department_id"
                  value={form.department_id || ""}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map((department) => {
                    const id =
                      department.department_id ??
                      department.id;

                    const name =
                      department.department_name ??
                      department.name ??
                      department.department_code ??
                      `Department ${id}`;

                    const code =
                      department.department_code;

                    return (
                      <option key={id} value={id}>
                        {name}
                        {code ? ` (${code})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Year / Semester */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Year
                  </label>

                  <select
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Semester
                  </label>

                  <select
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
              </div>

              {/* Credits / Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Credits
                  </label>

                  <input
                    type="number"
                    name="credits"
                    value={form.credits}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    placeholder="Example: 4"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <FaSyncAlt className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave />

                      {editingSubject
                        ? "Update Subject"
                        : "Create Subject"}
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

export default AdminSubjects;