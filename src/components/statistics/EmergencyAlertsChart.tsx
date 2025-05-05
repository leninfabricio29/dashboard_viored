import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import statisticsService, {
  EmergencyAlertStat,
} from "../../services/statis-service";

const EmergencyAlertsChart: React.FC = () => {
  const [data, setData] = useState<EmergencyAlertStat[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await statisticsService.getEmergencyAlertsByDate();
        setData(stats);
      } catch (error) {
        console.error("Error al cargar las estadísticas de emergencias");
      }
    };

    fetchData();
  }, []);

  return (
    <div >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Alertas de Emergencia por Día
        </h3>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded-full bg-red-400"></span>
          <span className="text-sm text-gray-500">Últimos 7 días</span>
        </div>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="_id"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickMargin={10}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickMargin={10}
            />
            <Tooltip
              contentStyle={{
                background: "white",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
              }}
              formatter={(value => [`${value} alertas`, "Cantidad"])}
              itemStyle={{ color: "#ef4444" }}
              labelStyle={{
                fontWeight: 600,
                color: "#111827",
                marginBottom: "0.5rem",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{
                r: 5,
                fill: "#ef4444",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 7,
                fill: "#dc2626",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-right">
        <span className="text-xs text-gray-400">
          Actualizado:{" "}
          {new Date().toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
};

export default EmergencyAlertsChart;
