"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

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

type Top5Item = { titulo: string; score: number; url: string };

type Step = {
  paso: number;
  accion: string;
  resultado?: string;
  detalle?: string;
  query?: string;
  total_resultados?: number;
  tienda_match?: string;
  titulo?: string;
  precio?: number;
  tiendas_presentes?: string[];
  url_busqueda?: string;
  total?: number;
  top5?: Top5Item[];
  url?: string;
  score?: number;
  estrategia?: string;
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
  store_detected?: string;
  steps?: Step[];
};

// ─── Constantes de tiendas ────────────────────────────────────────────────────
// Las 4 tiendas del contrato — filtro por nombre, robusto ante variaciones de URL en BD
// Cuando se migre a BD: agregar campo scraper_mode a tabla tiendas
const SB_NOMBRES = ["menards", "floor", "home depot", "lowe"];

// Modo de scraping por tienda:
//   serpapi   → SerpApi Google Shopping (Home Depot, Lowe's, Menards)
//   hybrid    → SerpApi URL + ScrapingBee precio (Floor & Decor)
//   scrapingbee → ScrapingBee 2 llamadas (Menards también soportado)
// El sandbox siempre llama modo=scrapingbee — el backend decide el flujo internamente.
// En el frontend solo usamos esto para mostrar el hint correcto al usuario.
const STORE_MODE: Record<string, "serpapi" | "hybrid" | "scrapingbee"> = {
  "home depot": "serpapi",
  "lowe":       "serpapi",
  "menards":    "scrapingbee",
  "floor":      "hybrid",
};

function getStoreMode(nombre: string): "serpapi" | "hybrid" | "scrapingbee" {
  const n = nombre.toLowerCase();
  for (const [key, mode] of Object.entries(STORE_MODE)) {
    if (n.includes(key)) return mode;
  }
  return "scrapingbee";
}

// ─── URL helpers ──────────────────────────────────────────────────────────────
// URLs hardcodeadas — estables, no cambian seguido.
// Cuando funcionen bien → migrar a campo search_url_pattern en tabla tiendas.
const STORE_SEARCH_URLS: Record<string, string> = {
  "homedepot":     "https://www.homedepot.com/s/",
  "lowes":         "https://www.lowes.com/search?searchTerm=",
  "menards":       "https://www.menards.com/main/search.html?search=",
  "flooranddecor": "https://www.flooranddecor.com/search?q=",
};

function buildSearchUrl(tiendaUrl: string | null, term: string): string {
  if (!tiendaUrl || !term.trim()) return tiendaUrl ?? "";
  const t = encodeURIComponent(term.trim());
  try {
    const host = new URL(tiendaUrl).hostname.replace("www.", "");
    if (host.includes("menards.com"))      return `https://www.menards.com/main/search.html?search=${t}`;
    if (host.includes("flooranddecor.com")) return `https://www.flooranddecor.com/search?q=${t}`;
    if (host.includes("homedepot.com"))    return `https://www.homedepot.com/s/${t}`;
    if (host.includes("lowes.com"))        return `https://www.lowes.com/search?searchTerm=${t}`;
    return `${tiendaUrl}?q=${t}`;
  } catch { return tiendaUrl; }
}

function buildSearchUrlByNombre(nombre: string, term: string): string {
  if (!term.trim()) return "";
  const t = encodeURIComponent(term.trim());
  const n = nombre.toLowerCase();
  if (n.includes("menards"))    return `https://www.menards.com/main/search.html?search=${t}`;
  if (n.includes("floor"))      return `https://www.flooranddecor.com/search?q=${t}`;
  if (n.includes("home depot")) return `https://www.homedepot.com/s/${t}`;
  if (n.includes("lowe"))       return `https://www.lowes.com/search?searchTerm=${t}`;
  return "";
}

function getSearchUrl(tienda: Tienda | undefined, term: string): string {
  if (!tienda) return "";
  if (tienda.url) {
    try {
      new URL(tienda.url);
      return buildSearchUrl(tienda.url, term);
    } catch { /* url inválida */ }
  }
  return buildSearchUrlByNombre(tienda.nombre, term);
}

