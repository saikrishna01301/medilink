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

const PatientsList: React.FC = () => {
  return (
    <>
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
    </>
  );
};

export default PatientsList;
