import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
): void {
  console.log('=== JWT API Debug ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Has JWT Secret:', !!process.env.SUPABASE_JWT_SECRET);
  
  const tid = req.query.tid as string;
  if (!tid) {
    console.error('❌ Missing telegram ID');
    res.status(400).json({ error: 'missing telegram_id parameter' });
    return;
  }

  if (!process.env.SUPABASE_JWT_SECRET) {
    console.error('❌ Missing SUPABASE_JWT_SECRET environment variable');
    res.status(500).json({ error: 'server misconfiguration - missing jwt secret' });
    return;
  }

  try {
    // JWT Payload - wichtig: muss genau diese Struktur haben
    const payload = {
      // Standard JWT claims
      iss: 'supabase',                    // issuer
      aud: 'authenticated',               // audience
      sub: tid,                          // subject (user id)
      iat: Math.floor(Date.now() / 1000), // issued at
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365), // expires in 1 year
      
      // Custom claims für Supabase RLS
      telegram_id: tid,
      role: 'authenticated'
    };

    console.log('JWT Payload:', payload);

    const token = jwt.sign(
      payload,
      process.env.SUPABASE_JWT_SECRET,
      { 
        algorithm: 'HS256'  // Explizit HS256 verwenden
      }
    );

    // Token validieren (zur Sicherheit)
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET) as any;
    console.log('✅ Token validated, telegram_id:', decoded.telegram_id);

    res.status(200).send(token);
  } catch (error: any) {
    console.error('❌ JWT creation/validation failed:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'jwt processing failed', 
      details: error.message 
    });
  }
}
