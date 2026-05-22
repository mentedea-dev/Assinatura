import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load base64 assets from server/assets at startup (small files, safe to cache)
const SIG_SYMBOL_B64 = (() => {
  try {
    const raw = readFileSync(join(__dirname, "assets/sig_symbol_b64.txt"), "utf-8").trim();
    return raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
  } catch { return ""; }
})();

const SIG_WORDMARK_B64 = (() => {
  try {
    const raw = readFileSync(join(__dirname, "assets/sig_wordmark_b64.txt"), "utf-8").trim();
    return raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
  } catch { return ""; }
})();

const ENDERECO_SP = "Rua Cláudio Soares, 72 - 8º andar - Pinheiros - São Paulo/SP - CEP: 05422-030";
const ENDERECO_BSB = "SCS Quadra 9, Ed. Parque Cidade Corporate - Torre C - Bloco C - 10º andar - Brasília/DF - CEP: 70308-200";
const AVISO_PT = "Esta mensagem, incluindo seus anexos, é confidencial e destinada exclusivamente ao(s) destinatário(s) indicado(s). Se você não é o destinatário pretendido, fica notificado de que qualquer uso, disseminação, distribuição ou cópia desta mensagem é estritamente proibido. Caso tenha recebido esta mensagem por engano, por favor notifique imediatamente o remetente por e-mail e apague esta mensagem e todos os seus anexos de seu sistema. A Assistants Consulting não se responsabiliza por opiniões pessoais do remetente que não estejam relacionadas aos negócios da empresa, nem por alterações realizadas após o envio desta mensagem.";
const AVISO_EN = "This message, including any attachments, is confidential and intended solely for the named recipient(s). If you are not the intended recipient, you are hereby notified that any use, dissemination, distribution, or copying of this message is strictly prohibited. If you have received this message in error, please immediately notify the sender by e-mail and delete this message and all attachments from your system. Assistants Consulting shall not be held liable for personal opinions expressed by the sender that are unrelated to the company's business, nor for any alterations made after this message was sent.";

