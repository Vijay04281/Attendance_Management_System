import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://attendance-management-system-gpci.onrender.com/api";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

function ClassTeacherProfile() {
  const [profile, setProfile] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found"
        );
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        profileResponse,
        classResponse,
        dashboardResponse,
      ] = await Promise.all([
        fetch(`${API_BASE}/class-teacher/profile`, {
          method: "GET",
          headers,
        }),

        fetch(`${API_BASE}/class-teacher/class`, {
          method: "GET",
          headers,
        }),

        fetch(`${API_BASE}/class-teacher/dashboard`, {
          method: "GET",
          headers,
        }),
      ]);

      if (!profileResponse.ok) {
        const result =
          await profileResponse
            .json()
            .catch(() => ({}));

        throw new Error(
          result.message ||
            "Failed to load teacher profile"
        );
      }

      const profileResult =
        await profileResponse.json();

      const profileData =
        profileResult?.profile ||
        profileResult?.teacher ||
        profileResult?.data?.profile ||
        profileResult?.data ||
        null;

      setProfile(profileData);

      if (classResponse.ok) {
        const classResult =
          await classResponse.json();

        const classData =
          classResult?.class ||
          classResult?.data?.class ||
          classResult?.data ||
          null;

        setClassInfo(classData);
      }

      if (dashboardResponse.ok) {
        const dashboardResult =
          await dashboardResponse.json();

        const dashboardData =
          dashboardResult?.dashboard ||
          dashboardResult?.data?.dashboard ||
          dashboardResult?.data ||
          dashboardResult ||
          null;

        setDashboard(dashboardData);
      }
    } catch (err) {
      console.error(
        "Profile loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load teacher profile"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const teacher =
    profile ||
    dashboard?.teacher ||
    {};

  const assignedClass =
    classInfo ||
    dashboard?.class ||
    teacher?.class ||
    {};

  const username =
    teacher.username ||
    teacher.user_name ||
    profile?.username ||
    dashboard?.teacher?.username ||
    "teacher001";

  const name =
    teacher.name ||
    teacher.full_name ||
    teacher.staff_name ||
    teacher.teacher_name ||
    profile?.name ||
    username;

  const email =
    teacher.email ||
    teacher.email_address ||
    profile?.email ||
    "--";

  const phone =
    teacher.phone ||
    teacher.phone_number ||
    teacher.mobile ||
    profile?.phone ||
    "--";

  const role =
    teacher.role ||
    profile?.role ||
    "TEACHER";

  const department =
    teacher.department_name ||
    teacher.department ||
    assignedClass.department_name ||
    assignedClass.department ||
    "--";

  const departmentCode =
    teacher.department_code ||
    assignedClass.department_code ||
    "--";

  const year =
    assignedClass.year ||
    assignedClass.class_year ||
    teacher.year ||
    "--";

  const section =
    assignedClass.section ||
    assignedClass.class_section ||
    teacher.section ||
    "--";

  const className =
    assignedClass.class_name ||
    assignedClass.className ||
    assignedClass.name ||
    `Class ${year}`;

  const academicYear =
    assignedClass.academic_year ||
    teacher.academic_year ||
    dashboard?.academic_year ||
    "2026-27";

  const semester =
    assignedClass.semester ||
    teacher.semester ||
    dashboard?.semester ||
    "1";

  const assignmentStatus =
    assignedClass.status ||
    teacher.status ||
    "ACTIVE";

  const totalStudents =
    dashboard?.statistics?.total_students ??
    dashboard?.statistics?.totalStudents ??
    dashboard?.total_students ??
    dashboard?.totalStudents ??
    0;

  const subjectsCount =
    dashboard?.statistics?.total_subjects ??
    dashboard?.statistics?.totalSubjects ??
    dashboard?.total_subjects ??
    dashboard?.totalSubjects ??
    0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-48 rounded-3xl bg-slate-200" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="h-28 rounded-2xl bg-slate-200" />
              <div className="h-28 rounded-2xl bg-slate-200" />
              <div className="h-28 rounded-2xl bg-slate-200" />
            </div>

            <div className="h-96 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="overflow-hidden rounded-3xl bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-500 p-6 text-white shadow-lg md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold backdrop-blur">
                {name
                  ? name.charAt(0).toUpperCase()
                  : "T"}
              </div>

              <div>
                <p className="text-sm font-medium text-blue-100">
                  Class Teacher Profile
                </p>

                <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                  {name}
                </h1>

                <p className="mt-1 text-sm text-blue-100">
                  @{username}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchProfile(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              >
                ↻
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh Profile"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  Unable to load profile
                </p>

                <p className="mt-1">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  fetchProfile()
                }
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Account Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Username
            </p>

            <p className="mt-2 truncate text-lg font-bold text-slate-800">
              {username}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Role
            </p>

            <div className="mt-2">
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                {role}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Students
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-800">
              {totalStudents}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Subjects
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-800">
              {subjectsCount}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your teacher account information
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Full Name
              </p>

              <p className="mt-2 text-base font-semibold text-slate-800">
                {name}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Username
              </p>

              <p className="mt-2 text-base font-semibold text-slate-800">
                {username}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-2 break-all text-base font-semibold text-slate-800">
                {email}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Phone
              </p>

              <p className="mt-2 text-base font-semibold text-slate-800">
                {phone}
              </p>
            </div>
          </div>
        </div>

        {/* Department */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Department
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Department information
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Department
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {department}
              </p>
            </div>

            <div className="rounded-2xl bg-indigo-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Department Code
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {departmentCode}
              </p>
            </div>
          </div>
        </div>

        {/* Class Assignment */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Class Assignment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your current class teacher assignment
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${
                assignmentStatus
                  .toString()
                  .toUpperCase() ===
                "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {assignmentStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Class
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {className}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Year
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {year}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Section
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {section}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Academic Year
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {academicYear}
              </p>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Academic Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current academic assignment
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-2xl bg-cyan-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                Academic Year
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {academicYear}
              </p>
            </div>

            <div className="rounded-2xl bg-purple-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                Semester
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {semester}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                Assignment Status
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {assignmentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <div className="text-xl">
              ℹ️
            </div>

            <div>
              <h3 className="font-bold text-blue-900">
                Class Teacher Account
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                This profile belongs to the Class Teacher
                account. Your assigned class, students,
                attendance, timetable, staff and analytics
                are managed through this account.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ClassTeacherProfile;