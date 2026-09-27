import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo afecta `next dev`: permite abrir la app también en 127.0.0.1.
  // Útil para simular dos jugadores en un mismo navegador (cada host tiene sus propias cookies).
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
