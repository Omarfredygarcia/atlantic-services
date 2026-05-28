"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tienda = {
  id: string;
  nombre: string;
  url: string | null;
  activo: boolean;
};

type CatalogoItem = {
  id: string;
  material: string;
  search_query: string | null;
  precio_source: string;
  tienda_id: string;
};

type ScraperResult = {
  status?: string;
  precio?: number | null;
  price_found?: boolean;
  price_strategy?: string;
  fuente?: string;
  url?: string | null;
  tiempo_ms?: number | null;
  captcha_detected?: boolean;
  title?: string;
  html_length?: number;
  search_term_present?: boolean;
  results_match?: boolean;
  first_product_match?: boolean;
  price_context?: string;
  snippet?: string;
  message?: string;
  error?: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RAILWAY_BASE = process.env.NEXT_PUBLIC_RAILWAY_RPA_URL || "";

const supabase = createClient();

/** Construye la URL de búsqueda según el dominio de la tienda */
function buildSearchUrl(tiendaUrl: string | null, term: string): string {
  if (!tiendaUrl) return "";
  const t = term.trim();
  if (!t) return tiendaUrl;

  try {
    const host = new URL(tiendaUrl).hostname.replace("www.", "");

    if (host.includes("menards.com"))
      return `https://www.menards.com/main/search.html?search=${encodeURIComponent(t)}`;
    if (host.includes("homedepot.com"))
      return `https://www.homedepot.com/s/${encodeURIComponent(t)}`;
    if (host.includes("lowes.com"))
      return `https://www.lowes.com/search?searchTerm=${encodeURIComponent(t)}`;
    if (host.includes("84lumber.com"))
      return `https://www.84lumber.com/search/?q=${encodeURIComponent(t)}`;
    if (host.includes("acehardware.com"))
      return `https://www.acehardware.com/search#q=${encodeURIComponent(t)}`;

    // Fallback genérico: agrega ?q=term a la URL base
    return tiendaUrl.includes("?")
      ? `${tiendaUrl}&q=${encodeURIComponent(t)}`
      : `${tiendaUrl}?q=${encodeURIComponent(t)}`;
  } catch {
    return tiendaUrl;
  }
}

function estrategiaLabel(s?: string) {
  if (!s) return "—";
  const map: Record<string, string> = {
    "edlp": "EDLP (precio oficial)",
    "json-ld": "JSON-LD (datos estructurados)",
    "fallback-primer-dolar": "Fallback $ (menos confiable)",
  };
  return map[s] ?? s;
}

function estrategiaColor(s?: string) {
  if (s === "edlp") return "#22c55e";
  if (s === "json-ld") return "#f59e0b";
  if (s?.startsWith("fallback")) return "#ef4444";
  return "#94a3b8";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestScraperPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [tiendaId, setTiendaId] = useState<string>("");
  const [materialId, setMaterialId] = useState<string>("");
  const [term, setTerm] = useState("");
  const [searchUrl, setSearchUrl] = useState("");
  const [result, setResult] = useState<ScraperResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // ── Carga tiendas al montar
  useEffect(() => {
    async function loadTiendas() {
      const { data } = await supabase
        .from("tiendas")
        .select("id, nombre, url, activo")
        .eq("activo", true)
        .order("nombre");
      if (data) setTiendas(data);
      setLoadingData(false);
    }
    loadTiendas();
  }, []);

  // ── Carga catálogo cuando cambia tienda
  useEffect(() => {
    if (!tiendaId) {
      setCatalogo([]);
      setMaterialId("");
      return;
    }
    async function loadCatalogo() {
      const { data } = await supabase
        .from("catalogo")
        .select("id, material, search_query, precio_source, tienda_id")
        .eq("tienda_id", tiendaId)
        .eq("activo", true)
        .order("material");
      if (data) setCatalogo(data);
      setMaterialId("");
      setTerm("");
      setSearchUrl("");
    }
    loadCatalogo();
  }, [tiendaId]);

  // ── Al cambiar material: pre-carga search_query y construye URL
  useEffect(() => {
    const item = catalogo.find((c) => c.id === materialId);
    if (!item) return;
    const sq = item.search_query || "";
    setTerm(sq);
    const tienda = tiendas.find((t) => t.id === tiendaId);
    setSearchUrl(buildSearchUrl(tienda?.url ?? null, sq));
  }, [materialId]);

  // ── Reconstruye URL cuando cambia term manualmente
  const tiendaActual = tiendas.find((t) => t.id === tiendaId);

  function handleTermChange(v: string) {
    setTerm(v);
    setSearchUrl(buildSearchUrl(tiendaActual?.url ?? null, v));
  }

  async function run() {
    if (!searchUrl.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const qs = new URLSearchParams({
        base_url: searchUrl,
        term: term,
        modo: "scrapingbee",
        debug: "1",
      });

      const res = await fetch(`${RAILWAY_BASE}/test-scraper?${qs.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ error: e?.message || "Error desconocido" });
    } finally {
      setLoading(false);
    }
  }

  const materialActual = catalogo.find((c) => c.id === materialId);
  const precioFmt = result?.precio != null ? `$${result.precio.toFixed(2)}` : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
        padding: "2rem",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2rem", borderBottom: "1px solid #1e3a5f", paddingBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              boxShadow: "0 0 8px #22c55e",
            }}
          />
          <span style={{ fontSize: "0.7rem", color: "#64748b", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Atlantic Services — Scraper Sandbox
          </span>
        </div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "0.4rem", color: "#f1f5f9" }}>
          Test Scraper de Precios
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", maxWidth: 960 }}>

        {/* ── Panel izquierdo: configuración ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Tienda */}
          <div style={fieldWrap}>
            <label style={labelStyle}>
              <span style={dotStyle("#3b82f6")} /> Tienda
            </label>
            {loadingData ? (
              <div style={skeletonStyle} />
            ) : (
              <select
                style={selectStyle}
                value={tiendaId}
                onChange={(e) => { setTiendaId(e.target.value); setResult(null); }}
              >
                <option value="">— seleccionar tienda —</option>
                {tiendas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            )}
            {tiendaActual?.url && (
              <div style={{ fontSize: "0.68rem", color: "#475569", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tiendaActual.url}
              </div>
            )}
          </div>

          {/* Material */}
          <div style={fieldWrap}>
            <label style={labelStyle}>
              <span style={dotStyle("#a78bfa")} /> Material del catálogo
            </label>
            <select
              style={{ ...selectStyle, opacity: !tiendaId ? 0.4 : 1 }}
              value={materialId}
              disabled={!tiendaId}
              onChange={(e) => { setMaterialId(e.target.value); setResult(null); }}
            >
              <option value="">— seleccionar material —</option>
              {catalogo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.material} [{c.precio_source}]
                </option>
              ))}
            </select>
            {materialActual && (
              <div style={{ fontSize: "0.68rem", color: "#475569", marginTop: 4 }}>
                precio_source: <span style={{ color: "#f59e0b" }}>{materialActual.precio_source}</span>
              </div>
            )}
          </div>

          {/* Search query / término */}
          <div style={fieldWrap}>
            <label style={labelStyle}>
              <span style={dotStyle("#34d399")} /> Search query (editable)
            </label>
            <input
              style={inputStyle}
              value={term}
              onChange={(e) => handleTermChange(e.target.value)}
              placeholder="ej: 1/2 x 4 x 12 Lightweight Drywall"
            />
          </div>

          {/* URL construida — editable */}
          <div style={fieldWrap}>
            <label style={labelStyle}>
              <span style={dotStyle("#fb923c")} /> URL de búsqueda (editable)
            </label>
            <textarea
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 64,
                fontSize: "0.72rem",
                lineHeight: 1.5,
              }}
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              placeholder="Se construye automáticamente al seleccionar tienda + material"
            />
            <div style={{ fontSize: "0.65rem", color: "#334155", marginTop: 2 }}>
              Puedes editar la URL manualmente para afinar la búsqueda
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button
              style={{
                ...btnStyle,
                backgroundColor: "#1e3a5f",
                color: "#64748b",
                cursor: "not-allowed",
                border: "1px solid #1e3a5f",
                position: "relative",
              }}
              disabled
              title="Playwright requiere Chromium instalado en el servidor. Pendiente de resolver en próxima sesión."
            >
              🎭 Playwright
              <span style={{
                position: "absolute", top: -8, right: -8,
                fontSize: "0.55rem", backgroundColor: "#334155",
                color: "#94a3b8", padding: "1px 5px", borderRadius: 4,
                letterSpacing: "0.05em",
              }}>PRONTO</span>
            </button>

            <button
              style={{
                ...btnStyle,
                backgroundColor: loading ? "#052e16" : "#14532d",
                color: loading ? "#4ade80" : "#86efac",
                border: "1px solid #166534",
                cursor: loading || !searchUrl ? "not-allowed" : "pointer",
                opacity: !searchUrl ? 0.5 : 1,
                flex: 1,
              }}
              disabled={loading || !searchUrl}
              onClick={run}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                  Consultando...
                </span>
              ) : (
                "🐝 Probar ScrapingBee"
              )}
            </button>
          </div>
        </div>

        {/* ── Panel derecho: resultado ── */}
        <div style={{
          backgroundColor: "#0a1628",
          border: "1px solid #1e3a5f",
          borderRadius: 10,
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          minHeight: 400,
        }}>
          {!result && !loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "#1e3a5f", gap: "0.5rem",
            }}>
              <div style={{ fontSize: "2rem" }}>🐝</div>
              <div style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                Esperando consulta…
              </div>
            </div>
          )}

          {loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "0.75rem", color: "#3b82f6",
            }}>
              <div style={{ fontSize: "2rem", animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
              <div style={{ fontSize: "0.75rem", color: "#475569" }}>Enviando request a ScrapingBee…</div>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Precio — hero */}
              <div style={{
                textAlign: "center",
                padding: "1rem 0",
                borderBottom: "1px solid #1e3a5f",
              }}>
                {result.error ? (
                  <div>
                    <div style={{ fontSize: "1.8rem", color: "#ef4444" }}>✕</div>
                    <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 4 }}>{result.error}</div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      fontSize: "2.5rem",
                      fontWeight: 700,
                      color: result.price_found ? "#22c55e" : "#ef4444",
                      letterSpacing: "-0.02em",
                    }}>
                      {precioFmt ?? (result.price_found ? "?" : "Sin precio")}
                    </div>
                    <div style={{
                      fontSize: "0.7rem",
                      marginTop: 4,
                      color: estrategiaColor(result.price_strategy),
                    }}>
                      {estrategiaLabel(result.price_strategy)}
                    </div>
                  </>
                )}
              </div>

              {/* Campos de diagnóstico */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                {[
                  ["Status", result.status],
                  ["Fuente", result.fuente],
                  ["Tiempo", result.tiempo_ms != null ? `${result.tiempo_ms} ms` : null],
                  ["HTML length", result.html_length != null ? `${result.html_length.toLocaleString()} bytes` : null],
                  ["Título página", result.title],
                  ["Captcha detectado", result.captcha_detected != null ? (result.captcha_detected ? "⚠️ SÍ" : "✓ No") : null],
                  ["Término presente", result.search_term_present != null ? (result.search_term_present ? "✓ Sí" : "✗ No") : null],
                  ["Resultados coinciden", result.results_match != null ? (result.results_match ? "✓ Sí" : "✗ No") : null],
                  ["Primer producto OK", result.first_product_match != null ? (result.first_product_match ? "✓ Sí" : "✗ No") : null],
                ].map(([k, v]) =>
                  v != null ? (
                    <div key={String(k)} style={{ display: "flex", gap: "0.5rem", fontSize: "0.72rem" }}>
                      <span style={{ color: "#475569", minWidth: 150, flexShrink: 0 }}>{k}</span>
                      <span style={{ color: "#94a3b8", wordBreak: "break-all" }}>{String(v)}</span>
                    </div>
                  ) : null
                )}

                {result.price_context && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <div style={{ fontSize: "0.65rem", color: "#475569", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Price context
                    </div>
                    <div style={{
                      backgroundColor: "#0f1f38",
                      border: "1px solid #1e3a5f",
                      borderRadius: 6,
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.68rem",
                      color: "#7dd3fc",
                      wordBreak: "break-all",
                      maxHeight: 80,
                      overflowY: "auto",
                    }}>
                      {result.price_context}
                    </div>
                  </div>
                )}

                {result.url && (
                  <div style={{ marginTop: "0.25rem" }}>
                    <div style={{ fontSize: "0.65rem", color: "#475569", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      URL consultada
                    </div>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "0.65rem",
                        color: "#3b82f6",
                        wordBreak: "break-all",
                        textDecoration: "none",
                      }}
                    >
                      {result.url}
                    </a>
                  </div>
                )}

                {result.message && (
                  <div style={{
                    marginTop: "0.5rem",
                    fontSize: "0.7rem",
                    color: "#f59e0b",
                    backgroundColor: "#1c1a0a",
                    border: "1px solid #713f12",
                    borderRadius: 6,
                    padding: "0.5rem",
                  }}>
                    ⚠️ {result.message}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #0f172a; }
      `}</style>
    </main>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const fieldWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.68rem",
  color: "#475569",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
};

const baseInputStyle: React.CSSProperties = {
  backgroundColor: "#0a1628",
  border: "1px solid #1e3a5f",
  borderRadius: 6,
  padding: "0.5rem 0.75rem",
  color: "#cbd5e1",
  fontFamily: "inherit",
  fontSize: "0.8rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
};

const inputStyle: React.CSSProperties = { ...baseInputStyle };
const selectStyle: React.CSSProperties = { ...baseInputStyle };

const btnStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  borderRadius: 6,
  fontFamily: "inherit",
  fontSize: "0.78rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  border: "1px solid transparent",
  transition: "all 0.15s",
  position: "relative" as const,
};

const skeletonStyle: React.CSSProperties = {
  height: 36,
  backgroundColor: "#1e3a5f",
  borderRadius: 6,
  opacity: 0.4,
};

function dotStyle(color: string): React.CSSProperties {
  return {
    display: "inline-block",
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: color,
    flexShrink: 0,
  } as React.CSSProperties;
}