// Static dictionary for instant lookup (no LLM cost)
const DICT: Record<string, string> = {
  "atuário": "Actuary", "atuária": "Actuary",
  "atuário sênior": "Senior Actuary", "atuária sênior": "Senior Actuary",
  "atuário júnior": "Junior Actuary", "atuária júnior": "Junior Actuary",
  "atuário pleno": "Mid-Level Actuary", "atuária plena": "Mid-Level Actuary",
  "consultor": "Consultant", "consultora": "Consultant",
  "consultor sênior": "Senior Consultant", "consultora sênior": "Senior Consultant",
  "consultor atuarial": "Actuarial Consultant", "consultora atuarial": "Actuarial Consultant",
  "consultor atuarial sênior": "Senior Actuarial Consultant", "consultora atuarial sênior": "Senior Actuarial Consultant",
  "sócio": "Partner", "sócia": "Partner",
  "sócio-diretor": "Managing Partner", "sócia-diretora": "Managing Partner",
  "sócio-fundador": "Founding Partner", "sócia-fundadora": "Founding Partner",
  "sócio atuarial": "Actuarial Partner", "sócia atuarial": "Actuarial Partner",
  "diretor": "Director", "diretora": "Director",
  "diretor executivo": "Executive Director", "diretora executiva": "Executive Director",
  "diretor técnico": "Technical Director", "diretora técnica": "Technical Director",
  "diretor atuarial": "Actuarial Director", "diretora atuarial": "Actuarial Director",
  "gerente": "Manager", "gerente sênior": "Senior Manager",
  "gerente de projetos": "Project Manager", "gerente atuarial": "Actuarial Manager",
  "gerente de operações": "Operations Manager", "gerente comercial": "Commercial Manager",
  "gerente financeiro": "Financial Manager", "gerente financeira": "Financial Manager",
  "gerente de riscos": "Risk Manager",
  "coordenador": "Coordinator", "coordenadora": "Coordinator",
  "coordenador atuarial": "Actuarial Coordinator", "coordenadora atuarial": "Actuarial Coordinator",
  "analista": "Analyst", "analista sênior": "Senior Analyst",
  "analista pleno": "Mid-Level Analyst", "analista júnior": "Junior Analyst",
  "analista financeiro": "Financial Analyst", "analista de dados": "Data Analyst",
  "analista de benefícios": "Benefits Analyst", "analista de previdência": "Pension Analyst",
  "analista de saúde suplementar": "Supplementary Health Analyst",
  "analista de compliance": "Compliance Analyst", "analista de riscos": "Risk Analyst",
  "especialista": "Specialist", "especialista atuarial": "Actuarial Specialist",
  "técnico atuarial": "Actuarial Technician", "técnica atuarial": "Actuarial Technician",
  "estagiário": "Intern", "estagiária": "Intern",
  "assistente": "Assistant", "assistente atuarial": "Actuarial Assistant",
  "trainee": "Trainee", "jovem aprendiz": "Apprentice",
  "superintendente": "Superintendent", "presidente": "President",
  "vice-presidente": "Vice President", "ceo": "CEO", "cfo": "CFO", "cto": "CTO",
  "controller": "Controller", "contador": "Accountant", "contadora": "Accountant",
  "auditor": "Auditor", "auditora": "Auditor",
  "advogado": "Lawyer", "advogada": "Lawyer",
  "cientista de dados": "Data Scientist",
  "desenvolvedor": "Developer", "desenvolvedora": "Developer",
  "engenheiro de dados": "Data Engineer", "engenheira de dados": "Data Engineer",
  "head de atuária": "Head of Actuarial", "head atuarial": "Head of Actuarial",
  "líder técnico": "Technical Lead",
  "secretária executiva": "Executive Secretary", "secretário executivo": "Executive Secretary",
  "administrativo": "Administrative Officer", "administrativa": "Administrative Officer",
  "auxiliar administrativo": "Administrative Assistant", "auxiliar administrativa": "Administrative Assistant",
  "recepcionista": "Receptionist", "office manager": "Office Manager",
  "consultor de benefícios": "Benefits Consultant", "consultora de benefícios": "Benefits Consultant",
  "consultor de previdência": "Pension Consultant", "consultora de previdência": "Pension Consultant",
  "consultor de saúde suplementar": "Supplementary Health Consultant",
  "consultora de saúde suplementar": "Supplementary Health Consultant",
  "diretor de operações": "Chief Operating Officer", "diretora de operações": "Chief Operating Officer",
  "diretor financeiro": "Chief Financial Officer", "diretora financeira": "Chief Financial Officer",
  "saúde suplementar": "Supplementary Health",
  "previdência complementar": "Supplementary Pension",
  "benefícios pós-emprego": "Post-Employment Benefits",
  "benefícios pós emprego": "Post-Employment Benefits",
  "departamento jurídico": "Legal Department",
  "departamento financeiro": "Financial Department",
  "departamento de rh": "Human Resources Department",
  "recursos humanos": "Human Resources",
  "tecnologia da informação": "Information Technology",
  "marketing": "Marketing", "comercial": "Commercial",
  "operações": "Operations", "financeiro": "Finance",
  "jurídico": "Legal", "compliance": "Compliance",
  "riscos": "Risk Management", "auditoria": "Audit",
};

