import React, { useEffect, useState } from "react";
import statisticsService from "../../services/statis-service";
import { FiActivity, FiAlertCircle } from "react-icons/fi";

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
    <div className="text-center">
      {/* <FiAlertCircle className="text-red-500 text-4xl mx-auto mb-2" />
      <p className="text-md font-semibold mb-1">Total de Alertas de Emergencia</p>
      <p className="text-5xl font-bold text-red-600">{total}</p> */}
      <div className="p-6 text-center">
        <div className="mx-auto flex justify-center items-center w-16 h-16 bg-red-50 rounded-full mb-4">
          <FiAlertCircle className="text-red-500 text-3xl" />
        </div>

        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Total de Alertas de Emergencia
        </h3>

        <p className="text-5xl font-bold text-red-600 mb-3">{total}</p>

        <div className="text-sm text-gray-500 flex justify-center items-center">
          <FiActivity className="mr-1" />
          <span>Actualizado recientemente</span>
        </div>
      </div>
    </div>
  );
};

export default EmergencyTotalCard;
