/**
 * Assistants Consulting — Gerador de Assinatura de E-mail v5
 * Base64 inline images for full Outlook compatibility
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { SIG_SYMBOL_B64, SIG_WORDMARK_B64 } from "@shared/signatureAssets";
import {
  Upload, User, Mail, Phone, Briefcase,
  Download, Image, Smartphone, Loader2, FolderArchive, Copy, ClipboardCheck,
} from "lucide-react";
import JSZip from "jszip";

/* Display-only URLs for the web UI (header logo, preview fallback) */
const WORDMARK_URL = "/manus-storage/Assistants_FINAL_Wordmark_d3b4a1a8.png";
const SYMBOL_URL = "/manus-storage/sig_symbol_478d8f65.png";
const SIG_WORDMARK_URL = "/manus-storage/sig_wordmark_daf02010.png";

const ENDERECO_SP = "Rua Cláudio Soares, 72 - 8º andar - Pinheiros - São Paulo/SP - CEP: 05422-030";
const ENDERECO_BSB = "SCS Quadra 9, Ed. Parque Cidade Corporate - Torre C - Bloco C - 10º andar - Brasília/DF - CEP: 70308-200";

const AVISO_PT = "Esta mensagem, incluindo seus anexos, é confidencial e destinada exclusivamente ao(s) destinatário(s) indicado(s). Se você não é o destinatário pretendido, fica notificado de que qualquer uso, disseminação, distribuição ou cópia desta mensagem é estritamente proibido. Caso tenha recebido esta mensagem por engano, por favor notifique imediatamente o remetente por e-mail e apague esta mensagem e todos os seus anexos de seu sistema. A Assistants Consulting não se responsabiliza por opiniões pessoais do remetente que não estejam relacionadas aos negócios da empresa, nem por alterações realizadas após o envio desta mensagem.";

const AVISO_EN = "This message, including any attachments, is confidential and intended solely for the named recipient(s). If you are not the intended recipient, you are hereby notified that any use, dissemination, distribution, or copying of this message is strictly prohibited. If you have received this message in error, please immediately notify the sender by e-mail and delete this message and all attachments from your system. Assistants Consulting shall not be held liable for personal opinions expressed by the sender that are unrelated to the company's business, nor for any alterations made after this message was sent.";

const VALID_DDDS = new Set([
  "11","12","13","14","15","16","17","18","19",
  "21","22","24","27","28",
  "31","32","33","34","35","37","38",
  "41","42","43","44","45","46","47","48","49",
  "51","53","54","55","61","62","63","64","65","66","67","68","69",
  "71","73","74","75","77","79",
  "81","82","83","84","85","86","87","88","89",
  "91","92","93","94","95","96","97","98","99",
]);

const EMAIL_DOMAIN = "@assistants.com.br";

function digitsOnly(v: string): string { return v.replace(/\D/g, ""); }

