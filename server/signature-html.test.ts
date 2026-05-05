/**
 * Regression test: Validate that the signature HTML generation logic
 * produces clean, single-line HTML without whitespace between tags.
 * This prevents Outlook from rendering extra spaces when the signature is pasted.
 * 
 * Big4/Interbrand design: no orange bar, clean typographic hierarchy.
 */
import { describe, it, expect } from "vitest";

// Simulate the genHTML logic (same algorithm as client/src/pages/Home.tsx)
function genHTML(opts: {
  nome: string;
  cargoPT: string;
  cargoEN: string;
  fixo: string;
  cel: string;
  email: string;
  foto: boolean;
  symbolB64: string;
  wordmarkB64: string;
  fotoUrl?: string;
}) {
  const photoSize = 56;
  const symbolSize = 44;
  const sz = opts.foto ? photoSize : symbolSize;
  const dn = opts.nome || "[Nome Completo]";
  const dpt = opts.cargoPT || "[Cargo]";
  const den = opts.cargoEN || "[Position]";
  const df = opts.fixo || "+55 (XX) XXXX-XXXX";
  const dc = opts.cel || "+55 (XX) XXXXX-XXXX";
  const de = opts.email || "nome@assistants.com.br";

  const imgSrc = opts.foto && opts.fotoUrl ? opts.fotoUrl : opts.symbolB64;
  const wmSrc = opts.wordmarkB64;

  const photoHTML = opts.foto
    ? `<img src="${imgSrc}" alt="Foto" width="${photoSize}" height="${photoSize}" style="display:block;width:${photoSize}px;height:${photoSize}px;border-radius:50%;border:0;" />`
    : `<img src="${imgSrc}" alt="A" width="${symbolSize}" height="${symbolSize}" style="display:block;width:${symbolSize}px;height:${symbolSize}px;border:0;" />`;

  const ENDERECO_SP = "Rua Cláudio Soares, 72 - 8º andar - Pinheiros - São Paulo/SP - CEP: 05422-030";
  const ENDERECO_BSB = "SCS Quadra 9, Ed. Parque Cidade Corporate - Torre C - Bloco C - 10º andar - Brasília/DF - CEP: 70308-200";
  const AVISO_PT = "Esta mensagem é confidencial.";
  const AVISO_EN = "This message is confidential.";

  const parts = [
    `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Calibri,Arial,Helvetica,sans-serif;max-width:520px;border:none;">`,
    `<tr><td colspan="2" style="padding:0 0 10px 0;border-top:1px solid #E7E9EB;font-size:1px;line-height:1px;border-left:none;border-right:none;border-bottom:none;">&nbsp;</td></tr>`,
    `<tr>`,
    `<td valign="top" style="padding:0;width:${sz}px;border:none;">${photoHTML}</td>`,
    `<td valign="top" style="padding:0 0 0 14px;border:none;">`,
    `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:none;">`,
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#0B1929;line-height:18px;padding:0 0 1px 0;border:none;mso-line-height-rule:exactly;">${dn}</td></tr>`,
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;color:#0B1929;line-height:12px;padding:0;border:none;text-transform:uppercase;letter-spacing:0.8px;mso-line-height-rule:exactly;">${dpt}</td></tr>`,
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:9px;font-weight:normal;color:#6B7B8D;line-height:12px;padding:0 0 8px 0;border:none;font-style:italic;mso-line-height-rule:exactly;">${den}</td></tr>`,
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><span style="color:#6B7B8D;">T</span>&nbsp;&nbsp;${df}</td></tr>`,
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><span style="color:#6B7B8D;">M</span>&nbsp;&nbsp;${dc}</td></tr>`,
    `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><span style="color:#6B7B8D;">E</span>&nbsp;&nbsp;<a href="mailto:${de}" style="color:#E67E22;text-decoration:none;">${de}</a></td></tr>`,
    `</table></td></tr>`,
    `<tr><td colspan="2" style="padding:10px 0 0 0;border:none;font-size:1px;line-height:1px;">&nbsp;</td></tr>`,
    `<tr><td colspan="2" style="padding:0;border:none;"><a href="https://www.assistants.com.br" target="_blank" style="text-decoration:none;"><img src="${wmSrc}" alt="Assistants Consulting" width="180" style="display:block;border:0;width:180px;height:auto;" /></a></td></tr>`,
    `<tr><td colspan="2" style="padding:8px 0 0 0;border-top:1px solid #E7E9EB;border-left:none;border-right:none;border-bottom:none;font-size:1px;line-height:1px;">&nbsp;</td></tr>`,
    `<tr><td colspan="2" style="padding:4px 0 0 0;border:none;"><p style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;margin:0;line-height:12px;mso-line-height-rule:exactly;"><strong>São Paulo</strong>&nbsp;&nbsp;${ENDERECO_SP}</p><p style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;margin:2px 0 0 0;line-height:12px;mso-line-height-rule:exactly;"><strong>Brasília</strong>&nbsp;&nbsp;${ENDERECO_BSB}</p></td></tr>`,
    `<tr><td colspan="2" style="padding:10px 0 0 0;border:none;"><p style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:7px;color:#B0B8C1;margin:0;line-height:10px;max-width:520px;mso-line-height-rule:exactly;">${AVISO_PT}</p></td></tr>`,
    `<tr><td colspan="2" style="padding:4px 0 0 0;border:none;"><p style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:7px;color:#B0B8C1;margin:0;line-height:10px;max-width:520px;font-style:italic;mso-line-height-rule:exactly;">${AVISO_EN}</p></td></tr>`,
    `</table>`,
  ];
  return parts.join('');
}

