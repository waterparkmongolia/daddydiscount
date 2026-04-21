import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT_ID = 'prj_EkPwXoGpdcbam9QgUhcV2Xi9mcKi';
const TEAM_ID = 'team_sIaXjLcOxW4yuwaMIcrUICdU';

const ENV_IDS: Record<string, string> = {
  members: 'VOtMpg39SkxYVZwT',
  users: '6dDfniKVgnW2b13g',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiToken = process.env.VERCEL_API_TOKEN;
  if (!apiToken) return res.json({ ok: false, reason: 'not configured' });

  const { key, value } = req.body ?? {};
  const envId = ENV_IDS[key];
  if (!envId || !value) return res.status(400).json({ error: 'invalid key or value' });

  try {
    const jsonStr = JSON.stringify(value);
    // Vercel env vars have a 64KB limit per value
    if (jsonStr.length > 60000) {
      return res.status(413).json({ error: 'data too large' });
    }

    const r = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${envId}?teamId=${TEAM_ID}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: jsonStr, type: 'plain', target: ['production', 'preview', 'development'] }),
      }
    );
    const result = await r.json();
    return res.json({ ok: r.ok, status: r.status, id: result.id });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
