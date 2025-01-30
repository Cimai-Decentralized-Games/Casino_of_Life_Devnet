import { 
  Plugin, 
  Action, 
  Evaluator, 
  Provider, 
  Memory, 
  State, 
  IAgentRuntime,
  ActionExample,
  UUID 
} from "@ai16z/eliza";

const trainGameAction: Action = {
  name: "TRAIN_GAME",
  similes: ["LEARN_GAME", "PRACTICE_GAME"],
  description: "Trains the agent on game mechanics and strategies using stable-retro",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return message.content.text.includes('game') || 
           message.content.text.includes('train');
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      // Call your Python backend REST endpoint instead of websocket
      const response = await fetch(`${process.env.PYTHON_BACKEND_URL}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.content.text,
          gameId: message.content.gameId,
          agentType: message.content.agentType || 'balanced',
          trainingParams: {
            rewardType: message.content.rewardType || 'multi',
            gameControls: message.content.gameControls
          }
        })
      });

      if (!response.ok) {
        throw new Error('Training failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Game training error:', error);
      return false;
    }
  },

  examples: [
    [
      {
        user: "user1",
        content: {
          text: "Train agent on Street Fighter",
          gameId: "street_fighter",
          agentType: "aggressive",
          rewardType: "basic"
        }
      },
      {
        user: "agent",
        content: {
          text: "Starting training session for Street Fighter with aggressive strategy",
          action: "TRAIN_GAME"
        }
      }
    ]
  ]
};

const gamePerformanceEvaluator: Evaluator = {
  name: "GAME_PERFORMANCE",
  similes: ["GAME_EVAL", "PERFORMANCE_CHECK"],
  description: "Evaluates agent's gaming performance",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => true,
  
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    if (!state?.roomId) {
      throw new Error("Room ID is required");
    }

    const performance = await runtime.messageManager.getMemories({
      roomId: state.roomId as UUID,
      count: 10,
      unique: true
    });

    return performance;
  },

  examples: [
    {
      context: "User requesting performance evaluation",
      messages: [
        {
          user: "user1",
          content: {
            text: "How am I performing in the game?"
          }
        }
      ],
      outcome: "Agent evaluates and reports game performance"
    }
  ]
};

export const gameTrainingPlugin: Plugin = {
  name: "game-training",
  description: "Plugin for training and evaluating game-playing agents",
  actions: [trainGameAction],
  evaluators: [gamePerformanceEvaluator],
  providers: []
};
