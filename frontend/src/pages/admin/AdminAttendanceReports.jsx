import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChartBar,
  FaChartPie,
  FaDownload,
  FaEye,
  FaFilter,
  FaPercentage,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaTimesCircle,
  FaUsers,
  FaUserGraduate,
  FaBook,
  FaExclamationTriangle,
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

  if (Array.isArray(response?.reports)) {
    return response.reports;
  }

  if (Array.isArray(response?.attendanceReports)) {
    return response.attendanceReports;
  }

  return [];
};

// =====================================================
// NORMALIZE REPORT
// =====================================================

const normalizeReport = (item) => {
  return {
    ...item,

    report_id:
      item.report_id ??
      item.attendance_report_id ??
      item.id ??
      item.reportId,

    student_id:
      item.student_id ??
      item.studentId,

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

    session_id:
      item.session_id ??
      item.attendance_session_id ??
      item.sessionId,

    report_date:
      item.report_date ??
      item.attendance_date ??
      item.date ??
      item.created_at ??
      "",

    academic_year:
      item.academic_year ??
      item.academicYear ??
      "",

    semester:
      item.semester ??
      "",

    total_classes:
      Number(
        item.total_classes ??
          item.total_sessions ??
          item.totalSessions ??
          0
      ),

    present_count:
      Number(
        item.present_count ??
          item.present ??
          item.present_days ??
          item.days_present ??
          0
      ),

    absent_count:
      Number(
        item.absent_count ??
          item.absent ??
          item.absent_days ??
          item.days_absent ??
          0
      ),

    late_count:
      Number(
        item.late_count ??
          item.late ??
          item.late_days ??
          0
      ),

    attendance_percentage:
      Number(
        item.attendance_percentage ??
          item.attendance_percent ??
          item.percentage ??
          item.attendancePercentage ??
          0
      ),

    status:
      item.status ??
      "generated",

    student_name:
      item.student_name ??
      item.studentName ??
      item.name ??
      "",

    register_number:
      item.register_number ??
      item.registerNo ??
      item.registration_number ??
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

  return {
    ...item,

    staff_id:
      item.staff_id ??
      item.id ??
      item.user_id,

    staff_name:
      item.full_name ||
      item.fullName ||
      item.name ||
      `${firstName} ${lastName}`.trim() ||
      "Unknown Staff",

    staff_code:
      item.staff_code ??
      item.employee_id ??
      item.employee_code ??
      "",
  };
};

// =====================================================
// NORMALIZE STUDENT
// =====================================================

const normalizeStudent = (item) => {
  const firstName =
    item.first_name ??
    item.firstName ??
    "";

  const lastName =
    item.last_name ??
    item.lastName ??
    "";

  return {
    ...item,

    student_id:
      item.student_id ??
      item.id ??
      item.studentId,

    student_name:
      item.student_name ||
      item.full_name ||
      item.fullName ||
      item.name ||
      `${firstName} ${lastName}`.trim() ||
      "Unknown Student",

    register_number:
      item.register_number ??
      item.registerNo ??
      item.registration_number ??
      "",

    class_id:
      item.class_id ??
      item.classId ??
      null,

    status:
      item.status ??
      "active",
  };
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
    return String(value).substring(0, 10);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// PERCENTAGE
// =====================================================

const calculatePercentage = (
  present,
  total
) => {
  if (!total || total <= 0) {
    return 0;
  }

  return Number(
    ((present / total) * 100).toFixed(2)
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const AdminAttendanceReports = () => {
  // ===================================================
  // STATE
  // ===================================================

  const [reports, setReports] = useState([]);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [classFilter, setClassFilter] =
    useState("all");

  const [subjectFilter, setSubjectFilter] =
    useState("all");

  const [staffFilter, setStaffFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [academicYearFilter, setAcademicYearFilter] =
    useState("all");

  const [semesterFilter, setSemesterFilter] =
    useState("all");

  const [dateFilter, setDateFilter] =
    useState("");

  const [minimumPercentage, setMinimumPercentage] =
    useState("");

  const [showDetails, setShowDetails] =
    useState(false);

  const [selectedReport, setSelectedReport] =
    useState(null);

  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        reportResponse,
        classResponse,
        subjectResponse,
        staffResponse,
        studentResponse,
      ] = await Promise.all([
        apiRequest("/attendance-reports"),
        apiRequest("/classes"),
        apiRequest("/subjects"),
        apiRequest("/staff"),
        apiRequest("/students"),
      ]);

      const reportData =
        extractArray(reportResponse);

      const classData =
        extractArray(classResponse);

      const subjectData =
        extractArray(subjectResponse);

      const staffData =
        extractArray(staffResponse);

      const studentData =
        extractArray(studentResponse);

      // -------------------------------------------------
      // NORMALIZE RELATED DATA
      // -------------------------------------------------

      const normalizedClasses =
        classData.map(
          normalizeClass
        );

      const normalizedSubjects =
        subjectData.map(
          normalizeSubject
        );

      const normalizedStaff =
        staffData.map(
          normalizeStaff
        );

      const normalizedStudents =
        studentData.map(
          normalizeStudent
        );

      // -------------------------------------------------
      // LOOKUP MAPS
      // -------------------------------------------------

      const classMap = {};

      normalizedClasses.forEach(
        (item) => {
          classMap[item.class_id] =
            item;
        }
      );

      const subjectMap = {};

      normalizedSubjects.forEach(
        (item) => {
          subjectMap[item.subject_id] =
            item;
        }
      );

      const staffMap = {};

      normalizedStaff.forEach(
        (item) => {
          staffMap[item.staff_id] =
            item;
        }
      );

      const studentMap = {};

      normalizedStudents.forEach(
        (item) => {
          studentMap[item.student_id] =
            item;
        }
      );

      // -------------------------------------------------
      // NORMALIZE REPORTS
      // -------------------------------------------------

      const normalizedReports =
        reportData
          .map(normalizeReport)
          .map((report) => {
            const classItem =
              classMap[report.class_id];

            const subjectItem =
              subjectMap[
                report.subject_id
              ];

            const staffItem =
              staffMap[report.staff_id];

            const studentItem =
              studentMap[
                report.student_id
              ];

            const total =
              Number(
                report.total_classes
              ) || 0;

            let percentage =
              Number(
                report.attendance_percentage
              ) || 0;

            if (
              percentage === 0 &&
              total > 0
            ) {
              percentage =
                calculatePercentage(
                  report.present_count,
                  total
                );
            }

            let className =
              report.class_name ||
              classItem?.class_name ||
              "";

            if (
              !className &&
              classItem
            ) {
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
              ...report,

              student_name:
                report.student_name ||
                studentItem?.student_name ||
                "Unknown Student",

              register_number:
                report.register_number ||
                studentItem?.register_number ||
                "",

              class_name:
                className ||
                "Unknown Class",

              subject_name:
                report.subject_name ||
                subjectItem?.subject_name ||
                "Unknown Subject",

              subject_code:
                report.subject_code ||
                subjectItem?.subject_code ||
                "",

              staff_name:
                report.staff_name ||
                staffItem?.staff_name ||
                "Unknown Staff",

              department_name:
                report.department_name ||
                classItem?.department_name ||
                "",

              department_code:
                report.department_code ||
                classItem?.department_code ||
                "",

              attendance_percentage:
                percentage,
            };
          });

      setReports(
        normalizedReports
      );

      setClasses(
        normalizedClasses
      );

      setSubjects(
        normalizedSubjects
      );

      setStaff(
        normalizedStaff
      );

      setStudents(
        normalizedStudents
      );
    } catch (err) {
      console.error(
        "Failed to load attendance reports:",
        err
      );

      setError(
        err.message ||
          "Unable to load attendance reports."
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

    return () =>
      clearTimeout(timer);
  }, [success]);

  // ===================================================
  // ACADEMIC YEARS
  // ===================================================

  const academicYears =
    useMemo(() => {
      const years =
        reports
          .map(
            (report) =>
              report.academic_year
          )
          .filter(
            (year) =>
              year !== null &&
              year !== undefined &&
              String(year).trim() !== ""
          )
          .map((year) =>
            String(year)
          );

      return [
        ...new Set(years),
      ].sort();
    }, [reports]);

  // ===================================================
  // FILTERED REPORTS
  // ===================================================

  const filteredReports =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return reports.filter(
        (report) => {
          // -------------------------------------------
          // Search
          // -------------------------------------------

          const searchableText = [
            report.student_name,
            report.register_number,
            report.class_name,
            report.subject_name,
            report.subject_code,
            report.staff_name,
            report.department_name,
            report.department_code,
            report.academic_year,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !search ||
            searchableText.includes(
              search
            );

          // -------------------------------------------
          // Class
          // -------------------------------------------

          const matchesClass =
            classFilter === "all" ||
            String(
              report.class_id
            ) ===
              String(
                classFilter
              );

          // -------------------------------------------
          // Subject
          // -------------------------------------------

          const matchesSubject =
            subjectFilter === "all" ||
            String(
              report.subject_id
            ) ===
              String(
                subjectFilter
              );

          // -------------------------------------------
          // Staff
          // -------------------------------------------

          const matchesStaff =
            staffFilter === "all" ||
            String(
              report.staff_id
            ) ===
              String(
                staffFilter
              );

          // -------------------------------------------
          // Status
          // -------------------------------------------

          const matchesStatus =
            statusFilter === "all" ||
            String(
              report.status || ""
            ).toLowerCase() ===
              statusFilter.toLowerCase();

          // -------------------------------------------
          // Academic Year
          // -------------------------------------------

          const matchesAcademicYear =
            academicYearFilter ===
              "all" ||
            String(
              report.academic_year
            ) ===
              String(
                academicYearFilter
              );

          // -------------------------------------------
          // Semester
          // -------------------------------------------

          const matchesSemester =
            semesterFilter ===
              "all" ||
            String(
              report.semester
            ) ===
              String(
                semesterFilter
              );

          // -------------------------------------------
          // Date
          // -------------------------------------------

          const reportDate =
            report.report_date
              ? String(
                  report.report_date
                ).substring(0, 10)
              : "";

          const matchesDate =
            !dateFilter ||
            reportDate ===
              dateFilter;

          // -------------------------------------------
          // Minimum percentage
          // -------------------------------------------

          const matchesPercentage =
            !minimumPercentage ||
            Number(
              report.attendance_percentage
            ) >=
              Number(
                minimumPercentage
              );

          return (
            matchesSearch &&
            matchesClass &&
            matchesSubject &&
            matchesStaff &&
            matchesStatus &&
            matchesAcademicYear &&
            matchesSemester &&
            matchesDate &&
            matchesPercentage
          );
        }
      );
    }, [
      reports,
      searchTerm,
      classFilter,
      subjectFilter,
      staffFilter,
      statusFilter,
      academicYearFilter,
      semesterFilter,
      dateFilter,
      minimumPercentage,
    ]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics =
    useMemo(() => {
      const total =
        filteredReports.length;

      const totalClasses =
        filteredReports.reduce(
          (sum, report) =>
            sum +
            (Number(
              report.total_classes
            ) || 0),
          0
        );

      const totalPresent =
        filteredReports.reduce(
          (sum, report) =>
            sum +
            (Number(
              report.present_count
            ) || 0),
          0
        );

      const totalAbsent =
        filteredReports.reduce(
          (sum, report) =>
            sum +
            (Number(
              report.absent_count
            ) || 0),
          0
        );

      const totalLate =
        filteredReports.reduce(
          (sum, report) =>
            sum +
            (Number(
              report.late_count
            ) || 0),
          0
        );

      const overallPercentage =
        totalClasses > 0
          ? Number(
              (
                (totalPresent /
                  totalClasses) *
                100
              ).toFixed(2)
            )
          : 0;

      const excellent =
        filteredReports.filter(
          (report) =>
            Number(
              report.attendance_percentage
            ) >= 85
        ).length;

      const lowAttendance =
        filteredReports.filter(
          (report) =>
            Number(
              report.attendance_percentage
            ) < 75
        ).length;

      const uniqueStudents =
        new Set(
          filteredReports
            .map(
              (report) =>
                report.student_id
            )
            .filter(
              (id) =>
                id !== null &&
                id !== undefined &&
                id !== ""
            )
        ).size;

      const uniqueClasses =
        new Set(
          filteredReports
            .map(
              (report) =>
                report.class_id
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
        totalClasses,
        totalPresent,
        totalAbsent,
        totalLate,
        overallPercentage,
        excellent,
        lowAttendance,
        uniqueStudents,
        uniqueClasses,
      };
    }, [
      filteredReports,
    ]);

  // ===================================================
  // VIEW DETAILS
  // ===================================================

  const handleViewDetails = (
    report
  ) => {
    setSelectedReport(
      report
    );

    setShowDetails(
      true
    );
  };

  // ===================================================
  // CLOSE DETAILS
  // ===================================================

  const closeDetails = () => {
    setShowDetails(
      false
    );

    setSelectedReport(
      null
    );
  };

  // ===================================================
  // GENERATE REPORT
  // ===================================================

  const handleGenerateReport =
    async () => {
      try {
        setGenerating(
          true
        );

        setError("");
        setSuccess("");

        const payload = {
          class_id:
            classFilter !==
              "all"
              ? Number(
                  classFilter
                )
              : null,

          subject_id:
            subjectFilter !==
              "all"
              ? Number(
                  subjectFilter
                )
              : null,

          staff_id:
            staffFilter !==
              "all"
              ? Number(
                  staffFilter
                )
              : null,

          academic_year:
            academicYearFilter !==
              "all"
              ? academicYearFilter
              : null,

          semester:
            semesterFilter !==
              "all"
              ? Number(
                  semesterFilter
                )
              : null,

          date:
            dateFilter ||
            null,
        };

        await apiRequest(
          "/attendance-reports/generate",
          {
            method: "POST",
            body: JSON.stringify(
              payload
            ),
          }
        );

        setSuccess(
          "Attendance report generated successfully."
        );

        await loadData();
      } catch (err) {
        console.error(
          "Failed to generate report:",
          err
        );

        setError(
          err.message ||
            "Unable to generate attendance report."
        );
      } finally {
        setGenerating(
          false
        );
      }
    };

  // ===================================================
  // EXPORT CSV
  // ===================================================

  const handleExportCSV =
    () => {
      if (
        filteredReports.length ===
        0
      ) {
        setError(
          "There is no attendance report data to export."
        );

        return;
      }

      const headers = [
        "Student",
        "Register Number",
        "Class",
        "Subject",
        "Staff",
        "Academic Year",
        "Semester",
        "Report Date",
        "Total Classes",
        "Present",
        "Absent",
        "Late",
        "Attendance Percentage",
        "Status",
      ];

      const rows =
        filteredReports.map(
          (report) => [
            report.student_name,
            report.register_number,
            report.class_name,
            report.subject_name,
            report.staff_name,
            report.academic_year,
            report.semester,
            report.report_date
              ? String(
                  report.report_date
                ).substring(0, 10)
              : "",
            report.total_classes,
            report.present_count,
            report.absent_count,
            report.late_count,
            `${Number(
              report.attendance_percentage ||
                0
            ).toFixed(2)}%`,
            report.status,
          ]
        );

      const csvEscape =
        (value) => {
          const text =
            value === null ||
            value === undefined
              ? ""
              : String(
                  value
                );

          return `"${text.replace(
            /"/g,
            '""'
          )}"`;
        };

      const csv = [
        headers
          .map(csvEscape)
          .join(","),
        ...rows.map(
          (row) =>
            row
              .map(
                csvEscape
              )
              .join(",")
        ),
      ].join("\n");

      const blob =
        new Blob(
          [csv],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download = `attendance-reports-${new Date()
        .toISOString()
        .substring(
          0,
          10
        )}.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );

      setSuccess(
        "Attendance report exported successfully."
      );
    };

  // ===================================================
  // PERCENTAGE COLOR
  // ===================================================

  const percentageClass = (
    percentage
  ) => {
    const value =
      Number(
        percentage
      ) || 0;

    if (value >= 85) {
      return "text-green-600";
    }

    if (value >= 75) {
      return "text-yellow-600";
    }

    return "text-red-600";
  };

  // ===================================================
  // PERCENTAGE BADGE
  // ===================================================

  const percentageBadge = (
    percentage
  ) => {
    const value =
      Number(
        percentage
      ) || 0;

    if (value >= 85) {
      return "bg-green-100 text-green-700";
    }

    if (value >= 75) {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-red-100 text-red-700";
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
            Attendance Reports
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View, filter and analyse student attendance
            records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={
              handleExportCSV
            }
            disabled={
              loading ||
              filteredReports.length ===
                0
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaDownload />

            Export CSV
          </button>

          <button
            type="button"
            onClick={
              handleGenerateReport
            }
            disabled={
              generating
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaChartBar
              className={
                generating
                  ? "animate-pulse"
                  : ""
              }
            />

            {generating
              ? "Generating..."
              : "Generate Report"}
          </button>

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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Reports */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Reports
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-800">
                {statistics.total}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <FaChartBar />
            </div>
          </div>
        </div>

        {/* Students */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Students
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-600">
                {statistics.uniqueStudents}
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
              <FaUserGraduate />
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

        {/* Overall */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Overall Attendance
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${percentageClass(
                  statistics.overallPercentage
                )}`}
              >
                {statistics.overallPercentage.toFixed(
                  2
                )}
                %
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <FaPercentage />
            </div>
          </div>
        </div>

        {/* Present */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Present
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {statistics.totalPresent}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <FaCheckCircle />
            </div>
          </div>
        </div>

        {/* Absent */}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Absent
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {statistics.totalAbsent}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <FaTimesCircle />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          ATTENDANCE SUMMARY
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <FaCheckCircle />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Good Attendance
              </p>

              <p className="text-xl font-bold text-green-600">
                {statistics.excellent}
              </p>

              <p className="text-xs text-gray-400">
                85% and above
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-50 p-3 text-yellow-600">
              <FaExclamationTriangle />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Late
              </p>

              <p className="text-xl font-bold text-yellow-600">
                {statistics.totalLate}
              </p>

              <p className="text-xs text-gray-400">
                Late attendance records
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <FaTimesCircle />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Low Attendance
              </p>

              <p className="text-xl font-bold text-red-600">
                {statistics.lowAttendance}
              </p>

              <p className="text-xs text-gray-400">
                Below 75%
              </p>
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

          Attendance Report Filters
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {/* Search */}

          <div className="relative xl:col-span-2">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={
                searchTerm
              }
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search student, register no, subject..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Class */}

          <select
            value={
              classFilter
            }
            onChange={(event) =>
              setClassFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              All Classes
            </option>

            {classes.map(
              (item) => (
                <option
                  key={
                    item.class_id
                  }
                  value={
                    item.class_id
                  }
                >
                  {item.year
                    ? `Year ${item.year}`
                    : `Class ${item.class_id}`}
                  {item.section
                    ? ` - Section ${item.section}`
                    : ""}
                  {item.department_code
                    ? ` - ${item.department_code}`
                    : ""}
                </option>
              )
            )}
          </select>

          {/* Subject */}

          <select
            value={
              subjectFilter
            }
            onChange={(event) =>
              setSubjectFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              All Subjects
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

          {/* Staff */}

          <select
            value={
              staffFilter
            }
            onChange={(event) =>
              setStaffFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              All Staff
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
                </option>
              )
            )}
          </select>

          {/* Status */}

          <select
            value={
              statusFilter
            }
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

            <option value="generated">
              Generated
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="draft">
              Draft
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

          <input
            type="date"
            value={
              dateFilter
            }
            onChange={(event) =>
              setDateFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {/* Minimum Attendance */}

          <input
            type="number"
            min="0"
            max="100"
            value={
              minimumPercentage
            }
            onChange={(event) =>
              setMinimumPercentage(
                event.target.value
              )
            }
            placeholder="Minimum attendance %"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Attendance Report List
            </h2>

            <p className="text-sm text-gray-500">
              Showing{" "}
              {
                filteredReports.length
              }{" "}
              of{" "}
              {reports.length}{" "}
              reports
            </p>
          </div>

          <div className="text-sm text-gray-500">
            Overall:{" "}
            <span
              className={`font-bold ${percentageClass(
                statistics.overallPercentage
              )}`}
            >
              {statistics.overallPercentage.toFixed(
                2
              )}
              %
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-87.5 items-center justify-center">
            <div className="text-center">
              <FaSyncAlt className="mx-auto animate-spin text-3xl text-blue-600" />

              <p className="mt-3 text-sm text-gray-500">
                Loading attendance reports...
              </p>
            </div>
          </div>
        ) : filteredReports.length ===
          0 ? (
          <div className="flex min-h-87.5 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-full bg-gray-100 p-5 text-gray-400">
              <FaChartBar className="text-3xl" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-700">
              No attendance reports found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              There are no reports matching the
              selected filters.
            </p>

            <button
              type="button"
              onClick={
                handleGenerateReport
              }
              disabled={
                generating
              }
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <FaChartBar />

              Generate Report
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
                    Student
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Class
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Subject
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Sessions
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Present
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Absent
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Attendance
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Report Date
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredReports.map(
                  (
                    report,
                    index
                  ) => (
                    <tr
                      key={
                        report.report_id ??
                        index
                      }
                      className="transition hover:bg-gray-50"
                    >
                      {/* Number */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      {/* Student */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <FaUserGraduate />
                          </div>

                          <div>
                            <p className="font-medium text-gray-800">
                              {report.student_name ||
                                "Unknown Student"}
                            </p>

                            {report.register_number && (
                              <p className="text-xs text-gray-500">
                                {
                                  report.register_number
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class */}

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">
                          {report.class_name ||
                            "Unknown Class"}
                        </p>

                        {report.department_name && (
                          <p className="text-xs text-gray-500">
                            {
                              report.department_name
                            }

                            {report.department_code
                              ? ` (${report.department_code})`
                              : ""}
                          </p>
                        )}
                      </td>

                      {/* Subject */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                            <FaBook />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {report.subject_name ||
                                "Unknown Subject"}
                            </p>

                            {report.subject_code && (
                              <p className="text-xs text-gray-500">
                                {
                                  report.subject_code
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sessions */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">
                        {report.total_classes ??
                          0}
                      </td>

                      {/* Present */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-semibold text-green-600">
                          {report.present_count ??
                            0}
                        </span>
                      </td>

                      {/* Absent */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-semibold text-red-600">
                          {report.absent_count ??
                            0}
                        </span>
                      </td>

                      {/* Percentage */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${percentageBadge(
                            report.attendance_percentage
                          )}`}
                        >
                          {Number(
                            report.attendance_percentage ||
                              0
                          ).toFixed(
                            2
                          )}
                          %
                        </span>
                      </td>

                      {/* Date */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {formatDate(
                          report.report_date
                        )}
                      </td>

                      {/* Action */}

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleViewDetails(
                              report
                            )
                          }
                          title="View report details"
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                        >
                          <FaEye />
                        </button>
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
          DETAILS MODAL
      ================================================= */}

      {showDetails &&
        selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              {/* Header */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Attendance Report Details
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Detailed attendance information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Body */}

              <div className="p-6">
                {/* Student */}

                <div className="mb-6 flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl text-blue-600">
                    <FaUserGraduate />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {
                        selectedReport.student_name
                      }
                    </h3>

                    <p className="text-sm text-gray-500">
                      {selectedReport.register_number ||
                        "No register number"}
                    </p>
                  </div>
                </div>

                {/* Information */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Class
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {
                        selectedReport.class_name
                      }
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Subject
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {
                        selectedReport.subject_name
                      }
                    </p>

                    {selectedReport.subject_code && (
                      <p className="text-xs text-gray-500">
                        {
                          selectedReport.subject_code
                        }
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Staff
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {
                        selectedReport.staff_name
                      }
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Report Date
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {formatDate(
                        selectedReport.report_date
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Academic Year
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {selectedReport.academic_year ||
                        "-"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Semester
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {selectedReport.semester
                        ? `Semester ${selectedReport.semester}`
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Attendance Stats */}

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl bg-blue-50 p-4 text-center">
                    <p className="text-xs font-medium text-blue-600">
                      Total
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-700">
                      {
                        selectedReport.total_classes
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 p-4 text-center">
                    <p className="text-xs font-medium text-green-600">
                      Present
                    </p>

                    <p className="mt-1 text-2xl font-bold text-green-700">
                      {
                        selectedReport.present_count
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-50 p-4 text-center">
                    <p className="text-xs font-medium text-red-600">
                      Absent
                    </p>

                    <p className="mt-1 text-2xl font-bold text-red-700">
                      {
                        selectedReport.absent_count
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-yellow-50 p-4 text-center">
                    <p className="text-xs font-medium text-yellow-600">
                      Late
                    </p>

                    <p className="mt-1 text-2xl font-bold text-yellow-700">
                      {
                        selectedReport.late_count
                      }
                    </p>
                  </div>
                </div>

                {/* Percentage */}

                <div className="mt-6 rounded-xl border border-gray-200 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Attendance Percentage
                    </span>

                    <span
                      className={`text-xl font-bold ${percentageClass(
                        selectedReport.attendance_percentage
                      )}`}
                    >
                      {Number(
                        selectedReport.attendance_percentage ||
                          0
                      ).toFixed(
                        2
                      )}
                      %
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full ${
                        Number(
                          selectedReport.attendance_percentage ||
                            0
                        ) >= 85
                          ? "bg-green-500"
                          : Number(
                              selectedReport.attendance_percentage ||
                                0
                            ) >= 75
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            Number(
                              selectedReport.attendance_percentage ||
                                0
                            )
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Status */}

                <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <span className="text-sm font-medium text-gray-600">
                    Report Status
                  </span>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                    {
                      selectedReport.status ||
                      "Generated"
                    }
                  </span>
                </div>
              </div>

              {/* Footer */}

              <div className="border-t border-gray-200 px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AdminAttendanceReports;