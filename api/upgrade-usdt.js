// Implementation of the USDT upgrade endpoint.
//
// This function is provided in plain CommonJS JavaScript to avoid issues
// related to TypeScript transpilation on Vercel. By using `require()` and
// `module.exports` we ensure that Node.js can execute the file without
// ES‑module syntax errors.

// NOTE: Type definitions from '@vercel/node' can be referenced via JSDoc
// comments. They are optional and do not affect runtime behaviour. If you
// need type checking in your IDE, you can install '@vercel/node' types.

/**
 * @typedef {import('@vercel/node').VercelRequest} VercelRequest
 * @typedef {import('@vercel/node').VercelResponse} VercelResponse
 */

// Configuration: run on Node.js runtime
const config = {
  runtime: 'nodejs',
};

// TON Connect transaction payload helper. A message must have an address,
// amount (in nanocoins) and optionally a payload (base64) and stateInit.
/**
 * Generate the contract payload for upgrade. In a real implementation this
 * would encode a function call to your smart contract. Here we simply encode
 * a JSON object as base64 for demonstration.
 *
 * @param {string} telegramId
 * @param {number} targetLevel
 * @returns {string}
 */
function generateUpgradePayload(telegramId, targetLevel) {
  console.log('Generating upgrade payload for:', { telegramId, targetLevel });
  const data = {
    method: 'upgrade_miner',
    telegram_id: telegramId,
    target_level: targetLevel,
    timestamp: Math.floor(Date.now() / 1000),
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Handle upgrade requests. Users call this endpoint to prepare a TON
 * transaction that upgrades their miner level. The function validates
 * parameters, calculates the cost and builds a TON Connect payload. You can
 * customize the contract interaction by replacing the placeholder contract
 * address and payload generation.
 *
 * @param {VercelRequest} req
 * @param {VercelResponse} res
 */
function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'method_not_allowed',
      message: 'Only POST requests are supported',
    });
    return;
  }

  try {
    const { telegramId, level, address } = req.body || {};

    // Validate body
    if (!telegramId || !level || !address) {
      res.status(400).json({
        success: false,
        error: 'missing_parameters',
        message: 'Missing required parameters: telegramId, level and address',
      });
      return;
    }
    if (typeof level !== 'number' || level < 2 || level > 100) {
      res.status(400).json({
        success: false,
        error: 'invalid_level',
        message: 'Level must be a number between 2 and 100',
      });
      return;
    }
    // Basic TON address validation
    if (!/^[A-Za-z0-9+/=_-]+$/.test(address) || address.length < 48) {
      res.status(400).json({
        success: false,
        error: 'invalid_address',
        message: 'Invalid TON wallet address format',
      });
      return;
    }

    console.log('Processing upgrade request:', { telegramId, level, address });

    // Calculate upgrade cost: base 0.5 USDT + 0.25 per level
    const upgradeCost = 0.5 + (level - 1) * 0.25;
    const costInNanocoins = Math.floor(upgradeCost * 1e9);

    // Contract address from environment or placeholder
    const contractAddress = process.env.TON_CONTRACT_ADDRESS || 'EQD_your_contract_address_here';

    // Build payload (replace with real encoding logic)
    const payload = generateUpgradePayload(String(telegramId), level);

    // Compose transaction
    const transactionPayload = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: contractAddress,
          amount: costInNanocoins.toString(),
          payload,
        },
      ],
    };

    console.log('✅ Upgrade payload created successfully');
    console.log('Cost:', upgradeCost, 'USDT');
    console.log('Nanocoins:', costInNanocoins);

    res.status(200).json({
      success: true,
      payload: transactionPayload,
      message: `Upgrade to level ${level} prepared. Cost: ${upgradeCost} USDT`,
    });
  } catch (err) {
    console.error('❌ Upgrade request failed:', err.message);
    res.status(500).json({
      success: false,
      error: 'processing_failed',
      message: 'Failed to process upgrade request',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}

module.exports = {
  default: handler,
  config,
};