'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DEBUG = true;

const logInfo = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(message, data);
  }
};

interface FightInfoProps {
    fightData: {
        currentState: {
            round: number;
            p1_health: number;
            p2_health: number;
            timestamp: number;
        } | null;
        status: 'no_fight' | 'betting_open' | 'active' | 'finished' | 'failed';
        winner: string | null;
    };
    fightHistory: Array<FightInfoProps['fightData']['currentState']>;
}

const FightInfo: React.FC<FightInfoProps> = ({ fightData, fightHistory }) => {
    const chartRef = useRef<ChartJS<"line", number[], string> | null>(null);
    const { currentState, status, winner } = fightData;

    const data: ChartData<"line", number[], string> = {
        labels: fightHistory.map((state, index) => `R${state?.round || index + 1}`),
        datasets: [
            {
                label: 'Player 1 Health',
                data: fightHistory.map(state => state?.p1_health || 100),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
            {
                label: 'Player 2 Health',
                data: fightHistory.map(state => state?.p2_health || 100),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
            },
        },
    };

    return (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Fight Information</h3>
            {currentState ? (
                <>
                    <p>Round: {currentState.round}</p>
                    <div style={{ height: '200px' }}>
                        <Line
                            data={data}
                            options={options}
                            ref={chartRef}
                        />
                    </div>
                </>
            ) : (
                <p>No current fight data available</p>
            )}
            <p>Fight Status: {status}</p>
            {status === 'finished' && winner && (
                <p>Winner: {winner}</p>
            )}
        </div>
    );
};

export default FightInfo;