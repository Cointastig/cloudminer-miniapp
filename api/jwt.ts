import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  // CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('🚀 JWT API Handler Started');
  console.log('=================================');
  
  try {
    // Step 1: Basic environment check
    console.log('📋 Step 1: Environment Check');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Has SUPABASE_URL:', !!process.env.VITE_SUPABASE_URL);
    console.log('- Has ANON_KEY:', !!process.env.VITE_SUPABASE_ANON_KEY);
    console.log('- Has JWT_SECRET:', !!process.env.SUPABASE_JWT_SECRET);
    console.log('- JWT_SECRET length:', process.env.SUPABASE_JWT_SECRET?.length || 0);

    // Step 2: Method validation
    console.log('📋 Step 2: Method Validation');
    console.log('- Method:', req.method);
    if (req.method !== 'GET') {
      console.error('❌ Wrong method');
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Step 3: Parameter validation
    console.log('📋 Step 3: Parameter Validation');
    const tid = req.query.tid as string;
    console.log('- Telegram ID:', tid);
    console.log('- TID Type:', typeof tid);
    console.log('- TID Valid:', tid && /^\d+$/.test(tid));
    
    if (!tid || !/^\d+$/.test(tid)) {
      console.error('❌ Invalid telegram ID');
      res.status(400).json({ error: 'Invalid telegram_id', received: tid });
      return;
    }

    // Step 4: JWT Secret validation
    console.log('📋 Step 4: JWT Secret Validation');
    if (!process.env.SUPABASE_JWT_SECRET) {
      console.error('❌ Missing JWT Secret');
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }
    console.log('✅ JWT Secret available');

    // Step 5: Create JWT payload
    console.log('📋 Step 5: Create JWT Payload');
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: 'supabase',
      aud: 'authenticated',
      sub: tid,
      iat: now,
      exp: now + (60 * 60 * 24 * 365),
      telegram_id: tid,
      role: 'authenticated'
    };
    console.log('✅ Payload created');

    // Step 6: Sign JWT
    console.log('📋 Step 6: Sign JWT Token');
    let token: string;
    try {
      token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, { 
        algorithm: 'HS256' 
      });
      console.log('✅ JWT signed successfully');
      console.log('- Token length:', token.length);
      console.log('- Token starts with:', token.substring(0, 20) + '...');
    } catch (signError: any) {
      console.error('❌ JWT signing failed:', signError.message);
      res.status(500).json({ 
        error: 'JWT signing failed', 
        details: signError.message 
      });
      return;
    }

    // Step 7: Verify JWT (optional validation)
    console.log('📋 Step 7: Verify JWT Token');
    try {
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
      console.log('✅ JWT verification successful');
      console.log('- Decoded sub:', (decoded as any).sub);
      console.log('- Decoded telegram_id:', (decoded as any).telegram_id);
    } catch (verifyError: any) {
      console.error('❌ JWT verification failed:', verifyError.message);
      res.status(500).json({ 
        error: 'JWT verification failed', 
        details: verifyError.message 
      });
      return;
    }

    // Step 8: Success response
    console.log('📋 Step 8: Send Response');
    console.log('✅ ALL STEPS SUCCESSFUL - Sending token');
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(token);

  } catch (globalError: any) {
    console.error('🚨 GLOBAL ERROR CAUGHT:');
    console.error('- Message:', globalError.message);
    console.error('- Name:', globalError.name);
    console.error('- Stack:', globalError.stack);
    
    res.status(500).json({
      error: 'Global error',
      message: globalError.message,
      name: globalError.name,
      timestamp: new Date().toISOString()
    });
  }
}