function buildSignatureHTML(params: {
  nome: string; cargoPT: string; cargoEN: string;
  fixo: string; cel: string; email: string;
  fotoB64?: string; symbolB64: string; wordmarkB64: string;
  useRelativePaths?: boolean; baseName?: string;
}): string {
  const { nome, cargoPT, cargoEN, fixo, cel, email, fotoB64, symbolB64, wordmarkB64, useRelativePaths, baseName } = params;
  const hasPhoto = !!fotoB64;
  const photoSize = 90;
  const symbolSize = 44;
  const sz = hasPhoto ? photoSize : symbolSize;

  let imgSrc: string;
  let wmSrc: string;
  if (useRelativePaths && baseName) {
    imgSrc = hasPhoto ? `${baseName}_files/photo.png` : `${baseName}_files/symbol.png`;
    wmSrc = `${baseName}_files/wordmark.png`;
  } else {
    imgSrc = hasPhoto && fotoB64 ? fotoB64 : symbolB64;
    wmSrc = wordmarkB64;
  }

  const photoHTML = hasPhoto
    ? `<img src="${imgSrc}" alt="${nome}" width="${photoSize}" height="${photoSize}" style="display:block;width:${photoSize}px;height:${photoSize}px;border-radius:50%;border:0;outline:none;" />`
    : `<img src="${imgSrc}" alt="A" width="${symbolSize}" height="${symbolSize}" style="display:block;width:${symbolSize}px;height:${symbolSize}px;border:0;outline:none;" />`;

  return [
    `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Calibri,Arial,Helvetica,sans-serif;max-width:520px;border:none;mso-table-lspace:0pt;mso-table-rspace:0pt;">`,
    `<tr><td colspan="2" height="10" style="height:10px;border-top:1px solid #E7E9EB;border-left:none;border-right:none;border-bottom:none;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
    `<tr>`,
    `<td valign="top" style="padding:0;width:${sz}px;border:none;">${photoHTML}</td>`,
    `<td valign="top" style="padding:0 0 0 14px;border:none;">`,
    `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:none;mso-table-lspace:0pt;mso-table-rspace:0pt;">`,
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#0B1929;line-height:18px;padding:0 0 1px 0;border:none;mso-line-height-rule:exactly;">${nome || "[Nome Completo]"}</td></tr>`,
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;color:#0B1929;line-height:12px;padding:0;border:none;text-transform:uppercase;letter-spacing:0.8px;mso-line-height-rule:exactly;">${(cargoPT || "[Cargo]").toUpperCase()}</td></tr>`,
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:9px;font-weight:normal;color:#6B7B8D;line-height:12px;padding:0 0 8px 0;border:none;font-style:italic;mso-line-height-rule:exactly;">${cargoEN || "[Position]"}</td></tr>`,
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><span style="color:#6B7B8D;">T</span>&nbsp;&nbsp;${fixo || "+55 (XX) XXXX-XXXX"}</td></tr>`,
    ...(cel ? [`<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><span style="color:#6B7B8D;">M</span>&nbsp;&nbsp;${cel}</td></tr>`] : []),
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><span style="color:#6B7B8D;">E</span>&nbsp;&nbsp;<a href="mailto:${email || "nome@assistants.com.br"}" style="color:#E67E22;text-decoration:none;">${email || "nome@assistants.com.br"}</a></td></tr>`,
    `</table></td></tr>`,
    `<tr><td colspan="2" height="10" style="height:10px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
    `<tr><td colspan="2" style="padding:0;border:none;"><a href="https://www.assistants.com.br" target="_blank" style="text-decoration:none;"><img src="${wmSrc}" alt="Assistants Consulting" width="180" height="40" style="display:block;border:0;outline:none;width:180px;height:40px;" /></a></td></tr>`,
    `<tr><td colspan="2" height="8" style="height:8px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
    `<tr><td colspan="2" height="1" style="height:1px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;background-color:#E7E9EB;">&nbsp;</td></tr>`,
    `<tr><td colspan="2" height="4" style="height:4px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
    `<tr><td colspan="2" style="padding:0;border:none;"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;line-height:12px;mso-line-height-rule:exactly;"><span style="font-weight:bold;">S\u00e3o Paulo</span>&nbsp;&nbsp;${ENDERECO_SP}</td></tr><tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;line-height:12px;mso-line-height-rule:exactly;padding:2px 0 0 0;"><span style="font-weight:bold;">Bras\u00edlia</span>&nbsp;&nbsp;${ENDERECO_BSB}</td></tr></table></td></tr>`,
    `<tr><td colspan="2" height="6" style="height:6px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
    `<tr><td colspan="2" style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:7px;color:#B0B8C1;line-height:10px;mso-line-height-rule:exactly;width:520px;">${AVISO_PT}</td></tr>`,
    `<tr><td colspan="2" height="4" style="height:4px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
    `<tr><td colspan="2" style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:7px;color:#B0B8C1;line-height:10px;mso-line-height-rule:exactly;font-style:italic;width:520px;">${AVISO_EN}</td></tr>`,
    `</table>`,
  ].join('');
}

