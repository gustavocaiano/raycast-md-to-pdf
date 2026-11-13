# Markdown to PDF (MVP)

Extensão de Raycast: pega no Markdown que tens no clipboard (por exemplo, a resposta de um agente), gera um PDF,
guarda-o em disco, **põe o ficheiro PDF no clipboard** (⌘V no Slack, Mail, WhatsApp, Finder…) e, se tiveres o
Dropover, deixa-o numa shelf pronto a arrastar.

> Protótipo para testar. Não está pensado para publicar na store.

## Instalar no Raycast (passo a passo)

### O que precisas

- macOS com o [Raycast](https://www.raycast.com) aberto.
- Node.js 22.22 ou mais recente (`node -v`).
- Xcode Command Line Tools: `swiftc --version` tem de funcionar. Se não funcionar, corre `xcode-select --install`.
- Acesso a este repositório, que é privado: `gh auth login` ou uma chave SSH no GitHub.
- Dropover (opcional). Sem ele, o PDF fica só no clipboard e em `~/Downloads`.

### Passos

1. Clona o repositório:

   ```sh
   gh repo clone gustavocaiano/raycast-md-to-pdf ~/Developer/raycast-md-to-pdf
   cd ~/Developer/raycast-md-to-pdf
   ```

   Sem o `gh`: `git clone https://github.com/gustavocaiano/raycast-md-to-pdf.git`.

2. Instala as dependências:

   ```sh
   npm install
   ```

   Com o npm 12 aparece um aviso de scripts bloqueados do `esbuild` e do `fsevents`. Podes ignorá-lo.

3. Com o Raycast aberto, importa a extensão:

   ```sh
   npm run dev
   ```

   Espera por `ready - built extension successfully`. Podes deixá-lo a correr (recarrega quando alteras o código) ou
   pará-lo com Ctrl+C: a extensão fica instalada.

4. No Raycast, procura **Clipboard Markdown to PDF**. Para lhe dar um atalho, abre as definições do Raycast (⌘,) →
   Extensions, procura o comando e clica em *Record Hotkey*.

5. Copia um bloco de Markdown e corre o comando. Na primeira vez aparece "Preparing the PDF renderer (first run
   only)…" enquanto compila o renderer (~3 s). Depois o PDF aparece numa shelf do Dropover, fica no clipboard
   (⌘V para o anexar) e fica guardado em `~/Downloads`.

### Atualizar

```sh
cd ~/Developer/raycast-md-to-pdf
git pull
npm install
npm run dev
```

O `npm run dev` volta a instalar a versão nova no Raycast.

### Testar sem abrir o Raycast

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
| After Generating | Pôr numa shelf do Dropover, só copiar, abrir no Preview ou mostrar no Finder | Dropover |

O nome do ficheiro vem da primeira linha do Markdown (por exemplo `# Plano de migração` → `Plano de migração.pdf`).
Se já existir, fica `Plano de migração (2).pdf`.

## Como funciona

1. `marked` converte o Markdown em HTML (GFM: tabelas, listas de tarefas, riscado) e `highlight.js` colore o código.
2. O HTML é escrito num ficheiro temporário e impresso para PDF por `assets/html2pdf.swift`, um programa pequeno que
   usa o **WebKit do macOS** (o mesmo motor do Safari). Por isso o texto fica selecionável, os links funcionam e
   emojis, setas, acentos, CJK e árabe aparecem sem configuração.
3. `Clipboard.copy({ file })` do Raycast coloca o PDF no clipboard, e o serviço do macOS "Add to Dropover" (o mesmo do
   menu Serviços) põe-no numa shelf nova. Abrir o ficheiro com o Dropover (`open -b`) não funciona no Dropover 5.

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
