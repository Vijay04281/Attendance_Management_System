import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaBook,
    FaCalendarAlt,
    FaClock,
    FaPlay,
    FaSyncAlt,
    FaUsers,
    FaExclamationTriangle
} from "react-icons/fa";

const API_URL = "/api";
const DAYS = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
];

const DAY_LABELS = {
    SUNDAY: "Sunday",
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
    SATURDAY: "Saturday"
};

const StaffClasses = () => {
    const [timetables, setTimetables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchTimetable = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Authentication token not found");
            }

            const response = await fetch(
                `${API_URL}/timetables/staff`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch timetable"
                );
            }

            setTimetables(data.timetables || []);
        } catch (err) {
            console.error("Fetch timetable error:", err);
            setError(err.message || "Failed to load classes");
            setTimetables([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTimetable();
    }, [fetchTimetable]);

    /*
     * Convert MySQL TIME value into minutes.
     *
     * Example:
     * 10:00:00 -> 600
     * 11:30:00 -> 690
     */
    const timeToMinutes = (time) => {
        if (!time) return 0;

        const parts = String(time).split(":");

        const hours = Number(parts[0]) || 0;
        const minutes = Number(parts[1]) || 0;

        return hours * 60 + minutes;
    };

    /*
     * Convert database time into readable format.
     *
     * 10:00:00 -> 10:00 AM
     * 14:30:00 -> 2:30 PM
     */
    const formatTime = (time) => {
        if (!time) return "--:--";

        const parts = String(time).split(":");

        let hours = Number(parts[0]) || 0;
        const minutes = Number(parts[1]) || 0;

        const period = hours >= 12 ? "PM" : "AM";

        hours = hours % 12;

        if (hours === 0) {
            hours = 12;
        }

        return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
    };

    /*
     * Get today's day.
     */
    const todayName = DAYS[new Date().getDay()];

    /*
     * Get current time in minutes.
     */
    const currentMinutes =
        new Date().getHours() * 60 + new Date().getMinutes();

    /*
     * Find the class happening right now.
     */
    const currentClass = useMemo(() => {
        return timetables.find((item) => {
            if (item.day_of_week !== todayName) {
                return false;
            }

            const start = timeToMinutes(item.start_time);
            const end = timeToMinutes(item.end_time);

            return currentMinutes >= start && currentMinutes < end;
        }) || null;
    }, [timetables, todayName, currentMinutes]);

    /*
     * Calculate all upcoming classes.
     *
     * We first show classes later today.
     * If there are no more classes today, we continue into the
     * next days of the timetable.
     */
    const upcomingClasses = useMemo(() => {
        if (!timetables.length) {
            return [];
        }

        const now = new Date();
        const todayIndex = now.getDay();

        const classesWithSort = timetables
            .map((item) => {
                const dayIndex = DAYS.indexOf(item.day_of_week);

                if (dayIndex === -1) {
                    return null;
                }

                let daysUntil = dayIndex - todayIndex;

                if (daysUntil < 0) {
                    daysUntil += 7;
                }

                const startMinutes = timeToMinutes(item.start_time);

                /*
                 * If this is today's class and it already ended,
                 * move it to next week's occurrence.
                 */
                if (
                    daysUntil === 0 &&
                    startMinutes <= currentMinutes
                ) {
                    daysUntil = 7;
                }

                return {
                    ...item,
                    daysUntil,
                    startMinutes
                };
            })
            .filter(Boolean)
            .filter((item) => {
                if (
                    currentClass &&
                    item.timetable_id === currentClass.timetable_id
                ) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (a.daysUntil !== b.daysUntil) {
                    return a.daysUntil - b.daysUntil;
                }

                return a.startMinutes - b.startMinutes;
            });

        return classesWithSort.slice(0, 6);
    }, [
        timetables,
        todayName,
        currentMinutes,
        currentClass
    ]);

    /*
     * Count unique scheduled classes.
     */
    const totalClasses = timetables.length;

    /*
     * Get today's scheduled classes.
     */
    const todayClasses = useMemo(() => {
        return timetables
            .filter(
                (item) => item.day_of_week === todayName
            )
            .sort(
                (a, b) =>
                    timeToMinutes(a.start_time) -
                    timeToMinutes(b.start_time)
            );
    }, [timetables, todayName]);

    /*
     * Calculate next class text.
     */
    const getDayText = (item) => {
        if (item.daysUntil === 0) {
            return "Today";
        }

        if (item.daysUntil === 1) {
            return "Tomorrow";
        }

        return DAY_LABELS[item.day_of_week];
    };

    /*
     * Get class status.
     */
    const getClassStatus = (item) => {
        if (item.daysUntil === 0) {
            return "TODAY";
        }

        if (item.daysUntil === 1) {
            return "TOMORROW";
        }

        return DAY_LABELS[item.day_of_week]?.toUpperCase();
    };

    return (
        <>
            <div className="space-y-6">

                {/* =========================
                    HEADER
                ========================== */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <FaCalendarAlt />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">
                                    Classes
                                </h1>

                                <p className="text-sm text-slate-500">
                                    Manage your scheduled classes and timetable
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => fetchTimetable(true)}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-60"
                    >
                        <FaSyncAlt
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>
                </div>

                {/* =========================
                    ERROR
                ========================== */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                        <div className="text-red-600 mt-1">
                            <FaExclamationTriangle />
                        </div>

                        <div>
                            <p className="font-semibold text-red-700">
                                Unable to load timetable
                            </p>

                            <p className="text-sm text-red-600 mt-1">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* =========================
                    STAT CARDS
                ========================== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    {/* Total Classes */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Scheduled Classes
                                </p>

                                <p className="text-3xl font-bold text-slate-800 mt-2">
                                    {loading ? "—" : totalClasses}
                                </p>
                            </div>

                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FaBook />
                            </div>
                        </div>
                    </div>

                    {/* Today's Classes */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Today's Classes
                                </p>

                                <p className="text-3xl font-bold text-slate-800 mt-2">
                                    {loading
                                        ? "—"
                                        : todayClasses.length}
                                </p>
                            </div>

                            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                <FaCalendarAlt />
                            </div>
                        </div>
                    </div>

                    {/* Current Class */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Active Right Now
                                </p>

                                <p className="text-lg font-bold text-slate-800 mt-2">
                                    {loading
                                        ? "Checking..."
                                        : currentClass
                                            ? "1 Active"
                                            : "None"}
                                </p>
                            </div>

                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    currentClass
                                        ? "bg-green-100 text-green-600"
                                        : "bg-slate-100 text-slate-400"
                                }`}
                            >
                                <FaPlay />
                            </div>
                        </div>
                    </div>
                </div>

                {/* =========================
                    CURRENT CLASS
                ========================== */}
                <section>

                    <div className="flex items-center gap-3 mb-4">

                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <FaPlay />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Current Class
                            </h2>

                            <p className="text-sm text-slate-500">
                                Your active class right now
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>

                            <p className="text-slate-500 mt-4">
                                Checking current class...
                            </p>
                        </div>
                    ) : currentClass ? (

                        <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">

                            <div className="p-6">

                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                                    <div className="flex items-start gap-4">

                                        <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center text-xl">
                                            <FaBook />
                                        </div>

                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">

                                                <h3 className="text-xl font-bold text-slate-800">
                                                    {currentClass.subject_name}
                                                </h3>

                                                <span className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">
                                                    LIVE
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-500 mt-1">
                                                {currentClass.subject_code}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                                        <FaClock className="text-green-600" />

                                        {formatTime(
                                            currentClass.start_time
                                        )}

                                        <span className="text-slate-400">
                                            →
                                        </span>

                                        {formatTime(
                                            currentClass.end_time
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs text-slate-500">
                                            Department
                                        </p>

                                        <p className="font-semibold text-slate-800 mt-1">
                                            {currentClass.department_name ||
                                                "—"}
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs text-slate-500">
                                            Class
                                        </p>

                                        <p className="font-semibold text-slate-800 mt-1">
                                            {currentClass.year} Year -{" "}
                                            {currentClass.section}
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs text-slate-500">
                                            Day
                                        </p>

                                        <p className="font-semibold text-slate-800 mt-1">
                                            {DAY_LABELS[
                                                currentClass.day_of_week
                                            ]}
                                        </p>
                                    </div>

                                </div>
                            </div>

                        </div>

                    ) : (

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">

                            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                                <FaCalendarAlt />
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mt-5">
                                No current class
                            </h3>

                            <p className="text-sm text-slate-500 mt-2">
                                You don't have an active class right now.
                            </p>

                        </div>
                    )}
                </section>

                {/* =========================
                    UPCOMING CLASSES
                ========================== */}
                <section>

                    <div className="flex items-center gap-3 mb-4">

                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FaClock />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Upcoming Classes
                            </h2>

                            <p className="text-sm text-slate-500">
                                Your next scheduled classes
                            </p>
                        </div>
                    </div>

                    {loading ? (

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>

                            <p className="text-slate-500 mt-4">
                                Loading upcoming classes...
                            </p>
                        </div>

                    ) : upcomingClasses.length === 0 ? (

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">

                            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                                <FaCalendarAlt />
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mt-5">
                                No upcoming classes
                            </h3>

                            <p className="text-sm text-slate-500 mt-2">
                                There are no classes scheduled in your timetable.
                            </p>

                        </div>

                    ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                            {upcomingClasses.map((item) => (

                                <div
                                    key={item.timetable_id}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
                                >

                                    <div className="p-5">

                                        {/* Top */}
                                        <div className="flex items-center justify-between gap-3">

                                            <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
                                                {getClassStatus(item)}
                                            </span>

                                            <span className="text-xs font-medium text-slate-400">
                                                {item.subject_code}
                                            </span>

                                        </div>

                                        {/* Subject */}
                                        <div className="mt-5">

                                            <h3 className="text-lg font-bold text-slate-800">
                                                {item.subject_name}
                                            </h3>

                                            <p className="text-sm text-slate-500 mt-1">
                                                {item.department_name ||
                                                    "Department"}
                                            </p>

                                        </div>

                                        {/* Time */}
                                        <div className="flex items-center gap-2 mt-5 text-slate-700">

                                            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                                                <FaClock />
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Time
                                                </p>

                                                <p className="text-sm font-semibold">
                                                    {formatTime(
                                                        item.start_time
                                                    )}{" "}
                                                    -{" "}
                                                    {formatTime(
                                                        item.end_time
                                                    )}
                                                </p>
                                            </div>

                                        </div>

                                        {/* Class */}
                                        <div className="flex items-center gap-2 mt-4 text-slate-700">

                                            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                                                <FaUsers />
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Class
                                                </p>

                                                <p className="text-sm font-semibold">
                                                    {item.year} Year -{" "}
                                                    {item.section}
                                                </p>
                                            </div>

                                        </div>

                                        {/* Day */}
                                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">

                                            <span className="text-sm font-medium text-slate-500">
                                                {getDayText(item)}
                                            </span>

                                            <span className="text-xs font-semibold text-slate-400">
                                                {DAY_LABELS[
                                                    item.day_of_week
                                                ]}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>
                    )}
                </section>

            </div>
        </>
    );
};

export default StaffClasses;