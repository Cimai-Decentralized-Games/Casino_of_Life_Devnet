
---

# Casino of Life: Programs Overview

The Casino of Life is an innovative platform that leverages cutting-edge decentralized finance (DeFi), reinforcement learning (RL), and hybrid asset protocols to create an interactive and dynamic ecosystem. This repository contains programs that power the Casino of Life, including:

- **Betting Program**  
- **NFT Game Agent Program**  
- **freeDUMBS Controller Program**  

These programs collectively enable a unique user experience, blending financial innovation, trained AI agents, and decentralized interactions.

---

## 🎲 Betting Program

The **Betting Program** forms the core of the casino experience, allowing users to place bets on the outcomes of various games. It is tightly integrated with the freeDUMBS Controller Program, which manages the underlying currency, **freeDUMBS**.

### Features:
- Seamlessly integrates with the freeDUMBS sigmoidal bonding curve.  
- Future plans include natural language interfaces for interacting with the system's agent.  
- Expands DeFi opportunities by introducing decentralized financial instruments tailored for the casino ecosystem.  

---

## 🕹️ NFT Game Agent Program

The **NFT Game Agent Program** enables the minting of trained AI agents as NFTs. These agents are utilized in games, where users can place bets or participate in competitions.  

### Key Features:
- **Hybrid Asset Framework**: Uses [Metaplex Hybrid Assets](https://developers.metaplex.com/mpl-hybrid?ref=blog.colosseum.org) to enhance collections with real-world and digital assets.  
- **Interactive Collections**: Creators can build and monetize collections of trained agents. These agents represent a basket of valuable assets with potential applications in real-world scenarios.  
- **Advanced AI**: Allows for the development and trading of agents trained in various RL strategies, opening possibilities for their use in real-world applications.

---

## 🧠 freeDUMBS Controller Program

The **freeDUMBS Controller Program** is the heart of the Casino of Life. It is an autonomous system driven by a PID controller and managed by an off-chain agent trained with advanced machine learning techniques.

### Core Functions:
1. **Sigmoidal Bonding Curve Management**:  
   - Controls the minting and burning of freeDUMBS tokens.  
   - Maintains price stability and market liquidity.

2. **System Management**:  
   - Directly manages the Betting and NFT Game Agent Programs.  
   - Records all agent actions on-chain, ensuring transparency and accountability.

3. **AI-Powered Decision Making**:  
   - Utilizes a **Kolmogorov-Arnold Network (KAN)** combined with **time-series conformal prediction** to forecast system states.  
   - Incorporates external market volatility data into predictions for robust PID control.  
   - Implements self-healing mechanisms to ensure continuous operation even under failures.

---

## 🔮 Technical Architecture

### Off-Chain Agent:
The off-chain agent is a proprietary model developed by **Cimai**. It interacts with the PID controller to optimize the bonding curve, ensuring a balanced ecosystem for the casino and its participants.

### Machine Learning Stack:
- **Kolmogorov-Arnold Network (KAN)**:  
  A powerful neural network framework for high-dimensional learning.  

- **Time-Series Conformal Prediction**:  
  Used to predict future states, market conditions, and price fluctuations of SOL and freeDUMBS tokens.

---

## 🚀 Getting Started

### Building the Library
Run the following command to build the library:
```bash
nx build anchor
```

### Running Unit Tests
Execute unit tests using Jest with the following command:
```bash
nx test anchor
```

---

## 🌟 Future Plans

1. **Natural Language Interactions**:  
   Users will be able to manage their freeDUMBS and interact with the system through a natural language interface powered by the off-chain agent.

2. **Expanded DeFi Instruments**:  
   A suite of decentralized financial instruments will be introduced to leverage every opportunity in the Casino of Life.

3. **Ecosystem Growth**:  
   Encourage creators to build diverse collections of trained agents and monetize them for both entertainment and practical applications.

---

## 🛠️ Contributing

We welcome contributions to improve and expand the Casino of Life ecosystem. Please submit issues or pull requests for discussion and review.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

--- 

