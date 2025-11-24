import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import resolvers from "../graphql/resolvers";

const typeDefs = fs.readFileSync(
  path.resolve(__dirname, "../graphql/schema.graphql"),
  "utf8",
);

export async function buildApp(): Promise<Express> {
  const app = express();

  // Handle Private Network Access preflight for modern browsers.
  // Browsers will send the header 'Access-Control-Request-Private-Network' on OPTIONS
  // when a less-private context (public) attempts to access a more-private resource
  // (loopback). If present, the server must respond with
  // 'Access-Control-Allow-Private-Network: true' to allow the request.
  app.use((req, res, next) => {
    if (
      req.method === "OPTIONS" &&
      typeof req.headers["access-control-request-private-network"] !==
        "undefined"
    ) {
      res.setHeader("Access-Control-Allow-Private-Network", "true");
    }
    next();
  });
  const allowed = [
    "http://it2810-17.idi.ntnu.no",
    "https://it2810-17.idi.ntnu.no",
    "http://localhost:5173",
  ];

  const corsOptions: cors.CorsOptions = {
    origin(origin, cb) {
      // Allow requests from non-browser contexts (no origin)
      if (!origin) return cb(null, true);

      // Allow explicitly listed origins
      if (allowed.includes(origin)) return cb(null, true);

      // Allow any localhost or 127.0.0.1 on any port (developer convenience)
      try {
        const url = new URL(origin);
        if (
          (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
          (url.protocol === "http:" || url.protocol === "https:")
        ) {
          return cb(null, true);
        }
      } catch {
        // fallthrough to rejection
      }

      return cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    // allow both header-names
    allowedHeaders: ["content-type", "x-user-id", "x-anon-id"],
    credentials: false,
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions)); // preflight action
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        // accept both names – use same value in ctx.userId
        const incoming =
          (req.headers["x-anon-id"] as string | undefined) ??
          (req.headers["x-user-id"] as string | undefined);

        const userId =
          typeof incoming === "string" && incoming.trim()
            ? incoming.trim()
            : undefined; // let resolvers fail if necessary

        return { userId };
      },
    }),
  );

  return app;
}
