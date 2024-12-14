'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MultipleAxes from '../../components/charts/multipleAxes';
import Area from '../../components/charts/area';
import * as tf from '@tensorflow/tfjs';
import { FaRobot, FaChartLine, FaCog, FaBalanceScale } from 'react-icons/fa';

// Constants for simulation
const INITIAL_PRICE = 1.0;
const INITIAL_SUPPLY = 100000000;
const RESERVE_RATIO = 0.5;
const MAX_SUPPLY_CHANGE_PERCENT = 0.005;
const MAX_PRICE_CHANGE = 0.005; // Reduced to 0.5% max price change per step
const SIMULATION_DAYS = 1000;
const MIN_PRICE = 0.1; // Increased minimum price
const LIQUIDITY_INFLOW_RATE = 0.2; // Increased to 20%
const TARGET_PRICE = 1.0; // New constant for target price

// Sigmoid function for bonding curve with improved parameters
const sigmoid = (x: number, k: number, x0: number): number => {
  const basePrice = 1 / (1 + Math.exp(-k * (x - x0)));
  return Math.max(basePrice, MIN_PRICE);
};

// Enhanced PID controller with stronger stability focus
const pidController = (
  error: number,
  previousError: number,
  integral: number,
  kp: number,
  ki: number,
  kd: number,
  dt: number,
  volatility: number
): { output: number; integral: number } => {
  const maxIntegral = 2.0 / (1 + volatility); // Increased anti-windup limit
  const derivative = (error - previousError) / dt;
  const newIntegral = Math.max(Math.min(integral + error * dt, maxIntegral), -maxIntegral);
  const output = kp * error + ki * newIntegral + kd * derivative;
  return { output: Math.max(Math.min(output, 1), -1), integral: newIntegral };
};

// Improved KAN model with proper architecture
const createKANModel = () => {
  const model = tf.sequential();
  
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    inputShape: [10],
    kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 1 }));
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });
  
  return model;
};

// Improved conformal prediction
const conformalPrediction = (predictions: number[], actual: number, alpha: number): number => {
  const errors = predictions.map(pred => Math.abs(pred - actual));
  const sortedErrors = errors.sort((a, b) => a - b);
  const quantileIndex = Math.floor((1 - alpha) * sortedErrors.length);
  return sortedErrors[quantileIndex];
};

// Enhanced KAN prediction with proper tensor handling
const predictWithKAN = async (kanModel: tf.Sequential | null, input: number[]): Promise<number> => {
  if (!kanModel) return input[input.length - 1];
  
  try {
    const paddedInput = input.length < 10 
      ? [...Array(10 - input.length).fill(0), ...input]
      : input.slice(-10);

    const inputTensor = tf.tensor1d(paddedInput);
    const mean = inputTensor.mean();
    const std = inputTensor.sub(mean).square().mean().sqrt();
    
    const normalizedInput = inputTensor.sub(mean).div(std);
    const reshapedInput = normalizedInput.reshape([1, 10]);
    
    const prediction = kanModel.predict(reshapedInput) as tf.Tensor;
    const denormalizedPrediction = prediction.mul(std).add(mean);
    const result = denormalizedPrediction.dataSync()[0];
    
    // Cleanup tensors
    [inputTensor, mean, std, normalizedInput, reshapedInput, prediction, denormalizedPrediction]
      .forEach(tensor => tensor.dispose());
    
    return Math.max(result, MIN_PRICE);
  } catch (error) {
    console.error('Error in predictWithKAN:', error);
    return input[input.length - 1];
  }
};

// Enhanced KAN training with proper tensor handling
const trainKANModel = async (
  model: tf.Sequential | null,
  input: number[],
  target: number
): Promise<void> => {
  if (!model) return;
  
  try {
    const inputTensor = tf.tensor1d(input);
    const mean = inputTensor.mean();
    const std = inputTensor.sub(mean).square().mean().sqrt();
    
    const normalizedInput = inputTensor.sub(mean).div(std);
    const normalizedTarget = tf.scalar((target - mean.dataSync()[0]) / std.dataSync()[0]);
    
    const reshapedInput = normalizedInput.reshape([1, 10]);
    const reshapedTarget = normalizedTarget.reshape([1, 1]);
    
    await model.fit(reshapedInput, reshapedTarget, {
      epochs: 1,
      batchSize: 1,
      verbose: 0
    });
    
    // Cleanup tensors
    [inputTensor, mean, std, normalizedInput, normalizedTarget, reshapedInput, reshapedTarget]
      .forEach(tensor => tensor.dispose());
    
  } catch (error) {
    console.error('Error in trainKANModel:', error);
  }
};

