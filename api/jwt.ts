// api/jwt.ts – signiert ein JWT mit telegram_id‑Claim
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const tid = req.query.tid as string;                 // Telegram‑ID
  if (!tid) return res.status(400).send('missing tid');

  const token = jwt.sign(
    { sub: tid, telegram_id: tid, role: 'authenticated' },
    process.env.SUPABASE_JWT_SECRET!,                  // Dashboard → Settings → API
    { expiresIn: '1y', audience: 'authenticated' }
  );

  res.send(token);
}
