import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://attendance-management-system-gpci.onrender.com/api";

function StudentTimetable() {
  const [timetables, setTimetables] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");

  // =====================================================
  // FETCH TIMETABLE
  // Automatically selects API based on logged-in role
  // =====================================================

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");

      if (!token) {
        setError("You are not logged in. Please login again.");
        return;
      }

      // -------------------------------------------------
      // Get logged-in user
      // -------------------------------------------------

      let user = null;

      if (userString) {
        try {
          user = JSON.parse(userString);
        } catch (parseError) {
          console.error(
            "Invalid user data:",
            parseError
          );
        }
      }

      const role = String(user?.role || "")
        .trim()
        .toUpperCase();

      setUserRole(role);

      // -------------------------------------------------
      // Select correct endpoint
      // -------------------------------------------------

      let endpoint = "/timetables";

      if (role === "STAFF") {
        endpoint = "/timetables/staff";
      } else if (role === "STUDENT") {
        endpoint = "/timetables/student";
      } else if (role === "HOD") {
        endpoint = "/timetables";
      }

      console.log("Logged-in role:", role);
      console.log("Timetable endpoint:", endpoint);

      // -------------------------------------------------
      // Request
      // -------------------------------------------------

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "Timetable API response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to fetch timetable"
        );
      }

      // -------------------------------------------------
      // Student information
      // -------------------------------------------------

      if (role === "STUDENT") {
        setStudent(data.student || null);
      } else {
        setStudent(null);
      }

      // -------------------------------------------------
      // Timetable data
      // -------------------------------------------------

      if (Array.isArray(data.timetables)) {
        setTimetables(data.timetables);
      } else if (Array.isArray(data.data)) {
        setTimetables(data.data);
      } else if (Array.isArray(data)) {
        setTimetables(data);
      } else {
        setTimetables([]);
      }

    } catch (err) {
      console.error(
        "Timetable error:",
        err
      );

      setError(
        err.message ||
        "Unable to load timetable"
      );

      setTimetables([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GET DAY
  // =====================================================

  const getDayValue = (item) => {
    return (
      item.day_of_week ||
      item.day ||
      item.dayOfWeek ||
      ""
    );
  };

  // =====================================================
  // DAY NAME
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

    return days[value] || day;
  };

  // =====================================================
  // TIME FORMAT
  // =====================================================

  const formatTime = (time) => {
    if (!time) {
      return "-";
    }

    const parts = String(time).split(":");

    if (parts.length < 2) {
      return time;
    }

    let hour = parseInt(parts[0], 10);
    const minute = parts[1];

    if (Number.isNaN(hour)) {
      return time;
    }

    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${hour}:${minute} ${period}`;
  };

  // =====================================================
  // GET SUBJECT
  // =====================================================

  const getSubject = (item) => {
    return (
      item.subject_name ||
      item.subject ||
      item.subjectName ||
      "-"
    );
  };

  // =====================================================
  // GET SUBJECT CODE
  // =====================================================

  const getSubjectCode = (item) => {
    return (
      item.subject_code ||
      item.subjectCode ||
      ""
    );
  };

  // =====================================================
  // GET STAFF
  // =====================================================

  const getStaff = (item) => {
    return (
      item.staff_name ||
      item.staff ||
      item.staffName ||
      "-"
    );
  };

  // =====================================================
  // DAY ORDER
  // =====================================================

  const dayOrder = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
  };

  // =====================================================
  // SORT TIMETABLE
  // =====================================================

  const sortedTimetables = useMemo(() => {
    return [...timetables].sort((a, b) => {
      const dayA =
        dayOrder[
          String(getDayValue(a))
            .toLowerCase()
            .trim()
        ] || 99;

      const dayB =
        dayOrder[
          String(getDayValue(b))
            .toLowerCase()
            .trim()
        ] || 99;

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      const timeA =
        a.start_time ||
        a.startTime ||
        "";

      const timeB =
        b.start_time ||
        b.startTime ||
        "";

      return String(timeA).localeCompare(
        String(timeB)
      );
    });
  }, [timetables]);

  // =====================================================
  // DAY COUNT
  // =====================================================

  const getDayCount = (day) => {
    return timetables.filter(
      (item) =>
        String(getDayValue(item))
          .toLowerCase()
          .trim() === day
    ).length;
  };

  // =====================================================
  // ACTIVE DAYS
  // =====================================================

  const activeDays = useMemo(() => {
    const days = new Set();

    timetables.forEach((item) => {
      const day = getDayValue(item);

      if (day) {
        days.add(
          String(day)
            .toLowerCase()
            .trim()
        );
      }
    });

    return days.size;
  }, [timetables]);

  // =====================================================
  // TODAY
  // =====================================================

  const todayName = new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toLowerCase();

  const todayClasses = timetables.filter(
    (item) =>
      String(getDayValue(item))
        .toLowerCase()
        .trim() === todayName
  );

  // =====================================================
  // PAGE TITLE
  // =====================================================

  const getPageTitle = () => {
    if (userRole === "STAFF") {
      return "My Timetable";
    }

    if (userRole === "HOD") {
      return "Timetable";
    }

    return "My Timetable";
  };

  const getPageDescription = () => {
    if (userRole === "STAFF") {
      return "View your assigned teaching schedule";
    }

    if (userRole === "HOD") {
      return "View the academic timetable";
    }

    return "View your weekly class schedule";
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                📅
              </span>

              <span className="text-sm font-semibold text-indigo-600">
                Academic Schedule
              </span>

            </div>

            <h1 className="text-3xl font-bold text-slate-800">
              {getPageTitle()}
            </h1>

            <p className="mt-2 text-slate-500">
              {getPageDescription()}
            </p>

            {student && (
              <p className="mt-2 text-sm text-slate-400">
                {student.name || "Student"}

                {student.department &&
                  ` • ${student.department}`}

                {student.year &&
                  ` • Year ${student.year}`}

                {student.section &&
                  ` • Section ${student.section}`}
              </p>
            )}

          </div>

          <button
            type="button"
            onClick={fetchTimetable}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >

            <span>
              {loading ? "⏳" : "↻"}
            </span>

            {loading
              ? "Loading..."
              : "Refresh"}

          </button>

        </div>

      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {/* Total Classes */}

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Total Classes
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {timetables.length}
              </h2>

            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl">
              📚
            </div>

          </div>

          <p className="mt-4 text-xs text-slate-400">
            Classes scheduled
          </p>

        </div>

        {/* Active Days */}

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Active Days
              </p>

              <h2 className="mt-2 text-3xl font-bold text-blue-600">
                {activeDays}
              </h2>

            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
              🗓️
            </div>

          </div>

          <p className="mt-4 text-xs text-slate-400">
            Days with classes
          </p>

        </div>

        {/* Today */}

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Today
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {todayClasses.length}
              </h2>

            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-xl">
              📖
            </div>

          </div>

          <p className="mt-4 text-xs capitalize text-slate-400">
            {todayName}
          </p>

        </div>

        {/* Monday */}

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Monday
              </p>

              <h2 className="mt-2 text-3xl font-bold text-purple-600">
                {getDayCount("monday")}
              </h2>

            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-xl">
              📅
            </div>

          </div>

          <p className="mt-4 text-xs text-slate-400">
            Classes scheduled
          </p>

        </div>

      </div>

      {/* =================================================
          TODAY'S CLASSES
      ================================================= */}

      {!loading &&
        !error &&
        todayClasses.length > 0 && (

          <div className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold text-slate-800">
                  Today's Classes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your schedule for today
                </p>

              </div>

              <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                {todayClasses.length} Classes
              </span>

            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {todayClasses.map(
                (item, index) => (

                  <div
                    key={
                      item.timetable_id ||
                      item.id ||
                      `today-${index}`
                    }
                    className="rounded-xl bg-white p-5 shadow-sm"
                  >

                    <div className="mb-4 flex items-center justify-between">

                      <span className="rounded-lg bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        Period {index + 1}
                      </span>

                      <span className="text-sm font-medium text-slate-500">
                        {formatTime(
                          item.start_time ||
                          item.startTime
                        )}
                      </span>

                    </div>

                    <h3 className="text-lg font-semibold text-slate-800">
                      {getSubject(item)}
                    </h3>

                    {getSubjectCode(item) && (
                      <p className="mt-1 text-xs font-medium text-indigo-500">
                        {getSubjectCode(item)}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">

                      <span>
                        ⏰
                      </span>

                      <span>
                        {formatTime(
                          item.start_time ||
                          item.startTime
                        )}

                        {" - "}

                        {formatTime(
                          item.end_time ||
                          item.endTime
                        )}
                      </span>

                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                      <span>
                        👨‍🏫
                      </span>

                      <span>
                        {getStaff(item)}
                      </span>

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

            <div className="text-xl">
              ⚠️
            </div>

            <div className="flex-1">

              <h3 className="font-semibold text-red-800">
                Unable to load timetable
              </h3>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchTimetable}
                className="mt-3 text-sm font-semibold text-red-700 underline"
              >
                Try again
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>

          <p className="mt-5 font-medium text-slate-600">
            Loading timetable...
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Please wait
          </p>

        </div>

      ) : sortedTimetables.length === 0 &&
        !error ? (

        /* =================================================
           EMPTY
        ================================================= */

        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-4xl">
            📅
          </div>

          <h2 className="mt-6 text-xl font-semibold text-slate-800">
            No timetable found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            No timetable has been assigned yet.
            Please contact your administrator if
            you think this is incorrect.
          </p>

          <button
            type="button"
            onClick={fetchTimetable}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-700"
          >
            Refresh Timetable
          </button>

        </div>

      ) : (

        /* =================================================
           TIMETABLE
        ================================================= */

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          {/* Header */}

          <div className="border-b border-slate-100 px-6 py-5">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-lg font-semibold text-slate-800">
                  Weekly Schedule
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {userRole === "STAFF"
                    ? "Your assigned teaching classes"
                    : userRole === "HOD"
                    ? "Academic timetable"
                    : "Your assigned classes"}
                </p>

              </div>

              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                {sortedTimetables.length} total classes
              </div>

            </div>

          </div>

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden overflow-x-auto md:block">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    #
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Day
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Time
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Staff
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {sortedTimetables.map(
                  (item, index) => (

                    <tr
                      key={
                        item.timetable_id ||
                        item.id ||
                        index
                      }
                      className="transition hover:bg-slate-50"
                    >

                      {/* Number */}

                      <td className="px-6 py-5 text-sm text-slate-400">

                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}

                      </td>

                      {/* Day */}

                      <td className="px-6 py-5">

                        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">

                          {getDayName(
                            getDayValue(item)
                          )}

                        </span>

                      </td>

                      {/* Time */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-2">

                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm">
                            ⏰
                          </span>

                          <div>

                            <p className="text-sm font-semibold text-slate-700">

                              {formatTime(
                                item.start_time ||
                                item.startTime
                              )}

                            </p>

                            <p className="text-xs text-slate-400">

                              to{" "}

                              {formatTime(
                                item.end_time ||
                                item.endTime
                              )}

                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Subject */}

                      <td className="px-6 py-5">

                        <p className="font-semibold text-slate-800">
                          {getSubject(item)}
                        </p>

                        {getSubjectCode(item) && (
                          <p className="mt-1 text-xs text-indigo-500">
                            {getSubjectCode(item)}
                          </p>
                        )}

                      </td>

                      {/* Staff */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-2">

                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm">
                            👨‍🏫
                          </div>

                          <span className="text-sm text-slate-600">
                            {getStaff(item)}
                          </span>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {/* =================================================
              MOBILE
          ================================================= */}

          <div className="space-y-4 p-4 md:hidden">

            {sortedTimetables.map(
              (item, index) => (

                <div
                  key={
                    item.timetable_id ||
                    item.id ||
                    index
                  }
                  className="rounded-xl border border-slate-200 p-5 transition hover:border-indigo-200"
                >

                  {/* Top */}

                  <div className="mb-5 flex items-center justify-between">

                    <span className="text-sm font-semibold text-slate-400">

                      Class{" "}

                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}

                    </span>

                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">

                      {getDayName(
                        getDayValue(item)
                      )}

                    </span>

                  </div>

                  {/* Subject */}

                  <div className="mb-4">

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Subject
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-800">
                      {getSubject(item)}
                    </h3>

                    {getSubjectCode(item) && (
                      <p className="mt-1 text-xs font-medium text-indigo-500">
                        {getSubjectCode(item)}
                      </p>
                    )}

                  </div>

                  {/* Time */}

                  <div className="mb-4 rounded-xl bg-slate-50 p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                        ⏰
                      </div>

                      <div>

                        <p className="text-xs text-slate-400">
                          Time
                        </p>

                        <p className="text-sm font-semibold text-slate-700">

                          {formatTime(
                            item.start_time ||
                            item.startTime
                          )}

                          {" - "}

                          {formatTime(
                            item.end_time ||
                            item.endTime
                          )}

                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Staff */}

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                      👨‍🏫
                    </div>

                    <div>

                      <p className="text-xs text-slate-400">
                        Staff
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {getStaff(item)}
                      </p>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default StudentTimetable;
