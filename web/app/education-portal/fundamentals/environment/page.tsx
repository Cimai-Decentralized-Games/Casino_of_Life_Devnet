'use client';

import React from 'react';
import { FaGlobe, FaGamepad, FaFistRaised, FaDollarSign } from 'react-icons/fa';
import VideoPlayer from '../../../../components/VideoPlayer';
import CodeBlock from '../../../../components/codeblock/code-block';

const EnvironmentPage: React.FC = () => {
  const installationCode = `
# Install the Casino of Life package
pip install casino-of-life-retro

# Optional: Create a virtual environment first
python -m venv col-env
source col-env/bin/activate  # On Windows: col-env\\Scripts\\activate`;

  const basicEnvCode = `
from col_retro.environment import CasinoFightingEnv

# Create MK2 environment with tournament scenario
env = CasinoFightingEnv(
    game='MortalKombatII-Genesis',
    scenario='tournament'
)

# Initialize environment
obs, info = env.reset()

# Example of basic interaction
action = env.action_space.sample()
obs, reward, terminated, truncated, info = env.step(action)`;

  const envSetupCode = `
# Create a new Python virtual environment
python -m venv col-env
source col-env/bin/activate  # On Windows: col-env\\Scripts\\activate

# Install stable-retro
pip install stable-retro numpy`;

  const romIntegrationCode = `
# Import your MK2 ROM
python -m retro.import /path/to/your/mk2.md

# Verify the game is available
python -c "import retro; print(retro.data.list_games())"`;

  const testEnvCode = `
import retro

def test_env():
    env = retro.make(game='MortalKombat2-Genesis')
    obs = env.reset()
    
    # Test a few steps
    for _ in range(1000):
        obs, rew, done, trunc, info = env.step(env.action_space.sample())
        env.render()
        if done:
            obs = env.reset()
    env.close()

if __name__ == "__main__":
    test_env()`;

  const trainerCode = `
from col_retro.trainers.mk2_trainer import MK2Trainer

# Create a trainer for Liu Kang
trainer = MK2Trainer(
    character='LiuKang',
    save_dir='my_first_agent'
)

# Train the agent
model_path = trainer.train(
    total_timesteps=100000,  # Adjust based on your needs
    learning_rate=3e-4,
    batch_size=32
)

# Evaluate the trained agent
results = trainer.evaluate(model_path)
print(f"Win Rate: {results['win_rate']:.2%}")`;

  const quickStartCode = `
from col_retro.environment import CasinoFightingEnv

def test_environment():
    # Create environment
    env = CasinoFightingEnv(
        game='MortalKombatII-Genesis',
        scenario='tournament'
    )
    
    # Run a test episode
    obs, info = env.reset()
    total_reward = 0
    
    for _ in range(1000):
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)
        env.render()
        total_reward += reward
        
        if terminated or truncated:
            print(f"Episode finished! Total reward: {total_reward}")
            break
    
    env.close()

if __name__ == "__main__":
    test_environment()`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <FaGlobe className="text-4xl text-primary" />
        <h1 className="text-4xl font-bold">Fighting Game Environments</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Casino of Life Environments</h2>
            <p className="mb-4">
              The Casino of Life provides a specialized Python package for AI training in fighting games.
              Our environments are specifically configured for competitive AI development and betting integration.
            </p>
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">Supported Games:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Mortal Kombat 2 (Active)</li>
                <li>More games coming soon...</li>
              </ul>
            </div>
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Environment Setup</h2>
            <p className="mb-4">First, install our package:</p>
            
            <CodeBlock
              code={installationCode}
              language="bash"
              title="Installation"
              description="Install the package and set up your environment"
            />

            <p className="my-4">Then create your environment:</p>
            
            <CodeBlock
              code={basicEnvCode}
              language="python"
              title="Basic Environment Setup"
              description="Create and interact with the MK2 environment"
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Environment Demo</h2>
            <VideoPlayer 
              src="/videos/mk2-environment-demo.mp4"
              title="MK2 Environment Setup Tutorial"
            />
            <p className="mt-4 text-sm">
              This demo shows how to set up and interact with the Mortal Kombat 2 environment 
              using Stable-Retro.
            </p>
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <FaFistRaised /> Combat Mechanics
            </h2>
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold">Observation Space</h3>
                <p>Screen: (224, 320, 3) RGB array</p>
                <p>RAM: Access to fighter positions, health, and match state</p>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold">Key Game States</h3>
                <ul className="list-disc list-inside">
                  <li>Health values (both fighters)</li>
                  <li>Position coordinates</li>
                  <li>Active animation frames</li>
                  <li>Round timer</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
          <FaDollarSign /> Future Integration
        </h2>
        <p className="mb-4">
          The Casino of Life platform is being developed to add these features:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>AI agent submission and validation system</li>
          <li>Automated tournament organization</li>
          <li>Real-time performance metrics</li>
          <li>Integration with the FreeDUMBS betting system</li>
        </ul>
      </div>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <p className="mb-4">
          Follow these steps to set up your fighting game environment:
        </p>
        <div className="space-y-6">
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold">1. Environment Setup</h3>
            <CodeBlock
              code={envSetupCode}
              language="bash"
              title="Environment Setup"
              description="Create and activate your Python environment"
            />
          </div>

          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold">2. ROM Integration</h3>
            <CodeBlock
              code={romIntegrationCode}
              language="bash"
              title="ROM Setup"
              description="Import and verify your game ROM"
            />
          </div>

          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold">3. Test Your Environment</h3>
            <CodeBlock
              code={testEnvCode}
              language="python"
              title="Environment Test"
              description="Basic test script for your environment"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Training Your First Agent</h2>
        <p className="mb-4">
          Our package includes a user-friendly training interface:
        </p>
        <CodeBlock
          code={trainerCode}
          language="python"
          title="Basic Training Setup"
          description="Train and evaluate your first agent"
        />
      </div>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Quick Start Example</h2>
        <CodeBlock
          code={quickStartCode}
          language="python"
          title="Quick Start"
          description="Complete example to get started quickly"
        />
      </div>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Advanced Features</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Custom reward functions</li>
          <li>Tournament-ready scenarios</li>
          <li>Performance metrics tracking</li>
          <li>Model validation tools</li>
          <li>Integration with betting system</li>
        </ul>
        <p className="mt-4">
          Check out our <a href="/education-portal/fundamentals/actions" className="text-primary hover:text-primary-focus">Actions</a> page for 
          the next step in learning more about RL.
        </p>
      </div>
    </div>
  );
};

export default EnvironmentPage;