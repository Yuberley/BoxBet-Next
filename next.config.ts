import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo afecta `next dev`: orígenes extra permitidos además de localhost.
  //   127.0.0.1 → simular dos jugadores en un mismo navegador (cada host tiene sus propias cookies).
  //   DEV_ORIGINS → p. ej. la IP del PC en la red Wi-Fi para jugar desde el celular ("192.168.1.20").
  allowedDevOrigins: ["127.0.0.1", ...(process.env.DEV_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [])],
};

export default nextConfig;
