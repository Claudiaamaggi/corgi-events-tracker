"use client";

import { useState, useMemo } from "react";
import eventsData from "../data/events.json";

interface CorgiEvent {
  id: string;
  date: string;
  name: string;
  format: string;
  partner: string | null;
  location: string;
  attendees: number;
  luma_url: string;
}

const events: CorgiEvent[] = eventsData as CorgiEvent[];

const FORMAT_COLORS: Record<string, string> = {
  Networking: "bg-blue-100 text-blue-700",
  Workshop: "bg-purple-100 text-purple-700",
  Talk: "bg-amber-100 text-amber-700",
  "Demo day": "bg-rose-100 text-rose-700",
  Panel: "bg-teal-100 text-teal-700",
  Social: "bg-pink-100 text-pink-700",
  Coworking: "bg-green-100 text-green-700",
  Hackathon: "bg-orange-100 text-orange-700",
  Pitch: "bg-indigo-100 text-indigo-700",
  AMA: "bg-cyan-100 text-cyan-700",
  Game: "bg-yellow-100 text-yellow-700",
  Other: "bg-gray-100 text-gray-600",
};

type SortKey = "newest" | "oldest" | "attendees" | "alpha";

const ROWS_PER_PAGE = 20;

function exportCSV(rows: CorgiEvent[]) {
  const header = "Date,Name,Format,Host,Location,Attendees,URL";
  const lines = rows.map(
    (e) =>
      `${e.date},"${e.name.replace(/"/g, '""')}",${e.format},"${(e.partner ?? "").replace(/"/g, '""')}",${e.location},${e.attendees},${e.luma_url}`
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "corgi-events.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [format, setFormat] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  const cities = useMemo(
    () => [...new Set(events.map((e) => e.location))].sort(),
    []
  );
  const formats = useMemo(
    () => [...new Set(events.map((e) => e.format))].sort(),
    []
  );

  const filtered = useMemo(() => {
    let result = events;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }
    if (city !== "all") {
      result = result.filter((e) => e.location === city);
    }
    if (format !== "all") {
      result = result.filter((e) => e.format === format);
    }

    switch (sort) {
      case "newest":
        result = [...result].sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "oldest":
        result = [...result].sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "attendees":
        result = [...result].sort((a, b) => b.attendees - a.attendees);
        break;
      case "alpha":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [search, city, format, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const totalEvents = events.length;
  const totalAttendees = events.reduce((s, e) => s + e.attendees, 0);
  const totalCities = new Set(events.map((e) => e.location)).size;
  const avgAttendees =
    totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐾</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Corgi cafe events
            </h1>
            <p className="text-sm text-gray-500">
              Synced from Luma · updated daily at 9am
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            className="px-4 py-2 text-sm font-medium rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors cursor-pointer"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total events", value: totalEvents },
          {
            label: "Total attendees",
            value: totalAttendees.toLocaleString(),
          },
          { label: "Cities", value: totalCities },
          { label: "Avg attendees", value: avgAttendees },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/80 backdrop-blur rounded-2xl border border-gray-100 p-5 shadow-sm"
          >
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 shadow-sm"
        />
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm cursor-pointer"
        >
          <option value="all">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={format}
          onChange={(e) => {
            setFormat(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm cursor-pointer"
        >
          <option value="all">All formats</option>
          {formats.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm cursor-pointer"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="attendees">Most attendees</option>
          <option value="alpha">Alphabetical</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 text-left">
                <th className="px-5 py-3.5 font-semibold text-gray-600">
                  Date
                </th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">
                  Event name
                </th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">
                  Format
                </th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">
                  Host
                </th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">
                  Location
                </th>
                <th className="px-5 py-3.5 font-semibold text-gray-600 text-right">
                  Attendees
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    {totalEvents === 0
                      ? "No events yet — run the scraper to populate data"
                      : "No events match your filters"}
                  </td>
                </tr>
              ) : (
                paged.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {event.date}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      <a
                        href={event.luma_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors"
                      >
                        {event.name}
                      </a>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${FORMAT_COLORS[event.format] ?? FORMAT_COLORS.Other}`}
                      >
                        {event.format}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {event.partner ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      📍 {event.location}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700 font-medium tabular-nums">
                      {event.attendees.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ROWS_PER_PAGE + 1}–
              {Math.min(currentPage * ROWS_PER_PAGE, filtered.length)} of{" "}
              {filtered.length} events
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                )
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                    acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`dots-${i}`}
                      className="px-2 py-1.5 text-sm text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                        currentPage === p
                          ? "bg-gray-900 text-white border-gray-900"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
