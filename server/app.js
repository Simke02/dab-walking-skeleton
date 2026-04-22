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

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return next();
  }

  c.set("user", session.user.name);
  return next();
});

app.use("/api/ws-chat", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    c.status(401);
    return c.json({ message: "Unauthorized" });
  }

  return next();
});

const sockets = new Set();

app.get(
  "/api/ws-chat",
  upgradeWebSocket((c) => {
    const user = c.get("user");
    return {
      onOpen: (event, ws) => {
        sockets.add(ws);
      },
      onMessage(event, ws) {
        const message = JSON.parse(event.data);
        message.date = Date.now();
        message.message = `${user}: ${message.message}`;

        for (const socket of sockets) {
          socket.send(
            JSON.stringify(message),
          );
        }
      },
      onClose: (event, ws) => {
        sockets.delete(ws);
        ws.close();
      },
      onError: (event, ws) => {
        sockets.delete(ws);
        ws.close();
      },
    };
  }),
);

app.get("/api", (c) => {
  return c.text("Hello new path!");
});

app.get("/api/lgtm-test", (c) => {
  console.log("Hello log collection :)");
  return c.json({ message: "Hello, world!" });
});

export default app;