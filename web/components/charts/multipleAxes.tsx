import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';

interface DataPoint {
  time: string;
  [key: string]: number | string;
}

interface SeriesConfig {
  dataKey: string;
  name: string;
  color: string;
  type?: 'line' | 'area';
  yAxisId?: 'left' | 'right';
}

interface MultipleAxesProps {
  data: DataPoint[];
  series: SeriesConfig[];
  height?: number;
}

const MultipleAxes: React.FC<MultipleAxesProps> = ({ data, series, height = 400 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart
      data={data}
      margin={{
        top: 20, right: 30, left: 20, bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="time" />
      <YAxis yAxisId="left" orientation="left" />
      <YAxis yAxisId="right" orientation="right" />
      <Tooltip />
      <Legend />
      {series.map((s, index) => 
        s.type === 'area' ? (
          <Area
            key={index}
            yAxisId={s.yAxisId || "left"}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            fill={s.color}
            stroke={s.color}
            fillOpacity={0.3}
          />
        ) : (
          <Line
            key={index}
            yAxisId={s.yAxisId || "left"}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color}
          />
        )
      )}
    </LineChart>
  </ResponsiveContainer>
);

export default MultipleAxes;