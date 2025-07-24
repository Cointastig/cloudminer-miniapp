import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  // TODO: TON‑Transfer‑Payload erstellen
  res.json({ payload: null });
}