// Floor & Decor: la URL de búsqueda la construye el backend internamente con
// SerpApi site:flooranddecor.com — no se necesita en el frontend.
// El campo searchUrl para F&D se usa solo para mostrar la tienda_url base.
function isFloorAndDecor(nombre: string): boolean {
  return nombre.toLowerCase().includes("floor");
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function estrategiaLabel(s?: string) {
  const map: Record<string, string> = {
    "edlp":                  "EDLP — precio oficial",
    "json-ld":               "JSON-LD — datos estructurados",
    "json-ld-offers":        "JSON-LD offers — datos estructurados",
    "fallback-primer-dolar": "Fallback $ — menos confiable",
    "google-shopping":       "Google Shopping",
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

function modeBadge(mode: "serpapi" | "hybrid" | "scrapingbee") {
  const cfg = {
    serpapi:     { label: "SerpApi",          bg: "#1e3a5f", color: "#93c5fd" },
    hybrid:      { label: "SerpApi + SB",     bg: "#1a1500", color: "#fbbf24" },
    scrapingbee: { label: "ScrapingBee",       bg: "#0a1a10", color: "#4ade80" },
  };
  const c = cfg[mode];
  return (
    <span style={{ fontSize: 13, backgroundColor: c.bg, color: c.color,
      padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 600 }}>
      {c.label}
    </span>
  );
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

  // ── Carga tiendas
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

      setDbRaw(
        `${raw.length} tiendas en BD: ` +
        raw.map(t => `${t.nombre}=${t.url ?? "null"}`).join(" | ")
      );

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
    // URL directa → Modo A (ScrapingBee directo). Texto → Modo B (construye /search?q=)
    setSearchUrl(sq.startsWith("http") ? sq : getSearchUrl(t, sq));
  }, [materialId]);

  const tiendaActual   = tiendas.find((t) => t.id === tiendaId);
  const materialActual = catalogo.find((c) => c.id === materialId);
  const storeMode      = tiendaActual ? getStoreMode(tiendaActual.nombre) : "scrapingbee";
  const esFD           = tiendaActual ? isFloorAndDecor(tiendaActual.nombre) : false;

  function handleTermChange(v: string) {
    setTerm(v);
    setSearchUrl(v.startsWith("http") ? v : getSearchUrl(tiendaActual, v));
  }

  async function run() {
    if (!term.trim() && !searchUrl.trim()) return;
    setLoading(true); setResult(null);
    try {
      // base_url = URL de búsqueda construida (todas las tiendas, incluyendo F&D)
      // Si base_url es URL directa de producto → backend salta SerpApi (1 llamada SB)
      const qs = new URLSearchParams({
        base_url: searchUrl || tiendaActual?.url || "",
        term,
        modo: "scrapingbee",
        debug: "1",
      });
      const res = await fetch(`${RAILWAY_BASE}/test-scraper?${qs}`, { cache: "no-store" });
      setResult(await res.json());
    } catch (e: any) {
      setResult({ error: e?.message ?? "Error desconocido" });
    } finally { setLoading(false); }
  }

  const canRun    = !!term.trim() && (!!searchUrl.trim() || esFD) && !loading;
  const precioFmt = result?.precio != null ? `$${result.precio.toFixed(2)}` : null;

  // ─── Render ────────────────────────────────────────────────────────────────

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
          Sandbox para las <strong style={{ color: "#93c5fd" }}>4 tiendas del contrato</strong>.
          {" "}Modo por tienda:{" "}
          <span style={{ color: "#4ade80" }}>Menards → ScrapingBee 2 llamadas</span>
          {" · "}
          <span style={{ color: "#fbbf24" }}>Floor & Decor → SerpApi URL + ScrapingBee precio (híbrido)</span>
          {" · "}
          <span style={{ color: "#93c5fd" }}>Home Depot / Lowe's → SerpApi directo</span>
        </p>
      </div>

      {/* Error Supabase */}
      {dbError && (
        <div style={S.errorBanner}>
          ⛔ <strong>Error Supabase:</strong> {dbError}
        </div>
      )}

      {/* Debug banner */}
      {!loadingData && (
        <div style={S.debugBanner}>
          🔍 <strong>Debug BD:</strong> {dbRaw || "(sin datos)"}
          {todasTiendas.length > 0 && tiendas.length === 0 && (
            <span style={{ color: "#f87171", marginLeft: 12 }}>
              ← Hay {todasTiendas.length} tiendas en BD pero ninguna coincide con los nombres esperados.
            </span>
          )}
          {tiendas.length > 0 && (
            <span style={{ color: "#4ade80", marginLeft: 12 }}>
              ← ✓ {tiendas.length} tiendas detectadas: {tiendas.map(t => t.nombre).join(", ")}
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
                  : "No se encontraron tiendas activas.\nVer debug arriba para más detalle."}
              </div>
            ) : (
              <select style={S.select} value={tiendaId}
                onChange={(e) => { setTiendaId(e.target.value); setResult(null); }}>
                <option value="">— seleccionar tienda —</option>
                {tiendas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            )}
            {tiendaActual && (
              <div style={S.hint}>
                {tiendaActual.url}
                {modeBadge(storeMode)}
              </div>
            )}
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

          <Field label="Search Query (editable)" color="#34d399">
            <input style={S.input} value={term}
              onChange={(e) => handleTermChange(e.target.value)}
              placeholder="ej: AquaGuard Performance Golden Road Waterproof Laminate Plank" />
            <div style={S.hint}>Sin comillas ni ® ™ — usar "in" y "ft" en lugar de " y '</div>
          </Field>

          {/* URL de búsqueda — editable para todas las tiendas */}
          <Field label="URL de búsqueda (editable)" color="#fb923c">
            <textarea style={{ ...S.input, resize: "vertical", minHeight: 76, fontSize: 13, lineHeight: 1.55 }}
              value={searchUrl} onChange={(e) => setSearchUrl(e.target.value)}
              placeholder="Se construye automáticamente al seleccionar tienda + material" />
            <div style={S.hint}>
              {esFD
                ? "Modo A: URL directa de producto → ScrapingBee directo (0 SerpApi) ✓ · Modo B: /search?q=... → SerpApi primero (puede fallar)"
                : "Pega URL directa de producto para 1 sola llamada ScrapingBee"}
            </div>
          </Field>

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button style={S.btnOff} disabled>
              🎭 Playwright
              <span style={S.pronto}>PRONTO</span>
            </button>
            <button
              style={{ ...S.btn,
                opacity: canRun ? 1 : 0.5,
                cursor: canRun ? "pointer" : "not-allowed",
                backgroundColor: esFD ? "#1a1500" : "#14532d",
                color: esFD ? "#fbbf24" : "#86efac",
                border: esFD ? "1px solid #713f12" : "1px solid #166534",
              }}
              disabled={!canRun} onClick={run}>
              {loading
                ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Spin />Consultando…</span>
                : esFD ? "🔀 Probar F&D Híbrido" : storeMode === "serpapi" ? "🔍 Probar SerpApi" : "🐝 Probar ScrapingBee"}
            </button>
          </div>

          <div style={S.creditBox}>
            🐝 <strong>Créditos ScrapingBee:</strong> ~525 restantes → ~260 pruebas de 2 llamadas.<br />
            F&D híbrido: 1 crédito SerpApi + 1 crédito SB por prueba.<br />
            Máx 15 pruebas Menards + 5-10 Floor & Decor antes de ampliar plan.
          </div>

        </div>

        {/* Panel derecho */}
        <div style={S.resultPanel}>

          {!result && !loading && (
            <div style={S.center}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🐝</div>
              <div style={{ color: "#94a3b8", fontSize: 15 }}>Esperando consulta…</div>
              <div style={{ color: "#64748b", fontSize: 14, marginTop: 8, textAlign: "center", maxWidth: 240 }}>
                Selecciona tienda → material → presiona el botón
              </div>
            </div>
          )}

          {loading && (
            <div style={S.center}>
              <Spin size={40} />
              <div style={{ color: esFD ? "#fbbf24" : "#60a5fa", fontSize: 15, marginTop: 18 }}>
                {esFD ? "Consultando F&D híbrido…" : "Consultando ScrapingBee…"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 6 }}>
                {esFD ? "SerpApi URL → ScrapingBee precio (~15 seg)" : "~13-15 seg (2 llamadas)"}
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Precio hero */}
              <div style={S.priceHero}>
                {result.error && !result.price_found ? (
                  <>
                    <div style={{ fontSize: 44, color: "#f87171" }}>✕</div>
                    <div style={{ color: "#f87171", fontSize: 16, marginTop: 8 }}>{result.message || result.error}</div>
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
                      fontSize: 16, marginTop: 10,
                      color: result.price_strategy === "edlp"             ? "#4ade80"
                           : result.price_strategy === "json-ld-offers"   ? "#4ade80"
                           : result.price_strategy === "json-ld"          ? "#fbbf24"
                           : result.price_strategy === "google-shopping"  ? "#93c5fd"
                           : "#f87171",
                    }}>
                      {estrategiaLabel(result.price_strategy)}
                    </div>
                    {result.fuente && (
                      <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 6 }}>
                        {result.fuente}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Producto seleccionado */}
              {result.product_title && (
                <div style={S.productBlock}>
                  <div style={S.blockLabel}>Producto seleccionado</div>
                  <div style={{ color: "#e2e8f0", fontSize: 16, lineHeight: 1.55, marginBottom: 12 }}>
                    {result.product_title}
                  </div>
                  <div style={{ display: "flex", gap: 28 }}>
                    {result.match_score != null && result.match_score > 0 && (
                      <div>
                        <span style={{ color: "#94a3b8", fontSize: 14 }}>Match score  </span>
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
                        <span style={{ color: "#94a3b8", fontSize: 14 }}>Llamadas SB  </span>
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
                    ["Tienda detectada", result.store_detected],
                    ["Tiempo",           result.tiempo_ms != null ? `${result.tiempo_ms} ms` : null],
                    ["HTML",             result.html_length != null && result.html_length > 0 ? `${result.html_length.toLocaleString()} bytes` : null],
                    ["Captcha",          result.captcha_detected != null ? (result.captcha_detected ? "⚠️ Detectado" : "✓ Limpio") : null],
                    ["Término presente", result.search_term_present != null ? (result.search_term_present ? "✓ Sí" : "✗ No") : null],
                  ] as [string, string | null | undefined][]).map(([k, v]) =>
                    v != null ? (
                      <div key={k} style={{ display: "flex", gap: 12 }}>
                        <span style={{ color: "#94a3b8", fontSize: 15, minWidth: 148 }}>{k}</span>
                        <span style={{ color: "#cbd5e1", fontSize: 15 }}>{v}</span>
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
                      style={{ fontSize: 14, color: "#60a5fa", wordBreak: "break-all" }}>
                      {result.product_url ?? result.url}
                    </a>
                  </div>
                )}

                {result.message && !result.price_found && (
                  <div style={S.warnBox}>⚠️ {result.message}</div>
                )}
              </div>

              {result.steps && result.steps.length > 0 && (
                <StepsTimeline steps={result.steps} />
              )}
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

// ─── Trazabilidad del bot ─────────────────────────────────────────────────────

const STEP_CFG: Record<string, { icon: string; label: string; bg: string; color: string }> = {
  detect_store:             { icon: "🏪", label: "Tienda detectada",       bg: "#0a1628", color: "#60a5fa" },
  motor:                    { icon: "⚙",  label: "Motor seleccionado",     bg: "#130d2a", color: "#a78bfa" },
  busqueda_google_shopping: { icon: "🔍", label: "Google Shopping",        bg: "#0a1628", color: "#38bdf8" },
  precio_encontrado:        { icon: "✅", label: "Precio encontrado",       bg: "#0a1a10", color: "#4ade80" },
  sin_match_tienda:         { icon: "⚠",  label: "Sin match en tienda",    bg: "#1c1500", color: "#fbbf24" },
  llamada_1_busqueda:       { icon: "🐝", label: "SB llamada 1 búsqueda",  bg: "#1a1500", color: "#fbbf24" },
  candidatos_encontrados:   { icon: "📋", label: "Candidatos",             bg: "#0a1628", color: "#93c5fd" },
  mejor_match:              { icon: "🎯", label: "Mejor match",             bg: "#0a1a10", color: "#34d399" },
  llamada_2_producto:       { icon: "🐝", label: "SB llamada 2 producto",  bg: "#1a1500", color: "#fbbf24" },
  precio_extraido:          { icon: "💰", label: "Precio extraído",         bg: "#0a1a10", color: "#4ade80" },
  sin_precio:               { icon: "✕",  label: "Sin precio",              bg: "#1a0808", color: "#f87171" },
  captcha_bloqueado:        { icon: "🚫", label: "Captcha bloqueado",       bg: "#1a0808", color: "#f87171" },
  excepcion:                { icon: "💥", label: "Excepción",               bg: "#1a0808", color: "#f87171" },
  modo_fd:                  { icon: "🔀", label: "Modo F&D",                bg: "#1a0d00", color: "#fb923c" },
  serpapi_site_fd:          { icon: "🔍", label: "SerpApi F&D",             bg: "#1a0d00", color: "#fb923c" },
  url_producto_encontrada:  { icon: "🔗", label: "URL producto",            bg: "#1a0d00", color: "#fb923c" },
  _default:                 { icon: "·",  label: "Paso",                    bg: "#0a1628", color: "#64748b" },
};

function renderStepDetail(s: Step): React.ReactNode {
  const d: React.CSSProperties = { fontSize: 13, color: "#94a3b8", marginTop: 3, lineHeight: 1.6 };
  const trunc = (str: string, n = 80) => str.length > n ? str.slice(0, n) + "…" : str;

  if (s.accion === "busqueda_google_shopping") return (
    <div style={d}>
      {s.query && <>Query: <span style={{ color: "#7dd3fc" }}>"{s.query}"</span></>}
      {s.total_resultados != null && <span style={{ marginLeft: 8 }}>· {s.total_resultados} resultados</span>}
    </div>
  );

  if (s.accion === "precio_encontrado") return (
    <div style={d}>
      {s.precio != null && <span style={{ color: "#4ade80", fontWeight: 600 }}>${s.precio.toFixed(2)}</span>}
      {s.tienda_match && <span style={{ marginLeft: 8 }}>· {s.tienda_match}</span>}
      {s.titulo && <div style={{ ...d, marginTop: 1 }}>{trunc(s.titulo, 70)}</div>}
    </div>
  );

  if (s.accion === "sin_match_tienda" && s.tiendas_presentes?.length) return (
    <div style={d}>Presentes: {s.tiendas_presentes.join(", ")}</div>
  );

  if (s.accion === "llamada_1_busqueda" && s.url_busqueda) return (
    <div style={{ ...d, wordBreak: "break-all" }}>{trunc(s.url_busqueda)}</div>
  );

  if (s.accion === "candidatos_encontrados") return (
    <div style={d}>
      {s.total != null && <span>{s.total} candidatos</span>}
      {s.top5?.length ? (
        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          {s.top5.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <span style={{ color: scoreColor(c.score), fontWeight: 600, minWidth: 14 }}>{c.score}</span>
              <span style={{ color: "#94a3b8" }}>{trunc(c.titulo, 60)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (s.accion === "mejor_match") return (
    <div style={d}>
      {s.score != null && <span style={{ color: scoreColor(s.score), fontWeight: 600 }}>score {s.score}</span>}
      {s.titulo && <span style={{ marginLeft: 8, color: "#94a3b8" }}>{trunc(s.titulo, 60)}</span>}
    </div>
  );

  if (s.accion === "llamada_2_producto" && s.url) return (
    <div style={{ ...d, wordBreak: "break-all" }}>{trunc(s.url)}</div>
  );

  if (s.accion === "precio_extraido") return (
    <div style={d}>
      {s.precio != null && <span style={{ color: "#4ade80", fontWeight: 600 }}>${s.precio.toFixed(2)}</span>}
      {s.estrategia && <span style={{ marginLeft: 8 }}>· <span style={{ color: "#7dd3fc" }}>{s.estrategia}</span></span>}
    </div>
  );

  if (s.accion === "serpapi_site_fd" && s.query) return (
    <div style={d}>Query: <span style={{ color: "#7dd3fc" }}>"{s.query}"</span></div>
  );

  if (s.accion === "url_producto_encontrada" && s.url) return (
    <div style={{ ...d, wordBreak: "break-all", color: "#fb923c" }}>{trunc(s.url)}</div>
  );

  if (s.detalle) return <div style={d}>{s.detalle}</div>;
  return null;
}

function StepsTimeline({ steps }: { steps: Step[] }) {
  return (
    <div style={{ padding: "20px 24px", borderTop: "1px solid #1e3a5f" }}>
      <div style={S.blockLabel}>Trazabilidad del bot</div>
      {steps.map((step, i) => {
        const cfg = STEP_CFG[step.accion] ?? STEP_CFG._default;
        const isLast = i === steps.length - 1;
        return (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ ...S.timelineDot, backgroundColor: cfg.bg, borderColor: cfg.color }}>
                <span style={{ fontSize: 10, lineHeight: 1 }}>{cfg.icon}</span>
              </div>
              {!isLast && <div style={S.timelineConnect} />}
            </div>
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14, paddingTop: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>#{step.paso}</span>
                <span style={{ fontSize: 14, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                {step.resultado && (
                  <span style={{ fontSize: 14, color: "#cbd5e1" }}>{step.resultado}</span>
                )}
              </div>
              {renderStepDetail(step)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const base: React.CSSProperties = {
  fontFamily: "'DM Mono', 'Fira Code', monospace",
  fontSize: 16,
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
  headerSub:   { fontSize: 13, color: "#94a3b8", letterSpacing: "0.16em", textTransform: "uppercase" },
  h1:          { fontSize: 28, fontWeight: 700, margin: "8px 0 6px", color: "#f8fafc" },
  headerDesc:  { fontSize: 15, color: "#94a3b8", lineHeight: 1.6, margin: 0 },
  errorBanner: { backgroundColor: "#2d0a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontSize: 15, marginBottom: 12 },
  debugBanner: { backgroundColor: "#0a1a10", border: "1px solid #14532d", borderRadius: 8, padding: "10px 16px", color: "#6ee7b7", fontSize: 14, marginBottom: 20, lineHeight: 1.6 },
  grid:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1100 },
  leftPanel:   { display: "flex", flexDirection: "column", gap: 20 },
  select:      { ...base, cursor: "pointer" },
  input:       { ...base },
  hint:        { fontSize: 13, color: "#94a3b8", marginTop: 2, lineHeight: 1.5, display: "flex", alignItems: "center" },
  emptyMsg:    { fontSize: 14, color: "#f87171", backgroundColor: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", lineHeight: 1.6, whiteSpace: "pre-line" },
  btn:         { flex: 1, padding: "13px 16px", borderRadius: 8, fontFamily: "'DM Mono','Fira Code',monospace", fontSize: 16, fontWeight: 700, transition: "all 0.15s" },
  btnOff:      { padding: "13px 16px", borderRadius: 8, fontFamily: "'DM Mono','Fira Code',monospace", fontSize: 16, fontWeight: 600, backgroundColor: "#0f172a", color: "#64748b", border: "1px solid #1e293b", cursor: "not-allowed", position: "relative" },
  pronto:      { position: "absolute", top: -8, right: -8, fontSize: 10, backgroundColor: "#1e293b", color: "#94a3b8", padding: "2px 6px", borderRadius: 4 },
  creditBox:   { fontSize: 14, color: "#94a3b8", backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", lineHeight: 1.8 },
  resultPanel: { backgroundColor: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, minHeight: 500, display: "flex", flexDirection: "column", overflow: "hidden" },
  center:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 },
  priceHero:   { textAlign: "center", padding: "36px 24px 28px", borderBottom: "1px solid #1e3a5f", backgroundColor: "#060d1a" },
  productBlock:{ padding: "20px 24px", borderBottom: "1px solid #1e3a5f", backgroundColor: "#080f1e" },
  diagBlock:   { padding: "20px 24px", flex: 1, overflowY: "auto" },
  blockLabel:  { fontSize: 12, color: "#94a3b8", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 },
  codeBox:     { backgroundColor: "#060d1a", border: "1px solid #1e3a5f", borderRadius: 6, padding: "8px 12px", fontSize: 14, color: "#7dd3fc", wordBreak: "break-all", maxHeight: 80, overflowY: "auto" },
  warnBox:     { marginTop: 12, fontSize: 15, color: "#fbbf24", backgroundColor: "#1c1500", border: "1px solid #713f12", borderRadius: 6, padding: "10px 12px", lineHeight: 1.5 },
  timelineDot:     { width: 16, height: 16, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center" } as React.CSSProperties,
  timelineConnect: { width: 2, backgroundColor: "#1e3a5f", flex: 1, marginTop: 4, minHeight: 10 } as React.CSSProperties,
};
