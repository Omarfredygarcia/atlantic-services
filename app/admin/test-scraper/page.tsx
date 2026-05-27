"use client";

import { useMemo, useState } from "react";

type Result = {
  precio: number | null;
  fuente: string;
  url: string | null;
  tiempo_ms: number | null;
  error: string | null;
};

const RAILWAY_BASE = process.env.NEXT_PUBLIC_RAILWAY_RPA_URL || "";

export default function TestScraperPage() {
  const [baseUrl, setBaseUrl] = useState(
    "https://www.menards.com/main/plumbing/pipe-fittings/cellular-core-dwv-pvc-pipe/pvc044000600/p-1444426393930-c-8571.htm"
  );
  const [term, setTerm] = useState("pvc044000600");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<"playwright" | "scrapingbee" | null>(null);

  const finalUrl = useMemo(() => {
    const b = baseUrl.trim();
    const t = term.trim();
    if (!b) return "";
    if (!t) return b;
    return b.includes("?") ? `${b}&q=${encodeURIComponent(t)}` : `${b}?q=${encodeURIComponent(t)}`;
  }, [baseUrl, term]);

  async function run(modo: "playwright" | "scrapingbee") {
    setLoading(modo);
    setResult(null);

    try {
      const qs = new URLSearchParams({
        base_url: baseUrl,
        term,
        modo,
      });

      const res = await fetch(`${RAILWAY_BASE}/test-scraper?${qs.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({
        precio: null,
        fuente: modo,
        url: finalUrl,
        tiempo_ms: null,
        error: e?.message || "Error desconocido",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Test Scraper Menards</h1>

      <div className="space-y-4 rounded-xl border p-4">
        <div>
          <label className="block text-sm font-medium mb-1">URL base / tienda</label>
          <input
            className="w-full rounded border p-2"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://www.menards.com/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Artículo / término</label>
          <input
            className="w-full rounded border p-2"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="pvc044000600"
          />
        </div>

        <div className="text-sm rounded bg-gray-100 p-3 break-all">
          <span className="font-semibold">URL final:</span> {finalUrl || "(vacía)"}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => run("playwright")}
            disabled={!!loading}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading === "playwright" ? "Ejecutando..." : "Probar Playwright"}
          </button>

          <button
            onClick={() => run("scrapingbee")}
            disabled={!!loading}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading === "scrapingbee" ? "Ejecutando..." : "Probar ScrapingBee"}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-2 rounded-xl border p-4">
          <div><span className="font-semibold">Fuente:</span> {result.fuente}</div>
          <div><span className="font-semibold">Precio:</span> {result.precio ?? "N/A"}</div>
          <div><span className="font-semibold">Tiempo:</span> {result.tiempo_ms ?? "N/A"} ms</div>
          <div className="break-all"><span className="font-semibold">URL:</span> {result.url}</div>
          <div className="break-all text-red-600">
            <span className="font-semibold">Error:</span> {result.error ?? "—"}
          </div>
        </div>
      )}
    </main>
  );
}