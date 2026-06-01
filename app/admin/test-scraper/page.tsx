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
  product_url?: string | null;
  product_title?: string | null;
  match_score?: number | null;
  llamadas_scrapingbee?: number | null;
  tiempo_ms?: number | null;
  captcha_detected?: boolean;
  title?: string;
  html_length?: number;
  search_term_present?: boolean;
  results_match?: boolean;
  first_product_match?: boolean;
  price_context?: string;
  message?: string;
  error?: string | null;
};

// ─── Tiendas ScrapingBee (contrato Cláusula 2) ───────────────────────────────
// Solo estas van al sandbox — SerpApi (HomeDepot, Lowes, etc.) ya funciona en el motor

const SCRAPING_BEE_DOMAINS = ["menards.com", "flooranddecor.com"];

function buildSearchUrl(tiendaUrl: string | null, term: string): string {
  if (!tiendaUrl || !term.trim()) return tiendaUrl ?? "";
  const t = term.trim();
  try {
    const host = new URL(tiendaUrl).hostname.replace("www.", "");
    if (host.includes("menards.com"))
      return `https://www.menards.com/main/search.html?search=${encodeURIComponent(t)}`;
    if (host.includes("flooranddecor.com"))
      return `https://www.flooranddecor.com/search?q=${encodeURIComponent(t)}`;
    return `${tiendaUrl}?q=${encodeURIComponent(t)}`;
  } catch {
    return tiendaUrl;
  }
}

function isScrapingBeeTienda(url: string | null): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return SCRAPING_BEE_DOMAINS.some((d) => host.includes(d));
  } catch { return false; }
}

function estrategiaLabel(s?: string) {
  const map: Record<string, string> = {
    "edlp": "EDLP — precio oficial",
    "json-ld": "JSON-LD — datos estructurados",
    "fallback-primer-dolar": "Fallback $ — menos confiable",
  };
  return s ? (map[s] ?? s) : "—";
}

function scoreColor(score?: number | null) {
  if (score == null) return "#94a3b8";
  if (score >= 5) return "#4ade80";
  if (score >= 3) return "#fbbf24";
  return "#f87171";
}

