import React, { useEffect, useMemo, useState } from "react";
import {
  FaUserGraduate,
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
// STUDENT ID
// =====================================================

const getStudentId = (student) => {
  return student.student_id ?? student.id ?? student.studentId;
};

// =====================================================
// STUDENT NAME
// =====================================================

const getStudentName = (student) => {
  if (student.name) {
    return String(student.name);
  }

  if (student.full_name) {
    return String(student.full_name);
  }

  const firstName =
    student.first_name ??
    student.firstName ??
    "";

  const lastName =
    student.last_name ??
    student.lastName ??
    "";

  const combined = `${firstName} ${lastName}`.trim();

  return (
    combined ||
    student.student_name ||
    "-"
  );
};

// =====================================================
// REGISTER NUMBER
// =====================================================

const getRegisterNumber = (student) => {
  return String(
    student.register_number ??
      student.reg_no ??
      student.registration_number ??
      student.registerNo ??
      student.roll_number ??
      "-"
  );
};

// =====================================================
// EMAIL
// =====================================================

const getEmail = (student) => {
  return (
    student.email ??
    student.email_address ??
    "-"
  );
};

// =====================================================
// STATUS
// =====================================================

const getStatus = (student) => {
  if (
    student.status === undefined ||
    student.status === null ||
    student.status === ""
  ) {
    return "active";
  }

  return String(student.status).toLowerCase();
};

const isActive = (student) => {
  const status = getStatus(student);

  return (
    status === "active" ||
    status === "1" ||
    status === "true" ||
    status === "enabled"
  );
};

// =====================================================
// CLASS ID
// =====================================================

const getClassId = (student) => {
  return (
    student.class_id ??
    student.classId ??
    student.class?.class_id ??
    student.class?.id ??
    null
  );
};

// =====================================================
// DEPARTMENT NAME
// IMPORTANT:
// Backend /api/classes returns:
// department_name
// =====================================================

const getDepartmentName = (item) => {
  if (!item) {
    return "";
  }

  // Direct value from classController
  if (
    item.department_name !== undefined &&
    item.department_name !== null &&
    String(item.department_name).trim() !== ""
  ) {
    return String(item.department_name).trim();
  }

  // Other possible API formats
  if (
    item.department?.department_name !== undefined &&
    item.department?.department_name !== null
  ) {
    return String(
      item.department.department_name
    ).trim();
  }

  if (
    item.department?.name !== undefined &&
    item.department?.name !== null
  ) {
    return String(
      item.department.name
    ).trim();
  }

  if (
    item.department_code !== undefined &&
    item.department_code !== null &&
    String(item.department_code).trim() !== ""
  ) {
    return String(item.department_code).trim();
  }

  if (
    item.department !== undefined &&
    item.department !== null &&
    typeof item.department !== "object"
  ) {
    return String(item.department).trim();
  }

  return "";
};

// =====================================================
// YEAR
// =====================================================

const getYear = (item) => {
  if (!item) {
    return "";
  }

  return (
    item.year ??
    item.study_year ??
    item.class_year ??
    ""
  );
};

// =====================================================
// SECTION
// =====================================================

const getSection = (item) => {
  if (!item) {
    return "";
  }

  return (
    item.section ??
    item.class_section ??
    ""
  );
};

// =====================================================
// CLASS NAME
// =====================================================

const getClassName = (student, classes) => {
  const classId = getClassId(student);

  // ---------------------------------------------------
  // Find by class ID
  // ---------------------------------------------------

  if (
    classId !== null &&
    classId !== undefined &&
    classId !== ""
  ) {
    const foundClass = classes.find(
      (item) =>
        String(
          item.class_id ?? item.id
        ) === String(classId)
    );

    if (foundClass) {
      return getClassLabel(foundClass);
    }
  }

  // ---------------------------------------------------
  // Student saved values
  // ---------------------------------------------------

  const department =
    student.department ??
    student.department_name ??
    "";

  const year =
    student.year ??
    student.study_year ??
    "";

  const section =
    student.section ??
    student.class_section ??
    "";

  const parts = [
    department,
    year ? `Year ${year}` : "",
    section ? `Section ${section}` : "",
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" - ");
  }

  return (
    student.class_name ??
    student.class?.class_name ??
    student.class?.name ??
    "-"
  );
};