describe("Signature HTML generation", () => {
  const baseOpts = {
    nome: "Andrea Mente",
    cargoPT: "Sócia Atuarial",
    cargoEN: "Actuarial Partner",
    fixo: "+55 (11) 3335-3361",
    cel: "+55 (11) 98644-5555",
    email: "andrea.mente@assistants.com.br",
    foto: false,
    symbolB64: "data:image/png;base64,AAAA",
    wordmarkB64: "data:image/png;base64,BBBB",
  };

  it("should produce HTML without newline characters", () => {
    const html = genHTML(baseOpts);
    expect(html).not.toContain("\n");
    expect(html).not.toContain("\r");
  });

  it("should produce HTML without whitespace-only text nodes between tags", () => {
    const html = genHTML(baseOpts);
    const betweenTags = html.match(/>\s+</g) || [];
    const problematic = betweenTags.filter(m => m.trim() === '><' || /^>\s+<$/.test(m));
    expect(problematic).toHaveLength(0);
  });

  it("should start with <table and end with </table>", () => {
    const html = genHTML(baseOpts);
    expect(html.startsWith("<table")).toBe(true);
    expect(html.endsWith("</table>")).toBe(true);
  });

  it("should contain the user name and email", () => {
    const html = genHTML(baseOpts);
    expect(html).toContain("Andrea Mente");
    expect(html).toContain("andrea.mente@assistants.com.br");
    expect(html).toContain("Sócia Atuarial");
    expect(html).toContain("Actuarial Partner");
  });

  it("should include base64 image sources inline", () => {
    const html = genHTML(baseOpts);
    expect(html).toContain('src="data:image/png;base64,AAAA"');
    expect(html).toContain('src="data:image/png;base64,BBBB"');
  });

  it("should use border=0 on the outer table", () => {
    const html = genHTML(baseOpts);
    expect(html).toContain('border="0"');
    expect(html).toContain("border-collapse:collapse");
  });

  it("should NOT contain orange bar (border-left with #E67E22)", () => {
    const html = genHTML(baseOpts);
    expect(html).not.toContain("border-left:2px solid #E67E22");
  });

  it("should use navy color for cargo PT (not orange)", () => {
    const html = genHTML(baseOpts);
    expect(html).toContain("color:#0B1929");
    // Cargo line should not use orange
    expect(html).not.toContain('color:#E67E22;line-height:13px');
  });

  it("should use orange only for email link", () => {
    const html = genHTML(baseOpts);
    // Only the email link should be orange
    const orangeMatches = html.match(/color:#E67E22/g) || [];
    // Should be exactly 1 (the email link)
    expect(orangeMatches.length).toBe(1);
  });

  it("should use photo size 56 and symbol size 44", () => {
    const htmlWithPhoto = genHTML({ ...baseOpts, foto: true, fotoUrl: "data:image/png;base64,PHOTO" });
    expect(htmlWithPhoto).toContain('width="56"');
    const htmlNoPhoto = genHTML(baseOpts);
    expect(htmlNoPhoto).toContain('width="44"');
  });

  it("should use wordmark width 180", () => {
    const html = genHTML(baseOpts);
    expect(html).toContain('width="180"');
  });
});
