// [x]Tracker — a community-run anti-cheat registry for the Roblox gun-clanning
// scene (api.xtracker.xyz). This is a third-party, community-maintained source —
// NOT our own blacklist — so we treat a "hit" as a signal to verify manually,
// not as a confirmed fact.
//
// CONFIRMED real response shape (from an actual positive hit, June 2026):
//   {
//     "user_id": "36445789",
//     "alts": [],
//     "evidence": [
//       { "date": "06/22/2026 12:47:35 PM", "reason": "Aimlock + Wallbang", "url": "https://vault.xtracker.xyz/..." }
//     ]
//   }
// A "not found" response is a real HTTP 404 with {"error":"User not found"} (or similar).
// Date format is "MM/DD/YYYY HH:MM:SS AM/PM", not ISO 8601 — parsed explicitly below.
//
// Set XTRACKER_API_KEY in env vars to enable. If unset, this is skipped
// entirely and the Checker simply won't show an xTracker card.

export interface XTrackerEvidence {
  reason?: string
  date?: string // raw string as returned by the API, displayed as-is since the format is already human-readable
  url?: string // link to evidence (e.g. a clip), if provided
}

export interface XTrackerResult {
  found: boolean
  checked: boolean // whether the check actually ran (false if no API key configured or it errored)
  evidence: XTrackerEvidence[]
  altCount: number // number of linked alt accounts xTracker reports, if any
  debug?: string
}

interface XTrackerApiResponse {
  user_id?: string
  alts?: unknown[]
  evidence?: Array<{ date?: string; reason?: string; url?: string }>
}

export async function checkXTracker(userId: number): Promise<XTrackerResult> {
  const apiKey = process.env.XTRACKER_API_KEY
  if (!apiKey) {
    return { found: false, checked: false, evidence: [], altCount: 0 }
  }

  const url = `https://api.xtracker.xyz/api/registry/user?id=${userId}`

  try {
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      next: { revalidate: 0 },
    })
    const rawBody = await res.text()

    if (res.status === 404) {
      return { found: false, checked: true, evidence: [], altCount: 0, debug: `[${url}] → 404 not found: ${rawBody.slice(0, 300)}` }
    }

    if (!res.ok) {
      return { found: false, checked: true, evidence: [], altCount: 0, debug: `[${url}] → HTTP ${res.status}: ${rawBody.slice(0, 300)}` }
    }

    let data: XTrackerApiResponse
    try {
      data = JSON.parse(rawBody)
    } catch {
      return { found: false, checked: true, evidence: [], altCount: 0, debug: `[${url}] → non-JSON response: ${rawBody.slice(0, 300)}` }
    }

    const evidence = Array.isArray(data.evidence)
      ? data.evidence.map(e => ({ reason: e.reason, date: e.date, url: e.url }))
      : []
    const altCount = Array.isArray(data.alts) ? data.alts.length : 0

    // Found = there's actual evidence on file. A response with an empty
    // evidence array (and no alts) is effectively a clean record even if the
    // user_id technically "exists" in their system.
    const found = evidence.length > 0 || altCount > 0

    return {
      found,
      checked: true,
      evidence,
      altCount,
      debug: `[${url}] → raw body: ${rawBody.slice(0, 500)}`,
    }
  } catch (e) {
    return { found: false, checked: true, evidence: [], altCount: 0, debug: `Fetch threw an exception: ${e instanceof Error ? e.message : String(e)}` }
  }
}
