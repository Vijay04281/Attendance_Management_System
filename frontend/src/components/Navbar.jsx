import React from "react";

const Navbar = () => {
    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const role = user.role || "USER";

    const username =
        user.username || "User";

    const initial =
        username.charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">

            <div>
                <h1 className="text-lg font-semibold text-slate-800">
                    Attendance Management System
                </h1>
            </div>

            <div className="flex items-center gap-3">

                <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                        {username}
                    </p>

                    <p className="text-xs text-slate-500">
                        {role}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                    {initial}
                </div>

            </div>

        </header>
    );
};

export default Navbar;