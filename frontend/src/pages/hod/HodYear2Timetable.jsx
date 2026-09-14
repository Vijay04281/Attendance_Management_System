import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaCalendarAlt,
  FaPlus,
  FaSyncAlt,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

const HodYear2Timetable = () => {
  const { department } = useParams();

  const [timetables, setTimetables] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedDay, setSelectedDay] =
    useState("ALL");

  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const departmentName =
    user?.department ||
    user?.department_name ||
    user?.departmentName ||
    (department === "computer-science"
      ? "Computer Science"
      : department === "information-technology"
      ? "Information Technology"
      : department === "electronics"
      ? "Electronics"
      : department || "Department");

  const fetchTimetable = async () => {
    setLoading(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "https://attendance-management-system-gpci.onrender.com/api/timetables",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to fetch timetable"
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.timetables)
        ? data.timetables
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setTimetables(list);

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load timetable"
      );

      setTimetables([]);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  /*
   * =====================================================
   * YEAR 2 DATA LOGIC
   * =====================================================
   */

  const getYear = (item) => {
    return (
      item?.year ??
      item?.class_year ??
      item?.class?.year ??
      item?.classInfo?.year
    );
  };

  const matchesDepartment = (item) => {
    const value =
      item?.department ||
      item?.department_name ||
      item?.departmentName ||
      item?.department_code ||
      item?.class_department ||
      item?.class?.department_name ||
      item?.class?.department;

    if (!value) return true;

    const itemDept =
      String(value)
        .toLowerCase()
        .trim();

    const currentDept =
      String(departmentName)
        .toLowerCase()
        .trim();

    if (itemDept === currentDept) {
      return true;
    }

    if (
      currentDept.includes("computer") &&
      (itemDept.includes("computer") ||
        itemDept === "cse")
    ) {
      return true;
    }

    if (
      currentDept.includes("information") &&
      (itemDept.includes("information") ||
        itemDept === "it")
    ) {
      return true;
    }

    if (
      currentDept.includes("electronic") &&
      (itemDept.includes("electronic") ||
        itemDept === "ece")
    ) {
      return true;
    }

    return false;
  };

  /*
   * =====================================================
   * KEEP YEAR 2 FILTER
   * =====================================================
   */

  const year2Timetable =
    useMemo(() => {
      return timetables.filter((item) => {

        const year = getYear(item);

        const yearMatches =
          year === undefined ||
          year === null ||
          String(year) === "2";

        return (
          yearMatches &&
          matchesDepartment(item)
        );
      });
    }, [
      timetables,
      departmentName,
    ]);

  /*
   * =====================================================
   * DAY FILTER
   * =====================================================
   */

  const filteredTimetable =
    useMemo(() => {
      if (selectedDay === "ALL") {
        return year2Timetable;
      }

      return year2Timetable.filter(
        (item) =>
          String(
            item?.day_of_week ||
              item?.day ||
              ""
          ).toUpperCase() ===
          selectedDay
      );
    }, [
      year2Timetable,
      selectedDay,
    ]);

  const days = [
    "ALL",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  /*
   * =====================================================
   * DISPLAY HELPERS
   * =====================================================
   */

  const formatTime = (time) => {
    if (!time) return "-";

    return String(time).slice(0, 5);
  };

  const getSubject = (item) => {
    return (
      item?.subject_name ||
      item?.subject?.subject_name ||
      item?.subjectName ||
      item?.subject_code ||
      `Subject ID: ${
        item?.subject_id || "-"
      }`
    );
  };

  const getStaff = (item) => {
    return (
      item?.staff_name ||
      item?.staff?.name ||
      item?.staffName ||
      item?.staff_code ||
      `Staff ID: ${
        item?.staff_id || "-"
      }`
    );
  };

  const getClass = (item) => {
    return (
      item?.class_name ||
      item?.class?.class_name ||
      item?.section ||
      item?.class?.section ||
      `Class ID: ${
        item?.class_id || "-"
      }`
    );
  };

  /*
   * =====================================================
   * ACTIONS
   * =====================================================
   */

  const handleAdd = () => {
    alert(
      "Add Timetable functionality will be connected next."
    );
  };

  const handleEdit = (item) => {
    alert(
      `Edit timetable entry ${
        item?.timetable_id || ""
      }`
    );
  };

  const handleDelete = (item) => {
    if (
      window.confirm(
        "Are you sure you want to delete this timetable entry?"
      )
    ) {
      alert(
        "Delete API will be connected next."
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 rounded-2xl bg-indigo-700 p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between">

        <div>

          <Link
            to={`/hod/${department}`}
            className="mb-3 inline-flex items-center gap-2 text-sm text-indigo-100 hover:text-white"
          >
            <FaArrowLeft />
            Back to HOD Dashboard
          </Link>

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <FaCalendarAlt className="text-2xl" />
            </div>

            <div>

              <p className="text-sm text-indigo-100">
                {departmentName}
              </p>

              <h1 className="text-2xl font-bold md:text-3xl">
                Year 2 Timetable
              </h1>

              <p className="mt-1 text-sm text-indigo-100">
                Manage Year 2 class timetable
              </p>

            </div>

          </div>

        </div>

        <div className="flex gap-3">

          <button
            onClick={fetchTimetable}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20"
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
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <FaPlus />

            Add Timetable
          </button>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-2xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Total Classes
          </p>

          <p className="mt-2 text-3xl font-bold">
            {year2Timetable.length}
          </p>

        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Year
          </p>

          <p className="mt-2 text-3xl font-bold">
            2
          </p>

        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Showing
          </p>

          <p className="mt-2 text-3xl font-bold">
            {filteredTimetable.length}
          </p>

        </div>

      </div>

      {/* =====================================================
          DAY FILTER
      ===================================================== */}

      <div className="overflow-x-auto rounded-2xl border bg-white p-3 shadow-sm">

        <div className="flex min-w-max gap-2">

          {days.map((day) => (

            <button
              key={day}
              onClick={() =>
                setSelectedDay(day)
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                selectedDay === day
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {day === "ALL"
                ? "All Days"
                : day.charAt(0) +
                  day.slice(1).toLowerCase()}
            </button>

          ))}

        </div>

      </div>

      {/* =====================================================
          TIMETABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        <div className="border-b px-6 py-4">

          <h2 className="font-bold text-slate-900">
            Year 2 Timetable
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {departmentName}
          </p>

        </div>

        {loading ? (

          <div className="flex justify-center py-16">

            <FaSyncAlt className="animate-spin text-2xl text-indigo-600" />

          </div>

        ) : filteredTimetable.length === 0 ? (

          <div className="px-6 py-16 text-center text-slate-500">

            No Year 2 timetable entries found.

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-92">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    #
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Day
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Time
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Staff
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Class
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y">

                {filteredTimetable.map(
                  (item, index) => {

                    const day =
                      item?.day_of_week ||
                      item?.day ||
                      "-";

                    return (

                      <tr
                        key={
                          item?.timetable_id ||
                          item?.id ||
                          index
                        }
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4">

                          <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">

                            {String(day)
                              .charAt(0)
                              .toUpperCase() +
                              String(day)
                                .slice(1)
                                .toLowerCase()}

                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <div className="font-semibold text-slate-900">

                            {formatTime(
                              item?.start_time
                            )}

                            {" - "}

                            {formatTime(
                              item?.end_time
                            )}

                          </div>

                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {getSubject(item)}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {getStaff(item)}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {getClass(item)}
                        </td>

                        <td className="px-6 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                handleEdit(item)
                              }
                              className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
                            >
                              <FaEdit />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(item)
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
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

    </div>
  );
};

export default HodYear2Timetable;