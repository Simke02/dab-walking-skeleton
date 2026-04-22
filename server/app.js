import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { auth } from "./auth.js";
import { upgradeWebSocket } from "@hono/hono/deno";
import postgres from "postgres";

const app = new Hono();
const sql = postgres();
const REPLICA_ID = crypto.randomUUID();

app.use("/*", cors({
  origin: "http://localhost:8000",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
}));
app.use("/*", logger());
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use("*", async (c, next) => {
  c.res.headers.set("X-Replica-Id", REPLICA_ID);
  await next();
});

app.get("/api", (c) => {
  return c.text("Hello new path!");
});

app.get("/api/lgtm-test", (c) => {
  console.log("Hello log collection :)");
  return c.json({ message: "Hello, world!" });
});

export default app;