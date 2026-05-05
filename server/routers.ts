import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { SIG_SYMBOL_B64, SIG_WORDMARK_B64 } from "@shared/signatureAssets";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  assets: router({
    signatureImages: publicProcedure.query(() => {
      return {
        symbolB64: SIG_SYMBOL_B64,
        wordmarkB64: SIG_WORDMARK_B64,
      };
    }),
  }),

  translate: router({
    jobTitle: publicProcedure
      .input(z.object({ title: z.string().min(1).max(200) }))
      .mutation(async ({ input }) => {
        // Local dictionary fallback for common actuarial/consulting titles
        const DICT: Record<string, string> = {
          "atuário": "Actuary",
          "atuária": "Actuary",
          "atuário sênior": "Senior Actuary",
          "atuária sênior": "Senior Actuary",
          "analista atuarial": "Actuarial Analyst",
          "analista atuarial sênior": "Senior Actuarial Analyst",
          "analista atuarial júnior": "Junior Actuarial Analyst",
          "analista atuarial pleno": "Mid-Level Actuarial Analyst",
          "consultor atuarial": "Actuarial Consultant",
          "consultora atuarial": "Actuarial Consultant",
          "consultor": "Consultant",
          "consultora": "Consultant",
          "consultor sênior": "Senior Consultant",
          "consultora sênior": "Senior Consultant",
          "sócio": "Partner",
          "sócia": "Partner",
          "sócio-diretor": "Managing Partner",
          "sócia-diretora": "Managing Partner",
          "sócio-fundador": "Founding Partner",
          "sócia-fundadora": "Founding Partner",
          "diretor": "Director",
          "diretora": "Director",
          "diretor executivo": "Executive Director",
          "diretora executiva": "Executive Director",
          "diretor técnico": "Technical Director",
          "diretora técnica": "Technical Director",
          "gerente": "Manager",
          "gerente de projetos": "Project Manager",
          "gerente atuarial": "Actuarial Manager",
          "coordenador": "Coordinator",
          "coordenadora": "Coordinator",
          "coordenador atuarial": "Actuarial Coordinator",
          "coordenadora atuarial": "Actuarial Coordinator",
          "estagiário": "Intern",
          "estagiária": "Intern",
          "assistente": "Assistant",
          "assistente atuarial": "Actuarial Assistant",
          "analista": "Analyst",
          "analista sênior": "Senior Analyst",
          "analista pleno": "Mid-Level Analyst",
          "analista júnior": "Junior Analyst",
          "superintendente": "Superintendent",
          "presidente": "President",
          "vice-presidente": "Vice President",
          "ceo": "CEO",
          "cfo": "CFO",
          "cto": "CTO",
          "controller": "Controller",
          "contador": "Accountant",
          "contadora": "Accountant",
          "auditor": "Auditor",
          "auditora": "Auditor",
          "advogado": "Lawyer",
          "advogada": "Lawyer",
          "analista financeiro": "Financial Analyst",
          "analista de dados": "Data Analyst",
          "cientista de dados": "Data Scientist",
          "desenvolvedor": "Developer",
          "desenvolvedora": "Developer",
          "engenheiro de dados": "Data Engineer",
          "engenheira de dados": "Data Engineer",
          "head de atuária": "Head of Actuarial",
          "head atuarial": "Head of Actuarial",
          "líder técnico": "Technical Lead",
          "secretária executiva": "Executive Secretary",
          "secretário executivo": "Executive Secretary",
          "administrativo": "Administrative Officer",
          "administrativa": "Administrative Officer",
          "auxiliar administrativo": "Administrative Assistant",
          "auxiliar administrativa": "Administrative Assistant",
          "recepcionista": "Receptionist",
          "office manager": "Office Manager",
        };

        const normalizedTitle = input.title.trim().toLowerCase();
        const dictMatch = DICT[normalizedTitle];

        // Try LLM first, fall back to dictionary
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a certified Portuguese-English translator specialized in actuarial, accounting, financial, and corporate terminology. 
Translate the given Brazilian Portuguese job title to its standard English equivalent used in the international actuarial and financial consulting industry.
Rules:
- Return ONLY the translated job title, nothing else
- Use proper capitalization (Title Case)
- Use standard international corporate titles (e.g., "Atuário" → "Actuary", "Sócio-Diretor" → "Managing Partner", "Analista Atuarial" → "Actuarial Analyst")
- If the title contains specialized terms from health insurance, pension funds, or post-employment benefits, use the correct technical English equivalents
- Do not add explanations, quotes, or any other text`,
              },
              {
                role: "user",
                content: input.title,
              },
            ],
            maxTokens: 100,
          });

          const content = response.choices?.[0]?.message?.content;
          const translated = typeof content === "string" ? content.trim() : "";
          if (translated) return { translated };
        } catch (err) {
          console.error("[translate.jobTitle] LLM failed:", err);
        }

        // Fallback to dictionary
        if (dictMatch) return { translated: dictMatch };

        // Last resort: return empty (UI will show placeholder)
        return { translated: "" };
      }),
  }),
});

export type AppRouter = typeof appRouter;
