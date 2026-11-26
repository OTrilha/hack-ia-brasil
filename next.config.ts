import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Short link for the approval email; temporary so the Notion URL can change later.
  async redirects() {
    return [
      {
        source: "/guia",
        destination:
          "https://hackiabrasil.notion.site/Deck-do-participante-Hack-IA-Brasil-424145f3410e8062b3f6d8f6c2d3f1c6",
        permanent: false,
      },
    ];
  },
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
