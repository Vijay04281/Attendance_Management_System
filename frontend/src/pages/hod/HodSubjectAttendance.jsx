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
    FaBook,
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
// HELPERS
// =====================================================

function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

// =====================================================
// COMPONENT
// =====================================================

function HodSubjectAttendance() {

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
                "HOD Subject Attendance Error:",
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
    // FIELD HELPERS
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

    const getSubjectId = (row) => {

        return (
            row.subject_id ||
            row.subjectId ||
            row.subject_code ||
            row.subjectCode ||
            row.subject_name ||
            row.subjectName ||
            "unknown"
        );
    };

    const getSubjectCode = (row) => {

        return (
            row.subject_code ||
            row.subjectCode ||
            "-"
        );
    };

    const getSubjectName = (row) => {

        return (
            row.subject_name ||
            row.subjectName ||
            row.subject ||
            "-"
        );
    };

    const getStaffName = (row) => {

        return (
            row.staff_name ||
            row.staffName ||
            row.teacher_name ||
            row.teacherName ||
            "-"
        );
    };

    const getYear = (row) => {

        return (
            row.year ||
            row.student_year ||
            row.studentYear ||
            "-"
        );
    };

    // =================================================
    // SUBJECT SUMMARY
    // =================================================

    const subjectSummary =
        useMemo(() => {

            const map =
                new Map();

            attendance
                .filter(
                    departmentMatches
                )
                .forEach(
                    (row) => {

                        const subjectId =
                            getSubjectId(
                                row
                            );

                        if (
                            !map.has(
                                subjectId
                            )
                        ) {

                            map.set(
                                subjectId,
                                {
                                    subjectId,
                                    subjectCode:
                                        getSubjectCode(
                                            row
                                        ),
                                    subjectName:
                                        getSubjectName(
                                            row
                                        ),
                                    staffNames:
                                        new Set(),
                                    records: 0,
                                    present: 0,
                                    absent: 0,
                                    late: 0,
                                    years:
                                        new Set(),
                                }
                            );
                        }

                        const item =
                            map.get(
                                subjectId
                            );

                        item.records++;

                        const staff =
                            getStaffName(
                                row
                            );

                        if (
                            staff &&
                            staff !== "-"
                        ) {
                            item.staffNames.add(
                                staff
                            );
                        }

                        const year =
                            getYear(
                                row
                            );

                        if (
                            year &&
                            year !== "-"
                        ) {
                            item.years.add(
                                String(
                                    year
                                )
                            );
                        }

                        const status =
                            getStatus(
                                row
                            );

                        if (
                            status ===
                            "PRESENT"
                        ) {

                            item.present++;

                        } else if (
                            status ===
                            "ABSENT"
                        ) {

                            item.absent++;

                        } else if (
                            status ===
                            "LATE"
                        ) {

                            item.late++;
                        }
                    }
                );

            return Array.from(
                map.values()
            )
                .map(
                    (item) => {

                        const total =
                            item.present +
                            item.absent +
                            item.late;

                        const percentage =
                            total > 0
                                ? (
                                    (
                                        item.present +
                                        item.late
                                    ) /
                                    total
                                ) *
                                100
                                : 0;

                        return {
                            ...item,

                            staff:
                                Array.from(
                                    item.staffNames
                                ).join(
                                    ", "
                                ),

                            year:
                                Array.from(
                                    item.years
                                ).join(
                                    ", "
                                ),

                            total,

                            percentage,
                        };
                    }
                )
                .sort(
                    (a, b) =>
                        a.subjectName.localeCompare(
                            b.subjectName
                        )
                );

        }, [
            attendance,
            department,
        ]);

    // =================================================
    // FILTER SUBJECTS
    // =================================================

    const filteredSubjects =
        useMemo(() => {

            const searchValue =
                normalizeText(
                    search
                );

            return subjectSummary.filter(
                (item) => {

                    // -----------------------------
                    // YEAR
                    // -----------------------------

                    if (
                        yearFilter !==
                        "ALL"
                    ) {

                        const years =
                            String(
                                item.year ||
                                ""
                            );

                        if (
                            !years
                                .split(",")
                                .map(
                                    (value) =>
                                        value.trim()
                                )
                                .includes(
                                    String(
                                        yearFilter
                                    )
                                )
                        ) {
                            return false;
                        }
                    }

                    // -----------------------------
                    // SEARCH
                    // -----------------------------

                    if (
                        searchValue
                    ) {

                        const searchable =
                            [
                                item.subjectCode,
                                item.subjectName,
                                item.staff,
                                item.year,
                            ]
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
            subjectSummary,
            yearFilter,
            search,
        ]);

    // =================================================
    // OVERALL STATS
    // =================================================

    const stats =
        useMemo(() => {

            let present = 0;
            let absent = 0;
            let late = 0;

            filteredSubjects.forEach(
                (item) => {

                    present +=
                        item.present;

                    absent +=
                        item.absent;

                    late +=
                        item.late;
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
                subjects:
                    filteredSubjects.length,
                present,
                absent,
                late,
                total,
                percentage,
            };

        }, [
            filteredSubjects,
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
                        getYear
                    )
                    .filter(
                        (year) =>
                            year !== "-"
                    )
                    .map(
                        String
                    );

            return [
                ...new Set(
                    years
                ),
            ].sort();

        }, [
            attendance,
            department,
        ]);

    // =================================================
    // DOWNLOAD EXCEL
    // =================================================

    const downloadExcel = () => {

        if (
            filteredSubjects.length ===
            0
        ) {

            alert(
                "No subject attendance data available to download."
            );

            return;
        }

        const rows =
            filteredSubjects.map(
                (
                    item,
                    index
                ) => ({
                    "#":
                        index + 1,

                    "Subject Code":
                        item.subjectCode,

                    "Subject":
                        item.subjectName,

                    "Year":
                        item.year,

                    "Staff":
                        item.staff,

                    "Present":
                        item.present,

                    "Absent":
                        item.absent,

                    "Late":
                        item.late,

                    "Total":
                        item.total,

                    "Attendance %":
                        `${item.percentage.toFixed(
                            2
                        )}%`,
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
                    "Subject Attendance Summary",
                ],
                [
                    "Subjects",
                    stats.subjects,
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
            "Subject Attendance"
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
            `hod-subject-attendance-${department || "department"}.xlsx`
        );
    };

    // =================================================
    // DOWNLOAD PDF
    // =================================================

    const downloadPDF = () => {

        if (
            filteredSubjects.length ===
            0
        ) {

            alert(
                "No subject attendance data available to download."
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
            "Subject Attendance Report",
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
            `Subjects: ${
                stats.subjects
            }   Present: ${
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
            30
        );

        autoTable(
            doc,
            {
                startY: 38,

                head: [
                    [
                        "#",
                        "Subject Code",
                        "Subject",
                        "Year",
                        "Staff",
                        "Present",
                        "Absent",
                        "Late",
                        "Total",
                        "%",
                    ],
                ],

                body:
                    filteredSubjects.map(
                        (
                            item,
                            index
                        ) => [
                            index + 1,
                            item.subjectCode,
                            item.subjectName,
                            item.year,
                            item.staff,
                            item.present,
                            item.absent,
                            item.late,
                            item.total,
                            `${item.percentage.toFixed(
                                2
                            )}%`,
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
            `hod-subject-attendance-${department || "department"}.pdf`
        );
    };

    // =================================================
    // DOWNLOAD WORD
    // =================================================

    const downloadWord = async () => {

        if (
            filteredSubjects.length ===
            0
        ) {

            alert(
                "No subject attendance data available to download."
            );

            return;
        }

        const headers = [
            "#",
            "Subject Code",
            "Subject",
            "Year",
            "Staff",
            "Present",
            "Absent",
            "Late",
            "Total",
            "%",
        ];

        const headerCells =
            headers.map(
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
            filteredSubjects.map(
                (
                    item,
                    index
                ) =>
                    new TableRow({
                        children: [
                            index + 1,
                            item.subjectCode,
                            item.subjectName,
                            item.year,
                            item.staff,
                            item.present,
                            item.absent,
                            item.late,
                            item.total,
                            `${item.percentage.toFixed(
                                2
                            )}%`,
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
                                    "Subject Attendance Report",
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
                                            `Subjects: ${
                                                stats.subjects
                                            } | Present: ${
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
            `hod-subject-attendance-${department || "department"}.docx`
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

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-xl text-purple-600">
                            <FaBook />
                        </div>

                        <div>

                            <p className="text-sm font-medium text-purple-600">
                                HOD Attendance Reports
                            </p>

                            <h1 className="text-3xl font-bold text-gray-900">
                                Subject Attendance
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                View attendance subject-wise for your department.
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

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
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
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
                            Search Subject
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
                                placeholder="Subject, code or staff..."
                                className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* =================================================
                STATS
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">

                    <p className="text-sm font-medium text-purple-700">
                        Subjects
                    </p>

                    <p className="mt-2 text-3xl font-bold text-purple-700">
                        {stats.subjects}
                    </p>

                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-5">

                    <div className="flex items-center gap-2">

                        <FaCheckCircle className="text-green-600" />

                        <p className="text-sm font-medium text-green-700">
                            Present
                        </p>

                    </div>

                    <p className="mt-2 text-3xl font-bold text-green-700">
                        {stats.present}
                    </p>

                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50 p-5">

                    <div className="flex items-center gap-2">

                        <FaTimesCircle className="text-red-600" />

                        <p className="text-sm font-medium text-red-700">
                            Absent
                        </p>

                    </div>

                    <p className="mt-2 text-3xl font-bold text-red-700">
                        {stats.absent}
                    </p>

                </div>

                <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5">

                    <div className="flex items-center gap-2">

                        <FaClock className="text-yellow-600" />

                        <p className="text-sm font-medium text-yellow-700">
                            Late
                        </p>

                    </div>

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
                DOWNLOAD
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
                            Subject Attendance Summary
                        </h2>

                        <p className="text-sm text-gray-500">
                            Department:{" "}
                            {department ||
                                "-"}
                        </p>

                    </div>

                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                        {filteredSubjects.length}{" "}
                        subjects
                    </span>

                </div>

                {loading ? (

                    <div className="flex min-h-62.5 items-center justify-center">

                        <div className="text-center">

                            <FaSyncAlt className="mx-auto animate-spin text-2xl text-purple-600" />

                            <p className="mt-3 text-sm text-gray-500">
                                Loading subject attendance...
                            </p>

                        </div>

                    </div>

                ) : filteredSubjects.length ===
                  0 ? (

                    <div className="flex min-h-62.5 items-center justify-center px-5">

                        <div className="text-center">

                            <div className="text-4xl">
                                📚
                            </div>

                            <h3 className="mt-3 font-semibold text-gray-900">
                                No subject attendance found
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                No attendance records match the selected filters.
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
                                        Subject Code
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Subject
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Year
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Staff
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-green-600">
                                        Present
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-red-600">
                                        Absent
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-yellow-600">
                                        Late
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Total
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-indigo-600">
                                        %
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {filteredSubjects.map(
                                    (
                                        item,
                                        index
                                    ) => (

                                        <tr
                                            key={
                                                item.subjectId
                                            }
                                            className="transition hover:bg-gray-50"
                                        >

                                            <td className="px-5 py-4 text-gray-500">
                                                {index +
                                                    1}
                                            </td>

                                            <td className="px-5 py-4">

                                                <span className="rounded-lg bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                                                    {
                                                        item.subjectCode
                                                    }
                                                </span>

                                            </td>

                                            <td className="px-5 py-4 font-semibold text-gray-900">
                                                {
                                                    item.subjectName
                                                }
                                            </td>

                                            <td className="px-5 py-4 text-gray-600">
                                                {
                                                    item.year
                                                }
                                            </td>

                                            <td className="px-5 py-4 text-gray-600">
                                                {
                                                    item.staff
                                                }
                                            </td>

                                            <td className="px-5 py-4 font-semibold text-green-700">
                                                {
                                                    item.present
                                                }
                                            </td>

                                            <td className="px-5 py-4 font-semibold text-red-700">
                                                {
                                                    item.absent
                                                }
                                            </td>

                                            <td className="px-5 py-4 font-semibold text-yellow-700">
                                                {
                                                    item.late
                                                }
                                            </td>

                                            <td className="px-5 py-4 font-semibold text-gray-800">
                                                {
                                                    item.total
                                                }
                                            </td>

                                            <td className="px-5 py-4">

                                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                                                    {item.percentage.toFixed(
                                                        2
                                                    )}
                                                    %
                                                </span>

                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}

export default HodSubjectAttendance;