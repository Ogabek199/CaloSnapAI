import { defineRailway, postgres, preserve, project, service } from "railway/iac";

export default defineRailway(() => {
  const db = postgres("postgres");

  // Built from the repo root so pnpm/turbo can resolve the workspace packages.
  const api = service("api", {
    build: "pnpm turbo run build --filter=@eda/api",
    preDeploy: "pnpm --filter @eda/api db:deploy",
    start: "pnpm --filter @eda/api start:prod",
    healthcheck: "/api/v1/health",
    healthcheckTimeout: 60,
    env: {
      NODE_ENV: "production",
      TZ: "Asia/Tashkent",
      DATABASE_URL: db.env.DATABASE_URL,
      REVENUECAT_ENTITLEMENT_IDS: "calosnap_pro",
      JWT_SECRET: preserve(),
      GEMINI_API_KEY: preserve(),
      CLOUDINARY_URL: preserve(),
      REVENUECAT_WEBHOOK_AUTH: preserve(),
      REVENUECAT_SECRET_API_KEY: preserve(),
    },
  });

  return project("taom-ai", {
    resources: [db, api],
  });
});
