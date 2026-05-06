/**
 * Production entry point.
 * Re-exports the full server from _core/index.ts, which mounts the tRPC API,
 * OAuth routes, storage proxy and static file serving.
 *
 * The build script compiles server/_core/index.ts into dist/index.js, so this
 * file must not be used as a standalone server — it exists only to satisfy
 * editors that expect a top-level server/index.ts.
 *
 * If you need to run the server directly, use:
 *   pnpm dev          → NODE_ENV=development tsx watch server/_core/index.ts
 *   pnpm start        → NODE_ENV=production node dist/index.js
 */
export * from "./_core/index";
