#!/bin/bash
# Deployment script for MagicStone contracts to Monad Test Network

set -e

echo "=== MagicStone Contract Deployment ==="
echo ""

# Compile contracts
echo "1. Compiling contracts..."
npx hardhat compile

# Deploy to network
echo ""
echo "2. Deploying contracts..."
npx hardhat run ignition/modules/Deploy.js --network monad

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Next steps:"
echo "1. Copy the contract addresses from the output above"
echo "2. Update src/lib/contractAddresses.ts with the new addresses"
echo "3. Or set environment variables:"
echo "   - VITE_STONE_NFT_ADDRESS"
echo "   - VITE_TOOL_NFT_ADDRESS"
echo "   - VITE_GAME_TOKEN_ADDRESS"
echo "   - VITE_POLISHING_ADDRESS"
echo "   - VITE_MARKET_ADDRESS"
echo "   - VITE_QUEST_ADDRESS"
echo ""