function scoreLabel(score?: number | null) {
  if (score == null) return "";
  if (score >= 5) return "✓ Confiable";
  if (score >= 3) return "~ Aceptable";
  return "⚠ Posible error";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestScraperPage() {
  const [tiendas, setTiendas]         = useState<Tienda[]>([]);
  const [catalogo, setCatalogo]       = useState<CatalogoItem[]>([]);
  const [tiendaId, setTiendaId]       = useState("");
  const [materialId, setMaterialId]   = useState("");
  const [term, setTerm]               = useState("");
  const [searchUrl, setSearchUrl]     = useState("");
  const [result, setResult]           = useState<ScraperResult | null>(null);
  const [loading, setLoading]         = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dbError, setDbError]         = useState<string | null>(null);

  const RAILWAY_BASE = process.env.NEXT_PUBLIC_RAILWAY_RPA_URL ?? "";

  // ── Carga TODAS las tiendas activas, filtra en cliente las de ScrapingBee
  useEffect(() => {
    const supabase = createClient();
    async function load() {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("tiendas")
        .select("id, nombre, url, activo")
        .eq("activo", true)
        .order("nombre");
      if (error) { setDbError(error.message); setLoadingData(false); return; }
      const filtradas = (data ?? []).filter((t) => isScrapingBeeTienda(t.url));
      setTiendas(filtradas);
      setLoadingData(false);
    }
    load();
  }, []);

  // ── Catálogo por tienda — filtra solo materiales scrapingbee
  useEffect(() => {
    if (!tiendaId) { setCatalogo([]); setMaterialId(""); return; }
    const supabase = createClient();
    async function load() {
      const { data, error } = await supabase
        .from("catalogo")
        .select("id, material, search_query, precio_source, tienda_id")
        .eq("tienda_id", tiendaId)
        .eq("activo", true)
        .order("material");
      if (!error && data) setCatalogo(data);
      setMaterialId(""); setTerm(""); setSearchUrl("");
    }
    load();
  }, [tiendaId]);

  // ── Pre-carga search_query al seleccionar material
  useEffect(() => {
    const item = catalogo.find((c) => c.id === materialId);
    if (!item) return;
    const sq = item.search_query ?? "";
    setTerm(sq);
    const tienda = tiendas.find((t) => t.id === tiendaId);
    setSearchUrl(buildSearchUrl(tienda?.url ?? null, sq));
  }, [materialId]);

  const tiendaActual   = tiendas.find((t) => t.id === tiendaId);
  const materialActual = catalogo.find((c) => c.id === materialId);

  function handleTermChange(v: string) {
    setTerm(v);
    setSearchUrl(buildSearchUrl(tiendaActual?.url ?? null, v));
  }

  async function run() {
    if (!searchUrl.trim()) return;
    setLoading(true); setResult(null);
    try {
      const qs = new URLSearchParams({ base_url: searchUrl, term, modo: "scrapingbee", debug: "1" });
      const res = await fetch(`${RAILWAY_BASE}/test-scraper?${qs}`, { cache: "no-store" });
      setResult(await res.json());
    } catch (e: any) {
      setResult({ error: e?.message ?? "Error desconocido" });
    } finally { setLoading(false); }
  }

  const precioFmt = result?.precio != null ? `$${result.precio.toFixed(2)}` : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.dot} />
          <span style={styles.headerSub}>Atlantic Services · Scraper Sandbox · ScrapingBee</span>
        </div>
        <h1 style={styles.h1}>Test Scraper de Precios</h1>
        <p style={styles.headerDesc}>
          Herramienta de validación para las tiendas que usan ScrapingBee —
          <strong style={{ color: "#93c5fd" }}> Menards</strong> y
          <strong style={{ color: "#93c5fd" }}> Floor & Decor</strong>.
          SerpApi (Home Depot, Lowe's, etc.) ya opera en el motor principal.
        </p>
      </div>

      {dbError && (
        <div style={styles.errorBanner}>
          ⛔ Error conectando a Supabase: {dbError}
        </div>
      )}

      <div style={styles.grid}>

        {/* ── Panel izquierdo ── */}
        <div style={styles.panel}>

          {/* Tienda */}
          <Field label="Tienda" color="#60a5fa">
            {loadingData ? (
              <div style={styles.skeleton} />
            ) : tiendas.length === 0 ? (
              <div style={styles.emptyMsg}>
                {dbError ? "Error de conexión ↑" : "No hay tiendas ScrapingBee activas en la BD.\nVerifica que Menards / Floor & Decor estén en la tabla tiendas con activo=true."}
              </div>
            ) : (
              <select
                style={styles.select}
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
              <div style={styles.hint}>{tiendaActual.url}</div>
            )}
          </Field>

          {/* Material */}
          <Field label="Material del catálogo" color="#a78bfa">
            <select
              style={{ ...styles.select, opacity: !tiendaId ? 0.45 : 1 }}
              value={materialId}
              disabled={!tiendaId}
              onChange={(e) => { setMaterialId(e.target.value); setResult(null); }}
            >
              <option value="">— seleccionar material —</option>
              {catalogo.map((c) => (
                <option key={c.id} value={c.id}>{c.material}</option>
              ))}
            </select>
            {materialActual && (
              <div style={styles.hint}>
                precio_source: <span style={{ color: "#fbbf24" }}>{materialActual.precio_source}</span>
                {materialActual.precio_source !== "scrapingbee" && (
                  <span style={{ color: "#f87171", marginLeft: 8 }}>⚠ no es scrapingbee</span>
                )}
              </div>
            )}
          </Field>

          {/* Search query */}
          <Field label="Search query (editable)" color="#34d399">
            <input
              style={styles.input}
              value={term}
              onChange={(e) => handleTermChange(e.target.value)}
              placeholder="ej: Charlotte Pipe 4 in x 10 ft PVC Sewer Drain Pipe"
            />
            <div style={styles.hint}>Sin comillas, sin símbolos ®™, usar "in" y "ft" en lugar de " y '</div>
          </Field>

          {/* URL */}
          <Field label="URL de búsqueda (editable)" color="#fb923c">
            <textarea
              style={{ ...styles.input, resize: "vertical", minHeight: 72, fontSize: 13, lineHeight: 1.55 }}
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              placeholder="Se construye automáticamente al seleccionar tienda + material"
            />
            <div style={styles.hint}>Editable — pega una URL directa de producto para hacer 1 sola llamada</div>
          </Field>

          {/* Botones */}
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button style={styles.btnDisabled} disabled>
              🎭 Playwright
              <span style={styles.pronto}>PRONTO</span>
            </button>
            <button
              style={{
                ...styles.btn,
                opacity: !searchUrl || loading ? 0.5 : 1,
                cursor: !searchUrl || loading ? "not-allowed" : "pointer",
              }}
              disabled={!searchUrl || loading}
              onClick={run}
            >
              {loading
                ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Spin />Consultando…</span>
                : "🐝 Probar ScrapingBee"
              }
            </button>
          </div>

          {/* Credits reminder */}
          <div style={styles.creditBox}>
            🐝 <strong>Créditos ScrapingBee:</strong> ~525 restantes → ~260 pruebas de 2 llamadas.
            Máx 15 pruebas Menards + 5-10 Floor & Decor antes de ampliar plan.
          </div>
        </div>

        {/* ── Panel derecho: resultado ── */}
        <div style={styles.resultPanel}>
          {!result && !loading && (
            <div style={styles.waitState}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🐝</div>
              <div style={{ color: "#475569", fontSize: 14 }}>Esperando consulta…</div>
              <div style={{ color: "#1e3a5f", fontSize: 12, marginTop: 8, maxWidth: 220, textAlign: "center" }}>
                Selecciona tienda → material → presiona Probar ScrapingBee
              </div>
            </div>
          )}

          {loading && (
            <div style={styles.waitState}>
              <Spin size={36} />
              <div style={{ color: "#60a5fa", fontSize: 14, marginTop: 16 }}>Consultando ScrapingBee…</div>
              <div style={{ color: "#475569", fontSize: 12, marginTop: 6 }}>~13-15 seg (2 llamadas)</div>
            </div>
          )}

          {result && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>

              {/* Precio hero */}
              <div style={styles.priceHero}>
                {result.error ? (
                  <>
                    <div style={{ fontSize: 40, color: "#f87171" }}>✕</div>
                    <div style={{ color: "#f87171", fontSize: 14, marginTop: 6 }}>{result.error}</div>
                  </>
                ) : (
                  <>
                    <div style={{
                      fontSize: 56,
                      fontWeight: 700,
                      color: result.price_found ? "#4ade80" : "#f87171",
                      letterSpacing: "-2px",
                      lineHeight: 1,
                    }}>
                      {precioFmt ?? (result.price_found ? "?" : "Sin precio")}
                    </div>
                    <div style={{
                      fontSize: 13,
                      marginTop: 8,
                      color: result.price_strategy === "edlp" ? "#4ade80"
                           : result.price_strategy === "json-ld" ? "#fbbf24"
                           : result.price_strategy?.startsWith("fallback") ? "#f87171"
                           : "#64748b",
                    }}>
                      {estrategiaLabel(result.price_strategy)}
                    </div>
                  </>
                )}
              </div>

              {/* Producto encontrado */}
              {result.product_title && (
                <div style={styles.productBlock}>
                  <div style={styles.blockLabel}>Producto seleccionado por el robot</div>
                  <div style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>
                    {result.product_title}
                  </div>
                  <div style={{ display: "flex", gap: 24 }}>
                    {result.match_score != null && (
                      <div>
                        <span style={{ color: "#64748b", fontSize: 12 }}>Match score  </span>
                        <span style={{ color: scoreColor(result.match_score), fontSize: 16, fontWeight: 700 }}>
                          {result.match_score}
                        </span>
                        <span style={{ color: scoreColor(result.match_score), fontSize: 12, marginLeft: 6 }}>
                          {scoreLabel(result.match_score)}
                        </span>
                      </div>
                    )}
                    {result.llamadas_scrapingbee != null && (
                      <div>
                        <span style={{ color: "#64748b", fontSize: 12 }}>Llamadas  </span>
                        <span style={{ color: "#94a3b8", fontSize: 16, fontWeight: 700 }}>
                          {result.llamadas_scrapingbee}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Diagnóstico */}
              <div style={styles.diagBlock}>
                <div style={styles.blockLabel}>Diagnóstico</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([
                    ["Status",            result.status],
                    ["Tiempo",            result.tiempo_ms != null ? `${result.tiempo_ms} ms` : null],
                    ["HTML",              result.html_length != null ? `${result.html_length.toLocaleString()} bytes` : null],
                    ["Captcha",           result.captcha_detected != null ? (result.captcha_detected ? "⚠️ Detectado" : "✓ Limpio") : null],
                    ["Término presente",  result.search_term_present != null ? (result.search_term_present ? "✓ Sí" : "✗ No") : null],
                    ["Resultados OK",     result.results_match != null ? (result.results_match ? "✓ Sí" : "✗ No") : null],
                  ] as [string, string | null | undefined][]).map(([k, v]) =>
                    v != null ? (
                      <div key={k} style={{ display: "flex", gap: 8 }}>
                        <span style={{ color: "#64748b", fontSize: 13, minWidth: 140 }}>{k}</span>
                        <span style={{ color: "#cbd5e1", fontSize: 13 }}>{v}</span>
                      </div>
                    ) : null
                  )}
                </div>

                {result.price_context && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ ...styles.blockLabel, marginBottom: 4 }}>Price context</div>
                    <div style={styles.codeBox}>{result.price_context}</div>
                  </div>
                )}

                {(result.product_url ?? result.url) && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ ...styles.blockLabel, marginBottom: 4 }}>URL consultada</div>
                    <a href={result.product_url ?? result.url ?? ""} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: "#60a5fa", wordBreak: "break-all" }}>
                      {result.product_url ?? result.url}
                    </a>
                  </div>
                )}

                {result.message && (
                  <div style={styles.warnBox}>⚠️ {result.message}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Field({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: color, display: "inline-block", flexShrink: 0 }} />
        {label}
      </label>
      {children}
    </div>
  );
}

