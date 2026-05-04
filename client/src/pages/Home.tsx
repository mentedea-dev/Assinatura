/**
 * Assistants Consulting — Gerador de Assinatura de E-mail v4
 * Redesign: compacta, proporcional, foto circular com VML fallback para Outlook
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Copy, Check, Upload, User, Mail, Phone, Briefcase,
  Download, Image, Smartphone, Loader2,
} from "lucide-react";

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

function digitsOnly(v: string): string {
  return v.replace(/\D/g, "");
}

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
  const [copied, setCopied] = useState(false);
  const [translating, setTranslating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const prevRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleCopy = useCallback(async () => {
    if (!prevRef.current) return;
    try {
      const range = document.createRange();
      range.selectNodeContents(prevRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(range);
      document.execCommand("copy");
      sel?.removeAllRanges();
      setCopied(true);
      toast.success("Assinatura copiada! Cole no Outlook com Ctrl+V.");
      setTimeout(() => setCopied(false), 3000);
    } catch { toast.error("Erro ao copiar."); }
  }, []);

  /**
   * Generate the HTML signature for download.
   * Key design decisions:
   * - Photo: 60x60 circular using VML for Outlook + CSS border-radius for modern clients
   * - Vertical orange bar: 2px wide, same height as photo/symbol
   * - Wordmark: 90px (compact, not oversized)
   * - Tight spacing throughout
   * - Disclaimer in very light grey, small font
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
    const src = foto && fotoUrl ? fotoUrl : SYMBOL_URL;

    // For photo: VML roundrect for Outlook, CSS border-radius for others
    const photoHTML = foto
      ? `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:${photoSize}px;width:${photoSize}px;v-text-anchor:middle;" arcsize="50%" strokecolor="#E7E9EB" strokeweight="1px" fillcolor="#F4F5F7"><v:fill type="frame" src="${src}" /><w:anchorlock/></v:roundrect><![endif]--><!--[if !mso]><!--><img src="${src}" alt="Foto" width="${photoSize}" height="${photoSize}" style="display:block;width:${photoSize}px;height:${photoSize}px;border-radius:50%;object-fit:cover;border:1px solid #E7E9EB;" /><!--<![endif]-->`
      : `<img src="${src}" alt="A" width="${symbolSize}" height="${symbolSize}" style="display:block;width:${symbolSize}px;height:${symbolSize}px;border:0;" />`;

    return `<!DOCTYPE html><html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="pt-BR"><head><meta charset="UTF-8"><meta name="color-scheme" content="light"><!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]--></head><body style="margin:0;padding:0;background:#fff;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;max-width:520px;">
<tr><td style="padding:0 0 10px 0;border-top:1px solid #E7E9EB;font-size:1px;line-height:1px;">&nbsp;</td><td style="padding:0 0 10px 0;border-top:1px solid #E7E9EB;font-size:1px;line-height:1px;">&nbsp;</td><td style="padding:0 0 10px 0;border-top:1px solid #E7E9EB;font-size:1px;line-height:1px;">&nbsp;</td></tr>
<tr>
<td style="vertical-align:top;padding:0;width:${sz}px;">${photoHTML}</td>
<td style="vertical-align:top;padding:0 12px;width:2px;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#E67E22;width:2px;height:${sz}px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td>
<td style="vertical-align:top;padding:0;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:13px;font-weight:700;color:#0B1929;line-height:16px;padding:0 0 1px 0;mso-line-height-rule:exactly;">${dn}</td></tr>
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:9px;font-weight:600;color:#E67E22;line-height:12px;padding:0;text-transform:uppercase;letter-spacing:0.5px;mso-line-height-rule:exactly;">${dpt}</td></tr>
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:8.5px;font-weight:400;color:#6B7B8D;line-height:11px;padding:0 0 5px 0;font-style:italic;mso-line-height-rule:exactly;">${den}</td></tr>
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:9.5px;color:#3D4F5F;line-height:15px;padding:0;mso-line-height-rule:exactly;"><span style="color:#0B1929;font-weight:600;">T</span>&nbsp;&nbsp;${df}</td></tr>
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:9.5px;color:#3D4F5F;line-height:15px;padding:0;mso-line-height-rule:exactly;"><span style="color:#0B1929;font-weight:600;">M</span>&nbsp;&nbsp;${dc}</td></tr>
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:9.5px;color:#3D4F5F;line-height:15px;padding:0;mso-line-height-rule:exactly;"><span style="color:#0B1929;font-weight:600;">E</span>&nbsp;&nbsp;<a href="mailto:${de}" style="color:#E67E22;text-decoration:none;">${de}</a></td></tr>
</table></td></tr>
<tr><td colspan="3" style="padding:8px 0 0 0;font-size:1px;line-height:1px;">&nbsp;</td></tr>
<tr><td colspan="3" style="padding:0;"><a href="https://www.assistants.com.br" target="_blank" style="text-decoration:none;"><img src="${SIG_WORDMARK_URL}" alt="Assistants Consulting" width="90" style="display:block;border:0;width:90px;height:auto;" /></a></td></tr>
<tr><td colspan="3" style="padding:6px 0 0 0;border-bottom:1px solid #E7E9EB;font-size:1px;line-height:1px;">&nbsp;</td></tr>
<tr><td colspan="3" style="padding:6px 0 0 0;">
<p style="font-family:Calibri,Arial,sans-serif;font-size:7.5px;color:#6B7B8D;margin:0;line-height:11px;mso-line-height-rule:exactly;"><span style="font-weight:600;">São Paulo</span>&nbsp;&nbsp;${ENDERECO_SP}</p>
<p style="font-family:Calibri,Arial,sans-serif;font-size:7.5px;color:#6B7B8D;margin:1px 0 0 0;line-height:11px;mso-line-height-rule:exactly;"><span style="font-weight:600;">Brasília</span>&nbsp;&nbsp;${ENDERECO_BSB}</p>
</td></tr>
<tr><td colspan="3" style="padding:8px 0 0 0;"><p style="font-family:Calibri,Arial,sans-serif;font-size:7px;color:#C8CDD3;margin:0;line-height:9.5px;max-width:520px;mso-line-height-rule:exactly;">${AVISO_PT}</p></td></tr>
<tr><td colspan="3" style="padding:4px 0 0 0;"><p style="font-family:Calibri,Arial,sans-serif;font-size:7px;color:#C8CDD3;margin:0;line-height:9.5px;max-width:520px;font-style:italic;mso-line-height-rule:exactly;">${AVISO_EN}</p></td></tr>
</table></body></html>`;
  }, [nome, cargoPT, cargoEN, fixo, cel, fullEmail, fotoUrl, foto]);

  const handleDL = useCallback(() => {
    const html = genHTML();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Assinatura_${nome.replace(/\s+/g, "_") || "Assistants"}.htm`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML baixado.");
  }, [genHTML, nome]);

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
            <img src={WORDMARK_URL} alt="Assistants Consulting" className="h-6 w-auto" />
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
                  id="fixo"
                  placeholder="1135000000"
                  value={fixoRaw}
                  onChange={onFixo}
                  inputMode="numeric"
                  maxLength={10}
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
                  id="cel"
                  placeholder="11999990000"
                  value={celRaw}
                  onChange={onCel}
                  inputMode="numeric"
                  maxLength={11}
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
                    id="emailUser"
                    type="text"
                    placeholder="maria.silva"
                    value={emailUser}
                    onChange={onEmailUser}
                    className="flex-1 h-full px-3 text-sm text-[#0B1929] placeholder:text-[#B0B8C1] outline-none border-none bg-transparent"
                  />
                  <span className="px-3 text-sm text-[#3D4F5F] bg-[#F4F5F7] h-full flex items-center border-l border-[#E7E9EB] font-medium select-none whitespace-nowrap">
                    {EMAIL_DOMAIN}
                  </span>
                </div>
                {emailUser && (
                  <span className="text-[10px] text-[#B0B8C1]">Resultado: {fullEmail}</span>
                )}
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
              <Button onClick={handleCopy} disabled={!phonesOk} className="flex-1 h-12 bg-[#0B1929] hover:bg-[#162a40] text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {copied ? (<><Check className="w-4 h-4 mr-2" /> Copiado!</>) : (<><Copy className="w-4 h-4 mr-2" /> Copiar assinatura</>)}
              </Button>
              <Button variant="outline" onClick={handleDL} disabled={!phonesOk} className="h-12 px-5 border-[#E7E9EB] text-[#3D4F5F] hover:border-[#0B1929] hover:text-[#0B1929] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Download className="w-4 h-4 mr-2" /> Baixar HTML
              </Button>
            </div>

            {!phonesOk && (fixoRaw.length > 0 || celRaw.length > 0) && (
              <p className="text-xs text-red-500 font-medium">
                Corrija os telefones acima antes de gerar a assinatura. Todos os números devem ter DDD válido e estar completos.
              </p>
            )}

            {/* Instructions */}
            <div className="bg-[#FDF6EE] border border-[#F5DFC3] rounded-lg p-4">
              <h3 className="text-xs font-semibold text-[#0B1929] uppercase tracking-wider mb-2">Como usar</h3>
              <ol className="text-xs text-[#3D4F5F] space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Preencha todos os campos ao lado</li>
                <li>Clique em <strong>"Copiar assinatura"</strong></li>
                <li>No Outlook, vá em <strong>Configurações &gt; Email &gt; Assinaturas</strong></li>
                <li>Cole com <strong>Ctrl+V</strong> na caixa de assinatura</li>
                <li>Salve e pronto!</li>
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

                {/* SIGNATURE PREVIEW */}
                <div ref={prevRef}>
                  <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse", fontFamily: "Calibri, Arial, Helvetica, sans-serif", maxWidth: 520 }}>
                    <tbody>
                      {/* Top separator */}
                      <tr><td colSpan={3} style={{ padding: "0 0 10px 0", borderTop: "1px solid #E7E9EB", fontSize: 1, lineHeight: "1px" }}>&nbsp;</td></tr>
                      {/* Main row: photo | orange bar | info */}
                      <tr>
                        <td style={{ verticalAlign: "top", padding: 0, width: foto ? 60 : 44 }}>
                          {foto && fotoUrl ? (
                            <img src={fotoUrl} alt="Foto" width={60} height={60} style={{ display: "block", border: "1px solid #E7E9EB", width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <img src={SYMBOL_URL} alt="A" width={44} height={44} style={{ display: "block", border: 0, width: 44, height: 44 }} />
                          )}
                        </td>
                        <td style={{ verticalAlign: "top", padding: "0 12px", width: 2 }}>
                          <table cellPadding={0} cellSpacing={0}><tbody><tr><td style={{ backgroundColor: "#E67E22", width: 2, height: foto ? 60 : 44, fontSize: 1, lineHeight: "1px" }}>&nbsp;</td></tr></tbody></table>
                        </td>
                        <td style={{ verticalAlign: "top", padding: 0 }}>
                          <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" }}>
                            <tbody>
                              <tr><td style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 13, fontWeight: 700, color: "#0B1929", lineHeight: "16px", padding: "0 0 1px 0" }}>{dNome}</td></tr>
                              <tr><td style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 9, fontWeight: 600, color: "#E67E22", lineHeight: "12px", padding: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{dPT}</td></tr>
                              <tr><td style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 8.5, fontWeight: 400, color: "#6B7B8D", lineHeight: "11px", padding: "0 0 5px 0", fontStyle: "italic" }}>{translating ? "Translating..." : dEN}</td></tr>
                              <tr><td style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 9.5, color: "#3D4F5F", lineHeight: "15px", padding: 0 }}><span style={{ color: "#0B1929", fontWeight: 600 }}>T</span>&nbsp;&nbsp;{dFixo}</td></tr>
                              <tr><td style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 9.5, color: "#3D4F5F", lineHeight: "15px", padding: 0 }}><span style={{ color: "#0B1929", fontWeight: 600 }}>M</span>&nbsp;&nbsp;{dCel}</td></tr>
                              <tr><td style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 9.5, color: "#3D4F5F", lineHeight: "15px", padding: 0 }}><span style={{ color: "#0B1929", fontWeight: 600 }}>E</span>&nbsp;&nbsp;<a href={`mailto:${dEmail}`} style={{ color: "#E67E22", textDecoration: "none" }}>{dEmail}</a></td></tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      {/* Wordmark */}
                      <tr><td colSpan={3} style={{ padding: "8px 0 0 0", fontSize: 1, lineHeight: "1px" }}>&nbsp;</td></tr>
                      <tr><td colSpan={3} style={{ padding: 0 }}><a href="https://www.assistants.com.br" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}><img src={SIG_WORDMARK_URL} alt="Assistants Consulting" width={90} style={{ display: "block", border: 0, width: 90, height: "auto" }} /></a></td></tr>
                      {/* Bottom separator */}
                      <tr><td colSpan={3} style={{ padding: "6px 0 0 0", borderBottom: "1px solid #E7E9EB", fontSize: 1, lineHeight: "1px" }}>&nbsp;</td></tr>
                      {/* Addresses */}
                      <tr><td colSpan={3} style={{ padding: "6px 0 0 0" }}>
                        <p style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 7.5, color: "#6B7B8D", margin: 0, lineHeight: "11px" }}><span style={{ fontWeight: 600 }}>São Paulo</span>&nbsp;&nbsp;{ENDERECO_SP}</p>
                        <p style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 7.5, color: "#6B7B8D", margin: "1px 0 0 0", lineHeight: "11px" }}><span style={{ fontWeight: 600 }}>Brasília</span>&nbsp;&nbsp;{ENDERECO_BSB}</p>
                      </td></tr>
                      {/* Disclaimer */}
                      <tr><td colSpan={3} style={{ padding: "8px 0 0 0" }}><p style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 7, color: "#C8CDD3", margin: 0, lineHeight: "9.5px", maxWidth: 520 }}>{AVISO_PT}</p></td></tr>
                      <tr><td colSpan={3} style={{ padding: "4px 0 0 0" }}><p style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 7, color: "#C8CDD3", margin: 0, lineHeight: "9.5px", maxWidth: 520, fontStyle: "italic" }}>{AVISO_EN}</p></td></tr>
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
