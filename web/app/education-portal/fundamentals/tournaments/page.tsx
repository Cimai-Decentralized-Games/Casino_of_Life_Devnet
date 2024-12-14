'use client';

import React from 'react';
import { FaTrophy, FaRobot, FaUpload, FaHistory } from 'react-icons/fa';
import CodeBlock from '../../../../components/codeblock/code-block';

const TournamentsPage: React.FC = () => {
  const submissionCode = `
from col_retro.tournament import TournamentSubmission

# Prepare your agent for submission
submission = TournamentSubmission(
    model_path='./my_best_model.zip',
    character='LiuKang',
    trainer_name='YourUsername',
    model_name='AggressivePPO_v1'
)

# Validate and submit
submission.validate()  # Runs basic checks
submission.submit(
    tournament_id='weekly_mk2_1',
    api_key='your_api_key'
)`;

  const evaluationCode = `
# Example evaluation results
{
    "model_id": "AggressivePPO_v1",
    "matches_played": 50,
    "win_rate": 0.76,
    "average_damage_dealt": 456.8,
    "average_round_time": 45.2,
    "ranking_points": 1250,
    "tournament_position": 3
}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <FaTrophy className="text-4xl text-primary" />
        <h1 className="text-4xl font-bold">Tournament System</h1>
      </div>

      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          Test your trained agents against the community in our automated tournament system.
          Compete for rankings, earn points, and benchmark your training approaches against others.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaRobot className="mr-2" /> Active Tournaments
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold text-xl mb-2">Weekly MK2 Championship</h3>
                <div className="space-y-2">
                  <p><strong>Status:</strong> <span className="text-success">Active</span></p>
                  <p><strong>Participants:</strong> 24</p>
                  <p><strong>Time Remaining:</strong> 3d 12h</p>
                  <button className="btn btn-primary mt-2">Join Tournament</button>
                </div>
              </div>
              
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold text-xl mb-2">Monthly Grand Prix</h3>
                <div className="space-y-2">
                  <p><strong>Status:</strong> <span className="text-warning">Registration</span></p>
                  <p><strong>Registered:</strong> 12</p>
                  <p><strong>Starts In:</strong> 5d 8h</p>
                  <button className="btn btn-primary mt-2">Register</button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaUpload className="mr-2" /> Submit Your Agent
            </h2>
            <p className="mb-4">Submit your trained agent to compete:</p>
            <CodeBlock
              code={submissionCode}
              language="python"
              title="Tournament Submission"
              description="Submit your agent to a tournament"
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Current Rankings</h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Agent</th>
                    <th>Trainer</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>ElitePPO_v2</td>
                    <td>TopTrainer</td>
                    <td>1500</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>MK2Master</td>
                    <td>AIChampion</td>
                    <td>1450</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>AggressivePPO_v1</td>
                    <td>FightMaster</td>
                    <td>1250</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaHistory className="mr-2" /> Performance Metrics
            </h2>
            <p className="mb-4">Example evaluation results:</p>
            <CodeBlock
              code={evaluationCode}
              language="json"
              title="Tournament Results"
              description="Sample performance metrics from evaluation"
            />
          </section>
        </div>
      </div>

      <section className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Tournament Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Submission Guidelines</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>One active submission per trainer</li>
              <li>Models must use approved training methods</li>
              <li>Submissions must pass validation checks</li>
              <li>Include complete model metadata</li>
            </ul>
          </div>
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Evaluation Process</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Round-robin tournament format</li>
              <li>50 matches per pairing</li>
              <li>Random character selection</li>
              <li>Fair play monitoring</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <p className="text-lg">
          New to tournaments? Check out our 
          <a href="/education-portal/fundamentals/evaluation" className="text-primary hover:text-primary-focus ml-1">
            Evaluation Guide
          </a> 
          to prepare your agent for competition.
        </p>
      </div>
    </div>
  );
};

export default TournamentsPage;