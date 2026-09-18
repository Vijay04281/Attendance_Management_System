import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// =====================================================
// DASHBOARD PAGES
// =====================================================

import HodDashboard from "./pages/HodDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ClassTeacherDashboard from "./pages/ClassTeacherDashboard";

// =====================================================
// ADMIN PAGES
// =====================================================

import AdminDashboard from "./pages/AdminDashboard";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminTimetable from "./pages/admin/AdminTimetable";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminSubjectAllocations from "./pages/admin/AdminSubjectAllocations";
import AdminClassTeacherAssignments from "./pages/admin/AdminClassTeacherAssignments";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminAttendanceSessions from "./pages/admin/AdminAttendanceSessions";
import AdminAttendanceRecords from "./pages/admin/AdminAttendanceRecords";
import AdminAttendanceReports from "./pages/admin/AdminAttendanceReports";
import AdminQRCodes from "./pages/admin/AdminQRCodes";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";

// =====================================================
// CLASS TEACHER PAGES
// =====================================================

import ClassTeacherClass from "./pages/ClassTeacherClass";
import ClassTeacherStudents from "./pages/ClassTeacherStudents";
import ClassTeacherAttendance from "./pages/ClassTeacherAttendance";
import ClassTeacherAbsent from "./pages/ClassTeacherAbsent";
import ClassTeacherSubjects from "./pages/ClassTeacherSubjects";
import ClassTeacherReports from "./pages/ClassTeacherReports";
import ClassTeacherAnalytics from "./pages/ClassTeacherAnalytics";
import ClassTeacherStaff from "./pages/ClassTeacherStaff";
import ClassTeacherTimetable from "./pages/ClassTeacherTimetable";
import ClassTeacherProfile from "./pages/ClassTeacherProfile";

// =====================================================
// HOD DEPARTMENT PAGES
// =====================================================

import HodDepartmentStudents from "./pages/hod/HodDepartmentStudents";
import HodDepartmentStaff from "./pages/hod/HodDepartmentStaff";
import HodDepartmentSubjects from "./pages/hod/HodDepartmentSubjects";
import HodDepartmentTimetable from "./pages/hod/HodDepartmentTimetable";
import HodDepartmentAttendance from "./pages/hod/HodDepartmentAttendance";

// =====================================================
// HOD ATTENDANCE REPORT PAGES
// =====================================================

import HodDailyAttendance from "./pages/hod/HodDailyAttendance";
import HodSubjectAttendance from "./pages/hod/HodSubjectAttendance";
import HodClassAttendance from "./pages/hod/HodClassAttendance";
import HodStudentAttendance from "./pages/hod/HodStudentAttendance";
import HodDepartmentAttendanceReport from "./pages/hod/HodDepartmentAttendanceReport";
import HodAttendancePercentage from "./pages/hod/HodAttendancePercentage";

// =====================================================
// HOD YEAR 2 PAGES
// =====================================================

import HodYear2Students from "./pages/hod/HodYear2Students";
import HodYear2Subjects from "./pages/hod/HodYear2Subjects";
import HodYear2Timetable from "./pages/hod/HodYear2Timetable";
import HodYear2Attendance from "./pages/hod/HodYear2Attendance";

// =====================================================
// HOD YEAR 3 PAGES
// =====================================================

import HodYear3Students from "./pages/hod/HodYear3Students";
import HodYear3Subjects from "./pages/hod/HodYear3Subjects";
import HodYear3Timetable from "./pages/hod/HodYear3Timetable";
import HodYear3Attendance from "./pages/hod/HodYear3Attendance";

// =====================================================
// STAFF PAGES
// =====================================================

import StaffStudents from "./pages/StaffStudents";
import StaffClasses from "./pages/StaffClasses";
import Timetable from "./pages/Timetable";
import Attendance from "./pages/Attendance";
import StartAttendance from "./pages/StartAttendance";

// =====================================================
// STUDENT PAGES
// =====================================================

import StudentAttendance from "./pages/StudentAttendance";
import ScanQR from "./pages/ScanQR";

// =====================================================
// LAYOUT
// =====================================================

import DashboardLayout from "./layouts/DashboardLayout";

// =====================================================
// ROLE HELPER
// =====================================================

function getUserRole(user) {
  if (!user) {
    return "";
  }

  const possibleRole =
    user.role ??
    user.user_role ??
    user.userRole ??
    user.type ??
    user.account_role ??
    user.accountRole ??
    "";

  const role = String(possibleRole)
    .trim()
    .toUpperCase();

  if (
    role === "TEACHING_STAFF" ||
    role === "TEACHING STAFF"
  ) {
    return "TEACHER";
  }

  if (
    role === "CLASS_TEACHER" ||
    role === "CLASS TEACHER"
  ) {
    return "TEACHER";
  }

  return role;
}

