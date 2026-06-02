"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

// Instancia al nivel de módulo — igual que en el resto de la app
const supabase = createClient();

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
  price_context?: string;
  message?: string;
  error?: string | null;
};

// ─── Tiendas ScrapingBee según Cláusula 2 del contrato ───────────────────────
// SerpApi: Home Depot, Lowe's, ABC Supply, Builders FirstSource, ICC Floors Plus
// ScrapingBee: Menards, Floor & Decor, Richard's Supply

// FIX P0 — keywords de nombre, robusto ante variaciones de URL en BD
const SB_NOMBRES = ["menards", "floor", "richard"];

function buildSearchUrl(tiendaUrl: string | null, term: string): string {
  if (!tiendaUrl || !term.trim()) return tiendaUrl ?? "";
  const t = encodeURIComponent(term.trim());
  try {
    const host = new URL(tiendaUrl).hostname.replace("www.", "");
    if (host.includes("menards.com"))
      return `https://www.menards.com/main/search.html?search=${t}`;
    if (host.includes("flooranddecor.com"))
      return `https://www.flooranddecor.com/search?q=${t}`;
    if (host.includes("richardssupply.com"))
      return `https://www.richardssupply.com/search?q=${t}`;
    return `${tiendaUrl}?q=${t}`;
  } catch { return tiendaUrl; }
}

// buildSearchUrl por nombre de tienda (fallback cuando url es null o inválida)
function buildSearchUrlByNombre(nombre: string, term: string): string {
  if (!term.trim()) return "";
  const t = encodeURIComponent(term.trim());
  const n = nombre.toLowerCase();
  if (n.includes("menards"))  return `https://www.menards.com/main/search.html?search=${t}`;
  if (n.includes("floor"))    return `https://www.flooranddecor.com/search?q=${t}`;
  if (n.includes("richard"))  return `https://www.richardssupply.com/search?q=${t}`;
  return "";
}

function getSearchUrl(tienda: Tienda | undefined, term: string): string {
  if (!tienda) return "";
  if (tienda.url) {
    try {
      new URL(tienda.url); // valida que sea URL real
      return buildSearchUrl(tienda.url, term);
    } catch { /* url inválida, caer al fallback */ }
  }
  return buildSearchUrlByNombre(tienda.nombre, term);
}

function estrategiaLabel(s?: string) {
  const map: Record<string, string> = {
    "edlp":                  "EDLP — precio oficial",
    "json-ld":               "JSON-LD — datos estructurados",
    "fallback-primer-dolar": "Fallback $ — menos confiable",
  };
  return s ? (map[s] ?? s) : "—";
}

