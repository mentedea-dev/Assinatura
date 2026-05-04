import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
      // Read pre-generated base64 images for email signature
      // Use inline base64 so they work in any deployment environment
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const assetsDir = path.join(__dirname, "assets");
      const symbolB64 = fs.readFileSync(path.join(assetsDir, "sig_symbol_b64.txt"), "utf-8").trim();
      const wordmarkB64 = fs.readFileSync(path.join(assetsDir, "sig_wordmark_b64.txt"), "utf-8").trim();
      return {
        symbolB64: `data:image/png;base64,${symbolB64}`,
        wordmarkB64: `data:image/png;base64,${wordmarkB64}`,
      };
    }),
  }),

  translate: router({
    jobTitle: publicProcedure
      .input(z.object({ title: z.string().min(1).max(200) }))
      .mutation(async ({ input }) => {
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
        });

        const content = response.choices?.[0]?.message?.content;
        const translated = typeof content === "string" ? content.trim() : "";
        return { translated };
      }),
  }),
});

export type AppRouter = typeof appRouter;
