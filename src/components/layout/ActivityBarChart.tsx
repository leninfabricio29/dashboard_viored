// components/ActivityBarChart.jsx
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
  } from "recharts";
  
  const ActivityBarChart = ({ logs }) => {
    // Procesamiento mejorado de datos
    const processData = () => {
      const actionMapping = {
        "Asignó": "Asignación de barrio",
        "Marcó": "Notificación leída",
        "Creó": "Creación",
        "Editó": "Edición",
        "Eliminó": "Eliminación"
        // Puedes agregar más mapeos según las acciones que tengas
      };
  
      const actionCounts = logs.reduce((acc, log) => {
        const actionVerb = log.action.split(" ")[0];
        const actionName = actionMapping[actionVerb] || actionVerb;
        acc[actionName] = (acc[actionName] || 0) + 1;
        return acc;
      }, {});
  
      return Object.entries(actionCounts).map(([name, count]) => ({
        name,
        count,
      }));
    };
  
    const data = processData();
  
    // Ordenar los datos por cantidad descendente
    data.sort((a, b) => b.count - a.count);
  
    // Personalización del tooltip
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 shadow-lg rounded-md border border-slate-200">
            <p className="font-medium text-slate-800">{label}</p>
            <p className="text-sm text-slate-600">
              Total: <span className="text-sky-600 font-semibold">{payload[0].value}</span>
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
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false}
          />
  
          <XAxis
            dataKey="name"
            tick={{
              fill: "#475569",
              fontSize: 12,
            }}
            axisLine={{
              stroke: "#cbd5e1",
              strokeWidth: 0.5,
            }}
            tickLine={{ stroke: "#cbd5e1" }}
            tickMargin={10}
          />
  
          <YAxis
            tick={{
              fill: "#475569",
              fontSize: 12,
            }}
            axisLine={{
              stroke: "#cbd5e1",
              strokeWidth: 0.5,
            }}
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
            background={{
              fill: "#f1f5f9",
              radius: [6, 6, 0, 0],
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  export default ActivityBarChart;