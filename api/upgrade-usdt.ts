import type { VercelRequest, VercelResponse } from '@vercel/node';

// TON transaction message interface
interface TONMessage {
  address: string;
  amount: string;
  payload?: string;
  stateInit?: string;
}

// TON Connect transaction payload
interface TONTransactionPayload {
  validUntil: number;
  messages: TONMessage[];
}

// Request body interface
interface UpgradeRequest {
  telegramId: string | number;
  level: number;
  address: string;
}

// Response interface
interface UpgradeResponse {
  success: boolean;
  payload?: TONTransactionPayload;
  message: string;
  error?: string;
}

export default function handler(
  req: VercelRequest,
  res: VercelResponse
): void {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    } as UpgradeResponse);
    return;
  }

  try {
    const { telegramId, level, address }: UpgradeRequest = req.body;

    // Input validation
    if (!telegramId || !level || !address) {
      res.status(400).json({
        success: false,
        error: 'missing_parameters',
        message: 'Missing required parameters: telegramId, level, and address are required'
      } as UpgradeResponse);
      return;
    }

    // Validate level
    if (typeof level !== 'number' || level < 2 || level > 100) {
      res.status(400).json({
        success: false,
        error: 'invalid_level',
        message: 'Level must be a number between 2 and 100'
      } as UpgradeResponse);
      return;
    }

    // Validate TON address format (basic check)
    if (!address.match(/^[A-Za-z0-9+/=_-]+$/) || address.length < 48) {
      res.status(400).json({
        success: false,
        error: 'invalid_address',
        message: 'Invalid TON wallet address format'
      } as UpgradeResponse);
      return;
    }

    console.log('Processing upgrade request:', { telegramId, level, address });

    // Calculate upgrade cost
    const upgradeCost = 0.5 + (level - 1) * 0.25; // Base 0.5 USDT + 0.25 per level
    const costInNanocoins = Math.floor(upgradeCost * 1e9); // Convert to nanocoins

    // TODO: Replace with actual smart contract address
    const CONTRACT_ADDRESS = process.env.TON_CONTRACT_ADDRESS || "EQD_your_contract_address_here";
    
    // TODO: Generate actual contract payload for upgrade transaction
    // This would typically include:
    // - Function selector for upgrade method
    // - Encoded parameters (telegram_id, target_level)
    // - Any additional contract-specific data
    const contractPayload = generateUpgradePayload(telegramId.toString(), level);

    // Create TON Connect transaction payload
    const transactionPayload: TONTransactionPayload = {
      validUntil: Math.floor(Date.now() / 1000) + 600, // Valid for 10 minutes
      messages: [
        {
          address: CONTRACT_ADDRESS,
          amount: costInNanocoins.toString(),
          payload: contractPayload,
          // stateInit: undefined // Only needed for contract deployment
        }
      ]
    };

    console.log('✅ Upgrade payload created successfully');
    console.log('Cost:', upgradeCost, 'USDT');
    console.log('Nanocoins:', costInNanocoins);

    res.status(200).json({
      success: true,
      payload: transactionPayload,
      message: `Upgrade to level ${level} prepared. Cost: ${upgradeCost} USDT`
    } as UpgradeResponse);

  } catch (error: any) {
    console.error('❌ Upgrade request failed:', error.message);
    console.error('Error stack:', error.stack);

    res.status(500).json({
      success: false,
      error: 'processing_failed',
      message: 'Failed to process upgrade request',
      // Only include error details in development
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    } as UpgradeResponse);
  }
}

/**
 * Generate contract payload for upgrade transaction
 * TODO: Implement actual contract interaction
 */
function generateUpgradePayload(telegramId: string, targetLevel: number): string {
  // Placeholder implementation
  // In a real implementation, this would:
  // 1. Encode the contract method call
  // 2. Include telegram_id and target_level as parameters
  // 3. Return properly formatted BOC (Bag of Cells) data
  
  console.log('Generating upgrade payload for:', { telegramId, targetLevel });
  
  // Simple base64 encoded placeholder
  // Replace with actual TON contract payload generation
  const data = {
    method: 'upgrade_miner',
    telegram_id: telegramId,
    target_level: targetLevel,
    timestamp: Math.floor(Date.now() / 1000)
  };
  
  return Buffer.from(JSON.stringify(data)).toString('base64');
}
