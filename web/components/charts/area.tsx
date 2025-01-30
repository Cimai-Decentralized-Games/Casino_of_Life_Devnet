import React from 'react';
import {
  AreaChart,
  Area as RechartsArea,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DataPoint {
  time: string;
  [key: string]: number | string;
}

interface SeriesConfig {
  dataKey: string;
  name: string;
  color: string;
  fillOpacity?: number;
}

interface AreaProps {
  data: DataPoint[];
  series: SeriesConfig[];
  height?: number;
}

const Area: React.FC<AreaProps> = ({ data, series, height = 400 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart
      data={data}
      margin={{
        top: 10,
        right: 30,
        left: 0,
        bottom: 0,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="time" />
      <YAxis />
      <Tooltip />
      <Legend />
      {series.map((s, index) => (
        <RechartsArea
          key={index}
          type="monotone"
          dataKey={s.dataKey}
          name={s.name}
          stroke={s.color}
          fill={s.color}
          fillOpacity={s.fillOpacity || 0.3}
        />
      ))}
    </AreaChart>
  </ResponsiveContainer>
);

export default Area;