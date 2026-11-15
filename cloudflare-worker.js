const ALLOWED_ORIGIN = "https://abdoulayeky080-del.github.io";
const API_BASE = "https://api.football-data.org/v4";

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Content-Type",
      "cache-control": "no-store",
      "vary": "Origin"
    }
  });
}

function isRealDate(value) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value || "")) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const requestOrigin = request.headers.get("Origin") || "";
    const allowedOrigin =
      requestOrigin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "null";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": allowedOrigin,
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "Content-Type",
          "access-control-max-age": "86400",
          "vary": "Origin"
        }
      });
    }

    if (request.method !== "GET") {
      return json({ error: "Méthode non autorisée." }, 405, allowedOrigin);
    }

    if (requestOrigin && requestOrigin !== ALLOWED_ORIGIN) {
      return json({ error: "Origine non autorisée." }, 403, allowedOrigin);
    }

    if (!env.FOOTBALL_DATA_TOKEN) {
      return json({
        error: "Le secret FOOTBALL_DATA_TOKEN est absent du Worker."
      }, 500, allowedOrigin);
    }

    let endpoint = "";
    const params = new URLSearchParams();

    if (requestUrl.pathname === "/football-data/competitions") {
      endpoint = "/competitions";
    } else {
      const match = requestUrl.pathname.match(
        /^\\/football-data\\/competitions\\/([A-Z0-9]{2,5})\\/matches$/
      );

      if (!match) {
        return json({ error: "Route inconnue." }, 404, allowedOrigin);
      }

      endpoint = "/competitions/" + match[1] + "/matches";

      const dateFrom = requestUrl.searchParams.get("dateFrom");
      const dateTo = requestUrl.searchParams.get("dateTo");

      if (!isRealDate(dateFrom) || !isRealDate(dateTo)) {
        return json({
          error: "Dates requises au format AAAA-MM-JJ."
        }, 400, allowedOrigin);
      }

      if (dateTo < dateFrom) {
        return json({
          error: "La date de fin doit être postérieure à la date de début."
        }, 400, allowedOrigin);
      }

      const days =
        (Date.parse(dateTo + "T00:00:00Z") -
         Date.parse(dateFrom + "T00:00:00Z")) / 86400000;

      if (days > 14) {
        return json({
          error: "La période demandée ne peut pas dépasser 14 jours."
        }, 400, allowedOrigin);
      }

      params.set("dateFrom", dateFrom);
      params.set("dateTo", dateTo);
    }

    const query = params.toString();
    const apiUrl = API_BASE + endpoint + (query ? "?" + query : "");

    try {
      const upstream = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "X-Auth-Token": env.FOOTBALL_DATA_TOKEN,
          "Accept": "application/json"
        }
      });

      const body = await upstream.text();

      return new Response(body, {
        status: upstream.status,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": allowedOrigin,
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "Content-Type",
          "cache-control": "no-store",
          "vary": "Origin"
        }
      });
    } catch (error) {
      return json({
        error: "Impossible de joindre Football-Data.org pour le moment."
      }, 502, allowedOrigin);
    }
  }
};
