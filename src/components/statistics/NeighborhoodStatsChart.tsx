import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";

import neighborhoodService from "../../services/neighborhood-service";
import { FiInfo, FiMapPin } from "react-icons/fi";

interface NeighborhoodStat {
  _id: string;
  userCount: number;
  name: string;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#22D3EE"];

const NeighborhoodStatsChart: React.FC = () => {
  const [data, setData] = useState<NeighborhoodStat[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const stats = await neighborhoodService.getNeighborhoodStats();
      setData(stats);
    };

    fetchData();
  }, []);

  const formatTooltipValue = (value: number) => [value.toLocaleString(), "Clientes"];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Distribución de Clientes por Barrio
          </h3>
          <p className="text-sm text-gray-500">
            Cantidad total de clientes registrados por zona
          </p>
        </div>
        <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
          <FiMapPin className="text-blue-500 mr-2" />
          <span className="text-sm font-medium text-blue-600">
            {data.length} barrios
          </span>
        </div>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value: number) => value.toLocaleString()}
            />
            <Tooltip
              formatter={formatTooltipValue}
              contentStyle={{
                background: "#fff",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
              }}
              labelStyle={{
                fontWeight: 600,
                color: "#111827",
                marginBottom: "0.5rem",
              }}
              itemStyle={{ color: "#059669" }}
            />
            <Bar
              dataKey="userCount"
              name="Integrantes"
              radius={[6, 6, 0, 0]}
              animationDuration={1200}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <LabelList
                dataKey="userCount"
                position="top"
                formatter={(value: number) => value.toLocaleString()}
                style={{ fill: "#374151", fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-gray-500 flex items-center">
        <FiInfo className="mr-1" />
        Datos actualizados al{" "}
        {new Date().toLocaleDateString("es-EC", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </div>
    </div>
  );
};

export default NeighborhoodStatsChart;
