import { useEffect, useState } from "react";

import {
    getDailyReport,
    getSubjectReport,
    getDepartmentReport,
    getPercentageReport,
    getClassReport
} from "../services/reportService";

import * as XLSX from "xlsx";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    HeadingLevel
} from "docx";

import { saveAs } from "file-saver";


// =====================================================
// COMPONENT
// =====================================================

function AttendanceReports() {

    // =====================================================
    // STATE
    // =====================================================

    const [daily, setDaily] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [percentage, setPercentage] = useState([]);
    const [classes, setClasses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [downloadLoading, setDownloadLoading] = useState("");


    // =====================================================
    // LOAD REPORTS
    // =====================================================

    useEffect(() => {
        loadReports();
    }, []);


    const loadReports = async () => {

        try {

            setLoading(true);
            setError("");

            const requests = [
                getDailyReport(),
                getSubjectReport(),
                getDepartmentReport(),
                getPercentageReport()
            ];

            // Class report is optional in case the service
            // has not been added yet.
            if (typeof getClassReport === "function") {
                requests.push(getClassReport());
            }

            const results = await Promise.all(requests);

            const [
                dailyRes,
                subjectRes,
                departmentRes,
                percentageRes,
                classRes
            ] = results;


            setDaily(
                dailyRes?.report ||
                dailyRes?.reports ||
                []
            );


            setSubjects(
                subjectRes?.report ||
                subjectRes?.reports ||
                []
            );


            setDepartments(
                departmentRes?.report ||
                departmentRes?.reports ||
                []
            );


            setPercentage(
                percentageRes?.report ||
                percentageRes?.reports ||
                []
            );


            setClasses(
                classRes?.report ||
                classRes?.reports ||
                []
            );

        } catch (err) {

            console.error(
                "Failed to load attendance reports:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to load attendance reports"
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = (value) => {

        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };


    // =====================================================
    // STATUS COLOR
    // =====================================================

    const getStatusClass = (status) => {

        const value =
            String(status || "").toLowerCase();

        if (value === "green") {
            return "bg-green-100 text-green-700";
        }

        if (value === "yellow") {
            return "bg-yellow-100 text-yellow-700";
        }

        return "bg-red-100 text-red-700";
    };


    // =====================================================
    // EXCEL DOWNLOAD
    // =====================================================

    const downloadExcel = (
        reportName,
        data,
        columns
    ) => {

        try {

            setDownloadLoading(
                `${reportName}-excel`
            );


            if (!data || data.length === 0) {

                alert(
                    `No ${reportName} data available to download.`
                );

                return;
            }


            const formattedData = data.map((row) => {

                const result = {};

                columns.forEach((column) => {

                    result[column.label] =
                        typeof column.value === "function"
                            ? column.value(row)
                            : row[column.value];

                });

                return result;

            });


            const worksheet =
                XLSX.utils.json_to_sheet(
                    formattedData
                );


            worksheet["!cols"] =
                columns.map(() => ({
                    wch: 22
                }));


            const workbook =
                XLSX.utils.book_new();


            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                reportName.substring(0, 31)
            );


            XLSX.writeFile(
                workbook,
                `${reportName}.xlsx`
            );

        } catch (error) {

            console.error(
                "Excel download error:",
                error
            );

            alert(
                "Failed to download Excel file."
            );

        } finally {

            setDownloadLoading("");

        }
    };


    // =====================================================
    // PDF DOWNLOAD
    // =====================================================

    const downloadPDF = (
        reportName,
        data,
        columns
    ) => {

        try {

            setDownloadLoading(
                `${reportName}-pdf`
            );


            if (!data || data.length === 0) {

                alert(
                    `No ${reportName} data available to download.`
                );

                return;
            }


            const doc =
                new jsPDF({
                    orientation: "landscape"
                });


            doc.setFontSize(18);

            doc.text(
                "Attendance Management System",
                14,
                15
            );


            doc.setFontSize(13);

            doc.text(
                reportName,
                14,
                23
            );


            doc.setFontSize(9);

            doc.text(
                `Generated: ${new Date().toLocaleString(
                    "en-IN"
                )}`,
                14,
                30
            );


            const headers =
                columns.map(
                    (column) => column.label
                );


            const rows =
                data.map((row) =>
                    columns.map((column) => {

                        const value =
                            typeof column.value === "function"
                                ? column.value(row)
                                : row[column.value];

                        return value ?? "-";

                    })
                );


            autoTable(doc, {

                head: [headers],

                body: rows,

                startY: 36,

                styles: {
                    fontSize: 8,
                    cellPadding: 3
                },

                headStyles: {
                    fontStyle: "bold"
                },

                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                }

            });


            doc.save(
                `${reportName}.pdf`
            );

        } catch (error) {

            console.error(
                "PDF download error:",
                error
            );

            alert(
                "Failed to download PDF file."
            );

        } finally {

            setDownloadLoading("");

        }
    };


    // =====================================================
    // WORD DOWNLOAD
    // =====================================================

    const downloadWord = async (
        reportName,
        data,
        columns
    ) => {

        try {

            setDownloadLoading(
                `${reportName}-word`
            );


            if (!data || data.length === 0) {

                alert(
                    `No ${reportName} data available to download.`
                );

                return;
            }


            const headerRow =
                new TableRow({

                    children:
                        columns.map(
                            (column) =>
                                new TableCell({

                                    children: [
                                        new Paragraph({
                                            text:
                                                column.label
                                        })
                                    ]

                                })
                        )

                });


            const dataRows =
                data.map((row) => {

                    return new TableRow({

                        children:
                            columns.map(
                                (column) => {

                                    const value =
                                        typeof column.value === "function"
                                            ? column.value(row)
                                            : row[column.value];

                                    return new TableCell({

                                        children: [
                                            new Paragraph({
                                                text:
                                                    String(
                                                        value ?? "-"
                                                    )
                                            })
                                        ]

                                    });

                                }
                            )

                    });

                });


            const table =
                new Table({

                    rows: [
                        headerRow,
                        ...dataRows
                    ]

                });


            const document =
                new Document({

                    sections: [

                        {

                            children: [

                                new Paragraph({

                                    text:
                                        "Attendance Management System",

                                    heading:
                                        HeadingLevel.TITLE

                                }),

                                new Paragraph({

                                    text:
                                        reportName,

                                    heading:
                                        HeadingLevel.HEADING_1

                                }),

                                new Paragraph({

                                    text:
                                        `Generated: ${new Date().toLocaleString(
                                            "en-IN"
                                        )}`

                                }),

                                new Paragraph({
                                    text: ""
                                }),

                                table

                            ]

                        }

                    ]

                });


            const blob =
                await Packer.toBlob(
                    document
                );


            saveAs(
                blob,
                `${reportName}.docx`
            );

        } catch (error) {

            console.error(
                "Word download error:",
                error
            );

            alert(
                "Failed to download Word file."
            );

        } finally {

            setDownloadLoading("");

        }
    };


    // =====================================================
    // DOWNLOAD BUTTONS
    // =====================================================

    const DownloadButtons = ({
        reportName,
        data,
        columns
    }) => {

        const excelKey =
            `${reportName}-excel`;

        const pdfKey =
            `${reportName}-pdf`;

        const wordKey =
            `${reportName}-word`;


        return (

            <div className="flex flex-wrap gap-2">

                {/* EXCEL */}

                <button
                    type="button"
                    onClick={() =>
                        downloadExcel(
                            reportName,
                            data,
                            columns
                        )
                    }
                    disabled={
                        downloadLoading === excelKey
                    }
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                    {downloadLoading === excelKey
                        ? "Downloading..."
                        : "📊 Excel"}

                </button>


                {/* PDF */}

                <button
                    type="button"
                    onClick={() =>
                        downloadPDF(
                            reportName,
                            data,
                            columns
                        )
                    }
                    disabled={
                        downloadLoading === pdfKey
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                    {downloadLoading === pdfKey
                        ? "Downloading..."
                        : "📄 PDF"}

                </button>


                {/* WORD */}

                <button
                    type="button"
                    onClick={() =>
                        downloadWord(
                            reportName,
                            data,
                            columns
                        )
                    }
                    disabled={
                        downloadLoading === wordKey
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                    {downloadLoading === wordKey
                        ? "Downloading..."
                        : "📝 Word"}

                </button>

            </div>

        );

    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="p-6">

                <h1 className="text-3xl font-bold text-gray-800">
                    Attendance Reports
                </h1>

                <p className="mt-2 text-gray-500">
                    Loading attendance reports...
                </p>

            </div>

        );

    }


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="space-y-8 p-6">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-gray-800">
                        Attendance Reports
                    </h1>

                    <p className="mt-1 text-gray-500">
                        View and download attendance reports.
                    </p>

                </div>


                <button
                    type="button"
                    onClick={loadReports}
                    className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                >
                    🔄 Refresh Reports
                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                    <p className="font-semibold text-red-700">
                        Unable to load reports
                    </p>

                    <p className="mt-1 text-sm text-red-600">
                        {error}
                    </p>

                    <button
                        onClick={loadReports}
                        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                        Try Again
                    </button>

                </div>

            )}


            {/* =================================================
                DAILY ATTENDANCE
            ================================================= */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                        <h2 className="text-xl font-bold text-gray-800">
                            Daily Attendance
                        </h2>

                        <p className="text-sm text-gray-500">
                            Attendance recorded for each class session.
                        </p>

                    </div>


                    <DownloadButtons

                        reportName="Daily-Attendance-Report"

                        data={daily}

                        columns={[
                            {
                                label: "Date",
                                value: (row) =>
                                    formatDate(
                                        row.date ||
                                        row.session_date
                                    )
                            },
                            {
                                label: "Subject Code",
                                value: "subject_code"
                            },
                            {
                                label: "Subject Name",
                                value: "subject_name"
                            },
                            {
                                label: "Staff",
                                value: "staff_name"
                            },
                            {
                                label: "Present",
                                value: "present_count"
                            },
                            {
                                label: "Late",
                                value: "late_count"
                            },
                            {
                                label: "Absent",
                                value: "absent_count"
                            }
                        ]}

                    />

                </div>


                <div className="overflow-x-auto">

                    <table className="w-full text-left">

                        <thead>

                            <tr className="border-b bg-gray-50">

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Date
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Subject
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Staff
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Present
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Late
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Absent
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {daily.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        No daily attendance records found.
                                    </td>

                                </tr>

                            ) : (

                                daily.map((row, index) => (

                                    <tr
                                        key={
                                            row.session_id ||
                                            `${row.date}-${row.subject_code}-${index}`
                                        }
                                        className="border-b hover:bg-gray-50"
                                    >

                                        <td className="px-4 py-3 text-sm">
                                            {formatDate(
                                                row.date ||
                                                row.session_date
                                            )}
                                        </td>

                                        <td className="px-4 py-3">

                                            <div className="font-semibold text-gray-800">
                                                {row.subject_code || "-"}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                {row.subject_name || "-"}
                                            </div>

                                        </td>

                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {row.staff_name || "-"}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-green-600">
                                            {row.present_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-yellow-600">
                                            {row.late_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-red-600">
                                            {row.absent_count ?? 0}
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                SUBJECT-WISE REPORT
            ================================================= */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                        <h2 className="text-xl font-bold text-gray-800">
                            Subject-Wise Attendance
                        </h2>

                        <p className="text-sm text-gray-500">
                            Attendance performance for each subject.
                        </p>

                    </div>


                    <DownloadButtons

                        reportName="Subject-Wise-Attendance-Report"

                        data={subjects}

                        columns={[
                            {
                                label: "Subject Code",
                                value: "subject_code"
                            },
                            {
                                label: "Subject Name",
                                value: "subject_name"
                            },
                            {
                                label: "Classes",
                                value: "total_classes"
                            },
                            {
                                label: "Present",
                                value: "present_count"
                            },
                            {
                                label: "Late",
                                value: "late_count"
                            },
                            {
                                label: "Absent",
                                value: "absent_count"
                            },
                            {
                                label: "Attendance %",
                                value: (row) =>
                                    `${row.attendance_percentage ?? 0}%`
                            }
                        ]}

                    />

                </div>


                <div className="overflow-x-auto">

                    <table className="w-full text-left">

                        <thead>

                            <tr className="border-b bg-gray-50">

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Subject
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Classes
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Present
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Late
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Absent
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    %
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {subjects.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        No subject attendance records found.
                                    </td>

                                </tr>

                            ) : (

                                subjects.map((row) => (

                                    <tr
                                        key={row.subject_id}
                                        className="border-b hover:bg-gray-50"
                                    >

                                        <td className="px-4 py-3">

                                            <div className="font-semibold text-gray-800">
                                                {row.subject_code || "-"}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                {row.subject_name || "-"}
                                            </div>

                                        </td>

                                        <td className="px-4 py-3">
                                            {row.total_classes ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-green-600">
                                            {row.present_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-yellow-600">
                                            {row.late_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-red-600">
                                            {row.absent_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-bold">
                                            {row.attendance_percentage ?? 0}%
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                DEPARTMENT-WISE REPORT
            ================================================= */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                        <h2 className="text-xl font-bold text-gray-800">
                            Department-Wise Attendance
                        </h2>

                        <p className="text-sm text-gray-500">
                            Attendance performance by department.
                        </p>

                    </div>


                    <DownloadButtons

                        reportName="Department-Wise-Attendance-Report"

                        data={departments}

                        columns={[
                            {
                                label: "Department",
                                value: "department"
                            },
                            {
                                label: "Students",
                                value: "total_students"
                            },
                            {
                                label: "Classes",
                                value: "total_classes"
                            },
                            {
                                label: "Present",
                                value: "present_count"
                            },
                            {
                                label: "Late",
                                value: "late_count"
                            },
                            {
                                label: "Absent",
                                value: "absent_count"
                            },
                            {
                                label: "Attendance %",
                                value: (row) =>
                                    `${row.attendance_percentage ?? 0}%`
                            }
                        ]}

                    />

                </div>


                <div className="overflow-x-auto">

                    <table className="w-full text-left">

                        <thead>

                            <tr className="border-b bg-gray-50">

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Department
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Students
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Classes
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Present
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Late
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Absent
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    %
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {departments.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        No department attendance records found.
                                    </td>

                                </tr>

                            ) : (

                                departments.map((row, index) => (

                                    <tr
                                        key={
                                            row.department ||
                                            index
                                        }
                                        className="border-b hover:bg-gray-50"
                                    >

                                        <td className="px-4 py-3 font-semibold text-gray-800">
                                            {row.department || "-"}
                                        </td>

                                        <td className="px-4 py-3">
                                            {row.total_students ?? 0}
                                        </td>

                                        <td className="px-4 py-3">
                                            {row.total_classes ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-green-600">
                                            {row.present_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-yellow-600">
                                            {row.late_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-red-600">
                                            {row.absent_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-bold">
                                            {row.attendance_percentage ?? 0}%
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                ATTENDANCE PERCENTAGE
            ================================================= */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                        <h2 className="text-xl font-bold text-gray-800">
                            Attendance Percentage
                        </h2>

                        <p className="text-sm text-gray-500">
                            Student attendance percentage and status.
                        </p>

                    </div>


                    <DownloadButtons

                        reportName="Attendance-Percentage-Report"

                        data={percentage}

                        columns={[
                            {
                                label: "Name",
                                value: (row) =>
                                    row.student_name ||
                                    row.name ||
                                    "-"
                            },
                            {
                                label: "Register Number",
                                value: "register_number"
                            },
                            {
                                label: "Total Classes",
                                value: "total_classes"
                            },
                            {
                                label: "Present",
                                value: "present_classes"
                            },
                            {
                                label: "Late",
                                value: "late_classes"
                            },
                            {
                                label: "Absent",
                                value: "absent_classes"
                            },
                            {
                                label: "Attendance %",
                                value: (row) =>
                                    `${row.attendance_percentage ?? 0}%`
                            },
                            {
                                label: "Status",
                                value: (row) =>
                                    row.percentage_color ||
                                    row.color ||
                                    "red"
                            }
                        ]}

                    />

                </div>


                <div className="overflow-x-auto">

                    <table className="w-full text-left">

                        <thead>

                            <tr className="border-b bg-gray-50">

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Name
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Register Number
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Present
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Late
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Absent
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    %
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Status
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {percentage.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        No percentage records found.
                                    </td>

                                </tr>

                            ) : (

                                percentage.map((student) => {

                                    const status =
                                        student.percentage_color ||
                                        student.color ||
                                        "red";


                                    return (

                                        <tr
                                            key={student.student_id}
                                            className="border-b hover:bg-gray-50"
                                        >

                                            <td className="px-4 py-3 font-semibold text-gray-800">
                                                {
                                                    student.student_name ||
                                                    student.name ||
                                                    "-"
                                                }
                                            </td>

                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {
                                                    student.register_number ||
                                                    "-"
                                                }
                                            </td>

                                            <td className="px-4 py-3 font-semibold text-green-600">
                                                {student.present_classes ?? 0}
                                            </td>

                                            <td className="px-4 py-3 font-semibold text-yellow-600">
                                                {student.late_classes ?? 0}
                                            </td>

                                            <td className="px-4 py-3 font-semibold text-red-600">
                                                {student.absent_classes ?? 0}
                                            </td>

                                            <td className="px-4 py-3 font-bold">
                                                {
                                                    student.attendance_percentage ??
                                                    0
                                                }%
                                            </td>

                                            <td className="px-4 py-3">

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusClass(
                                                        status
                                                    )}`}
                                                >
                                                    {status}
                                                </span>

                                            </td>

                                        </tr>

                                    );

                                })

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                CLASS-WISE REPORT
            ================================================= */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                        <h2 className="text-xl font-bold text-gray-800">
                            Class-Wise Attendance
                        </h2>

                        <p className="text-sm text-gray-500">
                            Attendance performance by department, year and section.
                        </p>

                    </div>


                    <DownloadButtons

                        reportName="Class-Wise-Attendance-Report"

                        data={classes}

                        columns={[
                            {
                                label: "Department",
                                value: "department"
                            },
                            {
                                label: "Year",
                                value: "year"
                            },
                            {
                                label: "Section",
                                value: "section"
                            },
                            {
                                label: "Students",
                                value: "total_students"
                            },
                            {
                                label: "Classes",
                                value: "total_classes"
                            },
                            {
                                label: "Present",
                                value: "present_count"
                            },
                            {
                                label: "Late",
                                value: "late_count"
                            },
                            {
                                label: "Absent",
                                value: "absent_count"
                            },
                            {
                                label: "Attendance %",
                                value: (row) =>
                                    `${row.attendance_percentage ?? 0}%`
                            }
                        ]}

                    />

                </div>


                <div className="overflow-x-auto">

                    <table className="w-full text-left">

                        <thead>

                            <tr className="border-b bg-gray-50">

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Department
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Year
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Section
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Students
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Classes
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Present
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Late
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    Absent
                                </th>

                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                                    %
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {classes.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="9"
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        No class attendance records found.
                                    </td>

                                </tr>

                            ) : (

                                classes.map((row, index) => (

                                    <tr
                                        key={
                                            `${row.department}-${row.year}-${row.section}-${index}`
                                        }
                                        className="border-b hover:bg-gray-50"
                                    >

                                        <td className="px-4 py-3 font-semibold text-gray-800">
                                            {row.department || "-"}
                                        </td>

                                        <td className="px-4 py-3">
                                            {row.year ?? "-"}
                                        </td>

                                        <td className="px-4 py-3">
                                            {row.section || "-"}
                                        </td>

                                        <td className="px-4 py-3">
                                            {row.total_students ?? 0}
                                        </td>

                                        <td className="px-4 py-3">
                                            {row.total_classes ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-green-600">
                                            {row.present_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-yellow-600">
                                            {row.late_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-red-600">
                                            {row.absent_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3 font-bold">
                                            {row.attendance_percentage ?? 0}%
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                INFORMATION
            ================================================= */}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

                <h2 className="text-lg font-bold text-blue-800">
                    Report Downloads
                </h2>

                <p className="mt-1 text-sm text-blue-700">
                    Each report can now be downloaded separately in
                    Excel, PDF or Word format.
                </p>

            </div>

        </div>

    );
}


// =====================================================
// EXPORT
// =====================================================

export default AttendanceReports;