function scoreColor(n?: number | null) {
  if (n == null) return "#94a3b8";
  return n >= 5 ? "#4ade80" : n >= 3 ? "#fbbf24" : "#f87171";
}
function scoreLabel(n?: number | null) {
  if (n == null) return "";
  return n >= 5 ? "✓ Confiable" : n >= 3 ? "~ Aceptable" : "⚠ Posible error";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestScraperPage() {
  const [todasTiendas, setTodasTiendas] = useState<Tienda[]>([]);
  const [tiendas, setTiendas]           = useState<Tienda[]>([]);
  const [catalogo, setCatalogo]         = useState<CatalogoItem[]>([]);
  const [tiendaId, setTiendaId]         = useState("");
  const [materialId, setMaterialId]     = useState("");
  const [term, setTerm]                 = useState("");
  const [searchUrl, setSearchUrl]       = useState("");
  const [result, setResult]             = useState<ScraperResult | null>(null);
  const [loading, setLoading]           = useState(false);
  const [loadingData, setLoadingData]   = useState(true);
  const [dbError, setDbError]           = useState<string | null>(null);
  const [dbRaw, setDbRaw]               = useState<string>("");

  const RAILWAY_BASE = process.env.NEXT_PUBLIC_RAILWAY_RPA_URL ?? "";

  // ── Carga tiendas — FIX P0: filtro por nombre, no por URL
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("tiendas")
        .select("id, nombre, url, activo")
        .eq("activo", true)
        .order("nombre");

      if (error) {
        setDbError(error.message);
        setLoadingData(false);
        return;
      }

      const raw = data ?? [];
      setTodasTiendas(raw);

      // Debug: muestra nombre=url para cada tienda recibida
      setDbRaw(
        `${raw.length} tiendas en BD: ` +
        raw.map(t => `${t.nombre}=${t.url ?? "null"}`).join(" | ")
      );

      // FIX P0 — filtro robusto por nombre (no depende de formato de URL en BD)
      const sb = raw.filter((t) =>
        SB_NOMBRES.some((k) => t.nombre.toLowerCase().includes(k))
      );
      setTiendas(sb);
      setLoadingData(false);
    }
    load();
  }, []);

  // ── Catálogo por tienda
  useEffect(() => {
    if (!tiendaId) { setCatalogo([]); setMaterialId(""); return; }
    async function load() {
      const { data } = await supabase
        .from("catalogo")
        .select("id, material, search_query, precio_source, tienda_id")
        .eq("tienda_id", tiendaId)
        .eq("activo", true)
        .order("material");
      setCatalogo(data ?? []);
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
    const t = tiendas.find((t) => t.id === tiendaId);
    setSearchUrl(getSearchUrl(t, sq));
  }, [materialId]);

  const tiendaActual   = tiendas.find((t) => t.id === tiendaId);
  const materialActual = catalogo.find((c) => c.id === materialId);

  function handleTermChange(v: string) {
    setTerm(v);
    setSearchUrl(getSearchUrl(tiendaActual, v));
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

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={S.led} />
          <span style={S.headerSub}>Atlantic Services · Scraper Sandbox · ScrapingBee</span>
        </div>
        <h1 style={S.h1}>Test Scraper de Precios</h1>
        <p style={S.headerDesc}>
          Sandbox exclusivo para tiendas <strong style={{ color: "#93c5fd" }}>ScrapingBee</strong>:
          Menards, Floor & Decor, Richard's Supply.
          Las tiendas SerpApi (Home Depot, Lowe's…) operan directo en el motor.
        </p>
      </div>

      {/* Error Supabase */}
      {dbError && (
        <div style={S.errorBanner}>
          ⛔ <strong>Error Supabase:</strong> {dbError}
        </div>
      )}

      {/* Debug — visible mientras se resuelve el problema de tiendas */}
      {!loadingData && (
        <div style={S.debugBanner}>
          🔍 <strong>Debug BD:</strong> {dbRaw || "(sin datos)"}
          {todasTiendas.length > 0 && tiendas.length === 0 && (
            <span style={{ color: "#f87171", marginLeft: 12 }}>
              ← Hay {todasTiendas.length} tiendas en BD pero ninguna tiene nombre
              que incluya "menards", "floor" o "richard". Verifica los nombres en Supabase.
            </span>
          )}
          {tiendas.length > 0 && (
            <span style={{ color: "#4ade80", marginLeft: 12 }}>
              ← ✓ {tiendas.length} tiendas ScrapingBee detectadas: {tiendas.map(t => t.nombre).join(", ")}
            </span>
          )}
        </div>
      )}

      <div style={S.grid}>

        {/* Panel izquierdo */}
        <div style={S.leftPanel}>

          <Field label="Tienda" color="#60a5fa">
            {loadingData ? <Skeleton /> : tiendas.length === 0 ? (
              <div style={S.emptyMsg}>
                {dbError
                  ? "Error de conexión — ver banner arriba."
                  : "No se encontraron tiendas ScrapingBee activas.\nVer debug arriba para más detalle."}
              </div>
            ) : (
              <select style={S.select} value={tiendaId}
                onChange={(e) => { setTiendaId(e.target.value); setResult(null); }}>
                <option value="">— seleccionar tienda —</option>
                {tiendas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            )}
            {tiendaActual?.url && <div style={S.hint}>{tiendaActual.url}</div>}
          </Field>

          <Field label="Material del catálogo" color="#a78bfa">
            <select style={{ ...S.select, opacity: !tiendaId ? 0.4 : 1 }}
              value={materialId} disabled={!tiendaId}
              onChange={(e) => { setMaterialId(e.target.value); setResult(null); }}>
              <option value="">— seleccionar material —</option>
              {catalogo.map((c) => <option key={c.id} value={c.id}>{c.material}</option>)}
            </select>
            {materialActual && (
              <div style={S.hint}>
                precio_source: <span style={{ color: "#fbbf24" }}>{materialActual.precio_source}</span>
                {materialActual.precio_source !== "scrapingbee" &&
                  <span style={{ color: "#f87171", marginLeft: 8 }}>⚠ no es scrapingbee</span>}
              </div>
            )}
          </Field>

          <Field label="Search query (editable)" color="#34d399">
            <input style={S.input} value={term}
              onChange={(e) => handleTermChange(e.target.value)}
              placeholder="ej: Charlotte Pipe 4 in x 10 ft PVC Sewer Drain Pipe" />
            <div style={S.hint}>Sin comillas ni ® ™ — usar "in" y "ft" en lugar de " y '</div>
          </Field>

          <Field label="URL de búsqueda (editable)" color="#fb923c">
            <textarea style={{ ...S.input, resize: "vertical", minHeight: 76, fontSize: 13, lineHeight: 1.55 }}
              value={searchUrl} onChange={(e) => setSearchUrl(e.target.value)}
              placeholder="Se construye automáticamente al seleccionar tienda + material" />
            <div style={S.hint}>Pega URL directa de producto para 1 sola llamada ScrapingBee</div>
          </Field>

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button style={S.btnOff} disabled>
              🎭 Playwright
              <span style={S.pronto}>PRONTO</span>
            </button>
            <button
              style={{ ...S.btn, opacity: !searchUrl || loading ? 0.5 : 1, cursor: !searchUrl || loading ? "not-allowed" : "pointer" }}
              disabled={!searchUrl || loading} onClick={run}>
              {loading
                ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Spin />Consultando…</span>
                : "🐝 Probar ScrapingBee"}
            </button>
          </div>

          <div style={S.creditBox}>
            🐝 <strong>Créditos ScrapingBee:</strong> ~525 restantes → ~260 pruebas de 2 llamadas.
            Máx 15 pruebas Menards + 5-10 Floor & Decor antes de ampliar plan.
          </div>

        </div>

        {/* Panel derecho */}
        <div style={S.resultPanel}>

          {!result && !loading && (
            <div style={S.center}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🐝</div>
              <div style={{ color: "#475569", fontSize: 15 }}>Esperando consulta…</div>
              <div style={{ color: "#1e3a5f", fontSize: 12, marginTop: 8, textAlign: "center", maxWidth: 220 }}>
                Selecciona tienda → material → presiona Probar ScrapingBee
              </div>
            </div>
          )}

          {loading && (
            <div style={S.center}>
              <Spin size={40} />
              <div style={{ color: "#60a5fa", fontSize: 15, marginTop: 18 }}>Consultando ScrapingBee…</div>
              <div style={{ color: "#475569", fontSize: 12, marginTop: 6 }}>~13-15 seg (2 llamadas)</div>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Precio hero */}
              <div style={S.priceHero}>
                {result.error ? (
                  <>
                    <div style={{ fontSize: 44, color: "#f87171" }}>✕</div>
                    <div style={{ color: "#f87171", fontSize: 14, marginTop: 8 }}>{result.error}</div>
                  </>
                ) : (
                  <>
                    <div style={{
                      fontSize: 64, fontWeight: 700, lineHeight: 1,
                      color: result.price_found ? "#4ade80" : "#f87171",
                      letterSpacing: "-2px",
                    }}>
                      {precioFmt ?? (result.price_found ? "?" : "Sin precio")}
                    </div>
                    <div style={{
                      fontSize: 14, marginTop: 10,
                      color: result.price_strategy === "edlp" ? "#4ade80"
                           : result.price_strategy === "json-ld" ? "#fbbf24"
                           : "#f87171",
                    }}>
                      {estrategiaLabel(result.price_strategy)}
                    </div>
                  </>
                )}
              </div>

              {/* Producto seleccionado */}
              {result.product_title && (
                <div style={S.productBlock}>
                  <div style={S.blockLabel}>Producto seleccionado por el robot</div>
                  <div style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.55, marginBottom: 12 }}>
                    {result.product_title}
                  </div>
                  <div style={{ display: "flex", gap: 28 }}>
                    {result.match_score != null && (
                      <div>
                        <span style={{ color: "#64748b", fontSize: 12 }}>Match score  </span>
                        <span style={{ color: scoreColor(result.match_score), fontSize: 22, fontWeight: 700 }}>
                          {result.match_score}
                        </span>
                        <span style={{ color: scoreColor(result.match_score), fontSize: 12, marginLeft: 6 }}>
                          {scoreLabel(result.match_score)}
                        </span>
                      </div>
                    )}
                    {result.llamadas_scrapingbee != null && (
                      <div>
                        <span style={{ color: "#64748b", fontSize: 12 }}>Llamadas SB  </span>
                        <span style={{ color: "#94a3b8", fontSize: 22, fontWeight: 700 }}>
                          {result.llamadas_scrapingbee}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Diagnóstico */}
              <div style={S.diagBlock}>
                <div style={S.blockLabel}>Diagnóstico</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {([
                    ["Status",           result.status],
                    ["Tiempo",           result.tiempo_ms != null ? `${result.tiempo_ms} ms` : null],
                    ["HTML",             result.html_length != null ? `${result.html_length.toLocaleString()} bytes` : null],
                    ["Captcha",          result.captcha_detected != null ? (result.captcha_detected ? "⚠️ Detectado" : "✓ Limpio") : null],
                    ["Término presente", result.search_term_present != null ? (result.search_term_present ? "✓ Sí" : "✗ No") : null],
                  ] as [string, string | null | undefined][]).map(([k, v]) =>
                    v != null ? (
                      <div key={k} style={{ display: "flex", gap: 12 }}>
                        <span style={{ color: "#64748b", fontSize: 13, minWidth: 148 }}>{k}</span>
                        <span style={{ color: "#cbd5e1", fontSize: 13 }}>{v}</span>
                      </div>
                    ) : null
                  )}
                </div>

                {result.price_context && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ ...S.blockLabel, marginBottom: 6 }}>Price context</div>
                    <div style={S.codeBox}>{result.price_context}</div>
                  </div>
                )}

                {(result.product_url ?? result.url) && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ ...S.blockLabel, marginBottom: 6 }}>URL consultada</div>
                    <a href={result.product_url ?? result.url ?? ""} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: "#60a5fa", wordBreak: "break-all" }}>
                      {result.product_url ?? result.url}
                    </a>
                  </div>
                )}

                {result.message && (
                  <div style={S.warnBox}>⚠️ {result.message}</div>
                )}
              </div>
            </>
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

