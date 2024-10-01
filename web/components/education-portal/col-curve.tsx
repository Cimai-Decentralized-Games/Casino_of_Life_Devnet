'use client';

import React, { useState, useEffect } from 'react';
import MultipleAxes from '../../components/charts/multipleAxes';
import Area from '../../components/charts/area';
import * as tf from '@tensorflow/tfjs';
import { FaRobot, FaChartLine, FaCog, FaBalanceScale } from 'react-icons/fa';

// Sigmoid function for bonding curve
const sigmoid = (x: number, k: number, x0: number): number => {
  return 1 / (1 + Math.exp(-k * (x - x0)));
};

// PID controller function
const pidController = (
  error: number,
  previousError: number,
  integral: number,
  kp: number,
  ki: number,
  kd: number,
  dt: number
): number => {
  const derivative = (error - previousError) / dt;
  integral += error * dt;
  return kp * error + ki * integral + kd * derivative;
};

// Kolmogorov-Arnold Network Simulation
const createKANModel = () => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [5] }));
  model.add(tf.layers.dense({ units: 5, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  return model;
};

const conformalPrediction = (predictions: number[], actual: number, alpha: number): number => {
  const errors = predictions.map(pred => Math.abs(pred - actual));
  const sortedErrors = errors.sort((a, b) => a - b);
  const quantileIndex = Math.floor((1 - alpha) * sortedErrors.length);
  return sortedErrors[quantileIndex];
};

const predictWithKAN = async (kanModel: tf.Sequential | null, input: number[]): Promise<number> => {
  if (!kanModel) return 0;
  
  // Ensure we always have 5 input values
  const paddedInput = input.length < 5 
    ? [...Array(5 - input.length).fill(0), ...input]
    : input.slice(-5);
  
  const tensorInput = tf.tensor2d([paddedInput]);
  const prediction = await kanModel.predict(tensorInput) as tf.Tensor;
  const result = prediction.dataSync()[0];
  tensorInput.dispose();
  prediction.dispose();
  return result;
};

const ColCurve: React.FC = () => {
  const [mintRate, setMintRate] = useState(0.01);
  const [burnRate, setBurnRate] = useState(0.01);
  const [kp, setKp] = useState(0.1);
  const [ki, setKi] = useState(0.01);
  const [kd, setKd] = useState(0.01);
  const [volatility, setVolatility] = useState(0.5);
  const [bondingCurveK, setBondingCurveK] = useState(1);
  const [bondingCurveX0, setBondingCurveX0] = useState(50);
  const [timeStep, setTimeStep] = useState(0);
  const [price, setPrice] = useState(1);
  const [supply, setSupply] = useState(1000000000);
  const [liquidity, setLiquidity] = useState(1000000000);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [liquidityHistory, setLiquidityHistory] = useState<number[]>([]);
  const [reserveRatioHistory, setReserveRatioHistory] = useState<number[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [kanModel, setKanModel] = useState<tf.Sequential | null>(null);
  const [uncertainty, setUncertainty] = useState<number>(1);

  const [chartData, setChartData] = useState<Array<{
    time: string;
    price: number;
    liquidity: number;
    reserveRatio: number;
    uncertainty: number;
    kanPrediction: number;
    pidOutput: number;
  }>>([]);

  const [kanPredictionValue, setKanPredictionValue] = useState<number>(0);
  const [conformalInterval, setConformalInterval] = useState<[number, number]>([0, 0]);
  const [pidOutput, setPidOutput] = useState<number>(0);
  const [recentPredictions, setRecentPredictions] = useState<number[]>([]);

  useEffect(() => {
    setKanModel(createKANModel());
  }, []);

  const simulateStep = async () => {
    const newPrice = sigmoid(timeStep, bondingCurveK, bondingCurveX0);
    const input = priceHistory.slice(-5);
    const kanPred = await predictWithKAN(kanModel, input);
    setKanPredictionValue(kanPred);

    // Blend sigmoid and KAN prediction
    const blendedPrice = newPrice * (1 - 0.5) + kanPred * 0.5;

    const error = blendedPrice - price;
    const adjustment = pidController(
      error,
      priceHistory[priceHistory.length - 1] || 0,
      liquidity - 100, // Assuming 100 is the target liquidity
      kp,
      ki,
      kd,
      1 // Assuming each time step is 1 unit
    );
    setPidOutput(adjustment);
    
    const newMintRate = Math.max(0, mintRate + adjustment);
    const newBurnRate = Math.max(0, burnRate - adjustment);
    const newSupply = supply + newMintRate * (1 - volatility) - newBurnRate * volatility;
    const newLiquidity = liquidity + newMintRate * (1 - volatility);
    const reserveRatio = supply / newSupply;

    // Conformal prediction for uncertainty estimation
    setRecentPredictions(prev => [...prev.slice(-9), kanPred]);
    const newUncertainty = conformalPrediction(recentPredictions, newPrice, 0.1);
    setUncertainty(newUncertainty);
    setConformalInterval([newPrice - newUncertainty, newPrice + newUncertainty]);

    setPrice(newPrice);
    setSupply(newSupply);
    setLiquidity(newLiquidity);
    setMintRate(newMintRate);
    setBurnRate(newBurnRate);
    setLiquidityHistory([...liquidityHistory, newLiquidity]);
    setReserveRatioHistory([...reserveRatioHistory, reserveRatio]);
    setTimeStep(timeStep + 1);
    setPriceHistory([...priceHistory, newPrice]);

    // Update chartData
    setChartData(prevData => [
      ...prevData,
      {
        time: timeStep.toString(),
        price: newPrice,
        liquidity: newLiquidity,
        reserveRatio: reserveRatio,
        uncertainty: newUncertainty,
        kanPrediction: kanPred,
        pidOutput: adjustment
      }
    ]);

    // Train KAN model
    if (priceHistory.length >= 10) {
      const X = priceHistory.slice(-10, -5);
      const y = [priceHistory[priceHistory.length - 5]];
      await kanModel?.fit(tf.tensor2d([X]), tf.tensor2d([y]), { epochs: 1 });
    }
  };

  const runSimulation = () => {
    setIsSimulating(true);
    const interval = setInterval(async () => {
      await simulateStep();
      if (timeStep >= 100) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 100);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center">freeDUMBS Token Simulation</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold mb-4 flex items-center">
            <FaCog className="mr-2" /> System Parameters
          </h3>
          <div className="space-y-4">
            <ParameterControl
              label="Mint Rate"
              value={mintRate}
              onChange={setMintRate}
              min={0}
              max={0.1}
              step={0.001}
              description="Rate at which new tokens are created."
            />
            <ParameterControl
              label="Burn Rate"
              value={burnRate}
              onChange={setBurnRate}
              min={0}
              max={0.1}
              step={0.001}
              description="Rate at which tokens are removed from circulation."
            />
            <ParameterControl
              label="Proportional Gain (Kp)"
              value={kp}
              onChange={setKp}
              min={0}
              max={1}
              step={0.01}
              description="Influences how strongly the PID controller responds to the current error."
            />
            <ParameterControl
              label="Integral Gain (Ki)"
              value={ki}
              onChange={setKi}
              min={0}
              max={1}
              step={0.01}
              description="Addresses accumulated errors over time in the PID controller."
            />
            <ParameterControl
              label="Derivative Gain (Kd)"
              value={kd}
              onChange={setKd}
              min={0}
              max={1}
              step={0.01}
              description="Responds to the rate of change of the error in the PID controller."
            />
            <ParameterControl
              label="Market Volatility"
              value={volatility}
              onChange={setVolatility}
              min={0}
              max={1}
              step={0.01}
              description="Simulates market unpredictability."
            />
            <ParameterControl
              label="Bonding Curve K"
              value={bondingCurveK}
              onChange={setBondingCurveK}
              min={0.1}
              max={10}
              step={0.1}
              description="Controls the steepness of the sigmoidal bonding curve."
            />
            <ParameterControl
              label="Bonding Curve X0"
              value={bondingCurveX0}
              onChange={setBondingCurveX0}
              min={1}
              max={100}
              step={1}
              description="Controls the midpoint of the sigmoidal bonding curve."
            />
          </div>
        </div>
        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold mb-4 flex items-center">
            <FaChartLine className="mr-2" /> Simulation Results
          </h3>
          <div className="space-y-2 mb-4">
            <p><strong>Current Price:</strong> {price.toFixed(4)}</p>
            <p><strong>Current Supply:</strong> {supply.toFixed(2)}</p>
            <p><strong>Current Liquidity:</strong> {liquidity.toFixed(2)}</p>
            <p><strong>Time Step:</strong> {timeStep}</p>
            <p><strong>Uncertainty:</strong> {uncertainty?.toFixed(4) ?? 'N/A'}</p>
            <p><strong>KAN Prediction:</strong> {kanPredictionValue.toFixed(4)}</p>
            <p><strong>Conformal Interval:</strong> [{conformalInterval[0].toFixed(4)}, {conformalInterval[1].toFixed(4)}]</p>
            <p><strong>PID Output:</strong> {pidOutput.toFixed(4)}</p>
          </div>
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="btn btn-primary w-full"
          >
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      </div>
      <div className="mt-8 bg-base-200 p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 flex items-center">
          <FaRobot className="mr-2" /> Kolmogorov-Arnold Network (KAN) Predictions
        </h3>
        <MultipleAxes 
          data={chartData} 
          series={[
            { dataKey: 'price', name: 'Actual Price', color: '#8884d8' },
            { dataKey: 'kanPrediction', name: 'KAN Prediction', color: '#82ca9d' },
            { dataKey: 'uncertainty', name: 'Uncertainty', color: '#ffc658' }
          ]}
        />
      </div>
      <div className="mt-8 bg-base-200 p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 flex items-center">
          <FaBalanceScale className="mr-2" /> Sigmoidal Bonding Curve and PID Controller
        </h3>
        <MultipleAxes 
          data={chartData} 
          series={[
            { dataKey: 'price', name: 'Price', color: '#8884d8' },
            { dataKey: 'liquidity', name: 'Liquidity', color: '#82ca9d' },
            { dataKey: 'pidOutput', name: 'PID Output', color: '#ffc658' }
          ]}
        />
      </div>
    </div>
  );
};

interface ParameterControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  description: string;
}

const ParameterControl: React.FC<ParameterControlProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  description,
}) => (
  <div className="form-control">
    <label className="label">
      <span className="label-text font-medium">{label}: {value.toFixed(3)}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="range range-primary"
    />
    <label className="label">
      <span className="label-text-alt">{description}</span>
    </label>
  </div>
);

export default ColCurve;