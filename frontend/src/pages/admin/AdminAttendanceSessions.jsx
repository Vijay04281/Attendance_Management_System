import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaFilter,
  FaPlay,
  FaPlus,
  FaSearch,
  FaStop,
  FaSyncAlt,
  FaTimes,
  FaTimesCircle,
  FaTrash,
  FaUserTie,
  FaBook,
  FaUsers,
} from "react-icons/fa";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL = "https://attendance-management-system-gpci.onrender.com/api";

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
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
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
      data.message ||
        data.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

// =====================================================
// EXTRACT ARRAY
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

  if (Array.isArray(response?.sessions)) {
    return response.sessions;
  }

  if (Array.isArray(response?.attendanceSessions)) {
    return response.attendanceSessions;
  }

  if (Array.isArray(response?.classes)) {
    return response.classes;
  }

  if (Array.isArray(response?.subjects)) {
    return response.subjects;
  }

  if (Array.isArray(response?.staff)) {
    return response.staff;
  }

  return [];
};

// =====================================================
// NORMALIZE SESSION
// =====================================================

const normalizeSession = (item) => {
  return {
    ...item,

    session_id:
      item.session_id ??
      item.attendance_session_id ??
      item.id ??
      item.sessionId,

    class_id:
      item.class_id ??
      item.classId,

    subject_id:
      item.subject_id ??
      item.subjectId,

    staff_id:
      item.staff_id ??
      item.teacher_id ??
      item.staffId ??
      item.teacherId,

    session_date:
      item.session_date ??
      item.attendance_date ??
      item.date ??
      "",

    start_time:
      item.start_time ??
      item.startTime ??
      "",

    end_time:
      item.end_time ??
      item.endTime ??
      "",

    status:
      item.status ??
      "scheduled",

    session_type:
      item.session_type ??
      item.type ??
      "regular",

    academic_year:
      item.academic_year ??
      item.academicYear ??
      "",

    semester:
      item.semester ??
      "",

    title:
      item.title ??
      item.session_name ??
      item.sessionName ??
      "",

    notes:
      item.notes ??
      "",

    class_name:
      item.class_name ??
      item.className ??
      "",

    subject_name:
      item.subject_name ??
      item.subjectName ??
      "",

    subject_code:
      item.subject_code ??
      item.subjectCode ??
      "",

    staff_name:
      item.staff_name ??
      item.teacher_name ??
      item.staffName ??
      item.teacherName ??
      "",

    class_year:
      item.class_year ??
      item.year ??
      "",

    section:
      item.section ??
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
      item.year ??
      "",

    section:
      item.section ??
      "",

    status:
      item.status ??
      "active",
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

    status:
      item.status ??
      "active",
  };
};

// =====================================================
// NORMALIZE STAFF
// =====================================================

const normalizeStaff = (item) => {
  const firstName =
    item.first_name ??
    item.firstName ??
    "";

  const lastName =
    item.last_name ??
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

    staff_name:
      fullName || "Unknown Staff",

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
      item.status ??
      "active",
  };
};

// =====================================================
// EMPTY FORM
// =====================================================

const emptyForm = {
  class_id: "",
  subject_id: "",
  staff_id: "",
  session_date: "",
  start_time: "",
  end_time: "",
  session_type: "regular",
  academic_year: "",
  semester: "",
  status: "scheduled",
  notes: "",
};

// =====================================================
// DATE FORMATTER
// =====================================================

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// TIME FORMATTER
// =====================================================

