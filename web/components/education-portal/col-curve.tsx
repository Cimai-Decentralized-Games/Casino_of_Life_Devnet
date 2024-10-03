'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
): { output: number; integral: number } => {
  const derivative = (error - previousError) / dt;
  integral += error * dt;
  return { output: kp * error + ki * integral + kd * derivative, integral };
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
  const [mintRate, setMintRate] = useState(0.001);
  const [burnRate, setBurnRate] = useState(0.0005);
  const [kp, setKp] = useState(0.01);
  const [ki, setKi] = useState(0.001);
  const [kd, setKd] = useState(0.0005);
  const [volatility, setVolatility] = useState(0.05);
  const [bondingCurveK, setBondingCurveK] = useState(0.0000001);
  const [bondingCurveX0, setBondingCurveX0] = useState(1000000000);
  const [timeStep, setTimeStep] = useState(0);
  const [price, setPrice] = useState(1);
  const [supply, setSupply] = useState(1000000000);
  const [liquidity, setLiquidity] = useState(1000000000);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [liquidityHistory, setLiquidityHistory] = useState<number[]>([]);
  const [reserveRatioHistory, setReserveRatioHistory] = useState<number[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [kanModel, setKanModel] = useState<tf.Sequential | null>(null);
  const [uncertainty, setUncertainty] = useState<number>(0.1);

  const [chartData, setChartData] = useState<Array<{
    time: string;
    price: number;
    supply: number;
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
  const [previousError, setPreviousError] = useState<number>(0);
  const [integral, setIntegral] = useState(0);

  useEffect(() => {
    setKanModel(createKANModel());
  }, []);

  const simulateStep = useCallback(async () => {
    if (timeStep >= 1000) {
      console.log("Simulation complete");
      return;
    }

    console.log(`\n--- Day ${timeStep + 1} ---`);

    const targetPrice = sigmoid(supply, bondingCurveK, bondingCurveX0);
    console.log(`Target Price: ${targetPrice.toFixed(4)}`);

    // KAN prediction
    let kanPrediction = 0;
    if (priceHistory.length >= 10) {
      const input = priceHistory.slice(-10);
      console.log(`KAN Input: [${input.map(p => p.toFixed(4)).join(', ')}]`);
      kanPrediction = await predictWithKAN(kanModel, input);
      console.log(`KAN Prediction: ${kanPrediction.toFixed(4)}`);

      // Conformal prediction
      if (recentPredictions.length >= 10) {
        const uncertainty = conformalPrediction(recentPredictions, price, 0.1);
        setUncertainty(uncertainty);
        console.log(`Prediction Uncertainty: ${uncertainty.toFixed(4)}`);
      }
    }

    // Calculate blended price
    const blendedPrice = targetPrice * 0.7 + kanPrediction * 0.3;
    console.log(`Blended Price: ${blendedPrice.toFixed(4)} (70% target, 30% KAN)`);

    // Calculate price error
    const priceError = blendedPrice - price;
    console.log(`Price Error: ${priceError.toFixed(4)}`);

     // PID controller
    const dt = 1; // Assuming each step represents one time unit
    const { output: pidOutput, integral: newIntegral } = pidController(
      priceError,
      previousError,
      integral,
      kp,
      ki,
      kd,
      dt
    );
    console.log(`PID Output: ${pidOutput.toFixed(4)}`);

    // Update PID state
    setPreviousError(priceError);
    setIntegral(newIntegral);

    // Calculate mint and burn rates
    let mintRate = Math.max(0, pidOutput);
    let burnRate = Math.max(0, -pidOutput);
    
    console.log(`Mint Rate: ${mintRate.toFixed(4)}`);
    console.log(`Burn Rate: ${burnRate.toFixed(4)}`);

    // Calculate supply change
    const supplyChange = (mintRate - burnRate) * supply;
    console.log(`Supply Change: ${supplyChange.toFixed(4)}`);

    // Update supply
    const newSupply = supply + supplyChange;
    console.log(`New Supply: ${newSupply.toFixed(4)}`);

    // Calculate new price
    const newPrice = sigmoid(newSupply, bondingCurveK, bondingCurveX0);
    console.log(`New Price: ${newPrice.toFixed(4)}`);

    // Update state
    setSupply(newSupply);
    setPrice(newPrice);
    setPriceHistory(prev => [...prev, newPrice]);
    setRecentPredictions(prev => [...prev.slice(-9), kanPrediction]);
    setTimeStep(prev => prev + 1);

    // Train KAN model
    if (priceHistory.length >= 20) {
      const X = priceHistory.slice(-20, -10);
      const y = [priceHistory[priceHistory.length - 10]];
      console.log(`Training KAN model with input: [${X.map(p => p.toFixed(4)).join(', ')}]`);
      console.log(`Training KAN model with output: ${y[0].toFixed(4)}`);
      await kanModel?.fit(tf.tensor2d([X]), tf.tensor2d([y]), { epochs: 1 });
      console.log("KAN model trained");
    }
  }, [supply, bondingCurveK, bondingCurveX0, kanModel, priceHistory, price, recentPredictions, pidController, previousError, integral, kp, ki, kd]);

  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    setTimeStep(0);
    setChartData([]);
    setPriceHistory([]);
    setLiquidityHistory([]);
    setReserveRatioHistory([]);
    setRecentPredictions([]);
    setIntegral(0);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    if (isSimulating && timeStep < 1000) {
      animationFrameId = requestAnimationFrame(() => {
        simulateStep();
      });
    } else if (timeStep >= 1000) {
      setIsSimulating(false);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isSimulating, timeStep, simulateStep]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center">freeDUMBS Token Simulation</h2>
      
      <div className="bg-base-300 p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-xl font-semibold mb-2">What is this simulation?</h3>
        <p>
          This simulation models the behavior of the freeDUMBS token economy over time. It combines 
          several advanced concepts including bonding curves, PID controllers, and machine learning 
          predictions to simulate how various factors affect token price, supply, and liquidity.
        </p>
        <p className="mt-2">
          Each step in the simulation represents one day in the token's lifecycle. You can adjust 
          various parameters to see how they influence the token's performance over a 1000-day period.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold mb-4 flex items-center">
            <FaCog className="mr-2" /> System Parameters
          </h3>
          <p className="mb-4">
            Adjust these parameters to see how they affect the token economy. Hover over each 
            parameter for more information.
          </p>
          <div className="space-y-4">
            <ParameterControl
              label="Mint Rate"
              value={mintRate}
              onChange={setMintRate}
              min={0}
              max={0.1}
              step={0.001}
              description="Rate at which new tokens are created daily. Higher values increase supply faster."
            />
            <ParameterControl
              label="Burn Rate"
              value={burnRate}
              onChange={setBurnRate}
              min={0}
              max={0.1}
              step={0.001}
              description="Rate at which tokens are removed from circulation daily. Higher values decrease supply faster."
            />
            <ParameterControl
              label="Proportional Gain (Kp)"
              value={kp}
              onChange={setKp}
              min={0}
              max={1}
              step={0.01}
              description="How strongly the system responds to the current error. Higher values cause more aggressive corrections."
            />
            <ParameterControl
              label="Integral Gain (Ki)"
              value={ki}
              onChange={setKi}
              min={0}
              max={1}
              step={0.01}
              description="How the system responds to accumulated errors over time. Higher values address long-term deviations."
            />
            <ParameterControl
              label="Derivative Gain (Kd)"
              value={kd}
              onChange={setKd}
              min={0}
              max={1}
              step={0.01}
              description="How the system responds to the rate of change of the error. Higher values help predict and counteract rapid changes."
            />
            <ParameterControl
              label="Market Volatility"
              value={volatility}
              onChange={setVolatility}
              min={0}
              max={1}
              step={0.01}
              description="Simulates market unpredictability. Higher values lead to more erratic price movements."
            />
            <ParameterControl
              label="Bonding Curve Steepness (K)"
              value={bondingCurveK}
              onChange={setBondingCurveK}
              min={0.00000001}
              max={0.0000001}
              step={0.00000001}
              description="Controls how quickly the price changes with supply. Higher values make the curve steeper."
            />
            <ParameterControl
              label="Bonding Curve Midpoint (X0)"
              value={bondingCurveX0}
              onChange={setBondingCurveX0}
              min={100000000}
              max={1000000000}
              step={10000000}
              description="The point at which the bonding curve's slope is steepest. Adjusts the curve's center."
            />
          </div>
        </div>
        
        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold mb-4 flex items-center">
            <FaChartLine className="mr-2" /> Simulation Results
          </h3>
          <p className="mb-4">
            These values show the current state of the token economy. They update in real-time 
            during the simulation.
          </p>
          <div className="space-y-2 mb-4">
            <p><strong>Current Price:</strong> {price.toFixed(4)} (in USD)</p>
            <p><strong>Current Supply:</strong> {supply.toFixed(2)} tokens</p>
            <p><strong>Current Liquidity:</strong> {liquidity.toFixed(2)} USD</p>
            <p><strong>Simulation Day:</strong> {timeStep}</p>
            <p><strong>Price Uncertainty:</strong> ±{uncertainty?.toFixed(4) ?? 'N/A'} USD</p>
            <p><strong>AI Price Prediction:</strong> {kanPredictionValue.toFixed(4)} USD</p>
            <p><strong>Predicted Price Range:</strong> [{conformalInterval[0].toFixed(4)}, {conformalInterval[1].toFixed(4)}] USD</p>
            <p><strong>PID Controller Adjustment:</strong> {pidOutput.toFixed(4)}</p>
            <p><strong>Effective Mint Rate:</strong> {mintRate.toFixed(4)}</p>
            <p><strong>Effective Burn Rate:</strong> {burnRate.toFixed(4)}</p>
          </div>
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="btn btn-primary w-full"
          >
            {isSimulating ? 'Simulating...' : 'Run 1000-Day Simulation'}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-base-200 p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 flex items-center">
          <FaRobot className="mr-2" /> AI Price Predictions and Actual Price
        </h3>
        <MultipleAxes 
          data={chartData} 
          series={[
            { dataKey: 'price', name: 'Actual Price', color: '#8884d8' },
            { dataKey: 'kanPrediction', name: 'AI Prediction', color: '#82ca9d' },
          ]}
        />
      </div>

      <div className="mt-8 bg-base-200 p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 flex items-center">
          <FaBalanceScale className="mr-2" /> Supply and Liquidity
        </h3>
        <MultipleAxes 
          data={chartData} 
          series={[
            { dataKey: 'supply', name: 'Supply', color: '#8884d8' },
            { dataKey: 'liquidity', name: 'Liquidity', color: '#82ca9d' },
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
      <span className="label-text font-medium">{label}: {value.toFixed(8)}</span>
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