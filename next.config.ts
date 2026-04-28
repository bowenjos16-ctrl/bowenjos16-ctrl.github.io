import type { NextConfig } from "next";

// GitHub Pages como user-site: se sirve en https://<user>.github.io/ (raíz)
// No requiere basePath ni assetPrefix.
const nextConfig: NextConfig = {
  output: "export", // Static export para GitHub Pages
  images: { unoptimized: true }, // Pages no soporta el optimizador de imágenes
  trailingSlash: true,
};

export default nextConfig;
