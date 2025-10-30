import { User } from "lucide-react";

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

const DetailPanels = () => {
  return (
    <div className="grid grid-cols-3 gap-6 mb-5">
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
  );
};

export default DetailPanels;
