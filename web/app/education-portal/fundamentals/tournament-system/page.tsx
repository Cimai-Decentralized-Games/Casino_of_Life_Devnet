'use client';

import React from 'react';
import { FaTrophy, FaCode, FaChartLine, FaServer } from 'react-icons/fa';
import CodeBlock from '../../../../components/codeblock/code-block';

const TournamentSystemPage: React.FC = () => {
  const setupCode = `
from col_retro.tournament import TournamentClient

# Initialize tournament client
client = TournamentClient(
    api_key='your_api_key',
    username='your_username'
)

# Register for a tournament
tournament_id = client.register_tournament('weekly_mk2_1')`;

  const submissionCode = `
# Prepare your model for submission
submission_config = {
    'model_path': './trained_models/my_best_model.zip',
    'character': 'LiuKang',
    'training_steps': 1000000,
    'algorithm': 'PPO',
    'description': 'Aggressive fighting style with combo focus'
}

# Submit to tournament
submission_id = client.submit_model(
    tournament_id='weekly_mk2_1',
    config=submission_config
)

# Track submission status
status = client.get_submission_status(submission_id)
print(f"Submission Status: {status}")`;

  const evaluationCode = `
# Get tournament results
results = client.get_tournament_results(tournament_id)

# Access detailed metrics
performance = client.get_model_performance(submission_id)

# Example performance data
{
    'matches_played': 50,
    'wins': 38,
    'losses': 12,
    'win_rate': 0.76,
    'average_damage_dealt': 456.8,
    'average_round_time': 45.2,
    'ranking_points': 1250,
    'tournament_position': 3
}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <FaTrophy className="text-4xl text-primary" />
        <h1 className="text-4xl font-bold">Tournament System Overview</h1>
      </div>

      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          The Casino of Life Tournament System provides a structured platform for evaluating and 
          competing with your trained agents. Learn how to participate, submit models, and track 
          your performance in automated tournaments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaCode className="mr-2" /> Getting Started
            </h2>
            <p className="mb-4">
              Set up your tournament client and register for competitions:
            </p>
            <CodeBlock
              code={setupCode}
              language="python"
              title="Tournament Setup"
              description="Initialize and register for tournaments"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Tournament Types</h2>
            <div className="space-y-4">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Weekly Championships</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>7-day duration</li>
                  <li>Open to all skill levels</li>
                  <li>Character-specific brackets</li>
                  <li>Top 3 qualify for monthly</li>
                </ul>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Monthly Grand Prix</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Qualified participants only</li>
                  <li>Higher stakes matches</li>
                  <li>Extended evaluation period</li>
                  <li>Prize pool available</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaServer className="mr-2" /> Submission Process
            </h2>
            <p className="mb-4">Submit and track your model:</p>
            <CodeBlock
              code={submissionCode}
              language="python"
              title="Model Submission"
              description="Submit and monitor your model"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaChartLine className="mr-2" /> Performance Tracking
            </h2>
            <p className="mb-4">Monitor your tournament performance:</p>
            <CodeBlock
              code={evaluationCode}
              language="python"
              title="Performance Metrics"
              description="Access tournament results and metrics"
            />
          </section>
        </div>
      </div>

      <section className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">System Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Evaluation Infrastructure</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Distributed evaluation system</li>
              <li>Fair play monitoring</li>
              <li>Automated matchmaking</li>
              <li>Performance analytics</li>
            </ul>
          </div>
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Security Measures</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Model validation checks</li>
              <li>API authentication</li>
              <li>Rate limiting</li>
              <li>Version control</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Ready to Compete?</h2>
        <p className="text-lg">
          Visit the 
          <a href="/tournament" className="text-primary hover:text-primary-focus ml-1">
            Tournaments Page
          </a> 
          to see active competitions and submit your models.
        </p>
      </div>
    </div>
  );
};

export default TournamentSystemPage;