function fmtPhone(raw: string, mobile: boolean): string {
  const d = raw.slice(0, mobile ? 11 : 10);
  if (!d) return "";
  if (d.length <= 2) return `+55 (${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (mobile) {
    if (rest.length <= 5) return `+55 (${ddd}) ${rest}`;
    return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  }
  if (rest.length <= 4) return `+55 (${ddd}) ${rest}`;
  return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

function isDDDOk(raw: string): boolean {
  const ddd = raw.slice(0, 2);
  return ddd.length < 2 || VALID_DDDS.has(ddd);
}

function isComplete(raw: string, mobile: boolean): boolean {
  return raw.length === (mobile ? 11 : 10);
}

export default function Home() {
  const [nome, setNome] = useState("");
  const [cargoPT, setCargoPT] = useState("");
  const [cargoEN, setCargoEN] = useState("");
  const [fixoRaw, setFixoRaw] = useState("");
  const [celRaw, setCelRaw] = useState("");
  const [emailUser, setEmailUser] = useState("");
  const [foto, setFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  const [translating, setTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const prevRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Base64 images imported directly as constants (no server dependency)
  const symbolB64 = SIG_SYMBOL_B64;
  const wordmarkB64 = SIG_WORDMARK_B64;

  const fixo = fmtPhone(fixoRaw, false);
  const cel = fmtPhone(celRaw, true);
  const fullEmail = emailUser ? `${emailUser}${EMAIL_DOMAIN}` : "";

  const fixoErr = fixoRaw.length >= 2 && !isDDDOk(fixoRaw);
  const celErr = celRaw.length >= 2 && !isDDDOk(celRaw);

  // Translation via LLM
  const tMut = trpc.translate.jobTitle.useMutation({
    onSuccess: (d) => { if (d.translated) setCargoEN(d.translated); setTranslating(false); },
    onError: () => { setTranslating(false); toast.error("Erro ao traduzir o cargo."); },
  });

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!cargoPT.trim()) { setCargoEN(""); setTranslating(false); return; }
    setTranslating(true);
    timerRef.current = setTimeout(() => { tMut.mutate({ title: cargoPT.trim() }); }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargoPT]);

  const onFixo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("55")) digits = digits.slice(2);
    setFixoRaw(digits.slice(0, 10));
  }, []);

  const onCel = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
    setCelRaw(digits.slice(0, 11));
  }, []);

  const onEmailUser = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "");
    setEmailUser(val);
  }, []);

  const onFoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 500000) { toast.error("Máximo 500 KB."); return; }
    const r = new FileReader();
    r.onload = (ev) => setFotoUrl(ev.target?.result as string);
    r.readAsDataURL(f);
  }, []);

  /**
   * Helper: convert a data:image/...;base64,... string to a Uint8Array of raw bytes.
   */
  const base64ToBytes = useCallback((dataUrl: string): Uint8Array => {
    const base64 = dataUrl.split(",")[1] || "";
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }, []);

  /**
   * Helper: extract the MIME extension from a data URL (e.g., "png", "jpeg").
   */
  const mimeExt = useCallback((dataUrl: string): string => {
    const m = dataUrl.match(/^data:image\/(\w+);/);
    return m ? m[1] : "png";
  }, []);

  /**
   * Generate the HTML signature with BASE64 INLINE images (for preview / simple download).
   * MUST be defined BEFORE handleDL.
   */
  const genHTML = useCallback(() => {
    const photoSize = 60;
    const symbolSize = 44;
    const sz = foto ? photoSize : symbolSize;
    const dn = nome || "[Nome Completo]";
    const dpt = cargoPT || "[Cargo]";
    const den = cargoEN || "[Position]";
    const df = fixo || "+55 (XX) XXXX-XXXX";
    const dc = cel || "+55 (XX) XXXXX-XXXX";
    const de = fullEmail || "nome@assistants.com.br";

    // For the photo: use the uploaded base64 photo, or the symbol base64
    const imgSrc = foto && fotoUrl ? fotoUrl : symbolB64;
    // Wordmark: always base64
    const wmSrc = wordmarkB64;

    // Photo HTML: circular for photo, square for symbol
    const photoHTML = foto
      ? `<img src="${imgSrc}" alt="Foto" width="${photoSize}" height="${photoSize}" style="display:block;width:${photoSize}px;height:${photoSize}px;border-radius:50%;border:1px solid #E7E9EB;" />`
      : `<img src="${imgSrc}" alt="A" width="${symbolSize}" height="${symbolSize}" style="display:block;width:${symbolSize}px;height:${symbolSize}px;border:0;" />`;

    // Build HTML as array of parts joined without whitespace to avoid Outlook spacing issues
    const parts = [
      `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Calibri,Arial,Helvetica,sans-serif;max-width:520px;border:none;">`,
      `<tr><td colspan="3" style="padding:0 0 10px 0;border-top:1px solid #E7E9EB;font-size:1px;line-height:1px;border-left:none;border-right:none;border-bottom:none;">&nbsp;</td></tr>`,
      `<tr>`,
      `<td valign="top" style="padding:0;width:${sz}px;border:none;">${photoHTML}</td>`,
      `<td valign="top" style="padding:0 12px;width:2px;border:none;"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:none;"><tr><td style="background-color:#E67E22;width:2px;height:${sz}px;font-size:1px;line-height:1px;border:none;">&nbsp;</td></tr></table></td>`,
      `<td valign="top" style="padding:0;border:none;">`,
      `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:none;">`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#0B1929;line-height:18px;padding:0 0 1px 0;border:none;mso-line-height-rule:exactly;">${dn}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#E67E22;line-height:13px;padding:0;border:none;text-transform:uppercase;letter-spacing:0.5px;mso-line-height-rule:exactly;">${dpt}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:10px;font-weight:normal;color:#6B7B8D;line-height:13px;padding:0 0 6px 0;border:none;font-style:italic;mso-line-height-rule:exactly;">${den}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><strong style="color:#0B1929;">T</strong>&nbsp;&nbsp;${df}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><strong style="color:#0B1929;">M</strong>&nbsp;&nbsp;${dc}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><strong style="color:#0B1929;">E</strong>&nbsp;&nbsp;<a href="mailto:${de}" style="color:#E67E22;text-decoration:none;">${de}</a></td></tr>`,
      `</table></td></tr>`,
      `<tr><td colspan="3" style="padding:10px 0 0 0;border:none;font-size:1px;line-height:1px;">&nbsp;</td></tr>`,
      `<tr><td colspan="3" style="padding:0;border:none;"><a href="https://www.assistants.com.br" target="_blank" style="text-decoration:none;"><img src="${wmSrc}" alt="Assistants Consulting" width="180" style="display:block;border:0;width:180px;height:auto;" /></a></td></tr>`,
      `<tr><td colspan="3" style="padding:8px 0 0 0;border-top:1px solid #E7E9EB;border-left:none;border-right:none;border-bottom:none;font-size:1px;line-height:1px;">&nbsp;</td></tr>`,
      `<tr><td colspan="3" style="padding:4px 0 0 0;border:none;"><p style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;margin:0;line-height:12px;mso-line-height-rule:exactly;"><strong>São Paulo</strong>&nbsp;&nbsp;${ENDERECO_SP}</p><p style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;margin:2px 0 0 0;line-height:12px;mso-line-height-rule:exactly;"><strong>Brasília</strong>&nbsp;&nbsp;${ENDERECO_BSB}</p></td></tr>`,
      `<tr><td colspan="3" style="padding:10px 0 0 0;border:none;"><p style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:7px;color:#B0B8C1;margin:0;line-height:10px;max-width:520px;mso-line-height-rule:exactly;">${AVISO_PT}</p></td></tr>`,
      `<tr><td colspan="3" style="padding:4px 0 0 0;border:none;"><p style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:7px;color:#B0B8C1;margin:0;line-height:10px;max-width:520px;font-style:italic;mso-line-height-rule:exactly;">${AVISO_EN}</p></td></tr>`,
      `</table>`,
    ];
    return parts.join('');
  }, [nome, cargoPT, cargoEN, fixo, cel, fullEmail, fotoUrl, foto, symbolB64, wordmarkB64]);


  /**
   * Generate the HTML signature with RELATIVE image paths for Outlook _files folder.
   * Uses full Outlook Word engine compatibility: no border-radius, no text-transform,
   * explicit widths, MSO namespaces, bgcolor attributes, no <p> margins.
   */
  const genHTMLForOutlook = useCallback((baseName: string) => {
    const photoSize = 60;
    const symbolSize = 44;
    const sz = foto ? photoSize : symbolSize;
    const dn = nome || "[Nome Completo]";
    const dpt = (cargoPT || "[Cargo]").toUpperCase(); // Outlook ignores text-transform
    const den = cargoEN || "[Position]";
    const df = fixo || "+55 (XX) XXXX-XXXX";
    const dc = cel || "+55 (XX) XXXXX-XXXX";
    const de = fullEmail || "nome@assistants.com.br";

    const imgSrc = foto && fotoUrl ? fotoUrl : symbolB64;
    const imgExt = mimeExt(imgSrc);
    const wmExt = mimeExt(wordmarkB64);

    const imgFile = `${baseName}_files/image001.${imgExt}`;
    const wmFile = `${baseName}_files/image002.${wmExt}`;

    // No border-radius in Outlook; use simple square image
    const photoHTML = `<img src="${imgFile}" alt="${foto ? 'Foto' : 'A'}" width="${sz}" height="${sz}" style="display:block;width:${sz}px;height:${sz}px;border:0;" />`;

    const parts = [
      `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40">`,
      `<head><meta charset="utf-8"><meta name="Generator" content="Microsoft Word 15">`,
      `<!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->`,
      `<title>Assinatura</title></head>`,
      `<body style="margin:0;padding:0;">`,
      `<table cellpadding="0" cellspacing="0" border="0" width="520" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;font-family:Calibri,Arial,Helvetica,sans-serif;width:520px;">`,
      `<tr><td colspan="3" height="10" style="padding:0;font-size:1px;line-height:1px;border-top:1px solid #E7E9EB;">&nbsp;</td></tr>`,
      `<tr>`,
      `<td valign="top" width="${sz}" style="padding:0;width:${sz}px;">${photoHTML}</td>`,
      `<td valign="top" width="26" style="padding:0;width:26px;"><table cellpadding="0" cellspacing="0" border="0" width="26" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td width="12" style="width:12px;font-size:1px;">&nbsp;</td><td width="2" bgcolor="#E67E22" style="width:2px;font-size:1px;line-height:${sz}px;">&nbsp;</td><td width="12" style="width:12px;font-size:1px;">&nbsp;</td></tr></table></td>`,
      `<td valign="top" style="padding:0;">`,
      `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#0B1929;line-height:18px;padding:0 0 1px 0;mso-line-height-rule:exactly;">${dn}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;color:#E67E22;line-height:13px;padding:0;mso-line-height-rule:exactly;">${dpt}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:10px;font-weight:normal;color:#6B7B8D;line-height:13px;padding:0 0 6px 0;font-style:italic;mso-line-height-rule:exactly;">${den}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;mso-line-height-rule:exactly;"><strong style="color:#0B1929;">T</strong>&nbsp;&nbsp;${df}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;mso-line-height-rule:exactly;"><strong style="color:#0B1929;">M</strong>&nbsp;&nbsp;${dc}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;mso-line-height-rule:exactly;"><strong style="color:#0B1929;">E</strong>&nbsp;&nbsp;<a href="mailto:${de}" style="color:#E67E22;text-decoration:none;">${de}</a></td></tr>`,
      `</table></td></tr>`,
      `<tr><td colspan="3" height="10" style="padding:0;font-size:1px;line-height:1px;">&nbsp;</td></tr>`,
      `<tr><td colspan="3" style="padding:0;"><a href="https://www.assistants.com.br" target="_blank" style="text-decoration:none;"><img src="${wmFile}" alt="Assistants Consulting" width="180" height="40" style="display:block;border:0;width:180px;height:40px;" /></a></td></tr>`,
      `<tr><td colspan="3" height="8" style="padding:0;font-size:1px;line-height:1px;border-top:1px solid #E7E9EB;">&nbsp;</td></tr>`,
      `<tr><td colspan="3" style="padding:4px 0 0 0;"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;line-height:12px;mso-line-height-rule:exactly;"><strong>S\u00e3o Paulo</strong>&nbsp;&nbsp;${ENDERECO_SP}</td></tr><tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;line-height:12px;padding:2px 0 0 0;mso-line-height-rule:exactly;"><strong>Bras\u00edlia</strong>&nbsp;&nbsp;${ENDERECO_BSB}</td></tr></table></td></tr>`,
      `<tr><td colspan="3" style="padding:10px 0 0 0;"><table cellpadding="0" cellspacing="0" border="0" width="520" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:520px;"><tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:7px;color:#B0B8C1;line-height:10px;mso-line-height-rule:exactly;width:520px;">${AVISO_PT}</td></tr></table></td></tr>`,
      `<tr><td colspan="3" style="padding:4px 0 0 0;"><table cellpadding="0" cellspacing="0" border="0" width="520" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:520px;"><tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:7px;color:#B0B8C1;line-height:10px;font-style:italic;mso-line-height-rule:exactly;width:520px;">${AVISO_EN}</td></tr></table></td></tr>`,
      `</table>`,
      `</body></html>`,
    ];
    return { html: parts.join(''), imgExt, wmExt };
  }, [nome, cargoPT, cargoEN, fixo, cel, fullEmail, fotoUrl, foto, symbolB64, wordmarkB64, mimeExt]);

  /**
   * Generate plain-text version of the signature.
   */
  const genTXT = useCallback(() => {
    const dn = nome || "[Nome Completo]";
    const dpt = cargoPT || "[Cargo]";
    const den = cargoEN || "[Position]";
    const df = fixo || "+55 (XX) XXXX-XXXX";
    const dc = cel || "+55 (XX) XXXXX-XXXX";
    const de = fullEmail || "nome@assistants.com.br";
    return [
      `${dn}`,
      `${dpt}`,
      `${den}`,
      `T  ${df}`,
      `M  ${dc}`,
      `E  ${de}`,
      ``,
      `ASSISTANTS`,
      `www.assistants.com.br`,
      ``,
      `S\u00e3o Paulo  ${ENDERECO_SP}`,
      `Bras\u00edlia  ${ENDERECO_BSB}`,
    ].join('\n');
  }, [nome, cargoPT, cargoEN, fixo, cel, fullEmail]);

  /**
   * Download: generate a ZIP file with .htm + _files/ folder + .txt (Outlook signature format).
   */
  const handleDL = useCallback(async () => {
    try {
      const baseName = `Assinatura_${nome.replace(/\s+/g, "_") || "Assistants"}`;
      const { html, imgExt, wmExt } = genHTMLForOutlook(baseName);
      const txt = genTXT();

      const imgSrc = foto && fotoUrl ? fotoUrl : symbolB64;
      const imgBytes = base64ToBytes(imgSrc);
      const wmBytes = base64ToBytes(wordmarkB64);

      const zip = new JSZip();
      zip.file(`${baseName}.htm`, html);
      zip.file(`${baseName}.txt`, txt);
      const filesFolder = zip.folder(`${baseName}_files`)!;
      filesFolder.file(`image001.${imgExt}`, imgBytes);
      filesFolder.file(`image002.${wmExt}`, wmBytes);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Pacote de assinatura baixado.");
    } catch (err) {
      console.error("ZIP generation error:", err);
      toast.error("Erro ao gerar o pacote. Tente novamente.");
    }
  }, [genHTMLForOutlook, genTXT, nome, foto, fotoUrl, symbolB64, wordmarkB64, base64ToBytes]);

  /**
   * Generate a full Outlook-optimized HTML document with BASE64 inline images.
   * This is specifically for clipboard paste into Outlook's signature editor.
   * Key differences from genHTML():
   * - Full HTML document with MSO namespaces and OfficeDocumentSettings
   * - mso-table-lspace/rspace:0pt on all tables
   * - mso-line-height-rule:exactly on all text cells
   * - mso-margin-top-alt:0;mso-margin-bottom-alt:0 to prevent paragraph spacing
   * - No <p> tags (uses nested tables instead) to avoid Word paragraph spacing
   * - Explicit width/height on all elements
   * - No border-radius (Outlook ignores it)
   * - .toUpperCase() instead of text-transform
   */
  const genHTMLForClipboard = useCallback(() => {
    const photoSize = 60;
    const symbolSize = 44;
    const sz = foto ? photoSize : symbolSize;
    const dn = nome || "[Nome Completo]";
    const dpt = (cargoPT || "[Cargo]").toUpperCase();
    const den = cargoEN || "[Position]";
    const df = fixo || "+55 (XX) XXXX-XXXX";
    const dc = cel || "+55 (XX) XXXXX-XXXX";
    const de = fullEmail || "nome@assistants.com.br";

    const imgSrc = foto && fotoUrl ? fotoUrl : symbolB64;
    const wmSrc = wordmarkB64;

    // Simple square image (no border-radius for Outlook)
    const photoHTML = `<img src="${imgSrc}" alt="${foto ? 'Foto' : 'A'}" width="${sz}" height="${sz}" style="display:block;width:${sz}px;height:${sz}px;border:0;outline:none;" />`;

    const parts = [
      `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">`,
      `<head><meta charset="utf-8"><meta name="Generator" content="Microsoft Word 15">`,
      `<!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->`,
      `<style>table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}td{border:none;padding:0;mso-line-height-rule:exactly;mso-margin-top-alt:0;mso-margin-bottom-alt:0;mso-padding-alt:0;}p{margin:0;padding:0;mso-margin-top-alt:0;mso-margin-bottom-alt:0;mso-line-height-rule:exactly;}img{border:0;outline:none;display:block;}</style>`,
      `</head>`,
      `<body style="margin:0;padding:0;word-spacing:normal;">`,
      `<table cellpadding="0" cellspacing="0" border="0" width="520" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;font-family:Calibri,Arial,Helvetica,sans-serif;width:520px;">`,
      // Top separator line
      `<tr><td colspan="3" height="1" style="height:1px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;background-color:#E7E9EB;">&nbsp;</td></tr>`,
      // Spacer after top line
      `<tr><td colspan="3" height="10" style="height:10px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      // Main content row: photo | orange bar | info
      `<tr>`,
      `<td valign="top" width="${sz}" style="width:${sz}px;padding:0;vertical-align:top;">${photoHTML}</td>`,
      // Orange bar column with spacers
      `<td valign="top" width="26" style="width:26px;padding:0;vertical-align:top;"><table cellpadding="0" cellspacing="0" border="0" width="26" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:26px;"><tr><td width="12" style="width:12px;font-size:1px;line-height:${sz}px;mso-line-height-rule:exactly;">&nbsp;</td><td width="2" height="${sz}" bgcolor="#E67E22" style="width:2px;height:${sz}px;font-size:1px;line-height:${sz}px;mso-line-height-rule:exactly;background-color:#E67E22;">&nbsp;</td><td width="12" style="width:12px;font-size:1px;line-height:${sz}px;mso-line-height-rule:exactly;">&nbsp;</td></tr></table></td>`,
      // Info column
      `<td valign="top" style="padding:0;vertical-align:top;">`,
      `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#0B1929;line-height:18px;mso-line-height-rule:exactly;padding:0 0 1px 0;">${dn}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;color:#E67E22;line-height:13px;mso-line-height-rule:exactly;padding:0;">${dpt}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:10px;font-weight:normal;color:#6B7B8D;line-height:13px;mso-line-height-rule:exactly;padding:0 0 6px 0;font-style:italic;">${den}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;mso-line-height-rule:exactly;padding:0;"><span style="font-weight:bold;color:#0B1929;">T</span>&nbsp;&nbsp;${df}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;mso-line-height-rule:exactly;padding:0;"><span style="font-weight:bold;color:#0B1929;">M</span>&nbsp;&nbsp;${dc}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;mso-line-height-rule:exactly;padding:0;"><span style="font-weight:bold;color:#0B1929;">E</span>&nbsp;&nbsp;<a href="mailto:${de}" style="color:#E67E22;text-decoration:none;">${de}</a></td></tr>`,
      `</table></td></tr>`,
      // Spacer before wordmark
      `<tr><td colspan="3" height="8" style="height:8px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      // Wordmark (180x40 display, source is 360x81 = 2x density for clarity)
      `<tr><td colspan="3" style="padding:0;"><a href="https://www.assistants.com.br" target="_blank" style="text-decoration:none;"><img src="${wmSrc}" alt="Assistants Consulting" width="180" height="40" style="display:block;border:0;outline:none;width:180px;height:40px;" /></a></td></tr>`,
      // Separator line
      `<tr><td colspan="3" height="6" style="height:6px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      `<tr><td colspan="3" height="1" style="height:1px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;background-color:#E7E9EB;">&nbsp;</td></tr>`,
      `<tr><td colspan="3" height="4" style="height:4px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      // Addresses - using nested table rows instead of <p> tags
      `<tr><td colspan="3" style="padding:0;"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;line-height:12px;mso-line-height-rule:exactly;"><span style="font-weight:bold;">S\u00e3o Paulo</span>&nbsp;&nbsp;${ENDERECO_SP}</td></tr><tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;line-height:12px;mso-line-height-rule:exactly;padding:2px 0 0 0;"><span style="font-weight:bold;">Bras\u00edlia</span>&nbsp;&nbsp;${ENDERECO_BSB}</td></tr></table></td></tr>`,
      // Spacer before disclaimer
      `<tr><td colspan="3" height="6" style="height:6px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      // Disclaimer PT - using table cell instead of <p>
      `<tr><td colspan="3" style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:7px;color:#B0B8C1;line-height:10px;mso-line-height-rule:exactly;width:520px;">${AVISO_PT}</td></tr>`,
      // Spacer
      `<tr><td colspan="3" height="4" style="height:4px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      // Disclaimer EN
      `<tr><td colspan="3" style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:7px;color:#B0B8C1;line-height:10px;mso-line-height-rule:exactly;font-style:italic;width:520px;">${AVISO_EN}</td></tr>`,
      `</table>`,
      `</body></html>`,
    ];
    return parts.join('');
  }, [nome, cargoPT, cargoEN, fixo, cel, fullEmail, fotoUrl, foto, symbolB64, wordmarkB64]);

  /**
   * Copy signature HTML to clipboard using the Clipboard API.
   * Uses genHTMLForClipboard() which produces a full MSO-compatible HTML document
   * with inline base64 images, optimized for Outlook's Word rendering engine.
   */
  const handleCopy = useCallback(async () => {
    try {
      const html = genHTMLForClipboard();
      const plainText = genTXT();

      // Use ClipboardItem API for rich HTML copy
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([clipboardItem]);

      setCopied(true);
      toast.success("Assinatura copiada! Cole no editor de assinaturas do Outlook.");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Clipboard write error:", err);
      // Fallback: render the HTML in a hidden div and copy via selection
      try {
        const html = genHTMLForClipboard();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.opacity = '0';
        document.body.appendChild(tempDiv);
        const range = document.createRange();
        range.selectNodeContents(tempDiv);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand('copy');
        sel?.removeAllRanges();
        document.body.removeChild(tempDiv);
        setCopied(true);
        toast.success("Assinatura copiada! Cole no editor de assinaturas do Outlook.");
        setTimeout(() => setCopied(false), 3000);
      } catch (fallbackErr) {
        console.error("Fallback copy error:", fallbackErr);
        toast.error("Erro ao copiar. Tente usar o botão de download.");
      }
    }
  }, [genHTMLForClipboard, genTXT]);

  // Validation
  const fixoValid = fixoRaw.length === 0 || (isComplete(fixoRaw, false) && isDDDOk(fixoRaw));
  const celValid = celRaw.length === 0 || (isComplete(celRaw, true) && isDDDOk(celRaw));
  const phonesOk = fixoValid && celValid && !fixoErr && !celErr;

  // Display values for preview
  const dNome = nome || "Nome Completo";
  const dPT = cargoPT || "Cargo em Português";
  const dEN = cargoEN || "Position in English";
  const dFixo = fixo || "+55 (XX) XXXX-XXXX";
  const dCel = cel || "+55 (XX) XXXXX-XXXX";
  const dEmail = fullEmail || "nome@assistants.com.br";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC]">
      <header className="border-b border-[#E7E9EB] bg-white">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <img src={SIG_WORDMARK_B64} alt="Assistants Consulting" className="h-6 w-auto" />
            <Separator orientation="vertical" className="h-5 bg-[#E7E9EB]" />
            <span className="text-sm font-medium text-[#3D4F5F] tracking-wide">Gerador de Assinatura</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* FORM */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#0B1929] tracking-tight">Configure sua assinatura</h1>
              <p className="text-sm text-[#3D4F5F] mt-1.5 leading-relaxed">Preencha seus dados abaixo. A assinatura será atualizada em tempo real.</p>
            </div>

            <div className="bg-white rounded-lg border border-[#E7E9EB] p-6 space-y-5">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Nome completo
                </Label>
                <Input id="nome" placeholder="Maria Helena Silva" value={nome} onChange={(e) => setNome(e.target.value)}
                  className="h-11 border-[#E7E9EB] focus:border-[#E67E22] focus:ring-[#E67E22]/20 text-[#0B1929] placeholder:text-[#B0B8C1]" />
              </div>

              {/* Cargo */}
              <div className="space-y-2">
                <Label htmlFor="cargoPT" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Cargo
                </Label>
                <Input id="cargoPT" placeholder="Atuária Sênior" value={cargoPT} onChange={(e) => setCargoPT(e.target.value)}
                  className="h-11 border-[#E7E9EB] focus:border-[#E67E22] focus:ring-[#E67E22]/20 text-[#0B1929] placeholder:text-[#B0B8C1]" />
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-[#B0B8C1] uppercase tracking-wider shrink-0">English:</span>
                  {translating ? (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-[#E67E22]" />
                      <span className="text-xs text-[#B0B8C1] italic">Traduzindo...</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#3D4F5F] italic">{cargoEN || "—"}</span>
                  )}
                </div>
              </div>

              {/* Telefone Fixo */}
              <div className="space-y-2">
                <Label htmlFor="fixo" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Telefone fixo
                </Label>
                <Input
                  id="fixo" placeholder="1135000000" value={fixoRaw} onChange={onFixo}
                  inputMode="numeric" maxLength={10}
                  className={`h-11 border-[#E7E9EB] focus:border-[#E67E22] focus:ring-[#E67E22]/20 text-[#0B1929] placeholder:text-[#B0B8C1] font-mono ${fixoErr ? "border-red-400 focus:border-red-400" : ""}`}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#3D4F5F] font-medium">
                    {fixoRaw.length > 0 ? `Resultado: ${fixo}` : "Digite DDD + número (ex: 1135000000)"}
                  </span>
                  {fixoErr && <span className="text-[10px] text-red-500 font-medium">DDD inválido</span>}
                  {fixoRaw.length >= 2 && !fixoErr && isComplete(fixoRaw, false) && <span className="text-[10px] text-emerald-600 font-medium">Válido ✓</span>}
                </div>
              </div>

              {/* Celular */}
              <div className="space-y-2">
                <Label htmlFor="cel" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5" /> Celular
                </Label>
                <Input
                  id="cel" placeholder="11999990000" value={celRaw} onChange={onCel}
                  inputMode="numeric" maxLength={11}
                  className={`h-11 border-[#E7E9EB] focus:border-[#E67E22] focus:ring-[#E67E22]/20 text-[#0B1929] placeholder:text-[#B0B8C1] font-mono ${celErr ? "border-red-400 focus:border-red-400" : ""}`}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#3D4F5F] font-medium">
                    {celRaw.length > 0 ? `Resultado: ${cel}` : "Digite DDD + número (ex: 11999990000)"}
                  </span>
                  {celErr && <span className="text-[10px] text-red-500 font-medium">DDD inválido</span>}
                  {celRaw.length >= 2 && !celErr && isComplete(celRaw, true) && <span className="text-[10px] text-emerald-600 font-medium">Válido ✓</span>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="emailUser" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> E-mail corporativo
                </Label>
                <div className="flex items-center h-11 rounded-md border border-[#E7E9EB] focus-within:border-[#E67E22] focus-within:ring-1 focus-within:ring-[#E67E22]/20 overflow-hidden bg-white">
                  <input
                    id="emailUser" type="text" placeholder="maria.silva"
                    value={emailUser} onChange={onEmailUser}
                    className="flex-1 h-full px-3 text-sm text-[#0B1929] placeholder:text-[#B0B8C1] outline-none border-none bg-transparent"
                  />
                  <span className="px-3 text-sm text-[#3D4F5F] bg-[#F4F5F7] h-full flex items-center border-l border-[#E7E9EB] font-medium select-none whitespace-nowrap">
                    {EMAIL_DOMAIN}
                  </span>
                </div>
                {emailUser && <span className="text-[10px] text-[#B0B8C1]">Resultado: {fullEmail}</span>}
              </div>

              <Separator className="bg-[#E7E9EB]" />

              {/* Foto */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="w-3.5 h-3.5 text-[#3D4F5F]" />
                  <Label htmlFor="foto-toggle" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider">
                    Incluir foto (sócios e diretores)
                  </Label>
                </div>
                <Switch id="foto-toggle" checked={foto} onCheckedChange={setFoto} />
              </div>

              {foto && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs text-[#3D4F5F]">Foto quadrada, mínimo 160×160px, máximo 500 KB.</p>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFoto} className="hidden" />
                  <Button variant="outline" onClick={() => fileRef.current?.click()}
                    className="w-full h-11 border-dashed border-[#B0B8C1] text-[#3D4F5F] hover:border-[#E67E22] hover:text-[#E67E22] transition-colors">
                    <Upload className="w-4 h-4 mr-2" /> {fotoUrl ? "Trocar foto" : "Carregar foto"}
                  </Button>
                  {fotoUrl && (
                    <div className="flex items-center gap-3">
                      <img src={fotoUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-[#E7E9EB]" />
                      <span className="text-xs text-[#3D4F5F]">Foto carregada.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleCopy} disabled={!phonesOk} className={`flex-1 h-12 font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${copied ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-[#E67E22] hover:bg-[#D35400] text-white'}`}>
                {copied ? <ClipboardCheck className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copiada!' : 'Copiar para Outlook'}
              </Button>
              <Button onClick={handleDL} disabled={!phonesOk} variant="outline" className="flex-1 h-12 border-[#E7E9EB] text-[#3D4F5F] hover:bg-[#F4F5F7] font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <FolderArchive className="w-4 h-4 mr-2" /> Baixar pacote (.zip)
              </Button>
            </div>

            {!phonesOk && (fixoRaw.length > 0 || celRaw.length > 0) && (
              <p className="text-xs text-red-500 font-medium">
                Corrija os telefones acima antes de gerar a assinatura. Todos os números devem ter DDD válido e estar completos.
              </p>
            )}

            {/* Instructions - Copy method */}
            <div className="bg-[#EEF7ED] border border-[#C3E6C3] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#0B1929] mb-3">Método rápido — Copiar e colar</h3>
              <ol className="text-xs text-[#3D4F5F] space-y-2 list-decimal list-inside leading-relaxed">
                <li>Preencha seus dados acima e clique em <strong>Copiar para Outlook</strong>.</li>
                <li>No Outlook, vá em:
                  <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-md px-3 py-2 mt-1.5 mb-1 font-mono text-[11px] text-[#1F2937]">Arquivo &gt; Opções &gt; Email &gt; Assinaturas</div>
                </li>
                <li>Clique em <strong>Novo</strong> e dê um nome à assinatura.</li>
                <li>No campo de edição, pressione <strong>Ctrl + V</strong> para colar.</li>
                <li>Clique em <strong>OK</strong> e pronto.</li>
              </ol>
            </div>

            {/* Instructions - ZIP method */}
            <div className="bg-[#FDF6EE] border border-[#F5DFC3] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#0B1929] mb-3">Método alternativo — Pacote .zip</h3>
              <ol className="text-xs text-[#3D4F5F] space-y-2 list-decimal list-inside leading-relaxed">
                <li>Feche o Outlook.</li>
                <li>Pressione <strong>Win + R</strong>.</li>
                <li>Cole este caminho e pressione Enter:
                  <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-md px-3 py-2 mt-1.5 mb-1 font-mono text-[11px] text-[#1F2937] select-all">%APPDATA%\Microsoft\Signatures</div>
                </li>
                <li>Extraia o <strong>.zip</strong> baixado e copie o arquivo <code className="bg-[#E5E7EB] px-1.5 py-0.5 rounded text-[11px] font-mono">.HTM</code> e a pasta <code className="bg-[#E5E7EB] px-1.5 py-0.5 rounded text-[11px] font-mono">_files</code> para essa pasta.</li>
                <li>O resultado deve ficar assim:
                  <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-md px-3 py-2 mt-1.5 mb-1 font-mono text-[11px] text-[#1F2937] leading-relaxed">Assinatura_SeuNome.htm<br/>Assinatura_SeuNome_files\</div>
                </li>
                <li>Abra o Outlook.</li>
                <li>Vá em:
                  <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-md px-3 py-2 mt-1.5 mb-1 font-mono text-[11px] text-[#1F2937]">Arquivo &gt; Opções &gt; Email &gt; Assinaturas</div>
                </li>
                <li>A assinatura deve aparecer na lista com o nome do arquivo.</li>
                <li>Selecione-a como padrão para <strong>Novas mensagens</strong> e/ou <strong>Respostas/encaminhamentos</strong>.</li>
              </ol>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#3D4F5F] uppercase tracking-wider">Preview da assinatura</h2>
              <span className="text-[10px] text-[#B0B8C1] uppercase tracking-wider">Atualização em tempo real</span>
            </div>

            <div className="bg-white rounded-lg border border-[#E7E9EB] overflow-hidden shadow-sm">
              {/* Email header simulation */}
              <div className="border-b border-[#E7E9EB] p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#B0B8C1] uppercase tracking-wider w-14 shrink-0">De:</span>
                  <span className="text-xs text-[#0B1929]">{dNome} &lt;{dEmail}&gt;</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#B0B8C1] uppercase tracking-wider w-14 shrink-0">Para:</span>
                  <span className="text-xs text-[#B0B8C1]">destinatario@empresa.com.br</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#B0B8C1] uppercase tracking-wider w-14 shrink-0">Assunto:</span>
                  <span className="text-xs text-[#0B1929]">Relatório Atuarial — Exercício 2025</span>
                </div>
              </div>

              {/* Email body */}
              <div className="p-5">
                <div className="space-y-2.5 mb-6">
                  <p className="text-sm text-[#3D4F5F]">Prezado(a),</p>
                  <p className="text-sm text-[#3D4F5F] leading-relaxed">Segue em anexo o relatório atuarial referente ao exercício de 2025, conforme solicitado.</p>
                  <p className="text-sm text-[#3D4F5F]">Atenciosamente,</p>
                </div>

                {/* SIGNATURE PREVIEW — uses the same structure as genHTML but with React JSX */}
                <div ref={prevRef}>
                  <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse", fontFamily: "Calibri, Arial, Helvetica, sans-serif", maxWidth: 520, border: "none" }}>
                    <tbody>
                      <tr><td colSpan={3} style={{ padding: "0 0 10px 0", borderTop: "1px solid #E7E9EB", fontSize: 1, lineHeight: "1px", borderLeft: "none", borderRight: "none", borderBottom: "none" }}>&nbsp;</td></tr>
                      <tr>
                        <td style={{ verticalAlign: "top", padding: 0, width: foto ? 60 : 44, border: "none" }}>
                          {foto && fotoUrl ? (
                            <img src={fotoUrl} alt="Foto" width={60} height={60} style={{ display: "block", border: "1px solid #E7E9EB", width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <img src={symbolB64 || SYMBOL_URL} alt="A" width={44} height={44} style={{ display: "block", border: 0, width: 44, height: 44 }} />
                          )}
                        </td>
                        <td style={{ verticalAlign: "top", padding: "0 12px", width: 2, border: "none" }}>
                          <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse", border: "none" }}><tbody><tr><td style={{ backgroundColor: "#E67E22", width: 2, height: foto ? 60 : 44, fontSize: 1, lineHeight: "1px", border: "none" }}>&nbsp;</td></tr></tbody></table>
                        </td>
                        <td style={{ verticalAlign: "top", padding: 0, border: "none" }}>
                          <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse", border: "none" }}>
                            <tbody>
                              <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 14, fontWeight: 700, color: "#0B1929", lineHeight: "18px", padding: "0 0 1px 0", border: "none" }}>{dNome}</td></tr>
                              <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 10, fontWeight: 600, color: "#E67E22", lineHeight: "13px", padding: 0, textTransform: "uppercase", letterSpacing: "0.5px", border: "none" }}>{dPT}</td></tr>
                              <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 10, fontWeight: 400, color: "#6B7B8D", lineHeight: "13px", padding: "0 0 6px 0", fontStyle: "italic", border: "none" }}>{translating ? "Translating..." : dEN}</td></tr>
                              <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 11, color: "#3D4F5F", lineHeight: "17px", padding: 0, border: "none" }}><strong style={{ color: "#0B1929" }}>T</strong>&nbsp;&nbsp;{dFixo}</td></tr>
                              <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 11, color: "#3D4F5F", lineHeight: "17px", padding: 0, border: "none" }}><strong style={{ color: "#0B1929" }}>M</strong>&nbsp;&nbsp;{dCel}</td></tr>
                              <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 11, color: "#3D4F5F", lineHeight: "17px", padding: 0, border: "none" }}><strong style={{ color: "#0B1929" }}>E</strong>&nbsp;&nbsp;<a href={`mailto:${dEmail}`} style={{ color: "#E67E22", textDecoration: "none" }}>{dEmail}</a></td></tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr><td colSpan={3} style={{ padding: "10px 0 0 0", fontSize: 1, lineHeight: "1px", border: "none" }}>&nbsp;</td></tr>
                      <tr><td colSpan={3} style={{ padding: 0, border: "none" }}><a href="https://www.assistants.com.br" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}><img src={wordmarkB64 || SIG_WORDMARK_URL} alt="Assistants Consulting" width={180} style={{ display: "block", border: 0, width: 180, height: "auto" }} /></a></td></tr>
                      <tr><td colSpan={3} style={{ padding: "8px 0 0 0", borderTop: "1px solid #E7E9EB", fontSize: 1, lineHeight: "1px", borderLeft: "none", borderRight: "none", borderBottom: "none" }}>&nbsp;</td></tr>
                      <tr><td colSpan={3} style={{ padding: "4px 0 0 0", border: "none" }}>
                        <p style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 8, color: "#6B7B8D", margin: 0, lineHeight: "12px" }}><strong>São Paulo</strong>&nbsp;&nbsp;{ENDERECO_SP}</p>
                        <p style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 8, color: "#6B7B8D", margin: "2px 0 0 0", lineHeight: "12px" }}><strong>Brasília</strong>&nbsp;&nbsp;{ENDERECO_BSB}</p>
                      </td></tr>
                      <tr><td colSpan={3} style={{ padding: "10px 0 0 0", border: "none" }}><p style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 7, color: "#B0B8C1", margin: 0, lineHeight: "10px", maxWidth: 520 }}>{AVISO_PT}</p></td></tr>
                      <tr><td colSpan={3} style={{ padding: "4px 0 0 0", border: "none" }}><p style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 7, color: "#B0B8C1", margin: 0, lineHeight: "10px", maxWidth: 520, fontStyle: "italic" }}>{AVISO_EN}</p></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 py-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${foto ? "bg-[#E67E22]" : "bg-[#E7E9EB]"}`} />
              <span className="text-[10px] text-[#B0B8C1] uppercase tracking-wider">{foto ? "Versão com foto" : "Versão padrão"}</span>
              <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${!foto ? "bg-[#E67E22]" : "bg-[#E7E9EB]"}`} />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#E7E9EB] bg-white py-4">
        <div className="container flex items-center justify-between">
          <span className="text-[10px] text-[#B0B8C1]">Assistants Consulting — Ferramenta interna</span>
          <span className="text-[10px] text-[#B0B8C1]">Identidade visual conforme Brand Book v1.0</span>
        </div>
      </footer>
    </div>
  );
}
