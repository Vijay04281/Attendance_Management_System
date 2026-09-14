import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaEye,
  FaTrash,
  FaTimes,
  FaHistory,
  FaUser,
  FaDatabase,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaFilter,
} from "react-icons/fa";

const API_BASE_URL = "https://attendance-management-system-gpci.onrender.com/api";

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
    item?.audit_log_id ??
    item?.auditLogId ??
    item?.log_id ??
    item?.logId ??
    item?.id ??
    null
  );
};

const getUserId = (item) => {
  return (
    item?.user_id ??
    item?.userId ??
    item?.staff_id ??
    item?.staffId ??
    item?.created_by ??
    item?.createdBy ??
    null
  );
};

const getUserName = (item) => {
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
    item?.user_name ||
    item?.userName ||
    item?.staff_name ||
    item?.staffName ||
    item?.username ||
    item?.staff?.username ||
    item?.staff?.full_name ||
    item?.staff?.fullName ||
    `${firstName} ${lastName}`.trim() ||
    "Unknown User"
  );
};

const getAction = (item) => {
  return (
    item?.action ??
    item?.action_type ??
    item?.actionType ??
    item?.operation ??
    item?.event ??
    "Unknown Action"
  );
};

const getEntity = (item) => {
  return (
    item?.entity ??
    item?.entity_type ??
    item?.entityType ??
    item?.table_name ??
    item?.tableName ??
    item?.module ??
    "System"
  );
};

const getDescription = (item) => {
  return (
    item?.description ??
    item?.details ??
    item?.message ??
    item?.activity ??
    item?.remarks ??
    ""
  );
};

const getIpAddress = (item) => {
  return (
    item?.ip_address ??
    item?.ipAddress ??
    item?.client_ip ??
    item?.clientIp ??
    "—"
  );
};

const getCreatedAt = (item) => {
  return (
    item?.created_at ??
    item?.createdAt ??
    item?.timestamp ??
    item?.logged_at ??
    item?.loggedAt ??
    ""
  );
};