// =====================================================
// CLASS LABEL
// =====================================================

const getClassLabel = (classItem) => {
  if (!classItem) {
    return "Unknown Class";
  }

  const department = getDepartmentName(classItem);

  const year = getYear(classItem);

  const section = getSection(classItem);

  const parts = [];

  // Department
  if (department) {
    parts.push(department);
  } else if (
    classItem.department_id !== undefined &&
    classItem.department_id !== null
  ) {
    parts.push(
      `Department ${classItem.department_id}`
    );
  }

  // Year
  if (
    year !== undefined &&
    year !== null &&
    String(year).trim() !== ""
  ) {
    parts.push(`Year ${year}`);
  }

  // Section
  if (
    section !== undefined &&
    section !== null &&
    String(section).trim() !== ""
  ) {
    parts.push(
      `Section ${String(section).toUpperCase()}`
    );
  }

  if (parts.length > 0) {
    return parts.join(" - ");
  }

  return `Class ${
    classItem.class_id ?? classItem.id ?? "-"
  }`;
};

// =====================================================
// EXTRACT ARRAY
// =====================================================

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
// SPLIT NAME
// =====================================================

const splitName = (name) => {
  const cleanName =
    String(name || "").trim();

  if (!cleanName) {
    return {
      first_name: "",
      last_name: "",
    };
  }

  const parts =
    cleanName.split(/\s+/);

  if (parts.length === 1) {
    return {
      first_name: parts[0],
      last_name: "",
    };
  }

  return {
    first_name: parts[0],
    last_name:
      parts.slice(1).join(" "),
  };
};

// =====================================================
// EMPTY FORM
// =====================================================

const emptyForm = {
  register_number: "",
  first_name: "",
  last_name: "",
  email: "",
  class_id: "",
  status: "active",

  username: "",
  password: "",
};

// =====================================================
// COMPONENT
// =====================================================

