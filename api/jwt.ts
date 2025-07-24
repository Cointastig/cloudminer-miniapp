import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
): void {
  const tid = req.query.tid as string;
  if (!tid) {
    res.status(400).send('missing tid');
    return;
  }

  if (!process.env.SUPABASE_JWT_SECRET) {
    res.status(500).send('missing jwt secret');
    return;
  }

  const token = jwt.sign(
    { sub: tid, telegram_id: tid, role: 'authenticated' },
    process.env.SUPABASE_JWT_SECRET,
    { expiresIn: '1y', audience: 'authenticated' }
  );

  res.send(token);
}
