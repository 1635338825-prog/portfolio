const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_ALLOWED_ORIGIN = "https://1635338825-prog.github.io,null";

function allowedOrigin(req) {
  const origin = req.headers.origin || "";
  const configured = [DEFAULT_ALLOWED_ORIGIN, process.env.ALLOWED_ORIGIN || ""].join(",");
  const allowed = [...new Set(configured.split(",").map((item) => item.trim()).filter(Boolean))];
  if (allowed.includes("*")) return origin || "*";
  return allowed.includes(origin) ? origin : allowed[0] || DEFAULT_ALLOWED_ORIGIN;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return null;
  const safeMessages = messages.slice(0, 8).map((message) => ({
    role: ["system", "user", "assistant"].includes(message?.role) ? message.role : "user",
    content: String(message?.content || "").slice(0, 12000)
  })).filter((message) => message.content.trim());
  return safeMessages.length ? safeMessages : null;
}

module.exports = async function handler(req, res) {
  const origin = allowedOrigin(req);
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: "DEEPSEEK_API_KEY is not configured on the proxy server." });
    return;
  }

  const messages = sanitizeMessages(req.body?.messages);
  if (!messages) {
    sendJson(res, 400, { error: "messages is required." });
    return;
  }

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL).replace(/\/+$/, "");
  const model = String(req.body?.model || process.env.DEEPSEEK_MODEL || DEFAULT_MODEL).slice(0, 120);

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.35
      })
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      sendJson(res, upstream.status, { error: payload.error?.message || "DeepSeek request failed." });
      return;
    }

    sendJson(res, 200, {
      answer: payload.choices?.[0]?.message?.content?.trim() || "",
      model
    });
  } catch (error) {
    sendJson(res, 502, { error: error.message || "Proxy request failed." });
  }
};
