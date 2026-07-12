const checks = [
  [
    "Production app environment",
    process.env.EXPO_PUBLIC_APP_ENV === "production",
    "Set EXPO_PUBLIC_APP_ENV=production.",
  ],
  [
    "HTTPS API URL",
    isHttpsUrl(process.env.EXPO_PUBLIC_API_URL, "/api/v1"),
    "Set EXPO_PUBLIC_API_URL to the production HTTPS /api/v1 endpoint.",
  ],
  [
    "HTTPS web URL",
    isHttpsUrl(process.env.EXPO_PUBLIC_WEB_URL),
    "Set EXPO_PUBLIC_WEB_URL to the production HTTPS origin.",
  ],
  [
    "Demo owner disabled",
    process.env.EXPO_PUBLIC_ENABLE_DEMO_OWNER !== "true"
      && process.env.EXPO_PUBLIC_AUTO_DEMO_OWNER !== "true",
    "Set both demo-owner flags to false.",
  ],
  [
    "Public discovery disabled",
    process.env.EXPO_PUBLIC_ENABLE_PUBLIC_DISCOVERY !== "true",
    "Keep EXPO_PUBLIC_ENABLE_PUBLIC_DISCOVERY=false for the first private release.",
  ],
  [
    "Support email configured",
    isEmail(process.env.EXPO_PUBLIC_SUPPORT_EMAIL),
    "Set EXPO_PUBLIC_SUPPORT_EMAIL to a monitored address.",
  ],
  [
    "Privacy policy configured",
    isHttpsUrl(process.env.EXPO_PUBLIC_PRIVACY_URL),
    "Set EXPO_PUBLIC_PRIVACY_URL to the published HTTPS privacy policy.",
  ],
  [
    "Terms configured",
    isHttpsUrl(process.env.EXPO_PUBLIC_TERMS_URL),
    "Set EXPO_PUBLIC_TERMS_URL to the published HTTPS terms.",
  ],
];

let failures = 0;

for (const [name, passed, remediation] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${passed ? "" : ` — ${remediation}`}`);
  failures += passed ? 0 : 1;
}

if (failures > 0) {
  console.error(`Mobile release preflight failed with ${failures} blocker(s).`);
  process.exit(1);
}

console.log("Mobile release preflight passed.");

function isHttpsUrl(value, suffix = "") {
  try {
    const url = new URL(value);

    return url.protocol === "https:"
      && Boolean(url.hostname)
      && !["localhost", "127.0.0.1"].includes(url.hostname)
      && (!suffix || url.pathname.replace(/\/$/, "").endsWith(suffix));
  } catch {
    return false;
  }
}

function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