function Skeleton() {
  return <div style={{ height: 44, backgroundColor: "#1e3a5f", borderRadius: 8, opacity: 0.5 }} />;
}

function Spin({ size = 18 }: { size?: number }) {
  return <span style={{ fontSize: size, display: "inline-block", animation: "spin 0.8s linear infinite", lineHeight: 1 }}>⟳</span>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const base: React.CSSProperties = {
  fontFamily: "'DM Mono', 'Fira Code', monospace",
  fontSize: 14,
  backgroundColor: "#0a1628",
  border: "1px solid #1e3a5f",
  borderRadius: 8,
  color: "#e2e8f0",
  padding: "10px 14px",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

const S: Record<string, React.CSSProperties> = {
  page:        { minHeight: "100vh", backgroundColor: "#080f1e", color: "#e2e8f0", fontFamily: "'DM Mono','Fira Code',monospace", padding: "2.5rem 2rem" },
  header:      { marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #1e3a5f" },
  led:         { width: 12, height: 12, borderRadius: "50%", backgroundColor: "#22c55e", boxShadow: "0 0 10px #22c55e66" },
  headerSub:   { fontSize: 11, color: "#475569", letterSpacing: "0.16em", textTransform: "uppercase" },
  h1:          { fontSize: 28, fontWeight: 700, margin: "8px 0 6px", color: "#f8fafc" },
  headerDesc:  { fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 },
  errorBanner: { backgroundColor: "#2d0a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontSize: 13, marginBottom: 12 },
  debugBanner: { backgroundColor: "#0a1a10", border: "1px solid #14532d", borderRadius: 8, padding: "10px 16px", color: "#6ee7b7", fontSize: 12, marginBottom: 20, lineHeight: 1.6 },
  grid:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1100 },
  leftPanel:   { display: "flex", flexDirection: "column", gap: 20 },
  select:      { ...base, cursor: "pointer" },
  input:       { ...base },
  hint:        { fontSize: 11, color: "#475569", marginTop: 2, lineHeight: 1.5 },
  emptyMsg:    { fontSize: 12, color: "#f87171", backgroundColor: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", lineHeight: 1.6, whiteSpace: "pre-line" },
  btn:         { flex: 1, padding: "13px 16px", borderRadius: 8, fontFamily: "'DM Mono','Fira Code',monospace", fontSize: 14, fontWeight: 700, backgroundColor: "#14532d", color: "#86efac", border: "1px solid #166534", transition: "all 0.15s" },
  btnOff:      { padding: "13px 16px", borderRadius: 8, fontFamily: "'DM Mono','Fira Code',monospace", fontSize: 14, fontWeight: 600, backgroundColor: "#0f172a", color: "#334155", border: "1px solid #1e293b", cursor: "not-allowed", position: "relative" },
  pronto:      { position: "absolute", top: -8, right: -8, fontSize: 9, backgroundColor: "#1e293b", color: "#64748b", padding: "2px 6px", borderRadius: 4 },
  creditBox:   { fontSize: 12, color: "#475569", backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", lineHeight: 1.6 },
  resultPanel: { backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, minHeight: 500, display: "flex", flexDirection: "column", overflow: "hidden" },
  center:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 },
  priceHero:   { textAlign: "center", padding: "36px 24px 28px", borderBottom: "1px solid #1e3a5f", backgroundColor: "#060d1a" },
  productBlock:{ padding: "20px 24px", borderBottom: "1px solid #1e3a5f", backgroundColor: "#080f1e" },
  diagBlock:   { padding: "20px 24px", flex: 1, overflowY: "auto" },
  blockLabel:  { fontSize: 10, color: "#475569", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 },
  codeBox:     { backgroundColor: "#060d1a", border: "1px solid #1e3a5f", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#7dd3fc", wordBreak: "break-all", maxHeight: 80, overflowY: "auto" },
  warnBox:     { marginTop: 12, fontSize: 13, color: "#fbbf24", backgroundColor: "#1c1500", border: "1px solid #713f12", borderRadius: 6, padding: "10px 12px", lineHeight: 1.5 },
};
