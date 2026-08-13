/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // OneDrive locks .pack.gz_ temp files during atomic renames, corrupting webpack cache.
      // Using memory cache in dev avoids writing those temp files entirely.
      config.cache = { type: "memory" };
    }
    return config;
  },
};
export default nextConfig;
