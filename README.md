# Markdown to PDF (MVP)

Extensão de Raycast: pega no Markdown que tens no clipboard (por exemplo, a resposta de um agente), gera um PDF,
guarda-o em disco e **põe o ficheiro PDF no clipboard** — é só fazer ⌘V no Slack, Mail, WhatsApp, Finder…

> Protótipo para testar. Não está pensado para publicar na store.

## Como testar

1. Abre o Raycast (tem de estar a correr).
2. Neste diretório:

   ```sh
   npm install
   npm run dev
   ```

   Isto importa a extensão para o Raycast em modo de desenvolvimento. Deixa-o a correr enquanto testas: recarrega
   sozinho quando alteras o código.
3. Copia um bloco de Markdown.
4. No Raycast, procura **Clipboard Markdown to PDF** e carrega em Enter (podes atribuir-lhe um atalho).
5. Aparece "PDF copied to the clipboard". Cola onde quiseres. O ficheiro fica também em `~/Downloads`.

Na primeira execução o Raycast compila o renderer (~3 s). Precisa das Xcode Command Line Tools
(`xcode-select --install`), que já tens se `swiftc --version` funcionar.

### Sem abrir o Raycast

```sh
npm run smoke                     # converte scripts/sample.md  ->  build/<título>.pdf
npm run smoke -- meu-texto.md     # ou um ficheiro teu
npm run smoke -- meu-texto.md letter
```

## Preferências

| Preferência | Para que serve | Por omissão |
|---|---|---|
| Save PDFs In | Pasta onde os PDFs ficam guardados | `~/Downloads` |
| Paper Size | A4 ou US Letter | A4 |
| After Generating | Só copiar, abrir no Preview ou mostrar no Finder | Só copiar |

O nome do ficheiro vem da primeira linha do Markdown (por exemplo `# Plano de migração` → `Plano de migração.pdf`).
Se já existir, fica `Plano de migração (2).pdf`.

## Como funciona

1. `marked` converte o Markdown em HTML (GFM: tabelas, listas de tarefas, riscado) e `highlight.js` colore o código.
2. O HTML é escrito num ficheiro temporário e impresso para PDF por `assets/html2pdf.swift`, um programa pequeno que
   usa o **WebKit do macOS** (o mesmo motor do Safari). Por isso o texto fica selecionável, os links funcionam e
   emojis, setas, acentos, CJK e árabe aparecem sem configuração.
3. `Clipboard.copy({ file })` do Raycast coloca o PDF no clipboard.

O JavaScript do HTML está desligado no renderer, por isso HTML cru dentro do Markdown não corre código.

## Limitações conhecidas

- Sem números de página nem cabeçalho/rodapé.
- Uma tabela maior do que uma página não repete a linha de cabeçalho nas páginas seguintes (o WebKit não o faz neste
  caminho de impressão). Tabelas pequenas ficam inteiras junto do título.
- Sem LaTeX/KaTeX nem diagramas Mermaid (aparecem como bloco de código).
- Só lê **texto** do clipboard. Se copiares texto formatado de uma página web, vais ter o texto simples, não o Markdown.
- Imagens remotas funcionam se houver rede; caminhos relativos não.
- Só macOS.
- O campo `author` do `package.json` tem de ser o teu handle do Raycast para o `npm run lint` passar. Não afeta o
  `npm run dev`.

## Estrutura

```
assets/html2pdf.swift     HTML -> PDF paginado com WebKit
src/clipboard-to-pdf.ts   o comando (clipboard, preferências, avisos)
src/lib/markdown.ts       Markdown -> HTML, título e nome do ficheiro
src/lib/styles.ts         CSS do PDF
src/lib/pdf.ts            compila e corre o renderer
scripts/smoke-test.ts     o mesmo caminho, sem Raycast
```
