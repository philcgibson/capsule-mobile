if (process.env.EAS_BUILD_PROFILE !== "production") {
  console.log("Skipping production preflight for a non-production EAS profile.");
  process.exit(0);
}

await import("./release-check.mjs");
