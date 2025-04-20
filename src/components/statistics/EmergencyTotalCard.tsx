import React, { useEffect, useState } from 'react';
import statisticsService from '../../services/statis-service';
import { FiAlertCircle } from 'react-icons/fi';

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
      <FiAlertCircle className="text-red-500 text-4xl mx-auto mb-2" />
      <p className="text-md font-semibold mb-1">Total de Alertas de Emergencia</p>
      <p className="text-5xl font-bold text-red-600">{total}</p>
    </div>
  );
};

export default EmergencyTotalCard;