const AdminStudents = () => {
  // ===================================================
  // STATE
  // ===================================================

  const [students, setStudents] =
    useState([]);

  const [classes, setClasses] =
    useState([]);

  const [loading, setLoading] =
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

  const [classFilter, setClassFilter] =
    useState("all");

  const [showModal, setShowModal] =
    useState(false);

  const [editingStudent, setEditingStudent] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  // ===================================================
  // LOAD STUDENTS
  // ===================================================

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await apiRequest("/students");

      const studentList =
        extractArray(response, [
          "students",
          "student",
          "results",
        ]);

      setStudents(studentList);
    } catch (err) {
      console.error(
        "Load students error:",
        err
      );

      setError(
        err.message ||
          "Failed to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // LOAD CLASSES
  // ===================================================

  const loadClasses = async () => {
    try {
      const response =
        await apiRequest("/classes");

      console.log(
        "================================="
      );

      console.log(
        "FULL /api/classes RESPONSE:",
        response
      );

      const classList =
        extractArray(response, [
          "classes",
          "class",
          "results",
        ]);

      console.log(
        "CLASSES:",
        classList
      );

      // Check department_name
      classList.forEach(
        (classItem, index) => {
          console.log(
            `Class ${index + 1}:`,
            {
              class_id:
                classItem.class_id,
              department_id:
                classItem.department_id,
              department_name:
                classItem.department_name,
              year:
                classItem.year,
              section:
                classItem.section,
              label:
                getClassLabel(
                  classItem
                ),
            }
          );
        }
      );

      console.log(
        "================================="
      );

      if (
        !Array.isArray(classList)
      ) {
        throw new Error(
          "Invalid classes response from server."
        );
      }

      setClasses(classList);

      // If backend returns no classes
      if (classList.length === 0) {
        setError(
          "No classes found. Please create a class first."
        );
      }
    } catch (err) {
      console.error(
        "Load classes error:",
        err
      );

      setClasses([]);

      setError(
        `Failed to load classes: ${
          err.message ||
          "Unknown error"
        }`
      );
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  // ===================================================
  // SUCCESS TIMER
  // ===================================================

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer =
      setTimeout(() => {
        setSuccess("");
      }, 3000);

    return () =>
      clearTimeout(timer);
  }, [success]);

  // ===================================================
  // FILTERED STUDENTS
  // ===================================================

  const filteredStudents =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return students.filter(
        (student) => {
          const name =
            getStudentName(
              student
            ).toLowerCase();

          const registerNumber =
            getRegisterNumber(
              student
            ).toLowerCase();

          const email =
            getEmail(
              student
            ).toLowerCase();

          const className =
            getClassName(
              student,
              classes
            ).toLowerCase();

          const matchesSearch =
            !searchValue ||
            name.includes(
              searchValue
            ) ||
            registerNumber.includes(
              searchValue
            ) ||
            email.includes(
              searchValue
            ) ||
            className.includes(
              searchValue
            );

          const matchesStatus =
            statusFilter ===
              "all" ||
            (statusFilter ===
              "active" &&
              isActive(student)) ||
            (statusFilter ===
              "inactive" &&
              !isActive(student));

          const matchesClass =
            classFilter ===
              "all" ||
            String(
              getClassId(student)
            ) ===
              String(classFilter);

          return (
            matchesSearch &&
            matchesStatus &&
            matchesClass
          );
        }
      );
    }, [
      students,
      classes,
      search,
      statusFilter,
      classFilter,
    ]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics =
    useMemo(() => {
      const total =
        students.length;

      const active =
        students.filter(
          (student) =>
            isActive(student)
        ).length;

      const inactive =
        total - active;

      return {
        total,
        active,
        inactive,
      };
    }, [students]);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // ===================================================
  // OPEN ADD MODAL
  // ===================================================

  const openAddModal = () => {
    setEditingStudent(null);

    setForm({
      ...emptyForm,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ===================================================
  // FIND CLASS FOR STUDENT
  // ===================================================

  const findClassForStudent = (
    student
  ) => {
    const studentClassId =
      getClassId(student);

    // Direct class ID
    if (
      studentClassId !== null &&
      studentClassId !== undefined &&
      studentClassId !== ""
    ) {
      const directMatch =
        classes.find(
          (classItem) =>
            String(
              classItem.class_id ??
                classItem.id
            ) ===
            String(
              studentClassId
            )
        );

      if (directMatch) {
        return directMatch;
      }
    }

    // Department + year + section
    const studentDepartment =
      String(
        student.department ??
          student.department_name ??
          ""
      )
        .trim()
        .toLowerCase();

    const studentYear =
      String(
        student.year ??
          student.study_year ??
          ""
      ).trim();

    const studentSection =
      String(
        student.section ??
          student.class_section ??
          ""
      )
        .trim()
        .toLowerCase();

    if (
      !studentYear ||
      !studentSection
    ) {
      return null;
    }

    const match =
      classes.find(
        (classItem) => {
          const classDepartment =
            String(
              getDepartmentName(
                classItem
              )
            )
              .trim()
              .toLowerCase();

          const classYear =
            String(
              getYear(
                classItem
              )
            ).trim();

          const classSection =
            String(
              getSection(
                classItem
              )
            )
              .trim()
              .toLowerCase();

          const departmentMatches =
            !studentDepartment ||
            !classDepartment ||
            studentDepartment ===
              classDepartment;

          return (
            departmentMatches &&
            classYear ===
              studentYear &&
            classSection ===
              studentSection
          );
        }
      );

    return match || null;
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (
    student
  ) => {
    const name =
      getStudentName(student);

    const {
      first_name,
      last_name,
    } = splitName(name);

    const matchedClass =
      findClassForStudent(
        student
      );

    setEditingStudent(
      student
    );

    setForm({
      register_number:
        student.register_number ??
        student.reg_no ??
        student.registration_number ??
        "",

      first_name,

      last_name,

      email:
        student.email ?? "",

      class_id:
        matchedClass
          ? matchedClass.class_id ??
            matchedClass.id
          : "",

      status:
        isActive(student)
          ? "active"
          : "inactive",

      username:
        student.username ?? "",

      password: "",
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

    setEditingStudent(null);

    setForm({
      ...emptyForm,
    });
  };

  // ===================================================
  // GET SELECTED CLASS
  // ===================================================

  const getSelectedClass =
    () => {
      if (
        form.class_id === ""
      ) {
        return null;
      }

      return (
        classes.find(
          (classItem) =>
            String(
              classItem.class_id ??
                classItem.id
            ) ===
            String(
              form.class_id
            )
        ) || null
      );
    };

  // ===================================================
  // SAVE STUDENT
  // ===================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      const registerNumber =
        form.register_number.trim();

      const firstName =
        form.first_name.trim();

      const lastName =
        form.last_name.trim();

      // Validation
      if (!registerNumber) {
        setError(
          "Register number is required."
        );
        return;
      }

      if (!firstName) {
        setError(
          "First name is required."
        );
        return;
      }

      const fullName =
  `${firstName} ${lastName}`.trim();

if (!editingStudent && !form.username.trim()) {
  setError("Username is required.");
  return;
}

if (!editingStudent && !form.password) {
  setError("Password is required.");
  return;
}

if (!fullName) {
  setError(
    "Student name is required."
  );
  return;
}

      // Selected class
      const selectedClass =
        getSelectedClass();

      if (!selectedClass) {
        setError(
          "Please select a class."
        );
        return;
      }

      const classId =
        selectedClass.class_id ??
        selectedClass.id;

      if (!classId) {
        setError(
          "Selected class does not have a valid class ID."
        );
        return;
      }

      // Class values
      const department =
        getDepartmentName(
          selectedClass
        ) || null;

      const year =
        getYear(
          selectedClass
        ) || null;

      const section =
        getSection(
          selectedClass
        ) || null;

      // ------------------------------------------------
      // PAYLOAD
      // ------------------------------------------------

      const payload = {
        register_number:
          registerNumber,

        name:
          fullName,

        email:
          form.email.trim() ||
          null,

        class_id:
          Number(classId),

        department,

        year,

        section,
          username:
            form.username.trim(),

          password:
            form.password,
      };

      console.log(
        "================================="
      );

      console.log(
        "SAVING STUDENT"
      );

      console.log(
        "Payload:",
        payload
      );

      console.log(
        "Selected Class:",
        selectedClass
      );

      console.log(
        "Department:",
        department
      );

      console.log(
        "Year:",
        year
      );

      console.log(
        "Section:",
        section
      );

      console.log(
        "Class ID:",
        classId
      );

      console.log(
        "================================="
      );

      try {
        setSaving(true);

        // UPDATE
        if (editingStudent) {
          const id =
            getStudentId(
              editingStudent
            );

          if (!id) {
            throw new Error(
              "Unable to determine student ID."
            );
          }

          await apiRequest(
            `/students/${id}`,
            {
              method: "PUT",
              body: JSON.stringify(
                payload
              ),
            }
          );

          setSuccess(
            "Student updated successfully."
          );
        }

        // CREATE
        else {
          await apiRequest(
            "/students",
            {
              method: "POST",
              body: JSON.stringify(
                payload
              ),
            }
          );

          setSuccess(
            "Student created successfully."
          );
        }

        setShowModal(false);
        setEditingStudent(null);

        setForm({
          ...emptyForm,
        });

        await loadStudents();

      } catch (err) {
        console.error(
          "Save student error:",
          err
        );

        setError(
          err.message ||
            "Failed to save student."
        );
      } finally {
        setSaving(false);
      }
    };

  // ===================================================
  // DELETE STUDENT
  // ===================================================

  const handleDelete =
    async (student) => {
      const id =
        getStudentId(student);

      if (!id) {
        setError(
          "Unable to determine student ID."
        );
        return;
      }

      const name =
        getStudentName(student);

      const registerNumber =
        getRegisterNumber(student);

      const confirmed =
        window.confirm(
          `Are you sure you want to delete ${name} (${registerNumber})?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setSuccess("");

        await apiRequest(
          `/students/${id}`,
          {
            method: "DELETE",
          }
        );

        setSuccess(
          "Student deleted successfully."
        );

        await loadStudents();

      } catch (err) {
        console.error(
          "Delete student error:",
          err
        );

        setError(
          err.message ||
            "Failed to delete student."
        );
      }
    };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    async () => {
      setError("");
      setSuccess("");

      await Promise.all([
        loadStudents(),
        loadClasses(),
      ]);

      setSuccess(
        "Student list refreshed successfully."
      );
    };

  // ===================================================
  // SELECTED CLASS
  // ===================================================

  const selectedClass =
    getSelectedClass();

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <FaUserGraduate size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Student Management
            </h1>

            <p className="text-sm text-gray-500">
              Manage student records and class allocation
            </p>
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
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <FaPlus />

            Add Student
          </button>

        </div>

      </div>

      {/* =================================================
          SUCCESS MESSAGE
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
          ERROR MESSAGE
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

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Students
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-800">
                {statistics.total}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <FaUsers />
            </div>

          </div>

        </div>

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

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Classes
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-600">
                {classes.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FaIdCard />
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          {/* Search */}

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
              placeholder="Search student..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

          </div>

          {/* Class Filter */}

          <select
            value={classFilter}
            onChange={(event) =>
              setClassFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >

            <option value="all">
              All Classes
            </option>

            {classes.map(
              (classItem) => {
                const id =
                  classItem.class_id ??
                  classItem.id;

                return (
                  <option
                    key={id}
                    value={id}
                  >
                    {getClassLabel(
                      classItem
                    )}
                  </option>
                );
              }
            )}

          </select>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
          STUDENT TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="font-semibold text-gray-800">
              Student List
            </h2>

            <p className="text-xs text-gray-500">
              Showing{" "}
              {filteredStudents.length}{" "}
              of{" "}
              {students.length}{" "}
              students
            </p>

          </div>

        </div>

        {loading ? (

          <div className="flex min-h-75 items-center justify-center">

            <div className="text-center">

              <FaSyncAlt className="mx-auto mb-3 animate-spin text-2xl text-emerald-600" />

              <p className="text-sm text-gray-500">
                Loading students...
              </p>

            </div>

          </div>

        ) : filteredStudents.length === 0 ? (

          <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <FaUserGraduate size={25} />
            </div>

            <h3 className="font-semibold text-gray-700">
              No students found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or add a new student.
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
                    Student
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Register Number
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Department
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Year
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Section
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Email
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

                {filteredStudents.map(
                  (
                    student,
                    index
                  ) => {

                    const id =
                      getStudentId(
                        student
                      );

                    const name =
                      getStudentName(
                        student
                      );

                    const registerNumber =
                      getRegisterNumber(
                        student
                      );

                    const department =
                      student.department ??
                      student.department_name ??
                      "-";

                    const year =
                      student.year ??
                      student.study_year ??
                      "-";

                    const section =
                      student.section ??
                      student.class_section ??
                      "-";

                    const email =
                      getEmail(
                        student
                      );

                    const active =
                      isActive(
                        student
                      );

                    return (
                      <tr
                        key={
                          id ??
                          index
                        }
                        className="transition hover:bg-gray-50"
                      >

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
                              {name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <div className="font-medium text-gray-800">
                                {name}
                              </div>
                            </div>

                          </div>

                        </td>

                        <td className="whitespace-nowrap px-5 py-4">

                          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {registerNumber}
                          </span>

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">

                          <div className="flex items-center gap-2">

                            <FaBuilding className="text-emerald-500" />

                            {department}

                          </div>

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">

                          {year !== "-"
                            ? `Year ${year}`
                            : "-"}

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">

                          {section !== "-"
                            ? `Section ${section}`
                            : "-"}

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2 text-sm text-gray-600">

                            <FaEnvelope className="text-gray-400" />

                            <span>
                              {email}
                            </span>

                          </div>

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
                                openEditModal(
                                  student
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                              title="Edit student"
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  student
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                              title="Delete student"
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

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

              <div>

                <h2 className="text-lg font-bold text-gray-800">
                  {editingStudent
                    ? "Edit Student"
                    : "Add Student"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {editingStudent
                    ? "Update student information"
                    : "Create a new student record"}
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

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* Register Number */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">

                  Register Number

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>

                <input
                  type="text"
                  name="register_number"
                  value={
                    form.register_number
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: 23CS001"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

              </div>

              {/* Name */}

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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                </div>

              </div>

              {/* Email */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
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
                  placeholder="student@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

              </div>
              {/* Username */}

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
    value={form.username}
    onChange={handleChange}
    placeholder="Example: arjun23"
    required={!editingStudent}
    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
  />

</div>

{/* Password */}

<div>

  <label className="mb-1.5 block text-sm font-medium text-gray-700">

    Password

    {!editingStudent && (
      <span className="ml-1 text-red-500">
        *
      </span>
    )}

  </label>

  <input
    type="password"
    name="password"
    value={form.password}
    onChange={handleChange}
    placeholder={
      editingStudent
        ? "Leave blank to keep current password"
        : "Enter password"
    }
    required={!editingStudent}
    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
  />

</div>
              {/* =================================================
                  CLASS
              ================================================= */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">

                  Class

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>

                <select
                  name="class_id"
                  value={
                    form.class_id
                  }
                  onChange={
                    handleChange
                  }
                  required
                  disabled={
                    classes.length === 0
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                >

                  <option value="">
                    {classes.length === 0
                      ? "No classes available"
                      : "Select Class"}
                  </option>

                  {classes.map(
                    (classItem) => {

                      const id =
                        classItem.class_id ??
                        classItem.id;

                      const department =
                        getDepartmentName(
                          classItem
                        );

                      const year =
                        getYear(
                          classItem
                        );

                      const section =
                        getSection(
                          classItem
                        );

                      return (
                        <option
                          key={id}
                          value={id}
                        >
                          {getClassLabel(
                            classItem
                          )}
                        </option>
                      );
                    }
                  )}

                </select>

                {/* Class count */}

                {classes.length > 0 && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    {classes.length} class
                    {classes.length !== 1
                      ? "es"
                      : ""}{" "}
                    available
                  </p>
                )}

                {classes.length === 0 && (
                  <p className="mt-1.5 text-xs text-red-500">
                    No classes were loaded from the server.
                    Create a class first or check the
                    browser console for the API error.
                  </p>
                )}

              </div>

              {/* =================================================
                  SELECTED CLASS INFORMATION
              ================================================= */}

              {selectedClass && (

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                  <div className="mb-4 flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <FaBuilding />
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-emerald-800">
                        Selected Class
                      </p>

                      <p className="text-xs text-emerald-600">
                        Student will be allocated to this class
                      </p>

                    </div>

                  </div>

                  {/* Full Class Name */}

                  <div className="mb-3 rounded-lg bg-white px-4 py-3">

                    <p className="text-xs text-gray-500">
                      Class
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {getClassLabel(
                        selectedClass
                      )}
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                    {/* Department */}

                    <div className="rounded-lg bg-white p-3">

                      <p className="text-xs text-gray-500">
                        Department
                      </p>

                      <p className="mt-1 font-semibold text-gray-800">

                        {getDepartmentName(
                          selectedClass
                        ) || (
                          <span className="text-red-500">
                            Department name not available
                          </span>
                        )}

                      </p>

                    </div>

                    {/* Year */}

                    <div className="rounded-lg bg-white p-3">

                      <p className="text-xs text-gray-500">
                        Year
                      </p>

                      <p className="mt-1 font-semibold text-gray-800">

                        {getYear(
                          selectedClass
                        ) || "-"}

                      </p>

                    </div>

                    {/* Section */}

                    <div className="rounded-lg bg-white p-3">

                      <p className="text-xs text-gray-500">
                        Section
                      </p>

                      <p className="mt-1 font-semibold text-gray-800">

                        {getSection(
                          selectedClass
                        ) || "-"}

                      </p>

                    </div>

                  </div>

                  {/* Debug information only when department
                      is missing */}

                  {!getDepartmentName(
                    selectedClass
                  ) && (

                    <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">

                      <p className="text-xs text-yellow-700">

                        Department name was not returned
                        by the classes API.

                        <span className="ml-1 font-semibold">
                          Department ID:
                          {" "}
                          {selectedClass.department_id ??
                            "-"}
                        </span>

                      </p>

                    </div>

                  )}

                </div>

              )}

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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>

              {/* Information */}

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">

                <p className="font-medium">
                  Student class allocation
                </p>

                <p className="mt-1 text-xs text-blue-600">
                  Selecting a class automatically saves
                  its class ID, department, year and
                  section to the student record.
                </p>

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
                  disabled={
                    saving ||
                    classes.length === 0
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (

                    <>
                      <FaSyncAlt className="animate-spin" />

                      Saving...
                    </>

                  ) : (

                    <>
                      <FaSave />

                      {editingStudent
                        ? "Update Student"
                        : "Create Student"}
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

export default AdminStudents;