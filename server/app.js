import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { Redis } from "ioredis";
import postgres from "postgres";

const app = new Hono();
const sql = postgres();
const redis = new Redis(6379, "redis");
const REPLICA_ID = crypto.randomUUID();

const redisCacheMiddleware = async (c, next) => {
  const cachedResponse = await redis.get(c.req.url);
  if (cachedResponse) {
    const res = JSON.parse(cachedResponse);
    return Response.json(res.json, res);
  }

  await next();

  if (!c.res.ok) {
    return;
  }

  const clonedResponse = c.res.clone();

  const res = {
    status: clonedResponse.status,
    statusText: clonedResponse.statusText,
    headers: Object.fromEntries(clonedResponse.headers),
    json: await clonedResponse.json(),
  };

  await redis.set(c.req.url, JSON.stringify(res));
};

const redisProducer = new Redis(6379, "redis");

const QUEUE_NAME = "users";

app.use("/*", cors());
app.use("/*", logger());
app.use("*", async (c, next) => {
  c.res.headers.set("X-Replica-Id", REPLICA_ID);
  await next();
});

app.get("/api", (c) => {
  return c.text("Hello new path!");
});

export default app;