import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-slate-100">

            {/* Fixed 256px Sidebar */}
            <Sidebar />

            {/* Main area = complete screen minus sidebar */}
            <div className="min-h-screen w-full lg:ml-64 lg:w-[calc(100%-16rem)]">

                {/* Navbar */}
                <Navbar />

                {/* Dashboard area */}
                <main className="w-full min-w-0 p-3 sm:p-4 md:p-5 lg:p-6">
                    <div className="w-full min-w-0">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
};

export default DashboardLayout;