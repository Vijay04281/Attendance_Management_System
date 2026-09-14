import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaSyncAlt,
  FaClock,
  FaBook,
  FaChalkboardTeacher,
  FaSchool,
  FaChevronRight,
  FaExclamationCircle,
  FaUserGraduate,
} from "react-icons/fa";

// =====================================================
// CONFIGURATION
// =====================================================

const API_URL = "https://attendance-management-system-gpci.onrender.com/api";

// =====================================================
// ROLE CONFIGURATION
// =====================================================

const STAFF_ROLES = [
  "ADMIN",
  "HOD",
  "STAFF",
  "TEACHER",
];

const STUDENT_ROLES = [
  "STUDENT",
];

// =====================================================
// HELPERS
// =====================================================

const DAY_ORDER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

// =====================================================
// GET USER ROLE
// =====================================================

const getUserRole = (user) => {
  if (!user) {
    return "";
  }

  return String(
    user?.role ||
      user?.user_role ||
      user?.userRole ||
      user?.type ||
      ""
  )
    .trim()
    .toUpperCase();
};

// =====================================================
// GET DAY
// =====================================================

const getDayValue = (item) =>
  item?.day_of_week ||
  item?.day ||
  item?.dayOfWeek ||
  "";

// =====================================================
// GET DAY NAME
// =====================================================

const getDayName = (day) => {
  if (!day) {
    return "-";
  }

  const value = String(day)
    .trim()
    .toLowerCase();

  const days = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  return days[value] || String(day);
};

// =====================================================
// FORMAT TIME
// =====================================================

