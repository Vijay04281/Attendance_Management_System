import { useEffect, useMemo, useState } from "react";

// =====================================================
// API CONFIG
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "/api";

// =====================================================
// CLASS TEACHER MY CLASS
// =====================================================

function ClassTeacherClass() {
  const [classInfo, setClassInfo] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const token = useMemo(() => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  }, []);

  // ===================================================
  // FETCH MY CLASS
  // ===================================================

  useEffect(() => {
    const fetchMyClass = async () => {
      setLoading(true);
      setError("");

      try {
        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again."
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/class-teacher/class`,
          {
            method: "GET",

            headers: {
              "Content-Type": "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        let data = {};

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "Invalid response received from server."
          );
        }

        console.log(
          "MY CLASS RESPONSE:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
            `Request failed (${response.status})`
          );
        }

        if (!data.success) {
          throw new Error(
            data?.message ||
            "Failed to fetch class information."
          );
        }

        setClassInfo(
          data.class || null
        );

      } catch (err) {
        console.error(
          "My Class Error:",
          err
        );

        setError(
          err?.message ||
          "Failed to load class information."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchMyClass();
  }, [token]);

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Class Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            My Class
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Loading your assigned class...
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-4 w-24 rounded bg-slate-200" />

              <div className="mt-4 h-8 w-40 rounded bg-slate-200" />

              <div className="mt-3 h-4 w-32 rounded bg-slate-200" />
            </div>
          ))}

        </div>

        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-48 rounded bg-slate-200" />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 rounded-xl bg-slate-100"
              />
            ))}

          </div>
        </div>

      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error) {
    return (
      <div className="space-y-6">

        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Class Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            My Class
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View the class assigned to you as Class Teacher.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-xl">
              ⚠️
            </div>

            <div>
              <h2 className="font-bold text-red-800">
                Unable to load your class
              </h2>

              <p className="mt-2 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ===================================================
  // NO CLASS ASSIGNED
  // ===================================================

  if (!classInfo) {
    return (
      <div className="space-y-6">

        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Class Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            My Class
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View the class assigned to you as Class Teacher.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
            🏫
          </div>

          <h2 className="mt-5 text-xl font-bold text-amber-900">
            No Class Assigned
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-amber-700">
            You are currently not assigned as a Class Teacher
            to any active class.
          </p>

        </div>

      </div>
    );
  }

  // ===================================================
  // CLASS VALUES
  // ===================================================

  const departmentName =
    classInfo.department_name ||
    classInfo.department ||
    "-";

  const departmentCode =
    classInfo.department_code ||
    "-";

  const year =
    classInfo.year ??
    "-";

  const section =
    classInfo.section ||
    "-";

  const academicYear =
    classInfo.academic_year ||
    "-";

  const semester =
    classInfo.semester ??
    "-";

  const totalStudents =
    classInfo.total_students ??
    0;

  const status =
    classInfo.status ||
    "ACTIVE";

  // ===================================================
  // DISPLAY
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

        <div>

          <p className="text-sm font-semibold text-indigo-600">
            Class Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            My Class
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage and monitor the class assigned to you.
          </p>

        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">

          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

          <span className="text-sm font-semibold text-emerald-700">
            {String(status).toUpperCase()}
          </span>

        </div>

      </div>

      {/* =================================================
          MAIN CLASS CARD
      ================================================= */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}

        <div className="bg-linear-to-r from-indigo-600 to-blue-600 px-6 py-8 text-white md:px-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-5">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
                🏫
              </div>

              <div>

                <p className="text-sm font-medium text-indigo-100">
                  Assigned Class
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  Year {year} - Section {section}
                </h2>

                <p className="mt-1 text-sm text-indigo-100">
                  {departmentName}
                  {departmentCode !== "-" &&
                    ` (${departmentCode})`}
                </p>

              </div>

            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">

              <p className="text-xs font-medium uppercase tracking-wider text-indigo-100">
                Students
              </p>

              <p className="mt-1 text-3xl font-bold">
                {totalStudents}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            CLASS DETAILS
        ================================================= */}

        <div className="p-6 md:p-8">

          <div className="mb-6">

            <h3 className="text-lg font-bold text-slate-900">
              Class Details
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Information about your current Class Teacher assignment.
            </p>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* Department */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg">
                🏢
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Department
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {departmentName}
              </p>

              {departmentCode !== "-" && (
                <p className="mt-1 text-xs text-slate-500">
                  {departmentCode}
                </p>
              )}

            </div>

            {/* Year */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">
                🎓
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Year
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                Year {year}
              </p>

            </div>

            {/* Section */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-lg">
                📚
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Section
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {section}
              </p>

            </div>

            {/* Students */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                👥
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total Students
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {totalStudents}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          ACADEMIC INFORMATION
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">

          <h3 className="text-lg font-bold text-slate-900">
            Academic Information
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Current academic details for this class assignment.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Academic Year */}

          <div className="rounded-xl border border-slate-200 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Academic Year
            </p>

            <p className="mt-2 font-bold text-slate-900">
              {academicYear}
            </p>

          </div>

          {/* Semester */}

          <div className="rounded-xl border border-slate-200 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Semester
            </p>

            <p className="mt-2 font-bold text-slate-900">
              {semester}
            </p>

          </div>

          {/* Assignment ID */}

          <div className="rounded-xl border border-slate-200 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Assignment ID
            </p>

            <p className="mt-2 font-bold text-slate-900">
              {classInfo.assignment_id ?? "-"}
            </p>

          </div>

        </div>

      </div>

      {/* =================================================
          CLASS MANAGEMENT SUMMARY
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">

          <h3 className="text-lg font-bold text-slate-900">
            Class Teacher Responsibilities
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Use the Class Teacher portal to manage and monitor this class.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl bg-indigo-50 p-5">

            <div className="text-2xl">
              👥
            </div>

            <h4 className="mt-3 font-bold text-indigo-900">
              Students
            </h4>

            <p className="mt-1 text-sm text-indigo-700">
              View and monitor all students assigned to this class.
            </p>

          </div>

          <div className="rounded-xl bg-blue-50 p-5">

            <div className="text-2xl">
              📊
            </div>

            <h4 className="mt-3 font-bold text-blue-900">
              Attendance
            </h4>

            <p className="mt-1 text-sm text-blue-700">
              Monitor attendance and identify absent students.
            </p>

          </div>

          <div className="rounded-xl bg-purple-50 p-5">

            <div className="text-2xl">
              📋
            </div>

            <h4 className="mt-3 font-bold text-purple-900">
              Reports
            </h4>

            <p className="mt-1 text-sm text-purple-700">
              Review class attendance reports and performance.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ClassTeacherClass;