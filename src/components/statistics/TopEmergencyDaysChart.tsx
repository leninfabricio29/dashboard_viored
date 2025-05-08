import React, { useEffect, useState } from "react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  PieLabelRenderProps,
  Cell,
} from "recharts";
import statisticsService, {
  EmergencyAlertStat,
} from "../../services/statis-service";
import { FiAlertTriangle, FiCalendar } from "react-icons/fi";

interface FormattedEmergencyAlertStat extends EmergencyAlertStat {
  label: string;
}

const TopEmergencyDaysChart: React.FC = () => {
  const [topDays, setTopDays] = useState<FormattedEmergencyAlertStat[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await statisticsService.getEmergencyAlertsByDate();
        const sorted = [...stats].sort((a, b) => b.count - a.count).slice(0, 5);
        const formatted = sorted.map((item) => ({
          ...item,
          label: new Date(item._id).toLocaleDateString("es-EC", {
            weekday: "long",
            day: "numeric",
            month: "short",
          }),
        }));
        setTopDays(formatted);
      } catch (error) {
        console.error("Error al obtener top días con más alertas");
      }
    };

    fetchData();
  }, []);

  const renderCustomizedLabel = ({ name, value }: PieLabelRenderProps) => {
    return `${name}: ${value}`;
  };

  const formatTooltipValue = (value: number) => [`${value} alertas`, "Cantidad"];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Top 5 Días con Mayor Actividad de Alertas
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Días con mayor concentración de emergencias registradas
          </p>
        </div>
      </div>
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 mb-4">
        <FiAlertTriangle className="mr-1.5" />
        Picos críticos
      </span>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "white",
                borderRadius: "6px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
                padding: "12px",
              }}
              formatter={formatTooltipValue}
              labelStyle={{
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: "4px",
              }}
              itemStyle={{ color: "#3b82f6" }}
            />
            <Pie
              data={topDays}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#3b82f6"
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {topDays.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(${200 + index * 20}, 70%, 50%)`}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-between items-center text-sm">
        <div className="flex items-center text-gray-500">
          <FiCalendar className="mr-1.5" />
          <span>Período: Últimos 30 días</span>
        </div>
      </div>
    </div>
  );
};

export default TopEmergencyDaysChart;
