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

const COLORS = ["#EF4444", "#F97316", "#F59E0B", "#10B981", "#3B82F6"];

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
            weekday: "short",
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

  const renderCustomizedLabel = ({ name, percent }: PieLabelRenderProps) => {
    const safePercent = percent ?? 0;
    return `${name} ${(safePercent * 100).toFixed(0)}%`;
  };

  const formatTooltipValue = (value: number) => [`${value} alertas`, "Cantidad"];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md transition-all hover:shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Top 5 Días con Mayor Actividad
          </h3>
          <p className="text-sm text-gray-500">
            Días con mayor concentración de alertas de emergencia
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <FiAlertTriangle className="mr-1.5" />
          Picos críticos
        </span>
      </div>

      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={formatTooltipValue}
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "5px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
              }}
              labelStyle={{
                color: "blue",
                fontSize: "10px",
              }}
              itemStyle={{
                color: "#6B7280",
                fontSize: "14px",
              }}
            />
            <Pie
              data={topDays}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={40}
              label={renderCustomizedLabel}
              labelLine={false}
              isAnimationActive={true}
            >
              {topDays.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-gray-500 flex items-center">
        <FiCalendar className="mr-2" />
        Período analizado: últimos 30 días
      </div>
    </div>
  );
};

export default TopEmergencyDaysChart;
