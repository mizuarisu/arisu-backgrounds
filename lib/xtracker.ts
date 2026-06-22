// [x]Tracker — a community-run anti-cheat registry for the Roblox gun-clanning
// scene (api.xtracker.xyz). This is a third-party, community-maintained source —
// NOT our own blacklist — so we treat a "hit" as a signal to verify manually,
// not as a confirmed fact. The API only tells us found/not-found; no reason or
// date fields are exposed via the API itself (per xtracker, those require
// contacting their staff directly).
//
// Set XTRACKER_API_KEY in env vars to enable. If unset, this is skipped
// entirely and the Checker simply won't show an xTracker banner.

export interface XTrackerResult {
  found: boolean
  checked: boolean // whether the check actually ran (false if no API key configured or it errored)
  debug?: string
}

export async function checkXTracker(userId: number): Promise<XTrackerResult> {
  const apiKey = process.env.XTRACKER_API_KEY
  if (!apiKey) {
    return { found: false, checked: false }
  }

  const url = `https://api.xtracker.xyz/api/registry/user?id=${userId}`

  try {
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      next: { revalidate: 0 },
    })
    const rawBody = await res.text()

    // Log the raw shape every time for now, since we haven't confirmed the
    // exact response format for a "found" hit yet. Once we see a real hit,
    // this can be tightened.
    if (res.status === 404) {
      return { found: false, checked: true, debug: `[${url}] → 404 not found: ${rawBody.slice(0, 200)}` }
    }

    if (!res.ok) {
      return { found: false, checked: true, debug: `[${url}] → HTTP ${res.status}: ${rawBody.slice(0, 200)}` }
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(rawBody)
    } catch {
      // Some APIs return plain text rather than JSON for simple yes/no checks
      const lower = rawBody.toLowerCase()
      const notFound = lower.includes('not found') || lower.includes('no record')
      return { found: !notFound, checked: true, debug: `[${url}] → non-JSON response: ${rawBody.slice(0, 200)}` }
    }

    // Defensive: try common shapes for a "found" indicator without assuming
    // a specific field name, since we haven't seen a real positive hit yet.
    const found =
      data.found === true ||
      data.exists === true ||
      data.inDatabase === true ||
      (Array.isArray(data.data) && data.data.length > 0) ||
      (typeof data.data === 'object' && data.data !== null && Object.keys(data.data).length > 0)

    return { found: Boolean(found), checked: true, debug: `[${url}] → raw body: ${rawBody.slice(0, 300)}` }
  } catch (e) {
    return { found: false, checked: true, debug: `Fetch threw an exception: ${e instanceof Error ? e.message : String(e)}` }
  }
}
