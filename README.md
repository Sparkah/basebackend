Base Clicker Mini App
A fast-paced casual clicker game built as a Base Mini App. Players compete for high scores and can mint their achievements as unique, AI-generated NFTs directly to their Base wallet—gas-free.

Features
* Native Base Integration: Connects seamlessly using the Farcaster/Base Mini App SDK.
* Gasless Minting: Users don't pay gas; the game server handles the transaction.
* AI-Generated Rewards: Every minted score generates a unique pixel-art trophy using Generative AI.
* On-Chain Leaderboard: View top players and their minted NFTs directly in the game.
* Anti-Cheat: Backend verification ensures only valid runs are minted.

Tech Stack
* Frontend: Cocos Creator 3.8 (TypeScript) https://github.com/Sparkah/basehackathon/tree/main
* Backend: NestJS, Prisma ORM, PostgreSQL (this repository)
* Blockchain: Solidity (Hardhat), Viem https://github.com/Sparkah/baseNFT#
* AI: Pollinations.ai / Stable Diffusion

Setup Instructions
1. Prerequisites
* Node.js (v18+)
* NPM or Yarn
* Cocos Creator 3.8+
* PostgreSQL Database

2. Smart Contract Deployment
Bash

cd smart-contracts
npm install
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network base-sepolia
# Copy the printed Contract Address!

3. Backend Setup
Bash

cd base-backend
npm install

# Create a .env file
cp .env.example .env

Configure .env:
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY" (Must have Eth on Base Sepolia)
CONTRACT_ADDRESS="ADDRESS_FROM_STEP_2"
HF_ACCESS_TOKEN="OPTIONAL_IF_USING_HUGGINGFACE"

Run Server:
Bash

# Push schema to DB
npx prisma db push
# Start Server
npm run start:dev

4. Frontend (Game) Setup
1. Open project in Cocos Creator.
2. Open assets/scripts/apiClient.ts and update BaseUrl to your local or deployed backend URL.
3. Run: Click the "Play" button in Cocos editor.

Wallet Connection: The game uses sdk.actions.signIn() to authenticate. In the editor, this is mocked; in the real app, it triggers the native Base wallet slide-up.
Minting Flow: The "Mint" button is only active for new high scores. It triggers a backend POST request. The backend validates the score, mints on-chain, generates the AI image, and saves the metadata.
AI Fallback: If the AI service is overloaded, the system gracefully falls back to a default pixel-art trophy to ensure the user still receives their NFT.

[MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
