import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "/api";

// =====================================================
// AUTH
// =====================================================

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        ""
    );
};

// =====================================================
// DATE HELPERS
// =====================================================

const getToday = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getMonthStart = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}-01`;
};

const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

// =====================================================
// API RESPONSE HELPERS
// =====================================================

const getArray = (data, keys = []) => {
    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }

        if (Array.isArray(data?.data?.[key])) {
            return data.data[key];
        }
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data)) {
        return data;
    }

    return [];
};

// =====================================================
// COMMON API REQUEST
// =====================================================

const apiRequest = async (url) => {
    const token = getToken();

    if (!token) {
        throw new Error("Authentication token not found");
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
                data?.error ||
                "Failed to load report"
        );
    }

    return data;
};

// =====================================================
// EXPORT HELPERS
// =====================================================

const escapeHtml = (value) => {
    return String(value ?? "-")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const downloadBlob = (
    content,
    fileName,
    mimeType
) => {
    const blob = new Blob([content], {
        type: mimeType,
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

// =====================================================
// EXCEL DOWNLOAD
// =====================================================

const downloadExcel = (
    title,
    columns,
    rows,
    classInfo
) => {
    const tableHeader = columns
        .map(
            (column) =>
                `<th>${escapeHtml(
                    column.label
                )}</th>`
        )
        .join("");

    const tableRows = rows
        .map(
            (row) =>
                `<tr>${columns
                    .map(
                        (column) =>
                            `<td>${escapeHtml(
                                row[column.key]
                            )}</td>`
                    )
                    .join("")}</tr>`
        )
        .join("");

    const html = `
        <html>

        <head>

            <meta charset="UTF-8" />

            <style>

                body {
                    font-family: Arial, sans-serif;
                }

                h1 {
                    text-align: center;
                }

                p {
                    text-align: center;
                }

                table {
                    border-collapse: collapse;
                    width: 100%;
                }

                th,
                td {
                    border: 1px solid #999;
                    padding: 8px;
                    text-align: left;
                }

                th {
                    font-weight: bold;
                }

            </style>

        </head>

        <body>

            <h1>${escapeHtml(title)}</h1>

            <p>
                ${escapeHtml(
                    classInfo?.department_name ||
                        classInfo?.department ||
                        ""
                )}

                -

                Year ${escapeHtml(
                    classInfo?.year || "-"
                )}

                ${
                    classInfo?.section
                        ? ` - Section ${escapeHtml(
                              classInfo.section
                          )}`
                        : ""
                }
            </p>

            <table>

                <thead>

                    <tr>
                        ${tableHeader}
                    </tr>

                </thead>

                <tbody>
                    ${tableRows}
                </tbody>

            </table>

        </body>

        </html>
    `;

    downloadBlob(
        html,
        `${title.replace(
            /\s+/g,
            "_"
        )}.xls`,
        "application/vnd.ms-excel"
    );
};

// =====================================================
// WORD DOWNLOAD
// =====================================================

const downloadWord = (
    title,
    columns,
    rows,
    classInfo
) => {
    const tableHeader = columns
        .map(
            (column) =>
                `<th>${escapeHtml(
                    column.label
                )}</th>`
        )
        .join("");

    const tableRows = rows
        .map(
            (row) =>
                `<tr>${columns
                    .map(
                        (column) =>
                            `<td>${escapeHtml(
                                row[column.key]
                            )}</td>`
                    )
                    .join("")}</tr>`
        )
        .join("");

    const html = `
        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8" />

            <style>

                body {
                    font-family: Arial, sans-serif;
                    margin: 30px;
                }

                h1 {
                    text-align: center;
                }

                .class-info {
                    text-align: center;
                    margin-bottom: 20px;
                }

                table {
                    border-collapse: collapse;
                    width: 100%;
                }

                th,
                td {
                    border: 1px solid #777;
                    padding: 8px;
                }

                th {
                    font-weight: bold;
                }

            </style>

        </head>

        <body>

            <h1>${escapeHtml(title)}</h1>

            <div class="class-info">

                ${escapeHtml(
                    classInfo?.department_name ||
                        classInfo?.department ||
                        ""
                )}

                -

                Year ${escapeHtml(
                    classInfo?.year || "-"
                )}

                ${
                    classInfo?.section
                        ? ` - Section ${escapeHtml(
                              classInfo.section
                          )}`
                        : ""
                }

            </div>

            <table>

                <thead>

                    <tr>
                        ${tableHeader}
                    </tr>

                </thead>

                <tbody>
                    ${tableRows}
                </tbody>

            </table>

        </body>

        </html>
    `;

    downloadBlob(
        html,
        `${title.replace(
            /\s+/g,
            "_"
        )}.doc`,
        "application/msword"
    );
};

// =====================================================
// PDF DOWNLOAD
// =====================================================

const downloadPdf = (
    title,
    columns,
    rows,
    classInfo
) => {
    const tableHeader = columns
        .map(
            (column) =>
                `<th>${escapeHtml(
                    column.label
                )}</th>`
        )
        .join("");

    const tableRows = rows
        .map(
            (row) =>
                `<tr>${columns
                    .map(
                        (column) =>
                            `<td>${escapeHtml(
                                row[column.key]
                            )}</td>`
                    )
                    .join("")}</tr>`
        )
        .join("");

    const printWindow = window.open(
        "",
        "_blank",
        "width=1200,height=800"
    );

    if (!printWindow) {
        alert(
            "Please allow pop-ups to generate the PDF."
        );

        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ${escapeHtml(title)}
            </title>

            <style>

                @page {
                    size: landscape;
                    margin: 12mm;
                }

                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                }

                h1 {
                    text-align: center;
                    margin-bottom: 8px;
                }

                .class-info {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #444;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th,
                td {
                    border: 1px solid #777;
                    padding: 7px;
                    text-align: left;
                    font-size: 12px;
                }

                th {
                    font-weight: bold;
                }

            </style>

        </head>

        <body>

            <h1>
                ${escapeHtml(title)}
            </h1>

            <div class="class-info">

                ${escapeHtml(
                    classInfo?.department_name ||
                        classInfo?.department ||
                        ""
                )}

                -

                Year ${escapeHtml(
                    classInfo?.year || "-"
                )}

                ${
                    classInfo?.section
                        ? ` - Section ${escapeHtml(
                              classInfo.section
                          )}`
                        : ""
                }

            </div>

            <table>

                <thead>

                    <tr>
                        ${tableHeader}
                    </tr>

                </thead>

                <tbody>
                    ${tableRows}
                </tbody>

            </table>

        </body>

        </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
    }, 500);
};

// =====================================================
// REPORT BUTTONS
// =====================================================

function ExportButtons({
    title,
    columns,
    rows,
    classInfo,
}) {
    const handleExcel = () => {
        downloadExcel(
            title,
            columns,
            rows,
            classInfo
        );
    };

    const handleWord = () => {
        downloadWord(
            title,
            columns,
            rows,
            classInfo
        );
    };

    const handlePdf = () => {
        downloadPdf(
            title,
            columns,
            rows,
            classInfo
        );
    };

    return (
        <div className="flex flex-wrap gap-2">

            <button
                type="button"
                onClick={handleExcel}
                disabled={!rows.length}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Excel
            </button>

            <button
                type="button"
                onClick={handlePdf}
                disabled={!rows.length}
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                PDF
            </button>

            <button
                type="button"
                onClick={handleWord}
                disabled={!rows.length}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Word
            </button>

        </div>
    );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

function ClassTeacherReports() {
    const [fromDate, setFromDate] =
        useState(getMonthStart());

    const [toDate, setToDate] =
        useState(getToday());

    const [dashboardData, setDashboardData] =
        useState(null);

    const [dailyAttendance, setDailyAttendance] =
        useState([]);

    const [subjectReports, setSubjectReports] =
        useState([]);

    const [studentReports, setStudentReports] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    // =================================================
    // FETCH DASHBOARD
    // =================================================

    const fetchDashboard = async () => {
        const data = await apiRequest(
            `${API_BASE_URL}/class-teacher/dashboard`
        );

        setDashboardData(data);

        return data;
    };

    // =================================================
    // FETCH DAILY REPORT
    // =================================================

    const fetchDailyAttendance = async () => {
        const data = await apiRequest(
            `${API_BASE_URL}/class-teacher/reports/daily?from=${fromDate}&to=${toDate}`
        );

        setDailyAttendance(
            getArray(data, ["attendance"])
        );

        return data;
    };

    // =================================================
    // FETCH SUBJECT REPORT
    // =================================================

    const fetchSubjectReports = async () => {
        const data = await apiRequest(
            `${API_BASE_URL}/class-teacher/reports/subject`
        );

        setSubjectReports(
            getArray(data, ["reports"])
        );

        return data;
    };

    // =================================================
    // FETCH STUDENT REPORT
    // =================================================

    const fetchStudentReports = async () => {
        const data = await apiRequest(
            `${API_BASE_URL}/class-teacher/reports/students`
        );

        setStudentReports(
            getArray(data, ["reports"])
        );

        return data;
    };

    // =================================================
    // LOAD REPORTS
    // =================================================

    const loadReports = async () => {
        try {
            setLoading(true);
            setRefreshing(true);
            setError("");

            await Promise.all([
                fetchDashboard(),
                fetchDailyAttendance(),
                fetchSubjectReports(),
                fetchStudentReports(),
            ]);
        } catch (err) {
            console.error(
                "Class Teacher Reports Error:",
                err
            );

            setError(
                err?.message ||
                    "Failed to load class teacher reports"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, [fromDate, toDate]);

    // =================================================
    // DASHBOARD DATA
    // =================================================

    const classInfo =
        dashboardData?.class ||
        dashboardData?.data?.class ||
        {};

    const teacherInfo =
        dashboardData?.teacher ||
        dashboardData?.data?.teacher ||
        {};

    const statistics =
        dashboardData?.statistics ||
        dashboardData?.data?.statistics ||
        {};

    // =================================================
    // CLASS INFORMATION
    // =================================================

    const totalStudents = Number(
        statistics.total_students ??
            statistics.totalStudents ??
            classInfo.student_count ??
            classInfo.total_students ??
            0
    );

    const dashboardPresent = Number(
        statistics.present ??
            statistics.present_students ??
            statistics.total_present ??
            0
    );

    const dashboardAbsent = Number(
        statistics.absent ??
            statistics.absent_students ??
            statistics.total_absent ??
            0
    );

    const dashboardLate = Number(
        statistics.late ??
            statistics.late_students ??
            statistics.total_late ??
            0
    );

    const dashboardPercentage = Number(
        statistics.attendance_percentage ??
            statistics.attendancePercentage ??
            statistics.attendance_percent ??
            0
    );

    const sessionsToday = Number(
        statistics.sessions_today ??
            statistics.total_sessions ??
            statistics.sessions ??
            0
    );

    // =================================================
    // DAILY REPORT HELPERS
    // =================================================

    const getDailyDate = (item) => {
        return (
            item.session_date ||
            item.date ||
            item.attendance_date ||
            "-"
        );
    };

    const getDailySubject = (item) => {
        return (
            item.subject_name ||
            item.subject ||
            item.subjectName ||
            "-"
        );
    };

    const getDailySubjectCode = (item) => {
        return (
            item.subject_code ||
            item.subjectCode ||
            item.code ||
            "-"
        );
    };

    const getDailyStaff = (item) => {
        return (
            item.staff_name ||
            item.staff ||
            item.teacher_name ||
            item.staffName ||
            "-"
        );
    };

    const getDailyPresent = (item) => {
        return Number(
            item.present ??
                item.present_count ??
                item.total_present ??
                0
        );
    };

    const getDailyLate = (item) => {
        return Number(
            item.late ??
                item.late_count ??
                item.total_late ??
                0
        );
    };

    const getDailyAbsent = (item) => {
        return Number(
            item.absent ??
                item.absent_count ??
                item.total_absent ??
                0
        );
    };

    // =================================================
    // SUBJECT REPORT HELPERS
    // =================================================

    const getSubjectName = (item) => {
        return (
            item.subject_name ||
            item.subject ||
            item.name ||
            "-"
        );
    };

    const getSubjectClasses = (item) => {
        return Number(
            item.classes ??
                item.classes_count ??
                item.total_classes ??
                0
        );
    };

    const getSubjectPresent = (item) => {
        return Number(
            item.present ??
                item.present_count ??
                item.total_present ??
                0
        );
    };

    const getSubjectLate = (item) => {
        return Number(
            item.late ??
                item.late_count ??
                item.total_late ??
                0
        );
    };

    const getSubjectAbsent = (item) => {
        return Number(
            item.absent ??
                item.absent_count ??
                item.total_absent ??
                0
        );
    };

    const getSubjectStudents = (item) => {
        return Number(
            item.total_students ??
                item.students ??
                item.student_count ??
                0
        );
    };

    const getSubjectPercentage = (item) => {
        const value =
            item.percentage ??
            item.attendance_percentage ??
            item.attendancePercentage;

        if (
            value !== undefined &&
            value !== null
        ) {
            return Number(value).toFixed(1);
        }

        const present =
            getSubjectPresent(item);

        const late =
            getSubjectLate(item);

        const total =
            getSubjectStudents(item) *
            getSubjectClasses(item);

        if (!total) return "0.0";

        return (
            ((present + late) / total) *
            100
        ).toFixed(1);
    };

    // =================================================
    // STUDENT REPORT HELPERS
    // =================================================

    const getStudentName = (item) => {
        return (
            item.name ||
            item.student_name ||
            item.studentName ||
            "-"
        );
    };

    const getRegisterNumber = (item) => {
        return (
            item.register_number ||
            item.registerNumber ||
            item.reg_no ||
            item.register_no ||
            "-"
        );
    };

    const getStudentPresent = (item) => {
        return Number(
            item.present ??
                item.present_count ??
                item.total_present ??
                0
        );
    };

    const getStudentLate = (item) => {
        return Number(
            item.late ??
                item.late_count ??
                item.total_late ??
                0
        );
    };

    const getStudentAbsent = (item) => {
        return Number(
            item.absent ??
                item.absent_count ??
                item.total_absent ??
                0
        );
    };

    const getStudentPercentage = (item) => {
        const value =
            item.percentage ??
            item.attendance_percentage ??
            item.attendancePercentage;

        if (
            value !== undefined &&
            value !== null
        ) {
            return Number(value).toFixed(1);
        }

        const present =
            getStudentPresent(item);

        const late =
            getStudentLate(item);

        const absent =
            getStudentAbsent(item);

        const total =
            present +
            late +
            absent;

        if (!total) return "0.0";

        return (
            ((present + late) / total) *
            100
        ).toFixed(1);
    };

    const getStudentStatus = (item) => {
        if (item.status) {
            return String(
                item.status
            ).toUpperCase();
        }

        const percentage =
            Number(
                getStudentPercentage(item)
            );

        if (percentage >= 75) {
            return "GOOD";
        }

        if (percentage >= 60) {
            return "WARNING";
        }

        return "LOW";
    };

    // =================================================
    // SUMMARY TOTALS
    // =================================================

    const dailyTotals = useMemo(() => {
        return dailyAttendance.reduce(
            (total, item) => {
                total.present +=
                    getDailyPresent(item);

                total.late +=
                    getDailyLate(item);

                total.absent +=
                    getDailyAbsent(item);

                return total;
            },
            {
                present: 0,
                late: 0,
                absent: 0,
            }
        );
    }, [dailyAttendance]);

    const summaryPresent =
        dailyTotals.present ||
        dashboardPresent;

    const summaryLate =
        dailyTotals.late ||
        dashboardLate;

    const summaryAbsent =
        dailyTotals.absent ||
        dashboardAbsent;

    const summaryTotal =
        totalStudents ||
        summaryPresent +
            summaryLate +
            summaryAbsent;

    const summaryPercentage =
        summaryTotal > 0
            ? (
                  ((summaryPresent +
                      summaryLate) /
                      summaryTotal) *
                  100
              ).toFixed(1)
            : dashboardPercentage.toFixed(1);

    // =================================================
    // EXPORT DATA
    // =================================================

    const dailyExportRows =
        dailyAttendance.map((item) => ({
            date: formatDate(
                getDailyDate(item)
            ),
            subject: `${getDailySubject(
                item
            )} (${getDailySubjectCode(
                item
            )})`,
            staff: getDailyStaff(item),
            present: getDailyPresent(item),
            late: getDailyLate(item),
            absent: getDailyAbsent(item),
        }));

    const subjectExportRows =
        subjectReports.map((item) => ({
            subject: getSubjectName(item),
            classes: getSubjectClasses(item),
            present: getSubjectPresent(item),
            late: getSubjectLate(item),
            absent: getSubjectAbsent(item),
            percentage:
                `${getSubjectPercentage(
                    item
                )}%`,
        }));

    const studentExportRows =
        studentReports.map((item) => ({
            name: getStudentName(item),
            register_number:
                getRegisterNumber(item),
            present:
                getStudentPresent(item),
            late:
                getStudentLate(item),
            absent:
                getStudentAbsent(item),
            percentage:
                `${getStudentPercentage(
                    item
                )}%`,
            status:
                getStudentStatus(item),
        }));

    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

            <div className="mx-auto max-w-7xl space-y-6">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="overflow-hidden rounded-3xl bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg md:p-8">

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                                Class Teacher
                            </div>

                            <h1 className="text-2xl font-bold md:text-3xl">
                                Attendance Reports
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm text-emerald-100 md:text-base">
                                Complete attendance maintenance
                                reports for your assigned class.
                            </p>

                        </div>

                        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">

                            <p className="text-xs uppercase tracking-wider text-emerald-100">
                                Report Period
                            </p>

                            <p className="mt-1 text-sm font-bold">
                                {formatDate(fromDate)}
                            </p>

                            <p className="text-sm text-emerald-100">
                                to
                            </p>

                            <p className="text-xl font-bold">
                                {formatDate(toDate)}
                            </p>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    FILTER
                ================================================= */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                        <div>

                            <h2 className="text-lg font-bold text-slate-800">
                                Report Filters
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Select the period for the daily
                                attendance report.
                            </p>

                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">

                            <div>

                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    From
                                </label>

                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(event) =>
                                        setFromDate(
                                            event.target.value
                                        )
                                    }
                                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />

                            </div>

                            <div>

                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    To
                                </label>

                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(event) =>
                                        setToDate(
                                            event.target.value
                                        )
                                    }
                                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />

                            </div>

                            <button
                                type="button"
                                onClick={loadReports}
                                disabled={refreshing}
                                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {refreshing
                                    ? "Loading..."
                                    : "Refresh"}
                            </button>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                        <div className="flex gap-3">

                            <div className="text-xl">
                                ⚠️
                            </div>

                            <div>

                                <h3 className="font-semibold text-red-800">
                                    Unable to load reports
                                </h3>

                                <p className="mt-1 text-sm text-red-700">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={loadReports}
                                    className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                                >
                                    Try Again
                                </button>

                            </div>

                        </div>

                    </div>
                )}

                {/* =================================================
                    CLASS INFORMATION
                ================================================= */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Department
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            {classInfo.department_name ||
                                classInfo.department ||
                                "-"}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Class
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            Year {classInfo.year || "-"}
                            {classInfo.section
                                ? ` - ${classInfo.section}`
                                : ""}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Class Teacher
                        </p>

                        <p className="mt-2 text-lg font-bold text-slate-800">
                            {teacherInfo.name ||
                                teacherInfo.username ||
                                "-"}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Today's Sessions
                        </p>

                        <p className="mt-2 text-3xl font-bold text-emerald-600">
                            {sessionsToday}
                        </p>

                    </div>

                </div>

                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Students
                        </p>

                        <p className="mt-2 text-3xl font-bold text-slate-800">
                            {summaryTotal}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Present
                        </p>

                        <p className="mt-2 text-3xl font-bold text-emerald-700">
                            {summaryPresent}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Late
                        </p>

                        <p className="mt-2 text-3xl font-bold text-amber-700">
                            {summaryLate}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                            Absent
                        </p>

                        <p className="mt-2 text-3xl font-bold text-red-700">
                            {summaryAbsent}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">

                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Attendance
                        </p>

                        <p className="mt-2 text-3xl font-bold text-blue-700">
                            {summaryPercentage}%
                        </p>

                    </div>

                </div>

                {/* =================================================
                    ATTENDANCE OVERVIEW
                ================================================= */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <h2 className="text-lg font-bold text-slate-800">
                                Attendance Overview
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Attendance summary for the selected
                                report period.
                            </p>

                        </div>

                        <span className="text-2xl font-bold text-emerald-600">
                            {summaryPercentage}%
                        </span>

                    </div>

                    <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">

                        <div
                            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-500 transition-all"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        Number(
                                            summaryPercentage
                                        )
                                    )
                                )}%`,
                            }}
                        />

                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

                        <div className="rounded-xl bg-emerald-50 p-4">

                            <p className="text-xs font-semibold uppercase text-emerald-600">
                                Present
                            </p>

                            <p className="mt-1 text-xl font-bold text-emerald-700">
                                {summaryPresent}
                            </p>

                        </div>

                        <div className="rounded-xl bg-amber-50 p-4">

                            <p className="text-xs font-semibold uppercase text-amber-600">
                                Late
                            </p>

                            <p className="mt-1 text-xl font-bold text-amber-700">
                                {summaryLate}
                            </p>

                        </div>

                        <div className="rounded-xl bg-red-50 p-4">

                            <p className="text-xs font-semibold uppercase text-red-600">
                                Absent
                            </p>

                            <p className="mt-1 text-xl font-bold text-red-700">
                                {summaryAbsent}
                            </p>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    1. DAILY ATTENDANCE
                ================================================= */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5 md:p-6">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>

                                <div className="flex items-center gap-3">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                                        📅
                                    </div>

                                    <div>

                                        <h2 className="text-lg font-bold text-slate-800">
                                            Daily Attendance
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {formatDate(
                                                fromDate
                                            )}{" "}
                                            to{" "}
                                            {formatDate(
                                                toDate
                                            )}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <ExportButtons
                                title="Daily Attendance Report"
                                columns={[
                                    {
                                        key: "date",
                                        label: "Date",
                                    },
                                    {
                                        key: "subject",
                                        label: "Subject",
                                    },
                                    {
                                        key: "staff",
                                        label: "Staff",
                                    },
                                    {
                                        key: "present",
                                        label: "Present",
                                    },
                                    {
                                        key: "late",
                                        label: "Late",
                                    },
                                    {
                                        key: "absent",
                                        label: "Absent",
                                    },
                                ]}
                                rows={dailyExportRows}
                                classInfo={classInfo}
                            />

                        </div>

                    </div>

                    {loading ? (
                        <LoadingBlock />
                    ) : dailyAttendance.length === 0 ? (
                        <EmptyBlock
                            icon="📅"
                            title="No daily attendance"
                            message="No attendance sessions were found for the selected period."
                        />
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="min-w-full text-left">

                                <thead className="bg-slate-50">

                                    <tr>

                                        <TableHead>
                                            Date
                                        </TableHead>

                                        <TableHead>
                                            Subject
                                        </TableHead>

                                        <TableHead>
                                            Staff
                                        </TableHead>

                                        <TableHead>
                                            Present
                                        </TableHead>

                                        <TableHead>
                                            Late
                                        </TableHead>

                                        <TableHead>
                                            Absent
                                        </TableHead>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {dailyAttendance.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <tr
                                                key={`daily-${item.session_id || index}`}
                                                className="transition hover:bg-emerald-50/40"
                                            >

                                                <TableCell>
                                                    <span className="font-medium text-slate-700">
                                                        {formatDate(
                                                            getDailyDate(
                                                                item
                                                            )
                                                        )}
                                                    </span>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col">

                                                        <span className="font-semibold text-slate-800">
                                                            {getDailySubject(
                                                                item
                                                            )}
                                                        </span>

                                                        <span className="text-xs text-slate-500">
                                                            {getDailySubjectCode(
                                                                item
                                                            )}
                                                        </span>

                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {getDailyStaff(
                                                        item
                                                    )}
                                                </TableCell>

                                                <NumberBadge
                                                    value={getDailyPresent(
                                                        item
                                                    )}
                                                    type="present"
                                                />

                                                <NumberBadge
                                                    value={getDailyLate(
                                                        item
                                                    )}
                                                    type="late"
                                                />

                                                <NumberBadge
                                                    value={getDailyAbsent(
                                                        item
                                                    )}
                                                    type="absent"
                                                />

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {/* =================================================
                    2. SUBJECT-WISE
                ================================================= */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5 md:p-6">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div className="flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                                    📚
                                </div>

                                <div>

                                    <h2 className="text-lg font-bold text-slate-800">
                                        Subject-Wise Attendance
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Attendance performance by
                                        subject.
                                    </p>

                                </div>

                            </div>

                            <ExportButtons
                                title="Subject Wise Attendance Report"
                                columns={[
                                    {
                                        key: "subject",
                                        label: "Subject",
                                    },
                                    {
                                        key: "classes",
                                        label: "Classes",
                                    },
                                    {
                                        key: "present",
                                        label: "Present",
                                    },
                                    {
                                        key: "late",
                                        label: "Late",
                                    },
                                    {
                                        key: "absent",
                                        label: "Absent",
                                    },
                                    {
                                        key: "percentage",
                                        label: "%",
                                    },
                                ]}
                                rows={subjectExportRows}
                                classInfo={classInfo}
                            />

                        </div>

                    </div>

                    {loading ? (
                        <LoadingBlock />
                    ) : subjectReports.length === 0 ? (
                        <EmptyBlock
                            icon="📚"
                            title="No subject report"
                            message="No subject attendance records are available."
                        />
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="min-w-full text-left">

                                <thead className="bg-slate-50">

                                    <tr>

                                        <TableHead>
                                            Subject
                                        </TableHead>

                                        <TableHead>
                                            Classes
                                        </TableHead>

                                        <TableHead>
                                            Present
                                        </TableHead>

                                        <TableHead>
                                            Late
                                        </TableHead>

                                        <TableHead>
                                            Absent
                                        </TableHead>

                                        <TableHead>
                                            %
                                        </TableHead>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {subjectReports.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <tr
                                                key={`subject-${item.subject_id || index}`}
                                                className="transition hover:bg-blue-50/40"
                                            >

                                                <TableCell>
                                                    <span className="font-semibold text-slate-800">
                                                        {getSubjectName(
                                                            item
                                                        )}
                                                    </span>
                                                </TableCell>

                                                <TableCell>
                                                    {getSubjectClasses(
                                                        item
                                                    )}
                                                </TableCell>

                                                <NumberBadge
                                                    value={getSubjectPresent(
                                                        item
                                                    )}
                                                    type="present"
                                                />

                                                <NumberBadge
                                                    value={getSubjectLate(
                                                        item
                                                    )}
                                                    type="late"
                                                />

                                                <NumberBadge
                                                    value={getSubjectAbsent(
                                                        item
                                                    )}
                                                    type="absent"
                                                />

                                                <TableCell>

                                                    <span className="font-bold text-blue-600">
                                                        {getSubjectPercentage(
                                                            item
                                                        )}
                                                        %
                                                    </span>

                                                </TableCell>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {/* =================================================
                    3. STUDENT ATTENDANCE PERCENTAGE
                ================================================= */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5 md:p-6">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div className="flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xl">
                                    👨‍🎓
                                </div>

                                <div>

                                    <h2 className="text-lg font-bold text-slate-800">
                                        Attendance Percentage
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Individual student attendance
                                        performance.
                                    </p>

                                </div>

                            </div>

                            <ExportButtons
                                title="Student Attendance Percentage Report"
                                columns={[
                                    {
                                        key: "name",
                                        label: "Name",
                                    },
                                    {
                                        key: "register_number",
                                        label: "Register Number",
                                    },
                                    {
                                        key: "present",
                                        label: "Present",
                                    },
                                    {
                                        key: "late",
                                        label: "Late",
                                    },
                                    {
                                        key: "absent",
                                        label: "Absent",
                                    },
                                    {
                                        key: "percentage",
                                        label: "%",
                                    },
                                    {
                                        key: "status",
                                        label: "Status",
                                    },
                                ]}
                                rows={studentExportRows}
                                classInfo={classInfo}
                            />

                        </div>

                    </div>

                    {loading ? (
                        <LoadingBlock />
                    ) : studentReports.length === 0 ? (
                        <EmptyBlock
                            icon="👨‍🎓"
                            title="No student report"
                            message="No student attendance records are available."
                        />
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="min-w-full text-left">

                                <thead className="bg-slate-50">

                                    <tr>

                                        <TableHead>
                                            Name
                                        </TableHead>

                                        <TableHead>
                                            Register Number
                                        </TableHead>

                                        <TableHead>
                                            Present
                                        </TableHead>

                                        <TableHead>
                                            Late
                                        </TableHead>

                                        <TableHead>
                                            Absent
                                        </TableHead>

                                        <TableHead>
                                            %
                                        </TableHead>

                                        <TableHead>
                                            Status
                                        </TableHead>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {studentReports.map(
                                        (
                                            item,
                                            index
                                        ) => {

                                            const status =
                                                getStudentStatus(
                                                    item
                                                );

                                            return (
                                                <tr
                                                    key={`student-${item.student_id || index}`}
                                                    className="transition hover:bg-amber-50/40"
                                                >

                                                    <TableCell>

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">

                                                                {String(
                                                                    getStudentName(
                                                                        item
                                                                    )
                                                                )
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}

                                                            </div>

                                                            <span className="font-semibold text-slate-800">
                                                                {getStudentName(
                                                                    item
                                                                )}
                                                            </span>

                                                        </div>

                                                    </TableCell>

                                                    <TableCell>

                                                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                                                            {getRegisterNumber(
                                                                item
                                                            )}
                                                        </span>

                                                    </TableCell>

                                                    <NumberBadge
                                                        value={getStudentPresent(
                                                            item
                                                        )}
                                                        type="present"
                                                    />

                                                    <NumberBadge
                                                        value={getStudentLate(
                                                            item
                                                        )}
                                                        type="late"
                                                    />

                                                    <NumberBadge
                                                        value={getStudentAbsent(
                                                            item
                                                        )}
                                                        type="absent"
                                                    />

                                                    <TableCell>

                                                        <span className="font-bold text-blue-600">
                                                            {getStudentPercentage(
                                                                item
                                                            )}
                                                            %
                                                        </span>

                                                    </TableCell>

                                                    <TableCell>

                                                        <StatusBadge
                                                            status={
                                                                status
                                                            }
                                                        />

                                                    </TableCell>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {/* =================================================
                    INFORMATION
                ================================================= */}

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

                    <div className="flex items-start gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                            ℹ️
                        </div>

                        <div>

                            <h3 className="font-bold text-emerald-900">
                                Class Teacher Report Information
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-emerald-700">
                                These reports are generated for the
                                class assigned to the logged-in Class
                                Teacher. Daily Attendance follows the
                                selected date range. Subject and
                                Student reports use the attendance
                                records available for the assigned
                                class.
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

// =====================================================
// TABLE COMPONENTS
// =====================================================

function TableHead({ children }) {
    return (
        <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {children}
        </th>
    );
}

function TableCell({ children }) {
    return (
        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
            {children}
        </td>
    );
}

function NumberBadge({
    value,
    type,
}) {
    const classes = {
        present:
            "bg-emerald-100 text-emerald-700",

        late:
            "bg-amber-100 text-amber-700",

        absent:
            "bg-red-100 text-red-700",
    };

    return (
        <td className="whitespace-nowrap px-5 py-4">

            <span
                className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                    classes[type] ||
                    "bg-slate-100 text-slate-700"
                }`}
            >
                {value}
            </span>

        </td>
    );
}

function StatusBadge({
    status,
}) {
    const normalized =
        String(status || "")
            .toUpperCase();

    let classes =
        "bg-slate-100 text-slate-700";

    if (
        normalized === "GOOD" ||
        normalized === "ELIGIBLE" ||
        normalized === "NORMAL"
    ) {
        classes =
            "bg-emerald-100 text-emerald-700";
    }

    if (
        normalized === "WARNING" ||
        normalized === "WARN"
    ) {
        classes =
            "bg-amber-100 text-amber-700";
    }

    if (
        normalized === "LOW" ||
        normalized === "CRITICAL"
    ) {
        classes =
            "bg-red-100 text-red-700";
    }

    return (
        <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${classes}`}
        >
            {normalized || "UNKNOWN"}
        </span>
    );
}

function LoadingBlock() {
    return (
        <div className="p-12 text-center">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

            <p className="mt-4 text-sm text-slate-500">
                Generating report...
            </p>

        </div>
    );
}

function EmptyBlock({
    icon,
    title,
    message,
}) {
    return (
        <div className="p-12 text-center">

            <div className="text-5xl">
                {icon}
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-800">
                {title}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
                {message}
            </p>

        </div>
    );
}

export default ClassTeacherReports;