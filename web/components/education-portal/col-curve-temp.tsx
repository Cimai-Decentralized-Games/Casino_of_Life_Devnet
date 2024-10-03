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
): number => {
  const derivative = (error - previousError) / dt;
  integral += error * dt;
  return kp * error + ki * integral + kd * derivative;
};

// Kolmogorov-Arnold Network (KAN) Simulation
const createKANModel = () => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [5] }));
  model.add(tf.layers.dense({ units: 5, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  return model;
};

// Conformal Prediction for Uncertainty Bounds
const conformalPrediction = (predictions: number[], actual: number, alpha: number): number => {
  const errors = predictions.map(pred => Math.abs(pred - actual));
  const sortedErrors = errors.sort((a, b) => a - b);
  const quantileIndex = Math.floor((1 - alpha) * sortedErrors.length);
  return sortedErrors[quantileIndex];
};

// KAN Prediction Function
const predictWithKAN = async (kanModel: tf.Sequential | null, input: number[]): Promise<number> => {
  if (!kanModel) return 0;
  
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
  const [kd, setKd] = useState(0.001);
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

  useEffect(() => {
    setKanModel(createKANModel());
  }, []);

  const simulateStep = useCallback(async () => {
    if (timeStep >= 1000) {
      setIsSimulating(false);
      return;
    }

    const targetPrice = sigmoid(supply, bondingCurveK, bondingCurveX0);
    const input = priceHistory.slice(-5);
    const kanPred = await predictWithKAN(kanModel, input);
    setKanPredictionValue(kanPred);

    // Blend sigmoid and KAN prediction
    const blendedPrice = targetPrice * 0.7 + kanPred * 0.3;

    const error = blendedPrice - price;
    const adjustment = pidController(
      error,
      priceHistory[priceHistory.length - 1] || 0,
      liquidity - bondingCurveX0,
      kp,
      ki,
      kd,
      1
    );
    setPidOutput(adjustment);
    
    const effectiveMintRate = Math.max(0, mintRate + adjustment * (1 - volatility));
    const effectiveBurnRate = Math.max(0, burnRate - adjustment * volatility);

    const supplyChange = (effectiveMintRate - effectiveBurnRate) * supply;
    const newSupply = Math.max(0, supply + supplyChange * (1 + (Math.random() - 0.5) * volatility));

    const newPrice = sigmoid(newSupply, bondingCurveK, bondingCurveX0);
    const newLiquidity = liquidity + (newPrice - price) * supplyChange;
    const reserveRatio = newLiquidity / (newPrice * newSupply);

    setRecentPredictions(prev => [...prev.slice(-9), kanPred]);
    let newUncertainty = uncertainty;
    if (recentPredictions.length >= 10) {
      newUncertainty = conformalPrediction(recentPredictions, newPrice, 0.1);
    }
    setUncertainty(newUncertainty);
    setConformalInterval([Math.max(0, newPrice - newUncertainty), newPrice + newUncertainty]);

    setPrice(newPrice);
    setSupply(newSupply);
    setLiquidity(newLiquidity);
    setMintRate(effectiveMintRate);
    setBurnRate(effectiveBurnRate);
    setPriceHistory(prev => [...prev, newPrice]);
    setLiquidityHistory(prev => [...prev, newLiquidity]);
    setReserveRatioHistory(prev => [...prev, reserveRatio]);
    setTimeStep(prev => prev + 1);

    setChartData(prevData => [
      ...prevData,
      {
        time: timeStep.toString(),
        price: newPrice,
        supply: newSupply,
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
  }, [price, supply, liquidity, mintRate, burnRate, kp, ki, kd, volatility, bondingCurveK, bondingCurveX0, timeStep, priceHistory, kanModel, recentPredictions, uncertainty]);

  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    setTimeStep(0);
    setChartData([]);
    setPriceHistory([]);
    setLiquidityHistory([]);
    setReserveRatioHistory([]);
    setRecentPredictions([]);

    const simulate = () => {
      simulateStep();
      if (timeStep < 1000 && isSimulating) {
        requestAnimationFrame(simulate);
      } else {
        setIsSimulating(false);
      }
    };

    simulate();
  }, [simulateStep, timeStep, isSimulating]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center">freeDUMBS Token Simulation</h2>
      
      <div className="bg-base-300 p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-xl font-semibold mb-2">What is this simulation?</h3>
        <p>
          This simulation models the behavior of the freeDUMBS token economy over time. It combines 
          several advanced concepts including bonding curves, PID controllers, and machine learning 
          (Kolmogorov-Arnold Networks) to manage the mint and burn rates of the token based on price, 
          supply, and liquidity dynamics.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-base-300 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-2"><FaRobot /> Kolmogorov-Arnold Network Prediction</h3>
          <p>Current KAN Prediction: {kanPredictionValue.toFixed(4)}</p>
          <p>Uncertainty Interval: [{conformalInterval[0].toFixed(4)}, {conformalInterval[1].toFixed(4)}]</p>
        </div>
        <div className="bg-base-300 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-2"><FaCog /> PID Controller</h3>
          <p>PID Output: {pidOutput.toFixed(4)}</p>
          <p>Effective Mint Rate: {mintRate.toFixed(4)}</p>
          <p>Effective Burn Rate: {burnRate.toFixed(4)}</p>
        </div>
      </div>

      <button
        className={`w-full py-3 rounded-lg ${isSimulating ? 'bg-gray-500' : 'bg-primary text-white'} font-semibold`}
        onClick={runSimulation}
        disabled={isSimulating}
      >
        {isSimulating ? 'Simulation Running...' : 'Start Simulation'}
      </button>

      <div className="mt-8">
        <MultipleAxes data={chartData} />
      </div>

      <div className="mt-8">
        <Area data={chartData} />
      </div>
    </div>
  );
};

export default ColCurve;
