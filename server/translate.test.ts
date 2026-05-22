import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module to avoid real API calls in tests
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async ({ messages }: { messages: Array<{ role: string; content: string }> }) => {
    const userMsg = messages.find(m => m.role === "user")?.content ?? "";
    const mockTranslations: Record<string, string> = {
      "atuário sênior": "Senior Actuary",
      "departamento jurídico": "Legal Department",
      "saúde suplementar": "Supplementary Health",
      "previdência complementar": "Supplementary Pension",
      "benefícios pós-emprego": "Post-Employment Benefits",
      "gerente de projetos": "Project Manager",
    };
    const key = userMsg.toLowerCase().trim();
    const translated = mockTranslations[key] ?? `${userMsg} (EN)`;
    return {
      choices: [{ message: { content: translated } }],
    };
  }),
}));

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("translate.jobTitle", () => {
  it("traduz cargo do dicionário sem chamar o LLM", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.translate.jobTitle({ title: "Atuário" });
    expect(result.translated).toBe("Actuary");
  });

  it("traduz cargo feminino do dicionário", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.translate.jobTitle({ title: "Atuária" });
    expect(result.translated).toBe("Actuary");
  });

  it("traduz sócio-diretor do dicionário", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.translate.jobTitle({ title: "Sócio-Diretor" });
    expect(result.translated).toBe("Managing Partner");
  });

  it("traduz departamento jurídico via dicionário", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.translate.jobTitle({ title: "Departamento Jurídico" });
    expect(result.translated).toBe("Legal Department");
  });

  it("traduz saúde suplementar via dicionário", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.translate.jobTitle({ title: "Saúde Suplementar" });
    expect(result.translated).toBe("Supplementary Health");
  });

  it("traduz previdência complementar via dicionário", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.translate.jobTitle({ title: "Previdência Complementar" });
    expect(result.translated).toBe("Supplementary Pension");
  });

  it("traduz texto não encontrado no dicionário via LLM", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.translate.jobTitle({ title: "Atuário Sênior" });
    expect(result.translated).toBe("Senior Actuary");
  });

  it("traduz departamento não encontrado no dicionário via LLM", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.translate.jobTitle({ title: "Gerente de Projetos" });
    expect(result.translated).toBe("Project Manager");
  });

  it("rejeita string vazia", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.translate.jobTitle({ title: "" })).rejects.toThrow();
  });

  it("rejeita texto acima de 200 caracteres", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.translate.jobTitle({ title: "a".repeat(201) })).rejects.toThrow();
  });
});

describe("signature.buildHTML", () => {
  it("gera HTML com nome e cargo", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.signature.buildHTML({
      nome: "Maria Helena Silva",
      cargoPT: "Atuária Sênior",
      cargoEN: "Senior Actuary",
      fixo: "+55 (11) 3500-0000",
      cel: "+55 (11) 99999-0000",
      email: "maria.silva@assistants.com.br",
    });
    expect(result.html).toContain("Maria Helena Silva");
    expect(result.html).toContain("ATUÁRIA SÊNIOR");
    expect(result.html).toContain("Senior Actuary");
    expect(result.html).toContain("maria.silva@assistants.com.br");
    expect(result.html).toContain("+55 (11) 3500-0000");
    expect(result.html).toContain("+55 (11) 99999-0000");
  });

  it("omite linha de celular quando não informado", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.signature.buildHTML({
      nome: "João Silva",
      cargoPT: "Consultor",
      cargoEN: "Consultant",
      fixo: "+55 (11) 3500-0000",
      cel: "",
      email: "joao.silva@assistants.com.br",
    });
    // Celular não deve aparecer quando vazio
    expect(result.html).not.toContain(">M<");
    expect(result.html).not.toContain('"M"');
  });

  it("inclui endereços de São Paulo e Brasília", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.signature.buildHTML({
      nome: "Ana Costa",
      cargoPT: "Diretora",
      cargoEN: "Director",
      fixo: "+55 (61) 3000-0000",
      cel: "",
      email: "ana.costa@assistants.com.br",
    });
    expect(result.html).toContain("Pinheiros");
    expect(result.html).toContain("Bras");
  });

  it("inclui aviso de confidencialidade em português e inglês", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.signature.buildHTML({
      nome: "Pedro Lima",
      cargoPT: "Gerente",
      cargoEN: "Manager",
      fixo: "+55 (11) 3500-0000",
      cel: "",
      email: "pedro.lima@assistants.com.br",
    });
    expect(result.html).toContain("confidencial");
    expect(result.html).toContain("confidential");
  });
});

describe("signature.buildZip", () => {
  it("gera ZIP com base64 não vazio", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.signature.buildZip({
      nome: "Maria Helena Silva",
      cargoPT: "Atuária Sênior",
      cargoEN: "Senior Actuary",
      fixo: "+55 (11) 3500-0000",
      cel: "",
      email: "maria.silva@assistants.com.br",
      baseName: "maria_silva",
    });
    expect(result.zipB64.length).toBeGreaterThan(100);
    expect(result.fileName).toBe("maria_silva.zip");
  });
});
