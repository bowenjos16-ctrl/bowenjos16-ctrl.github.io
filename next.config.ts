import type { NextConfig } from "next";

// GitHub Pages: el repo se sirve en https://<user>.github.io/<repo>/
// por lo que necesitamos basePath y assetPrefix con el nombre del repo.
const repo = "corte-piedra";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export", // Static export para GitHub Pages
  images: { unoptimized: true }, // Pages no soporta el optimizador de imágenes
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  trailingSlash: true,
};

export default nextConfig;
