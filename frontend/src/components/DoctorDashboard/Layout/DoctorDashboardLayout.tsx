import AppointmentsCalender from "../AppointmentsCalender/AppointmentsCalender";
import DetailPanels from "../DetailPanels/DetailPanels";
import PatientsList from "../PatientsList/PatientsList";
import StatsSection from "../StatsSection/StatsSection";

const DoctorsDashboardLayout = () => {
  return (
    <div className="p-5">
      <StatsSection />
      <div className="flex space-x-4 mb-8">
        <section className="w-[70%]">
          <DetailPanels />
          <PatientsList />
        </section>
        <section className="w-[30%]">
          <AppointmentsCalender />
        </section>
      </div>
    </div>
  );
};

export default DoctorsDashboardLayout;
