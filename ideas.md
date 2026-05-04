# Brainstorm — Gerador de Assinatura Assistants Consulting

## Contexto
Ferramenta interna para colaboradores gerarem sua assinatura de e-mail corporativa. Deve ser simples, direta e refletir a identidade visual da Assistants Consulting (Abyssal Navy #0B1929, Inflection Orange #E67E22, Steel Grey #3D4F5F, Calibri).

---

<response>
<text>
## Ideia 1: "Instrument Panel"

**Design Movement:** Swiss Design / Dieter Rams industrial minimalism
**Core Principles:** Clareza absoluta, funcionalidade sem ornamento, precisão tipográfica
**Color Philosophy:** Fundo branco puro com navy como tinta única. Laranja aparece apenas no preview da assinatura e no botão de ação principal — exatamente como funciona na marca real.
**Layout Paradigm:** Split-screen horizontal — formulário à esquerda, preview ao vivo à direita. Sem scroll. Tudo visível em uma viewport.
**Signature Elements:** Grid lines sutis visíveis no fundo (referência ao construction grid do logo), tipografia monospace nos labels dos campos
**Interaction Philosophy:** Cada campo atualiza o preview instantaneamente. Zero cliques desnecessários.
**Animation:** Apenas transições de opacidade nos campos do preview conforme são preenchidos. Sem bounce, sem slide.
**Typography System:** Calibri para o preview (fidelidade à assinatura real), system-ui para a interface do formulário
</text>
<probability>0.06</probability>
</response>

<response>
<text>
## Ideia 2: "Dark Studio"

**Design Movement:** Editorial escuro / Bloomberg Terminal aesthetic
**Core Principles:** Fundo navy escuro (#0B1929) como ambiente de trabalho, contraste alto, sensação de ferramenta profissional
**Color Philosophy:** O navy domina tudo. O formulário vive em cards com fundo levemente mais claro. O preview da assinatura aparece em um "cartão branco" flutuante — simulando como ficará no e-mail real.
**Layout Paradigm:** Centralizado vertical com card único contendo formulário acima e preview abaixo, separados por linha laranja.
**Signature Elements:** O ponto de inflexão laranja como indicador de progresso. Glow sutil nos inputs ao focar.
**Interaction Philosophy:** Formulário como wizard — preenche, vê resultado, copia. Feedback tátil nos botões.
**Animation:** Glow laranja nos focus states, fade-in do preview, pulse no botão copiar após sucesso.
**Typography System:** Calibri Light para títulos da interface, Calibri para campos e preview
</text>
<probability>0.04</probability>
</response>

<response>
<text>
## Ideia 3: "Clean Workspace"

**Design Movement:** Notion/Linear — tool-first minimalism
**Core Principles:** A ferramenta desaparece, o resultado brilha. Interface tão simples que não precisa de manual.
**Color Philosophy:** Fundo off-white (#FAFAFA), bordas quase invisíveis, navy apenas nos textos. O preview é o único elemento com presença visual forte — ele é a estrela.
**Layout Paradigm:** Coluna única centralizada, formulário compacto no topo, preview grande e dominante abaixo. Mobile-first.
**Signature Elements:** Toggle visual para "Com foto / Sem foto". Indicador de campos preenchidos como progress dots.
**Interaction Philosophy:** Tab entre campos, preview atualiza em tempo real, botão "Copiar" com feedback visual claro.
**Animation:** Micro-transições em 150ms. Checkmark animado ao copiar. Nada mais.
**Typography System:** System font stack para interface, Calibri para preview (fidelidade)
</text>
<probability>0.08</probability>
</response>

---

## Escolha: Ideia 1 — "Instrument Panel"

A abordagem Swiss Design / split-screen é a mais adequada porque:
1. O colaborador vê o resultado em tempo real ao lado do formulário — sem scroll
2. A estética minimalista reflete a seriedade da consultoria atuarial
3. O grid sutil no fundo conecta à identidade visual (construction grid do logo)
4. É a mais intuitiva: preenche à esquerda, vê à direita, copia embaixo
