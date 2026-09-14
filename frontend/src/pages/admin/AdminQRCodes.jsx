import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaQrcode,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaCopy,
  FaDownload,
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaBook,
  FaChalkboard,
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:5000/api";

// =====================================================
// HELPERS
// =====================================================

const getToken = () => {
  return localStorage.getItem("token");
};

const getArray = (data, keys = []) => {
  if (Array.isArray(data)) return data;

  if (data && Array.isArray(data.data)) {
    return data.data;
  }

  if (data && Array.isArray(data.rows)) {
    return data.rows;
  }

  if (data && Array.isArray(data.results)) {
    return data.results;
  }

  for (const key of keys) {
    if (data && Array.isArray(data[key])) {
      return data[key];
    }
  }

  return [];
};

const getId = (item) => {
  return (
    item?.qr_code_id ??
    item?.qrCodeId ??
    item?.id ??
    item?.qr_id ??
    null
  );
};

const getSessionId = (item) => {
  return (
    item?.session_id ??
    item?.sessionId ??
    item?.attendance_session_id ??
    item?.attendanceSessionId ??
    null
  );
};

const getSubjectName = (item) => {
  return (
    item?.subject_name ??
    item?.subjectName ??
    item?.subject?.subject_name ??
    item?.subject?.name ??
    item?.subject ??
    "Unknown Subject"
  );
};

const getStaffName = (item) => {
  const firstName =
    item?.first_name ??
    item?.firstName ??
    item?.staff?.first_name ??
    item?.staff?.firstName ??
    "";

  const lastName =
    item?.last_name ??
    item?.lastName ??
    item?.staff?.last_name ??
    item?.staff?.lastName ??
    "";

  return (
    item?.staff_name ||
    item?.staffName ||
    item?.teacher_name ||
    item?.teacherName ||
    item?.staff?.full_name ||
    item?.staff?.fullName ||
    `${firstName} ${lastName}`.trim() ||
    "Unknown Staff"
  );
};

const getClassName = (item) => {
  if (item?.class_name) return item.class_name;
  if (item?.className) return item.className;

  if (item?.class?.class_name) {
    return item.class.class_name;
  }

  if (item?.class?.name) {
    return item.class.name;
  }

  const year =
    item?.year ??
    item?.class_year ??
    item?.class?.year ??
    "";

  const section =
    item?.section ??
    item?.class_section ??
    item?.class?.section ??
    "";

  if (year || section) {
    return `Year ${year}${section ? ` - ${section}` : ""}`;
  }

  return "Unknown Class";
};

const getQRCodeValue = (item) => {
  return (
    item?.qr_code ??
    item?.qrCode ??
    item?.code ??
    item?.token ??
    item?.qr_value ??
    item?.qrValue ??
    ""
  );
};

const getCreatedDate = (item) => {
  return (
    item?.created_at ??
    item?.createdAt ??
    item?.generated_at ??
    item?.generatedAt ??
    item?.created_on ??
    ""
  );
};

const getExpiryDate = (item) => {
  return (
    item?.expires_at ??
    item?.expiresAt ??
    item?.expiry_time ??
    item?.expiryTime ??
    item?.expiration_time ??
    item?.expirationTime ??
    ""
  );
};

const isUsed = (item) => {
  const value =
    item?.is_used ??
    item?.isUsed ??
    item?.used ??
    item?.status ??
    false;

  if (typeof value === "boolean") return value;

  if (typeof value === "number") return value === 1;

  const normalized = String(value).toLowerCase();

  return ["1", "true", "used", "completed", "expired"].includes(normalized);
};

const isExpired = (item) => {
  const explicit =
    item?.is_expired ??
    item?.isExpired ??
    item?.expired ??
    null;

  if (explicit !== null && explicit !== undefined) {
    if (typeof explicit === "boolean") return explicit;
    if (typeof explicit === "number") return explicit === 1;

    return ["true", "1", "expired"].includes(
      String(explicit).toLowerCase()
    );
  }

  const expiry = getExpiryDate(item);

  if (!expiry) return false;

  const date = new Date(expiry);

  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() < Date.now();
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
};

