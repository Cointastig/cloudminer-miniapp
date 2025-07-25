const jwt = require('jsonwebtoken');
import type { VercelRequest, VercelResponse } from '@vercel/node';

// JWT payload interface for better type safety
interface JWTPayload {
  iss: string;
  aud: string;
  sub: string;
  iat: number;
  exp: number;
  telegram_id: string;
  role: string;
}

export default function handler(
  req: VercelRequest,
  res: VercelResponse
): void {
  // CORS headers for Telegram WebApp
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
    return;
  }

  console.log('=== JWT API Debug ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Has JWT Secret:', !!process.env.SUPABASE_JWT_SECRET);
  
  // Validate telegram ID
  const tid = req.query.tid as string;
  if (!tid) {
    console.error('❌ Missing telegram ID');
    res.status(400).json({ 
      error: 'missing_parameter',
      message: 'telegram_id parameter is required' 
    });
    return;
  }

  // Validate telegram ID format (should be numeric)
  if (!/^\d+$/.test(tid)) {
    console.error('❌ Invalid telegram ID format:', tid);
    res.status(400).json({ 
      error: 'invalid_parameter',
      message: 'telegram_id must be numeric' 
    });
    return;
  }

  // Check for JWT secret
  if (!process.env.SUPABASE_JWT_SECRET) {
    console.error('❌ Missing SUPABASE_JWT_SECRET environment variable');
    res.status(500).json({ 
      error: 'server_misconfiguration',
      message: 'JWT secret not configured'
    });
    return;
  }

  try {
    // JWT Payload - must match Supabase's expected structure
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      // Standard JWT claims
      iss: 'supabase',                    // issuer
      aud: 'authenticated',               // audience
      sub: tid,                          // subject (user id)
      iat: now,                          // issued at
      exp: now + (60 * 60 * 24 * 365),  // expires in 1 year
      
      // Custom claims for Supabase RLS
      telegram_id: tid,
      role: 'authenticated'
    };

    console.log('Creating JWT for telegram_id:', tid);

    const token = jwt.sign(
      payload,
      process.env.SUPABASE_JWT_SECRET,
      { 
        algorithm: 'HS256',  // Explicitly use HS256
        header: {
          alg: 'HS256',
          typ: 'JWT'
        }
      }
    );

    // Validate token (security check)
    try {
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET) as JWTPayload;
      console.log('✅ Token validated successfully');
      console.log('Token expires at:', new Date(decoded.exp * 1000).toISOString());
    } catch (verifyError) {
      throw new Error(`Token validation failed: ${verifyError}`);
    }

    // Set security headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Return token as plain text (as expected by frontend)
    res.status(200).send(token);

  } catch (error: any) {
    console.error('❌ JWT creation/validation failed:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'jwt_processing_failed',
      message: 'Failed to create or validate JWT token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
