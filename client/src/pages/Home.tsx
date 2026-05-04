/*
 * Assistants Consulting — Gerador de Assinatura de E-mail
 * Design: Swiss "Instrument Panel" — split-screen, form left, preview right
 * Brand: Abyssal Navy #0B1929, Inflection Orange #E67E22, Steel Grey #3D4F5F
 *
 * Requisitos:
 * - Dois telefones: fixo e celular
 * - Cargo bilíngue: português e inglês
 * - Endereços SP e Brasília fixos
 * - Aviso legal completo no rodapé
 * - Opção de incluir foto (sócios/diretores)
 */

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, Check, Upload, User, Mail, Phone, Briefcase, Download, Image, Smartphone, Globe } from "lucide-react";

// Asset URLs
const WORDMARK_URL = "/manus-storage/Assistants_FINAL_Wordmark_d3b4a1a8.png";
const SYMBOL_URL = "/manus-storage/sig_symbol_478d8f65.png";
const SIG_WORDMARK_URL = "/manus-storage/sig_wordmark_daf02010.png";

// Company addresses (fixed)
const ENDERECO_SP = "Rua Cláudio Soares, 72 - 8º andar - Pinheiros - São Paulo/SP - CEP: 05422-030";
const ENDERECO_BSB = "SCS Quadra 9, Ed. Parque Cidade Corporate - Torre C - Bloco C - 10º andar - Brasília/DF - CEP: 70308-200";

// Legal disclaimer
const AVISO_LEGAL = "Esta mensagem, incluindo seus anexos, é confidencial e destinada exclusivamente ao(s) destinatário(s) indicado(s). Se você não é o destinatário pretendido, fica notificado de que qualquer uso, disseminação, distribuição ou cópia desta mensagem é estritamente proibido. Caso tenha recebido esta mensagem por engano, por favor notifique imediatamente o remetente por e-mail e apague esta mensagem e todos os seus anexos de seu sistema. A Assistants Consulting não se responsabiliza por opiniões pessoais do remetente que não estejam relacionadas aos negócios da empresa, nem por alterações realizadas após o envio desta mensagem.";

