# Plano de migração para a API de faturação v2

Este documento resume o plano acordado, os riscos identificados e os próximos passos. ✅ **Estado:** em revisão — falta confirmar a janela de manutenção com a equipa de operações.

## 1. Contexto

A API atual (`v1`) devolve valores monetários como *strings* e não suporta *idempotency keys*, o que obriga a lógica defensiva em todos os clientes. A `v2` resolve isto, mas muda o formato dos erros → ver a secção de riscos. Acentuação para testar o tipo de letra: ação, coração, programação, óptimo, pão, você, à, ü, ñ, ç. Setas e símbolos: → ← ↔ ≥ ≤ ≠ ✓ ✗ • … «aspas» “curvas” — travessão. Emoji: 🚀 ⚠️ 🔴 🟠 🟢.

### Objetivos

- Migrar **100%** dos clientes internos até ao fim do trimestre
- Manter a `v1` ativa durante 60 dias (*deprecation window*)
  - Avisar os parceiros por email e no changelog
  - Medir o tráfego residual por cliente
- ~~Reescrever o SDK à mão~~ → gerar o cliente a partir do OpenAPI

### Passos

1. Congelar alterações na `v1`
2. Publicar a `v2` em *staging*
3. Migrar os clientes por ondas:
   1. Serviços internos
   2. Parceiros piloto
   3. Restantes parceiros
4. Desligar a `v1`

## 2. Comparação v1 vs v2

| Aspeto | v1 | v2 | Impacto |
|---|---|---|:---:|
| Valores monetários | `string` | `integer` (cêntimos) | 🔴 alto |
| Erros | `{ "error": "..." }` | RFC 9457 (`application/problem+json`) | 🟠 médio |
| Idempotência | ❌ | ✅ `Idempotency-Key` | 🟢 baixo |
| Paginação | *offset* | *cursor* | 🟠 médio |
| Autenticação | API key | OAuth 2.0 (client credentials) | 🟠 médio |

> **Nota:** a tabela cobre apenas os *breaking changes*. A lista completa está no [changelog da v2](https://example.com/changelog).
> Segunda linha da citação, para testar quebras de linha.

## 3. Exemplos de código

TypeScript:

```ts
type Money = { amount: number; currency: "EUR" | "USD" };

export async function createInvoice(client: ApiClient, draft: InvoiceDraft): Promise<Invoice> {
  const res = await client.post("/v2/invoices", draft, {
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
  if (!res.ok) throw new ApiError(await res.json()); // problem+json
  return res.json();
}
```

Shell:

```bash
# Ver o tráfego residual da v1 por cliente (últimos 7 dias)
curl -s "https://metrics.example.com/api/v1-traffic?days=7" \
  | jq -r '.clients[] | "\(.name)\t\(.requests)"' \
  | sort -k2 -nr | head -20
```

JSON:

```json
{ "type": "https://example.com/problems/out-of-credit", "status": 402, "detail": "Saldo insuficiente.", "balance": 3050 }
```

Diff:

```diff
- const total = parseFloat(invoice.total);
+ const total = invoice.total / 100;
```

Sem linguagem (árvore de ficheiros):

```
src/
├── api/
│   ├── v1/      ← a remover
│   └── v2/
└── clients/
```

## 4. Clientes por onda

| # | Cliente | Onda | Responsável | Estado |
|--:|---|:---:|---|---|
| 1 | Portal interno | 1 | Equipa Plataforma | ✅ migrado |
| 2 | Backoffice | 1 | Equipa Plataforma | ✅ migrado |
| 3 | App móvel | 1 | Equipa Mobile | 🟠 em curso |
| 4 | Relatórios BI | 1 | Equipa Dados | 🟠 em curso |
| 5 | Parceiro Alfa | 2 | Contas | ⏳ agendado |
| 6 | Parceiro Beta | 2 | Contas | ⏳ agendado |
| 7 | Parceiro Gama | 2 | Contas | ⏳ agendado |
| 8 | Parceiro Delta | 3 | Contas | ⏳ por agendar |
| 9 | Parceiro Épsilon | 3 | Contas | ⏳ por agendar |
| 10 | Parceiro Zeta | 3 | Contas | ⏳ por agendar |
| 11 | Parceiro Eta | 3 | Contas | ⏳ por agendar |
| 12 | Parceiro Teta | 3 | Contas | ⏳ por agendar |
| 13 | Parceiro Iota | 3 | Contas | ⏳ por agendar |
| 14 | Parceiro Capa | 3 | Contas | ⏳ por agendar |
| 15 | Parceiro Lambda | 3 | Contas | ⏳ por agendar |
| 16 | Parceiro Mi | 3 | Contas | ⏳ por agendar |
| 17 | Parceiro Ni | 3 | Contas | ⏳ por agendar |
| 18 | Parceiro Xi | 3 | Contas | ⏳ por agendar |
| 19 | Parceiro Ómicron | 3 | Contas | ⏳ por agendar |
| 20 | Parceiro Pi | 3 | Contas | ⏳ por agendar |

## 5. Riscos

**Formato dos erros.** Os clientes que fazem *parsing* de `error` como texto vão deixar de mostrar mensagens úteis. Mitigação: a camada de compatibilidade do SDK traduz `problem+json` para o formato antigo durante a janela de depreciação. Este parágrafo é propositadamente longo para ocupar várias linhas e permitir ver como o texto corrido quebra e justifica dentro da largura útil da página, com a pontuação, os acentos e as hifenizações habituais em português europeu.

**Paginação por cursor.** Quem assume que `page=N` é estável vai perder registos se houver inserções entre pedidos. Mitigação: documentar o novo comportamento e disponibilizar um exemplo de iteração completo no guia de migração.

**Janela de manutenção.** Ainda não está confirmada; sem ela, a onda 3 não pode arrancar. Dono: operações.

## 6. Próximos passos

- [x] Aprovar o plano com a direção
- [x] Congelar alterações na `v1`
- [ ] Confirmar a janela de manutenção
- [ ] Preparar o comunicado aos parceiros
- [ ] Gerar o cliente a partir do OpenAPI

---

*Gerado a partir de uma resposta de um agente — exemplo para testar a conversão.*
