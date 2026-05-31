import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

import supabasePlugin from "./plugins/supabase.js";
import authGuard from "./plugins/auth-guard.js";

import authRoutes from "./routes/auth.js";
import scheduleRoutes from "./routes/schedule.js";
import staffRoutes from "./routes/staff.js";
import usersRoutes from "./routes/users.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

// --- Plugins ---
await app.register(fastifyCors, {
  origin: ["https://nurse-lxh.pages.dev"],
  credentials: true,
});
await app.register(fastifyCookie, {
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
});
await app.register(fastifyStatic, {
  root: join(__dirname, "../public"),
  prefix: "/",
});

// Supabase client (ใช้ได้ทั่วทั้ง app ผ่าน request.supabase)
await app.register(supabasePlugin);

// --- Health (ไม่ต้อง login)
app.get("/api/health", async (request, reply) => {
  const { error } = await request.supabaseService
    .from("shift_types")
    .select("code")
    .limit(1);
  return {
    ok: !error,
    supabase: error ? error.message : "connected",
    env: {
      url: !!process.env.SUPABASE_URL,
      anonLen: (process.env.SUPABASE_ANON_KEY || "").length,
      serviceLen: (process.env.SUPABASE_SERVICE_KEY || "").length,
    },
  };
});

// --- Auth routes (ไม่ต้อง guard)
await app.register(authRoutes, { prefix: "/api/auth" });

// --- Protected API routes (ต้อง login ก่อน)
await app.register(async (protectedApp) => {
  protectedApp.addHook("preHandler", authGuard);
  await protectedApp.register(scheduleRoutes, { prefix: "/api/schedule" });
  await protectedApp.register(staffRoutes, { prefix: "/api/staff" });
  await protectedApp.register(usersRoutes, { prefix: "/api/users" });
});

// --- Serve HTML pages
app.get("/", (_, reply) => reply.sendFile("index.html"));
app.get("/daily", (_, reply) => reply.sendFile("pages/daily.html"));
app.get("/summary", (_, reply) => reply.sendFile("pages/summary.html"));
app.get("/staff", (_, reply) => reply.sendFile("pages/staff.html"));
app.get("/users", (_, reply) => reply.sendFile("pages/users.html"));
app.get("/login", (_, reply) => reply.sendFile("pages/login.html"));
app.get("/import", (_, reply) => reply.sendFile("pages/import-help.html"));

export default app;
