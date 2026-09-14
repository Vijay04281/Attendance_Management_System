import { useCallback, useEffect, useState } from "react";
import {
  FaUsers,
  FaSearch,
  FaSyncAlt,
  FaUserGraduate,
} from "react-icons/fa";

const API_URL = "http://localhost:5000/api";

function StaffStudents() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // =====================================================
  // LOAD STUDENTS
  // =====================================================

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/students`, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load students");
      }

      const studentList = data.students || data || [];

      setStudents(studentList);
      setFilteredStudents(studentList);
    } catch (err) {
      console.error("Load students error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    loadStudents();
  }, [token, loadStudents]);

  // =====================================================
  // SEARCH
  // =====================================================

  useEffect(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      setFilteredStudents(students);
      return;
    }

    const result = students.filter((student) => {
      return (
        String(student.student_id || "")
          .toLowerCase()
          .includes(value) ||
        String(student.name || student.student_name || "")
          .toLowerCase()
          .includes(value) ||
        String(student.email || "")
          .toLowerCase()
          .includes(value) ||
        String(student.department || "")
          .toLowerCase()
          .includes(value) ||
        String(student.class_name || student.class || "")
          .toLowerCase()
          .includes(value)
      );
    });

    setFilteredStudents(result);
  }, [search, students]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  return (
    <>
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Students
            </h1>

            <p className="text-slate-500 mt-1">
              View and manage students assigned to your classes
            </p>
          </div>

          <button
            onClick={loadStudents}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            <FaSyncAlt
              className={loading ? "animate-spin" : ""}
            />

            {loading ? "Refreshing..." : "Refresh"}
          </button>

        </div>
      </div>

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Total Students
              </p>

              <h2 className="text-3xl font-bold text-slate-800 mt-2">
                {students.length}
              </h2>

              <p className="text-xs text-slate-400 mt-2">
                Students in the system
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FaUsers size={21} />
            </div>

          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Showing
              </p>

              <h2 className="text-3xl font-bold text-green-600 mt-2">
                {filteredStudents.length}
              </h2>

              <p className="text-xs text-slate-400 mt-2">
                Matching students
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <FaUserGraduate size={21} />
            </div>

          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Search
              </p>

              <h2 className="text-xl font-bold text-slate-800 mt-3">
                {search ? "Active" : "All Students"}
              </h2>

              <p className="text-xs text-slate-400 mt-2">
                {search
                  ? "Filtered student list"
                  : "No filter applied"}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FaSearch size={20} />
            </div>

          </div>
        </div>

      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">

        <div className="relative">

          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student ID, name, email, department or class..."
            className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p className="font-semibold">
            Failed to load students
          </p>

          <p className="text-sm mt-1">
            {error}
          </p>
        </div>
      )}

      {/* =================================================
          STUDENT TABLE
      ================================================= */}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            Student List
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {filteredStudents.length} student
            {filteredStudents.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center">

            <FaSyncAlt className="mx-auto text-blue-600 text-3xl animate-spin" />

            <p className="text-slate-500 mt-4">
              Loading students...
            </p>

          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <FaUsers size={28} />
            </div>

            <h3 className="font-semibold text-slate-700 mt-4">
              No students found
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Try changing your search.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">

                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Student ID
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Student
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Email
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Department
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Class
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredStudents.map((student, index) => {

                  const studentName =
                    student.name ||
                    student.student_name ||
                    "Unknown Student";

                  return (
                    <tr
                      key={
                        student.student_id ||
                        student.id ||
                        index
                      }
                      className="hover:bg-slate-50 transition"
                    >

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">
                          {student.student_id ||
                            student.id ||
                            "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            {studentName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {studentName}
                            </p>

                            <p className="text-xs text-slate-400">
                              Student
                            </p>
                          </div>

                        </div>

                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.email || "-"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.department || "-"}
                      </td>

                      <td className="px-6 py-4">

                        <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                          {student.class_name ||
                            student.class ||
                            "-"}
                        </span>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>
      </>
  );
}

export default StaffStudents;