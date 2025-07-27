// Runtime implementation of the JWT endpoint for Vercel.
//
// This file is written in plain CommonJS JavaScript to avoid the complications
// introduced by TypeScript transpilation. Vercel runs API routes in a Node.js
// environment and automatically transpiles TypeScript files, but that
// transpilation can result in ES module syntax (e.g. `export {}`) which
// Node.js refuses to execute by default. By providing a `.js` file that
// explicitly uses `require()` and `module.exports`, we ensure the function
// executes correctly under the CommonJS module system.

const { createHmac } = require('crypto');

// Configure Vercel to run this function in the Node.js runtime. Without this
// property Vercel may attempt to deploy the route as an edge function, which
// does not provide access to Node built‑in modules like `crypto`.
const config = {
  runtime: 'nodejs',
};

/**
 * Encode a Buffer into a base64url string by stripping padding and replacing
 * characters according to RFC 7519.
 *
 * @param {Buffer} input
 * @returns {string}
 */
function base64url(input) {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Create a signed JWT using the HS256 algorithm.
 *
 * @param {Object} payload
 * @param {string} secret
 * @returns {string}
 */
function signJWT(payload, secret) {
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
 * @param {string} token
 * @param {string} secret
 * @returns {Object}
 */
function verifyJWT(token, secret) {
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

/**
 * Main request handler for the JWT endpoint.
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
function handler(req, res) {
  // CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Step 1: Basic environment check
    console.log('📋 Step 1: Environment Check');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Has SUPABASE_URL:', !!process.env.VITE_SUPABASE_URL);
    console.log('- Has ANON_KEY:', !!process.env.VITE_SUPABASE_ANON_KEY);
    console.log('- Has JWT_SECRET:', !!process.env.SUPABASE_JWT_SECRET);
    console.log('- JWT_SECRET length:', process.env.SUPABASE_JWT_SECRET ? process.env.SUPABASE_JWT_SECRET.length : 0);

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
    const tid = req.query.tid;
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
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
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
      exp: now + 60 * 60 * 24 * 365,
      telegram_id: tid,
      role: 'authenticated',
    };
    console.log('✅ Payload created');

    // Step 6: Sign JWT
    console.log('📋 Step 6: Sign JWT Token');
    let token;
    try {
      token = signJWT(payload, secret);
      console.log('✅ JWT signed successfully');
      console.log('- Token length:', token.length);
      console.log('- Token starts with:', token.substring(0, 20) + '...');
    } catch (signError) {
      console.error('❌ JWT signing failed:', signError.message);
      res.status(500).json({ error: 'JWT signing failed', details: signError.message });
      return;
    }

    // Step 7: Verify JWT (optional validation)
    console.log('📋 Step 7: Verify JWT Token');
    try {
      const decoded = verifyJWT(token, secret);
      console.log('✅ JWT verification successful');
      console.log('- Decoded sub:', decoded.sub);
      console.log('- Decoded telegram_id:', decoded.telegram_id);
    } catch (verifyError) {
      console.error('❌ JWT verification failed:', verifyError.message);
      res.status(500).json({ error: 'JWT verification failed', details: verifyError.message });
      return;
    }

    // Step 8: Success response
    console.log('📋 Step 8: Send Response');
    console.log('✅ ALL STEPS SUCCESSFUL - Sending token');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(token);
  } catch (globalError) {
    console.error('🚨 GLOBAL ERROR CAUGHT:');
    console.error('- Message:', globalError.message);
    console.error('- Name:', globalError.name);
    console.error('- Stack:', globalError.stack);
    res.status(500).json({
      error: 'Global error',
      message: globalError.message,
      name: globalError.name,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = {
  default: handler,
  config,
};