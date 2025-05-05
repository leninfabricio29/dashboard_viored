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
import { FiDownload, FiInfo, FiMapPin } from "react-icons/fi";

interface NeighborhoodStat {
  _id: string;
  userCount: number;
  name: string;
}

const NeighborhoodStatsChart: React.FC = () => {
  const [data, setData] = useState<NeighborhoodStat[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const stats = await neighborhoodService.getNeighborhoodStats();
      setData(stats);
    };

    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Distribución de Clientes por Barrio
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Cantidad total de clientes registrados por zona
          </p>
        </div>
      </div>
      <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full w-32 mb-4">
        <FiMapPin className="text-blue-500 mr-2" />
        <span className="text-sm font-medium text-blue-600">
          {data.length} barrios
        </span>
      </div>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="horizontal" // Cambio a gráfico vertical
            margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              horizontal={false}
              vertical={true}
              strokeDasharray="3 3"
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              type="number"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                background: "white",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
                padding: "12px",
              }}
              formatter={(value) => [value.toLocaleString(), "Clientes"]}
              labelStyle={{
                fontWeight: 600,
                color: "#111827",
                marginBottom: "4px",
              }}
              itemStyle={{ color: "#059669" }}
            />
            <Bar
              dataKey="userCount"
              name="Clientes"
              radius={[4, 4, 0, 0]} // Bordes redondeados solo en la parte superior
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(${index * 70}, 70%, 45%)`} // Variación de color
                />
              ))}
              <LabelList
                dataKey="userCount"
                position="top"
                formatter={(value) => value.toLocaleString()}
                style={{ fill: "#374151", fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-between items-center text-sm">
        <div className="flex items-center text-gray-500">
          <FiInfo className="mr-1" />
          <span>Datos actualizados al {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodStatsChart;
