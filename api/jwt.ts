import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  const tid = req.query.tid;
  if (!tid) return res.status(400).send('missing tid');

  const token = jwt.sign(
    { sub: tid, telegram_id: tid, role: 'authenticated' },
    process.env.SUPABASE_JWT_SECRET,
    { expiresIn: '1y', audience: 'authenticated' }
  );

  res.send(token);
}
