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
    FaUsers,
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
    "http://localhost:5000/api";

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

function HodClassAttendance() {

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

    const [sectionFilter, setSectionFilter] =
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
                "HOD Class Attendance Error:",
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

    const getYear = (row) => {

        return (
            row.year ||
            row.student_year ||
            row.studentYear ||
            "-"
        );
    };

    const getSection = (row) => {

        return (
            row.section ||
            row.class_section ||
            row.classSection ||
            "-"
        );
    };

    const getClassId = (row) => {

        return (
            row.class_id ||
            row.classId ||
            `${getYear(row)}-${getSection(row)}`
        );
    };

    // =================================================
    // CLASS SUMMARY
    // =================================================

    const classSummary =
        useMemo(() => {

            const map =
                new Map();

            attendance
                .filter(
                    departmentMatches
                )
                .forEach(
                    (row) => {

                        const classId =
                            getClassId(
                                row
                            );

                        const year =
                            getYear(
                                row
                            );

                        const section =
                            getSection(
                                row
                            );

                        if (
                            !map.has(
                                classId
                            )
                        ) {

                            map.set(
                                classId,
                                {
                                    classId,
                                    year,
                                    section,
                                    records: 0,
                                    present: 0,
                                    absent: 0,
                                    late: 0,
                                }
                            );
                        }

                        const item =
                            map.get(
                                classId
                            );

                        item.records++;

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
                            total,
                            percentage,
                        };
                    }
                )
                .sort(
                    (a, b) => {

                        const yearCompare =
                            String(
                                a.year
                            ).localeCompare(
                                String(
                                    b.year
                                )
                            );

                        if (
                            yearCompare !==
                            0
                        ) {
                            return yearCompare;
                        }

                        return String(
                            a.section
                        ).localeCompare(
                            String(
                                b.section
                            )
                        );
                    }
                );

        }, [
            attendance,
            department,
        ]);

    // =================================================
    // YEAR OPTIONS
    // =================================================

    const yearOptions =
        useMemo(() => {

            return [
                ...new Set(
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
                        )
                ),
            ].sort();

        }, [
            attendance,
            department,
        ]);

    // =================================================
    // SECTION OPTIONS
    // =================================================

    const sectionOptions =
        useMemo(() => {

            return [
                ...new Set(
                    attendance
                        .filter(
                            departmentMatches
                        )
                        .map(
                            getSection
                        )
                        .filter(
                            (section) =>
                                section !== "-"
                        )
                        .map(
                            String
                        )
                ),
            ].sort();

        }, [
            attendance,
            department,
        ]);

    // =================================================
    // FILTERED CLASSES
    // =================================================

    const filteredClasses =
        useMemo(() => {

            const searchValue =
                normalizeText(
                    search
                );

            return classSummary.filter(
                (item) => {

                    // -----------------------------
                    // YEAR
                    // -----------------------------

                    if (
                        yearFilter !==
                        "ALL" &&
                        String(
                            item.year
                        ) !==
                            String(
                                yearFilter
                            )
                    ) {
                        return false;
                    }

                    // -----------------------------
                    // SECTION
                    // -----------------------------

                    if (
                        sectionFilter !==
                        "ALL" &&
                        String(
                            item.section
                        ) !==
                            String(
                                sectionFilter
                            )
                    ) {
                        return false;
                    }

                    // -----------------------------
                    // SEARCH
                    // -----------------------------

                    if (
                        searchValue
                    ) {

                        const searchable =
                            [
                                item.year,
                                item.section,
                                `year ${item.year}`,
                                `section ${item.section}`,
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
            classSummary,
            yearFilter,
            sectionFilter,
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

            filteredClasses.forEach(
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
                classes:
                    filteredClasses.length,
                present,
                absent,
                late,
                total,
                percentage,
            };

        }, [
            filteredClasses,
        ]);

    // =================================================
    // EXCEL
    // =================================================

    const downloadExcel = () => {

        if (
            filteredClasses.length ===
            0
        ) {

            alert(
                "No class attendance data available to download."
            );

            return;
        }

        const rows =
            filteredClasses.map(
                (
                    item,
                    index
                ) => ({
                    "#":
                        index + 1,

                    "Year":
                        item.year,

                    "Section":
                        item.section,

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
                    "Class Attendance Summary",
                ],
                [
                    "Classes",
                    stats.classes,
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
            "Class Attendance"
        );

        const buffer =
            XLSX.write(
                workbook,
                {
                    bookType: "xlsx",
                    type: "array",
                }
            );

        const blob =
            new Blob(
                [buffer],
                {
                    type:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                }
            );

        saveAs(
            blob,
            `hod-class-attendance-${department || "department"}.xlsx`
        );
    };

    // =================================================
    // PDF
    // =================================================

    const downloadPDF = () => {

        if (
            filteredClasses.length ===
            0
        ) {

            alert(
                "No class attendance data available to download."
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
            "Class Attendance Report",
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
            `Classes: ${
                stats.classes
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
                        "Year",
                        "Section",
                        "Present",
                        "Absent",
                        "Late",
                        "Total",
                        "%",
                    ],
                ],

                body:
                    filteredClasses.map(
                        (
                            item,
                            index
                        ) => [
                            index + 1,
                            item.year,
                            item.section,
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
                    fontSize: 9,
                },

                headStyles: {
                    fontStyle:
                        "bold",
                },
            }
        );

        doc.save(
            `hod-class-attendance-${department || "department"}.pdf`
        );
    };

    // =================================================
    // WORD
    // =================================================

    const downloadWord = async () => {

        if (
            filteredClasses.length ===
            0
        ) {

            alert(
                "No class attendance data available to download."
            );

            return;
        }

        const headers = [
            "#",
            "Year",
            "Section",
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
            filteredClasses.map(
                (
                    item,
                    index
                ) =>
                    new TableRow({
                        children: [
                            index + 1,
                            item.year,
                            item.section,
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
                                    "Class Attendance Report",
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
                                            `Classes: ${
                                                stats.classes
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
            `hod-class-attendance-${department || "department"}.docx`
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

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-600">
                            <FaUsers />
                        </div>

                        <div>

                            <p className="text-sm font-medium text-blue-600">
                                HOD Attendance Reports
                            </p>

                            <h1 className="text-3xl font-bold text-gray-900">
                                Class Attendance
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                View attendance by year and section.
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
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            Section
                        </label>

                        <select
                            value={
                                sectionFilter
                            }
                            onChange={(e) =>
                                setSectionFilter(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >

                            <option value="ALL">
                                All Sections
                            </option>

                            {sectionOptions.map(
                                (section) => (
                                    <option
                                        key={
                                            section
                                        }
                                        value={
                                            section
                                        }
                                    >
                                        Section{" "}
                                        {section}
                                    </option>
                                )
                            )}

                        </select>

                    </div>

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
                                placeholder="Year or section..."
                                className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* =================================================
                STATS
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

                    <p className="text-sm font-medium text-blue-700">
                        Classes
                    </p>

                    <p className="mt-2 text-3xl font-bold text-blue-700">
                        {stats.classes}
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
                            Class Attendance Summary
                        </h2>

                        <p className="text-sm text-gray-500">
                            Department:{" "}
                            {department ||
                                "-"}
                        </p>

                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {filteredClasses.length}{" "}
                        classes
                    </span>

                </div>

                {loading ? (

                    <div className="flex min-h-62.5 items-center justify-center">

                        <div className="text-center">

                            <FaSyncAlt className="mx-auto animate-spin text-2xl text-blue-600" />

                            <p className="mt-3 text-sm text-gray-500">
                                Loading class attendance...
                            </p>

                        </div>

                    </div>

                ) : filteredClasses.length ===
                  0 ? (

                    <div className="flex min-h-62.5 items-center justify-center px-5">

                        <div className="text-center">

                            <div className="text-4xl">
                                🏫
                            </div>

                            <h3 className="mt-3 font-semibold text-gray-900">
                                No class attendance found
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                No records match the selected filters.
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
                                        Year
                                    </th>

                                    <th className="px-5 py-4 font-semibold text-gray-600">
                                        Section
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
                                        Attendance %
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {filteredClasses.map(
                                    (
                                        item,
                                        index
                                    ) => (

                                        <tr
                                            key={
                                                item.classId
                                            }
                                            className="transition hover:bg-gray-50"
                                        >

                                            <td className="px-5 py-4 text-gray-500">
                                                {index +
                                                    1}
                                            </td>

                                            <td className="px-5 py-4">

                                                <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                                    Year{" "}
                                                    {
                                                        item.year
                                                    }
                                                </span>

                                            </td>

                                            <td className="px-5 py-4 font-semibold text-gray-900">
                                                Section{" "}
                                                {
                                                    item.section
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

export default HodClassAttendance;