const getStatus = (item) => {
  const value =
    item?.status ??
    item?.result ??
    item?.action_status ??
    item?.actionStatus ??
    "";

  if (!value) return "success";

  return String(value).toLowerCase();
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const normalizeAction = (action) => {
  return String(action || "")
    .trim()
    .toLowerCase();
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
// MAIN COMPONENT
// =====================================================

export default function AdminAuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] =
    useState("all");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedLog, setSelectedLog] =
    useState(null);

  const [deletingId, setDeletingId] =
    useState(null);

  // ===================================================
  // LOAD
  // ===================================================

  const loadAuditLogs = useCallback(async () => {
    const data = await apiRequest("/audit-logs");

    return getArray(data, [
      "auditLogs",
      "audit_logs",
      "logs",
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
        const logs = await loadAuditLogs();

        setAuditLogs(logs);
      } catch (err) {
        console.error(
          "Audit log loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load audit logs."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadAuditLogs]
  );

  useEffect(() => {
    loadAllData(true);
  }, [loadAllData]);

  // ===================================================
  // NORMALIZED DATA
  // ===================================================

  const normalizedLogs = useMemo(() => {
    return auditLogs.map((item) => ({
      ...item,

      id: getId(item),

      userId: getUserId(item),

      userName: getUserName(item),

      action: getAction(item),

      entity: getEntity(item),

      description: getDescription(item),

      ipAddress: getIpAddress(item),

      createdAt: getCreatedAt(item),

      status: getStatus(item),
    }));
  }, [auditLogs]);

  // ===================================================
  // ACTION OPTIONS
  // ===================================================

  const actionOptions = useMemo(() => {
    const values = normalizedLogs
      .map((item) => normalizeAction(item.action))
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [normalizedLogs]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredLogs = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return normalizedLogs.filter((item) => {
      const matchesSearch =
        !keyword ||
        String(item.id ?? "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.userId ?? "")
          .toLowerCase()
          .includes(keyword) ||
        item.userName
          .toLowerCase()
          .includes(keyword) ||
        item.action
          .toLowerCase()
          .includes(keyword) ||
        item.entity
          .toLowerCase()
          .includes(keyword) ||
        item.description
          .toLowerCase()
          .includes(keyword) ||
        item.ipAddress
          .toLowerCase()
          .includes(keyword);

      const matchesAction =
        actionFilter === "all" ||
        normalizeAction(item.action) ===
          actionFilter;

      const matchesStatus =
        statusFilter === "all" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesAction &&
        matchesStatus
      );
    });
  }, [
    normalizedLogs,
    search,
    actionFilter,
    statusFilter,
  ]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {
    const total = normalizedLogs.length;

    const successful =
      normalizedLogs.filter(
        (item) =>
          item.status === "success" ||
          item.status === "successful" ||
          item.status === "completed" ||
          item.status === "ok"
      ).length;

    const failed =
      normalizedLogs.filter(
        (item) =>
          item.status === "failed" ||
          item.status === "error" ||
          item.status === "failure"
      ).length;

    const today = new Date();

    const todayCount =
      normalizedLogs.filter((item) => {
        if (!item.createdAt) return false;

        const date = new Date(
          item.createdAt
        );

        if (Number.isNaN(date.getTime())) {
          return false;
        }

        return (
          date.getFullYear() ===
            today.getFullYear() &&
          date.getMonth() ===
            today.getMonth() &&
          date.getDate() ===
            today.getDate()
        );
      }).length;

    return {
      total,
      successful,
      failed,
      todayCount,
    };
  }, [normalizedLogs]);

  // ===================================================
  // VIEW
  // ===================================================

  const handleView = (item) => {
    setSelectedLog(item);
    setShowViewModal(true);
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this audit log?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/audit-logs/${id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Audit log deleted successfully."
      );

      if (
        selectedLog &&
        String(selectedLog.id) ===
          String(id)
      ) {
        setSelectedLog(null);
        setShowViewModal(false);
      }

      await loadAllData(false);
    } catch (err) {
      console.error(
        "Delete audit log error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete audit log."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // ACTION BADGE
  // ===================================================

  const ActionBadge = ({ action }) => {
    const normalized =
      normalizeAction(action);

    if (
      normalized.includes("delete") ||
      normalized.includes("remove")
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <FaTrash />
          {action}
        </span>
      );
    }

    if (
      normalized.includes("create") ||
      normalized.includes("insert") ||
      normalized.includes("add")
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <FaCheckCircle />
          {action}
        </span>
      );
    }

    if (
      normalized.includes("update") ||
      normalized.includes("edit")
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          <FaInfoCircle />
          {action}
        </span>
      );
    }

    if (
      normalized.includes("login") ||
      normalized.includes("logout")
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
          <FaUser />
          {action}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
        <FaInfoCircle />
        {action}
      </span>
    );
  };

  // ===================================================
  // STATUS BADGE
  // ===================================================

  const StatusBadge = ({ status }) => {
    const normalized = String(
      status || ""
    ).toLowerCase();

    if (
      normalized === "failed" ||
      normalized === "error" ||
      normalized === "failure"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <FaTimesCircle />
          Failed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <FaCheckCircle />
        Success
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
            <FaHistory className="mx-auto mb-4 animate-pulse text-5xl text-blue-600" />

            <p className="text-lg font-semibold text-gray-700">
              Loading audit logs...
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
            <FaHistory className="text-2xl" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Audit Logs
            </h1>

            <p className="text-sm text-gray-500">
              Monitor important system activities and changes.
            </p>
          </div>
        </div>

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
                Total Logs
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {statistics.total}
              </p>
            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <FaHistory className="text-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Successful
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {statistics.successful}
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
                Failed
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {statistics.failed}
              </p>
            </div>

            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <FaTimesCircle className="text-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Today
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-600">
                {statistics.todayCount}
              </p>
            </div>

            <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
              <FaCalendarAlt className="text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
          <FaFilter className="text-blue-600" />
          Filters
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
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
                placeholder="Search user, action, entity, IP..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Action
            </label>

            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All Actions
              </option>

              {actionOptions.map(
                (action) => (
                  <option
                    key={action}
                    value={action}
                  >
                    {action}
                  </option>
                )
              )}
            </select>
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

              <option value="success">
                Success
              </option>

              <option value="failed">
                Failed
              </option>

              <option value="error">
                Error
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            System Activity
          </h2>

          <p className="text-sm text-gray-500">
            Showing {filteredLogs.length} of{" "}
            {normalizedLogs.length} audit logs
          </p>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FaHistory className="mx-auto mb-4 text-5xl text-gray-300" />

            <h3 className="text-lg font-semibold text-gray-700">
              No audit logs found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-275 w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    User
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Action
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Entity
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Description
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    IP Address
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map(
                  (item) => (
                    <tr
                      key={
                        item.id ??
                        `${item.userName}-${item.createdAt}`
                      }
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-blue-100 p-2.5 text-blue-600">
                            <FaUser />
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.userName}
                            </p>

                            <p className="text-xs text-gray-400">
                              User ID:{" "}
                              {item.userId ??
                                "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <ActionBadge
                          action={
                            item.action
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FaDatabase className="text-gray-400" />

                          <span className="text-sm font-medium text-gray-700">
                            {item.entity}
                          </span>
                        </div>
                      </td>

                      <td className="max-w-75 px-5 py-4">
                        <p className="line-clamp-2 text-sm text-gray-600">
                          {item.description ||
                            "No description"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          {item.ipAddress}
                        </code>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            item.status
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaCalendarAlt className="text-gray-400" />

                          {formatDateTime(
                            item.createdAt
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="View details"
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
          VIEW MODAL
      ================================================= */}

      {showViewModal &&
        selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
                    <FaHistory />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Audit Log Details
                    </h2>

                    <p className="text-sm text-gray-500">
                      Log #
                      {selectedLog.id ??
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      User
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {
                        selectedLog.userName
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      User ID:{" "}
                      {selectedLog.userId ??
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Action
                    </p>

                    <div className="mt-2">
                      <ActionBadge
                        action={
                          selectedLog.action
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Entity
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {
                        selectedLog.entity
                      }
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Status
                    </p>

                    <div className="mt-2">
                      <StatusBadge
                        status={
                          selectedLog.status
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      IP Address
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold text-gray-800">
                      {
                        selectedLog.ipAddress
                      }
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Date & Time
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {formatDateTime(
                        selectedLog.createdAt
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Description
                  </p>

                  <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {selectedLog.description ||
                        "No description available."}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Raw Record
                  </p>

                  <pre className="max-h-64 overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-5 text-gray-100">
                    {JSON.stringify(
                      selectedLog,
                      null,
                      2
                    )}
                  </pre>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
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

                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(
                        false
                      );

                      handleDelete(
                        selectedLog.id
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    <FaTrash />

                    Delete Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}