// =====================================================
// NORMALIZE ALLOWED ROLE
// =====================================================

function normalizeAllowedRole(role) {
  const normalized = String(role || "")
    .trim()
    .toUpperCase();

  if (
    normalized === "TEACHING_STAFF" ||
    normalized === "TEACHING STAFF"
  ) {
    return "TEACHER";
  }

  if (
    normalized === "CLASS_TEACHER" ||
    normalized === "CLASS TEACHER"
  ) {
    return "TEACHER";
  }

  return normalized;
}

// =====================================================
// DASHBOARD REDIRECT
// =====================================================

function getDashboardPath(role) {
  const normalizedRole =
    normalizeAllowedRole(role);

  switch (normalizedRole) {
    case "ADMIN":
      return "/admin";

    case "TEACHER":
      return "/class-teacher";

    case "STAFF":
      return "/staff";

    case "HOD":
      return "/hod";

    case "STUDENT":
      return "/student";

    default:
      return "/";
  }
}

// =====================================================
// LOGIN PAGE
// =====================================================

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (!username.trim()) {
        throw new Error("Username is required.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      // =================================================
      // PRODUCTION LOGIN API
      // =================================================

      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
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
        "LOGIN RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid username or password"
        );
      }

      if (!data.token) {
        throw new Error(
          "Login successful, but access token was not received."
        );
      }

      if (!data.user) {
        throw new Error(
          "Login successful, but user information was not received."
        );
      }

      const role =
        getUserRole(data.user);

      console.log(
        "LOGIN USER:",
        data.user
      );

      console.log(
        "NORMALIZED ROLE:",
        role
      );

      // =================================================
      // ROLE REQUIRED
      // =================================================

      if (!role) {
        console.error(
          "No role found:",
          data.user
        );

        setError(
          "Login successful, but user role was not found."
        );

        return;
      }

      // =================================================
      // VALID ROLES
      // =================================================

      const validRoles = [
        "ADMIN",
        "STAFF",
        "TEACHER",
        "HOD",
        "STUDENT",
      ];

      if (!validRoles.includes(role)) {
        console.error(
          "Unknown user role:",
          role,
          data.user
        );

        setError(
          `Unknown user role: ${role}`
        );

        return;
      }

      // =================================================
      // SAVE TOKEN
      // =================================================

      localStorage.setItem(
        "token",
        data.token
      );

      // =================================================
      // SAVE USER
      // =================================================

      const userToStore = {
        ...data.user,
        role,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(userToStore)
      );

      console.log(
        "USER SAVED:",
        userToStore
      );

      // =================================================
      // REDIRECT
      // =================================================

      const dashboardPath =
        getDashboardPath(role);

      console.log(
        "REDIRECTING TO:",
        dashboardPath
      );

      window.location.href =
        dashboardPath;

    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        err.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

      <div className="w-full max-w-md">

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">

          {/* LOGO */}

          <div className="mb-6 flex justify-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg">
              A
            </div>

          </div>

          {/* TITLE */}

          <div className="mb-8 text-center">

            <h1 className="text-3xl font-bold text-slate-800">
              Attendance System
            </h1>

            <p className="mt-2 text-slate-500">
              Sign in to continue
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* LOGIN FORM */}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* USERNAME */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="Enter username"
                required
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* PASSWORD */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

          {/* FOOTER */}

          <p className="mt-7 text-center text-xs text-slate-400">
            Attendance Management System
          </p>

        </div>

      </div>

    </div>
  );
}

// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({
  children,
  role,
  allowedRoles,
}) {
  const token =
    localStorage.getItem("token");

  const userString =
    localStorage.getItem("user");

  if (!token || !userString) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  let user;

  try {
    user =
      JSON.parse(userString);
  } catch (error) {
    console.error(
      "Invalid stored user:",
      error
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const normalizedRole =
    getUserRole(user);

  if (!normalizedRole) {
    console.error(
      "Stored user has no role:",
      user
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  let roles = [];

  if (role) {
    roles.push(
      normalizeAllowedRole(role)
    );
  }

  if (Array.isArray(allowedRoles)) {
    roles = [
      ...roles,
      ...allowedRoles.map(
        normalizeAllowedRole
      ),
    ];
  }

  roles = [
    ...new Set(roles),
  ];

  if (
    roles.length > 0 &&
    !roles.includes(normalizedRole)
  ) {
    console.warn(
      "Protected route denied:",
      {
        userRole:
          normalizedRole,

        allowedRoles:
          roles,

        path:
          window.location.pathname,
      }
    );

    return (
      <Navigate
        to={getDashboardPath(
          normalizedRole
        )}
        replace
      />
    );
  }

  return children;
}

// =====================================================
// ADMIN PLACEHOLDER PAGE
// =====================================================

function AdminModulePage({
  title,
  description,
}) {
  const location =
    useLocation();

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mb-8">

        <p className="mb-1 text-sm font-medium text-indigo-600">
          Administration
        </p>

        <h1 className="text-3xl font-bold text-slate-800">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        <h2 className="text-xl font-bold text-slate-800">
          {title}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          This Admin module is connected and protected.
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Current Route
          </p>

          <p className="mt-1 break-all text-sm font-semibold text-indigo-600">
            {location.pathname}
          </p>

        </div>

      </div>

    </div>
  );
}

// =====================================================
// MAIN APP
// =====================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}

        <Route
          path="/"
          element={<Login />}
        />

        {/* ADMIN */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminDepartments />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminStaff />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminStudents />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminClasses />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminSubjects />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/subject-allocations"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminSubjectAllocations />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/class-teacher-assignments"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminClassTeacherAssignments />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/timetable"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminTimetable />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance/sessions"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminAttendanceSessions />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance/records"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminAttendanceRecords />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance/reports"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminAttendanceReports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/qr-codes"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminQRCodes />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminNotifications />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute role="ADMIN">
              <DashboardLayout>
                <AdminAuditLogs />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ADMIN → HOD */}

        <Route
          path="/admin/departments/computer-science/hod"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/departments/information-technology/hod"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/departments/electronics/hod"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* HOD */}

        <Route
          path="/hod"
          element={
            <ProtectedRoute role="HOD">
              <DashboardLayout>
                <HodDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/students"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDepartmentStudents />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/staff"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDepartmentStaff />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/subjects"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDepartmentSubjects />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/timetable"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDepartmentTimetable />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/attendance"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDepartmentAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/reports/daily"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDailyAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/reports/subject"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodSubjectAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/reports/class"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodClassAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/reports/student"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodStudentAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/reports/department"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodDepartmentAttendanceReport />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/reports/percentage"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodAttendancePercentage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* HOD YEAR 2 */}

        <Route
          path="/hod/:department/year/2/students"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodYear2Students />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/year/2/subjects"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodYear2Subjects />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/year/2/timetable"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodYear2Timetable />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/year/2/attendance"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodYear2Attendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* HOD YEAR 3 */}

        <Route
          path="/hod/:department/year/3/students"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodYear3Students />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/year/3/subjects"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodYear3Subjects />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/year/3/timetable"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodYear3Timetable />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/:department/year/3/attendance"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HOD",
              ]}
            >
              <DashboardLayout>
                <HodYear3Attendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/timetable"
          element={
            <ProtectedRoute role="HOD">
              <DashboardLayout>
                <Timetable />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* STAFF */}

        <Route
          path="/staff"
          element={
            <ProtectedRoute role="STAFF">
              <DashboardLayout>
                <StaffDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/students"
          element={
            <ProtectedRoute role="STAFF">
              <DashboardLayout>
                <StaffStudents />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/classes"
          element={
            <ProtectedRoute role="STAFF">
              <DashboardLayout>
                <StaffClasses />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/timetable"
          element={
            <ProtectedRoute role="STAFF">
              <DashboardLayout>
                <Timetable />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/attendance"
          element={
            <ProtectedRoute role="STAFF">
              <DashboardLayout>
                <Attendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/start-attendance"
          element={
            <ProtectedRoute role="STAFF">
              <DashboardLayout>
                <StartAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/reports"
          element={
            <ProtectedRoute role="STAFF">
              <DashboardLayout>
                <Attendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance-reports"
          element={
            <ProtectedRoute role="STAFF">
              <DashboardLayout>
                <Attendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* CLASS TEACHER */}

        <Route
          path="/class-teacher"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teacher/class"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherClass />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teacher/students"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherStudents />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teacher/attendance"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teacher/absent"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherAbsent />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teacher/subjects"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherSubjects />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teacher/reports"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherReports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teacher/analytics"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherAnalytics />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teacher/staff"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherStaff />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teacher/timetable"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherTimetable />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teacher/profile"
          element={
            <ProtectedRoute role="TEACHER">
              <DashboardLayout>
                <ClassTeacherProfile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* STUDENT */}

        <Route
          path="/student"
          element={
            <ProtectedRoute role="STUDENT">
              <DashboardLayout>
                <StudentDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/timetable"
          element={
            <ProtectedRoute role="STUDENT">
              <DashboardLayout>
                <Timetable />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute role="STUDENT">
              <DashboardLayout>
                <StudentAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/scan-qr"
          element={
            <ProtectedRoute role="STUDENT">
              <DashboardLayout>
                <ScanQR />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* UNKNOWN ROUTE */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;