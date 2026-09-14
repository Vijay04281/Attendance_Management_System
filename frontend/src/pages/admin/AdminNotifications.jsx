import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTrash,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaPaperPlane,
  FaUsers,
  FaUser,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaInfoCircle,
} from "react-icons/fa";

const API_BASE_URL = "https://attendance-management-system-gpci.onrender.com/api";

// =====================================================
// HELPERS
// =====================================================

const getToken = () => localStorage.getItem("token");

const getArray = (data, keys = []) => {
  if (Array.isArray(data)) return data;

  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.rows)) return data.rows;
  if (data && Array.isArray(data.results)) return data.results;

  for (const key of keys) {
    if (data && Array.isArray(data[key])) {
      return data[key];
    }
  }

  return [];
};

const getId = (item) => {
  return (
    item?.notification_id ??
    item?.notificationId ??
    item?.id ??
    null
  );
};

const getTitle = (item) => {
  return (
    item?.title ??
    item?.notification_title ??
    item?.notificationTitle ??
    item?.subject ??
    "Untitled Notification"
  );
};

const getMessage = (item) => {
  return (
    item?.message ??
    item?.notification_message ??
    item?.notificationMessage ??
    item?.content ??
    item?.description ??
    ""
  );
};

const getRecipientType = (item) => {
  return (
    item?.recipient_type ??
    item?.recipientType ??
    item?.target_type ??
    item?.targetType ??
    item?.audience ??
    item?.role ??
    "all"
  );
};

const getStatus = (item) => {
  const value =
    item?.status ??
    item?.notification_status ??
    item?.notificationStatus ??
    "";

  if (!value) {
    const sent =
      item?.is_sent ??
      item?.isSent ??
      item?.sent;

    if (
      sent === true ||
      sent === 1 ||
      String(sent).toLowerCase() === "true"
    ) {
      return "sent";
    }

    return "draft";
  }

  return String(value).toLowerCase();
};

const getCreatedAt = (item) => {
  return (
    item?.created_at ??
    item?.createdAt ??
    item?.created_on ??
    item?.createdOn ??
    ""
  );
};

const getSentAt = (item) => {
  return (
    item?.sent_at ??
    item?.sentAt ??
    item?.published_at ??
    item?.publishedAt ??
    ""
  );
};

