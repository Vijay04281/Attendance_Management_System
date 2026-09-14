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
    FaSearch,
    FaSyncAlt,
    FaFileExcel,
    FaFilePdf,
    FaFileWord,
    FaBuilding,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
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
    TableCell,
    TableRow,
    TextRun,
} from "docx";


// =====================================================
// API
// =====================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "https://attendance-management-system-gpci.onrender.com/api";


// =====================================================
// Helpers
// =====================================================

const normalize = (value) =>
    String(value ?? "")
        .trim()
        .toLowerCase();

const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    "";

const getDepartmentAliases = (department) => {
    const value = normalize(department);

    const aliases = new Set();

    if (value) {
        aliases.add(value);
    }

    if (
        value.includes("computer") ||
        value === "cse" ||
        value === "cs"
    ) {
        aliases.add("computer science");
        aliases.add("computer science engineering");
        aliases.add("cse");
        aliases.add("cs");
    }

    if (
        value.includes("information") ||
        value === "it" ||
        value === "ise"
    ) {
        aliases.add("information technology");
        aliases.add("information science");
        aliases.add("it");
        aliases.add("ise");
    }

    if (
        value.includes("electronic") ||
        value === "ece"
    ) {
        aliases.add(
            "electronics and communication engineering"
        );
        aliases.add("electronics");
        aliases.add("ece");
    }

    if (
        value.includes("mechanical") ||
        value === "mech"
    ) {
        aliases.add("mechanical engineering");
        aliases.add("mechanical");
        aliases.add("mech");
    }

    if (
        value.includes("civil") ||
        value === "ce"
    ) {
        aliases.add("civil engineering");
        aliases.add("civil");
        aliases.add("ce");
    }

    if (
        value.includes("electrical") ||
        value === "eee"
    ) {
        aliases.add(
            "electrical and electronics engineering"
        );
        aliases.add(
            "electrical engineering"
        );
        aliases.add("eee");
    }

    return aliases;
};

const getDepartmentValue = (row) =>
    row.department_name ??
    row.department ??
    row.departmentName ??
    row.department_code ??
    row.departmentCode ??
    "";

const matchesDepartment = (
    row,
    department
) => {
    const rowDepartment =
        normalize(
            getDepartmentValue(row)
        );

    if (!rowDepartment) {
        return true;
    }

    const aliases =
        getDepartmentAliases(
            department
        );

    return (
        aliases.has(rowDepartment) ||
        [...aliases].some(
            (alias) =>
                rowDepartment.includes(alias) ||
                alias.includes(rowDepartment)
        )
    );
};

const getYear = (row) =>
    row.year ??
    row.student_year ??
    row.class_year ??
    "-";

const getSection = (row) =>
    row.section ??
    row.class_section ??
    "-";

const getSubject = (row) =>
    row.subject_name ??
    row.subject ??
    row.subjectName ??
    "-";

const getStaff = (row) =>
    row.staff_name ??
    row.staff ??
    row.staffName ??
    row.teacher_name ??
    "-";

const getStatus = (row) =>
    normalize(row.status);

const getDate = (row) =>
    row.attendance_date ??
    row.date ??
    row.session_date ??
    row.created_at ??
    "-";


// =====================================================
// Component
// =====================================================

