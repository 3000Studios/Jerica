/* jerica.pro — Worker
   Serves the static site and the private Friends Message Board API.
   Board rules (kids-safe by design):
   - Only friends a parent has invited can read or post (personal invite code).
   - Names are set by the parent, not typed by kids (no impersonation).
   - Text only, 200 chars max. Links, emails, @handles, phone numbers and street
     addresses are scrubbed before saving. Bad words are masked.
   - Rate limited, and every message auto-deletes after 30 days.
   - Parent admin (Bearer ADMIN_KEY) can add/remove friends and delete posts. */
import { DurableObject } from "cloudflare:workers";

const MAX_LEN = 200;
const KEEP_MS = 30 * 24 * 3600 * 1000;
const SESSION_MS = 60 * 24 * 3600 * 1000;
const POST_GAP_MS = 15 * 1000;
const STICKERS = ["🦇", "💀", "🕷️", "🕸️", "🌙", "🖤", "🔮", "⚰️", "👻", "🎸"];
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const WORDS = ["fuck", "shit", "bitch", "bastard", "dick", "pussy", "cunt", "asshole", "slut", "whore", "nigger", "nigga", "faggot", "fag", "retard", "damn", "crap", "piss"];

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra },
  });

function cleanText(raw) {
  let t = String(raw || "").normalize("NFC").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  t = t.replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, "[email removed]");
  t = t.replace(/\b(?:https?:\/\/|www\.)\S+/gi, "[link removed]");
  t = t.replace(/\b[a-z0-9-]+\.(?:com|net|org|io|gg|tv|me|app|co|us|pro|xyz|link|ly|be)(?:\/\S*)?\b/gi, "[link removed]");
  t = t.replace(/@[a-z0-9_.]{3,}/gi, "[handle removed]");
  t = t.replace(/(?:\+?\d[\s().-]*){7,}/g, "[number removed]");
  t = t.replace(/\b\d{1,5}\s+(?:[a-z]+\s){0,3}(?:st|street|rd|road|ave|avenue|dr|drive|ln|lane|ct|court|blvd|way|cir|circle|pl|place|trl|trail|pkwy|hwy)\b\.?/gi, "[address removed]");
  for (const w of WORDS) {
    const re = new RegExp("\\b" + w.split("").join("[^a-z0-9]?") + "\\w*", "gi");
    t = t.replace(re, (m) => m[0] + "*".repeat(Math.max(2, m.length - 1)));
  }
  return t.slice(0, MAX_LEN);
}

