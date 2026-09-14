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
    FaChartPie,
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
    "http://localhost:5000/api";


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

const getDepartmentAliases = (
    department
) => {
    const value =
        normalize(department);

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
        aliases.add(
            "computer science engineering"
        );
        aliases.add("cse");
        aliases.add("cs");
    }

    if (
        value.includes("information") ||
        value === "it" ||
        value === "ise"
    ) {
        aliases.add(
            "information technology"
        );
        aliases.add(
            "information science"
        );
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
        aliases.add(
            "mechanical engineering"
        );
        aliases.add("mechanical");
        aliases.add("mech");
    }

    if (
        value.includes("civil") ||
        value === "ce"
    ) {
        aliases.add(
            "civil engineering"
        );
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

const getStatus = (row) =>
    normalize(row.status);

const getStudentName = (row) => {
    const fullName =
        `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();

    return (
        row.student_name ??
        row.name ??
        row.full_name ??
        (fullName || "-")
    );
};

const getRegisterNumber = (row) =>
    row.register_number ??
    row.register_no ??
    row.registration_number ??
    row.roll_number ??
    "-";


// =====================================================
// Component
// =====================================================

const HodAttendancePercentage = () => {
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
                "HOD Attendance Percentage Error:",
                err
            );

            setError(
                err.message ||
                "Failed to load attendance percentage"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    // =================================================
    // Department Attendance
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
    // Years
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

    // =================================================
    // Sections
    // =================================================

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
    // Student Percentage
    // =================================================

    const studentRows =
        useMemo(() => {
            const map = new Map();

            departmentAttendance.forEach(
                (row) => {
                    const year =
                        String(
                            getYear(row)
                        );

                    const section =
                        String(
                            getSection(row)
                        );

                    if (
                        yearFilter !==
                            "ALL" &&
                        year !==
                            yearFilter
                    ) {
                        return;
                    }

                    if (
                        sectionFilter !==
                            "ALL" &&
                        section !==
                            sectionFilter
                    ) {
                        return;
                    }

                    const registerNumber =
                        getRegisterNumber(
                            row
                        );

                    const studentName =
                        getStudentName(
                            row
                        );

                    const studentId =
                        String(
                            row.student_id ??
                            row.studentId ??
                            registerNumber
                        );

                    const searchText =
                        `${registerNumber} ${studentName}`
                            .toLowerCase();

                    if (
                        search &&
                        !searchText.includes(
                            search.toLowerCase()
                        )
                    ) {
                        return;
                    }

                    if (
                        !map.has(
                            studentId
                        )
                    ) {
                        map.set(
                            studentId,
                            {
                                studentId,
                                registerNumber,
                                studentName,
                                year,
                                section,
                                present: 0,
                                absent: 0,
                                late: 0,
                                total: 0,
                            }
                        );
                    }

                    const student =
                        map.get(
                            studentId
                        );

                    student.total += 1;

                    const status =
                        getStatus(
                            row
                        );

                    if (
                        status ===
                        "present"
                    ) {
                        student.present +=
                            1;
                    }

                    if (
                        status ===
                        "absent"
                    ) {
                        student.absent +=
                            1;
                    }

                    if (
                        status ===
                        "late"
                    ) {
                        student.late +=
                            1;
                    }
                }
            );

            return [
                ...map.values(),
            ]
                .map((student) => {
                    const attended =
                        student.present +
                        student.late;

                    const percentage =
                        student.total >
                        0
                            ? (
                                (attended /
                                    student.total) *
                                100
                            ).toFixed(2)
                            : "0.00";

                    let category =
                        "Good";

                    if (
                        Number(
                            percentage
                        ) < 75
                    ) {
                        category =
                            "Below 75%";
                    } else if (
                        Number(
                            percentage
                        ) < 85
                    ) {
                        category =
                            "75% - 85%";
                    } else if (
                        Number(
                            percentage
                        ) < 90
                    ) {
                        category =
                            "85% - 90%";
                    } else {
                        category =
                            "90%+";
                    }

                    return {
                        ...student,
                        percentage,
                        category,
                    };
                })
                .sort(
                    (a, b) =>
                        Number(
                            a.percentage
                        ) -
                        Number(
                            b.percentage
                        )
                );
        }, [
            departmentAttendance,
            yearFilter,
            sectionFilter,
            search,
        ]);

    // =================================================
    // Summary
    // =================================================

    const summary =
        useMemo(() => {
            const students =
                studentRows.length;

            const below75 =
                studentRows.filter(
                    (student) =>
                        Number(
                            student.percentage
                        ) < 75
                ).length;

            const between75And85 =
                studentRows.filter(
                    (student) =>
                        Number(
                            student.percentage
                        ) >= 75 &&
                        Number(
                            student.percentage
                        ) < 85
                ).length;

            const between85And90 =
                studentRows.filter(
                    (student) =>
                        Number(
                            student.percentage
                        ) >= 85 &&
                        Number(
                            student.percentage
                        ) < 90
                ).length;

            const above90 =
                studentRows.filter(
                    (student) =>
                        Number(
                            student.percentage
                        ) >= 90
                ).length;

            const average =
                students > 0
                    ? (
                        studentRows.reduce(
                            (
                                sum,
                                student
                            ) =>
                                sum +
                                Number(
                                    student.percentage
                                ),
                            0
                        ) /
                        students
                    ).toFixed(2)
                    : "0.00";

            return {
                students,
                below75,
                between75And85,
                between85And90,
                above90,
                average,
            };
        }, [
            studentRows,
        ]);

    // =================================================
    // Excel
    // =================================================

    const exportExcel = () => {
        const rows =
            studentRows.map(
                (student, index) => ({
                    "#":
                        index + 1,
                    "Register Number":
                        student.registerNumber,
                    Student:
                        student.studentName,
                    Year:
                        student.year,
                    Section:
                        student.section,
                    Present:
                        student.present,
                    Absent:
                        student.absent,
                    Late:
                        student.late,
                    Total:
                        student.total,
                    "Attendance %":
                        `${student.percentage}%`,
                    Category:
                        student.category,
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
            "Attendance Percentage"
        );

        XLSX.writeFile(
            workbook,
            `HOD_Attendance_Percentage_${departmentName.replace(
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
            "HOD Attendance Percentage Report",
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
                "Register Number",
                "Student",
                "Year",
                "Section",
                "Present",
                "Absent",
                "Late",
                "Total",
                "Attendance %",
                "Category",
            ]],

            body:
                studentRows.map(
                    (
                        student,
                        index
                    ) => [
                        index + 1,
                        student.registerNumber,
                        student.studentName,
                        student.year,
                        student.section,
                        student.present,
                        student.absent,
                        student.late,
                        student.total,
                        `${student.percentage}%`,
                        student.category,
                    ]
                ),
        });

        doc.save(
            `HOD_Attendance_Percentage_${departmentName.replace(
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
                    "Register Number",
                    "Student",
                    "Year",
                    "Section",
                    "Present",
                    "Absent",
                    "Late",
                    "Total",
                    "Attendance %",
                    "Category",
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
            studentRows.map(
                (student) =>
                    new TableRow({
                        children: [
                            student.registerNumber,
                            student.studentName,
                            student.year,
                            student.section,
                            String(
                                student.present
                            ),
                            String(
                                student.absent
                            ),
                            String(
                                student.late
                            ),
                            String(
                                student.total
                            ),
                            `${student.percentage}%`,
                            student.category,
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
                                            "HOD Attendance Percentage Report",
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
            `HOD_Attendance_Percentage_${departmentName.replace(
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
                        Loading attendance percentage...
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
                            Attendance Percentage
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

            {/* Summary Cards */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-slate-500">
                                Students
                            </p>

                            <h2 className="text-2xl font-bold text-slate-800 mt-1">
                                {summary.students}
                            </h2>
                        </div>

                        <FaChartPie className="text-2xl text-blue-600" />

                    </div>
                </div>

                <div className="bg-white border border-red-200 rounded-xl p-5">

                    <p className="text-sm text-slate-500">
                        Below 75%
                    </p>

                    <h2 className="text-2xl font-bold text-red-600 mt-1">
                        {summary.below75}
                    </h2>

                </div>

                <div className="bg-white border border-orange-200 rounded-xl p-5">

                    <p className="text-sm text-slate-500">
                        75% - 85%
                    </p>

                    <h2 className="text-2xl font-bold text-orange-600 mt-1">
                        {summary.between75And85}
                    </h2>

                </div>

                <div className="bg-white border border-blue-200 rounded-xl p-5">

                    <p className="text-sm text-slate-500">
                        85% - 90%
                    </p>

                    <h2 className="text-2xl font-bold text-blue-600 mt-1">
                        {summary.between85And90}
                    </h2>

                </div>

                <div className="bg-white border border-green-200 rounded-xl p-5">

                    <p className="text-sm text-slate-500">
                        90%+
                    </p>

                    <h2 className="text-2xl font-bold text-green-600 mt-1">
                        {summary.above90}
                    </h2>

                </div>

            </div>

            {/* Average */}

            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                    <div>
                        <p className="text-sm text-slate-500">
                            Department Average Attendance
                        </p>

                        <h2 className="text-4xl font-bold text-purple-600 mt-1">
                            {summary.average}%
                        </h2>
                    </div>

                    <div className="w-full md:w-1/2">

                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">

                            <div
                                className="h-full bg-purple-600 rounded-full"
                                style={{
                                    width: `${Math.min(
                                        Number(
                                            summary.average
                                        ),
                                        100
                                    )}%`,
                                }}
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* Filters */}

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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
                            placeholder="Search student or register number"
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg"
                        />

                    </div>

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

                </div>

            </div>

            {/* Table */}

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

                <div className="px-5 py-4 border-b border-slate-200">

                    <h2 className="font-semibold text-slate-800">
                        Student Attendance Percentage
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
                                    Register Number
                                </th>

                                <th className="px-4 py-3 text-left">
                                    Student
                                </th>

                                <th className="px-4 py-3 text-left">
                                    Year
                                </th>

                                <th className="px-4 py-3 text-left">
                                    Section
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Present
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Absent
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Late
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Total
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Attendance %
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Category
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {studentRows.length === 0 ? (
                                <tr>

                                    <td
                                        colSpan="11"
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        No attendance percentage records found.
                                    </td>

                                </tr>
                            ) : (
                                studentRows.map(
                                    (
                                        student,
                                        index
                                    ) => {

                                        const percentage =
                                            Number(
                                                student.percentage
                                            );

                                        return (
                                            <tr
                                                key={
                                                    student.studentId
                                                }
                                                className="hover:bg-slate-50"
                                            >

                                                <td className="px-4 py-3">
                                                    {index + 1}
                                                </td>

                                                <td className="px-4 py-3 font-medium">
                                                    {
                                                        student.registerNumber
                                                    }
                                                </td>

                                                <td className="px-4 py-3 font-medium text-slate-800">
                                                    {
                                                        student.studentName
                                                    }
                                                </td>

                                                <td className="px-4 py-3">
                                                    {
                                                        student.year
                                                    }
                                                </td>

                                                <td className="px-4 py-3">
                                                    {
                                                        student.section
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-center text-green-600 font-semibold">
                                                    {
                                                        student.present
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-center text-red-600 font-semibold">
                                                    {
                                                        student.absent
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-center text-orange-600 font-semibold">
                                                    {
                                                        student.late
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-center font-semibold">
                                                    {
                                                        student.total
                                                    }
                                                </td>

                                                <td className="px-4 py-3">

                                                    <div className="flex items-center gap-2">

                                                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">

                                                            <div
                                                                className="h-full rounded-full bg-purple-600"
                                                                style={{
                                                                    width: `${Math.min(
                                                                        percentage,
                                                                        100
                                                                    )}%`,
                                                                }}
                                                            />

                                                        </div>

                                                        <span
                                                            className={`font-semibold ${
                                                                percentage <
                                                                75
                                                                    ? "text-red-600"
                                                                    : percentage <
                                                                        85
                                                                        ? "text-orange-600"
                                                                        : "text-green-600"
                                                            }`}
                                                        >
                                                            {
                                                                student.percentage
                                                            }%
                                                        </span>

                                                    </div>

                                                </td>

                                                <td className="px-4 py-3 text-center">

                                                    <span
                                                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                            percentage <
                                                            75
                                                                ? "bg-red-100 text-red-700"
                                                                : percentage <
                                                                    85
                                                                    ? "bg-orange-100 text-orange-700"
                                                                    : percentage <
                                                                        90
                                                                        ? "bg-blue-100 text-blue-700"
                                                                        : "bg-green-100 text-green-700"
                                                        }`}
                                                    >
                                                        {
                                                            student.category
                                                        }
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

export default HodAttendancePercentage;