import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  _req: VercelRequest,
  res: VercelResponse
): void {
  // TODO: TON‑Transfer‑Payload erstellen
  res.json({ payload: null });
}
