import React from "react";
import { useNavigate } from "react-router-dom";
import AlertMapContainer from "../../../components/UI/AlertMapContainer";
import styles from "./TrackingDetail.module.css";

interface TrackingDetailProps {
  alertId: string;
}

const TrackingDetail: React.FC<TrackingDetailProps> = ({ alertId }) => {
  const navigate = useNavigate();

  if (!alertId) {
    return (
      <div className={styles.errorContainer}>
        <h2>❌ Error</h2>
        <p>ID de alerta no encontrado</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
            title="Volver a alertas"
          >
            ← Volver
          </button>
          <h1>🗺️ Rastreo de Alerta</h1>
        </div>
        <div className={styles.alertIdBadge}>ID: {alertId.slice(-8)}</div>
      </div>

      {/* Mapa con Polling */}
      <div className={styles.mapContainer}>
        <AlertMapContainer alertId={alertId} />
      </div>

      {/* Info */}
      <div className={styles.footer}>
        <p>📍 Actualizando ubicación en tiempo real...</p>
      </div>
    </div>
  );
};

export default TrackingDetail;
