/**
 * Gerador de Assinatura Corporativa — Assistants Consulting
 * Design Big4/Interbrand: tipografia limpa, paleta neutra com acento laranja.
 * Todas as imagens são embutidas em base64 para compatibilidade total com Outlook.
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
  Upload, Mail, Phone, Briefcase,
  Download, Image, Smartphone, Loader2, Copy, ClipboardCheck, RefreshCw,
} from "lucide-react";

/* URLs para exibição no preview web (não usadas no HTML exportado) */
const SYMBOL_URL = "/manus-storage/sig_symbol_dd0e591b.png";
const WORDMARK_URL = "/manus-storage/sig_wordmark_fc5032b8.png";

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

/** Crop an image to a circle and return a base64 PNG data URI */
function cropCircle(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        const ox = (img.width - size) / 2;
        const oy = (img.height - size) / 2;
        ctx.drawImage(img, -ox, -oy, img.width, img.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const [downloading, setDownloading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fixo = fmtPhone(fixoRaw, false);
  const cel = fmtPhone(celRaw, true);
  const fullEmail = emailUser ? `${emailUser}${EMAIL_DOMAIN}` : "";
  const fixoErr = fixoRaw.length >= 2 && !isDDDOk(fixoRaw);
  const celErr = celRaw.length >= 2 && !isDDDOk(celRaw);

  // Display values (fallback placeholders)
  const dNome = nome || "Nome Completo";
  const dPT = (cargoPT || "Cargo").toUpperCase();
  const dEN = cargoEN || "Position";
  const dFixo = fixo || "+55 (XX) XXXX-XXXX";
  const dEmail = fullEmail || "nome@assistants.com.br";

  // Translation via LLM
  const tMut = trpc.translate.jobTitle.useMutation({
    onSuccess: (d) => {
      if (d.translated) setCargoEN(d.translated);
      setTranslating(false);
    },
    onError: () => setTranslating(false),
  });

  // Build ZIP via server
  const zipMut = trpc.signature.buildZip.useMutation({
    onSuccess: (d) => {
      const link = document.createElement("a");
      link.href = `data:application/zip;base64,${d.zipB64}`;
      link.download = d.fileName;
      link.click();
      setDownloading(false);
      toast.success("Pacote baixado com sucesso!");
    },
    onError: () => {
      setDownloading(false);
      toast.error("Erro ao gerar o pacote ZIP.");
    },
  });

  // Debounced translation trigger
  useEffect(() => {
    if (!cargoPT.trim()) { setCargoEN(""); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTranslating(true);
      tMut.mutate({ title: cargoPT });
    }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [cargoPT]);

  const onFixo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFixoRaw(digitsOnly(e.target.value).slice(0, 10));
  }, []);
  const onCel = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCelRaw(digitsOnly(e.target.value).slice(0, 11));
  }, []);
  const onEmailUser = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailUser(e.target.value.replace(/[@\s]/g, "").toLowerCase());
  }, []);

  const onFoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast.error("Foto muito grande. Máximo 500 KB."); return; }
    try {
      const cropped = await cropCircle(file);
      setFotoUrl(cropped);
      toast.success("Foto carregada e recortada com sucesso.");
    } catch {
      toast.error("Erro ao processar a imagem.");
    }
    e.target.value = "";
  }, []);

  /** Generate full MSO-compatible HTML with inline base64 images for clipboard */
  const genHTMLForClipboard = useCallback((): string => {
    const hasPhoto = foto && !!fotoUrl;
    const photoSize = 90;
    const symbolSize = 44;
    const sz = hasPhoto ? photoSize : symbolSize;
    const imgSrc = hasPhoto ? fotoUrl! : (SIG_SYMBOL_B64 || SYMBOL_URL);
    const wmSrc = SIG_WORDMARK_B64 || WORDMARK_URL;

    const photoHTML = hasPhoto
      ? `<img src="${imgSrc}" alt="${dNome}" width="${photoSize}" height="${photoSize}" style="display:block;width:${photoSize}px;height:${photoSize}px;border-radius:50%;border:0;outline:none;" />`
      : `<img src="${imgSrc}" alt="A" width="${symbolSize}" height="${symbolSize}" style="display:block;width:${symbolSize}px;height:${symbolSize}px;border:0;outline:none;" />`;

    const rows = [
      `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Calibri,Arial,Helvetica,sans-serif;max-width:520px;border:none;mso-table-lspace:0pt;mso-table-rspace:0pt;">`,
      `<tr><td colspan="2" height="10" style="height:10px;border-top:1px solid #E7E9EB;border-left:none;border-right:none;border-bottom:none;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      `<tr>`,
      `<td valign="top" style="padding:0;width:${sz}px;border:none;">${photoHTML}</td>`,
      `<td valign="top" style="padding:0 0 0 14px;border:none;">`,
      `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:none;mso-table-lspace:0pt;mso-table-rspace:0pt;">`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#0B1929;line-height:18px;padding:0 0 1px 0;border:none;mso-line-height-rule:exactly;">${dNome}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;color:#0B1929;line-height:12px;padding:0;border:none;text-transform:uppercase;letter-spacing:0.8px;mso-line-height-rule:exactly;">${dPT}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:9px;font-weight:normal;color:#6B7B8D;line-height:12px;padding:0 0 8px 0;border:none;font-style:italic;mso-line-height-rule:exactly;">${dEN}</td></tr>`,
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><span style="color:#6B7B8D;">T</span>&nbsp;&nbsp;${dFixo}</td></tr>`,
      ...(cel ? [`<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><span style="color:#6B7B8D;">M</span>&nbsp;&nbsp;${cel}</td></tr>`] : []),
      `<tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11px;color:#3D4F5F;line-height:17px;padding:0;border:none;mso-line-height-rule:exactly;"><span style="color:#6B7B8D;">E</span>&nbsp;&nbsp;<a href="mailto:${dEmail}" style="color:#E67E22;text-decoration:none;">${dEmail}</a></td></tr>`,
      `</table></td></tr>`,
      `<tr><td colspan="2" height="10" style="height:10px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      `<tr><td colspan="2" style="padding:0;border:none;"><a href="https://www.assistants.com.br" target="_blank" style="text-decoration:none;"><img src="${wmSrc}" alt="Assistants Consulting" width="180" height="40" style="display:block;border:0;outline:none;width:180px;height:40px;" /></a></td></tr>`,
      `<tr><td colspan="2" height="8" style="height:8px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      `<tr><td colspan="2" height="1" style="height:1px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;background-color:#E7E9EB;">&nbsp;</td></tr>`,
      `<tr><td colspan="2" height="4" style="height:4px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      `<tr><td colspan="2" style="padding:0;border:none;"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;line-height:12px;mso-line-height-rule:exactly;"><span style="font-weight:bold;">S\u00e3o Paulo</span>&nbsp;&nbsp;${ENDERECO_SP}</td></tr><tr><td style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#6B7B8D;line-height:12px;mso-line-height-rule:exactly;padding:2px 0 0 0;"><span style="font-weight:bold;">Bras\u00edlia</span>&nbsp;&nbsp;${ENDERECO_BSB}</td></tr></table></td></tr>`,
      `<tr><td colspan="2" height="6" style="height:6px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      `<tr><td colspan="2" style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#B0B8C1;line-height:11px;mso-line-height-rule:exactly;width:520px;">${AVISO_PT}</td></tr>`,
      `<tr><td colspan="2" height="4" style="height:4px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td></tr>`,
      `<tr><td colspan="2" style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:8px;color:#B0B8C1;line-height:11px;mso-line-height-rule:exactly;font-style:italic;width:520px;">${AVISO_EN}</td></tr>`,
      `</table>`,
    ];

    return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge">
<!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
</head><body style="margin:0;padding:0;">${rows.join('')}</body></html>`;
  }, [nome, cargoPT, cargoEN, fixo, cel, fullEmail, fotoUrl, foto, dNome, dPT, dEN, dFixo, dEmail]);

  const handleCopy = useCallback(async () => {
    try {
      const html = genHTMLForClipboard();
      const plainText = `${dNome}\n${dPT}\n${dEN}\nT  ${dFixo}${cel ? `\nM  ${cel}` : ""}\nE  ${dEmail}`;
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([clipboardItem]);
      setCopied(true);
      toast.success("Assinatura copiada! Cole no editor de assinaturas do Outlook.");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback via selection
      try {
        const html = genHTMLForClipboard();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        Object.assign(tempDiv.style, { position: 'fixed', left: '-9999px', top: '0', opacity: '0' });
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
        toast.success("Assinatura copiada via método alternativo.");
        setTimeout(() => setCopied(false), 3000);
      } catch {
        toast.error("Não foi possível copiar. Tente baixar o pacote .zip.");
      }
    }
  }, [genHTMLForClipboard, dNome, dPT, dEN, dFixo, cel, dEmail]);

  const handleDownloadZip = useCallback(() => {
    setDownloading(true);
    const safeName = (nome || "assinatura").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 40) || "assinatura";
    zipMut.mutate({
      nome, cargoPT, cargoEN, fixo, cel, email: fullEmail,
      fotoB64: foto && fotoUrl ? fotoUrl : undefined,
      baseName: safeName,
    });
  }, [nome, cargoPT, cargoEN, fixo, cel, fullEmail, foto, fotoUrl, zipMut]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E7E9EB] sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <img src={WORDMARK_URL} alt="Assistants Consulting" className="h-7 w-auto" />
            <span className="hidden sm:block text-[11px] text-[#B0B8C1] font-medium uppercase tracking-widest border-l border-[#E7E9EB] pl-3">
              Gerador de Assinatura
            </span>
          </div>
          <span className="text-[10px] text-[#B0B8C1] font-medium uppercase tracking-wider">
            Uso interno
          </span>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">

          {/* ── Formulário ── */}
          <div className="bg-white rounded-xl border border-[#E7E9EB] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E7E9EB]">
              <h1 className="text-base font-bold text-[#0B1929] tracking-tight">Configure sua assinatura</h1>
              <p className="text-xs text-[#6B7B8D] mt-0.5">Preencha seus dados abaixo. A assinatura será atualizada em tempo real.</p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-[11px] font-semibold text-[#3D4F5F] uppercase tracking-wider">
                  Nome completo
                </Label>
                <Input
                  id="nome" placeholder="Maria Helena Silva"
                  value={nome} onChange={e => setNome(e.target.value)}
                  className="h-10 border-[#E7E9EB] focus-visible:ring-[#E67E22]/30 focus-visible:border-[#E67E22] text-[#0B1929] placeholder:text-[#C8CDD4] text-sm"
                />
              </div>

              {/* Cargo */}
              <div className="space-y-1.5">
                <Label htmlFor="cargoPT" className="text-[11px] font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" /> Cargo / Departamento
                </Label>
                <Input
                  id="cargoPT" placeholder="Atuária Sênior"
                  value={cargoPT} onChange={e => setCargoPT(e.target.value)}
                  className="h-10 border-[#E7E9EB] focus-visible:ring-[#E67E22]/30 focus-visible:border-[#E67E22] text-[#0B1929] placeholder:text-[#C8CDD4] text-sm"
                />
                <div className="flex items-center gap-2 min-h-[18px]">
                  {translating ? (
                    <span className="flex items-center gap-1 text-[10px] text-[#B0B8C1]">
                      <Loader2 className="w-3 h-3 animate-spin" /> Traduzindo...
                    </span>
                  ) : cargoEN ? (
                    <span className="text-[10px] text-[#6B7B8D]">
                      <span className="font-medium text-[#B0B8C1] uppercase tracking-wider mr-1">EN</span>
                      {cargoEN}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#C8CDD4]">Tradução automática para inglês</span>
                  )}
                </div>
              </div>

              <Separator className="bg-[#F0F1F3]" />

              {/* Telefone Fixo */}
              <div className="space-y-1.5">
                <Label htmlFor="fixo" className="text-[11px] font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Telefone fixo
                </Label>
                <Input
                  id="fixo" placeholder="1135000000"
                  value={fixoRaw} onChange={onFixo}
                  inputMode="numeric" maxLength={10}
                  className={`h-10 border-[#E7E9EB] focus-visible:ring-[#E67E22]/30 focus-visible:border-[#E67E22] text-[#0B1929] placeholder:text-[#C8CDD4] font-mono text-sm ${fixoErr ? "border-red-300 focus-visible:border-red-400" : ""}`}
                />
                <div className="flex items-center justify-between min-h-[16px]">
                  <span className="text-[10px] text-[#B0B8C1]">
                    {fixoRaw ? `Resultado: ${fixo}` : "DDD + número (ex: 1135000000)"}
                  </span>
                  {fixoErr && <span className="text-[10px] text-red-400 font-medium">DDD inválido</span>}
                  {!fixoErr && isComplete(fixoRaw, false) && <span className="text-[10px] text-emerald-500 font-medium">✓ Válido</span>}
                </div>
              </div>

              {/* Celular */}
              <div className="space-y-1.5">
                <Label htmlFor="cel" className="text-[11px] font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3" /> Celular <span className="text-[#B0B8C1] normal-case font-normal">(opcional)</span>
                </Label>
                <Input
                  id="cel" placeholder="11999990000"
                  value={celRaw} onChange={onCel}
                  inputMode="numeric" maxLength={11}
                  className={`h-10 border-[#E7E9EB] focus-visible:ring-[#E67E22]/30 focus-visible:border-[#E67E22] text-[#0B1929] placeholder:text-[#C8CDD4] font-mono text-sm ${celErr ? "border-red-300 focus-visible:border-red-400" : ""}`}
                />
                <div className="flex items-center justify-between min-h-[16px]">
                  <span className="text-[10px] text-[#B0B8C1]">
                    {celRaw ? `Resultado: ${cel}` : "DDD + número (ex: 11999990000)"}
                  </span>
                  {celErr && <span className="text-[10px] text-red-400 font-medium">DDD inválido</span>}
                  {!celErr && isComplete(celRaw, true) && <span className="text-[10px] text-emerald-500 font-medium">✓ Válido</span>}
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <Label htmlFor="emailUser" className="text-[11px] font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> E-mail corporativo
                </Label>
                <div className="flex items-center h-10 rounded-md border border-[#E7E9EB] focus-within:border-[#E67E22] focus-within:ring-1 focus-within:ring-[#E67E22]/20 overflow-hidden bg-white">
                  <input
                    id="emailUser" type="text" placeholder="maria.silva"
                    value={emailUser} onChange={onEmailUser}
                    className="flex-1 h-full px-3 text-sm text-[#0B1929] placeholder:text-[#C8CDD4] outline-none border-none bg-transparent"
                  />
                  <span className="px-3 text-xs text-[#6B7B8D] bg-[#F7F8FA] h-full flex items-center border-l border-[#E7E9EB] font-medium select-none whitespace-nowrap">
                    {EMAIL_DOMAIN}
                  </span>
                </div>
                {emailUser && <span className="text-[10px] text-[#B0B8C1]">{fullEmail}</span>}
              </div>

              <Separator className="bg-[#F0F1F3]" />

              {/* Foto */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="w-3.5 h-3.5 text-[#3D4F5F]" />
                    <Label htmlFor="foto-toggle" className="text-[11px] font-semibold text-[#3D4F5F] uppercase tracking-wider cursor-pointer">
                      Incluir foto
                    </Label>
                    <span className="text-[10px] text-[#B0B8C1]">(sócios e diretores)</span>
                  </div>
                  <Switch id="foto-toggle" checked={foto} onCheckedChange={setFoto} />
                </div>

                {foto && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-[11px] text-[#6B7B8D]">Foto quadrada, mínimo 160×160 px, máximo 500 KB. Será recortada automaticamente em círculo.</p>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFoto} className="hidden" />
                    <div className="flex items-center gap-3">
                      {fotoUrl && (
                        <img src={fotoUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-[#E7E9EB]" />
                      )}
                      <Button
                        variant="outline" size="sm"
                        onClick={() => fileRef.current?.click()}
                        className="border-[#E7E9EB] text-[#3D4F5F] hover:border-[#E67E22] hover:text-[#E67E22] text-xs gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {fotoUrl ? "Trocar foto" : "Selecionar foto"}
                      </Button>
                      {fotoUrl && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setFotoUrl(null)}
                          className="text-[#B0B8C1] hover:text-red-400 text-xs"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-[#F0F1F3]" />

              {/* Botões de exportação */}
              <div className="space-y-2.5 pt-1">
                <Button
                  onClick={handleCopy}
                  className="w-full h-11 bg-[#E67E22] hover:bg-[#CF6D17] text-white font-semibold text-sm gap-2 transition-all active:scale-[0.98]"
                >
                  {copied ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado com sucesso!" : "Copiar para Outlook"}
                </Button>
                <Button
                  onClick={handleDownloadZip}
                  disabled={downloading}
                  variant="outline"
                  className="w-full h-11 border-[#E7E9EB] text-[#3D4F5F] hover:border-[#0B1929] hover:text-[#0B1929] font-semibold text-sm gap-2 transition-all active:scale-[0.98]"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Baixar pacote (.zip)
                </Button>
              </div>
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E7E9EB] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E7E9EB] flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-[#0B1929] uppercase tracking-widest">Preview da assinatura</h2>
                  <p className="text-[10px] text-[#B0B8C1] mt-0.5">Atualização em tempo real</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${translating ? "bg-[#E67E22] animate-pulse" : "bg-emerald-400"}`} />
                  <span className="text-[10px] text-[#B0B8C1]">{translating ? "Traduzindo..." : "Pronto"}</span>
                </div>
              </div>

              {/* Simulação de e-mail */}
              <div className="p-6">
                <div className="bg-[#F7F8FA] rounded-lg border border-[#E7E9EB] p-4 mb-4 space-y-1.5">
                  <div className="flex gap-2 text-xs text-[#6B7B8D]">
                    <span className="font-semibold text-[#3D4F5F] w-12">De:</span>
                    <span>{dNome} &lt;{dEmail}&gt;</span>
                  </div>
                  <div className="flex gap-2 text-xs text-[#6B7B8D]">
                    <span className="font-semibold text-[#3D4F5F] w-12">Para:</span>
                    <span>destinatario@empresa.com.br</span>
                  </div>
                  <div className="flex gap-2 text-xs text-[#6B7B8D]">
                    <span className="font-semibold text-[#3D4F5F] w-12">Assunto:</span>
                    <span>Relatório Atuarial — Exercício 2025</span>
                  </div>
                </div>

                <div className="text-sm text-[#3D4F5F] space-y-2 mb-6 font-[Calibri,Arial,sans-serif]">
                  <p>Prezado(a),</p>
                  <p>Segue em anexo o relatório atuarial referente ao exercício de 2025, conforme solicitado.</p>
                  <p>Atenciosamente,</p>
                </div>

                {/* Assinatura */}
                <div style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", maxWidth: 520 }}>
                  <div style={{ borderTop: "1px solid #E7E9EB", paddingTop: 10 }}>
                    <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse", border: "none" }}>
                      <tbody>
                        <tr>
                          <td style={{ verticalAlign: "top", padding: 0, width: foto ? 90 : 44, border: "none" }}>
                            {foto && fotoUrl ? (
                              <img src={fotoUrl} alt={dNome} width={90} height={90} style={{ display: "block", width: 90, height: 90, borderRadius: "50%", border: 0 }} />
                            ) : (
                              <img src={SYMBOL_URL} alt="A" width={44} height={44} style={{ display: "block", width: 44, height: 44, border: 0 }} />
                            )}
                          </td>
                          <td style={{ verticalAlign: "top", padding: "0 0 0 14px", border: "none" }}>
                            <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse", border: "none" }}>
                              <tbody>
                                <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 14, fontWeight: 700, color: "#0B1929", lineHeight: "18px", padding: "0 0 1px 0", border: "none" }}>{dNome}</td></tr>
                                <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 9, fontWeight: 700, color: "#0B1929", lineHeight: "12px", padding: 0, textTransform: "uppercase", letterSpacing: "0.8px", border: "none" }}>{dPT}</td></tr>
                                <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 9, fontWeight: 400, color: "#6B7B8D", lineHeight: "12px", padding: "0 0 8px 0", fontStyle: "italic", border: "none" }}>
                                  {translating ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><RefreshCw style={{ width: 10, height: 10, animation: "spin 1s linear infinite" }} /> Traduzindo...</span> : dEN}
                                </td></tr>
                                <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 11, color: "#3D4F5F", lineHeight: "17px", padding: 0, border: "none" }}><span style={{ color: "#6B7B8D" }}>T</span>&nbsp;&nbsp;{dFixo}</td></tr>
                                {cel && <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 11, color: "#3D4F5F", lineHeight: "17px", padding: 0, border: "none" }}><span style={{ color: "#6B7B8D" }}>M</span>&nbsp;&nbsp;{cel}</td></tr>}
                                <tr><td style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 11, color: "#3D4F5F", lineHeight: "17px", padding: 0, border: "none" }}><span style={{ color: "#6B7B8D" }}>E</span>&nbsp;&nbsp;<a href={`mailto:${dEmail}`} style={{ color: "#E67E22", textDecoration: "none" }}>{dEmail}</a></td></tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        <tr><td colSpan={2} style={{ padding: "10px 0 0 0", border: "none" }}>
                          <a href="https://www.assistants.com.br" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                            <img src={WORDMARK_URL} alt="Assistants Consulting" width={180} height={40} style={{ display: "block", border: 0, width: 180, height: 40 }} />
                          </a>
                        </td></tr>
                        <tr><td colSpan={2} style={{ padding: "8px 0 0 0", borderTop: "1px solid #E7E9EB", borderLeft: "none", borderRight: "none", borderBottom: "none", fontSize: 1, lineHeight: "1px" }}>&nbsp;</td></tr>
                        <tr><td colSpan={2} style={{ padding: "4px 0 0 0", border: "none" }}>
                          <p style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 8, color: "#6B7B8D", margin: 0, lineHeight: "12px" }}><strong>São Paulo</strong>&nbsp;&nbsp;{ENDERECO_SP}</p>
                          <p style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 8, color: "#6B7B8D", margin: "2px 0 0 0", lineHeight: "12px" }}><strong>Brasília</strong>&nbsp;&nbsp;{ENDERECO_BSB}</p>
                        </td></tr>
                        <tr><td colSpan={2} style={{ padding: "10px 0 0 0", border: "none" }}>
                          <p style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 8, color: "#B0B8C1", margin: 0, lineHeight: "11px", maxWidth: 520 }}>{AVISO_PT}</p>
                        </td></tr>
                        <tr><td colSpan={2} style={{ padding: "4px 0 0 0", border: "none" }}>
                          <p style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif", fontSize: 8, color: "#B0B8C1", margin: 0, lineHeight: "11px", maxWidth: 520, fontStyle: "italic" }}>{AVISO_EN}</p>
                        </td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-[#E7E9EB] flex items-center justify-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${foto ? "bg-[#E67E22]" : "bg-[#E7E9EB]"}`} />
                <span className="text-[10px] text-[#B0B8C1] uppercase tracking-wider">
                  {foto ? "Versão com foto" : "Versão padrão"}
                </span>
              </div>
            </div>

            {/* Instruções de instalação */}
            <div className="bg-white rounded-xl border border-[#E7E9EB] shadow-sm p-6">
              <h3 className="text-xs font-bold text-[#0B1929] uppercase tracking-widest mb-3">Método rápido — Copiar e colar</h3>
              <ol className="space-y-1.5 text-xs text-[#6B7B8D]">
                <li className="flex gap-2"><span className="font-bold text-[#E67E22] shrink-0">1.</span> Preencha seus dados acima e clique em <strong className="text-[#3D4F5F]">Copiar para Outlook</strong>.</li>
                <li className="flex gap-2"><span className="font-bold text-[#E67E22] shrink-0">2.</span> No Outlook, vá em: <code className="bg-[#F7F8FA] px-1 py-0.5 rounded text-[10px] font-mono text-[#3D4F5F]">Arquivo &gt; Opções &gt; Email &gt; Assinaturas</code></li>
                <li className="flex gap-2"><span className="font-bold text-[#E67E22] shrink-0">3.</span> Clique em <strong className="text-[#3D4F5F]">Novo</strong> e dê um nome à assinatura.</li>
                <li className="flex gap-2"><span className="font-bold text-[#E67E22] shrink-0">4.</span> No campo de edição, pressione <kbd className="bg-[#F7F8FA] border border-[#E7E9EB] px-1 py-0.5 rounded text-[10px] font-mono text-[#3D4F5F]">Ctrl+V</kbd> para colar.</li>
                <li className="flex gap-2"><span className="font-bold text-[#E67E22] shrink-0">5.</span> Clique em <strong className="text-[#3D4F5F]">OK</strong> para salvar.</li>
              </ol>
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
