import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Produire un dossier .next/standalone contenant uniquement les fichiers
  // nécessaires à l'exécution, plus un serveur minimal (server.js).
  output: "standalone",
  
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