const HodDepartmentAttendanceReport = () => {
    const navigate = useNavigate();

    const { department } =
        useParams();

    const token = useMemo(
        () => getToken(),
        []
    );

    const departmentName =
        department
            ? department
                .replace(/-/g, " ")
                .replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                )
            : "Department";

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

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    // =================================================
    // Fetch
    // =================================================

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/attendance`,
                {
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

            if (!response.ok) {
                throw new Error(
                    `Request failed with status ${response.status}`
                );
            }

            const data =
                await response.json();

            const rows =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.attendance)
                        ? data.attendance
                        : Array.isArray(data.data)
                            ? data.data
                            : Array.isArray(data.rows)
                                ? data.rows
                                : [];

            setAttendance(rows);
        } catch (err) {
            console.error(
                "HOD Department Attendance Report Error:",
                err
            );

            setError(
                err.message ||
                "Failed to load department attendance"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    // =================================================
    // Department Data
    // =================================================

    const departmentAttendance =
        useMemo(() => {
            return attendance.filter(
                (row) =>
                    matchesDepartment(
                        row,
                        departmentName
                    )
            );
        }, [
            attendance,
            departmentName,
        ]);

    // =================================================
    // Filters
    // =================================================

    const years = useMemo(
        () =>
            [
                ...new Set(
                    departmentAttendance.map(
                        (row) =>
                            String(
                                getYear(row)
                            )
                    )
                ),
            ]
                .filter(
                    (year) =>
                        year !== "-"
                )
                .sort(),
        [
            departmentAttendance,
        ]
    );

    const sections = useMemo(
        () =>
            [
                ...new Set(
                    departmentAttendance.map(
                        (row) =>
                            String(
                                getSection(row)
                            )
                    )
                ),
            ]
                .filter(
                    (section) =>
                        section !== "-"
                )
                .sort(),
        [
            departmentAttendance,
        ]
    );

    // =================================================
    // Filtered Data
    // =================================================

    const filteredAttendance =
        useMemo(() => {
            return departmentAttendance.filter(
                (row) => {
                    const year =
                        String(
                            getYear(row)
                        );

                    const section =
                        String(
                            getSection(row)
                        );

                    const dateValue =
                        String(
                            getDate(row)
                        ).slice(
                            0,
                            10
                        );

                    if (
                        yearFilter !==
                            "ALL" &&
                        year !==
                            yearFilter
                    ) {
                        return false;
                    }

                    if (
                        sectionFilter !==
                            "ALL" &&
                        section !==
                            sectionFilter
                    ) {
                        return false;
                    }

                    if (
                        fromDate &&
                        dateValue <
                            fromDate
                    ) {
                        return false;
                    }

                    if (
                        toDate &&
                        dateValue >
                            toDate
                    ) {
                        return false;
                    }

                    if (search) {
                        const text =
                            `${getSubject(row)} ${getStaff(row)} ${row.student_name ?? row.name ?? ""} ${row.register_number ?? row.register_no ?? ""}`
                                .toLowerCase();

                        if (
                            !text.includes(
                                search.toLowerCase()
                            )
                        ) {
                            return false;
                        }
                    }

                    return true;
                }
            );
        }, [
            departmentAttendance,
            yearFilter,
            sectionFilter,
            fromDate,
            toDate,
            search,
        ]);

    // =================================================
    // Summary
    // =================================================

    const summary = useMemo(() => {
        const present =
            filteredAttendance.filter(
                (row) =>
                    getStatus(row) ===
                    "present"
            ).length;

        const absent =
            filteredAttendance.filter(
                (row) =>
                    getStatus(row) ===
                    "absent"
            ).length;

        const late =
            filteredAttendance.filter(
                (row) =>
                    getStatus(row) ===
                    "late"
            ).length;

        const total =
            filteredAttendance.length;

        const percentage =
            total > 0
                ? (
                    ((present + late) /
                        total) *
                    100
                ).toFixed(2)
                : "0.00";

        const students = new Set(
            filteredAttendance.map(
                (row) =>
                    row.student_id ??
                    row.studentId ??
                    row.register_number ??
                    row.register_no
            )
        );

        const classes = new Set(
            filteredAttendance.map(
                (row) =>
                    row.class_id ??
                    `${getYear(row)}-${getSection(row)}`
            )
        );

        return {
            students:
                students.size,
            classes:
                classes.size,
            present,
            absent,
            late,
            total,
            percentage,
        };
    }, [
        filteredAttendance,
    ]);

    // =================================================
    // Excel
    // =================================================

    const exportExcel = () => {
        const rows =
            filteredAttendance.map(
                (row, index) => ({
                    "#":
                        index + 1,
                    Date:
                        getDate(row),
                    Year:
                        getYear(row),
                    Section:
                        getSection(row),
                    Subject:
                        getSubject(row),
                    Staff:
                        getStaff(row),
                    Status:
                        row.status ??
                        "-",
                })
            );

        const worksheet =
            XLSX.utils.json_to_sheet(
                rows
            );

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Department Report"
        );

        XLSX.writeFile(
            workbook,
            `HOD_Department_Attendance_${departmentName.replace(
                /\s+/g,
                "_"
            )}.xlsx`
        );
    };

    // =================================================
    // PDF
    // =================================================

    const exportPDF = () => {
        const doc =
            new jsPDF({
                orientation:
                    "landscape",
            });

        doc.setFontSize(16);

        doc.text(
            "HOD Department Attendance Report",
            14,
            15
        );

        doc.setFontSize(10);

        doc.text(
            `Department: ${departmentName}`,
            14,
            23
        );

        autoTable(doc, {
            startY: 30,

            head: [[
                "#",
                "Date",
                "Year",
                "Section",
                "Subject",
                "Staff",
                "Status",
            ]],

            body:
                filteredAttendance.map(
                    (row, index) => [
                        index + 1,
                        getDate(row),
                        getYear(row),
                        getSection(row),
                        getSubject(row),
                        getStaff(row),
                        row.status ??
                            "-",
                    ]
                ),
        });

        doc.save(
            `HOD_Department_Attendance_${departmentName.replace(
                /\s+/g,
                "_"
            )}.pdf`
        );
    };

    // =================================================
    // Word
    // =================================================

    const exportWord = async () => {
        const header =
            new TableRow({
                children: [
                    "Date",
                    "Year",
                    "Section",
                    "Subject",
                    "Staff",
                    "Status",
                ].map(
                    (text) =>
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text,
                                            bold: true,
                                        }),
                                    ],
                                }),
                            ],
                        })
                ),
            });

        const rows =
            filteredAttendance.map(
                (row) =>
                    new TableRow({
                        children: [
                            getDate(row),
                            getYear(row),
                            getSection(row),
                            getSubject(row),
                            getStaff(row),
                            row.status ??
                                "-",
                        ].map(
                            (text) =>
                                new TableCell({
                                    children: [
                                        new Paragraph(
                                            String(
                                                text
                                            )
                                        ),
                                    ],
                                })
                        ),
                    })
            );

        const doc =
            new Document({
                sections: [
                    {
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text:
                                            "HOD Department Attendance Report",
                                        bold: true,
                                        size: 30,
                                    }),
                                ],
                            }),

                            new Paragraph(
                                `Department: ${departmentName}`
                            ),

                            new Paragraph(""),

                            new Table({
                                rows: [
                                    header,
                                    ...rows,
                                ],
                            }),
                        ],
                    },
                ],
            });

        const blob =
            await Packer.toBlob(doc);

        saveAs(
            blob,
            `HOD_Department_Attendance_${departmentName.replace(
                /\s+/g,
                "_"
            )}.docx`
        );
    };

    // =================================================
    // Loading
    // =================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSyncAlt className="text-3xl text-blue-600 animate-spin mx-auto mb-3" />

                    <p className="text-slate-600">
                        Loading department report...
                    </p>
                </div>
            </div>
        );
    }

    // =================================================
    // UI
    // =================================================

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">

            {/* Header */}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

                <div className="flex items-center gap-3">

                    <button
                        onClick={() =>
                            navigate(
                                `/hod/${department}`
                            )
                        }
                        className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                        <FaArrowLeft />
                    </button>

                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                            Department Attendance Report
                        </h1>

                        <p className="text-sm text-slate-500 mt-1">
                            Department:{" "}
                            <span className="font-semibold text-slate-700">
                                {departmentName}
                            </span>
                        </p>
                    </div>

                </div>

                <div className="flex flex-wrap gap-2">

                    <button
                        onClick={
                            fetchAttendance
                        }
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-100"
                    >
                        <FaSyncAlt />
                        Refresh
                    </button>

                    <button
                        onClick={
                            exportExcel
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
                    >
                        <FaFileExcel />
                        Excel
                    </button>

                    <button
                        onClick={
                            exportPDF
                        }
                        className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700"
                    >
                        <FaFilePdf />
                        PDF
                    </button>

                    <button
                        onClick={
                            exportWord
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <FaFileWord />
                        Word
                    </button>

                </div>

            </div>

            {/* Error */}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                    {error}
                </div>
            )}

            {/* Summary */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Students
                    </p>
                    <h2 className="text-2xl font-bold text-slate-800 mt-1">
                        {summary.students}
                    </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Classes
                    </p>
                    <h2 className="text-2xl font-bold text-indigo-600 mt-1">
                        {summary.classes}
                    </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Present
                    </p>
                    <h2 className="text-2xl font-bold text-green-600 mt-1">
                        {summary.present}
                    </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Absent
                    </p>
                    <h2 className="text-2xl font-bold text-red-600 mt-1">
                        {summary.absent}
                    </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Late
                    </p>
                    <h2 className="text-2xl font-bold text-orange-600 mt-1">
                        {summary.late}
                    </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Attendance
                    </p>
                    <h2 className="text-2xl font-bold text-purple-600 mt-1">
                        {summary.percentage}%
                    </h2>
                </div>

            </div>

            {/* Filters */}

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) =>
                            setFromDate(
                                e.target.value
                            )
                        }
                        className="px-4 py-2.5 border border-slate-200 rounded-lg"
                    />

                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) =>
                            setToDate(
                                e.target.value
                            )
                        }
                        className="px-4 py-2.5 border border-slate-200 rounded-lg"
                    />

                    <select
                        value={yearFilter}
                        onChange={(e) =>
                            setYearFilter(
                                e.target.value
                            )
                        }
                        className="px-4 py-2.5 border border-slate-200 rounded-lg"
                    >
                        <option value="ALL">
                            All Years
                        </option>

                        {years.map(
                            (year) => (
                                <option
                                    key={year}
                                    value={year}
                                >
                                    Year {year}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={sectionFilter}
                        onChange={(e) =>
                            setSectionFilter(
                                e.target.value
                            )
                        }
                        className="px-4 py-2.5 border border-slate-200 rounded-lg"
                    >
                        <option value="ALL">
                            All Sections
                        </option>

                        {sections.map(
                            (section) => (
                                <option
                                    key={section}
                                    value={section}
                                >
                                    Section {section}
                                </option>
                            )
                        )}
                    </select>

                    <div className="relative">

                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg"
                        />

                    </div>

                </div>

            </div>

            {/* Table */}

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

                <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                    <FaBuilding className="text-blue-600" />

                    <h2 className="font-semibold text-slate-800">
                        Department Attendance
                    </h2>
                </div>

                <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                        <thead className="bg-slate-50">

                            <tr>
                                <th className="px-4 py-3 text-left">
                                    #
                                </th>

                                <th className="px-4 py-3 text-left">
                                    Date
                                </th>

                                <th className="px-4 py-3 text-left">
                                    Year
                                </th>

                                <th className="px-4 py-3 text-left">
                                    Section
                                </th>

                                <th className="px-4 py-3 text-left">
                                    Subject
                                </th>

                                <th className="px-4 py-3 text-left">
                                    Staff
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Status
                                </th>
                            </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {filteredAttendance.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        No attendance records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAttendance.map(
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
                                                key={`${row.attendance_id ?? row.id ?? index}-${index}`}
                                                className="hover:bg-slate-50"
                                            >

                                                <td className="px-4 py-3">
                                                    {index + 1}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {getDate(
                                                        row
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {getYear(
                                                        row
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {getSection(
                                                        row
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 font-medium">
                                                    {getSubject(
                                                        row
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {getStaff(
                                                        row
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-center">

                                                    <span
                                                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                            status ===
                                                            "present"
                                                                ? "bg-green-100 text-green-700"
                                                                : status ===
                                                                    "late"
                                                                    ? "bg-orange-100 text-orange-700"
                                                                    : "bg-red-100 text-red-700"
                                                        }`}
                                                    >
                                                        {row.status ??
                                                            "-"}
                                                    </span>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )
                            )}

                        </tbody>

                    </table>

                </div>
            </div>

        </div>
    );
};

export default HodDepartmentAttendanceReport;