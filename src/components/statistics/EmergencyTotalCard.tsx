import React, { useEffect, useState } from "react";
import statisticsService from "../../services/statis-service";
import { FiAlertCircle, FiActivity } from "react-icons/fi";

const EmergencyTotalCard: React.FC = () => {
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const stats = await statisticsService.getEmergencyAlertsByDate();
      const totalAlerts = stats.reduce((sum, item) => sum + item.count, 0);
      setTotal(totalAlerts);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300">
      <div className="flex justify-center items-center w-14 h-14 mx-auto bg-gradient-to-tr from-red-200 to-red-500 rounded-full">
        <FiAlertCircle className="text-white text-3xl" />
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mt-4">
        Total de Alertas de Emergencia
      </h3>

      <p className="text-5xl font-black text-red-600 mt-2 animate-[pulse_2s_ease-in-out_infinite]">
        {total}
      </p>

      <div className="flex items-center justify-center mt-3 text-gray-500 text-sm">
        <FiActivity className="mr-1" />
        <span>Actualizado recientemente</span>
      </div>
    </div>
  );
};

export default EmergencyTotalCard;