const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  const parts = String(value).split(":");

  if (parts.length < 2) {
    return value;
  }

  let hour = Number(parts[0]);
  const minute = parts[1];

  if (Number.isNaN(hour)) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${suffix}`;
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const AdminAttendanceSessions = () => {
  // ===================================================
  // STATE
  // ===================================================

  const [sessions, setSessions] = useState([]);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] =
    useState("all");
  const [semesterFilter, setSemesterFilter] =
    useState("all");

  const [showModal, setShowModal] = useState(false);

  const [editingSession, setEditingSession] =
    useState(null);

  const [form, setForm] = useState({
    ...emptyForm,
  });

  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        sessionResponse,
        classResponse,
        subjectResponse,
        staffResponse,
      ] = await Promise.all([
        apiRequest("/attendance-sessions"),
        apiRequest("/classes"),
        apiRequest("/subjects"),
        apiRequest("/staff"),
      ]);

      const sessionData = extractArray(sessionResponse);
      const classData = extractArray(classResponse);
      const subjectData = extractArray(subjectResponse);
      const staffData = extractArray(staffResponse);

      const normalizedClasses = classData
        .map(normalizeClass)
        .filter((item) => {
          const status = String(
            item.status || ""
          ).toLowerCase();

          return (
            !status ||
            status === "active" ||
            status === "1"
          );
        });

      const normalizedSubjects = subjectData
        .map(normalizeSubject)
        .filter((item) => {
          const status = String(
            item.status || ""
          ).toLowerCase();

          return (
            !status ||
            status === "active" ||
            status === "1"
          );
        });

      const normalizedStaff = staffData
        .map(normalizeStaff)
        .filter((item) => {
          const status = String(
            item.status || ""
          ).toLowerCase();

          return (
            !status ||
            status === "active" ||
            status === "1"
          );
        });

      // -------------------------------------------------
      // LOOKUP MAPS
      // -------------------------------------------------

      const classMap = {};

      normalizedClasses.forEach((item) => {
        classMap[item.class_id] = item;
      });

      const subjectMap = {};

      normalizedSubjects.forEach((item) => {
        subjectMap[item.subject_id] = item;
      });

      const staffMap = {};

      normalizedStaff.forEach((item) => {
        staffMap[item.staff_id] = item;
      });

      // -------------------------------------------------
      // NORMALIZE SESSIONS
      // -------------------------------------------------

      const normalizedSessions = sessionData
        .map(normalizeSession)
        .map((session) => {
          const classItem =
            classMap[session.class_id];

          const subjectItem =
            subjectMap[session.subject_id];

          const staffItem =
            staffMap[session.staff_id];

          let className =
            session.class_name ||
            classItem?.class_name ||
            "";

          if (!className && classItem) {
            className = [
              classItem.year
                ? `Year ${classItem.year}`
                : "",
              classItem.section
                ? `Section ${classItem.section}`
                : "",
            ]
              .filter(Boolean)
              .join(" - ");
          }

          return {
            ...session,

            class_name:
              className ||
              "Unknown Class",

            class_year:
              session.class_year ||
              classItem?.year ||
              "",

            section:
              session.section ||
              classItem?.section ||
              "",

            subject_name:
              session.subject_name ||
              subjectItem?.subject_name ||
              "Unknown Subject",

            subject_code:
              session.subject_code ||
              subjectItem?.subject_code ||
              "",

            staff_name:
              session.staff_name ||
              staffItem?.staff_name ||
              "Unknown Staff",

            department_name:
              session.department_name ||
              classItem?.department_name ||
              "",

            department_code:
              session.department_code ||
              classItem?.department_code ||
              "",
          };
        });

      setSessions(normalizedSessions);
      setClasses(normalizedClasses);
      setSubjects(normalizedSubjects);
      setStaff(normalizedStaff);
    } catch (err) {
      console.error(
        "Failed to load attendance sessions:",
        err
      );

      setError(
        err.message ||
          "Unable to load attendance sessions."
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
  // CLEAR SUCCESS MESSAGE
  // ===================================================

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  // ===================================================
  // HANDLE CHANGE
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
    setEditingSession(null);

    const today = new Date()
      .toISOString()
      .split("T")[0];

    setForm({
      ...emptyForm,
      session_date: today,
    });

    setError("");
    setShowModal(true);
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (session) => {
    setEditingSession(session);

    setForm({
      class_id:
        session.class_id !== null &&
        session.class_id !== undefined
          ? String(session.class_id)
          : "",

      subject_id:
        session.subject_id !== null &&
        session.subject_id !== undefined
          ? String(session.subject_id)
          : "",

      staff_id:
        session.staff_id !== null &&
        session.staff_id !== undefined
          ? String(session.staff_id)
          : "",

      session_date:
        session.session_date
          ? String(session.session_date).substring(
              0,
              10
            )
          : "",

      start_time:
        session.start_time
          ? String(session.start_time).substring(
              0,
              5
            )
          : "",

      end_time:
        session.end_time
          ? String(session.end_time).substring(
              0,
              5
            )
          : "",

      session_type:
        session.session_type ||
        "regular",

      academic_year:
        session.academic_year
          ? String(session.academic_year)
          : "",

      semester:
        session.semester !== null &&
        session.semester !== undefined
          ? String(session.semester)
          : "",

      status:
        session.status ||
        "scheduled",

      notes:
        session.notes ||
        "",
    });

    setError("");
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
    setEditingSession(null);
    setForm({
      ...emptyForm,
    });
  };

  // ===================================================
  // VALIDATE FORM
  // ===================================================

  const validateForm = () => {
    if (!form.class_id) {
      return "Please select a class.";
    }

    if (!form.subject_id) {
      return "Please select a subject.";
    }

    if (!form.staff_id) {
      return "Please select the staff member.";
    }

    if (!form.session_date) {
      return "Please select the session date.";
    }

    if (!form.start_time) {
      return "Please enter the start time.";
    }

    if (!form.end_time) {
      return "Please enter the end time.";
    }

    if (!form.academic_year.trim()) {
      return "Please enter the academic year.";
    }

    if (!form.semester) {
      return "Please select the semester.";
    }

    // -------------------------------------------------
    // Check time
    // -------------------------------------------------

    if (
      form.start_time &&
      form.end_time &&
      form.start_time >= form.end_time
    ) {
      return "End time must be later than start time.";
    }

    return "";
  };

  // ===================================================
  // SUBMIT FORM
  // ===================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      class_id: Number(form.class_id),

      subject_id: Number(form.subject_id),

      staff_id: Number(form.staff_id),

      session_date:
        form.session_date,

      start_time:
        form.start_time,

      end_time:
        form.end_time,

      session_type:
        form.session_type,

      academic_year:
        form.academic_year.trim(),

      semester:
        Number(form.semester),

      status:
        form.status,

      notes:
        form.notes.trim(),
    };

    try {
      setSaving(true);

      // ------------------------------------------------
      // UPDATE
      // ------------------------------------------------

      if (editingSession) {
        const sessionId =
          editingSession.session_id ??
          editingSession.attendance_session_id ??
          editingSession.id;

        if (!sessionId) {
          throw new Error(
            "Attendance session ID is missing."
          );
        }

        await apiRequest(
          `/attendance-sessions/${sessionId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        setSuccess(
          "Attendance session updated successfully."
        );
      }

      // ------------------------------------------------
      // CREATE
      // ------------------------------------------------

      else {
        await apiRequest(
          "/attendance-sessions",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        setSuccess(
          "Attendance session created successfully."
        );
      }

      closeModal();

      await loadData();
    } catch (err) {
      console.error(
        "Failed to save attendance session:",
        err
      );

      setError(
        err.message ||
          "Unable to save attendance session."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE SESSION
  // ===================================================

  const handleDelete = async (session) => {
    const sessionId =
      session.session_id ??
      session.attendance_session_id ??
      session.id;

    if (!sessionId) {
      setError(
        "Attendance session ID is missing."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete the attendance session for ${
          session.subject_name ||
          "this subject"
        } on ${formatDate(
          session.session_date
        )}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiRequest(
        `/attendance-sessions/${sessionId}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Attendance session deleted successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Failed to delete attendance session:",
        err
      );

      setError(
        err.message ||
          "Unable to delete attendance session."
      );
    }
  };

  // ===================================================
  // START SESSION
  // ===================================================

  const handleStartSession = async (session) => {
    const sessionId =
      session.session_id ??
      session.attendance_session_id ??
      session.id;

    if (!sessionId) {
      setError(
        "Attendance session ID is missing."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Start attendance session for ${
          session.subject_name ||
          "this subject"
        }?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      // ------------------------------------------------
      // Try dedicated start endpoint first
      // ------------------------------------------------

      try {
        await apiRequest(
          `/attendance-sessions/${sessionId}/start`,
          {
            method: "PUT",
          }
        );
      } catch (startError) {
        // ----------------------------------------------
        // Fallback to normal update
        // ----------------------------------------------

        await apiRequest(
          `/attendance-sessions/${sessionId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              status: "active",
            }),
          }
        );
      }

      setSuccess(
        "Attendance session started successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Failed to start attendance session:",
        err
      );

      setError(
        err.message ||
          "Unable to start attendance session."
      );
    }
  };

  // ===================================================
  // STOP SESSION
  // ===================================================

  const handleStopSession = async (session) => {
    const sessionId =
      session.session_id ??
      session.attendance_session_id ??
      session.id;

    if (!sessionId) {
      setError(
        "Attendance session ID is missing."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Stop attendance session for ${
          session.subject_name ||
          "this subject"
        }?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      // ------------------------------------------------
      // Try dedicated stop endpoint
      // ------------------------------------------------

      try {
        await apiRequest(
          `/attendance-sessions/${sessionId}/stop`,
          {
            method: "PUT",
          }
        );
      } catch (stopError) {
        // ----------------------------------------------
        // Fallback to normal update
        // ----------------------------------------------

        await apiRequest(
          `/attendance-sessions/${sessionId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              status: "completed",
            }),
          }
        );
      }

      setSuccess(
        "Attendance session stopped successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Failed to stop attendance session:",
        err
      );

      setError(
        err.message ||
          "Unable to stop attendance session."
      );
    }
  };

  // ===================================================
  // FILTER OPTIONS
  // ===================================================

  const academicYears = useMemo(() => {
    const years = sessions
      .map(
        (session) =>
          session.academic_year
      )
      .filter(
        (year) =>
          year !== null &&
          year !== undefined &&
          String(year).trim() !== ""
      )
      .map((year) => String(year));

    return [...new Set(years)].sort();
  }, [sessions]);

  // ===================================================
  // FILTERED SESSIONS
  // ===================================================

  const filteredSessions = useMemo(() => {
    const search =
      searchTerm
        .trim()
        .toLowerCase();

    return sessions.filter(
      (session) => {
        // ---------------------------------------------
        // Search
        // ---------------------------------------------

        const searchableText = [
          session.class_name,
          session.subject_name,
          session.subject_code,
          session.staff_name,
          session.department_name,
          session.department_code,
          session.academic_year,
          session.session_type,
          session.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !search ||
          searchableText.includes(
            search
          );

        // ---------------------------------------------
        // Status
        // ---------------------------------------------

        const matchesStatus =
          statusFilter === "all" ||
          String(
            session.status || ""
          ).toLowerCase() ===
            statusFilter.toLowerCase();

        // ---------------------------------------------
        // Date
        // ---------------------------------------------

        const sessionDate =
          session.session_date
            ? String(
                session.session_date
              ).substring(0, 10)
            : "";

        const matchesDate =
          !dateFilter ||
          sessionDate ===
            dateFilter;

        // ---------------------------------------------
        // Academic Year
        // ---------------------------------------------

        const matchesAcademicYear =
          academicYearFilter ===
            "all" ||
          String(
            session.academic_year
          ) ===
            String(
              academicYearFilter
            );

        // ---------------------------------------------
        // Semester
        // ---------------------------------------------

        const matchesSemester =
          semesterFilter ===
            "all" ||
          String(
            session.semester
          ) ===
            String(
              semesterFilter
            );

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDate &&
          matchesAcademicYear &&
          matchesSemester
        );
      }
    );
  }, [
    sessions,
    searchTerm,
    statusFilter,
    dateFilter,
    academicYearFilter,
    semesterFilter,
  ]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {
    const total =
      sessions.length;

    const scheduled =
      sessions.filter(
        (session) =>
          String(
            session.status || ""
          ).toLowerCase() ===
          "scheduled"
      ).length;

    const active =
      sessions.filter(
        (session) =>
          String(
            session.status || ""
          ).toLowerCase() ===
          "active"
      ).length;

    const completed =
      sessions.filter(
        (session) =>
          String(
            session.status || ""
          ).toLowerCase() ===
            "completed" ||
          String(
            session.status || ""
          ).toLowerCase() ===
            "closed"
      ).length;

    const cancelled =
      sessions.filter(
        (session) =>
          String(
            session.status || ""
          ).toLowerCase() ===
          "cancelled"
      ).length;

    const uniqueClasses =
      new Set(
        sessions
          .map(
            (session) =>
              session.class_id
          )
          .filter(
            (id) =>
              id !== null &&
              id !== undefined &&
              id !== ""
          )
      ).size;

    return {
      total,
      scheduled,
      active,
      completed,
      cancelled,
      uniqueClasses,
    };
  }, [sessions]);

  // ===================================================
  // STATUS BADGE
  // ===================================================

  const renderStatus = (status) => {
    const normalized =
      String(
        status || ""
      ).toLowerCase();

    if (
      normalized ===
      "active"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
          <FaPlay />

          Active
        </span>
      );
    }

    if (
      normalized ===
        "completed" ||
      normalized ===
        "closed"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
          <FaCheckCircle />

          Completed
        </span>
      );
    }

    if (
      normalized ===
      "cancelled"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
          <FaTimesCircle />

          Cancelled
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
        <FaClock />

        Scheduled
      </span>
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
          <h1 className="text-2xl font-bold text-gray-800">
            Attendance Sessions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create, manage, start and monitor attendance
            sessions.
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
              openAddModal
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FaPlus />

            Create Session
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
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FaTimesCircle className="mt-0.5 shrink-0" />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
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
                Total Sessions
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-800">
                {statistics.total}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <FaCalendarAlt />
            </div>
          </div>
        </div>

        {/* Scheduled */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Scheduled
              </p>

              <p className="mt-2 text-2xl font-bold text-yellow-600">
                {statistics.scheduled}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-3 text-yellow-600">
              <FaClock />
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
              <FaPlay />
            </div>
          </div>
        </div>

        {/* Completed */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Completed
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {statistics.completed}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <FaCheckCircle />
            </div>
          </div>
        </div>

        {/* Cancelled */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Cancelled
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {statistics.cancelled}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <FaTimesCircle />
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

              <p className="mt-2 text-2xl font-bold text-purple-600">
                {statistics.uniqueClasses}
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
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
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search class, subject, staff..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              All Status
            </option>

            <option value="scheduled">
              Scheduled
            </option>

            <option value="active">
              Active
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

          {/* Academic Year */}

          <select
            value={
              academicYearFilter
            }
            onChange={(event) =>
              setAcademicYearFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              All Academic Years
            </option>

            {academicYears.map(
              (year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              )
            )}
          </select>

          {/* Semester */}

          <select
            value={
              semesterFilter
            }
            onChange={(event) =>
              setSemesterFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
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

          {/* Date */}

          <div className="lg:col-span-1">
            <input
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Attendance Session List
            </h2>

            <p className="text-sm text-gray-500">
              Showing{" "}
              {
                filteredSessions.length
              }{" "}
              of{" "}
              {sessions.length}{" "}
              sessions
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-75 items-center justify-center">
            <div className="text-center">
              <FaSyncAlt className="mx-auto animate-spin text-3xl text-blue-600" />

              <p className="mt-3 text-sm text-gray-500">
                Loading attendance sessions...
              </p>
            </div>
          </div>
        ) : filteredSessions.length ===
          0 ? (
          <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-full bg-gray-100 p-5 text-gray-400">
              <FaCalendarAlt className="text-3xl" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-700">
              No attendance sessions found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              No session matches the current filters.
              Create a new attendance session or change
              the filters.
            </p>

            <button
              type="button"
              onClick={
                openAddModal
              }
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <FaPlus />

              Create Session
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
                    Date & Time
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Class
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Subject
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Staff
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Academic
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
                {filteredSessions.map(
                  (
                    session,
                    index
                  ) => (
                    <tr
                      key={
                        session.session_id ??
                        session.attendance_session_id ??
                        session.id ??
                        index
                      }
                      className="transition hover:bg-gray-50"
                    >
                      {/* Number */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      {/* Date / Time */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
                            <FaCalendarAlt />
                          </div>

                          <div>
                            <p className="font-medium text-gray-800">
                              {formatDate(
                                session.session_date
                              )}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {formatTime(
                                session.start_time
                              )}{" "}
                              -{" "}
                              {formatTime(
                                session.end_time
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Class */}

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {session.class_name ||
                              "Unknown Class"}
                          </p>

                          {session.department_name && (
                            <p className="text-xs text-gray-500">
                              {
                                session.department_name
                              }

                              {session.department_code
                                ? ` (${session.department_code})`
                                : ""}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Subject */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                            <FaBook />
                          </div>

                          <div>
                            <p className="font-medium text-gray-800">
                              {session.subject_name ||
                                "Unknown Subject"}
                            </p>

                            {session.subject_code && (
                              <p className="text-xs text-gray-500">
                                {
                                  session.subject_code
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Staff */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                            <FaUserTie />
                          </div>

                          <p className="text-sm font-medium text-gray-800">
                            {session.staff_name ||
                              "Unknown Staff"}
                          </p>
                        </div>
                      </td>

                      {/* Academic */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="text-sm font-medium text-gray-700">
                          {session.academic_year ||
                            "-"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {session.semester
                            ? `Semester ${session.semester}`
                            : "-"}
                        </p>
                      </td>

                      {/* Status */}

                      <td className="whitespace-nowrap px-5 py-4">
                        {renderStatus(
                          session.status
                        )}
                      </td>

                      {/* Actions */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {/* Start */}

                          {String(
                            session.status ||
                              ""
                          ).toLowerCase() ===
                            "scheduled" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStartSession(
                                  session
                                )
                              }
                              title="Start session"
                              className="rounded-lg bg-green-50 p-2 text-green-600 transition hover:bg-green-100"
                            >
                              <FaPlay />
                            </button>
                          )}

                          {/* Stop */}

                          {String(
                            session.status ||
                              ""
                          ).toLowerCase() ===
                            "active" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStopSession(
                                  session
                                )
                              }
                              title="Stop session"
                              className="rounded-lg bg-orange-50 p-2 text-orange-600 transition hover:bg-orange-100"
                            >
                              <FaStop />
                            </button>
                          )}

                          {/* Edit */}

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                session
                              )
                            }
                            title="Edit session"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          >
                            <FaEdit />
                          </button>

                          {/* Delete */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                session
                              )
                            }
                            title="Delete session"
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
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingSession
                    ? "Edit Attendance Session"
                    : "Create Attendance Session"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Configure the class, subject, staff and
                  session timing.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                    value={
                      form.class_id
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="">
                      Select Class
                    </option>

                    {classes.map(
                      (item) => {
                        const label =
                          [
                            item.year
                              ? `Year ${item.year}`
                              : "",
                            item.section
                              ? `Section ${item.section}`
                              : "",
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " - "
                            );

                        return (
                          <option
                            key={
                              item.class_id
                            }
                            value={
                              item.class_id
                            }
                          >
                            {label ||
                              `Class ${item.class_id}`}
                            {item.department_code
                              ? ` - ${item.department_code}`
                              : item.department_name
                              ? ` - ${item.department_name}`
                              : ""}
                          </option>
                        );
                      }
                    )}
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
                    value={
                      form.subject_id
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="">
                      Select Subject
                    </option>

                    {subjects.map(
                      (item) => (
                        <option
                          key={
                            item.subject_id
                          }
                          value={
                            item.subject_id
                          }
                        >
                          {
                            item.subject_name
                          }

                          {item.subject_code
                            ? ` (${item.subject_code})`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Staff */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Staff / Teacher
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="staff_id"
                    value={
                      form.staff_id
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="">
                      Select Staff Member
                    </option>

                    {staff.map(
                      (item) => (
                        <option
                          key={
                            item.staff_id
                          }
                          value={
                            item.staff_id
                          }
                        >
                          {
                            item.staff_name
                          }

                          {item.staff_code
                            ? ` (${item.staff_code})`
                            : ""}

                          {item.department_name
                            ? ` - ${item.department_name}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Date */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Session Date
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="date"
                    name="session_date"
                    value={
                      form.session_date
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Session Type */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Session Type
                  </label>

                  <select
                    name="session_type"
                    value={
                      form.session_type
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="regular">
                      Regular Class
                    </option>

                    <option value="practical">
                      Practical
                    </option>

                    <option value="lab">
                      Laboratory
                    </option>

                    <option value="exam">
                      Examination
                    </option>

                    <option value="special">
                      Special Session
                    </option>
                  </select>
                </div>

                {/* Start Time */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Start Time
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="time"
                    name="start_time"
                    value={
                      form.start_time
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* End Time */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    End Time
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="time"
                    name="end_time"
                    value={
                      form.end_time
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
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
                    value={
                      form.academic_year
                    }
                    onChange={
                      handleChange
                    }
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
                    value={
                      form.semester
                    }
                    onChange={
                      handleChange
                    }
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
                    value={
                      form.status
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="scheduled">
                      Scheduled
                    </option>

                    <option value="active">
                      Active
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>
                </div>

                {/* Notes */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    rows="3"
                    placeholder="Optional session notes..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
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

                      {editingSession
                        ? "Update Session"
                        : "Create Session"}
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

export default AdminAttendanceSessions;