// components/ActivityBarChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import React from "react";

type Log = {
  action: string;
};

type Props = {
  logs: Log[];
};

type ProcessedData = {
  name: string;
  count: number;
};

const ActivityBarChart: React.FC<Props> = ({ logs }) => {
  const processData = (): ProcessedData[] => {
    const actionMapping: Record<string, string> = {
      Asignó: "Asignación de barrio",
      Marcó: "Notificación leída",
      Creó: "Creación",
      Editó: "Edición",
      Eliminó: "Eliminación",
    };

    const actionCounts: Record<string, number> = logs.reduce(
      (acc: Record<string, number>, log: Log) => {
        const actionVerb = log.action.split(" ")[0];
        const actionName = actionMapping[actionVerb] || actionVerb;
        acc[actionName] = (acc[actionName] || 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(actionCounts).map(([name, count]) => ({
      name,
      count,
    }));
  };

  const data = processData();
  data.sort((a, b) => b.count - a.count);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-md border border-slate-200">
          <p className="font-medium text-slate-800">{label}</p>
          <p className="text-sm text-slate-600">
            Total:{" "}
            <span className="text-sky-600 font-semibold">
              {payload[0].value}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%" className="text-sm">
      <BarChart
        data={data}
        margin={{ top: 16, right: 8, bottom: 16, left: 8 }}
        barSize={32}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#475569", fontSize: 12 }}
          axisLine={{ stroke: "#cbd5e1", strokeWidth: 0.5 }}
          tickLine={{ stroke: "#cbd5e1" }}
          tickMargin={10}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 12 }}
          axisLine={{ stroke: "#cbd5e1", strokeWidth: 0.5 }}
          tickLine={{ stroke: "#cbd5e1" }}
          tickMargin={10}
          allowDecimals={false}
          width={24}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="count"
          fill="#0284c7"
          radius={[6, 6, 0, 0]}
          name="Acciones"
          animationDuration={1200}
          background={{ fill: "#f1f5f9" }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ActivityBarChart;
