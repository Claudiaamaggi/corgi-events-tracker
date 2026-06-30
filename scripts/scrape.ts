import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { fetchAllEvents, fetchEventDetails, type CorgiEvent } from "../lib/luma";
import { classifyFormat } from "../lib/classify";

const DATA_PATH = resolve(__dirname, "../data/events.json");

function loadExisting(): CorgiEvent[] {
  try {
    const raw = readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function main() {
  console.log("Fetching events from Luma calendar...");
  const scraped = await fetchAllEvents();
  console.log(`Fetched ${scraped.length} events from Luma`);

  const existing = loadExisting();
  const existingMap = new Map(existing.map((e) => [e.id, e]));

  const merged: CorgiEvent[] = [];

  for (const event of scraped) {
    const prev = existingMap.get(event.id);

    // Fetch details for attendee count and partner info
    console.log(`  Fetching details for: ${event.name}`);
    const details = await fetchEventDetails(event.id);

    if (prev) {
      // Existing event: only update attendees, preserve manual edits
      merged.push({
        ...prev,
        attendees: details.attendees || prev.attendees,
      });
      existingMap.delete(event.id);
    } else {
      // New event
      const format =
        details.description
          ? classifyFormat(event.name, details.description)
          : event.format;

      merged.push({
        ...event,
        format,
        attendees: details.attendees || event.attendees,
        partner: event.partner,
      });
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  // Keep any existing events not found in this scrape (safety net)
  for (const remaining of existingMap.values()) {
    merged.push(remaining);
  }

  // Sort newest first
  merged.sort((a, b) => b.date.localeCompare(a.date));

  writeFileSync(DATA_PATH, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Wrote ${merged.length} events to ${DATA_PATH}`);
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});
