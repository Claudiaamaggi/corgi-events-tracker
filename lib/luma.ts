import { classifyFormat, type EventFormat } from "./classify";

export interface CorgiEvent {
  id: string;
  date: string;
  name: string;
  format: EventFormat;
  partner: string | null;
  location: string;
  attendees: number;
  luma_url: string;
}

interface LumaApiEntry {
  api_id: string;
  event: {
    api_id: string;
    name: string;
    description?: string;
    start_at: string;
    url: string;
    geo_address_info?: {
      city?: string;
      city_state?: string;
    };
    geo_address_json?: {
      city?: string;
    };
  };
}

interface LumaCalendarResponse {
  entries: LumaApiEntry[];
  has_more: boolean;
  next_cursor?: string;
}

const CALENDAR_IDS = ["cal-AJpfQVFYtwnIIBy"];

function extractCity(entry: LumaApiEntry): string {
  const geo = entry.event.geo_address_info;
  if (geo?.city) return geo.city;
  if (geo?.city_state) return geo.city_state.split(",")[0].trim();

  const geoJson = entry.event.geo_address_json;
  if (geoJson?.city) return geoJson.city;

  return "Unknown";
}

async function fetchCalendarEvents(
  calendarId: string,
  period: "past" | "future"
): Promise<LumaApiEntry[]> {
  const entries: LumaApiEntry[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const url = new URL("https://api.lu.ma/calendar/get-items");
    url.searchParams.set("calendar_api_id", calendarId);
    url.searchParams.set("period", period);
    if (cursor) url.searchParams.set("pagination_cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
        "x-luma-source": "calendar",
      },
    });

    if (!res.ok) break;

    const data: LumaCalendarResponse = await res.json();
    entries.push(...data.entries);
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }

  return entries;
}

export async function fetchAllEvents(): Promise<CorgiEvent[]> {
  const seen = new Set<string>();
  const events: CorgiEvent[] = [];

  for (const calId of CALENDAR_IDS) {
    for (const period of ["past", "future"] as const) {
      const entries = await fetchCalendarEvents(calId, period);
      for (const entry of entries) {
        const evt = entry.event;
        const slug = evt.url || evt.api_id;
        if (seen.has(slug)) continue;
        seen.add(slug);

        events.push({
          id: slug,
          date: evt.start_at.slice(0, 10),
          name: evt.name,
          format: classifyFormat(evt.name, evt.description),
          partner: null,
          location: extractCity(entry),
          attendees: 0,
          luma_url: `https://lu.ma/${slug}`,
        });
      }
    }
  }

  return events;
}

export async function fetchEventDetails(
  slug: string
): Promise<{ attendees: number; partner: string | null; description?: string }> {
  try {
    // The slug is the url field (short code), try fetching by event_api_id first
    // then fall back to the url-based lookup
    const res = await fetch(
      `https://api.lu.ma/event/get?event_api_id=${slug}`,
      {
        headers: {
          accept: "application/json",
          "x-luma-source": "calendar",
        },
      }
    );

    let data;
    if (res.ok) {
      data = await res.json();
    } else {
      // Try url-based lookup for short slugs
      const res2 = await fetch(
        `https://api.lu.ma/url?url=${slug}`,
        {
          headers: {
            accept: "application/json",
            "x-luma-source": "calendar",
          },
        }
      );
      if (!res2.ok) return { attendees: 0, partner: null };
      data = await res2.json();
    }

    const guestCount = data.guest_count ?? 0;

    let partner: string | null = null;
    if (data.hosts && data.hosts.length > 1) {
      const cohost = data.hosts.find(
        (h: { name?: string }) =>
          h.name && !h.name.toLowerCase().includes("corgi")
      );
      if (cohost) partner = cohost.name;
    }

    return {
      attendees: guestCount,
      partner,
      description: data.event?.description,
    };
  } catch {
    return { attendees: 0, partner: null };
  }
}
