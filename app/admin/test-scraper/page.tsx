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
  store_zip?: string | null;
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

type ComparisonRow = {
  store: string;
  precio: number | null;
  product_title: string;
  match_score: number;
  winner: boolean;
};

type ScraperResult = {
  precio?: number | null;
  price_found?: boolean;
  price_strategy?: string;
  fuente?: string;
  product_url?: string | null;
  product_title?: string | null;
  match_score?: number | null;
  tiempo_ms?: number | null;
  error?: string | null;
  steps?: Step[];
  comparison?: ComparisonRow[];
};

// NOTA 2026-07-14: "serpapi" quedó deshabilitado en el backend (degradado a
// herramienta opcional de discovery de catálogo, ya no es parte del pipeline
// de cotización — ver rpa_service.py). El resto son los motores reales de
// producción, cada uno específico de UNA tienda — no es un menú libre, ver
// STORE_ENGINES más abajo.
type Modo = "apify" | "scrapingbee" | "oxylabs-menards" | "brightdata-lowes";

type EngineDef = {
  icon: string; label: string; hint: string; time: string;
  color: string; bg: string; border: string;
};

const ENGINE_DEFS: Record<Modo, EngineDef> = {
  apify: {
    icon: "🏠", label: "Apify", time: "~1-3 seg",
    hint: "Lookup real por product ID + ZIP — motor de producción, 6/6 histórico exacto",
    color: "#fdba74", bg: "#2e1a00", border: "#c2410c",
  },
  "brightdata-lowes": {
    icon: "🛒", label: "Bright Data", time: "~30-200 seg (a veces encola async)",
    hint: "Precio real de Lowe's — motor de producción, ~7-8/10 exacto (2026-07-14)",
    color: "#93c5fd", bg: "#0a1628", border: "#2563eb",
  },
  "oxylabs-menards": {
    icon: "🔧", label: "Oxylabs", time: "~10-30 seg",
    hint: "Precio EDLP real de Menards — motor de producción (2026-07-14)",
    color: "#c4b5fd", bg: "#1a0d2e", border: "#7c3aed",
  },
  scrapingbee: {
    icon: "🐝", label: "ScrapingBee", time: "~13-15 seg (2 llamadas)",
    hint: "Búsqueda de texto / URL directa Modo A — usado hoy solo para Floor & Decor",
    color: "#4ade80", bg: "#0a1a10", border: "#16a34a",
  },
};

