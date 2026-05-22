import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockImplementation(({ messages }: { messages: { role: string; content: string }[] }) => {
    const userMessage = messages.find((m) => m.role === "user")?.content ?? "";
    const mockTranslations: Record<string, string> = {
      "Atuária Sênior": "Senior Actuary",
      "Saúde Suplementar": "Supplementary Health",
      "Previdência Complementar": "Supplementary Pension",
      "Benefícios Pós-Emprego": "Post-Employment Benefits",
    };
    const translated = mockTranslations[userMessage] ?? "Translated Text";
    return Promise.resolve({
      choices: [{ message: { content: translated } }],
    });
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("translate.jobTitle", () => {
  it("translates a Portuguese job title to English", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.translate.jobTitle({ title: "Atuária Sênior" });

    expect(result).toHaveProperty("translated");
    expect(typeof result.translated).toBe("string");
    expect(result.translated).toBe("Senior Actuary");
  });

  it("translates a Portuguese department name to English", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.translate.jobTitle({ title: "Saúde Suplementar" });

    expect(result).toHaveProperty("translated");
    expect(typeof result.translated).toBe("string");
    expect(result.translated).toBe("Supplementary Health");
  });

  it("translates a Portuguese business area to English", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.translate.jobTitle({ title: "Previdência Complementar" });

    expect(result).toHaveProperty("translated");
    expect(typeof result.translated).toBe("string");
    expect(result.translated).toBe("Supplementary Pension");
  });

  it("translates post-employment benefits area to English", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.translate.jobTitle({ title: "Benefícios Pós-Emprego" });

    expect(result).toHaveProperty("translated");
    expect(typeof result.translated).toBe("string");
    expect(result.translated).toBe("Post-Employment Benefits");
  });

  it("rejects empty title", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.translate.jobTitle({ title: "" })).rejects.toThrow();
  });

  it("rejects title exceeding 200 characters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const longTitle = "A".repeat(201);
    await expect(caller.translate.jobTitle({ title: longTitle })).rejects.toThrow();
  });
});
