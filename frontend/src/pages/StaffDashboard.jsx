import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaQrcode,
  FaUsers,
  FaCheckCircle,
  FaPercentage,
  FaPlay,
  FaStop,
  FaSyncAlt,
  FaBook,
  FaClipboardCheck,
  FaChartBar,
} from "react-icons/fa";

const API_URL =
  "https://attendance-management-system-gpci.onrender.com/api";

function StaffDashboard() {
  // =====================================================
  // STATE
  // =====================================================

  const [subjects, setSubjects] = useState([]);

  // IMPORTANT:
  // Always select using allocation_id.
  // This prevents the same subject allocated to different
  // classes from being mixed.
  const [selectedAllocationId, setSelectedAllocationId] =
    useState("");

  const [sessionId, setSessionId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("CLOSED");

  const [qrImage, setQrImage] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState(null);

  const [present, setPresent] = useState(0);
  const [total, setTotal] = useState(0);
  const [percentage, setPercentage] = useState(0);

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [secondsLeft, setSecondsLeft] = useState(0);

  const qrTimerRef = useRef(null);
  const countTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // Prevent old async requests from updating state
  // after the session has changed.
  const attendanceRequestRef = useRef(0);

  // =====================================================
  // AUTH
  // =====================================================

  const token = localStorage.getItem("token");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  // =====================================================
  // AUTH HEADERS
  // =====================================================

  const getHeaders = useCallback(() => {
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }, [token]);

  // =====================================================
  // LOAD STAFF SUBJECT ALLOCATIONS
  // =====================================================

  const loadSubjects = useCallback(async () => {
    try {
      setLoadingSubjects(true);
      setError("");

      const response = await fetch(
        `${API_URL}/subject-allocations/staff`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      console.log(
        "Staff subject allocations response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load allocated subjects"
        );
      }

      const allocations = Array.isArray(data.allocations)
        ? data.allocations
        : Array.isArray(data.subjects)
        ? data.subjects
        : [];

      const staffSubjects = allocations
        .filter(
          (allocation) =>
            allocation.allocation_id !== undefined &&
            allocation.allocation_id !== null
        )
        .map((allocation) => ({
          ...allocation,

          allocation_id: Number(
            allocation.allocation_id
          ),

          subject_id:
            allocation.subject_id !== undefined &&
            allocation.subject_id !== null
              ? Number(allocation.subject_id)
              : null,

          subject_code:
            allocation.subject_code ||
            `SUB-${allocation.subject_id}`,

          subject_name:
            allocation.subject_name ||
            "Unnamed Subject",

          class_id:
            allocation.class_id !== undefined &&
            allocation.class_id !== null
              ? Number(allocation.class_id)
              : null,

          class_year:
            allocation.class_year !== undefined &&
            allocation.class_year !== null
              ? Number(allocation.class_year)
              : allocation.year !== undefined &&
                allocation.year !== null
              ? Number(allocation.year)
              : null,

          class_section:
            allocation.class_section ||
            allocation.section ||
            "",

          academic_year:
            allocation.academic_year ||
            "",

          semester:
            allocation.semester !== undefined &&
            allocation.semester !== null
              ? Number(allocation.semester)
              : null,
        }));

      console.log(
        "Normalized staff allocations:",
        staffSubjects
      );

      setSubjects(staffSubjects);

      // Keep current allocation if still available.
      if (staffSubjects.length > 0) {
        setSelectedAllocationId((current) => {
          const currentExists = staffSubjects.some(
            (allocation) =>
              Number(allocation.allocation_id) ===
              Number(current)
          );

          if (current && currentExists) {
            return current;
          }

          return String(
            staffSubjects[0].allocation_id
          );
        });
      } else {
        setSelectedAllocationId("");
      }
    } catch (err) {
      console.error(
        "Load staff subject allocations error:",
        err
      );

      setSubjects([]);
      setSelectedAllocationId("");

      setError(
        err.message ||
          "Failed to load allocated subjects"
      );
    } finally {
      setLoadingSubjects(false);
    }
  }, [getHeaders]);

  // =====================================================
  // LOAD QR
  // =====================================================

  const loadQR = useCallback(
    async (id) => {
      if (!id) {
        return;
      }

      try {
        setLoadingQR(true);

        const response = await fetch(
          `${API_URL}/attendance-sessions/${id}/qr`,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load QR"
          );
        }

        setQrImage(data.qr_image || "");

        setQrExpiresAt(
          data.qr_expires_at || null
        );
      } catch (err) {
        console.error(
          "Load QR error:",
          err
        );

        setError(
          err.message ||
            "Failed to load QR"
        );
      } finally {
        setLoadingQR(false);
      }
    },
    [getHeaders]
  );

  // =====================================================
  // NORMALIZE ATTENDANCE ARRAY
  // =====================================================

  const extractAttendanceRecords = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (
      data &&
      Array.isArray(data.attendance)
    ) {
      return data.attendance;
    }

    if (
      data &&
      Array.isArray(data.records)
    ) {
      return data.records;
    }

    if (
      data &&
      Array.isArray(data.attendance_records)
    ) {
      return data.attendance_records;
    }

    return [];
  };

  // =====================================================
  // LOAD ATTENDANCE COUNT
  //
  // PRIMARY:
  // GET /attendance/session/:id/count
  //
  // FALLBACK:
  // GET /attendance/session/:id
  //
  // The fallback is important because the current
  // attendanceRoutes.js contains /session/:sessionId
  // but does NOT contain /session/:sessionId/count.
  // =====================================================

  const loadAttendanceCount = useCallback(
    async (id) => {
      if (!id) {
        return;
      }

      const requestId =
        ++attendanceRequestRef.current;

      try {
        // =================================================
        // FIRST TRY THE COUNT ENDPOINT
        // =================================================

        const countResponse = await fetch(
          `${API_URL}/attendance/session/${id}/count`,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        let countData = null;

        try {
          countData =
            await countResponse.json();
        } catch {
          countData = null;
        }

        if (countResponse.ok) {
          if (
            requestId !==
            attendanceRequestRef.current
          ) {
            return;
          }

          const newPresent = Number(
            countData?.present ?? 0
          );

          const newTotal = Number(
            countData?.total ??
              countData?.total_students ??
              0
          );

          const newPercentage =
            Number(
              countData?.percentage ??
                (newTotal > 0
                  ? (
                      (newPresent /
                        newTotal) *
                      100
                    ).toFixed(2)
                  : 0)
            );

          setPresent(newPresent);
          setTotal(newTotal);
          setPercentage(
            Math.min(
              Math.max(newPercentage, 0),
              100
            )
          );

          if (
            countData?.session_status
          ) {
            setSessionStatus(
              countData.session_status
            );
          }

          return;
        }

        // =================================================
        // COUNT ENDPOINT DOES NOT EXIST
        //
        // FALLBACK TO ACTUAL ATTENDANCE RECORDS
        // =================================================

        console.warn(
          "Attendance count endpoint unavailable. Falling back to session attendance records.",
          countData
        );

        const recordsResponse =
          await fetch(
            `${API_URL}/attendance/session/${id}`,
            {
              method: "GET",
              headers: getHeaders(),
            }
          );

        const recordsData =
          await recordsResponse.json();

        if (!recordsResponse.ok) {
          throw new Error(
            recordsData?.message ||
              "Failed to load attendance records"
          );
        }

        if (
          requestId !==
          attendanceRequestRef.current
        ) {
          return;
        }

        console.log(
          "Session attendance records:",
          recordsData
        );

        const records =
          extractAttendanceRecords(
            recordsData
          );

        // =================================================
        // CALCULATE PRESENT
        //
        // PRESENT and LATE both mean the student attended.
        // =================================================

        const attendedRecords =
          records.filter((record) => {
            const status = String(
              record.status ||
                record.attendance_status ||
                ""
            )
              .trim()
              .toUpperCase();

            return (
              status === "PRESENT" ||
              status === "LATE"
            );
          });

        const newPresent =
          attendedRecords.length;

        // =================================================
        // TOTAL STUDENTS
        //
        // Prefer backend-provided total.
        // Otherwise use a students array if supplied.
        // If neither exists, keep the current total.
        // =================================================

        let newTotal = Number(
          recordsData?.total_students ??
            recordsData?.total ??
            recordsData?.student_count ??
            0
        );

        if (
          !newTotal &&
          Array.isArray(
            recordsData?.students
          )
        ) {
          newTotal =
            recordsData.students.length;
        }

        if (!newTotal) {
          newTotal = total;
        }

        const newPercentage =
          newTotal > 0
            ? Number(
                (
                  (newPresent /
                    newTotal) *
                  100
                ).toFixed(2)
              )
            : 0;

        setPresent(newPresent);
        setTotal(newTotal);

        setPercentage(
          Math.min(
            Math.max(newPercentage, 0),
            100
          )
        );

        // Some controller responses include session info.
        const returnedSession =
          recordsData?.session ||
          recordsData?.attendanceSession;

        if (
          returnedSession?.status
        ) {
          setSessionStatus(
            returnedSession.status
          );
        }
      } catch (err) {
        console.error(
          "Attendance count error:",
          err
        );
      }
    },
    [getHeaders, total]
  );

  // =====================================================
  // LOAD ACTIVE SESSION
  // =====================================================

  const loadActiveSession =
    useCallback(async () => {
      try {
        const response = await fetch(
          `${API_URL}/attendance-sessions/active`,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load active session"
          );
        }

        const sessions =
          Array.isArray(data.sessions)
            ? data.sessions
            : [];

        if (sessions.length > 0) {
          const session = sessions[0];

          console.log(
            "Active attendance session:",
            session
          );

          setSessionId(
            session.session_id
          );

          setSessionStatus(
            session.status || "ACTIVE"
          );

          // =================================================
          // MATCH BY ALLOCATION ID
          // =================================================

          if (
            session.allocation_id !==
              undefined &&
            session.allocation_id !==
              null
          ) {
            const allocation =
              subjects.find(
                (item) =>
                  Number(
                    item.allocation_id
                  ) ===
                  Number(
                    session.allocation_id
                  )
              );

            if (allocation) {
              setSelectedAllocationId(
                String(
                  allocation.allocation_id
                )
              );
            }
          } else if (
            session.subject_id
          ) {
            // Backward compatibility.
            const allocation =
              subjects.find(
                (item) =>
                  Number(
                    item.subject_id
                  ) ===
                  Number(
                    session.subject_id
                  )
              );

            if (allocation) {
              setSelectedAllocationId(
                String(
                  allocation.allocation_id
                )
              );
            }
          }

          await loadQR(
            session.session_id
          );

          await loadAttendanceCount(
            session.session_id
          );
        } else {
          setSessionId(null);
          setSessionStatus("CLOSED");

          setQrImage("");
          setQrExpiresAt(null);

          setPresent(0);
          setTotal(0);
          setPercentage(0);
          setSecondsLeft(0);
        }
      } catch (err) {
        console.error(
          "Load active session error:",
          err
        );

        setError(
          err.message ||
            "Failed to load active session"
        );
      }
    }, [
      getHeaders,
      loadQR,
      loadAttendanceCount,
      subjects,
    ]);

  // =====================================================
  // START ATTENDANCE SESSION
  // =====================================================

  const startAttendance = async () => {
    if (!selectedAllocationId) {
      setError(
        "Please select a subject and class."
      );
      return;
    }

    const selectedAllocation =
      subjects.find(
        (allocation) =>
          Number(
            allocation.allocation_id
          ) ===
          Number(
            selectedAllocationId
          )
      );

    if (!selectedAllocation) {
      setError(
        "The selected allocation is not assigned to you."
      );
      return;
    }

    if (!selectedAllocation.subject_id) {
      setError(
        "Selected allocation does not contain a subject."
      );
      return;
    }

    if (!selectedAllocation.class_id) {
      setError(
        "This subject does not have a class assigned."
      );
      return;
    }

    try {
      setLoadingSession(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/attendance-sessions`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            allocation_id:
              Number(
                selectedAllocation.allocation_id
              ),

            subject_id:
              Number(
                selectedAllocation.subject_id
              ),

            class_id:
              Number(
                selectedAllocation.class_id
              ),

            academic_year:
              selectedAllocation.academic_year ||
              null,

            semester:
              selectedAllocation.semester ||
              null,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Start attendance response:",
        data
      );

      if (!response.ok) {
        // Backend may return an already-existing session.
        if (data.session_id) {
          setSessionId(
            data.session_id
          );

          setSessionStatus("ACTIVE");

          await loadQR(
            data.session_id
          );

          await loadAttendanceCount(
            data.session_id
          );
        }

        throw new Error(
          data.message ||
            "Failed to start attendance"
        );
      }

      setSessionId(
        data.session_id
      );

      setSessionStatus("ACTIVE");

      setQrImage(
        data.qr_image || ""
      );

      setQrExpiresAt(
        data.qr_expires_at || null
      );

      setPresent(0);
      setTotal(0);
      setPercentage(0);

      setMessage(
        "Attendance session started successfully"
      );

      await loadAttendanceCount(
        data.session_id
      );
    } catch (err) {
      console.error(
        "Start attendance error:",
        err
      );

      setError(
        err.message ||
          "Failed to start attendance"
      );
    } finally {
      setLoadingSession(false);
    }
  };

  // =====================================================
  // CLOSE SESSION
  // =====================================================

  const closeAttendance = async () => {
    if (!sessionId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to close this attendance session?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoadingSession(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/attendance-sessions/${sessionId}/close`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to close session"
        );
      }

      setMessage(
        "Attendance session closed successfully"
      );

      setSessionStatus("CLOSED");
      setSessionId(null);

      setQrImage("");
      setQrExpiresAt(null);

      setSecondsLeft(0);

      setPresent(0);
      setTotal(0);
      setPercentage(0);
    } catch (err) {
      console.error(
        "Close session error:",
        err
      );

      setError(
        err.message ||
          "Failed to close session"
      );
    } finally {
      setLoadingSession(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    loadSubjects();
  }, [token, loadSubjects]);

  // =====================================================
  // LOAD ACTIVE SESSION AFTER SUBJECTS
  // =====================================================

  useEffect(() => {
    if (
      !token ||
      loadingSubjects
    ) {
      return;
    }

    loadActiveSession();
  }, [
    token,
    loadingSubjects,
    loadActiveSession,
  ]);

  // =====================================================
  // QR REFRESH EVERY 15 SECONDS
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      sessionStatus !== "ACTIVE"
    ) {
      return;
    }

    loadQR(sessionId);

    qrTimerRef.current =
      setInterval(() => {
        loadQR(sessionId);
      }, 15000);

    return () => {
      if (qrTimerRef.current) {
        clearInterval(
          qrTimerRef.current
        );

        qrTimerRef.current = null;
      }
    };
  }, [
    sessionId,
    sessionStatus,
    loadQR,
  ]);

  // =====================================================
  // LIVE ATTENDANCE REFRESH EVERY 2 SECONDS
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      sessionStatus !== "ACTIVE"
    ) {
      return;
    }

    loadAttendanceCount(
      sessionId
    );

    countTimerRef.current =
      setInterval(() => {
        loadAttendanceCount(
          sessionId
        );
      }, 2000);

    return () => {
      if (countTimerRef.current) {
        clearInterval(
          countTimerRef.current
        );

        countTimerRef.current = null;
      }
    };
  }, [
    sessionId,
    sessionStatus,
    loadAttendanceCount,
  ]);

  // =====================================================
  // QR COUNTDOWN
  // =====================================================

  useEffect(() => {
    if (
      !qrExpiresAt ||
      sessionStatus !== "ACTIVE"
    ) {
      setSecondsLeft(0);
      return;
    }

    const updateCountdown = () => {
      const expiry =
        new Date(
          qrExpiresAt
        ).getTime();

      const now =
        Date.now();

      const remaining =
        Math.max(
          0,
          Math.ceil(
            (expiry - now) /
              1000
          )
        );

      setSecondsLeft(
        remaining
      );
    };

    updateCountdown();

    countdownTimerRef.current =
      setInterval(
        updateCountdown,
        1000
      );

    return () => {
      if (
        countdownTimerRef.current
      ) {
        clearInterval(
          countdownTimerRef.current
        );

        countdownTimerRef.current =
          null;
      }
    };
  }, [
    qrExpiresAt,
    sessionStatus,
  ]);

  // =====================================================
  // SELECTED ALLOCATION
  // =====================================================

  const selectedSubjectData =
    subjects.find(
      (allocation) =>
        Number(
          allocation.allocation_id
        ) ===
        Number(
          selectedAllocationId
        )
    );

  const isActive =
    sessionStatus === "ACTIVE";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="w-full min-w-0">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Staff Dashboard
          </h1>

          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Manage classroom attendance with QR technology
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="font-semibold text-slate-800 truncate max-w-45">
              {user.username ||
                "Staff User"}
            </p>

            <p className="text-sm text-slate-500">
              STAFF
            </p>
          </div>

          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
            {(user.username ||
              "S"
            )
              .charAt(0)
              .toUpperCase()}
          </div>
        </div>
      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {message && (
        <div className="mb-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">

        {/* Total Students */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 min-h-36">
          <div className="flex h-full items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Total Students
              </p>

              <h2 className="text-3xl font-bold text-slate-800 mt-3">
                {total}
              </h2>

              <p className="text-xs text-slate-400 mt-2">
                Current class
              </p>
            </div>

            <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FaUsers size={21} />
            </div>
          </div>
        </div>

        {/* Present */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 min-h-36">
          <div className="flex h-full items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Present Today
              </p>

              <h2 className="text-3xl font-bold text-green-600 mt-3">
                {present}
              </h2>

              <p className="text-xs text-slate-400 mt-2">
                Live attendance
              </p>
            </div>

            <div className="w-12 h-12 shrink-0 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <FaCheckCircle size={21} />
            </div>
          </div>
        </div>

        {/* Percentage */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 min-h-36">
          <div className="flex h-full items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Attendance Rate
              </p>

              <h2 className="text-3xl font-bold text-blue-600 mt-3">
                {percentage}%
              </h2>

              <p className="text-xs text-slate-400 mt-2">
                Current class
              </p>
            </div>

            <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FaPercentage size={21} />
            </div>
          </div>
        </div>

        {/* Session Status */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 min-h-36">
          <div className="flex h-full items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">
                Session Status
              </p>

              <h2
                className={`text-xl font-bold mt-3 ${
                  isActive
                    ? "text-green-600"
                    : "text-slate-500"
                }`}
              >
                {isActive
                  ? "ACTIVE"
                  : "CLOSED"}
              </h2>

              <p className="text-xs text-slate-400 mt-2 truncate">
                {sessionId
                  ? `Session #${sessionId}`
                  : "No active session"}
              </p>
            </div>

            <div
              className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${
                isActive
                  ? "bg-green-50 text-green-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <FaClipboardCheck
                size={21}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="grid w-full min-w-0 grid-cols-1 gap-5 lg:gap-6 mt-6 items-start xl:grid-cols-3">

        {/* =================================================
            QR ATTENDANCE
        ================================================= */}

        <div className="min-w-0 xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          <div className="p-5 sm:p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <FaQrcode size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  QR Attendance
                </h2>

                <p className="text-sm text-slate-500 mt-0.5">
                  Students scan this QR code to mark attendance
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">

            {/* Subject + Class */}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Subject & Class
              </label>

              <select
                value={
                  selectedAllocationId
                }
                onChange={(e) =>
                  setSelectedAllocationId(
                    e.target.value
                  )
                }
                disabled={
                  isActive ||
                  loadingSubjects
                }
                className="w-full h-12 border border-slate-200 rounded-xl px-4 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
              >
                {loadingSubjects ? (
                  <option>
                    Loading allocated subjects...
                  </option>
                ) : subjects.length ===
                  0 ? (
                  <option value="">
                    No subjects assigned
                  </option>
                ) : (
                  subjects.map(
                    (allocation) => (
                      <option
                        key={
                          allocation.allocation_id
                        }
                        value={
                          allocation.allocation_id
                        }
                      >
                        {
                          allocation.subject_code
                        }{" "}
                        -{" "}
                        {
                          allocation.subject_name
                        }

                        {allocation.class_year
                          ? ` (${allocation.class_year}`
                          : ""}

                        {allocation.class_section
                          ? `-${allocation.class_section})`
                          : allocation.class_year
                          ? ")"
                          : ""}

                        {allocation.academic_year
                          ? ` - ${allocation.academic_year}`
                          : ""}
                      </option>
                    )
                  )
                )}
              </select>
            </div>

            {/* Selected Allocation */}

            {selectedSubjectData && (
              <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FaBook />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="font-semibold text-slate-800 truncate">
                      {
                        selectedSubjectData.subject_name
                      }
                    </p>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {
                        selectedSubjectData.subject_code
                      }
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">

                      <span className="text-xs text-slate-500">
                        Class:{" "}
                        <span className="font-semibold text-slate-700">
                          {selectedSubjectData.class_year
                            ? `${selectedSubjectData.class_year}-${selectedSubjectData.class_section || ""}`
                            : selectedSubjectData.class_section ||
                              "-"}
                        </span>
                      </span>

                      <span className="text-xs text-slate-500">
                        Academic Year:{" "}
                        <span className="font-semibold text-slate-700">
                          {
                            selectedSubjectData.academic_year ||
                            "-"
                          }
                        </span>
                      </span>

                      <span className="text-xs text-slate-500">
                        Semester:{" "}
                        <span className="font-semibold text-slate-700">
                          {
                            selectedSubjectData.semester ||
                            "-"
                          }
                        </span>
                      </span>

                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Start */}

            {!isActive ? (
              <button
                onClick={
                  startAttendance
                }
                disabled={
                  loadingSession ||
                  !selectedAllocationId ||
                  subjects.length === 0
                }
                className="w-full mt-5 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
              >
                <FaPlay />

                {loadingSession
                  ? "Starting..."
                  : "Start Attendance"}
              </button>
            ) : (
              <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4">

                <div className="flex items-center gap-3">

                  <div className="w-3 h-3 shrink-0 bg-green-500 rounded-full animate-pulse" />

                  <div>
                    <p className="font-bold text-green-700">
                      Attendance session is active
                    </p>

                    <p className="text-sm text-green-600 mt-0.5">
                      Students from the selected class can scan the QR code
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* QR DISPLAY */}

            <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-5 sm:p-6">

              {isActive &&
              qrImage ? (
                <div className="text-center">

                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    QR Active
                  </div>

                  <div className="mt-5 flex justify-center">

                    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">

                      <img
                        src={qrImage}
                        alt="Attendance QR Code"
                        className="w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 object-contain"
                      />

                    </div>
                  </div>

                  <div className="mt-5">

                    <p className="text-slate-600 font-medium">
                      QR changes automatically
                    </p>

                    <div className="mt-2 inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full">

                      <FaSyncAlt
                        className={`text-blue-600 ${
                          loadingQR
                            ? "animate-spin"
                            : ""
                        }`}
                      />

                      <span className="text-blue-600 font-bold">
                        {secondsLeft}s
                      </span>

                    </div>
                  </div>

                </div>
              ) : (
                <div className="min-h-90 flex flex-col items-center justify-center text-center px-4">

                  <div className="w-20 h-20 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-300">
                    <FaQrcode size={40} />
                  </div>

                  <h3 className="font-semibold text-slate-700 mt-5">
                    No active QR code
                  </h3>

                  <p className="text-sm text-slate-400 mt-2 max-w-sm">
                    Start an attendance session to generate
                    a QR code
                  </p>

                </div>
              )}

            </div>
          </div>
        </div>

        {/* =================================================
            RIGHT SIDEBAR
        ================================================= */}

        <div className="flex min-w-0 flex-col gap-5 lg:gap-6">

          {/* Live Counter */}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">

            <div className="flex items-center justify-between gap-4">

              <div>

                <p className="text-sm text-slate-500">
                  Live Attendance
                </p>

                <h2 className="text-4xl font-bold text-slate-800 mt-2">
                  {present}

                  <span className="text-xl text-slate-400 font-medium">
                    {" "}
                    / {total}
                  </span>
                </h2>

              </div>

              <div className="w-14 h-14 shrink-0 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <FaUsers size={24} />
              </div>

            </div>

            <div className="mt-6">

              <div className="flex justify-between text-sm mb-2">

                <span className="text-slate-500">
                  Attendance
                </span>

                <span className="font-semibold text-green-600">
                  {percentage}%
                </span>

              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">

                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        percentage,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />

              </div>
            </div>
          </div>

          {/* Session Details */}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">

            <h3 className="font-bold text-lg text-slate-800 mb-5">
              Session Details
            </h3>

            <div className="space-y-0">

              <div className="flex items-center justify-between gap-5 py-3 border-b border-slate-100">

                <span className="text-sm text-slate-500">
                  Subject
                </span>

                <span className="font-semibold text-sm text-slate-800 text-right truncate max-w-[55%]">
                  {selectedSubjectData
                    ? selectedSubjectData.subject_code
                    : "-"}
                </span>

              </div>

              <div className="flex items-center justify-between gap-5 py-3 border-b border-slate-100">

                <span className="text-sm text-slate-500">
                  Class
                </span>

                <span className="font-semibold text-sm text-slate-800 text-right truncate max-w-[55%]">

                  {selectedSubjectData?.class_id
                    ? selectedSubjectData.class_year
                      ? `${selectedSubjectData.class_year}-${selectedSubjectData.class_section || ""}`
                      : selectedSubjectData.class_section ||
                        "-"
                    : "-"}

                </span>

              </div>

              <div className="flex items-center justify-between gap-5 py-3 border-b border-slate-100">

                <span className="text-sm text-slate-500">
                  Academic Year
                </span>

                <span className="font-semibold text-sm text-slate-800 text-right truncate max-w-[55%]">
                  {
                    selectedSubjectData?.academic_year ||
                    "-"
                  }
                </span>

              </div>

              <div className="flex items-center justify-between gap-5 py-3 border-b border-slate-100">

                <span className="text-sm text-slate-500">
                  Semester
                </span>

                <span className="font-semibold text-sm text-slate-800">
                  {
                    selectedSubjectData?.semester ||
                    "-"
                  }
                </span>

              </div>

              <div className="flex items-center justify-between gap-5 py-3 border-b border-slate-100">

                <span className="text-sm text-slate-500">
                  Allocation ID
                </span>

                <span className="font-semibold text-sm text-slate-800">
                  {
                    selectedSubjectData?.allocation_id ||
                    "-"
                  }
                </span>

              </div>

              <div className="flex items-center justify-between gap-5 py-3 border-b border-slate-100">

                <span className="text-sm text-slate-500">
                  Session ID
                </span>

                <span className="font-semibold text-sm text-slate-800">
                  {sessionId || "-"}
                </span>

              </div>

              <div className="flex items-center justify-between gap-5 py-3">

                <span className="text-sm text-slate-500">
                  Status
                </span>

                <span
                  className={`font-semibold text-sm ${
                    isActive
                      ? "text-green-600"
                      : "text-slate-500"
                  }`}
                >
                  {sessionStatus}
                </span>

              </div>

            </div>
          </div>

          {/* Close Session */}

          {isActive && (
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5 sm:p-6">

              <div className="flex items-start gap-3">

                <div className="w-10 h-10 shrink-0 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                  <FaStop />
                </div>

                <div>

                  <h3 className="font-bold text-lg text-slate-800">
                    End Attendance
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Close the session when attendance is
                    complete.
                  </p>

                </div>

              </div>

              <button
                onClick={
                  closeAttendance
                }
                disabled={
                  loadingSession
                }
                className="w-full mt-5 h-12 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
              >

                <FaStop />

                {loadingSession
                  ? "Closing..."
                  : "Close Session"}

              </button>

            </div>
          )}

        </div>
      </div>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* My Subjects */}

        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm min-h-36">

          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <FaBook />
          </div>

          <h3 className="font-bold text-slate-800">
            My Subjects
          </h3>

          <p className="text-sm text-slate-500 mt-1 leading-6">
            {subjects.length > 0
              ? `${subjects.length} allocation${
                  subjects.length === 1
                    ? ""
                    : "s"
                } assigned to you.`
              : "No subjects assigned to you."}
          </p>

        </div>

        {/* Attendance */}

        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm min-h-36">

          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <FaClipboardCheck />
          </div>

          <h3 className="font-bold text-slate-800">
            Attendance
          </h3>

          <p className="text-sm text-slate-500 mt-1 leading-6">
            Monitor attendance for the selected class
            live.
          </p>

        </div>

        {/* Reports */}

        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm min-h-36">

          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <FaChartBar />
          </div>

          <h3 className="font-bold text-slate-800">
            Reports
          </h3>

          <p className="text-sm text-slate-500 mt-1 leading-6">
            Attendance reports will be available here.
          </p>

        </div>

      </div>
    </div>
  );
}

export default StaffDashboard;