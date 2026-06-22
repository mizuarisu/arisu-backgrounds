// [x]Tracker — a community-run anti-cheat registry for the Roblox gun-clanning
// scene (api.xtracker.xyz). This is a third-party, community-maintained source —
// NOT our own blacklist — so we treat a "hit" as a signal to verify manually,
// not as a confirmed fact.
//
// We previously assumed the REST API only returns found/not-found with no
// detail, based on incomplete evidence (a "not found" sample and a docs
// screenshot). A real "found" sample via their Discord bot shows entries with
// a Reason and a Date, so the REST API likely exposes similar fields under
// some key names — but the Discord bot might have access to richer data than
// the public API does. This code now tries to extract that detail defensively,
// and always logs the full raw body so we can confirm the real shape from
// actual lookups rather than continuing to guess.
//
// Set XTRACKER_API_KEY in env vars to enable. If unset, this is skipped
// entirely and the Checker simply won't show an xTracker card.

export interface XTrackerEntry {
  reason?: string
  date?: string
}

export interface XTrackerResult {
  found: boolean
  checked: boolean // whether the check actually ran (false if no API key configured or it errored)
  entries: XTrackerEntry[] // populated if we could parse reason/date detail; empty if not found or fields unavailable
  debug?: string
}

function extractEntries(data: Record<string, unknown>): XTrackerEntry[] {
  // Try several plausible shapes without assuming one specific structure,
  // since we still haven't seen the raw REST response for a real hit.
  const candidates: unknown[] = []

  if (Array.isArray(data.entries)) candidates.push(...data.entries)
  else if (Array.isArray(data.data)) candidates.push(...data.data)
  else if (Array.isArray(data.records)) candidates.push(...data.records)
  else if (typeof data === 'object' && (data.reason || data.date)) candidates.push(data)

  const entries: XTrackerEntry[] = []
  for (const c of candidates) {
    if (typeof c !== 'object' || c === null) continue
    const obj = c as Record<string, unknown>
    const reason = (obj.reason ?? obj.Reason ?? obj.note) as string | undefined
    const date = (obj.date ?? obj.Date ?? obj.addedAt ?? obj.createdAt ?? obj.timestamp) as string | undefined
    if (reason || date) entries.push({ reason, date })
  }
  return entries
}

export async function checkXTracker(userId: number): Promise<XTrackerResult> {
  const apiKey = process.env.XTRACKER_API_KEY
  if (!apiKey) {
    return { found: false, checked: false, entries: [] }
  }

  const url = `https://api.xtracker.xyz/api/registry/user?id=${userId}`

  try {
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      next: { revalidate: 0 },
    })
    const rawBody = await res.text()

    if (res.status === 404) {
      return { found: false, checked: true, entries: [], debug: `[${url}] → 404 not found: ${rawBody.slice(0, 300)}` }
    }

    if (!res.ok) {
      return { found: false, checked: true, entries: [], debug: `[${url}] → HTTP ${res.status}: ${rawBody.slice(0, 300)}` }
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(rawBody)
    } catch {
      // Some APIs return plain text rather than JSON for simple yes/no checks
      const lower = rawBody.toLowerCase()
      const notFound = lower.includes('not found') || lower.includes('no record')
      return { found: !notFound, checked: true, entries: [], debug: `[${url}] → non-JSON response: ${rawBody.slice(0, 300)}` }
    }

    const found =
      data.found === true ||
      data.exists === true ||
      data.inDatabase === true ||
      (Array.isArray(data.data) && data.data.length > 0) ||
      (Array.isArray(data.entries) && data.entries.length > 0) ||
      (typeof data.data === 'object' && data.data !== null && !Array.isArray(data.data) && Object.keys(data.data).length > 0)

    const entries = found ? extractEntries(data) : []

    // Always log the full raw body — this is the only way we'll get certainty
    // on the real field names rather than continuing to guess.
    return {
      found: Boolean(found),
      checked: true,
      entries,
      debug: `[${url}] → raw body: ${rawBody.slice(0, 500)}`,
    }
  } catch (e) {
    return { found: false, checked: true, entries: [], debug: `Fetch threw an exception: ${e instanceof Error ? e.message : String(e)}` }
  }
}
