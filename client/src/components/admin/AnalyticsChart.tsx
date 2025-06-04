
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsChartProps {
  data: any[]; // Data should be an array of objects for the chart
  dataKeyX: string; // Key for X-axis data
  dataKeyBar: string; // Key for Bar data
  barName: string; // Name for the bar in Legend/Tooltip
  fillColor?: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, dataKeyX, dataKeyBar, barName, fillColor = "#8884d8" }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500">No data available for chart.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={dataKeyX} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={dataKeyBar} fill={fillColor} name={barName} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AnalyticsChart;
