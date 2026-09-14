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
  FaBook,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

const HodYear3Subjects = () => {
  const { department } = useParams();

  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const fetchSubjects = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://attendance-management-system-gpci.onrender.com/api/subjects",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to fetch subjects"
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.subjects)
        ? data.subjects
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setSubjects(list);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to load subjects"
      );
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const matchesDepartment = (subject) => {
    const value =
      subject?.department ||
      subject?.department_name ||
      subject?.departmentName ||
      subject?.department_code;

    if (!value) return true;

    const subjectDept = String(value)
      .toLowerCase()
      .trim();

    const currentDept = String(
      departmentName
    )
      .toLowerCase()
      .trim();

    if (subjectDept === currentDept) {
      return true;
    }

    if (
      currentDept.includes("computer") &&
      (subjectDept.includes("computer") ||
        subjectDept === "cse")
    ) {
      return true;
    }

    if (
      currentDept.includes("information") &&
      (subjectDept.includes("information") ||
        subjectDept === "it")
    ) {
      return true;
    }

    if (
      currentDept.includes("electronic") &&
      (subjectDept.includes("electronic") ||
        subjectDept === "ece")
    ) {
      return true;
    }

    return false;
  };

  const year3Subjects = useMemo(() => {
    return subjects.filter((subject) => {
      const year =
        subject?.year ??
        subject?.year_of_study ??
        subject?.study_year;

      return (
        (year === undefined ||
          year === null ||
          String(year) === "3") &&
        matchesDepartment(subject)
      );
    });
  }, [subjects, departmentName]);

  const filteredSubjects = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return year3Subjects;
    }

    return year3Subjects.filter(
      (subject) => {
        const code = String(
          subject?.subject_code ||
            subject?.code ||
            ""
        ).toLowerCase();

        const name = String(
          subject?.subject_name ||
            subject?.name ||
            ""
        ).toLowerCase();

        return (
          code.includes(query) ||
          name.includes(query)
        );
      }
    );
  }, [year3Subjects, search]);

  const handleAdd = () => {
    alert(
      "Add Subject functionality will be connected next."
    );
  };

  const handleEdit = (subject) => {
    alert(
      `Edit Subject: ${
        subject?.subject_name ||
        subject?.name ||
        "Subject"
      }`
    );
  };

  const handleDelete = (subject) => {
    const name =
      subject?.subject_name ||
      subject?.name ||
      "this subject";

    if (
      window.confirm(
        `Are you sure you want to delete ${name}?`
      )
    ) {
      alert(
        "Delete API will be connected next."
      );
    }
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
              <FaBook className="text-2xl" />
            </div>

            <div>
              <p className="text-sm text-indigo-100">
                {departmentName}
              </p>

              <h1 className="text-2xl font-bold md:text-3xl">
                Year 3 Subjects
              </h1>

              <p className="mt-1 text-sm text-indigo-100">
                Manage Year 3 subjects
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchSubjects}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
          >
            <FaSyncAlt
              className={
                loading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>

          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <FaPlus />
            Add Subject
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Subjects
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {year3Subjects.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Year
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            3
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Showing
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {filteredSubjects.length}
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
            placeholder="Search subject code or name..."
            className="w-full rounded-xl border py-3 pl-11 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        <div className="border-b px-6 py-4">
          <h2 className="font-bold text-slate-900">
            Year 3 Subject List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {departmentName}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <FaSyncAlt className="animate-spin text-2xl text-indigo-600" />
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">
            No Year 3 subjects found.
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
                    Code
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Subject Name
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Year
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">

                {filteredSubjects.map(
                  (subject, index) => {

                    const id =
                      subject?.subject_id ||
                      subject?.id ||
                      index;

                    const code =
                      subject?.subject_code ||
                      subject?.code ||
                      "-";

                    const name =
                      subject?.subject_name ||
                      subject?.name ||
                      "-";

                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700">
                            {code}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {name}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                            Year 3
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                handleEdit(subject)
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
                            >
                              <FaEdit />
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(subject)
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                            >
                              <FaTrash />
                              Delete
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

export default HodYear3Subjects;