const signatureInput = z.object({
  nome: z.string().max(120),
  cargoPT: z.string().max(120),
  cargoEN: z.string().max(120),
  fixo: z.string().max(30),
  cel: z.string().max(30).optional().default(""),
  email: z.string().max(200),
  fotoB64: z.string().max(200000).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  assets: router({
    signatureImages: publicProcedure.query(() => ({
      symbolB64: SIG_SYMBOL_B64,
      wordmarkB64: SIG_WORDMARK_B64,
    })),
  }),

  translate: router({
    jobTitle: publicProcedure
      .input(z.object({ title: z.string().min(1).max(200) }))
      .mutation(async ({ input }) => {
        const normalizedTitle = input.title.trim().toLowerCase();
        const dictMatch = DICT[normalizedTitle];
        if (dictMatch) return { translated: dictMatch };

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
- Use standard international corporate and technical terminology (e.g., "Atuário" → "Actuary", "Sócio-Diretor" → "Managing Partner", "Saúde Suplementar" → "Supplementary Health", "Previdência Complementar" → "Supplementary Pension", "Benefícios Pós-Emprego" → "Post-Employment Benefits", "Departamento Jurídico" → "Legal Department")
- If the text contains specialized terms from health insurance, pension funds, or post-employment benefits, use the correct technical English equivalents
- Do not add explanations, quotes, or any other text`,
              },
              { role: "user", content: input.title },
            ],
            maxTokens: 100,
          });
          const content = response.choices?.[0]?.message?.content;
          const translated = typeof content === "string" ? content.trim() : "";
          if (translated) return { translated };
        } catch (err) {
          console.error("[translate.jobTitle] LLM failed:", err);
        }
        return { translated: "" };
      }),
  }),

  signature: router({
    /**
     * Returns the full HTML string for clipboard copy (inline base64 images).
     */
    buildHTML: publicProcedure
      .input(signatureInput)
      .mutation(({ input }) => {
        const html = buildSignatureHTML({
          ...input,
          cel: input.cel ?? "",
          symbolB64: SIG_SYMBOL_B64,
          wordmarkB64: SIG_WORDMARK_B64,
        });
        return { html };
      }),

    /**
     * Returns a ZIP file as base64 containing the .htm file + _files folder.
     * The ZIP is built server-side to avoid shipping JSZip in the bundle.
     */
    buildZip: publicProcedure
      .input(signatureInput.extend({ baseName: z.string().max(80).default("assinatura") }))
      .mutation(async ({ input }) => {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        const baseName = input.baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const filesFolder = zip.folder(`${baseName}_files`)!;

        // Decode base64 images and add to _files folder
        function b64ToBuffer(dataUri: string): Buffer {
          const base64 = dataUri.includes(",") ? dataUri.split(",")[1] : dataUri;
          return Buffer.from(base64, "base64");
        }

        filesFolder.file("symbol.png", b64ToBuffer(SIG_SYMBOL_B64));
        filesFolder.file("wordmark.png", b64ToBuffer(SIG_WORDMARK_B64));
        if (input.fotoB64) {
          filesFolder.file("photo.png", b64ToBuffer(input.fotoB64));
        }

        const sigHTML = buildSignatureHTML({
          ...input,
          cel: input.cel ?? "",
          symbolB64: SIG_SYMBOL_B64,
          wordmarkB64: SIG_WORDMARK_B64,
          useRelativePaths: true,
          baseName,
        });

        const fullHTM = `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 15">
<meta name="Originator" content="Microsoft Word 15">
<!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
<style>
body { margin: 0; padding: 0; }
</style>
</head>
<body>
${sigHTML}
</body>
</html>`;

        zip.file(`${baseName}.htm`, fullHTM);

        const zipB64 = await zip.generateAsync({ type: "base64", compression: "DEFLATE" });
        return { zipB64, fileName: `${baseName}.zip` };
      }),
  }),
});

export type AppRouter = typeof appRouter;
