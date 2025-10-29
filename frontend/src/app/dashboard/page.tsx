import React from "react";
import {
  ArrowUp,
  ArrowDown,
  User,
  Calendar,
  MessageSquare,
  BriefcaseMedical,
} from "lucide-react";

// --- ATOMIC COMPONENTS ---

// 1. Stat Card (Used for the top three status boxes)
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
}) => {
  const Icon = isPositive ? ArrowUp : ArrowDown;
  const colorClass = isPositive
    ? "text-green-600 bg-green-100"
    : "text-red-600 bg-red-100";

  return (
    <div className="flex-1 p-5 bg-white rounded-xl shadow-lg border border-gray-100 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-gray-500 font-medium text-sm whitespace-nowrap">
          {title}
        </h3>
        <div
          className={`p-1 rounded-full ${colorClass} flex items-center text-xs font-semibold`}
        >
          <Icon className="h-3 w-3 mr-1" />
          {change}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

// 2. Priority Badge (Used in the Patient List table)
interface PriorityBadgeProps {
  level: "Low" | "Medium" | "High";
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ level }) => {
  let colorClasses: string;
  switch (level) {
    case "Low":
      colorClasses = "bg-blue-100 text-blue-700";
      break;
    case "Medium":
      colorClasses = "bg-yellow-100 text-yellow-700";
      break;
    case "High":
      colorClasses = "bg-red-100 text-red-700";
      break;
    default:
      colorClasses = "bg-gray-100 text-gray-700";
  }
  return (
    <span
      className={`px-3 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}
    >
      {level}
    </span>
  );
};

// 3. Status Block (Used in the three middle info panels)
interface StatusBlockProps {
  label: string;
  count: number;
  highlightText: string;
  highlightValue: string;
  isCancel?: boolean;
}

const StatusBlock: React.FC<StatusBlockProps> = ({
  label,
  count,
  highlightText,
  highlightValue,
  isCancel = false,
}) => (
  <div className="mb-4">
    <p className="text-gray-600 text-sm font-medium">{label}</p>
    <div className="flex items-baseline space-x-1 mt-1">
      <p className="text-2xl font-bold text-gray-800">{count}</p>
      <span
        className={`text-xs ${isCancel ? "text-red-500" : "text-gray-500"}`}
      >
        {highlightText}
        <span
          className={`font-semibold ml-1 ${
            isCancel ? "text-red-600" : "text-gray-800"
          }`}
        >
          {highlightValue}
        </span>
      </span>
    </div>
  </div>
);

// --- MAIN LAYOUT ---

const DashboardMainContent: React.FC = () => {
  const patientData = [
    {
      name: "Adam Messy",
      ward: "1234E",
      priority: "Medium",
      start: "May 3, 2023",
      end: "June 4, 2023",
    },
    {
      name: "Celine Aluxata",
      ward: "985746",
      priority: "Low",
      start: "May 31, 2023",
      end: "June 4, 2023",
    },
    {
      name: "Malachi Ardo",
      ward: "047638",
      priority: "High",
      start: "June 7, 2023",
      end: "June 7, 2023",
    },
    {
      name: "Mathias Olivera",
      ward: "248957",
      priority: "Medium",
      start: "June 1, 2023",
      end: "June 5, 2023",
    },
  ];

  const CalendarCell: React.FC<{
    day: number;
    isToday?: boolean;
    hasEvent?: boolean;
  }> = ({ day, isToday, hasEvent }) => (
    <div
      className={`text-center py-1 text-sm cursor-pointer rounded-full ${
        isToday ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
      } ${hasEvent ? "font-bold" : ""}`}
    >
      {day}
      {hasEvent && (
        <span
          className={`block w-1 h-1 rounded-full mx-auto mt-0.5 ${
            isToday ? "bg-white" : "bg-red-500"
          }`}
        />
      )}
    </div>
  );

  return (
    <div className="flex p-8 space-x-6 min-h-screen bg-gray-50/50">
      {/* LEFT & CENTER COLUMNS (70% Width) */}
      <div className="flex flex-col space-y-6 flex-[2.5] min-w-0">
        {/* Greeting */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Welcome Back Dr. Orange Cat
        </h1>

        {/* 1. STATS ROW (3 Cards across the top) */}
        <div className="flex space-x-6">
          <StatCard
            title="Completed Appointments"
            value="128"
            change="25%"
            isPositive={true}
          />
          <StatCard
            title="Upcoming Appointments"
            value="44"
            change="10%"
            isPositive={false}
          />
          <StatCard
            title="Patient Requests"
            value="109"
            change="14%"
            isPositive={true}
          />
        </div>

        {/* 2. DETAIL PANELS (3 Cards in the middle row) */}
        <div className="grid grid-cols-3 gap-6">
          {/* A. Total Patients */}
          <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-700" />
              Total Patients
            </h3>

            <div className="space-y-3 mb-6">
              <StatusBlock
                label="Total"
                count={134}
                highlightText="Seen this week"
                highlightValue="52"
              />
              <StatusBlock
                label="Pending"
                count={52}
                highlightText="appointment cancelled"
                highlightValue="3"
                isCancel={true}
              />
            </div>

            {/* Mini Calendar/Timeline (Simplified layout) */}
            <div className="flex justify-between text-xs font-semibold text-gray-500 border-t pt-3">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                (day, index) => (
                  <div key={day} className="flex flex-col items-center">
                    <span>{day}</span>
                    <span
                      className={`mt-1 w-6 h-6 flex items-center justify-center rounded-lg ${
                        index === 3
                          ? "bg-black text-white"
                          : "hover:bg-gray-100 cursor-pointer"
                      }`}
                    >
                      {8 + index}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* B. Active Patients */}
          <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100 space-y-4">
            <p className="text-xl font-bold text-gray-800">Active Patients</p>
            <StatusBlock
              label="Total Appointments"
              count={172}
              highlightText="Cancelled"
              highlightValue="3"
              isCancel={true}
            />
            <StatusBlock
              label="Reschedule requested"
              count={9}
              highlightText="Active"
              highlightValue="3"
            />
          </div>

          {/* C. Active Surgeries */}
          <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100 space-y-4">
            <p className="text-xl font-bold text-gray-800">Active Surgeries</p>
            <StatusBlock
              label="Surgery done"
              count={1}
              highlightText="Surgery pending"
              highlightValue="18"
            />
          </div>
        </div>

        {/* 3. PATIENT LIST TABLE */}
        <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100 flex-1 min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xl font-bold text-gray-800">Patient</p>
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-gray-500">Sort: A - Z</span>
              <span className="text-blue-600 font-medium cursor-pointer">
                See All
              </span>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-500 border-b pb-2">
            <span className="col-span-2">Name</span>
            <span>Ward No</span>
            <span>Priority</span>
            <span>Start Date</span>
            <span>End Date</span>
          </div>

          {/* Table Body (Patient List) */}
          {patientData.map((patient, index) => (
            <div
              key={index}
              className="grid grid-cols-6 gap-2 items-center py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="col-span-2 flex items-center space-x-3">
                <img
                  src={`https://placehold.co/40x40/${
                    index % 2 === 0 ? "F0A" : "0AF"
                  }/fff?text=P`}
                  alt={patient.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {patient.name}
                  </p>
                  <p className="text-xs text-gray-500">Male, 26 Years</p>
                </div>
              </div>
              <span className="text-sm text-gray-600">{patient.ward}</span>
              <PriorityBadge
                level={patient.priority as "Low" | "Medium" | "High"}
              />
              <span className="text-sm text-gray-600">{patient.start}</span>
              <span className="text-sm text-gray-600">{patient.end}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDEBAR (30% Width) */}
      <div className="flex flex-col space-y-6 flex-1 min-w-[300px]">
        {/* 4. APPOINTMENTS CALENDAR */}
        <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100">
          <p className="text-xl font-bold text-gray-800 mb-4">Appointments</p>

          {/* Calendar Legend (Simplified) */}
          <div className="flex space-x-4 text-xs text-gray-500 mb-4">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>{" "}
              Surgery
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>{" "}
              Home-visit
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>{" "}
              Evaluation
            </div>
          </div>

          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            June 2023
          </h4>

          {/* Days of the Week */}
          <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 mb-2">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
              <span key={day} className="text-center">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid (Simplified for demo) */}
          <div className="grid grid-cols-7 gap-1">
            {/* 28 empty spaces + 30 days = 58 cells to fill */}
            {Array.from({ length: 30 }).map((_, index) => (
              <CalendarCell
                key={index}
                day={index + 1}
                isToday={index === 7}
                hasEvent={[1, 5, 10, 15, 20, 25, 28].includes(index + 1)}
              />
            ))}
          </div>

          {/* Appointment Breakdown */}
          <div className="mt-6 border-t pt-3 space-y-2">
            <p className="text-sm font-medium text-gray-600">66 Home-visits</p>
            <p className="text-sm font-medium text-gray-600">
              142 Evaluations (in clinic)
            </p>
            <p className="text-sm font-medium text-gray-600">18 Surgery</p>
          </div>
        </div>

        {/* 5. SCHEDULE LIST */}
        <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100 flex-1">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xl font-bold text-gray-800">Schedule</p>
            <span className="text-sm text-blue-600 font-medium cursor-pointer">
              view all
            </span>
          </div>

          {/* Today's Schedule */}
          <p className="text-sm font-semibold text-gray-800 mb-3">
            Today Schedule
          </p>
          {/* Placeholder content */}
          <div className="space-y-3 mb-6 text-gray-600">
            <div className="flex items-center space-x-3">
              <img
                src="https://placehold.co/30x30/B33/fff?text=R"
                className="w-8 h-8 rounded-full"
              />
              <span>
                Rina Jacobs{" "}
                <span className="text-xs text-gray-400">09:00 AM</span>
              </span>
            </div>
          </div>

          {/* Tomorrow's Schedule */}
          <p className="text-sm font-semibold text-gray-800 mb-3">
            Tomorrow's Schedule
          </p>
          <div className="space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <img
                src="https://placehold.co/30x30/3B3/fff?text=D"
                className="w-8 h-8 rounded-full"
              />
              <span>
                Daryl Ratinab{" "}
                <span className="text-xs text-gray-400">10:30 AM</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMainContent;
