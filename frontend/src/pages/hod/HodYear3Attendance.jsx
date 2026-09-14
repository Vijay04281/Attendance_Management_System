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
  FaClipboardCheck,
  FaSearch,
  FaSyncAlt,
} from "react-icons/fa";

const HodYear3Attendance = () => {
  const { department } = useParams();

  const [attendance, setAttendance] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

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

  const fetchAttendance = async () => {
    setLoading(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/attendance",
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
            "Failed to fetch attendance"
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.attendance)
        ? data.attendance
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setAttendance(list);

    } catch (err) {
      console.error(
        "Attendance error:",
        err
      );

      setError(
        err.message ||
          "Unable to load attendance"
      );

      setAttendance([]);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const matchesYear3 =
    (item) => {
      const year =
        item?.year ??
        item?.student_year ??
        item?.class_year ??
        item?.class?.year;

      return (
        year === undefined ||
        year === null ||
        String(year) === "3"
      );
    };

  const matchesDepartment =
    (item) => {
      const value =
        item?.department ||
        item?.department_name ||
        item?.departmentName ||
        item?.student_department ||
        item?.class_department;

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

  const year3Attendance =
    useMemo(() => {
      return attendance.filter(
        (item) =>
          matchesYear3(item) &&
          matchesDepartment(item)
      );
    }, [
      attendance,
      departmentName,
    ]);

  const filteredAttendance =
    useMemo(() => {

      const query =
        search.trim().toLowerCase();

      if (!query) {
        return year3Attendance;
      }

      return year3Attendance.filter(
        (item) => {

          const registerNumber =
            String(
              item?.register_number ||
                item?.student_register_number ||
                ""
            ).toLowerCase();

          const studentName =
            String(
              item?.student_name ||
                item?.name ||
                item?.student?.name ||
                ""
            ).toLowerCase();

          const subject =
            String(
              item?.subject_name ||
                item?.subject_code ||
                item?.subject?.subject_name ||
                ""
            ).toLowerCase();

          const staff =
            String(
              item?.staff_name ||
                item?.staff?.name ||
                ""
            ).toLowerCase();

          return (
            registerNumber.includes(query) ||
            studentName.includes(query) ||
            subject.includes(query) ||
            staff.includes(query)
          );
        }
      );
    }, [
      year3Attendance,
      search,
    ]);

  const total =
    year3Attendance.length;

  const present =
    year3Attendance.filter(
      (item) =>
        String(
          item?.status || ""
        ).toUpperCase() ===
        "PRESENT"
    ).length;

  const absent =
    year3Attendance.filter(
      (item) =>
        String(
          item?.status || ""
        ).toUpperCase() ===
        "ABSENT"
    ).length;

  const percentage =
    total > 0
      ? ((present / total) * 100).toFixed(1)
      : "0.0";

  const getStudentName = (item) =>
    item?.student_name ||
    item?.name ||
    item?.student?.name ||
    "-";

  const getRegisterNumber = (item) =>
    item?.register_number ||
    item?.student_register_number ||
    item?.student?.register_number ||
    "-";

  const getSubject = (item) =>
    item?.subject_name ||
    item?.subject_code ||
    item?.subject?.subject_name ||
    "-";

  const getStaff = (item) =>
    item?.staff_name ||
    item?.staff?.name ||
    "-";

  const getDate = (item) => {
    const value =
      item?.scanned_at ||
      item?.session_date ||
      item?.date;

    if (!value) return "-";

    return new Date(value).toLocaleDateString();
  };

  return (
    <div className="space-y-6">

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
              <FaClipboardCheck className="text-2xl" />
            </div>

            <div>

              <p className="text-sm text-indigo-100">
                {departmentName}
              </p>

              <h1 className="text-2xl font-bold md:text-3xl">
                Year 3 Attendance
              </h1>

              <p className="mt-1 text-sm text-indigo-100">
                View Year 3 attendance records
              </p>

            </div>

          </div>

        </div>

        <button
          onClick={fetchAttendance}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20"
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

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Attendance API:</strong>{" "}
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Records
          </p>

          <p className="mt-2 text-3xl font-bold">
            {total}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Present
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {present}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Absent
          </p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {absent}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Attendance %
          </p>

          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {percentage}%
          </p>
        </div>

      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">

        <div className="relative">

          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search student, register number, subject or staff..."
            className="w-full rounded-xl border py-3 pl-11 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

        </div>

      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        <div className="border-b px-6 py-4">

          <h2 className="font-bold text-slate-900">
            Year 3 Attendance Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {departmentName}
          </p>

        </div>

        {loading ? (

          <div className="flex justify-center py-16">
            <FaSyncAlt className="animate-spin text-2xl text-indigo-600" />
          </div>

        ) : filteredAttendance.length === 0 ? (

          <div className="px-6 py-16 text-center">

            <FaClipboardCheck className="mx-auto text-4xl text-slate-300" />

            <p className="mt-4 font-semibold text-slate-700">
              No attendance records found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No Year 3 attendance data is available.
            </p>

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
                    Register Number
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Student
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Staff
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Date
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y">

                {filteredAttendance.map(
                  (item, index) => {

                    const status =
                      String(
                        item?.status || ""
                      ).toUpperCase();

                    return (
                      <tr
                        key={
                          item?.attendance_id ||
                          item?.id ||
                          index
                        }
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {getRegisterNumber(
                            item
                          )}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {getStudentName(
                            item
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {getSubject(item)}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {getStaff(item)}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {getDate(item)}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                              status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-700"
                                : status === "ABSENT"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {status || "UNKNOWN"}
                          </span>

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

export default HodYear3Attendance;