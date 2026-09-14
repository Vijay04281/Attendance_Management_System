import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useParams,
} from "react-router-dom";

import {
    FaArrowLeft,
    FaClipboardCheck,
    FaSearch,
    FaSyncAlt,
    FaFileExcel,
    FaFilePdf,
    FaFileWord,
    FaDownload,
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

const HodDepartmentAttendance = () => {
    const { department } = useParams();

    const [attendance, setAttendance] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [yearFilter, setYearFilter] =
        useState("ALL");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [downloading, setDownloading] =
        useState("");

    const user = useMemo(() => {
        try {
            return JSON.parse(
                localStorage.getItem("user") || "{}"
            );
        } catch {
            return {};
        }
    }, []);

    // =====================================================
    // DEPARTMENT NAME
    // =====================================================

    const departmentName =
        user?.department ||
        user?.department_name ||
        user?.departmentName ||
        (department === "computer-science"
            ? "Computer Science"
            : department ===
              "information-technology"
            ? "Information Technology"
            : department === "electronics"
            ? "Electronics"
            : department ===
              "electronics-and-communication"
            ? "Electronics & Communication"
            : department === "mechanical"
            ? "Mechanical Engineering"
            : department === "civil"
            ? "Civil Engineering"
            : department ===
              "artificial-intelligence"
            ? "Artificial Intelligence"
            : department || "Department");

    // =====================================================
    // API
    // =====================================================

    const fetchAttendance = async () => {
        setLoading(true);
        setError("");

        try {
            const token =
                localStorage.getItem("token") ||
                localStorage.getItem(
                    "accessToken"
                );

            const response = await fetch(
                "http://localhost:5000/api/attendance",
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to fetch attendance"
                );
            }

            const list =
                Array.isArray(data)
                    ? data
                    : Array.isArray(
                          data?.attendance
                      )
                    ? data.attendance
                    : Array.isArray(
                          data?.data
                      )
                    ? data.data
                    : [];

            setAttendance(list);
        } catch (err) {
            console.error(
                "Department attendance error:",
                err
            );

            setError(
                err.message ||
                    "Unable to load attendance"
            );

            setAttendance([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    // =====================================================
    // DEPARTMENT MATCHING
    // =====================================================

    const matchesDepartment = (item) => {
        const value =
            item?.department ||
            item?.department_name ||
            item?.departmentName ||
            item?.student_department ||
            item?.student_department_name ||
            item?.class_department ||
            item?.class_department_name ||
            item?.class?.department ||
            item?.class?.department_name;

        /*
         * If the current attendance API does not return
         * department information, keep the record.
         *
         * This preserves compatibility with the existing
         * /api/attendance response.
         */
        if (!value) {
            return true;
        }

        const itemDept =
            String(value)
                .toLowerCase()
                .trim();

        const currentDept =
            String(departmentName)
                .toLowerCase()
                .trim();

        if (
            itemDept === currentDept
        ) {
            return true;
        }

        // Computer Science / CSE
        if (
            currentDept.includes(
                "computer"
            ) &&
            (
                itemDept.includes(
                    "computer"
                ) ||
                itemDept === "cse"
            )
        ) {
            return true;
        }

        // Information Technology / IT
        if (
            currentDept.includes(
                "information"
            ) &&
            (
                itemDept.includes(
                    "information"
                ) ||
                itemDept === "it"
            )
        ) {
            return true;
        }

        // Electronics / ECE
        if (
            currentDept.includes(
                "electronic"
            ) &&
            (
                itemDept.includes(
                    "electronic"
                ) ||
                itemDept === "ece"
            )
        ) {
            return true;
        }

        // Mechanical
        if (
            currentDept.includes(
                "mechanical"
            ) &&
            itemDept.includes(
                "mechanical"
            )
        ) {
            return true;
        }

        // Civil
        if (
            currentDept.includes("civil") &&
            itemDept.includes("civil")
        ) {
            return true;
        }

        // Artificial Intelligence / AI
        if (
            currentDept.includes(
                "artificial"
            ) &&
            (
                itemDept.includes(
                    "artificial"
                ) ||
                itemDept === "ai"
            )
        ) {
            return true;
        }

        return false;
    };

    // =====================================================
    // YEAR VALUE
    // =====================================================

    const getYear = (item) => {
        const year =
            item?.year ??
            item?.student_year ??
            item?.class_year ??
            item?.year_number ??
            item?.class?.year ??
            item?.student?.year;

        if (
            year === undefined ||
            year === null ||
            year === ""
        ) {
            return "";
        }

        return String(year);
    };

    // =====================================================
    // DEPARTMENT ATTENDANCE
    // =====================================================

    const departmentAttendance =
        useMemo(() => {
            return attendance.filter(
                (item) =>
                    matchesDepartment(item)
            );
        }, [
            attendance,
            departmentName,
        ]);

    // =====================================================
    // YEAR FILTER
    // =====================================================

    const yearFilteredAttendance =
        useMemo(() => {
            if (yearFilter === "ALL") {
                return departmentAttendance;
            }

            return departmentAttendance.filter(
                (item) =>
                    getYear(item) ===
                    yearFilter
            );
        }, [
            departmentAttendance,
            yearFilter,
        ]);

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredAttendance =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {
                return yearFilteredAttendance;
            }

            return yearFilteredAttendance.filter(
                (item) => {
                    const registerNumber =
                        String(
                            item?.register_number ||
                                item?.student_register_number ||
                                item?.student?.register_number ||
                                ""
                        ).toLowerCase();

                    const studentName =
                        String(
                            item?.student_name ||
                                item?.name ||
                                item?.student?.name ||
                                ""
                        ).toLowerCase();

                    const subject =
                        String(
                            item?.subject_name ||
                                item?.subject_code ||
                                item?.subject?.subject_name ||
                                ""
                        ).toLowerCase();

                    const staff =
                        String(
                            item?.staff_name ||
                                item?.staff?.name ||
                                ""
                        ).toLowerCase();

                    const year =
                        getYear(item).toLowerCase();

                    const status =
                        String(
                            item?.status || ""
                        ).toLowerCase();

                    return (
                        registerNumber.includes(
                            query
                        ) ||
                        studentName.includes(
                            query
                        ) ||
                        subject.includes(
                            query
                        ) ||
                        staff.includes(
                            query
                        ) ||
                        year.includes(
                            query
                        ) ||
                        status.includes(
                            query
                        )
                    );
                }
            );
        }, [
            yearFilteredAttendance,
            search,
        ]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const total =
        yearFilteredAttendance.length;

    const present =
        yearFilteredAttendance.filter(
            (item) =>
                String(
                    item?.status || ""
                ).toUpperCase() ===
                "PRESENT"
        ).length;

    const absent =
        yearFilteredAttendance.filter(
            (item) =>
                String(
                    item?.status || ""
                ).toUpperCase() ===
                "ABSENT"
        ).length;

    const late =
        yearFilteredAttendance.filter(
            (item) =>
                String(
                    item?.status || ""
                ).toUpperCase() ===
                "LATE"
        ).length;

    const percentage =
        total > 0
            ? (
                  ((present + late) /
                      total) *
                  100
              ).toFixed(1)
            : "0.0";

    // =====================================================
    // DISPLAY HELPERS
    // =====================================================

    const getStudentName = (item) =>
        item?.student_name ||
        item?.name ||
        item?.student?.name ||
        "-";

    const getRegisterNumber = (item) =>
        item?.register_number ||
        item?.student_register_number ||
        item?.student?.register_number ||
        "-";

    const getSubject = (item) =>
        item?.subject_name ||
        item?.subject_code ||
        item?.subject?.subject_name ||
        "-";

    const getStaff = (item) =>
        item?.staff_name ||
        item?.staff?.name ||
        "-";

    const getDate = (item) => {
        const value =
            item?.scanned_at ||
            item?.session_date ||
            item?.date;

        if (!value) {
            return "-";
        }

        const parsed =
            new Date(value);

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return String(value);
        }

        return parsed.toLocaleDateString();
    };

    const getSection = (item) =>
        item?.section ||
        item?.student_section ||
        item?.class_section ||
        item?.class?.section ||
        "-";

    // =====================================================
    // EXCEL DOWNLOAD
    // =====================================================

    const downloadExcel = () => {
        if (
            filteredAttendance.length ===
            0
        ) {
            alert(
                "There are no attendance records to download."
            );
            return;
        }

        try {
            setDownloading("excel");

            const rows =
                filteredAttendance.map(
                    (item, index) => ({
                        "#": index + 1,

                        "Register Number":
                            getRegisterNumber(
                                item
                            ),

                        "Student":
                            getStudentName(
                                item
                            ),

                        "Year":
                            getYear(item) ||
                            "-",

                        "Section":
                            getSection(item),

                        "Subject":
                            getSubject(item),

                        "Staff":
                            getStaff(item),

                        "Date":
                            getDate(item),

                        "Status":
                            String(
                                item?.status ||
                                    "UNKNOWN"
                            ).toUpperCase(),
                    })
                );

            const worksheet =
                XLSX.utils.json_to_sheet(
                    rows
                );

            worksheet["!cols"] = [
                { wch: 6 },
                { wch: 20 },
                { wch: 25 },
                { wch: 10 },
                { wch: 12 },
                { wch: 25 },
                { wch: 25 },
                { wch: 15 },
                { wch: 15 },
            ];

            const summaryRows = [
                [],
                [
                    "HOD ATTENDANCE REPORT",
                ],
                [
                    "Department",
                    departmentName,
                ],
                [
                    "Year",
                    yearFilter === "ALL"
                        ? "All Years"
                        : `Year ${yearFilter}`,
                ],
                [],
                [
                    "Total Records",
                    total,
                ],
                [
                    "Present",
                    present,
                ],
                [
                    "Absent",
                    absent,
                ],
                [
                    "Late",
                    late,
                ],
                [
                    "Attendance %",
                    `${percentage}%`,
                ],
                [],
            ];

            XLSX.utils.sheet_add_aoa(
                worksheet,
                summaryRows,
                {
                    origin: -1,
                }
            );

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Attendance"
            );

            const excelBuffer =
                XLSX.write(workbook, {
                    bookType: "xlsx",
                    type: "array",
                });

            const blob = new Blob(
                [excelBuffer],
                {
                    type:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                }
            );

            saveAs(
                blob,
                `HOD_${departmentName.replace(
                    /\s+/g,
                    "_"
                )}_Attendance_Report.xlsx`
            );
        } catch (err) {
            console.error(
                "Excel download error:",
                err
            );

            alert(
                "Failed to download Excel report."
            );
        } finally {
            setDownloading("");
        }
    };

    // =====================================================
    // PDF DOWNLOAD
    // =====================================================

    const downloadPDF = () => {
        if (
            filteredAttendance.length ===
            0
        ) {
            alert(
                "There are no attendance records to download."
            );
            return;
        }

        try {
            setDownloading("pdf");

            const doc =
                new jsPDF({
                    orientation:
                        "landscape",
                    unit: "mm",
                    format: "a4",
                });

            doc.setFontSize(18);

            doc.text(
                "HOD Attendance Report",
                14,
                15
            );

            doc.setFontSize(10);

            doc.text(
                `Department: ${departmentName}`,
                14,
                23
            );

            doc.text(
                `Year: ${
                    yearFilter === "ALL"
                        ? "All Years"
                        : `Year ${yearFilter}`
                }`,
                14,
                29
            );

            doc.text(
                `Total Records: ${total}`,
                14,
                35
            );

            doc.text(
                `Present: ${present}   Absent: ${absent}   Late: ${late}   Attendance: ${percentage}%`,
                14,
                41
            );

            const tableRows =
                filteredAttendance.map(
                    (item, index) => [
                        index + 1,
                        getRegisterNumber(
                            item
                        ),
                        getStudentName(
                            item
                        ),
                        getYear(item) ||
                            "-",
                        getSection(item),
                        getSubject(item),
                        getStaff(item),
                        getDate(item),
                        String(
                            item?.status ||
                                "UNKNOWN"
                        ).toUpperCase(),
                    ]
                );

            autoTable(doc, {
                startY: 47,

                head: [
                    [
                        "#",
                        "Register No",
                        "Student",
                        "Year",
                        "Section",
                        "Subject",
                        "Staff",
                        "Date",
                        "Status",
                    ],
                ],

                body: tableRows,

                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                },

                headStyles: {
                    fontSize: 7,
                },

                margin: {
                    left: 8,
                    right: 8,
                },

                didDrawPage: (
                    data
                ) => {
                    doc.setFontSize(
                        8
                    );

                    doc.text(
                        `Page ${doc.internal.getNumberOfPages()}`,
                        data.settings
                            .margin.left,
                        doc.internal
                            .pageSize
                            .height -
                            5
                    );
                },
            });

            doc.save(
                `HOD_${departmentName.replace(
                    /\s+/g,
                    "_"
                )}_Attendance_Report.pdf`
            );
        } catch (err) {
            console.error(
                "PDF download error:",
                err
            );

            alert(
                "Failed to download PDF report."
            );
        } finally {
            setDownloading("");
        }
    };

    // =====================================================
    // WORD DOWNLOAD
    // =====================================================

    const downloadWord = async () => {
        if (
            filteredAttendance.length ===
            0
        ) {
            alert(
                "There are no attendance records to download."
            );
            return;
        }

        try {
            setDownloading("word");

            const headerCells = [
                "#",
                "Register No",
                "Student",
                "Year",
                "Section",
                "Subject",
                "Staff",
                "Date",
                "Status",
            ].map(
                (header) =>
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun(
                                        {
                                            text:
                                                header,
                                            bold: true,
                                        }
                                    ),
                                ],
                            }),
                        ],
                    })
            );

            const dataRows =
                filteredAttendance.map(
                    (item, index) =>
                        new TableRow({
                            children: [
                                String(
                                    index +
                                        1
                                ),
                                getRegisterNumber(
                                    item
                                ),
                                getStudentName(
                                    item
                                ),
                                getYear(
                                    item
                                ) || "-",
                                getSection(
                                    item
                                ),
                                getSubject(
                                    item
                                ),
                                getStaff(
                                    item
                                ),
                                getDate(
                                    item
                                ),
                                String(
                                    item?.status ||
                                        "UNKNOWN"
                                ).toUpperCase(),
                            ].map(
                                (value) =>
                                    new TableCell(
                                        {
                                            children:
                                                [
                                                    new Paragraph(
                                                        {
                                                            children:
                                                                [
                                                                    new TextRun(
                                                                        {
                                                                            text: String(
                                                                                value
                                                                            ),
                                                                        }
                                                                    ),
                                                                ],
                                                        }
                                                    ),
                                                ],
                                        }
                                    )
                            ),
                        })
                );

            const table =
                new Table({
                    width: {
                        size: 100,
                        type: WidthType.PERCENTAGE,
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
                                        "HOD Attendance Report",
                                    heading:
                                        HeadingLevel.TITLE,
                                }),

                                new Paragraph({
                                    children: [
                                        new TextRun(
                                            {
                                                text:
                                                    `Department: ${departmentName}`,
                                                bold: true,
                                            }
                                        ),
                                    ],
                                }),

                                new Paragraph({
                                    text:
                                        `Year: ${
                                            yearFilter ===
                                            "ALL"
                                                ? "All Years"
                                                : `Year ${yearFilter}`
                                        }`,
                                }),

                                new Paragraph({
                                    text:
                                        `Total Records: ${total}`,
                                }),

                                new Paragraph({
                                    text:
                                        `Present: ${present} | Absent: ${absent} | Late: ${late} | Attendance: ${percentage}%`,
                                }),

                                new Paragraph({
                                    text: "",
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
                `HOD_${departmentName.replace(
                    /\s+/g,
                    "_"
                )}_Attendance_Report.docx`
            );
        } catch (err) {
            console.error(
                "Word download error:",
                err
            );

            alert(
                "Failed to download Word report."
            );
        } finally {
            setDownloading("");
        }
    };

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 rounded-2xl bg-indigo-700 p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between">

                <div>

                    <Link
                        to={`/hod/${department}`}
                        className="mb-3 inline-flex items-center gap-2 text-sm text-indigo-100 hover:text-white"
                    >
                        <FaArrowLeft />

                        Back to HOD Dashboard
                    </Link>

                    <div className="flex items-center gap-4">

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">

                            <FaClipboardCheck className="text-2xl" />

                        </div>

                        <div>

                            <p className="text-sm text-indigo-100">
                                {departmentName}
                            </p>

                            <h1 className="text-2xl font-bold md:text-3xl">
                                Department Attendance
                            </h1>

                            <p className="mt-1 text-sm text-indigo-100">
                                Monitor attendance across the entire department
                            </p>

                        </div>

                    </div>

                </div>

                <button
                    type="button"
                    onClick={fetchAttendance}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20 disabled:opacity-60"
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
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                    <strong>
                        Attendance API:
                    </strong>{" "}

                    {error}

                </div>
            )}

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-2xl border bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Total Records
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {total}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Department attendance records
                    </p>

                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Present
                    </p>

                    <p className="mt-2 text-3xl font-bold text-emerald-600">
                        {present}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Students marked present
                    </p>

                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Absent
                    </p>

                    <p className="mt-2 text-3xl font-bold text-red-600">
                        {absent}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Students marked absent
                    </p>

                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Attendance %
                    </p>

                    <p className="mt-2 text-3xl font-bold text-indigo-600">
                        {percentage}%
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Present + Late / total
                    </p>

                </div>

            </div>

            {/* =================================================
                ADDITIONAL SUMMARY
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <div className="rounded-2xl border bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Present Records
                    </p>

                    <p className="mt-2 text-2xl font-bold text-emerald-600">
                        {present}
                    </p>

                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Absent Records
                    </p>

                    <p className="mt-2 text-2xl font-bold text-red-600">
                        {absent}
                    </p>

                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Late Records
                    </p>

                    <p className="mt-2 text-2xl font-bold text-amber-600">
                        {late}
                    </p>

                </div>

            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="rounded-2xl border bg-white p-5 shadow-sm">

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Search Attendance
                        </label>

                        <div className="relative">

                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search student, register number, subject or staff..."
                                className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                        </div>

                    </div>

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Year
                        </label>

                        <select
                            value={yearFilter}
                            onChange={(e) =>
                                setYearFilter(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >

                            <option value="ALL">
                                All Years
                            </option>

                            <option value="1">
                                Year 1
                            </option>

                            <option value="2">
                                Year 2
                            </option>

                            <option value="3">
                                Year 3
                            </option>

                            <option value="4">
                                Year 4
                            </option>

                        </select>

                    </div>

                </div>

            </div>

            {/* =================================================
                DOWNLOAD REPORT
            ================================================= */}

            <div className="rounded-2xl border bg-white p-5 shadow-sm">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

                                <FaDownload />

                            </div>

                            <div>

                                <h2 className="font-bold text-slate-900">
                                    Download Attendance Report
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Download the currently filtered attendance records
                                </p>

                            </div>

                        </div>

                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">

                        <button
                            type="button"
                            onClick={
                                downloadExcel
                            }
                            disabled={
                                downloading !==
                                    "" ||
                                filteredAttendance.length ===
                                    0
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            <FaFileExcel />

                            {downloading ===
                            "excel"
                                ? "Preparing..."
                                : "Download Excel"}

                        </button>

                        <button
                            type="button"
                            onClick={
                                downloadPDF
                            }
                            disabled={
                                downloading !==
                                    "" ||
                                filteredAttendance.length ===
                                    0
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            <FaFilePdf />

                            {downloading ===
                            "pdf"
                                ? "Preparing..."
                                : "Download PDF"}

                        </button>

                        <button
                            type="button"
                            onClick={
                                downloadWord
                            }
                            disabled={
                                downloading !==
                                    "" ||
                                filteredAttendance.length ===
                                    0
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            <FaFileWord />

                            {downloading ===
                            "word"
                                ? "Preparing..."
                                : "Download Word"}

                        </button>

                    </div>

                </div>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

                <div className="border-b px-6 py-4">

                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                        <div>

                            <h2 className="font-bold text-slate-900">
                                Department Attendance Records
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {departmentName}
                            </p>

                        </div>

                        <div className="text-sm text-slate-500">

                            Showing{" "}

                            <span className="font-bold text-slate-900">
                                {
                                    filteredAttendance.length
                                }
                            </span>{" "}

                            records

                        </div>

                    </div>

                </div>

                {loading ? (

                    <div className="flex justify-center py-16">

                        <FaSyncAlt className="animate-spin text-2xl text-indigo-600" />

                    </div>

                ) : filteredAttendance.length ===
                  0 ? (

                    <div className="px-6 py-16 text-center">

                        <FaClipboardCheck className="mx-auto text-4xl text-slate-300" />

                        <p className="mt-4 font-semibold text-slate-700">
                            No attendance records found
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            No attendance data is available for the selected filters.
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-300">

                            <thead className="bg-slate-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                                        #
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                                        Register Number
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                                        Student
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                                        Year
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                                        Section
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                                        Subject
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                                        Staff
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                                        Date
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">
                                        Status
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y">

                                {filteredAttendance.map(
                                    (
                                        item,
                                        index
                                    ) => {

                                        const status =
                                            String(
                                                item?.status ||
                                                    ""
                                            ).toUpperCase();

                                        return (
                                            <tr
                                                key={
                                                    item?.attendance_id ||
                                                    item?.id ||
                                                    `${getRegisterNumber(
                                                        item
                                                    )}-${index}`
                                                }
                                                className="hover:bg-slate-50"
                                            >

                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {index +
                                                        1}
                                                </td>

                                                <td className="px-6 py-4 font-semibold text-indigo-600">
                                                    {getRegisterNumber(
                                                        item
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 font-semibold text-slate-900">
                                                    {getStudentName(
                                                        item
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {getYear(
                                                        item
                                                    ) ||
                                                        "-"}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {getSection(
                                                        item
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {getSubject(
                                                        item
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {getStaff(
                                                        item
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {getDate(
                                                        item
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">

                                                    <span
                                                        className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-bold ${
                                                            status ===
                                                            "PRESENT"
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : status ===
                                                                    "ABSENT"
                                                                ? "bg-red-50 text-red-700"
                                                                : status ===
                                                                    "LATE"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {status ||
                                                            "UNKNOWN"}
                                                    </span>

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
};

export default HodDepartmentAttendance;