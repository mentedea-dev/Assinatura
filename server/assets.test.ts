import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("assets.signatureImages", () => {
  it("returns base64 data URIs for symbol and wordmark", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.assets.signatureImages();

    // Both fields must exist and be non-empty
    expect(result.symbolB64).toBeDefined();
    expect(result.wordmarkB64).toBeDefined();
    expect(result.symbolB64.length).toBeGreaterThan(100);
    expect(result.wordmarkB64.length).toBeGreaterThan(100);

    // Must be valid data URIs with base64 PNG
    expect(result.symbolB64).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
    expect(result.wordmarkB64).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
  });

  it("returns consistent results on multiple calls", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const r1 = await caller.assets.signatureImages();
    const r2 = await caller.assets.signatureImages();

    expect(r1.symbolB64).toBe(r2.symbolB64);
    expect(r1.wordmarkB64).toBe(r2.wordmarkB64);
  });
});