function Spin({ size = 20 }: { size?: number }) {
  return <span style={{ fontSize: size, display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const base = {
  fontFamily: "'DM Mono', 'Fira Code', monospace",
  fontSize: 14,
  backgroundColor: "#0a1628",
  border: "1px solid #1e3a5f",
  borderRadius: 8,
  color: "#e2e8f0",
  padding: "10px 14px",
  width: "100%",
  boxSizing: "border-box" as const,
  outline: "none",
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#080f1e",
    color: "#e2e8f0",
    fontFamily: "'DM Mono', 'Fira Code', monospace",
    padding: "2.5rem 2rem",
  },
  header: {
    marginBottom: 32,
    paddingBottom: 20,
    borderBottom: "1px solid #1e3a5f",
  },
  dot: {
    width: 12, height: 12, borderRadius: "50%",
    backgroundColor: "#22c55e", boxShadow: "0 0 10px #22c55e55",
  },
  headerSub: { fontSize: 11, color: "#475569", letterSpacing: "0.16em", textTransform: "uppercase" },
  h1: { fontSize: 28, fontWeight: 700, margin: "8px 0 6px", color: "#f8fafc" },
  headerDesc: { fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 },
  errorBanner: {
    backgroundColor: "#2d0a0a", border: "1px solid #7f1d1d", borderRadius: 8,
    padding: "12px 16px", color: "#fca5a5", fontSize: 13, marginBottom: 20,
  },
  grid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1100,
  },
  panel: { display: "flex", flexDirection: "column", gap: 20 },
  select: { ...base, cursor: "pointer" },
  input:  { ...base },
  hint: { fontSize: 11, color: "#475569", marginTop: 2, lineHeight: 1.5 },
  skeleton: { height: 42, backgroundColor: "#1e3a5f", borderRadius: 8, opacity: 0.5 },
  emptyMsg: {
    fontSize: 12, color: "#ef4444", backgroundColor: "#1a0a0a",
    border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px",
    lineHeight: 1.6, whiteSpace: "pre-line",
  },
  btn: {
    flex: 1, padding: "12px 16px", borderRadius: 8,
    fontFamily: "'DM Mono', 'Fira Code', monospace",
    fontSize: 14, fontWeight: 700, letterSpacing: "0.04em",
    backgroundColor: "#14532d", color: "#86efac",
    border: "1px solid #166534", cursor: "pointer",
    transition: "all 0.15s",
  },
  btnDisabled: {
    padding: "12px 16px", borderRadius: 8,
    fontFamily: "'DM Mono', 'Fira Code', monospace",
    fontSize: 14, fontWeight: 600,
    backgroundColor: "#0f172a", color: "#334155",
    border: "1px solid #1e293b", cursor: "not-allowed",
    position: "relative",
  },
  pronto: {
    position: "absolute", top: -8, right: -8, fontSize: 9,
    backgroundColor: "#1e293b", color: "#64748b",
    padding: "2px 6px", borderRadius: 4, letterSpacing: "0.06em",
  },
  creditBox: {
    fontSize: 12, color: "#475569", backgroundColor: "#0a1628",
    border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px",
    lineHeight: 1.6,
  },
  resultPanel: {
    backgroundColor: "#0a1628", border: "1px solid #1e3a5f",
    borderRadius: 12, padding: "0", minHeight: 500, overflow: "hidden",
    display: "flex", flexDirection: "column",
  },
  waitState: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: 40,
  },
  priceHero: {
    textAlign: "center", padding: "32px 24px 24px",
    borderBottom: "1px solid #1e3a5f", backgroundColor: "#060d1a",
  },
  productBlock: {
    padding: "20px 24px", borderBottom: "1px solid #1e3a5f",
    backgroundColor: "#080f1e",
  },
  diagBlock: {
    padding: "20px 24px", flex: 1, overflow: "auto",
  },
  blockLabel: {
    fontSize: 10, color: "#475569", letterSpacing: "0.14em",
    textTransform: "uppercase", marginBottom: 10,
  },
  codeBox: {
    backgroundColor: "#060d1a", border: "1px solid #1e3a5f",
    borderRadius: 6, padding: "8px 12px", fontSize: 12,
    color: "#7dd3fc", wordBreak: "break-all", maxHeight: 80, overflowY: "auto",
  },
  warnBox: {
    marginTop: 12, fontSize: 13, color: "#fbbf24",
    backgroundColor: "#1c1500", border: "1px solid #713f12",
    borderRadius: 6, padding: "10px 12px", lineHeight: 1.5,
  },
};