// =====================================================
// API
// =====================================================

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function AdminQRCodes() {
  const [qrCodes, setQrCodes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [usingId, setUsingId] = useState(null);

  const [form, setForm] = useState({
    session_id: "",
    qr_code: "",
    expires_at: "",
    status: "active",
  });

  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadQRCodes = useCallback(async () => {
    const data = await apiRequest("/qr-codes");

    return getArray(data, [
      "qrCodes",
      "qr_codes",
      "data",
      "rows",
      "results",
    ]);
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const data = await apiRequest("/attendance-sessions");

      return getArray(data, [
        "sessions",
        "attendanceSessions",
        "attendance_sessions",
        "data",
        "rows",
      ]);
    } catch {
      return [];
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await apiRequest("/subjects");

      return getArray(data, ["subjects", "data", "rows"]);
    } catch {
      return [];
    }
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const data = await apiRequest("/staff");

      return getArray(data, ["staff", "staffMembers", "data", "rows"]);
    } catch {
      return [];
    }
  }, []);

  const loadClasses = useCallback(async () => {
    try {
      const data = await apiRequest("/classes");

      return getArray(data, ["classes", "data", "rows"]);
    } catch {
      return [];
    }
  }, []);

  const loadAllData = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        const [
          qrData,
          sessionData,
          subjectData,
          staffData,
          classData,
        ] = await Promise.all([
          loadQRCodes(),
          loadSessions(),
          loadSubjects(),
          loadStaff(),
          loadClasses(),
        ]);

        setQrCodes(qrData);
        setSessions(sessionData);
        setSubjects(subjectData);
        setStaff(staffData);
        setClasses(classData);
      } catch (err) {
        console.error("QR Code loading error:", err);

        setError(
          err.message ||
            "Unable to load QR code information."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      loadQRCodes,
      loadSessions,
      loadSubjects,
      loadStaff,
      loadClasses,
    ]
  );

  useEffect(() => {
    loadAllData(true);
  }, [loadAllData]);

  // ===================================================
  // NORMALIZED DATA
  // ===================================================

  const normalizedQRCodes = useMemo(() => {
    return qrCodes.map((item) => ({
      ...item,

      id: getId(item),

      sessionId: getSessionId(item),

      subjectName: getSubjectName(item),

      staffName: getStaffName(item),

      className: getClassName(item),

      qrValue: getQRCodeValue(item),

      createdDate: getCreatedDate(item),

      expiryDate: getExpiryDate(item),

      used: isUsed(item),

      expired: isExpired(item),
    }));
  }, [qrCodes]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredQRCodes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return normalizedQRCodes.filter((item) => {
      const matchesSearch =
        !keyword ||
        String(item.id ?? "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.sessionId ?? "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.qrValue ?? "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.subjectName ?? "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.staffName ?? "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.className ?? "")
          .toLowerCase()
          .includes(keyword);

      let matchesStatus = true;

      if (statusFilter === "active") {
        matchesStatus = !item.used && !item.expired;
      }

      if (statusFilter === "used") {
        matchesStatus = item.used;
      }

      if (statusFilter === "expired") {
        matchesStatus = item.expired && !item.used;
      }

      return matchesSearch && matchesStatus;
    });
  }, [normalizedQRCodes, search, statusFilter]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {
    const total = normalizedQRCodes.length;

    const used = normalizedQRCodes.filter(
      (item) => item.used
    ).length;

    const expired = normalizedQRCodes.filter(
      (item) => item.expired && !item.used
    ).length;

    const active = normalizedQRCodes.filter(
      (item) => !item.used && !item.expired
    ).length;

    return {
      total,
      active,
      used,
      expired,
    };
  }, [normalizedQRCodes]);

  // ===================================================
  // SESSION HELPERS
  // ===================================================

  const getSessionLabel = (session) => {
    if (!session) return "Unknown Session";

    const sessionId =
      session?.session_id ??
      session?.sessionId ??
      session?.id ??
      "";

    const subject =
      session?.subject_name ??
      session?.subjectName ??
      session?.subject?.subject_name ??
      session?.subject?.name ??
      "";

    const date =
      session?.session_date ??
      session?.sessionDate ??
      session?.date ??
      session?.attendance_date ??
      "";

    const time =
      session?.start_time ??
      session?.startTime ??
      session?.time ??
      "";

    const parts = [];

    if (subject) parts.push(subject);

    if (date) {
      parts.push(formatDate(date));
    }

    if (time) {
      parts.push(time);
    }

    if (parts.length === 0) {
      return `Session #${sessionId}`;
    }

    return `#${sessionId} - ${parts.join(" • ")}`;
  };

  const selectedSession = useMemo(() => {
    if (!form.session_id) return null;

    return (
      sessions.find(
        (session) =>
          String(
            session?.session_id ??
              session?.sessionId ??
              session?.id
          ) === String(form.session_id)
      ) || null
    );
  }, [sessions, form.session_id]);

  // ===================================================
  // FORM
  // ===================================================

  const resetForm = () => {
    setForm({
      session_id: "",
      qr_code: "",
      expires_at: "",
      status: "active",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (loading) return;

    setShowCreateModal(false);
    resetForm();
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const generateRandomCode = () => {
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    const timePart = Date.now()
      .toString(36)
      .slice(-6)
      .toUpperCase();

    setForm((previous) => ({
      ...previous,
      qr_code: `ATT-${randomPart}-${timePart}`,
    }));
  };

  // ===================================================
  // CREATE QR CODE
  // ===================================================

  const handleCreate = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.session_id) {
      setError("Please select an attendance session.");
      return;
    }

    try {
      const payload = {
        session_id: Number(form.session_id),
        qr_code: form.qr_code.trim() || undefined,
        expires_at: form.expires_at || undefined,
        status: form.status || "active",
      };

      await apiRequest("/qr-codes", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess("QR code created successfully.");

      setShowCreateModal(false);

      resetForm();

      await loadAllData(false);
    } catch (err) {
      console.error("Create QR code error:", err);

      setError(
        err.message ||
          "Unable to create QR code."
      );
    }
  };

  // ===================================================
  // MARK QR CODE USED
  // ===================================================

  const handleMarkUsed = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to mark this QR code as used?"
    );

    if (!confirmed) return;

    setUsingId(id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/qr-codes/${id}/use`, {
        method: "PUT",
      });

      setSuccess("QR code marked as used.");

      await loadAllData(false);
    } catch (err) {
      console.error("Mark QR code used error:", err);

      setError(
        err.message ||
          "Unable to mark QR code as used."
      );
    } finally {
      setUsingId(null);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this QR code?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/qr-codes/${id}`, {
        method: "DELETE",
      });

      setSuccess("QR code deleted successfully.");

      if (
        selectedQRCode &&
        String(selectedQRCode.id) === String(id)
      ) {
        setSelectedQRCode(null);
        setShowViewModal(false);
      }

      await loadAllData(false);
    } catch (err) {
      console.error("Delete QR code error:", err);

      setError(
        err.message ||
          "Unable to delete QR code."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (item) => {
    setSelectedQRCode(item);
    setShowViewModal(true);
  };

  // ===================================================
  // COPY
  // ===================================================

  const handleCopy = async (value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);

      setSuccess("QR code copied to clipboard.");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Copy error:", err);

      setError("Unable to copy QR code.");
    }
  };

  // ===================================================
  // DOWNLOAD
  // ===================================================

  const handleDownload = (item) => {
    const value = item?.qrValue;

    if (!value) {
      setError("This QR code has no QR value to download.");
      return;
    }

    const content = `
Attendance Management System
QR Code ID: ${item.id ?? "—"}
Session ID: ${item.sessionId ?? "—"}
Subject: ${item.subjectName}
Staff: ${item.staffName}
Class: ${item.className}
QR Value: ${value}
Created: ${formatDateTime(item.createdDate)}
Expires: ${formatDateTime(item.expiryDate)}
Status: ${
      item.used
        ? "Used"
        : item.expired
        ? "Expired"
        : "Active"
    }
`.trim();

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = `qr-code-${item.id || "attendance"}.txt`;

    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);

    setSuccess("QR code information downloaded.");
  };

  // ===================================================
  // STATUS BADGE
  // ===================================================

  const StatusBadge = ({ item }) => {
    if (item.used) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          <FaCheckCircle />
          Used
        </span>
      );
    }

    if (item.expired) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <FaTimesCircle />
          Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <FaCheckCircle />
        Active
      </span>
    );
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex min-h-125 items-center justify-center">
          <div className="text-center">
            <FaSyncAlt className="mx-auto mb-4 animate-spin text-4xl text-blue-600" />

            <p className="text-lg font-semibold text-gray-700">
              Loading QR codes...
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Please wait.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3 text-white shadow">
              <FaQrcode className="text-2xl" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                QR Codes
              </h1>

              <p className="text-sm text-gray-500">
                Manage attendance QR codes and session access.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadAllData(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSyncAlt
              className={refreshing ? "animate-spin" : ""}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FaPlus />

            Generate QR Code
          </button>
        </div>
      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <FaTimesCircle className="mt-0.5 shrink-0" />

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <div className="flex items-start gap-2">
            <FaCheckCircle className="mt-0.5 shrink-0" />

            <span>{success}</span>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-green-500 hover:text-green-700"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total QR Codes
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {statistics.total}
              </p>
            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <FaQrcode className="text-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {statistics.active}
              </p>
            </div>

            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <FaCheckCircle className="text-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Used
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {statistics.used}
              </p>
            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <FaCheckCircle className="text-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Expired
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {statistics.expired}
              </p>
            </div>

            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <FaTimesCircle className="text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Search QR Codes
            </label>

            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by QR code, session, subject, staff or class..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              QR Code Records
            </h2>

            <p className="text-sm text-gray-500">
              Showing {filteredQRCodes.length} of{" "}
              {normalizedQRCodes.length} QR codes
            </p>
          </div>

          <div className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
            {statusFilter === "all"
              ? "All"
              : statusFilter.charAt(0).toUpperCase() +
                statusFilter.slice(1)}
          </div>
        </div>

        {filteredQRCodes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FaQrcode className="mx-auto mb-4 text-5xl text-gray-300" />

            <h3 className="text-lg font-semibold text-gray-700">
              No QR codes found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filter.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <FaPlus />

              Generate QR Code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-275 w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    QR Code
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Session
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Subject
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Staff
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Class
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Created
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredQRCodes.map((item) => (
                  <tr
                    key={item.id || item.qrValue}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
                          <FaQrcode />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            #{item.id ?? "—"}
                          </p>

                          <p
                            className="max-w-45 truncate text-xs text-gray-500"
                            title={item.qrValue}
                          >
                            {item.qrValue || "No QR value"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" />

                        <span className="text-sm text-gray-700">
                          {item.sessionId
                            ? `Session #${item.sessionId}`
                            : "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FaBook className="text-gray-400" />

                        <span className="text-sm font-medium text-gray-800">
                          {item.subjectName}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-gray-400" />

                        <span className="text-sm text-gray-700">
                          {item.staffName}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FaChalkboard className="text-gray-400" />

                        <span className="text-sm text-gray-700">
                          {item.className}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm text-gray-700">
                          {formatDate(item.createdDate)}
                        </p>

                        {item.expiryDate && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                            <FaClock />

                            Expires{" "}
                            {formatDateTime(
                              item.expiryDate
                            )}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge item={item} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="View"
                          onClick={() => handleView(item)}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600"
                        >
                          <FaEye />
                        </button>

                        <button
                          type="button"
                          title="Copy QR value"
                          onClick={() =>
                            handleCopy(item.qrValue)
                          }
                          disabled={!item.qrValue}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FaCopy />
                        </button>

                        <button
                          type="button"
                          title="Download"
                          onClick={() =>
                            handleDownload(item)
                          }
                          disabled={!item.qrValue}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-100 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FaDownload />
                        </button>

                        {!item.used && !item.expired && (
                          <button
                            type="button"
                            title="Mark as used"
                            onClick={() =>
                              handleMarkUsed(item.id)
                            }
                            disabled={
                              usingId === item.id
                            }
                            className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {usingId === item.id ? (
                              <FaSyncAlt className="animate-spin" />
                            ) : (
                              <FaCheckCircle />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          title="Delete"
                          onClick={() =>
                            handleDelete(item.id)
                          }
                          disabled={
                            deletingId === item.id
                          }
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === item.id ? (
                            <FaSyncAlt className="animate-spin" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          CREATE MODAL
      ================================================= */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Generate QR Code
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Create a QR code for an attendance session.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Attendance Session
                  <span className="text-red-500"> *</span>
                </label>

                <select
                  name="session_id"
                  value={form.session_id}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select attendance session
                  </option>

                  {sessions.map((session) => {
                    const sessionId =
                      session?.session_id ??
                      session?.sessionId ??
                      session?.id;

                    return (
                      <option
                        key={sessionId}
                        value={sessionId}
                      >
                        {getSessionLabel(session)}
                      </option>
                    );
                  })}
                </select>

                {sessions.length === 0 && (
                  <p className="mt-1.5 text-xs text-red-500">
                    No attendance sessions were found.
                  </p>
                )}
              </div>

              {selectedSession && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-blue-800">
                    Selected Session
                  </p>

                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-blue-600">
                        Subject:
                      </span>{" "}
                      <span className="font-medium text-blue-900">
                        {getSubjectName(selectedSession)}
                      </span>
                    </div>

                    <div>
                      <span className="text-blue-600">
                        Staff:
                      </span>{" "}
                      <span className="font-medium text-blue-900">
                        {getStaffName(selectedSession)}
                      </span>
                    </div>

                    <div>
                      <span className="text-blue-600">
                        Class:
                      </span>{" "}
                      <span className="font-medium text-blue-900">
                        {getClassName(selectedSession)}
                      </span>
                    </div>

                    <div>
                      <span className="text-blue-600">
                        Session:
                      </span>{" "}
                      <span className="font-medium text-blue-900">
                        #
                        {getSessionId(selectedSession) ||
                          "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">
                    QR Code Value
                  </label>

                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Generate random code
                  </button>
                </div>

                <input
                  type="text"
                  name="qr_code"
                  value={form.qr_code}
                  onChange={handleFormChange}
                  placeholder="Leave empty to let the server generate it"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  A unique value used to identify this attendance QR
                  code.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Expiry Date & Time
                </label>

                <input
                  type="datetime-local"
                  name="expires_at"
                  value={form.expires_at}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Optional. Leave empty if the QR code should not
                  have an expiry time.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <FaQrcode />

                  Generate QR Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          VIEW MODAL
      ================================================= */}

      {showViewModal && selectedQRCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
                  <FaQrcode />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    QR Code Details
                  </h2>

                  <p className="text-sm text-gray-500">
                    QR Code #{selectedQRCode.id ?? "—"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex justify-center">
                <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-4 border-blue-100 bg-gray-50">
                  <FaQrcode className="text-8xl text-blue-600" />
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  QR Value
                </p>

                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg bg-white p-3 text-sm font-semibold text-gray-800">
                    {selectedQRCode.qrValue ||
                      "No QR value available"}
                  </code>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        selectedQRCode.qrValue
                      )
                    }
                    disabled={!selectedQRCode.qrValue}
                    className="rounded-lg border border-gray-200 bg-white p-3 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Session
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    #{selectedQRCode.sessionId ?? "—"}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Status
                  </p>

                  <div className="mt-2">
                    <StatusBadge item={selectedQRCode} />
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Subject
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {selectedQRCode.subjectName}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Staff
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {selectedQRCode.staffName}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Class
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {selectedQRCode.className}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Created
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {formatDateTime(
                      selectedQRCode.createdDate
                    )}
                  </p>
                </div>
              </div>

              {selectedQRCode.expiryDate && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-center gap-2 text-orange-700">
                    <FaClock />

                    <span className="text-sm font-semibold">
                      Expiry
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-orange-800">
                    {formatDateTime(
                      selectedQRCode.expiryDate
                    )}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(selectedQRCode)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <FaDownload />

                  Download
                </button>

                {!selectedQRCode.used &&
                  !selectedQRCode.expired && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowViewModal(false);
                        handleMarkUsed(
                          selectedQRCode.id
                        );
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <FaCheckCircle />

                      Mark Used
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}