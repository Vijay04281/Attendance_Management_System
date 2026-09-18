import { useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "/api";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

const formatDay = (day) => {
  if (!day) return "Unknown Day";

  return day
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatTime = (time) => {
  if (!time) return "--";

  const value = time.toString().slice(0, 5);
  const [hours, minutes] = value.split(":");

  let hour = Number(hours);

  if (Number.isNaN(hour)) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minutes} ${period}`;
};

const getSubjectName = (item) => {
  return (
    item.subject_name ||
    item.subjectName ||
    item.subject ||
    item.name ||
    "Unknown Subject"
  );
};

const getSubjectCode = (item) => {
  return (
    item.subject_code ||
    item.subjectCode ||
    item.code ||
    ""
  );
};

const getStaffName = (item) => {
  return (
    item.staff_name ||
    item.staffName ||
    item.teacher_name ||
    item.teacherName ||
    item.staff ||
    "Not Assigned"
  );
};

const getDay = (item) => {
  return (
    item.day_of_week ||
    item.day ||
    item.week_day ||
    ""
  )
    .toString()
    .toUpperCase();
};

const getStartTime = (item) => {
  return item.start_time || item.startTime || "";
};

const getEndTime = (item) => {
  return item.end_time || item.endTime || "";
};

function ClassTeacherTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [classInfo, setClassInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchTimetable = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const timetableResponse = await fetch(
        `${API_BASE}/class-teacher/timetable`,
        {
          method: "GET",
          headers,
        }
      );

      if (!timetableResponse.ok) {
        const result = await timetableResponse.json().catch(() => ({}));

        throw new Error(
          result.message || "Failed to load timetable"
        );
      }

      const timetableResult = await timetableResponse.json();

      const timetableData =
        timetableResult?.timetable ||
        timetableResult?.data?.timetable ||
        timetableResult?.data ||
        [];

      setTimetable(
        Array.isArray(timetableData)
          ? timetableData
          : []
      );

      try {
        const classResponse = await fetch(
          `${API_BASE}/class-teacher/class`,
          {
            method: "GET",
            headers,
          }
        );

        if (classResponse.ok) {
          const classResult = await classResponse.json();

          const classData =
            classResult?.class ||
            classResult?.data?.class ||
            classResult?.data ||
            null;

          setClassInfo(classData);
        }
      } catch (classError) {
        console.warn(
          "Unable to load class information:",
          classError
        );
      }
    } catch (err) {
      console.error("Timetable error:", err);

      setError(
        err.message || "Unable to load timetable"
      );

      setTimetable([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const groupedTimetable = useMemo(() => {
    const groups = {};

    DAYS.forEach((day) => {
      groups[day] = [];
    });

    timetable.forEach((item) => {
      const day = getDay(item);

      if (!groups[day]) {
        groups[day] = [];
      }

      groups[day].push(item);
    });

    Object.keys(groups).forEach((day) => {
      groups[day].sort((a, b) => {
        return getStartTime(a).localeCompare(
          getStartTime(b)
        );
      });
    });

    return groups;
  }, [timetable]);

  const totalSubjects = useMemo(() => {
    const subjects = timetable.map((item) => {
      const code = getSubjectCode(item);
      const name = getSubjectName(item);

      return code || name;
    });

    return new Set(subjects).size;
  }, [timetable]);

  const totalDays = useMemo(() => {
    return new Set(
      timetable
        .map((item) => getDay(item))
        .filter(Boolean)
    ).size;
  }, [timetable]);

  const className =
    classInfo?.class_name ||
    classInfo?.className ||
    classInfo?.name ||
    "Class";

  const year =
    classInfo?.year ||
    classInfo?.class_year ||
    "--";

  const section =
    classInfo?.section ||
    classInfo?.class_section ||
    "--";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-40 rounded-3xl bg-slate-200" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="overflow-hidden rounded-3xl bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-500 p-6 text-white shadow-lg md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-100">
                Class Teacher
              </p>

              <h1 className="text-2xl font-bold md:text-3xl">
                Class Timetable
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-blue-100 md:text-base">
                View the weekly timetable for your assigned
                class.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchTimetable(true)}
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
                : "Refresh"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  Unable to load timetable
                </p>

                <p className="mt-1">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchTimetable()}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Class Information */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800">
              Class Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Timetable assigned to your class
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Class
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {className}
              </p>
            </div>

            <div className="rounded-2xl bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Year
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {year}
              </p>
            </div>

            <div className="rounded-2xl bg-cyan-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                Section
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                {section}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Total Periods
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {timetable.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Subjects
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {totalSubjects}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Active Days
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {totalDays}
            </p>
          </div>
        </div>

        {/* Weekly Timetable */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Weekly Timetable
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Subject schedule for the assigned class
            </p>
          </div>

          {timetable.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-2xl">
                📅
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-800">
                No timetable available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                No timetable entries have been assigned
                to your class yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS.map((day) => {
                const entries =
                  groupedTimetable[day] || [];

                return (
                  <div
                    key={day}
                    className="overflow-hidden rounded-2xl border border-slate-200"
                  >
                    <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {formatDay(day)}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {entries.length}{" "}
                          {entries.length === 1
                            ? "period"
                            : "periods"}
                        </p>
                      </div>
                    </div>

                    {entries.length === 0 ? (
                      <div className="px-4 py-5 text-sm text-slate-400">
                        No classes scheduled
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {entries.map(
                          (item, index) => (
                            <div
                              key={
                                item.timetable_id ||
                                `${day}-${getStartTime(
                                  item
                                )}-${index}`
                              }
                              className="p-4 transition hover:bg-slate-50"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-start gap-4">
                                  <div className="flex min-w-26.25 flex-col rounded-xl bg-blue-50 px-3 py-2 text-center">
                                    <span className="text-xs font-semibold text-blue-600">
                                      TIME
                                    </span>

                                    <span className="mt-1 text-sm font-bold text-blue-800">
                                      {formatTime(
                                        getStartTime(
                                          item
                                        )
                                      )}
                                    </span>

                                    <span className="text-xs text-blue-500">
                                      to{" "}
                                      {formatTime(
                                        getEndTime(
                                          item
                                        )
                                      )}
                                    </span>
                                  </div>

                                  <div>
                                    <h4 className="text-base font-bold text-slate-800">
                                      {getSubjectName(
                                        item
                                      )}
                                    </h4>

                                    {getSubjectCode(
                                      item
                                    ) && (
                                      <p className="mt-1 text-sm font-medium text-blue-600">
                                        {getSubjectCode(
                                          item
                                        )}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 px-4 py-3 lg:min-w-55">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Staff
                                  </p>

                                  <p className="mt-1 text-sm font-semibold text-slate-700">
                                    {getStaffName(
                                      item
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile-friendly complete table */}
        {timetable.length > 0 && (
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-800">
                Timetable Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete timetable entries
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-190 w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Day
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Time
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Subject
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Code
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Staff
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {[...timetable]
                    .sort((a, b) => {
                      const dayA =
                        DAYS.indexOf(
                          getDay(a)
                        );

                      const dayB =
                        DAYS.indexOf(
                          getDay(b)
                        );

                      if (dayA !== dayB) {
                        return dayA - dayB;
                      }

                      return getStartTime(
                        a
                      ).localeCompare(
                        getStartTime(b)
                      );
                    })
                    .map((item, index) => (
                      <tr
                        key={
                          item.timetable_id ||
                          `table-${index}`
                        }
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                          {formatDay(
                            getDay(item)
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {formatTime(
                            getStartTime(item)
                          )}{" "}
                          -{" "}
                          {formatTime(
                            getEndTime(item)
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                          {getSubjectName(
                            item
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-blue-600">
                          {getSubjectCode(
                            item
                          ) || "--"}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {getStaffName(item)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ClassTeacherTimetable;