// Training lock to prevent concurrent training
let isTraining = false;

const ColCurve: React.FC = () => {
  // State initialization with improved default values
  const [mintRate, setMintRate] = useState(0.0001);
  const [burnRate, setBurnRate] = useState(0.00005);
  const [volatility, setVolatility] = useState(0.05);
  const [kp, setKp] = useState(0.01);
  const [ki, setKi] = useState(0.001);
  const [kd, setKd] = useState(0.005);
  const [bondingCurveK, setBondingCurveK] = useState(1e-7);
  const [bondingCurveX0, setBondingCurveX0] = useState(500000000);
  const [timeStep, setTimeStep] = useState(0);
  const [price, setPrice] = useState(INITIAL_PRICE);
  const [supply, setSupply] = useState(INITIAL_SUPPLY);
  const [liquidity, setLiquidity] = useState(INITIAL_SUPPLY);
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
    marketVolatility: number;
  }>>([]);
  const [kanPredictionValue, setKanPredictionValue] = useState<number>(0);
  const [conformalInterval, setConformalInterval] = useState<[number, number]>([0, 0]);
  const [pidOutput, setPidOutput] = useState<number>(0);
  const [recentPredictions, setRecentPredictions] = useState<number[]>([]);
  const [previousError, setPreviousError] = useState<number>(0);
  const [integral, setIntegral] = useState(0);

  // Initialize KAN model
  useEffect(() => {
    setKanModel(createKANModel());
  }, []);

  // Simulation step with improved price stability
  const simulateStep = useCallback(async () => {
    if (timeStep >= SIMULATION_DAYS) {
      console.log("\n=== FINAL SIMULATION RESULTS ===");
      console.log(`Final Price: ${price.toFixed(8)} USD`);
      console.log(`Final Supply: ${supply.toFixed(2)} tokens`);
      console.log(`Final Liquidity: ${liquidity.toFixed(2)} USD`);
      console.log(`Final Reserve Ratio: ${(liquidity / (price * supply)).toFixed(4)}`);
      setIsSimulating(false);
      return;
    }

    // Calculate price error relative to target price
    const priceError = (TARGET_PRICE - price) / TARGET_PRICE;
    
    // Get PID response
    const { output: pidOutput, integral: newIntegral } = pidController(
      priceError,
      previousError,
      integral,
      kp,
      ki,
      kd,
      1,
      volatility
    );

    // Apply market volatility after PID adjustment
    const marketNoise = (Math.random() - 0.5) * 2 * volatility * price;
    
    // Calculate new price with PID control
    const pidAdjustedPrice = price * (1 + pidOutput);
    const newPrice = Math.max(
      Math.min(
        pidAdjustedPrice + marketNoise,
        price * (1 + MAX_PRICE_CHANGE)
      ),
      Math.max(price * (1 - MAX_PRICE_CHANGE), MIN_PRICE)
    );

    // Adjust supply based on price movement
    const supplyAdjustment = supply * (
      mintRate * (1 + pidOutput) - 
      burnRate * (1 - pidOutput)
    );
    
    const newSupply = supply + Math.max(
      Math.min(supplyAdjustment, supply * MAX_SUPPLY_CHANGE_PERCENT),
      -supply * MAX_SUPPLY_CHANGE_PERCENT
    );

    // Calculate new liquidity
    const liquidityInflow = Math.max(0, supplyAdjustment) * newPrice * LIQUIDITY_INFLOW_RATE;
    const newLiquidity = liquidity + liquidityInflow;

    // KAN prediction with explicit state updates
    let kanPrediction = price;
    let predictionUncertainty = uncertainty;
    let predictionInterval: [number, number] = [price, price];

    if (priceHistory.length >= 10) {
      try {
        // Get KAN prediction
        kanPrediction = await predictWithKAN(kanModel, priceHistory.slice(-10));
        kanPrediction = Math.max(kanPrediction, MIN_PRICE);

        // Calculate uncertainty and prediction interval
        if (recentPredictions.length >= 10) {
          predictionUncertainty = conformalPrediction(recentPredictions, price, 0.1);
          predictionInterval = [
            Math.max(kanPrediction - predictionUncertainty, MIN_PRICE),
            kanPrediction + predictionUncertainty
          ];
        }

        // Explicitly update all AI-related state
        setKanPredictionValue(kanPrediction);
        setUncertainty(predictionUncertainty);
        setConformalInterval(predictionInterval);
        setRecentPredictions(prev => [...prev.slice(-9), kanPrediction]);

      } catch (error) {
        console.error('Error in KAN prediction:', error);
      }
    }

    // Update all state values together
    setPrice(newPrice);
    setSupply(newSupply);
    setLiquidity(newLiquidity);
    setPreviousError(priceError);
    setIntegral(newIntegral);
    setPidOutput(pidOutput);
    setTimeStep(timeStep + 1);
    setPriceHistory(prev => [...prev, newPrice]);

    // Update chart data with all metrics
    setChartData(prev => [...prev, {
      time: `Day ${timeStep + 1}`,
      price: newPrice,
      supply: newSupply,
      liquidity: newLiquidity,
      reserveRatio: newLiquidity / (newPrice * newSupply),
      uncertainty: predictionUncertainty,
      kanPrediction,
      pidOutput,
      marketVolatility: marketNoise / newPrice
    }]);

    // Train KAN model
    if (priceHistory.length >= 10 && !isTraining) {
      try {
        isTraining = true;
        await trainKANModel(kanModel, priceHistory.slice(-10), newPrice);
      } finally {
        isTraining = false;
      }
    }
  }, [
    timeStep, price, supply, liquidity, priceHistory, liquidityHistory, reserveRatioHistory,
    bondingCurveK, bondingCurveX0, kanModel, mintRate, burnRate, volatility,
    kp, ki, kd, previousError, integral, uncertainty, recentPredictions
  ]);

  // Animation frame effect
  useEffect(() => {
    let animationFrame: number;
    
    if (isSimulating) {
      const runSimulation = () => {
        simulateStep();
        animationFrame = requestAnimationFrame(runSimulation);
      };
      animationFrame = requestAnimationFrame(runSimulation);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isSimulating, simulateStep]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Casino of Life Token Simulation</h2>
          
          <div className="prose max-w-none">
            <p className="text-lg mb-4">
              This simulation demonstrates how a cryptocurrency&apos;s price stability mechanism works, similar to how the Federal Reserve manages the US dollar. It combines three key components:
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-base-100 p-4 rounded-lg">
                <h3 className="flex items-center text-lg font-semibold mb-2">
                  <FaBalanceScale className="mr-2" /> Price Stability
                </h3>
                <p>Uses a PID controller (like a smart thermostat) to maintain the token price around $1.00 by adjusting supply through minting and burning, similar to how the Fed manages USD supply.</p>
              </div>
              
              <div className="bg-base-100 p-4 rounded-lg">
                <h3 className="flex items-center text-lg font-semibold mb-2">
                  <FaRobot className="mr-2" /> AI Prediction
                </h3>
                <p>An artificial intelligence model predicts price movements and helps the system anticipate and prevent price instability before it occurs.</p>
              </div>
              
              <div className="bg-base-100 p-4 rounded-lg">
                <h3 className="flex items-center text-lg font-semibold mb-2">
                  <FaChartLine className="mr-2" /> Market Dynamics
                </h3>
                <p>Simulates real market conditions including volatility, liquidity changes, and supply/demand dynamics that affect token price.</p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">How to Use:</h3>
              <ul className="list-disc pl-6">
                <li>Adjust the mint and burn rates to simulate different market conditions</li>
                <li>Modify market volatility to test system stability under stress</li>
                <li>Fine-tune PID controller parameters to optimize price stability</li>
                <li>Watch how the AI predictions help maintain price stability</li>
                <li>Monitor liquidity and reserve ratio to ensure market health</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className={`btn ${isSimulating ? 'btn-error' : 'btn-primary'}`}
            onClick={() => setIsSimulating(!isSimulating)}
          >
            {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaCog className="mr-2" /> Simulation Parameters
            </h3>
            
            <div className="space-y-4">
              <ParameterControl
                label="Mint Rate"
                value={mintRate}
                onChange={setMintRate}
                min={0}
                max={0.001}
                step={0.00001}
                description="Rate at which new tokens are minted (% of total supply)"
              />
              
              <ParameterControl
                label="Burn Rate"
                value={burnRate}
                onChange={setBurnRate}
                min={0}
                max={0.001}
                step={0.00001}
                description="Rate at which tokens are burned (% of total supply)"
              />

              <ParameterControl
                label="Market Volatility"
                value={volatility}
                onChange={setVolatility}
                min={0}
                max={0.2}
                step={0.001}
                description="Random price fluctuation magnitude"
              />
              
              <ParameterControl
                label="PID Proportional (Kp)"
                value={kp}
                onChange={setKp}
                min={0}
                max={0.1}
                step={0.001}
                description="Proportional term for price stability control"
              />
              
              <ParameterControl
                label="PID Integral (Ki)"
                value={ki}
                onChange={setKi}
                min={0}
                max={0.01}
                step={0.0001}
                description="Integral term for accumulated error correction"
              />
              
              <ParameterControl
                label="PID Derivative (Kd)"
                value={kd}
                onChange={setKd}
                min={0}
                max={0.01}
                step={0.0001}
                description="Derivative term for dampening price oscillations"
              />
              
              <ParameterControl
                label="Bonding Curve Steepness (k)"
                value={bondingCurveK}
                onChange={setBondingCurveK}
                min={1e-8}
                max={1e-6}
                step={1e-8}
                description="Controls how quickly price changes with supply"
              />
              
              <ParameterControl
                label="Bonding Curve Midpoint (x0)"
                value={bondingCurveX0}
                onChange={setBondingCurveX0}
                min={100000000}
                max={1000000000}
                step={10000000}
                description="Supply level at which price growth is steepest"
              />
            </div>
          </div>

          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaChartLine className="mr-2" /> Current State
            </h3>
            
            <div className="space-y-2">
              <p><strong>Price:</strong> ${price.toFixed(8)}</p>
              <p><strong>Supply:</strong> {supply.toFixed(2)} tokens</p>
              <p><strong>Liquidity:</strong> ${liquidity.toFixed(2)}</p>
              <p><strong>Reserve Ratio:</strong> {(liquidity / (price * supply)).toFixed(4)}</p>
              <p><strong>Day:</strong> {timeStep}</p>
              <p><strong>AI Prediction:</strong> ${kanPredictionValue.toFixed(8)}</p>
              <p><strong>Prediction Range:</strong> ${conformalInterval[0].toFixed(8)} - ${conformalInterval[1].toFixed(8)}</p>
              <p><strong>PID Output:</strong> {pidOutput.toFixed(8)}</p>
              <p><strong>Market Volatility:</strong> {(volatility * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaRobot className="mr-2" /> Price and AI Predictions
            </h3>
            <Area
              data={chartData}
              series={[
                { dataKey: 'price', name: 'Actual Price', color: '#8884d8' },
                { dataKey: 'kanPrediction', name: 'AI Prediction', color: '#82ca9d' }
              ]}
              height={400}
            />
          </div>

          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaBalanceScale className="mr-2" /> Supply and Liquidity
            </h3>
            <MultipleAxes
              data={chartData}
              series={[
                { dataKey: 'supply', name: 'Supply', color: '#8884d8' },
                { dataKey: 'liquidity', name: 'Liquidity', color: '#82ca9d' },
                { dataKey: 'reserveRatio', name: 'Reserve Ratio', color: '#ffc658' }
              ]}
            />
          </div>

          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaChartLine className="mr-2" /> Market Stability Metrics
            </h3>
            <MultipleAxes
              data={chartData}
              series={[
                { dataKey: 'pidOutput', name: 'PID Control', color: '#8884d8' },
                { dataKey: 'marketVolatility', name: 'Market Volatility', color: '#82ca9d' },
                { dataKey: 'uncertainty', name: 'AI Uncertainty', color: '#ffc658' }
              ]}
            />
          </div>
        </div>
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
      <span className="label-text font-medium">{label}</span>
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
    <div className="flex justify-between px-2 text-sm">
      <span>{value.toExponential(2)}</span>
      <span className="text-gray-600">{description}</span>
    </div>
  </div>
);

export default ColCurve;