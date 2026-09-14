import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    FaArrowLeft,
    FaCalendarDay,
    FaSearch,
    FaSyncAlt,
    FaFileExcel,
    FaFilePdf,
    FaFileWord,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaPercentage,
} from "react-icons/fa";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    HeadingLevel,
    WidthType,
} from "docx";

// =====================================================
// API
// =====================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "https://attendance-management-system-gpci.onrender.com/api";

// =====================================================
// HELPER
// =====================================================

function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

// =====================================================
// COMPONENT
// =====================================================

function HodDailyAttendance() {

    const navigate = useNavigate();

    const { department } =
        useParams();

    // -------------------------------------------------
    // STATE
    // -------------------------------------------------

    const [attendance, setAttendance] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [yearFilter, setYearFilter] =
        useState("ALL");

    const [selectedDate, setSelectedDate] =
        useState(
            new Date()
                .toISOString()
                .split("T")[0]
        );

    // =================================================
    // TOKEN
    // =================================================

    const token = useMemo(() => {

        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            ""
        );

    }, []);

    // =================================================
    // DEPARTMENT MATCH
    // =================================================

    const departmentMatches = (
        row
    ) => {

        if (!department) {
            return true;
        }

        const routeDepartment =
            normalizeText(
                department
            );

        const departmentValues = [
            row.department,
            row.department_name,
            row.departmentName,
            row.department_code,
            row.departmentCode,
            row.department_slug,
            row.departmentSlug,
        ]
            .filter(Boolean)
            .map(
                normalizeText
            );

        if (
            departmentValues.includes(
                routeDepartment
            )
        ) {
            return true;
        }

        const aliases = {

            "computer-science": [
                "computer science",
                "computer-science",
                "cse",
                "cs",
            ],

            "information-technology": [
                "information technology",
                "information-technology",
                "it",
            ],

            electronics: [
                "electronics",
                "electronics and communication",
                "ece",
            ],
        };

        const allowed =
            aliases[routeDepartment] ||
            [routeDepartment];

        return departmentValues.some(
            (value) =>
                allowed.includes(value)
        );
    };

    // =================================================
    // DATE HELPERS
    // =================================================

    const getRowDate = (row) => {

        return (
            row.date ||
            row.attendance_date ||
            row.attendanceDate ||
            row.session_date ||
            row.sessionDate ||
            row.created_at ||
            row.createdAt ||
            ""
        );
    };

    const formatDate = (value) => {

        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(value);
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );
    };

    const normalizeDate = (value) => {

        if (!value) {
            return "";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(value)
                .substring(0, 10);
        }

        return date
            .toISOString()
            .split("T")[0];
    };

    // =================================================
    // FETCH ATTENDANCE
    // =================================================

    const fetchAttendance = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await fetch(
                    `${API_BASE_URL}/attendance`,
                    {
                        method: "GET",

                        headers: {
                            "Content-Type":
                                "application/json",

                            ...(token
                                ? {
                                    Authorization:
                                        `Bearer ${token}`,
                                }
                                : {}),
                        },
                    }
                );

            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "Invalid response received from server."
                );
            }

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to fetch attendance."
                );
            }

            let rows = [];

            if (
                Array.isArray(data)
            ) {

                rows = data;

            } else if (
                Array.isArray(
                    data.attendance
                )
            ) {

                rows =
                    data.attendance;

            } else if (
                Array.isArray(
                    data.data
                )
            ) {

                rows =
                    data.data;

            } else if (
                Array.isArray(
                    data.rows
                )
            ) {

                rows =
                    data.rows;
            }

            setAttendance(rows);

        } catch (err) {

            console.error(
                "HOD Daily Attendance Error:",
                err
            );

            setError(
                err.message ||
                "Failed to load attendance."
            );

            setAttendance([]);

        } finally {

            setLoading(false);

        }
    };

    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {

        fetchAttendance();

    }, [token]);

    // =================================================
    // FILTERED ATTENDANCE
    // =================================================

    const filteredAttendance =
        useMemo(() => {

            const searchValue =
                normalizeText(
                    search
                );

            return attendance.filter(
                (row) => {

                    // -----------------------------
                    // Department
                    // -----------------------------

                    if (
                        !departmentMatches(
                            row
                        )
                    ) {
                        return false;
                    }

                    // -----------------------------
                    // Date
                    // -----------------------------

                    if (
                        selectedDate
                    ) {

                        const rowDate =
                            normalizeDate(
                                getRowDate(
                                    row
                                )
                            );

                        if (
                            rowDate !==
                            selectedDate
                        ) {
                            return false;
                        }
                    }

                    // -----------------------------
                    // Year
                    // -----------------------------

                    if (
                        yearFilter !==
                        "ALL"
                    ) {

                        const rowYear =
                            String(
                                row.year ||
                                row.student_year ||
                                row.studentYear ||
                                ""
                            );

                        if (
                            rowYear !==
                            String(
                                yearFilter
                            )
                        ) {
                            return false;
                        }
                    }

                    // -----------------------------
                    // Search
                    // -----------------------------

                    if (
                        searchValue
                    ) {

                        const searchable =
                            [
                                row.register_number,
                                row.registerNumber,
                                row.roll_number,
                                row.rollNumber,
                                row.student_name,
                                row.studentName,
                                row.name,
                                row.email,
                                row.subject_name,
                                row.subjectName,
                                row.subject_code,
                                row.subjectCode,
                                row.staff_name,
                                row.staffName,
                                row.section,
                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();

                        if (
                            !searchable.includes(
                                searchValue
                            )
                        ) {
                            return false;
                        }
                    }

                    return true;
                }
            );

        }, [
            attendance,
            department,
            selectedDate,
            yearFilter,
            search,
        ]);

    // =================================================
    // STATUS
    // =================================================

    const getStatus = (row) => {

        return String(
            row.status ||
            row.attendance_status ||
            row.attendanceStatus ||
            ""
        )
            .trim()
            .toUpperCase();
    };

    // =================================================
    // STATISTICS
    // =================================================

    const stats =
        useMemo(() => {

            let present = 0;
            let absent = 0;
            let late = 0;

            filteredAttendance.forEach(
                (row) => {

                    const status =
                        getStatus(row);

                    if (
                        status ===
                        "PRESENT"
                    ) {

                        present++;

                    } else if (
                        status ===
                        "ABSENT"
                    ) {

                        absent++;

                    } else if (
                        status ===
                        "LATE"
                    ) {

                        late++;
                    }
                }
            );

            const total =
                present +
                absent +
                late;

            const percentage =
                total > 0
                    ? (
                        (
                            present +
                            late
                        ) /
                        total
                    ) *
                    100
                    : 0;

            return {
                total,
                present,
                absent,
                late,
                percentage,
            };

        }, [
            filteredAttendance,
        ]);

    // =================================================
    // YEAR OPTIONS
    // =================================================

    const yearOptions =
        useMemo(() => {

            const years =
                attendance
                    .filter(
                        departmentMatches
                    )
                    .map(
                        (row) =>
                            row.year ||
                            row.student_year ||
                            row.studentYear
                    )
                    .filter(Boolean)
                    .map(
                        String
                    );

            return [
                ...new Set(years),
            ].sort();

        }, [
            attendance,
            department,
        ]);

    // =================================================
    // STUDENT NAME
    // =================================================

    const getStudentName = (
        row
    ) => {

        return (
            row.student_name ||
            row.studentName ||
            row.name ||
            "-"
        );
    };

    // =================================================
    // REGISTER NUMBER
    // =================================================

    const getRegisterNumber = (
        row
    ) => {

        return (
            row.register_number ||
            row.registerNumber ||
            row.roll_number ||
            row.rollNumber ||
            "-"
        );
    };

    // =================================================
    // SUBJECT
    // =================================================

    const getSubject = (
        row
    ) => {

        return (
            row.subject_name ||
            row.subjectName ||
            row.subject_code ||
            row.subjectCode ||
            "-"
        );
    };

    // =================================================
    // STAFF
    // =================================================

    const getStaff = (
        row
    ) => {

        return (
            row.staff_name ||
            row.staffName ||
            row.teacher_name ||
            row.teacherName ||
            "-"
        );
    };

    // =================================================
    // YEAR
    // =================================================

    const getYear = (
        row
    ) => {

        return (
            row.year ||
            row.student_year ||
            row.studentYear ||
            "-"
        );
    };

    // =================================================
    // SECTION
    // =================================================

    const getSection = (
        row
    ) => {

        return (
            row.section ||
            row.class_section ||
            row.classSection ||
            "-"
        );
    };

    // =================================================
    // DOWNLOAD EXCEL
    // =================================================

    const downloadExcel = () => {

        if (
            filteredAttendance.length ===
            0
        ) {

            alert(
                "No attendance data available to download."
            );

            return;
        }

        const rows =
            filteredAttendance.map(
                (row, index) => ({
                    "#":
                        index + 1,

                    "Register Number":
                        getRegisterNumber(
                            row
                        ),

                    "Student":
                        getStudentName(
                            row
                        ),

                    "Year":
                        getYear(
                            row
                        ),

                    "Section":
                        getSection(
                            row
                        ),

                    "Subject":
                        getSubject(
                            row
                        ),

                    "Staff":
                        getStaff(
                            row
                        ),

                    "Date":
                        formatDate(
                            getRowDate(
                                row
                            )
                        ),

                    "Status":
                        getStatus(
                            row
                        ),
                })
            );

        const worksheet =
            XLSX.utils.json_to_sheet(
                rows
            );

        XLSX.utils.sheet_add_aoa(
            worksheet,
            [
                [],
                [
                    "Daily Attendance Summary",
                ],
                [
                    "Present",
                    stats.present,
                ],
                [
                    "Absent",
                    stats.absent,
                ],
                [
                    "Late",
                    stats.late,
                ],
                [
                    "Attendance %",
                    `${stats.percentage.toFixed(
                        2
                    )}%`,
                ],
            ],
            {
                origin: -1,
            }
        );

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Daily Attendance"
        );

        const excelBuffer =
            XLSX.write(
                workbook,
                {
                    bookType: "xlsx",
                    type: "array",
                }
            );

        const blob =
            new Blob(
                [excelBuffer],
                {
                    type:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                }
            );

        saveAs(
            blob,
            `hod-daily-attendance-${selectedDate}.xlsx`
        );
    };

    // =================================================
    // DOWNLOAD PDF
    // =================================================

    const downloadPDF = () => {

        if (
            filteredAttendance.length ===
            0
        ) {

            alert(
                "No attendance data available to download."
            );

            return;
        }

        const doc =
            new jsPDF(
                "landscape"
            );

        doc.setFontSize(
            18
        );

        doc.text(
            "Daily Attendance Report",
            14,
            15
        );

        doc.setFontSize(
            10
        );

        doc.text(
            `Department: ${
                department || "-"
            }`,
            14,
            23
        );

        doc.text(
            `Date: ${
                formatDate(
                    selectedDate
                )
            }`,
            14,
            29
        );

        doc.text(
            `Present: ${
                stats.present
            }   Absent: ${
                stats.absent
            }   Late: ${
                stats.late
            }   Attendance: ${
                stats.percentage.toFixed(
                    2
                )
            }%`,
            14,
            35
        );

        autoTable(
            doc,
            {
                startY: 42,

                head: [
                    [
                        "#",
                        "Register No",
                        "Student",
                        "Year",
                        "Section",
                        "Subject",
                        "Staff",
                        "Status",
                    ],
                ],

                body:
                    filteredAttendance.map(
                        (
                            row,
                            index
                        ) => [
                            index + 1,
                            getRegisterNumber(
                                row
                            ),
                            getStudentName(
                                row
                            ),
                            getYear(
                                row
                            ),
                            getSection(
                                row
                            ),
                            getSubject(
                                row
                            ),
                            getStaff(
                                row
                            ),
                            getStatus(
                                row
                            ),
                        ]
                    ),

                styles: {
                    fontSize: 8,
                },

                headStyles: {
                    fontStyle:
                        "bold",
                },
            }
        );

        doc.save(
            `hod-daily-attendance-${selectedDate}.pdf`
        );
    };

    // =================================================
    // DOWNLOAD WORD
    // =================================================

    const downloadWord = async () => {

        if (
            filteredAttendance.length ===
            0
        ) {

            alert(
                "No attendance data available to download."
            );

            return;
        }

        const headerCells = [
            "#",
            "Register No",
            "Student",
            "Year",
            "Section",
            "Subject",
            "Staff",
            "Status",
        ].map(
            (header) =>
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text:
                                        header,
                                    bold:
                                        true,
                                }),
                            ],
                        }),
                    ],
                })
        );

        const dataRows =
            filteredAttendance.map(
                (
                    row,
                    index
                ) =>
                    new TableRow({
                        children: [
                            index + 1,
                            getRegisterNumber(
                                row
                            ),
                            getStudentName(
                                row
                            ),
                            getYear(
                                row
                            ),
                            getSection(
                                row
                            ),
                            getSubject(
                                row
                            ),
                            getStaff(
                                row
                            ),
                            getStatus(
                                row
                            ),
                        ].map(
                            (value) =>
                                new TableCell({
                                    children: [
                                        new Paragraph(
                                            String(
                                                value
                                            )
                                        ),
                                    ],
                                })
                        ),
                    })
            );

        const table =
            new Table({
                width: {
                    size: 100,
                    type:
                        WidthType.PERCENTAGE,
                },

                rows: [
                    new TableRow({
                        children:
                            headerCells,
                    }),

                    ...dataRows,
                ],
            });

        const document =
            new Document({
                sections: [
                    {
                        children: [

                            new Paragraph({
                                text:
                                    "Daily Attendance Report",
                                heading:
                                    HeadingLevel
                                        .TITLE,
                            }),

                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text:
                                            `Department: ${
                                                department ||
                                                "-"
                                            }`,
                                    }),
                                ],
                            }),

                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text:
                                            `Date: ${
                                                formatDate(
                                                    selectedDate
                                                )
                                            }`,
                                    }),
                                ],
                            }),

                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text:
                                            `Present: ${
                                                stats.present
                                            } | Absent: ${
                                                stats.absent
                                            } | Late: ${
                                                stats.late
                                            } | Attendance: ${
                                                stats.percentage.toFixed(
                                                    2
                                                )
                                            }%`,
                                    }),
                                ],
                            }),

                            new Paragraph({
                                text:
                                    "",
                            }),

                            table,
                        ],
                    },
                ],
            });

        const blob =
            await Packer.toBlob(
                document
            );

        saveAs(
            blob,
            `hod-daily-attendance-${selectedDate}.docx`
        );
    };

    // =================================================
    // STATUS BADGE
    // =================================================

    const statusBadge = (
        status
    ) => {

        if (
            status ===
            "PRESENT"
        ) {

            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    <FaCheckCircle />
                    Present
                </span>
            );
        }

        if (
            status ===
            "ABSENT"
        ) {

            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    <FaTimesCircle />
                    Absent
                </span>
            );
        }

        if (
            status ===
            "LATE"
        ) {

            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                    <FaClock />
                    Late
                </span>
            );
        }

        return (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {status || "-"}
            </span>
        );
    };

    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/hod/${
                                    department ||
                                    ""
                                }`
                            )
                        }
                        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-indigo-600"
                    >
                        <FaArrowLeft />
                        Back to HOD Dashboard
                    </button>

                    <div className="flex items-center gap-3">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-xl text-indigo-600">
                            <FaCalendarDay />
                        </div>

                        <div>

                            <p className="text-sm font-medium text-indigo-600">
                                HOD Attendance Reports
                            </p>

                            <h1 className="text-3xl font-bold text-gray-900">
                                Daily Attendance
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                View daily attendance for your department.
                            </p>

                        </div>

                    </div>

                </div>

                <button
                    type="button"
                    onClick={
                        fetchAttendance
                    }
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    {/* DATE */}

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            Attendance Date
                        </label>

                        <input
                            type="date"
                            value={
                                selectedDate
                            }
                            onChange={(e) =>
                                setSelectedDate(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />

                    </div>

                    {/* YEAR */}

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            Year
                        </label>

                        <select
                            value={
                                yearFilter
                            }
                            onChange={(e) =>
                                setYearFilter(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >

                            <option value="ALL">
                                All Years
                            </option>

                            {yearOptions.map(
                                (year) => (
                                    <option
                                        key={
                                            year
                                        }
                                        value={
                                            year
                                        }
                                    >
                                        Year{" "}
                                        {year}
                                    </option>
                                )
                            )}

                        </select>

                    </div>

                    {/* SEARCH */}

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            Search
                        </label>

                        <div className="relative">

                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                            <input
                                type="text"
                                value={
                                    search
                                }
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Student, register no, subject..."
                                className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

                    <p className="text-sm font-medium text-gray-500">
                        Total Records
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {stats.total}
                    </p>

                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-5">

                    <p className="text-sm font-medium text-green-700">
                        Present
                    </p>

                    <p className="mt-2 text-3xl font-bold text-green-700">
                        {stats.present}
                    </p>

                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50 p-5">

                    <p className="text-sm font-medium text-red-700">
                        Absent
                    </p>

                    <p className="mt-2 text-3xl font-bold text-red-700">
                        {stats.absent}
                    </p>

                </div>

                <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5">

                    <p className="text-sm font-medium text-yellow-700">
                        Late
                    </p>

                    <p className="mt-2 text-3xl font-bold text-yellow-700">
                        {stats.late}
                    </p>

                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">

                    <div className="flex items-center gap-2">

                        <FaPercentage className="text-indigo-600" />

                        <p className="text-sm font-medium text-indigo-700">
                            Attendance
                        </p>

                    </div>

                    <p className="mt-2 text-3xl font-bold text-indigo-700">
                        {stats.percentage.toFixed(
                            2
                        )}
                        %
                    </p>

                </div>

            </div>

            {/* =================================================
                DOWNLOAD BUTTONS
            ================================================= */}

            <div className="flex flex-wrap gap-3">

                <button
                    type="button"
                    onClick={
                        downloadExcel
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                    <FaFileExcel />
                    Download Excel
                </button>

                <button
                    type="button"
                    onClick={
                        downloadPDF
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                    <FaFilePdf />
                    Download PDF
                </button>

                <button
                    type="button"
                    onClick={
                        downloadWord
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    <FaFileWord />
                    Download Word
                </button>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <h2 className="font-bold text-gray-900">
                            Daily Attendance Records
                        </h2>

                        <p className="text-sm text-gray-500">
                            {formatDate(
                                selectedDate
                            )}
                        </p>

                    </div>

                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {filteredAttendance.length}{" "}
                        records
                    </span>

                </div>

                {loading ? (

                    <div className="flex min-h-62.5 items-center justify-center">

                        <div className="text-center">

                            <FaSyncAlt className="mx-auto animate-spin text-2xl text-indigo-600" />

                            <p className="mt-3 text-sm text-gray-500">
                                Loading attendance...
                            </p>

                        </div>

                    </div>

                ) : filteredAttendance.length ===
                  0 ? (

                    <div className="flex min-h-62.5 items-center justify-center px-5">

                        <div className="text-center">

                            <div className="text-4xl">
                                📋
                            </div>

                            <h3 className="mt-3 font-semibold text-gray-900">
                                No attendance found
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                No attendance records are available for the selected filters.
                            </p>

                        </div>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full text-left text-sm">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        #
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Register Number
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Student
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Year
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Section
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Subject
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Staff
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Status
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {filteredAttendance.map(
                                    (
                                        row,
                                        index
                                    ) => {

                                        const status =
                                            getStatus(
                                                row
                                            );

                                        return (
                                            <tr
                                                key={
                                                    row.attendance_id ||
                                                    row.attendanceId ||
                                                    row.id ||
                                                    index
                                                }
                                                className="transition hover:bg-gray-50"
                                            >

                                                <td className="px-5 py-4 text-gray-500">
                                                    {index +
                                                        1}
                                                </td>

                                                <td className="px-5 py-4 font-semibold text-gray-800">
                                                    {getRegisterNumber(
                                                        row
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">

                                                    <div className="font-semibold text-gray-900">
                                                        {getStudentName(
                                                            row
                                                        )}
                                                    </div>

                                                    {row.email && (
                                                        <div className="mt-1 text-xs text-gray-400">
                                                            {
                                                                row.email
                                                            }
                                                        </div>
                                                    )}

                                                </td>

                                                <td className="px-5 py-4 text-gray-600">
                                                    {getYear(
                                                        row
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-gray-600">
                                                    {getSection(
                                                        row
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-gray-600">
                                                    {getSubject(
                                                        row
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-gray-600">
                                                    {getStaff(
                                                        row
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {statusBadge(
                                                        status
                                                    )}
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
}

export default HodDailyAttendance;