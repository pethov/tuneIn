import { buildApp } from "./server";

async function start() {
  const app = await buildApp();

  app.get("/health", (_req, res) => res.send("ok"));

  const PORT = Number(process.env.PORT || 3001);
  // Bind to 0.0.0.0 so the server is reachable from the VM host/network.
  // Some environments bind only to loopback by default; explicit host avoids that.
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ GraphQL klar: http://0.0.0.0:${PORT}/graphql`);
  });
}

start().catch((e) => {
  console.error("Server failed:", e);
  process.exit(1);
});
