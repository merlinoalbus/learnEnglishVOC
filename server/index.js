// =====================================================
// 🛡️ server/index.js - Gemini AI proxy (Backend for Frontend)
// =====================================================
// SCOPO: custodire la GEMINI_API_KEY lato server. Il frontend (nginx) inoltra
// /api/* a questo servizio, che NON è esposto direttamente sul web.
// PRINCIPIO: thin proxy. Il client continua a costruire il prompt e a fare il
// parsing della risposta; qui validiamo lo shape, iniettiamo la key e inoltriamo
// a Gemini propagando lo status code verbatim (così la logica di errore/health
// del client resta invariata).

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ====== CONFIG (solo server-side) ======
const PORT = parseInt(process.env.PORT || "3001", 10);
// Accetta GEMINI_API_KEY (consigliato) o il nome legacy REACT_APP_GEMINI_API_KEY,
// così la variabile host già usata nei deploy esistenti continua a funzionare
// (ora alimenta il backend invece di finire nel bundle del client).
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || "";
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  process.env.REACT_APP_GEMINI_API_URL ||
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const MAX_TEXT_LENGTH = parseInt(process.env.MAX_TEXT_LENGTH || "8000", 10);
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "32kb";
const RATE_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
const RATE_MAX = parseInt(process.env.RATE_LIMIT_MAX || "30", 10);
const UPSTREAM_TIMEOUT_MS = parseInt(process.env.UPSTREAM_TIMEOUT_MS || "30000", 10);

const app = express();
app.disable("x-powered-by");
// Dietro nginx: necessario per far funzionare correttamente il rate-limit per-IP
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: JSON_BODY_LIMIT }));

// ====== HEALTH ENDPOINTS ======
// Healthcheck container: non rivela mai la key
app.get("/health", (_req, res) => res.status(200).json({ status: "healthy" }));

// Disponibilità AI a livello applicativo: solo un booleano, nessun segreto
app.get("/api/ai/health", (_req, res) =>
  res.status(200).json({ configured: !!GEMINI_API_KEY })
);

// ====== RATE LIMITER (solo sull'endpoint costoso) ======
const limiter = rateLimit({
  windowMs: RATE_WINDOW_MS,
  max: RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

// ====== VALIDAZIONE SHAPE ======
// Accettiamo SOLO { contents: [{ parts: [{ text }] }] } per evitare che il proxy
// diventi un relay Gemini aperto. Cappiamo anche la lunghezza totale del testo.
function validateBody(body) {
  if (!body || !Array.isArray(body.contents) || body.contents.length === 0) {
    return "contents array required";
  }
  let totalLength = 0;
  for (const content of body.contents) {
    if (!content || !Array.isArray(content.parts) || content.parts.length === 0) {
      return "parts array required";
    }
    for (const part of content.parts) {
      if (!part || typeof part.text !== "string") {
        return "parts[].text must be a string";
      }
      totalLength += part.text.length;
    }
  }
  if (totalLength === 0) return "text is empty";
  if (totalLength > MAX_TEXT_LENGTH) return "text too long";
  return null;
}

// ====== PROXY ENDPOINT ======
app.post("/api/ai/generate", limiter, async (req, res) => {
  if (!GEMINI_API_KEY) {
    // Il client mappa >=500 su "Errore server Gemini" e attiva il fallback
    return res.status(503).json({ error: "AI proxy not configured" });
  }

  const validationError = validateBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // Inoltriamo SOLO la parte validata (non un passthrough arbitrario del body)
  const forwarded = { contents: req.body.contents };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwarded),
      signal: controller.signal,
    });

    // Passthrough verbatim di status + body, così l'error handling del client
    // (401/403/429/400/5xx) e la health detection restano identici
    const text = await upstream.text();
    res
      .status(upstream.status)
      .type(upstream.headers.get("content-type") || "application/json")
      .send(text);
  } catch (error) {
    if (error && error.name === "AbortError") {
      return res.status(504).json({ error: "upstream timeout" });
    }
    return res.status(502).json({ error: "upstream request failed" });
  } finally {
    clearTimeout(timeoutId);
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `🛡️  AI proxy listening on :${PORT} (configured=${!!GEMINI_API_KEY})`
  );
});
