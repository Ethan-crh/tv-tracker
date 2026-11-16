import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Les images viennent directement du CDN de TMDB, à la bonne taille :
    // l'optimiseur intégré de Next (/_next/image) n'est pas utilisé.
    loader: "custom",
    loaderFile: "./lib/tmdb-image-loader.ts",
  },
  allowedDevOrigins: ["192.168.0.53"],
};

export default nextConfig;
