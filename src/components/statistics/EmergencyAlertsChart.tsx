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
        const formatted = stats.map((item) => ({
          ...item,
          date: new Date(item._id).toLocaleDateString("es-EC", {
            day: "2-digit",
            month: "short",
          }),
        }));
        setData(formatted);
      } catch (error) {
        console.error("Error al cargar las estadísticas de emergencias");
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Alertas de Emergencia por Día
          </h3>
          <p className="text-sm text-gray-500">Actividad diaria reciente</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-sm text-gray-500">Últimos 7 días</span>
        </div>
      </div>

      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
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
                background: "#fff",
                borderRadius: "0.5rem",
                boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
              formatter={(value) => [`${value} alertas`, "Cantidad"]}
              labelStyle={{
                fontWeight: 600,
                color: "#111827",
                marginBottom: "0.5rem",
              }}
              itemStyle={{ color: "#ef4444" }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#ef4444"
              strokeWidth={3}
              isAnimationActive={true}
              dot={{
                r: 4,
                fill: "#ef4444",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "#dc2626",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-gray-400 text-right">
        Última actualización:{" "}
        {new Date().toLocaleDateString("es-EC", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </div>
    </div>
  );
};

export default EmergencyAlertsChart;
