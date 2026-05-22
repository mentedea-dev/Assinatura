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
        // Local dictionary fallback for common actuarial/consulting titles and departments
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
          "sócio atuarial": "Actuarial Partner",
          "sócia atuarial": "Actuarial Partner",
          "sócio-diretor atuarial": "Managing Actuarial Partner",
          "sócia-diretora atuarial": "Managing Actuarial Partner",
          "diretor atuarial": "Actuarial Director",
          "diretora atuarial": "Actuarial Director",
          "gerente sênior": "Senior Manager",
          "consultor atuarial sênior": "Senior Actuarial Consultant",
          "consultora atuarial sênior": "Senior Actuarial Consultant",
          "analista de benefícios": "Benefits Analyst",
          "consultor de benefícios": "Benefits Consultant",
          "consultora de benefícios": "Benefits Consultant",
          "consultor de previdência": "Pension Consultant",
          "consultora de previdência": "Pension Consultant",
          "analista de previdência": "Pension Analyst",
          "analista de saúde suplementar": "Supplementary Health Analyst",
          "consultor de saúde suplementar": "Supplementary Health Consultant",
          "consultora de saúde suplementar": "Supplementary Health Consultant",
          "gerente de operações": "Operations Manager",
          "gerente comercial": "Commercial Manager",
          "gerente financeiro": "Financial Manager",
          "gerente financeira": "Financial Manager",
          "analista de compliance": "Compliance Analyst",
          "analista de riscos": "Risk Analyst",
          "gerente de riscos": "Risk Manager",
          "diretor de operações": "Chief Operating Officer",
          "diretora de operações": "Chief Operating Officer",
          "diretor financeiro": "Chief Financial Officer",
          "diretora financeira": "Chief Financial Officer",
          "trainee": "Trainee",
          "jovem aprendiz": "Apprentice",
          "especialista": "Specialist",
          "especialista atuarial": "Actuarial Specialist",
          "técnico atuarial": "Actuarial Technician",
          "técnica atuarial": "Actuarial Technician",
        };

        const normalizedTitle = input.title.trim().toLowerCase();
        const dictMatch = DICT[normalizedTitle];

        // Try dictionary first (instant, no network dependency)
        if (dictMatch) return { translated: dictMatch };

        // Fallback to LLM for any text not in dictionary (titles, departments, or any other text)
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a certified Portuguese-English translator specialized in actuarial, accounting, financial, and corporate terminology.
Translate the given Brazilian Portuguese text to its standard English equivalent used in the international actuarial and financial consulting industry.
The input may be a job title, a department name, a business area, or any other professional text.
Rules:
- Return ONLY the translated text, nothing else
- Use proper capitalization (Title Case)
- Use standard international corporate and technical terminology (e.g., "Atuário" → "Actuary", "Sócio-Diretor" → "Managing Partner", "Saúde Suplementar" → "Supplementary Health", "Previdência Complementar" → "Supplementary Pension", "Benefícios Pós-Emprego" → "Post-Employment Benefits")
- If the text contains specialized terms from health insurance, pension funds, or post-employment benefits, use the correct technical English equivalents
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

        // Last resort: return empty (UI will show placeholder)
        return { translated: "" };
      }),
  }),
});

export type AppRouter = typeof appRouter;
