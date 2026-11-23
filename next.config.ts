import type { NextConfig } from "next";

// No `cacheComponents`/`partialPrefetching`: with them, a Server Action submitted without JavaScript
// that returns an error answers with an incomplete document (no <html>), so the forms would not
// work without JS (D-21). Every route reads the session, so they are dynamic anyway.
const nextConfig: NextConfig = {};

export default nextConfig;