const formatTime = (time) => {
  if (!time) {
    return "-";
  }

  const value = String(time);

  const parts = value.split(":");

  if (parts.length < 2) {
    return value;
  }

  let hour = parseInt(parts[0], 10);

  const minute = parts[1];

  if (Number.isNaN(hour)) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${period}`;
};

// =====================================================
// SUBJECT
// =====================================================

const getSubjectName = (item) =>
  item?.subject_name ||
  item?.subject ||
  item?.subjectName ||
  item?.name ||
  "-";

const getSubjectCode = (item) =>
  item?.subject_code ||
  item?.subjectCode ||
  "";

// =====================================================
// STAFF
// =====================================================

const getStaffName = (item) =>
  item?.staff_name ||
  item?.staff ||
  item?.staffName ||
  item?.teacher_name ||
  item?.teacherName ||
  "";

// =====================================================
// YEAR
// =====================================================

const getYear = (item) =>
  item?.year ||
  item?.class_year ||
  item?.classYear ||
  "";

// =====================================================
// SECTION
// =====================================================

const getSection = (item) =>
  item?.section ||
  item?.class_section ||
  item?.classSection ||
  "";

// =====================================================
// DEPARTMENT
// =====================================================

const getDepartment = (item) =>
  item?.department_name ||
  item?.department ||
  item?.departmentName ||
  item?.department_code ||
  item?.departmentCode ||
  "";

// =====================================================
// CLASS NAME
// =====================================================

const getClassName = (item) => {
  const department = getDepartment(item);
  const year = getYear(item);
  const section = getSection(item);

  const parts = [];

  if (department) {
    parts.push(department);
  }

  if (year) {
    parts.push(`Year ${year}`);
  }

  if (section) {
    parts.push(`Section ${section}`);
  }

  if (parts.length > 0) {
    return parts.join(" • ");
  }

  if (item?.class_name) {
    return item.class_name;
  }

  if (item?.className) {
    return item.className;
  }

  if (item?.class_id) {
    return `Class ${item.class_id}`;
  }

  return "-";
};

// =====================================================
// STUDENT CLASS NAME
// =====================================================

const getStudentClassName = (item, user) => {
  const timetableClass = getClassName(item);

  if (timetableClass && timetableClass !== "-") {
    return timetableClass;
  }

  if (user?.class_name) {
    return user.class_name;
  }

  if (user?.className) {
    return user.className;
  }

  const department =
    user?.department ||
    user?.department_name ||
    "";

  const year =
    user?.year ||
    user?.class_year ||
    "";

  const section =
    user?.section ||
    user?.class_section ||
    "";

  const parts = [];

  if (department) {
    parts.push(department);
  }

  if (year) {
    parts.push(`Year ${year}`);
  }

  if (section) {
    parts.push(`Section ${section}`);
  }

  return parts.length > 0
    ? parts.join(" • ")
    : "-";
};

// =====================================================
// RESPONSE LIST
// =====================================================

const extractTimetableList = (data) => {
  if (Array.isArray(data?.timetables)) {
    return data.timetables;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
};

// =====================================================
// COMPONENT
// =====================================================

function StaffTimetable() {
  const [timetables, setTimetables] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [user, setUser] = useState(null);

  const [userRole, setUserRole] = useState("");

  // ===================================================
  // GET USER FROM LOCAL STORAGE
  // ===================================================

  const getLoggedInUser = () => {
    const userString =
      localStorage.getItem("user");

    if (!userString) {
      return null;
    }

    try {
      return JSON.parse(userString);
    } catch (error) {
      console.error(
        "Invalid user data:",
        error
      );

      return null;
    }
  };

  // ===================================================
  // GET TIMETABLE ENDPOINT
  // ===================================================

  const getTimetableEndpoint = (role) => {
    const normalizedRole = String(role || "")
      .trim()
      .toUpperCase();

    // -------------------------------------------------
    // STUDENT
    // -------------------------------------------------

    if (
      STUDENT_ROLES.includes(
        normalizedRole
      )
    ) {
      return "/timetables/student";
    }

    // -------------------------------------------------
    // STAFF / ADMIN / HOD / TEACHER
    // -------------------------------------------------

    if (
      STAFF_ROLES.includes(
        normalizedRole
      )
    ) {
      return "/timetables/staff";
    }

    // -------------------------------------------------
    // UNKNOWN ROLE
    // -------------------------------------------------

    return null;
  };

  // ===================================================
  // FETCH TIMETABLE
  // ===================================================

  const fetchTimetable = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      // ------------------------------------------------
      // TOKEN
      // ------------------------------------------------

      const token =
        localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "You are not logged in. Please login again."
        );
      }

      // ------------------------------------------------
      // USER
      // ------------------------------------------------

      const loggedUser =
        getLoggedInUser();

      if (!loggedUser) {
        throw new Error(
          "User information is missing. Please login again."
        );
      }

      setUser(loggedUser);

      const role =
        getUserRole(loggedUser);

      setUserRole(role);

      console.log(
        "Logged-in user:",
        loggedUser
      );

      console.log(
        "Logged-in role:",
        role
      );

      // ------------------------------------------------
      // ENDPOINT
      // ------------------------------------------------

      const endpoint =
        getTimetableEndpoint(role);

      if (!endpoint) {
        throw new Error(
          `Unsupported user role: ${role || "UNKNOWN"}`
        );
      }

      console.log(
        "Timetable endpoint:",
        `${API_URL}${endpoint}`
      );

      // ------------------------------------------------
      // REQUEST
      // ------------------------------------------------

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "GET",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      let data = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          "Timetable JSON error:",
          jsonError
        );

        throw new Error(
          "Invalid response received from timetable server."
        );
      }

      console.log(
        "Timetable API response:",
        data
      );

      // ------------------------------------------------
      // HTTP ERROR
      // ------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Failed to fetch timetable. Status: ${response.status}`
        );
      }

      // ------------------------------------------------
      // TIMETABLE LIST
      // ------------------------------------------------

      const timetableList =
        extractTimetableList(data);

      console.log(
        "Timetable records:",
        timetableList.length
      );

      setTimetables(
        Array.isArray(timetableList)
          ? timetableList
          : []
      );
    } catch (err) {
      console.error(
        "Timetable error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load your timetable."
      );

      setTimetables([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchTimetable();
  }, []);

  // ===================================================
  // SORT TIMETABLE
  // ===================================================

  const sortedTimetables = useMemo(() => {
    return [...timetables].sort(
      (a, b) => {
        const dayA =
          DAY_ORDER[
            String(
              getDayValue(a)
            )
              .trim()
              .toLowerCase()
          ] || 99;

        const dayB =
          DAY_ORDER[
            String(
              getDayValue(b)
            )
              .trim()
              .toLowerCase()
          ] || 99;

        if (dayA !== dayB) {
          return dayA - dayB;
        }

        const timeA =
          a?.start_time ||
          a?.startTime ||
          "";

        const timeB =
          b?.start_time ||
          b?.startTime ||
          "";

        return String(
          timeA
        ).localeCompare(
          String(timeB)
        );
      }
    );
  }, [timetables]);

  // ===================================================
  // TODAY
  // ===================================================

  const todayName = new Date()
    .toLocaleDateString(
      "en-US",
      {
        weekday: "long",
      }
    )
    .toLowerCase();

  const todayClasses =
    useMemo(() => {
      return sortedTimetables.filter(
        (item) =>
          String(
            getDayValue(item)
          )
            .trim()
            .toLowerCase() ===
          todayName
      );
    }, [
      sortedTimetables,
      todayName,
    ]);

  // ===================================================
  // ACTIVE DAYS
  // ===================================================

  const activeDays = useMemo(() => {
    const days = new Set();

    timetables.forEach(
      (item) => {
        const day =
          getDayValue(item);

        if (day) {
          days.add(
            String(day)
              .trim()
              .toLowerCase()
          );
        }
      }
    );

    return days.size;
  }, [timetables]);

  // ===================================================
  // UNIQUE SUBJECTS
  // ===================================================

  const uniqueSubjects =
    useMemo(() => {
      const subjects =
        new Set();

      timetables.forEach(
        (item) => {
          const subjectId =
            item?.subject_id ||
            getSubjectCode(item) ||
            getSubjectName(item);

          if (subjectId) {
            subjects.add(
              String(subjectId)
            );
          }
        }
      );

      return subjects.size;
    }, [timetables]);

  // ===================================================
  // UNIQUE CLASSES
  // ===================================================

  const uniqueClasses =
    useMemo(() => {
      const classes =
        new Set();

      timetables.forEach(
        (item) => {
          const classId =
            item?.class_id ||
            getClassName(item);

          if (classId) {
            classes.add(
              String(classId)
            );
          }
        }
      );

      return classes.size;
    }, [timetables]);

  // ===================================================
  // DAY COUNT
  // ===================================================

  const getDayCount = (
    day
  ) => {
    return timetables.filter(
      (item) =>
        String(
          getDayValue(item)
        )
          .trim()
          .toLowerCase() ===
        day
    ).length;
  };

  // ===================================================
  // USER DISPLAY
  // ===================================================

  const displayName =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    "User";

  // ===================================================
  // IS STUDENT
  // ===================================================

  const isStudent =
    userRole === "STUDENT";

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">

                {isStudent ? (
                  <FaUserGraduate className="text-2xl" />
                ) : (
                  <FaCalendarAlt className="text-2xl" />
                )}

              </div>

              <div>

                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Academic Schedule
                </p>

                <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                  My Timetable
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {isStudent
                    ? "View your class timetable"
                    : "View all your assigned teaching schedules"}
                </p>

                {user && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">

                    <p className="text-sm font-medium text-slate-700">
                      {displayName}
                    </p>

                    {userRole && (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                        {userRole}
                      </span>
                    )}

                  </div>
                )}

              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchTimetable(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <FaSyncAlt
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}

            </button>

          </div>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          {/* Total Periods */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Periods
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {timetables.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Weekly timetable
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FaCalendarAlt />
              </div>

            </div>

          </div>

          {/* Active Days */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Active Days
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {activeDays}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Teaching days
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FaClock />
              </div>

            </div>

          </div>

          {/* Subjects */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Subjects
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {uniqueSubjects}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {isStudent
                    ? "Class subjects"
                    : "Assigned subjects"}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FaBook />
              </div>

            </div>

          </div>

          {/* Classes */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Classes
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {uniqueClasses}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {isStudent
                    ? "Your class"
                    : "Assigned classes"}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <FaSchool />
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            DAY SUMMARY
        ================================================= */}

        {timetables.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Weekly Overview
                </h2>

                <p className="text-sm text-slate-500">
                  {isStudent
                    ? "Your classes by day"
                    : "Your teaching periods by day"}
                </p>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">

              {Object.keys(
                DAY_ORDER
              ).map((day) => {

                const count =
                  getDayCount(day);

                const isToday =
                  day === todayName;

                return (
                  <div
                    key={day}
                    className={`rounded-xl border p-3 text-center transition ${
                      isToday
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >

                    <p
                      className={`text-xs font-semibold uppercase ${
                        isToday
                          ? "text-indigo-600"
                          : "text-slate-500"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-800">
                      {count}
                    </p>

                    <p className="text-[11px] text-slate-500">
                      {count === 1
                        ? "period"
                        : "periods"}
                    </p>

                  </div>
                );
              })}

            </div>
          </div>
        )}

        {/* =================================================
            TODAY
        ================================================= */}

        {!loading &&
          !error &&
          todayClasses.length > 0 && (

            <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                    <h2 className="text-lg font-bold text-slate-800">
                      Today's Classes
                    </h2>

                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {isStudent
                      ? "Your scheduled classes for today"
                      : "Your scheduled teaching classes for today"}
                  </p>

                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {todayClasses.length}{" "}
                  {todayClasses.length === 1
                    ? "Class"
                    : "Classes"}
                </span>

              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">

                {todayClasses.map(
                  (item, index) => (

                    <div
                      key={
                        item?.timetable_id ||
                        `${item?.subject_id}-${item?.class_id}-${index}`
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <p className="truncate text-sm font-bold text-slate-800">
                            {getSubjectName(item)}
                          </p>

                          {getSubjectCode(
                            item
                          ) && (
                            <p className="mt-1 text-xs font-medium text-indigo-600">
                              {getSubjectCode(
                                item
                              )}
                            </p>
                          )}

                        </div>

                        <div className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                          {formatTime(
                            item?.start_time ||
                              item?.startTime
                          )}
                        </div>

                      </div>

                      <div className="mt-3 space-y-2">

                        <div className="flex items-center gap-2 text-xs text-slate-600">

                          <FaSchool className="text-indigo-500" />

                          <span>
                            {isStudent
                              ? getStudentClassName(
                                  item,
                                  user
                                )
                              : getClassName(
                                  item
                                )}
                          </span>

                        </div>

                        {(item?.end_time ||
                          item?.endTime) && (

                          <div className="flex items-center gap-2 text-xs text-slate-600">

                            <FaClock className="text-emerald-500" />

                            <span>

                              {formatTime(
                                item?.start_time ||
                                  item?.startTime
                              )}

                              {" - "}

                              {formatTime(
                                item?.end_time ||
                                  item?.endTime
                              )}

                            </span>

                          </div>

                        )}

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>
          )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <FaExclamationCircle />
              </div>

              <div className="flex-1">

                <h3 className="font-semibold text-red-800">
                  Unable to load timetable
                </h3>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    fetchTimetable()
                  }
                  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  Try Again
                </button>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

            <p className="text-sm font-medium text-slate-700">
              Loading your timetable...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Please wait
            </p>

          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          timetables.length === 0 && (

            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">

                {isStudent ? (
                  <FaUserGraduate className="text-2xl" />
                ) : (
                  <FaCalendarAlt className="text-2xl" />
                )}

              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-800">
                No Timetable Found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

                {isStudent
                  ? "No timetable periods have been assigned to your class yet. Please contact your class teacher or administrator."
                  : "No timetable periods have been assigned to you yet. Please contact the administrator or HOD if you believe your timetable is missing."}

              </p>

              <button
                type="button"
                onClick={() =>
                  fetchTimetable()
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >

                <FaSyncAlt />

                Refresh Timetable

              </button>

            </div>
          )}

        {/* =================================================
            DESKTOP TIMETABLE
        ================================================= */}

        {!loading &&
          !error &&
          timetables.length > 0 && (

            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">

              <div className="border-b border-slate-200 px-6 py-5">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-lg font-bold text-slate-800">
                      Complete Weekly Timetable
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">

                      {isStudent
                        ? "All subjects scheduled for your class"
                        : "All subjects and classes assigned to you"}

                    </p>

                  </div>

                  <div className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                    {timetables.length} Periods
                  </div>

                </div>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-250">

                  <thead>

                    <tr className="border-b border-slate-200 bg-slate-50">

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        #
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Day
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Time
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Subject
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Class
                      </th>

                      {!isStudent && (
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Staff
                        </th>
                      )}

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {sortedTimetables.map(
                      (item, index) => {

                        const itemDay =
                          String(
                            getDayValue(item)
                          )
                            .trim()
                            .toLowerCase();

                        const isToday =
                          itemDay ===
                          todayName;

                        return (

                          <tr
                            key={
                              item?.timetable_id ||
                              `${item?.subject_id}-${item?.class_id}-${index}`
                            }
                            className={`transition hover:bg-slate-50 ${
                              isToday
                                ? "bg-indigo-50/30"
                                : "bg-white"
                            }`}
                          >

                            <td className="px-5 py-4 text-sm font-semibold text-slate-400">
                              {index + 1}
                            </td>

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-2">

                                {isToday && (
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                )}

                                <span
                                  className={`text-sm font-semibold ${
                                    isToday
                                      ? "text-indigo-700"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {getDayName(
                                    getDayValue(
                                      item
                                    )
                                  )}
                                </span>

                              </div>

                            </td>

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-2">

                                <FaClock className="text-slate-400" />

                                <div>

                                  <p className="text-sm font-semibold text-slate-700">
                                    {formatTime(
                                      item?.start_time ||
                                        item?.startTime
                                    )}
                                  </p>

                                  {(item?.end_time ||
                                    item?.endTime) && (

                                    <p className="text-xs text-slate-400">

                                      to{" "}

                                      {formatTime(
                                        item?.end_time ||
                                          item?.endTime
                                      )}

                                    </p>

                                  )}

                                </div>

                              </div>

                            </td>

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">

                                  <FaBook className="text-sm" />

                                </div>

                                <div>

                                  <p className="text-sm font-semibold text-slate-800">
                                    {getSubjectName(
                                      item
                                    )}
                                  </p>

                                  {getSubjectCode(
                                    item
                                  ) && (

                                    <p className="mt-0.5 text-xs font-medium text-indigo-600">
                                      {getSubjectCode(
                                        item
                                      )}
                                    </p>

                                  )}

                                </div>

                              </div>

                            </td>

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-2">

                                <FaSchool className="text-slate-400" />

                                <span className="text-sm text-slate-700">

                                  {isStudent
                                    ? getStudentClassName(
                                        item,
                                        user
                                      )
                                    : getClassName(
                                        item
                                      )}

                                </span>

                              </div>

                            </td>

                            {!isStudent && (

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-2">

                                  <FaChalkboardTeacher className="text-slate-400" />

                                  <span className="text-sm text-slate-700">

                                    {getStaffName(
                                      item
                                    ) ||
                                      displayName ||
                                      "You"}

                                  </span>

                                </div>

                              </td>

                            )}

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}

        {/* =================================================
            MOBILE TIMETABLE
        ================================================= */}

        {!loading &&
          !error &&
          timetables.length > 0 && (

            <div className="space-y-4 lg:hidden">

              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

                <h2 className="text-lg font-bold text-slate-800">
                  Complete Weekly Timetable
                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {isStudent
                    ? "All classes scheduled for you"
                    : "All your assigned teaching periods"}

                </p>

              </div>

              {sortedTimetables.map(
                (item, index) => {

                  const itemDay =
                    String(
                      getDayValue(item)
                    )
                      .trim()
                      .toLowerCase();

                  const isToday =
                    itemDay ===
                    todayName;

                  return (

                    <div
                      key={
                        item?.timetable_id ||
                        `${item?.subject_id}-${item?.class_id}-${index}`
                      }
                      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${
                        isToday
                          ? "ring-indigo-200"
                          : "ring-slate-200"
                      }`}
                    >

                      {/* Day + Time */}

                      <div className="flex items-center justify-between gap-3">

                        <div className="flex items-center gap-2">

                          {isToday && (
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          )}

                          <span
                            className={`text-sm font-bold ${
                              isToday
                                ? "text-indigo-700"
                                : "text-slate-700"
                            }`}
                          >
                            {getDayName(
                              getDayValue(
                                item
                              )
                            )}
                          </span>

                        </div>

                        <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">

                          {formatTime(
                            item?.start_time ||
                              item?.startTime
                          )}

                          {(item?.end_time ||
                            item?.endTime) && (
                            <>
                              {" - "}
                              {formatTime(
                                item?.end_time ||
                                  item?.endTime
                              )}
                            </>
                          )}

                        </div>

                      </div>

                      {/* Subject */}

                      <div className="mt-4 flex items-start gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

                          {isStudent ? (
                            <FaBook />
                          ) : (
                            <FaBook />
                          )}

                        </div>

                        <div className="min-w-0 flex-1">

                          <h3 className="text-base font-bold text-slate-800">
                            {getSubjectName(
                              item
                            )}
                          </h3>

                          {getSubjectCode(
                            item
                          ) && (

                            <p className="mt-1 text-xs font-semibold text-indigo-600">
                              {getSubjectCode(
                                item
                              )}
                            </p>

                          )}

                        </div>

                      </div>

                      {/* Class */}

                      <div className="mt-4 rounded-xl bg-slate-50 p-3">

                        <div className="flex items-start gap-3">

                          <FaSchool className="mt-0.5 text-indigo-500" />

                          <div>

                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              Class
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">

                              {isStudent
                                ? getStudentClassName(
                                    item,
                                    user
                                  )
                                : getClassName(
                                    item
                                  )}

                            </p>

                          </div>

                        </div>

                      </div>

                      {/* Staff */}

                      {!isStudent && (

                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">

                          <FaChalkboardTeacher />

                          <span>
                            {getStaffName(
                              item
                            ) ||
                              displayName ||
                              "You"}
                          </span>

                        </div>

                      )}

                      {/* Footer */}

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

                        <div className="flex items-center gap-2 text-xs text-slate-500">

                          {isStudent ? (
                            <FaUserGraduate />
                          ) : (
                            <FaChalkboardTeacher />
                          )}

                          <span>
                            {isStudent
                              ? "Student Timetable"
                              : "Teaching Timetable"}
                          </span>

                        </div>

                        <FaChevronRight className="text-xs text-slate-300" />

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

      </div>
    </div>
  );
}

export default StaffTimetable;