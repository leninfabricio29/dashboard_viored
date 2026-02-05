import { useNavigate } from "react-router-dom";
import AlertCardsGrid, { AlertCardData } from "../../../components/UI/AlertCardsGrid";

const MonitoringMap = () => {
  const navigate = useNavigate();

  const handleTrackingClick = (alertId: string, alertData: AlertCardData) => {
    console.log(`🗺️ Navegar a rastreo detallado para alerta: ${alertId}`);
    navigate(`/monitoring/tracking/${alertId}`, { state: { alertData } });
  };

  return (
    <div>
      <AlertCardsGrid onTrackingClick={handleTrackingClick} />
    </div>
  );
};

export default MonitoringMap;