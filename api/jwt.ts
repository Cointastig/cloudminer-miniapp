import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

// Tell Vercel to run this function in a Node.js runtime rather than the edge.
// Without this setting Vercel may attempt to deploy the function as an edge
// function, which does not have access to Node built‑in modules such as
// `crypto`. By explicitly specifying a Node runtime we ensure that the
// built‑in crypto APIs are available and avoid runtime crashes.
export const config = {
  runtime: 'nodejs18.x',
};

/*
 * In the original implementation this API used the `jsonwebtoken` library to
 * create and verify JSON Web Tokens (JWTs). Unfortunately that external
 * dependency may not be available in all environments (for example, when
 * installing node modules behind a restrictive network). To avoid runtime
 * failures we implement a minimal HS256 JWT generator and verifier using
 * Node.js' built‑in `crypto` module. The implementation below follows the
 * standard JWT specification: a base64url encoded header, a base64url encoded
 * payload and a signature created using HMAC‑SHA256. Only the signing and
 * simple verification steps are needed for this API. If the provided secret
 * changes or if the token has been tampered with, the verification will
 * correctly fail. This removes the dependency on the external `jsonwebtoken`
 * package without altering the API surface.
 */

/**
 * Encode a Buffer into a base64url string by stripping padding and replacing
 * characters according to RFC 7519.
 */
const base64url = (input: Buffer): string => {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

/**
 * Create a signed JWT using the HS256 algorithm.
 *
 * @param payload The payload to embed in the token
 * @param secret  The secret used for HMAC signing
 */
function signJWT(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64url(Buffer.from(JSON.stringify(payload)));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(data).digest();
  const encodedSignature = base64url(signature);
  return `${data}.${encodedSignature}`;
}

/**
 * Verify a JWT signed with HS256. Throws an error if the signature does not
 * match. Returns the decoded payload otherwise. This function performs a
 * minimal verification and does not check expiry (`exp`) or other claims;
 * callers should perform such checks if necessary.
 *
 * @param token  The JWT to verify
 * @param secret The secret used to sign the token
 */
function verifyJWT(token: string, secret: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = base64url(
    createHmac('sha256', secret).update(data).digest()
  );
  if (expectedSignature !== signature) {
    throw new Error('Invalid token signature');
  }
  const payloadJson = Buffer.from(
    encodedPayload.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  ).toString('utf8');
  return JSON.parse(payloadJson);
}

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
      token = signJWT(payload as Record<string, unknown>, process.env.SUPABASE_JWT_SECRET as string);
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
      const decoded = verifyJWT(token, process.env.SUPABASE_JWT_SECRET as string);
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