export default function Home() {
  const [nome, setNome] = useState("");
  const [cargoPT, setCargoPT] = useState("");
  const [cargoEN, setCargoEN] = useState("");
  const [telefoneFixo, setTelefoneFixo] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [incluirFoto, setIncluirFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast.error("A foto deve ter no máximo 500 KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFotoUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!previewRef.current) return;

    try {
      const range = document.createRange();
      range.selectNodeContents(previewRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("copy");
      selection?.removeAllRanges();

      setCopied(true);
      toast.success("Assinatura copiada! Cole no Outlook com Ctrl+V.");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Erro ao copiar. Tente selecionar manualmente.");
    }
  }, []);

  const generateHTML = useCallback(() => {
    const imgSize = incluirFoto ? 70 : 50;
    const borderRadius = incluirFoto ? "border-radius:50%;object-fit:cover;" : "";
    const imgAlt = incluirFoto ? "Foto" : "A";
    const actualImgSrc = incluirFoto && fotoUrl ? fotoUrl : SYMBOL_URL;

    const displayNome = nome || "[Nome Completo]";
    const displayCargoPT = cargoPT || "[Cargo em Português]";
    const displayCargoEN = cargoEN || "[Position in English]";
    const displayFixo = telefoneFixo || "+55 (XX) XXXX-XXXX";
    const displayCelular = celular || "+55 (XX) XXXXX-XXXX";
    const displayEmail = email || "nome@assistants.com.br";

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#fff;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;max-width:600px;">
<tr><td colspan="3" style="padding:0 0 14px 0;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="border-top:1px solid #E7E9EB;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr>
<tr>
<td style="vertical-align:top;padding:0;width:${imgSize + 6}px;"><img src="${actualImgSrc}" alt="${imgAlt}" width="${imgSize}" height="${imgSize}" style="display:block;border:0;width:${imgSize}px;height:${imgSize}px;${borderRadius}" /></td>
<td style="vertical-align:top;padding:0 14px;width:3px;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#E67E22;width:2px;height:${imgSize}px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td>
<td style="vertical-align:top;padding:0;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:14px;font-weight:700;color:#0B1929;line-height:18px;padding:0 0 1px 0;">${displayNome}</td></tr>
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:10px;font-weight:600;color:#E67E22;line-height:13px;padding:0;text-transform:uppercase;letter-spacing:0.6px;">${displayCargoPT}</td></tr>
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:9px;font-weight:400;color:#3D4F5F;line-height:13px;padding:0 0 6px 0;font-style:italic;">${displayCargoEN}</td></tr>
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:10px;color:#3D4F5F;line-height:16px;padding:0;"><span style="color:#0B1929;font-weight:600;">T</span>&nbsp;&nbsp;${displayFixo}</td></tr>
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:10px;color:#3D4F5F;line-height:16px;padding:0;"><span style="color:#0B1929;font-weight:600;">M</span>&nbsp;&nbsp;${displayCelular}</td></tr>
<tr><td style="font-family:Calibri,Arial,sans-serif;font-size:10px;color:#3D4F5F;line-height:16px;padding:0;"><span style="color:#0B1929;font-weight:600;">E</span>&nbsp;&nbsp;<a href="mailto:${displayEmail}" style="color:#E67E22;text-decoration:none;">${displayEmail}</a></td></tr>
</table></td></tr>
<tr><td colspan="3" style="padding:12px 0 0 0;font-size:1px;line-height:1px;">&nbsp;</td></tr>
<tr><td colspan="3" style="padding:0;"><a href="https://www.assistants.com.br" target="_blank" style="text-decoration:none;"><img src="${SIG_WORDMARK_URL}" alt="Assistants Consulting" width="140" style="display:block;border:0;width:140px;height:auto;" /></a></td></tr>
<tr><td colspan="3" style="padding:10px 0 0 0;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="border-top:1px solid #E7E9EB;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr>
<tr><td colspan="3" style="padding:8px 0 0 0;">
<p style="font-family:Calibri,Arial,sans-serif;font-size:8px;color:#3D4F5F;margin:0;line-height:12px;"><span style="font-weight:600;">São Paulo</span>&nbsp;&nbsp;${ENDERECO_SP}</p>
<p style="font-family:Calibri,Arial,sans-serif;font-size:8px;color:#3D4F5F;margin:2px 0 0 0;line-height:12px;"><span style="font-weight:600;">Brasília</span>&nbsp;&nbsp;${ENDERECO_BSB}</p>
</td></tr>
<tr><td colspan="3" style="padding:10px 0 0 0;"><p style="font-family:Calibri,Arial,sans-serif;font-size:7px;color:#B0B8C1;margin:0;line-height:10px;max-width:580px;">${AVISO_LEGAL}</p></td></tr>
</table></body></html>`;
  }, [nome, cargoPT, cargoEN, telefoneFixo, celular, email, fotoUrl, incluirFoto]);

  const handleDownloadHTML = useCallback(() => {
    const html = generateHTML();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Assinatura_${nome.replace(/\s+/g, "_") || "Assistants"}.htm`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo HTML baixado com sucesso.");
  }, [generateHTML, nome]);

  // Display values for preview
  const displayNome = nome || "Nome Completo";
  const displayCargoPT = cargoPT || "Cargo em Português";
  const displayCargoEN = cargoEN || "Position in English";
  const displayFixo = telefoneFixo || "+55 (XX) XXXX-XXXX";
  const displayCelular = celular || "+55 (XX) XXXXX-XXXX";
  const displayEmail = email || "nome@assistants.com.br";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC]">
      {/* Header */}
      <header className="border-b border-[#E7E9EB] bg-white">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <img
              src={WORDMARK_URL}
              alt="Assistants Consulting"
              className="h-7 w-auto"
            />
            <Separator orientation="vertical" className="h-6 bg-[#E7E9EB]" />
            <span className="text-sm font-medium text-[#3D4F5F] tracking-wide">
              Gerador de Assinatura
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* LEFT: Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#0B1929] tracking-tight">
                Configure sua assinatura
              </h1>
              <p className="text-sm text-[#3D4F5F] mt-1.5 leading-relaxed">
                Preencha seus dados abaixo. A assinatura será atualizada em tempo real ao lado.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-[#E7E9EB] p-6 space-y-5">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Nome completo
                </Label>
                <Input
                  id="nome"
                  placeholder="Maria Helena Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="h-11 border-[#E7E9EB] focus:border-[#E67E22] focus:ring-[#E67E22]/20 text-[#0B1929] placeholder:text-[#B0B8C1]"
                />
              </div>

              {/* Cargo PT */}
              <div className="space-y-2">
                <Label htmlFor="cargoPT" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  Cargo (Português)
                </Label>
                <Input
                  id="cargoPT"
                  placeholder="Atuária Sênior"
                  value={cargoPT}
                  onChange={(e) => setCargoPT(e.target.value)}
                  className="h-11 border-[#E7E9EB] focus:border-[#E67E22] focus:ring-[#E67E22]/20 text-[#0B1929] placeholder:text-[#B0B8C1]"
                />
              </div>

              {/* Cargo EN */}
              <div className="space-y-2">
                <Label htmlFor="cargoEN" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  Cargo (English)
                </Label>
                <Input
                  id="cargoEN"
                  placeholder="Senior Actuary"
                  value={cargoEN}
                  onChange={(e) => setCargoEN(e.target.value)}
                  className="h-11 border-[#E7E9EB] focus:border-[#E67E22] focus:ring-[#E67E22]/20 text-[#0B1929] placeholder:text-[#B0B8C1]"
                />
              </div>

              {/* Telefone Fixo */}
              <div className="space-y-2">
                <Label htmlFor="fixo" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Telefone fixo
                </Label>
                <Input
                  id="fixo"
                  placeholder="+55 (11) 3500-0000"
                  value={telefoneFixo}
                  onChange={(e) => setTelefoneFixo(e.target.value)}
                  className="h-11 border-[#E7E9EB] focus:border-[#E67E22] focus:ring-[#E67E22]/20 text-[#0B1929] placeholder:text-[#B0B8C1]"
                />
              </div>

              {/* Celular */}
              <div className="space-y-2">
                <Label htmlFor="celular" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5" />
                  Celular
                </Label>
                <Input
                  id="celular"
                  placeholder="+55 (11) 99999-0000"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  className="h-11 border-[#E7E9EB] focus:border-[#E67E22] focus:ring-[#E67E22]/20 text-[#0B1929] placeholder:text-[#B0B8C1]"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  E-mail corporativo
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="maria.silva@assistants.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-[#E7E9EB] focus:border-[#E67E22] focus:ring-[#E67E22]/20 text-[#0B1929] placeholder:text-[#B0B8C1]"
                />
              </div>

              <Separator className="bg-[#E7E9EB]" />

              {/* Foto toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="w-3.5 h-3.5 text-[#3D4F5F]" />
                  <Label htmlFor="foto-toggle" className="text-xs font-semibold text-[#3D4F5F] uppercase tracking-wider">
                    Incluir foto (sócios e diretores)
                  </Label>
                </div>
                <Switch
                  id="foto-toggle"
                  checked={incluirFoto}
                  onCheckedChange={setIncluirFoto}
                />
              </div>

              {/* Photo upload */}
              {incluirFoto && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs text-[#3D4F5F]">
                    Foto quadrada, mínimo 160x160px, máximo 500 KB.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFotoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-11 border-dashed border-[#B0B8C1] text-[#3D4F5F] hover:border-[#E67E22] hover:text-[#E67E22] transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {fotoUrl ? "Trocar foto" : "Carregar foto"}
                  </Button>
                  {fotoUrl && (
                    <div className="flex items-center gap-3">
                      <img
                        src={fotoUrl}
                        alt="Preview"
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#E7E9EB]"
                      />
                      <span className="text-xs text-[#3D4F5F]">Foto carregada com sucesso.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleCopy}
                className="flex-1 h-12 bg-[#0B1929] hover:bg-[#162a40] text-white font-medium text-sm transition-all duration-200"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar assinatura
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadHTML}
                className="h-12 px-5 border-[#E7E9EB] text-[#3D4F5F] hover:border-[#0B1929] hover:text-[#0B1929] transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar HTML
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-[#FDF6EE] border border-[#F5DFC3] rounded-lg p-4">
              <h3 className="text-xs font-semibold text-[#0B1929] uppercase tracking-wider mb-2">
                Como usar
              </h3>
              <ol className="text-xs text-[#3D4F5F] space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Preencha todos os campos ao lado</li>
                <li>Clique em <strong>"Copiar assinatura"</strong></li>
                <li>No Outlook, vá em <strong>Configurações &gt; Email &gt; Assinaturas</strong></li>
                <li>Cole com <strong>Ctrl+V</strong> na caixa de assinatura</li>
                <li>Salve e pronto!</li>
              </ol>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#3D4F5F] uppercase tracking-wider">
                Preview da assinatura
              </h2>
              <span className="text-[10px] text-[#B0B8C1] uppercase tracking-wider">
                Atualização em tempo real
              </span>
            </div>

            {/* Email mockup */}
            <div className="bg-white rounded-lg border border-[#E7E9EB] overflow-hidden shadow-sm">
              {/* Fake email header */}
              <div className="border-b border-[#E7E9EB] p-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#B0B8C1] uppercase tracking-wider w-14 shrink-0">De:</span>
                  <span className="text-xs text-[#0B1929]">{displayNome} &lt;{displayEmail}&gt;</span>
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
              <div className="p-6">
                <div className="space-y-3 mb-8">
                  <p className="text-sm text-[#3D4F5F]">Prezado(a),</p>
                  <p className="text-sm text-[#3D4F5F] leading-relaxed">
                    Segue em anexo o relatório atuarial referente ao exercício de 2025,
                    conforme solicitado.
                  </p>
                  <p className="text-sm text-[#3D4F5F]">Atenciosamente,</p>
                </div>

                {/* === SIGNATURE PREVIEW === */}
                <div ref={previewRef}>
                  <table
                    cellPadding={0}
                    cellSpacing={0}
                    style={{
                      borderCollapse: "collapse",
                      fontFamily: "Calibri, Arial, Helvetica, sans-serif",
                      maxWidth: 600,
                    }}
                  >
                    <tbody>
                      {/* Separator */}
                      <tr>
                        <td colSpan={3} style={{ padding: "0 0 14px 0" }}>
                          <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
                            <tbody>
                              <tr>
                                <td style={{ borderTop: "1px solid #E7E9EB", fontSize: 1, lineHeight: "1px" }}>
                                  &nbsp;
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      {/* Main row */}
                      <tr>
                        {/* Photo or Symbol */}
                        <td style={{ verticalAlign: "top", padding: 0, width: incluirFoto ? 76 : 56 }}>
                          {incluirFoto && fotoUrl ? (
                            <img
                              src={fotoUrl}
                              alt="Foto"
                              width={70}
                              height={70}
                              style={{
                                display: "block",
                                border: 0,
                                width: 70,
                                height: 70,
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <img
                              src={SYMBOL_URL}
                              alt="A"
                              width={50}
                              height={50}
                              style={{
                                display: "block",
                                border: 0,
                                width: 50,
                                height: 50,
                              }}
                            />
                          )}
                        </td>

                        {/* Orange bar */}
                        <td style={{ verticalAlign: "top", padding: "0 14px", width: 3 }}>
                          <table cellPadding={0} cellSpacing={0}>
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    backgroundColor: "#E67E22",
                                    width: 2,
                                    height: incluirFoto ? 70 : 50,
                                    fontSize: 1,
                                    lineHeight: "1px",
                                  }}
                                >
                                  &nbsp;
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>

                        {/* Contact info */}
                        <td style={{ verticalAlign: "top", padding: 0 }}>
                          <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" }}>
                            <tbody>
                              {/* Name */}
                              <tr>
                                <td
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#0B1929",
                                    lineHeight: "18px",
                                    padding: "0 0 1px 0",
                                  }}
                                >
                                  {displayNome}
                                </td>
                              </tr>
                              {/* Cargo PT */}
                              <tr>
                                <td
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "#E67E22",
                                    lineHeight: "13px",
                                    padding: 0,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.6px",
                                  }}
                                >
                                  {displayCargoPT}
                                </td>
                              </tr>
                              {/* Cargo EN */}
                              <tr>
                                <td
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                    fontSize: 9,
                                    fontWeight: 400,
                                    color: "#3D4F5F",
                                    lineHeight: "13px",
                                    padding: "0 0 6px 0",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {displayCargoEN}
                                </td>
                              </tr>
                              {/* Telefone fixo */}
                              <tr>
                                <td
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                    fontSize: 10,
                                    color: "#3D4F5F",
                                    lineHeight: "16px",
                                    padding: 0,
                                  }}
                                >
                                  <span style={{ color: "#0B1929", fontWeight: 600 }}>T</span>
                                  &nbsp;&nbsp;{displayFixo}
                                </td>
                              </tr>
                              {/* Celular */}
                              <tr>
                                <td
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                    fontSize: 10,
                                    color: "#3D4F5F",
                                    lineHeight: "16px",
                                    padding: 0,
                                  }}
                                >
                                  <span style={{ color: "#0B1929", fontWeight: 600 }}>M</span>
                                  &nbsp;&nbsp;{displayCelular}
                                </td>
                              </tr>
                              {/* Email */}
                              <tr>
                                <td
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                    fontSize: 10,
                                    color: "#3D4F5F",
                                    lineHeight: "16px",
                                    padding: 0,
                                  }}
                                >
                                  <span style={{ color: "#0B1929", fontWeight: 600 }}>E</span>
                                  &nbsp;&nbsp;
                                  <a
                                    href={`mailto:${displayEmail}`}
                                    style={{ color: "#E67E22", textDecoration: "none" }}
                                  >
                                    {displayEmail}
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      {/* Spacing */}
                      <tr>
                        <td colSpan={3} style={{ padding: "12px 0 0 0", fontSize: 1, lineHeight: "1px" }}>
                          &nbsp;
                        </td>
                      </tr>

                      {/* Wordmark */}
                      <tr>
                        <td colSpan={3} style={{ padding: 0 }}>
                          <a
                            href="https://www.assistants.com.br"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none" }}
                          >
                            <img
                              src={SIG_WORDMARK_URL}
                              alt="Assistants Consulting"
                              width={140}
                              style={{ display: "block", border: 0, width: 140, height: "auto" }}
                            />
                          </a>
                        </td>
                      </tr>

                      {/* Separator before addresses */}
                      <tr>
                        <td colSpan={3} style={{ padding: "10px 0 0 0" }}>
                          <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
                            <tbody>
                              <tr>
                                <td style={{ borderTop: "1px solid #E7E9EB", fontSize: 1, lineHeight: "1px" }}>
                                  &nbsp;
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      {/* Addresses */}
                      <tr>
                        <td colSpan={3} style={{ padding: "8px 0 0 0" }}>
                          <p
                            style={{
                              fontFamily: "Calibri, Arial, sans-serif",
                              fontSize: 8,
                              color: "#3D4F5F",
                              margin: 0,
                              lineHeight: "12px",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>São Paulo</span>
                            &nbsp;&nbsp;{ENDERECO_SP}
                          </p>
                          <p
                            style={{
                              fontFamily: "Calibri, Arial, sans-serif",
                              fontSize: 8,
                              color: "#3D4F5F",
                              margin: "2px 0 0 0",
                              lineHeight: "12px",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>Brasília</span>
                            &nbsp;&nbsp;{ENDERECO_BSB}
                          </p>
                        </td>
                      </tr>

                      {/* Legal disclaimer */}
                      <tr>
                        <td colSpan={3} style={{ padding: "10px 0 0 0" }}>
                          <p
                            style={{
                              fontFamily: "Calibri, Arial, sans-serif",
                              fontSize: 7,
                              color: "#B0B8C1",
                              margin: 0,
                              lineHeight: "10px",
                              maxWidth: 580,
                            }}
                          >
                            {AVISO_LEGAL}
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Variant indicator */}
            <div className="flex items-center justify-center gap-2 py-2">
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  incluirFoto ? "bg-[#E67E22]" : "bg-[#E7E9EB]"
                }`}
              />
              <span className="text-[10px] text-[#B0B8C1] uppercase tracking-wider">
                {incluirFoto ? "Versão com foto" : "Versão padrão"}
              </span>
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  !incluirFoto ? "bg-[#E67E22]" : "bg-[#E7E9EB]"
                }`}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E7E9EB] bg-white py-4">
        <div className="container flex items-center justify-between">
          <span className="text-[10px] text-[#B0B8C1]">
            Assistants Consulting — Ferramenta interna
          </span>
          <span className="text-[10px] text-[#B0B8C1]">
            Identidade visual conforme Brand Book v1.0
          </span>
        </div>
      </footer>
    </div>
  );
}
