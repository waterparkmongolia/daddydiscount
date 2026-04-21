import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT_ID = 'prj_EkPwXoGpdcbam9QgUhcV2Xi9mcKi';
const TEAM_ID = 'team_sIaXjLcOxW4yuwaMIcrUICdU';

async function getEnv(apiToken: string, key: string): Promise<any> {
  const r = await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    { headers: { Authorization: `Bearer ${apiToken}` } }
  );
  const d = await r.json();
  const env = (d.envs || []).find((e: any) => e.key === key);
  if (!env?.value || env.value === '[]') return null;
  try { return JSON.parse(env.value); } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiToken = process.env.VERCEL_API_TOKEN;
  if (!apiToken) return res.json({ configured: false, members: null, users: null });

  try {
    const [members, users] = await Promise.all([
      getEnv(apiToken, 'DD_MEMBERS'),
      getEnv(apiToken, 'DD_USERS'),
    ]);
    return res.json({ configured: true, members, users });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
