import MapAlert from "../../../components/UI/MapAlert";

const MonitoringMap = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Monitoreo</h1>
      <MapAlert latitude={-3.6819171288940247} longitude={-79.6821212985001} />
      
    </div>
  );
};

export default MonitoringMap;