const getPriority = (item) => {
  return (
    item?.priority ??
    item?.notification_priority ??
    item?.notificationPriority ??
    "normal"
  );
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const normalizeRecipientType = (value) => {
  const normalized = String(value || "all").toLowerCase();

  if (
    normalized === "student" ||
    normalized === "students"
  ) {
    return "students";
  }

  if (
    normalized === "staff" ||
    normalized === "teacher" ||
    normalized === "teachers"
  ) {
    return "staff";
  }

  if (
    normalized === "class_teacher" ||
    normalized === "class teachers" ||
    normalized === "classteacher"
  ) {
    return "class_teachers";
  }

  if (
    normalized === "hod" ||
    normalized === "h.o.d"
  ) {
    return "hod";
  }

  return "all";
};

// =====================================================
// API REQUEST
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

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

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
// COMPONENT
// =====================================================

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [recipientFilter, setRecipientFilter] =
    useState("all");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedNotification, setSelectedNotification] =
    useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    message: "",
    recipient_type: "all",
    priority: "normal",
    status: "sent",
  });

  // ===================================================
  // LOAD NOTIFICATIONS
  // ===================================================

  const loadNotifications = useCallback(async () => {
    const data = await apiRequest("/notifications");

    return getArray(data, [
      "notifications",
      "data",
      "rows",
      "results",
    ]);
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
        const notificationData =
          await loadNotifications();

        setNotifications(notificationData);
      } catch (err) {
        console.error(
          "Notification loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load notifications."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadNotifications]
  );

  useEffect(() => {
    loadAllData(true);
  }, [loadAllData]);

  // ===================================================
  // NORMALIZE
  // ===================================================

  const normalizedNotifications = useMemo(() => {
    return notifications.map((item) => ({
      ...item,

      id: getId(item),

      title: getTitle(item),

      message: getMessage(item),

      recipientType:
        normalizeRecipientType(
          getRecipientType(item)
        ),

      status: getStatus(item),

      createdAt: getCreatedAt(item),

      sentAt: getSentAt(item),

      priority: String(
        getPriority(item)
      ).toLowerCase(),
    }));
  }, [notifications]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredNotifications = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return normalizedNotifications.filter(
      (item) => {
        const matchesSearch =
          !keyword ||
          String(item.id ?? "")
            .toLowerCase()
            .includes(keyword) ||
          item.title
            .toLowerCase()
            .includes(keyword) ||
          item.message
            .toLowerCase()
            .includes(keyword) ||
          item.recipientType
            .toLowerCase()
            .includes(keyword);

        const matchesStatus =
          statusFilter === "all" ||
          item.status === statusFilter;

        const matchesRecipient =
          recipientFilter === "all" ||
          item.recipientType ===
            recipientFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesRecipient
        );
      }
    );
  }, [
    normalizedNotifications,
    search,
    statusFilter,
    recipientFilter,
  ]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {
    const total =
      normalizedNotifications.length;

    const sent =
      normalizedNotifications.filter(
        (item) =>
          item.status === "sent" ||
          item.status === "published"
      ).length;

    const drafts =
      normalizedNotifications.filter(
        (item) =>
          item.status === "draft"
      ).length;

    const highPriority =
      normalizedNotifications.filter(
        (item) =>
          item.priority === "high" ||
          item.priority === "urgent"
      ).length;

    return {
      total,
      sent,
      drafts,
      highPriority,
    };
  }, [normalizedNotifications]);

  // ===================================================
  // FORM
  // ===================================================

  const resetForm = () => {
    setForm({
      title: "",
      message: "",
      recipient_type: "all",
      priority: "normal",
      status: "sent",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
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

  // ===================================================
  // CREATE
  // ===================================================

  const handleCreate = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Notification title is required.");
      return;
    }

    if (!form.message.trim()) {
      setError("Notification message is required.");
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        recipient_type: form.recipient_type,
        priority: form.priority,
        status: form.status,
      };

      await apiRequest("/notifications", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(
        form.status === "sent"
          ? "Notification sent successfully."
          : "Notification saved successfully."
      );

      setShowCreateModal(false);

      resetForm();

      await loadAllData(false);
    } catch (err) {
      console.error(
        "Create notification error:",
        err
      );

      setError(
        err.message ||
          "Unable to create notification."
      );
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this notification?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/notifications/${id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Notification deleted successfully."
      );

      if (
        selectedNotification &&
        String(
          selectedNotification.id
        ) === String(id)
      ) {
        setSelectedNotification(null);
        setShowViewModal(false);
      }

      await loadAllData(false);
    } catch (err) {
      console.error(
        "Delete notification error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete notification."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (item) => {
    setSelectedNotification(item);
    setShowViewModal(true);
  };

  // ===================================================
  // BADGES
  // ===================================================

  const StatusBadge = ({ status }) => {
    if (
      status === "sent" ||
      status === "published"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <FaCheckCircle />
          Sent
        </span>
      );
    }

    if (status === "failed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <FaTimesCircle />
          Failed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
        <FaInfoCircle />
        Draft
      </span>
    );
  };

  const PriorityBadge = ({ priority }) => {
    if (
      priority === "urgent"
    ) {
      return (
        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
          Urgent
        </span>
      );
    }

    if (
      priority === "high"
    ) {
      return (
        <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
          High
        </span>
      );
    }

    if (
      priority === "low"
    ) {
      return (
        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          Low
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        Normal
      </span>
    );
  };

  const RecipientBadge = ({
    recipientType,
  }) => {
    if (
      recipientType === "students"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
          <FaUserGraduate />
          Students
        </span>
      );
    }

    if (
      recipientType === "staff"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          <FaUser />
          Staff
        </span>
      );
    }

    if (
      recipientType ===
      "class_teachers"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          <FaChalkboardTeacher />
          Class Teachers
        </span>
      );
    }

    if (
      recipientType === "hod"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          <FaUser />
          HOD
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <FaUsers />
        Everyone
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
            <FaBell className="mx-auto mb-4 animate-pulse text-5xl text-blue-600" />

            <p className="text-lg font-semibold text-gray-700">
              Loading notifications...
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
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3 text-white shadow">
            <FaBell className="text-2xl" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Notifications
            </h1>

            <p className="text-sm text-gray-500">
              Create and manage system notifications.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              loadAllData(false)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSyncAlt
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <FaPlus />

            New Notification
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
                Total
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {statistics.total}
              </p>
            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <FaBell className="text-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Sent
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {statistics.sent}
              </p>
            </div>

            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <FaPaperPlane className="text-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Drafts
              </p>

              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {statistics.drafts}
              </p>
            </div>

            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
              <FaInfoCircle className="text-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                High Priority
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {statistics.highPriority}
              </p>
            </div>

            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <FaBell className="text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Search
            </label>

            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search notifications..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                setStatusFilter(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All Statuses
              </option>

              <option value="sent">
                Sent
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="failed">
                Failed
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Recipient
            </label>

            <select
              value={recipientFilter}
              onChange={(event) =>
                setRecipientFilter(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All Recipients
              </option>

              <option value="students">
                Students
              </option>

              <option value="staff">
                Staff
              </option>

              <option value="class_teachers">
                Class Teachers
              </option>

              <option value="hod">
                HOD
              </option>
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
              Notification Records
            </h2>

            <p className="text-sm text-gray-500">
              Showing{" "}
              {filteredNotifications.length}{" "}
              of{" "}
              {normalizedNotifications.length}
            </p>
          </div>
        </div>

        {filteredNotifications.length ===
        0 ? (
          <div className="px-6 py-16 text-center">
            <FaBell className="mx-auto mb-4 text-5xl text-gray-300" />

            <h3 className="text-lg font-semibold text-gray-700">
              No notifications found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or create a
              new notification.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <FaPlus />

              New Notification
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-262.5 w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Notification
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Recipient
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Priority
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Created
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredNotifications.map(
                  (item) => (
                    <tr
                      key={
                        item.id ??
                        `${item.title}-${item.createdAt}`
                      }
                      className="transition hover:bg-gray-50"
                    >
                      <td className="max-w-112.5 px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 rounded-lg bg-blue-100 p-2.5 text-blue-600">
                            <FaBell />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                              {item.title}
                            </p>

                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {item.message ||
                                "No message"}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              ID: #
                              {item.id ??
                                "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <RecipientBadge
                          recipientType={
                            item.recipientType
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <PriorityBadge
                          priority={
                            item.priority
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            item.status
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm text-gray-700">
                            {formatDateTime(
                              item.createdAt
                            )}
                          </p>

                          {item.sentAt && (
                            <p className="mt-1 text-xs text-gray-400">
                              Sent:{" "}
                              {formatDateTime(
                                item.sentAt
                              )}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="View"
                            onClick={() =>
                              handleView(
                                item
                              )
                            }
                            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                          >
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            onClick={() =>
                              handleDelete(
                                item.id
                              )
                            }
                            disabled={
                              deletingId ===
                              item.id
                            }
                            className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId ===
                            item.id ? (
                              <FaSyncAlt className="animate-spin" />
                            ) : (
                              <FaTrash />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
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
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
                  <FaBell />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    New Notification
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Send a notification to system users.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateModal
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
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
                  Title
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={
                    handleFormChange
                  }
                  placeholder="Enter notification title"
                  maxLength={255}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Message
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={
                    handleFormChange
                  }
                  placeholder="Enter notification message..."
                  rows={5}
                  required
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Recipient
                  </label>

                  <select
                    name="recipient_type"
                    value={
                      form.recipient_type
                    }
                    onChange={
                      handleFormChange
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">
                      Everyone
                    </option>

                    <option value="students">
                      Students
                    </option>

                    <option value="staff">
                      Staff
                    </option>

                    <option value="class_teachers">
                      Class Teachers
                    </option>

                    <option value="hod">
                      HOD
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Priority
                  </label>

                  <select
                    name="priority"
                    value={
                      form.priority
                    }
                    onChange={
                      handleFormChange
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="low">
                      Low
                    </option>

                    <option value="normal">
                      Normal
                    </option>

                    <option value="high">
                      High
                    </option>

                    <option value="urgent">
                      Urgent
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={
                    handleFormChange
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="sent">
                    Send Now
                  </option>

                  <option value="draft">
                    Save as Draft
                  </option>
                </select>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="mt-0.5 text-blue-600" />

                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      Notification preview
                    </p>

                    <p className="mt-1 text-sm text-blue-700">
                      {form.message ||
                        "Your notification message will appear here."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeCreateModal
                  }
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {form.status ===
                  "sent" ? (
                    <>
                      <FaPaperPlane />
                      Send Notification
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Save Draft
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          VIEW MODAL
      ================================================= */}

      {showViewModal &&
        selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
                    <FaBell />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Notification Details
                    </h2>

                    <p className="text-sm text-gray-500">
                      Notification #
                      {selectedNotification.id ??
                        "—"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Title
                  </p>

                  <h3 className="mt-1 text-2xl font-bold text-gray-900">
                    {
                      selectedNotification.title
                    }
                  </h3>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Message
                  </p>

                  <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {
                        selectedNotification.message
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-400">
                      Recipient
                    </p>

                    <div className="mt-2">
                      <RecipientBadge
                        recipientType={
                          selectedNotification.recipientType
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-400">
                      Priority
                    </p>

                    <div className="mt-2">
                      <PriorityBadge
                        priority={
                          selectedNotification.priority
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-400">
                      Status
                    </p>

                    <div className="mt-2">
                      <StatusBadge
                        status={
                          selectedNotification.status
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-400">
                      Created
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {formatDateTime(
                        selectedNotification.createdAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-400">
                      Sent
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {formatDateTime(
                        selectedNotification.sentAt
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end border-t border-gray-200 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      setShowViewModal(
                        false
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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