// Qué motor(es) aplican por tienda -- el primero es el default al seleccionar.
// Motores que reciben URL directa de producto (no texto de búsqueda).
const STORE_ENGINES: Record<string, Modo[]> = {
  "Home Depot":    ["apify"],
  "Lowe's":        ["brightdata-lowes", "apify"],
  "Menards":       ["oxylabs-menards"],
  "Floor & Decor": ["scrapingbee"],
};
const URL_BASED_MODOS: Modo[] = ["apify", "oxylabs-menards", "brightdata-lowes"];

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function estrategiaLabel(s?: string) {
  const map: Record<string, string> = {
    "edlp":                    "EDLP — precio oficial",
    "json-ld":                 "JSON-LD — datos estructurados",
    "json-ld-offers":          "JSON-LD offers — datos estructurados",
    "fallback-primer-dolar":   "Fallback $ — menos confiable",
    "cache":                   "Caché 24h",
    "not_implemented":         "No implementado",
    "oxylabs-menards-edlp":    "Oxylabs — Menards EDLP",
    "brightdata-lowes":        "Bright Data — Lowe's",
    "apify-product-lookup":    "Apify — product lookup",
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

function getStatusBadge(result: ScraperResult): { label: string; bg: string; color: string; border: string } {
  if (result.price_strategy === "not_implemented") {
    return { label: "EN DESARROLLO", bg: "#1a0a00", color: "#fb923c", border: "#7c2d12" };
  }
  if (result.price_strategy === "cache") {
    return { label: "CACHÉ 24h", bg: "#0a1628", color: "#60a5fa", border: "#1e3a5f" };
  }
  if (!result.price_found) {
    if (result.error?.toLowerCase().includes("indexado")) {
      return { label: "SIN DATOS", bg: "#1c1500", color: "#fbbf24", border: "#713f12" };
    }
    return { label: "ERROR", bg: "#1a0808", color: "#f87171", border: "#7f1d1d" };
  }
  const score = result.match_score ?? 0;
  if (score >= 5) return { label: "PRECIO CONFIABLE", bg: "#0a1a10", color: "#4ade80",  border: "#14532d" };
  if (score >= 3) return { label: "⚠ BAJA SIMILITUD", bg: "#1c1500", color: "#fbbf24",  border: "#713f12" };
  return          { label: "VERIFICAR",         bg: "#1a0808", color: "#f87171",  border: "#7f1d1d" };
}

function modeBadge(modo: Modo) {
  const c = ENGINE_DEFS[modo];
  return (
    <span style={{ fontSize: 13, backgroundColor: c.bg, color: c.color,
      padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontWeight: 600 }}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestScraperPage() {
  const [tiendas, setTiendas]         = useState<Tienda[]>([]);
  const [catalogo, setCatalogo]       = useState<CatalogoItem[]>([]);
  const [tiendaId, setTiendaId]       = useState("");
  const [materialId, setMaterialId]   = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [storeZip, setStoreZip]       = useState("");
  const [modo, setModo]               = useState<Modo>("scrapingbee");
  const [result, setResult]           = useState<ScraperResult | null>(null);
  const [loading, setLoading]         = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dbError, setDbError]         = useState<string | null>(null);

  const RAILWAY_BASE = process.env.NEXT_PUBLIC_RAILWAY_RPA_URL ?? "";

  // ── Carga tiendas — todas las activas, All Stores primero
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("tiendas")
        .select("id, nombre, url, activo, store_zip")
        .eq("activo", true)
        .order("nombre");

      if (error) { setDbError(error.message); setLoadingData(false); return; }

      const raw = data ?? [];
      const sorted = [
        ...raw.filter((t) => t.nombre === "All Stores"),
        ...raw.filter((t) => t.nombre !== "All Stores"),
      ];
      setTiendas(sorted);
      setLoadingData(false);
    }
    load();
  }, []);

  // ── Catálogo por tienda (no aplica para All Stores)
  useEffect(() => {
    if (!tiendaId) { setCatalogo([]); setMaterialId(""); return; }
    const tienda = tiendas.find((t) => t.id === tiendaId);
    if (tienda?.nombre === "All Stores") { setCatalogo([]); setMaterialId(""); return; }
    async function load() {
      const { data } = await supabase
        .from("catalogo")
        .select("id, material, search_query, precio_source, tienda_id")
        .eq("tienda_id", tiendaId)
        .eq("activo", true)
        .order("material");
      setCatalogo(data ?? []);
      setMaterialId(""); setSearchQuery("");
    }
    load();
  }, [tiendaId]);

  // ── Pre-carga search_query al seleccionar material
  useEffect(() => {
    const item = catalogo.find((c) => c.id === materialId);
    if (!item) return;
    setSearchQuery(item.search_query ?? "");
  }, [materialId]);

  // ── Pre-carga ZIP de tienda si existe en BD
  useEffect(() => {
    const tienda = tiendas.find((t) => t.id === tiendaId);
    setStoreZip(tienda?.store_zip ?? "");
  }, [tiendaId]);

  const tiendaActual     = tiendas.find((t) => t.id === tiendaId);
  const materialActual   = catalogo.find((c) => c.id === materialId);
  const isAllStores      = tiendaActual?.nombre === "All Stores";
  const availableEngines = tiendaActual ? (STORE_ENGINES[tiendaActual.nombre] ?? []) : [];
  const isUrlBased       = URL_BASED_MODOS.includes(modo);

  // ── Motor por defecto según tienda -- evita mostrar/dejar seleccionado un
  // motor que no aplica (ej. Oxylabs quedaba marcado al cambiar a Home Depot)
  useEffect(() => {
    if (availableEngines.length > 0 && !availableEngines.includes(modo)) {
      setModo(availableEngines[0]);
    }
    setResult(null);
  }, [tiendaId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run() {
    if (!searchQuery.trim() || !tiendaActual) return;
    setLoading(true); setResult(null);
    try {
      let url: string;
      if (modo === "apify") {
        // Motor real de Home Depot/Lowe's -- recibe URL directa de producto.
        const storeKey = tiendaActual.nombre === "Home Depot" ? "homedepot" : "lowes";
        url = `${RAILWAY_BASE}/test-apify?${new URLSearchParams({ store: storeKey, product_url: searchQuery })}`;
      } else if (modo === "oxylabs-menards") {
        // Motor real de Menards (2026-07-14) -- recibe URL directa de
        // producto, no texto de búsqueda. El campo "Search Query" se
        // reutiliza como campo de URL cuando este modo está activo.
        url = `${RAILWAY_BASE}/test-oxylabs-menards?${new URLSearchParams({ product_url: searchQuery })}`;
      } else if (modo === "brightdata-lowes") {
        // Motor real de Lowe's (2026-07-14) -- ídem, URL directa de producto.
        // Puede tardar 30-200s -- Bright Data a veces encola async aunque se
        // pida modo síncrono, no es un timeout roto.
        url = `${RAILWAY_BASE}/test-brightdata-lowes?${new URLSearchParams({ product_url: searchQuery })}`;
      } else {
        const qs = new URLSearchParams({
          search_query: searchQuery,
          store_name:   tiendaActual.nombre,
          store_zip:    storeZip,
          modo,
          debug:        "1",
        });
        url = `${RAILWAY_BASE}/test-scraper?${qs}`;
      }
      const res = await fetch(url, { cache: "no-store" });
      setResult(await res.json());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setResult({ error: msg });
    } finally { setLoading(false); }
  }

  const canRun    = !!searchQuery.trim() && !!tiendaActual && !loading && availableEngines.length > 0;
  const precioFmt = result?.precio != null ? `$${result.precio.toFixed(2)}` : null;
  const badge     = result ? getStatusBadge(result) : null;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={S.led} />
          <span style={S.headerSub}>Atlantic Services · Scraper Sandbox</span>
        </div>
        <h1 style={S.h1}>Test Scraper de Precios</h1>
        <p style={S.headerDesc}>
          El backend construye URLs y selecciona el flujo internamente según la tienda.
          El frontend solo pasa <strong style={{ color: "#93c5fd" }}>store_name</strong> + <strong style={{ color: "#34d399" }}>search_query</strong>.
        </p>
      </div>

      {dbError && (
        <div style={S.errorBanner}>
          ⛔ <strong>Error Supabase:</strong> {dbError}
        </div>
      )}

      <div style={S.grid}>

        {/* Panel izquierdo */}
        <div style={S.leftPanel}>

          <Field label="Tienda" color="#60a5fa">
            {loadingData ? <Skeleton /> : tiendas.length === 0 ? (
              <div style={S.emptyMsg}>
                {dbError ? "Error de conexión — ver banner arriba." : "No se encontraron tiendas activas."}
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
            {tiendaActual?.url && (
              <div style={S.hint}>{tiendaActual.url}</div>
            )}
          </Field>

          <Field label="ZIP de la sucursal (opcional)" color="#fb923c">
            <input style={S.input} value={storeZip}
              onChange={(e) => setStoreZip(e.target.value)}
              placeholder="46204" maxLength={10} />
            <div style={S.hint}>ZIP del cliente / sucursal — mejora precios locales</div>
          </Field>

          {!isUrlBased && !isAllStores && (
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
                </div>
              )}
            </Field>
          )}

          {!isAllStores && (
            <Field label={isUrlBased ? "URL directa del producto" : "Search Query"} color="#34d399">
              <input style={S.input} value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  modo === "oxylabs-menards"
                    ? "https://www.menards.com/main/.../1021091/p-....htm"
                    : modo === "brightdata-lowes"
                      ? "https://www.lowes.com/pd/.../1010065"
                      : modo === "apify"
                        ? tiendaActual?.nombre === "Home Depot"
                          ? "https://www.homedepot.com/p/.../321711458"
                          : "https://www.lowes.com/pd/.../1010065"
                        : "ej: GAF Timberline HDZ laminated shingle 33.33 sq ft"
                } />
              <div style={S.hint}>
                {isUrlBased
                  ? "Pegar la URL completa del producto (no texto de búsqueda) — este motor matchea por URL exacta"
                  : <>Sin comillas ni ® ™ — usar &quot;in&quot; y &quot;ft&quot; en lugar de &quot; y &apos;</>}
              </div>
            </Field>
          )}

          {/* Motor — solo se muestran los que realmente aplican a la tienda seleccionada */}
          <Field label="Motor" color="#a78bfa">
            {!tiendaActual ? (
              <div style={S.hint}>Selecciona una tienda para ver su motor real</div>
            ) : isAllStores ? (
              <div style={S.emptyMsg}>
                &quot;All Stores&quot; ya no está disponible en este sandbox — era una función de
                SerpApi (comparación multi-tienda por texto), deshabilitada 2026-07-14.
                Selecciona una tienda específica.
              </div>
            ) : availableEngines.length === 0 ? (
              <div style={S.emptyMsg}>Esta tienda no tiene un motor de producción conectado todavía.</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  {availableEngines.map((m) => {
                    const e = ENGINE_DEFS[m];
                    const active = modo === m;
                    return (
                      <button key={m} onClick={() => setModo(m)}
                        style={{
                          flex: 1, padding: "10px 8px", borderRadius: 8,
                          fontFamily: "'DM Mono','Fira Code',monospace", fontSize: 13, fontWeight: 600,
                          cursor: "pointer", transition: "all 0.15s",
                          backgroundColor: active ? e.bg : "#0f172a",
                          color:           active ? e.color : "#64748b",
                          border: `1px solid ${active ? e.border : "#1e293b"}`,
                        }}>
                        {e.icon} {e.label}
                      </button>
                    );
                  })}
                </div>
                <div style={S.hint}>{ENGINE_DEFS[modo]?.hint}</div>
              </>
            )}
          </Field>

          <button
            style={{
              ...S.btn,
              opacity: canRun ? 1 : 0.5,
              cursor: canRun ? "pointer" : "not-allowed",
              backgroundColor: ENGINE_DEFS[modo]?.bg     ?? "#0f172a",
              color:            ENGINE_DEFS[modo]?.color ?? "#64748b",
              border: `1px solid ${ENGINE_DEFS[modo]?.border ?? "#1e293b"}`,
            }}
            disabled={!canRun} onClick={run}>
            {loading
              ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <Spin />Consultando…
                </span>
              : `${ENGINE_DEFS[modo]?.icon ?? ""} Probar ${ENGINE_DEFS[modo]?.label ?? "—"}`}
          </button>

          <div style={S.creditBox}>
            🏠 <strong>Home Depot</strong> → Apify (6/6 histórico exacto).<br />
            🛒 <strong>Lowe&apos;s</strong> → Bright Data, principal (~7-8/10) + Apify disponible para comparar.<br />
            🔧 <strong>Menards</strong> → Oxylabs, EDLP real.<br />
            🐝 <strong>Floor &amp; Decor</strong> → ScrapingBee, sin cambios.<br />
            SerpApi deshabilitado — degradado a herramienta opcional de discovery de catálogo.
          </div>

        </div>

        {/* Panel derecho */}
        <div style={S.resultPanel}>

          {!result && !loading && (
            <div style={S.center}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
              <div style={{ color: "#94a3b8", fontSize: 15 }}>Esperando consulta…</div>
              <div style={{ color: "#64748b", fontSize: 14, marginTop: 8, textAlign: "center", maxWidth: 260 }}>
                Selecciona tienda → ingresa búsqueda → presiona el botón
              </div>
            </div>
          )}

          {loading && (
            <div style={S.center}>
              <Spin size={40} />
              <div style={{ color: ENGINE_DEFS[modo]?.color ?? "#94a3b8", fontSize: 15, marginTop: 18 }}>
                Consultando {ENGINE_DEFS[modo]?.label ?? modo}…
              </div>
              <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 6 }}>
                {ENGINE_DEFS[modo]?.time ?? ""}
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Badge de estado */}
              {badge && (
                <div style={{ padding: "10px 24px", backgroundColor: badge.bg, borderBottom: `1px solid ${badge.border}`, display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: badge.color, fontWeight: 700, letterSpacing: "0.1em" }}>
                    {badge.label}
                  </span>
                  {modeBadge(modo)}
                  {result.price_strategy === "cache" && (
                    <span style={{ fontSize: 12, color: "#64748b", marginLeft: 10 }}>cached result</span>
                  )}
                </div>
              )}

              {/* Precio hero */}
              <div style={S.priceHero}>
                {result.error && !result.price_found ? (
                  <>
                    <div style={{ fontSize: 44, color: "#f87171" }}>✕</div>
                    <div style={{ color: "#f87171", fontSize: 16, marginTop: 8 }}>{result.error}</div>
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
                      color: result.price_strategy === "edlp"            ? "#4ade80"
                           : result.price_strategy === "json-ld-offers"  ? "#4ade80"
                           : result.price_strategy === "json-ld"         ? "#fbbf24"
                           : result.price_strategy === "google-shopping" ? "#93c5fd"
                           : result.price_strategy === "cache"           ? "#60a5fa"
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
                  <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                    {result.match_score != null && result.match_score > 0 && (
                      <div>
                        <span style={{ color: "#94a3b8", fontSize: 14 }}>Similitud  </span>
                        <span style={{ color: scoreColor(result.match_score), fontSize: 22, fontWeight: 700 }}>
                          {result.match_score}/10
                        </span>
                        <span style={{ color: scoreColor(result.match_score), fontSize: 12, marginLeft: 6 }}>
                          {scoreLabel(result.match_score)}
                        </span>
                      </div>
                    )}
                    {result.tiempo_ms != null && (
                      <div>
                        <span style={{ color: "#94a3b8", fontSize: 14 }}>Tiempo  </span>
                        <span style={{ color: "#94a3b8", fontSize: 18, fontWeight: 700 }}>
                          {result.tiempo_ms < 1000
                            ? `${result.tiempo_ms}ms`
                            : `${(result.tiempo_ms / 1000).toFixed(1)}s`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tabla comparativa — solo para All Stores */}
              {isAllStores && result.comparison && result.comparison.length > 0 && (
                <ComparisonTable rows={result.comparison} />
              )}

              {/* Diagnóstico */}
              <div style={S.diagBlock}>
                <div style={S.blockLabel}>Diagnóstico</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {([
                    ["Tienda",     tiendaActual?.nombre],
                    ["ZIP",        storeZip || null],
                    ["Motor",      ENGINE_DEFS[modo]?.label ?? modo],
                    ["Estrategia", estrategiaLabel(result.price_strategy)],
                    ["Tiempo",     result.tiempo_ms != null
                      ? result.tiempo_ms < 1000
                        ? `${result.tiempo_ms}ms`
                        : `${(result.tiempo_ms / 1000).toFixed(1)}s`
                      : null],
                  ] as [string, string | null | undefined][]).map(([k, v]) =>
                    v != null ? (
                      <div key={k} style={{ display: "flex", gap: 12 }}>
                        <span style={{ color: "#94a3b8", fontSize: 15, minWidth: 148 }}>{k}</span>
                        <span style={{ color: "#cbd5e1", fontSize: 15 }}>{v}</span>
                      </div>
                    ) : null
                  )}
                </div>

                {result.product_url && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ ...S.blockLabel, marginBottom: 6 }}>URL consultada</div>
                    <a href={result.product_url} target="_blank" rel="noreferrer"
                      style={{ fontSize: 14, color: "#60a5fa", wordBreak: "break-all" }}>
                      {result.product_url}
                    </a>
                  </div>
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

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  const trunc = (s: string, n = 40) => s.length > n ? s.slice(0, n) + "…" : s;
  return (
    <div style={{ padding: "16px 24px", borderTop: "1px solid #1e3a5f" }}>
      <div style={S.blockLabel}>Comparativa de tiendas</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {["Tienda", "Precio", "Similitud", "Producto"].map((h) => (
              <th key={h} style={{ color: "#64748b", textAlign: "left", padding: "4px 8px",
                fontWeight: 600, borderBottom: "1px solid #1e3a5f", fontFamily: "'DM Mono','Fira Code',monospace" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ backgroundColor: row.winner ? "#0a1a10" : "transparent" }}>
              <td style={{ padding: "6px 8px", color: row.winner ? "#4ade80" : "#cbd5e1" }}>
                {row.winner ? "★ " : ""}{row.store}
              </td>
              <td style={{ padding: "6px 8px", color: row.precio != null ? "#4ade80" : "#64748b", fontWeight: row.winner ? 700 : 400 }}>
                {row.precio != null ? `$${row.precio.toFixed(2)}` : "Sin datos"}
              </td>
              <td style={{ padding: "6px 8px", color: scoreColor(row.match_score) }}>
                {row.match_score}/10
              </td>
              <td style={{ padding: "6px 8px", color: "#94a3b8" }}>
                {trunc(row.product_title || "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
  mejor_match:              { icon: "🎯", label: "Mejor match",            bg: "#0a1a10", color: "#34d399" },
  llamada_2_producto:       { icon: "🐝", label: "SB llamada 2 producto",  bg: "#1a1500", color: "#fbbf24" },
  precio_extraido:          { icon: "💰", label: "Precio extraído",        bg: "#0a1a10", color: "#4ade80" },
  sin_precio:               { icon: "✕",  label: "Sin precio",             bg: "#1a0808", color: "#f87171" },
  captcha_bloqueado:        { icon: "🚫", label: "Captcha bloqueado",      bg: "#1a0808", color: "#f87171" },
  excepcion:                { icon: "💥", label: "Excepción",              bg: "#1a0808", color: "#f87171" },
  modo_fd:                  { icon: "🔀", label: "Modo F&D",               bg: "#1a0d00", color: "#fb923c" },
  serpapi_site_fd:          { icon: "🔍", label: "SerpApi F&D",            bg: "#1a0d00", color: "#fb923c" },
  url_producto_encontrada:  { icon: "🔗", label: "URL producto",           bg: "#1a0d00", color: "#fb923c" },
  _default:                 { icon: "·",  label: "Paso",                   bg: "#0a1628", color: "#64748b" },
};

function renderStepDetail(s: Step): React.ReactNode {
  const d: React.CSSProperties = { fontSize: 13, color: "#94a3b8", marginTop: 3, lineHeight: 1.6 };
  const trunc = (str: string, n = 80) => str.length > n ? str.slice(0, n) + "…" : str;

  if (s.accion === "busqueda_google_shopping") return (
    <div style={d}>
      {s.query && <>Query: <span style={{ color: "#7dd3fc" }}>&quot;{s.query}&quot;</span></>}
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
    <div style={d}>Query: <span style={{ color: "#7dd3fc" }}>&quot;{s.query}&quot;</span></div>
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
  grid:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1100 },
  leftPanel:   { display: "flex", flexDirection: "column", gap: 20 },
  select:      { ...base, cursor: "pointer" },
  input:       { ...base },
  hint:        { fontSize: 13, color: "#94a3b8", marginTop: 2, lineHeight: 1.5, display: "flex", alignItems: "center" },
  emptyMsg:    { fontSize: 14, color: "#f87171", backgroundColor: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", lineHeight: 1.6 },
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
  timelineDot:     { width: 16, height: 16, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center" } as React.CSSProperties,
  timelineConnect: { width: 2, backgroundColor: "#1e3a5f", flex: 1, marginTop: 4, minHeight: 10 } as React.CSSProperties,
};
