const ALLOWED_ORIGIN = "https://abdoulayeky080-del.github.io";
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
function response(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...JSON_HEADERS,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
      "Vary": "Origin"
    }
  });
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "null";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
      }});
    }
    if (request.method !== "GET") return response({ error: "Method not allowed" }, 405, corsOrigin);
    if (origin && origin !== ALLOWED_ORIGIN) return response({ error: "Origin not allowed" }, 403, corsOrigin);
    if (!env.FOOTBALL_DATA_TOKEN) return response({ error: "Secret FOOTBALL_DATA_TOKEN manquant dans le Worker." }, 500, corsOrigin);

    let apiPath = "";
    if (url.pathname === "/football-data/competitions") {
      apiPath = "/v4/competitions";
    } else {
      const match = url.pathname.match(/^\/football-data\/competitions\/([A-Z0-9]{2,5})\/matches$/);
      if (!match) return response({ error: "Route inconnue." }, 404, corsOrigin);
      apiPath = "/v4/competitions/" + match[1] + "/matches";
    }
    const params = new URLSearchParams();
    if (apiPath.endsWith("/matches")) {
      const from = url.searchParams.get("dateFrom");
      const to = url.searchParams.get("dateTo");
      const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v || "");
      if (!validDate(from) || !validDate(to)) return response({ error: "dateFrom et dateTo au format AAAA-MM-JJ sont requis." }, 400, corsOrigin);
      if (to < from) return response({ error: "La date de fin doit être après la date de début." }, 400, corsOrigin);
      const span = (Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000;
      if (span > 14) return response({ error: "Période limitée à 14 jours." }, 400, corsOrigin);
      params.set("dateFrom", from); params.set("dateTo", to);
    }
    const target = "https://api.football-data.org" + apiPath + (params.size ? "?" + params.toString() : "");
    try {
      const upstream = await fetch(target, {
        headers: { "X-Auth-Token": env.FOOTBALL_DATA_TOKEN, "Accept": "application/json" },
        cf: { cacheTtl: apiPath.endsWith("/matches") ? 120 : 21600, cacheEverything: true }
      });
      const body = await upstream.text();
      return new Response(body, { status: upstream.status, headers: {
        ...JSON_HEADERS,
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-store",
        "Vary": "Origin"
      }});
    } catch (e) {
      return response({ error: "Service Football-Data.org temporairement indisponible." }, 502, corsOrigin);
    }
  }
};