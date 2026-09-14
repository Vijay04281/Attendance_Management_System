// =====================================================
// REPORT SERVICE
// Attendance Management System
// =====================================================

const API_URL = "http://localhost:5000/api";


// =====================================================
// AUTH TOKEN
// =====================================================

const getToken = () => {
    return localStorage.getItem("token");
};


// =====================================================
// COMMON HEADERS
// =====================================================

const headers = () => ({
    Authorization: `Bearer ${getToken()}`
});


// =====================================================
// COMMON JSON REQUEST
// =====================================================

const getJson = async (url) => {
    const res = await fetch(url, {
        method: "GET",
        headers: headers()
    });

    let data = {};

    try {
        data = await res.json();
    } catch {
        data = {};
    }

    if (!res.ok) {
        throw new Error(
            data?.message ||
            "Failed to load report"
        );
    }

    return data;
};


// =====================================================
// COMMON FILE DOWNLOAD
// =====================================================

const downloadFile = async (
    url,
    defaultFileName
) => {
    const res = await fetch(url, {
        method: "GET",
        headers: headers()
    });

    if (!res.ok) {
        let message = "Failed to download report";

        try {
            const data = await res.json();

            message =
                data?.message ||
                message;
        } catch {
            // Response was not JSON
        }

        throw new Error(message);
    }

    const blob = await res.blob();

    const contentDisposition =
        res.headers.get(
            "Content-Disposition"
        );

    let fileName =
        defaultFileName;

    if (contentDisposition) {
        const match =
            contentDisposition.match(
                /filename="?([^"]+)"?/i
            );

        if (match && match[1]) {
            fileName = match[1];
        }
    }

    const blobUrl =
        window.URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = blobUrl;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(blobUrl);
};


// =====================================================
// DAILY REPORT
// =====================================================

export const getDailyReport = async () => {
    return await getJson(
        `${API_URL}/attendance/reports/daily`
    );
};


// =====================================================
// SUBJECT REPORT
// =====================================================

export const getSubjectReport = async () => {
    return await getJson(
        `${API_URL}/attendance/reports/subject`
    );
};


// =====================================================
// STUDENT REPORT
// =====================================================

export const getStudentReport = async () => {
    return await getJson(
        `${API_URL}/attendance/reports/student`
    );
};


// =====================================================
// DEPARTMENT REPORT
// =====================================================

export const getDepartmentReport = async () => {
    return await getJson(
        `${API_URL}/attendance/reports/department`
    );
};


// =====================================================
// CLASS REPORT
// =====================================================

export const getClassReport = async () => {
    return await getJson(
        `${API_URL}/attendance/reports/class`
    );
};


// =====================================================
// ATTENDANCE PERCENTAGE
// =====================================================

export const getPercentageReport = async () => {
    return await getJson(
        `${API_URL}/attendance/percentage`
    );
};


// =====================================================
// DAILY REPORT DOWNLOADS
// =====================================================

export const downloadDailyReportExcel = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/daily/excel`,
        "daily-attendance-report.xlsx"
    );
};


export const downloadDailyReportPDF = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/daily/pdf`,
        "daily-attendance-report.pdf"
    );
};


export const downloadDailyReportWord = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/daily/word`,
        "daily-attendance-report.docx"
    );
};


// =====================================================
// SUBJECT REPORT DOWNLOADS
// =====================================================

export const downloadSubjectReportExcel = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/subject/excel`,
        "subject-attendance-report.xlsx"
    );
};


export const downloadSubjectReportPDF = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/subject/pdf`,
        "subject-attendance-report.pdf"
    );
};


export const downloadSubjectReportWord = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/subject/word`,
        "subject-attendance-report.docx"
    );
};


// =====================================================
// CLASS REPORT DOWNLOADS
// =====================================================

export const downloadClassReportExcel = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/class/excel`,
        "class-attendance-report.xlsx"
    );
};


export const downloadClassReportPDF = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/class/pdf`,
        "class-attendance-report.pdf"
    );
};


export const downloadClassReportWord = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/class/word`,
        "class-attendance-report.docx"
    );
};


// =====================================================
// STUDENT REPORT DOWNLOADS
// =====================================================

export const downloadStudentReportExcel = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/student/excel`,
        "student-attendance-report.xlsx"
    );
};


export const downloadStudentReportPDF = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/student/pdf`,
        "student-attendance-report.pdf"
    );
};


export const downloadStudentReportWord = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/student/word`,
        "student-attendance-report.docx"
    );
};


// =====================================================
// DEPARTMENT REPORT DOWNLOADS
// =====================================================

export const downloadDepartmentReportExcel = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/department/excel`,
        "department-attendance-report.xlsx"
    );
};


export const downloadDepartmentReportPDF = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/department/pdf`,
        "department-attendance-report.pdf"
    );
};


export const downloadDepartmentReportWord = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/department/word`,
        "department-attendance-report.docx"
    );
};


// =====================================================
// ATTENDANCE PERCENTAGE DOWNLOADS
// =====================================================

export const downloadPercentageReportExcel = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/percentage/excel`,
        "attendance-percentage-report.xlsx"
    );
};


export const downloadPercentageReportPDF = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/percentage/pdf`,
        "attendance-percentage-report.pdf"
    );
};


export const downloadPercentageReportWord = async () => {
    return await downloadFile(
        `${API_URL}/attendance/reports/export/percentage/word`,
        "attendance-percentage-report.docx"
    );
};