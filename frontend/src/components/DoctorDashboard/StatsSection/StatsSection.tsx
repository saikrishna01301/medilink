import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

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
    // Stat Card design remains the same, but flex-1 ensures proper scaling in the responsive container.
    <div className="flex-1 px-4 py-2 bg-white rounded-xl shadow-lg border border-gray-100 min-w-0">
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

// 2. Responsive Stats Section - Now the main export
const StatsSection = () => {
  return (
    // Added a general background color and padding around the container for standalone visibility.
    // <div className="font-inter bg-white p-4 sm:p-8">
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Appointments Overview
      </h2>

      {/* This div is fully responsive */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-x-6 md:space-y-0">
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
    </div>
    // </div>
  );
};

export default StatsSection;
