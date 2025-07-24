import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { telegramId, level, address } = req.body;

  if (!telegramId || !level || !address) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  // TODO: Implement TON transfer payload creation
  // For now, return placeholder response
  console.log('Upgrade request:', { telegramId, level, address });
  
  // Placeholder payload structure for TON Connect
  const payload = {
    validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
    messages: [
      {
        address: "EQD_your_contract_address_here", // Replace with actual contract
        amount: String(Math.floor((0.5 + level * 0.25) * 1e9)), // Convert USDT to nanocoins
        payload: "", // Contract-specific payload would go here
      }
    ]
  };

  res.json({ 
    success: true,
    payload,
    message: 'Upgrade payload created (placeholder implementation)'
  });
}