async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomCode() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_ALPHABET[b[i] % CODE_ALPHABET.length];
  return s.slice(0, 4) + "-" + s.slice(4);
}
function randomToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" })[c]);
}
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function cookie(req, name) {
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

export class Board extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code_hash TEXT NOT NULL UNIQUE, created INTEGER NOT NULL, last_post INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, friend_id INTEGER NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, friend_id INTEGER NOT NULL, name TEXT NOT NULL, sticker TEXT NOT NULL, body TEXT NOT NULL, ts INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS messages_ts ON messages(ts);
    `);
  }

  prune() {
    const now = Date.now();
    this.sql.exec("DELETE FROM messages WHERE ts < ?", now - KEEP_MS);
    this.sql.exec("DELETE FROM sessions WHERE expires < ?", now);
  }
  list(limit = 100) {
    return this.sql.exec("SELECT id, name, sticker, body, ts FROM messages ORDER BY ts DESC LIMIT ?", limit).toArray();
  }
  async session(req) {
    const tok = cookie(req, "jb_s");
    if (!tok) return null;
    const row = this.sql.exec(
      "SELECT f.id, f.name, f.last_post FROM sessions s JOIN friends f ON f.id = s.friend_id WHERE s.token_hash = ? AND s.expires > ?",
      await sha256(tok), Date.now()).toArray()[0];
    return row || null;
  }
  isAdmin(req) {
    const h = req.headers.get("authorization") || "";
    const key = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
    return !!this.env.ADMIN_KEY && timingSafeEqual(key, this.env.ADMIN_KEY);
  }

  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, "");
    const m = req.method;
    this.prune();

    if (p === "/api/board/login" && m === "POST") {
      const body = await req.json().catch(() => ({}));
      const code = String(body.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length !== 8) return json({ error: "That code doesn't look right." }, 400);
      const fmt = code.slice(0, 4) + "-" + code.slice(4);
      const f = this.sql.exec("SELECT id, name FROM friends WHERE code_hash = ?", await sha256(fmt + "|" + this.env.ADMIN_KEY)).toArray()[0];
      if (!f) return json({ error: "No friend with that code. Ask for a new one." }, 401);
      const tok = randomToken();
      this.sql.exec("INSERT INTO sessions (token_hash, friend_id, expires) VALUES (?, ?, ?)", await sha256(tok), f.id, Date.now() + SESSION_MS);
      return json({ name: f.name }, 200, {
        "set-cookie": `jb_s=${tok}; Path=/api/board; Max-Age=${SESSION_MS / 1000}; HttpOnly; Secure; SameSite=Strict`,
      });
    }

    if (p === "/api/board/logout" && m === "POST") {
      const tok = cookie(req, "jb_s");
      if (tok) this.sql.exec("DELETE FROM sessions WHERE token_hash = ?", await sha256(tok));
      return json({ ok: true }, 200, { "set-cookie": "jb_s=; Path=/api/board; Max-Age=0; HttpOnly; Secure; SameSite=Strict" });
    }

    if (p === "/api/board/messages" && m === "GET") {
      const me = await this.session(req);
      if (!me) return json({ error: "signin" }, 401);
      return json({ me: me.name, stickers: STICKERS, messages: this.list() });
    }

    if (p === "/api/board/messages" && m === "POST") {
      const me = await this.session(req);
      if (!me) return json({ error: "signin" }, 401);
      const now = Date.now();
      const wait = me.last_post + POST_GAP_MS - now;
      if (wait > 0) return json({ error: `Slow down a little — try again in ${Math.ceil(wait / 1000)}s.` }, 429);
      const body = await req.json().catch(() => ({}));
      const text = cleanText(body.text);
      if (text.replace(/\[[a-z ]+removed\]/g, "").trim().length < 1) return json({ error: "Write something first." }, 400);
      const sticker = STICKERS.includes(body.sticker) ? body.sticker : STICKERS[0];
      this.sql.exec("INSERT INTO messages (friend_id, name, sticker, body, ts) VALUES (?, ?, ?, ?, ?)", me.id, me.name, sticker, text, now);
      this.sql.exec("UPDATE friends SET last_post = ? WHERE id = ?", now, me.id);
      return json({ ok: true, messages: this.list() });
    }

    /* ---------- parent admin ---------- */
    if (p.startsWith("/api/board/admin")) {
      if (!this.isAdmin(req)) return json({ error: "Not allowed." }, 401);

      if (p === "/api/board/admin/state" && m === "GET") {
        const friends = this.sql.exec("SELECT id, name, created, last_post FROM friends ORDER BY name").toArray();
        return json({ friends, messages: this.list(500) });
      }
      if (p === "/api/board/admin/friends" && m === "POST") {
        const body = await req.json().catch(() => ({}));
        const name = String(body.name || "").replace(/[^\p{L}\p{N} ._'-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 24);
        if (!name) return json({ error: "Give the friend a name or nickname." }, 400);
        if (body.consent !== true) return json({ error: "Confirm a parent said OK first." }, 400);
        const code = randomCode();
        this.sql.exec("INSERT INTO friends (name, code_hash, created) VALUES (?, ?, ?)", name, await sha256(code + "|" + this.env.ADMIN_KEY), Date.now());
        return json({ name, code });
      }
      const fm = p.match(/^\/api\/board\/admin\/friends\/(\d+)$/);
      if (fm && m === "DELETE") {
        const id = Number(fm[1]);
        this.sql.exec("DELETE FROM sessions WHERE friend_id = ?", id);
        if (url.searchParams.get("purge") === "1") this.sql.exec("DELETE FROM messages WHERE friend_id = ?", id);
        this.sql.exec("DELETE FROM friends WHERE id = ?", id);
        return json({ ok: true });
      }
      const mm = p.match(/^\/api\/board\/admin\/messages\/(\d+)$/);
      if (mm && m === "DELETE") {
        this.sql.exec("DELETE FROM messages WHERE id = ?", Number(mm[1]));
        return json({ ok: true });
      }
      if (p === "/api/board/admin/wipe" && m === "POST") {
        this.sql.exec("DELETE FROM messages");
        return json({ ok: true });
      }
    }
    return json({ error: "Not found." }, 404);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/board")) {
      if (req.method !== "GET") {
        const origin = req.headers.get("origin");
        if (origin && origin !== url.origin) return json({ error: "Bad origin." }, 403);
      }
      if (!env.ADMIN_KEY) return json({ error: "Board not configured." }, 503);
      const stub = env.BOARD.get(env.BOARD.idFromName("friends-board"));
      return stub.fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};
