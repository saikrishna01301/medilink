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

const AppointmentsCalender = () => {
  return (
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

        <h4 className="text-lg font-semibold text-gray-800 mb-3">June 2023</h4>

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
    </div>
  );
};
export default AppointmentsCalender;
