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
    FaUserGraduate,
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
        value === "ise" ||
        value === "it"
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
        aliases.add("electronics and communication engineering");
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
        aliases.add("electrical and electronics engineering");
        aliases.add("electrical engineering");
        aliases.add("eee");
    }

    return aliases;
};

const getDepartmentValue = (row) => {
    return (
        row.department_name ??
        row.department ??
        row.departmentName ??
        row.department_code ??
        row.departmentCode ??
        ""
    );
};

const matchesDepartment = (row, department) => {
    const rowDepartment = normalize(
        getDepartmentValue(row)
    );

    if (!rowDepartment) {
        return true;
    }

    const aliases =
        getDepartmentAliases(department);

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
    row.academic_year_level ??
    "-";

const getSection = (row) =>
    row.section ??
    row.class_section ??
    row.section_name ??
    "-";

const getStudentId = (row) =>
    row.student_id ??
    row.studentId ??
    row.id ??
    "";

const getRegisterNumber = (row) =>
    row.register_number ??
    row.register_no ??
    row.registration_number ??
    row.roll_number ??
    row.reg_no ??
    "-";

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

const getSubjectName = (row) =>
    row.subject_name ??
    row.subject ??
    row.subjectName ??
    "-";

const getSubjectCode = (row) =>
    row.subject_code ??
    row.subjectCode ??
    "-";

const getStaffName = (row) =>
    row.staff_name ??
    row.staff ??
    row.staffName ??
    row.teacher_name ??
    row.teacher ??
    "-";

const getStatus = (row) =>
    normalize(row.status);

const isPresent = (row) =>
    getStatus(row) === "present";

const isLate = (row) =>
    getStatus(row) === "late";

const isAbsent = (row) =>
    getStatus(row) === "absent";

const getDate = (row) =>
    row.attendance_date ??
    row.date ??
    row.session_date ??
    row.created_at ??
    "-";


// =====================================================
// Component
// =====================================================

const HodStudentAttendance = () => {
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

    const [studentFilter, setStudentFilter] =
        useState("ALL");

    // =================================================
    // Fetch Attendance
    // =================================================

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
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
                "HOD Student Attendance Error:",
                err
            );

            setError(
                err.message ||
                "Failed to load student attendance"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    // =================================================
    // Department Filter
    // =================================================

    const departmentAttendance =
        useMemo(() => {
            return attendance.filter((row) =>
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
    // Student List
    // =================================================

    const students = useMemo(() => {
        const map = new Map();

        departmentAttendance.forEach(
            (row) => {
                const studentId =
                    String(
                        getStudentId(row) ||
                        getRegisterNumber(row)
                    );

                if (!studentId) {
                    return;
                }

                if (!map.has(studentId)) {
                    map.set(studentId, {
                        id: studentId,
                        registerNumber:
                            getRegisterNumber(row),
                        name:
                            getStudentName(row),
                        year:
                            getYear(row),
                        section:
                            getSection(row),
                    });
                }
            }
        );

        return [...map.values()].sort(
            (a, b) =>
                String(a.name).localeCompare(
                    String(b.name)
                )
        );
    }, [
        departmentAttendance,
    ]);

    // =================================================
    // Years
    // =================================================

    const years = useMemo(() => {
        return [
            ...new Set(
                departmentAttendance
                    .map((row) =>
                        String(getYear(row))
                    )
                    .filter(
                        (year) =>
                            year !== "-" &&
                            year !== ""
                    )
            ),
        ].sort();
    }, [
        departmentAttendance,
    ]);

    // =================================================
    // Student Summary
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

                    if (
                        yearFilter !== "ALL" &&
                        year !== yearFilter
                    ) {
                        return;
                    }

                    const studentId =
                        String(
                            getStudentId(row) ||
                            getRegisterNumber(row)
                        );

                    if (!studentId) {
                        return;
                    }

                    if (
                        studentFilter !== "ALL" &&
                        studentId !== studentFilter
                    ) {
                        return;
                    }

                    const studentName =
                        getStudentName(row);

                    const searchText =
                        `${getRegisterNumber(row)} ${studentName}`
                            .toLowerCase();

                    if (
                        search &&
                        !searchText.includes(
                            search.toLowerCase()
                        )
                    ) {
                        return;
                    }

                    if (!map.has(studentId)) {
                        map.set(
                            studentId,
                            {
                                studentId,
                                registerNumber:
                                    getRegisterNumber(
                                        row
                                    ),
                                studentName,
                                year,
                                section:
                                    getSection(row),
                                present: 0,
                                absent: 0,
                                late: 0,
                                total: 0,
                            }
                        );
                    }

                    const item =
                        map.get(studentId);

                    item.total += 1;

                    if (isPresent(row)) {
                        item.present += 1;
                    } else if (isLate(row)) {
                        item.late += 1;
                    } else if (isAbsent(row)) {
                        item.absent += 1;
                    }
                }
            );

            return [...map.values()]
                .map((student) => {
                    const attended =
                        student.present +
                        student.late;

                    const percentage =
                        student.total > 0
                            ? (
                                (attended /
                                    student.total) *
                                100
                            ).toFixed(2)
                            : "0.00";

                    return {
                        ...student,
                        percentage,
                    };
                })
                .sort((a, b) =>
                    String(
                        a.studentName
                    ).localeCompare(
                        String(
                            b.studentName
                        )
                    )
                );
        }, [
            departmentAttendance,
            yearFilter,
            studentFilter,
            search,
        ]);

    // =================================================
    // Statistics
    // =================================================

    const stats = useMemo(() => {
        const totalStudents =
            studentRows.length;

        const present =
            studentRows.reduce(
                (sum, student) =>
                    sum + student.present,
                0
            );

        const absent =
            studentRows.reduce(
                (sum, student) =>
                    sum + student.absent,
                0
            );

        const late =
            studentRows.reduce(
                (sum, student) =>
                    sum + student.late,
                0
            );

        const total =
            studentRows.reduce(
                (sum, student) =>
                    sum + student.total,
                0
            );

        const percentage =
            total > 0
                ? (
                    ((present + late) /
                        total) *
                    100
                ).toFixed(2)
                : "0.00";

        return {
            totalStudents,
            present,
            absent,
            late,
            total,
            percentage,
        };
    }, [
        studentRows,
    ]);

    // =================================================
    // Excel Export
    // =================================================

    const exportExcel = () => {
        const rows =
            studentRows.map(
                (student, index) => ({
                    "#": index + 1,
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
            "Student Attendance"
        );

        XLSX.writeFile(
            workbook,
            `HOD_Student_Attendance_${departmentName.replace(
                /\s+/g,
                "_"
            )}.xlsx`
        );
    };

    // =================================================
    // PDF Export
    // =================================================

    const exportPDF = () => {
        const doc =
            new jsPDF({
                orientation: "landscape",
            });

        doc.setFontSize(16);

        doc.text(
            "HOD Student Attendance Report",
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
            ]],

            body:
                studentRows.map(
                    (student, index) => [
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
                    ]
                ),
        });

        doc.save(
            `HOD_Student_Attendance_${departmentName.replace(
                /\s+/g,
                "_"
            )}.pdf`
        );
    };

    // =================================================
    // Word Export
    // =================================================

    const exportWord = async () => {
        const headerRow =
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

        const dataRows =
            studentRows.map(
                (student) =>
                    new TableRow({
                        children: [
                            student.registerNumber,
                            student.studentName,
                            student.year,
                            student.section,
                            String(student.present),
                            String(student.absent),
                            String(student.late),
                            String(student.total),
                            `${student.percentage}%`,
                        ].map(
                            (text) =>
                                new TableCell({
                                    children: [
                                        new Paragraph(
                                            String(text)
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
                                            "HOD Student Attendance Report",
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
                                    headerRow,
                                    ...dataRows,
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
            `HOD_Student_Attendance_${departmentName.replace(
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
                        Loading student attendance...
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
                        className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                        <FaArrowLeft />
                    </button>

                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                            Student Attendance
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
                        onClick={fetchAttendance}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-slate-700 hover:bg-slate-100"
                    >
                        <FaSyncAlt />
                        Refresh
                    </button>

                    <button
                        onClick={exportExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
                    >
                        <FaFileExcel />
                        Excel
                    </button>

                    <button
                        onClick={exportPDF}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700"
                    >
                        <FaFilePdf />
                        PDF
                    </button>

                    <button
                        onClick={exportWord}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <FaFileWord />
                        Word
                    </button>

                </div>
            </div>

            {/* Error */}

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            {/* Stats */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Students
                            </p>
                            <h2 className="text-2xl font-bold text-slate-800 mt-1">
                                {stats.totalStudents}
                            </h2>
                        </div>

                        <FaUserGraduate className="text-2xl text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Present
                            </p>
                            <h2 className="text-2xl font-bold text-green-600 mt-1">
                                {stats.present}
                            </h2>
                        </div>

                        <FaCheckCircle className="text-2xl text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Absent
                            </p>
                            <h2 className="text-2xl font-bold text-red-600 mt-1">
                                {stats.absent}
                            </h2>
                        </div>

                        <FaTimesCircle className="text-2xl text-red-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Late
                            </p>
                            <h2 className="text-2xl font-bold text-orange-600 mt-1">
                                {stats.late}
                            </h2>
                        </div>

                        <FaClock className="text-2xl text-orange-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Attendance
                            </p>
                            <h2 className="text-2xl font-bold text-purple-600 mt-1">
                                {stats.percentage}%
                            </h2>
                        </div>
                    </div>
                </div>

            </div>

            {/* Filters */}

            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">

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
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={yearFilter}
                        onChange={(e) =>
                            setYearFilter(
                                e.target.value
                            )
                        }
                        className="px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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
                        value={studentFilter}
                        onChange={(e) =>
                            setStudentFilter(
                                e.target.value
                            )
                        }
                        className="px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">
                            All Students
                        </option>

                        {students.map(
                            (student) => (
                                <option
                                    key={student.id}
                                    value={student.id}
                                >
                                    {student.registerNumber} -{" "}
                                    {student.name}
                                </option>
                            )
                        )}
                    </select>

                </div>
            </div>

            {/* Table */}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

                <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="font-semibold text-slate-800">
                        Student Attendance Summary
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
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {studentRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        No student attendance records found.
                                    </td>
                                </tr>
                            ) : (
                                studentRows.map(
                                    (
                                        student,
                                        index
                                    ) => (
                                        <tr
                                            key={
                                                student.studentId
                                            }
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-3">
                                                {index + 1}
                                            </td>

                                            <td className="px-4 py-3 font-medium text-slate-700">
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
                                                {student.year}
                                            </td>

                                            <td className="px-4 py-3">
                                                {student.section}
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

                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        Number(
                                                            student.percentage
                                                        ) >=
                                                        75
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {
                                                        student.percentage
                                                    }
                                                    %
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}

                        </tbody>

                    </table>

                </div>
            </div>

        </div>
    );
};

export default HodStudentAttendance;