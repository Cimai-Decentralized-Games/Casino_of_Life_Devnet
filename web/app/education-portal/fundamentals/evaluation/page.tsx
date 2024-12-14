'use client';

import React from 'react';
import { FaChartBar, FaRobot, FaTrophy, FaCode } from 'react-icons/fa';
import CodeBlock from '../../../../components/codeblock/code-block';

const EvaluationPage: React.FC = () => {
  const basicEvalCode = `
from col_retro.trainers.mk2_trainer import MK2Trainer

# Load trained model
trainer = MK2Trainer(
    character='LiuKang',
    load_model='path/to/trained_model.zip'
)

# Basic evaluation
results = trainer.evaluate(
    n_episodes=100,
    render=True
)

print(f"Win Rate: {results['win_rate']:.2%}")
print(f"Average Score: {results['avg_score']:.2f}")
print(f"Average Round Time: {results['avg_round_time']:.2f}s")`;

  const tournamentEvalCode = `
from col_retro.environment import CasinoFightingEnv
from col_retro.evaluation import TournamentEvaluator

# Create tournament evaluator
evaluator = TournamentEvaluator(
    models_dir='./trained_models/',
    characters=['LiuKang', 'SubZero', 'Scorpion'],
    n_rounds=10
)

# Run tournament
results = evaluator.run_tournament(
    save_replays=True,
    replay_dir='./tournament_replays/'
)

# Display results
evaluator.display_rankings()
evaluator.plot_performance_metrics()`;

  const customMetricsCode = `
from col_retro.evaluation import CustomMetricsEvaluator

class CombatMetricsEvaluator(CustomMetricsEvaluator):
    def __init__(self):
        super().__init__()
        self.metrics = {
            'damage_efficiency': [],
            'combo_frequency': [],
            'defensive_success': []
        }
    
    def evaluate_episode(self, env, model):
        obs, info = env.reset()
        done = False
        episode_metrics = self.init_episode_metrics()
        
        while not done:
            action, _ = model.predict(obs)
            obs, reward, terminated, truncated, info = env.step(action)
            
            # Update metrics
            self.update_combat_metrics(episode_metrics, info)
            done = terminated or truncated
        
        return episode_metrics

evaluator = CombatMetricsEvaluator()
metrics = evaluator.evaluate_model('path/to/model.zip', n_episodes=50)`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <FaChartBar className="text-4xl text-primary" />
        <h1 className="text-4xl font-bold">Agent Evaluation</h1>
      </div>

      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          Properly evaluating your trained agents is crucial for understanding their performance
          and comparing different training approaches. Casino of Life provides comprehensive
          evaluation tools for both single-agent assessment and tournament scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaRobot className="mr-2" /> Basic Evaluation
            </h2>
            <p className="mb-4">
              Start with basic performance metrics:
            </p>
            <CodeBlock
              code={basicEvalCode}
              language="python"
              title="Basic Model Evaluation"
              description="Evaluate a trained agent's performance"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Key Metrics</h2>
            <div className="space-y-4">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Performance Metrics</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Win rate</li>
                  <li>Average score</li>
                  <li>Round completion time</li>
                  <li>Damage dealt/taken ratio</li>
                </ul>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Combat Metrics</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Combo success rate</li>
                  <li>Block efficiency</li>
                  <li>Special move usage</li>
                  <li>Position control</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaTrophy className="mr-2" /> Tournament Evaluation
            </h2>
            <p className="mb-4">Run tournament-style evaluations:</p>
            <CodeBlock
              code={tournamentEvalCode}
              language="python"
              title="Tournament Evaluation"
              description="Evaluate multiple agents in tournament format"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaCode className="mr-2" /> Custom Metrics
            </h2>
            <p className="mb-4">Implement custom evaluation metrics:</p>
            <CodeBlock
              code={customMetricsCode}
              language="python"
              title="Custom Metrics Evaluation"
              description="Create and track custom performance metrics"
            />
          </section>
        </div>
      </div>

      <section className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Evaluation Strategy</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Use consistent evaluation environments</li>
              <li>Test against various opponents</li>
              <li>Track multiple performance metrics</li>
              <li>Save evaluation replays for analysis</li>
            </ul>
          </div>
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Common Pitfalls</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Insufficient evaluation episodes</li>
              <li>Biased opponent selection</li>
              <li>Overlooking important metrics</li>
              <li>Inconsistent evaluation conditions</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <p className="text-lg">
          After evaluating your agents, consider submitting them to our 
          <a href="/education-portal/fundamentals/tournament-system" className="text-primary hover:text-primary-focus ml-1">
            Tournament System
          </a> 
          to compete against other trainers&apos; agents.
        </p>
      </div>
    </div>
  );
};

export default EvaluationPage;