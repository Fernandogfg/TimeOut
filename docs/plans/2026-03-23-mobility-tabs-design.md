# Design: Abas de Mobilidade e Principal

**Data:** 2026-03-23
**Status:** Aprovado

## Problema

Atualmente os exercícios de mobilidade ficam em um accordion colapsável (`MobilitySection`) acima dos exercícios principais na tela de visualização do dia (`WorkoutDay`), e em outro accordion (`MobilityCollapse`) no rodapé da tela de execução (`WorkoutExecution`). Essa separação visual é fraca — o usuário precisa expandir ativamente para ver a mobilidade, e os dois tipos de exercício competem pelo mesmo espaço de scroll.

## Solução

Adicionar abas **Principal** e **Mobilidade** nas duas telas, separando claramente os conteúdos.

## Abordagem escolhida

**Tab toggle simples** com estado `activeTab: 'main' | 'mobility'`. Sem dependências novas, compatível com o design dark/Tailwind existente.

## Design por tela

### WorkoutDay (visualização/planejamento)

- Duas abas abaixo do header: **Principal** e **Mobilidade**
- Aba ativa: texto branco + underline verde
- Aba inativa: texto cinza, sem underline
- Aba Principal: lista de exercícios principais (comportamento atual) + botão "Iniciar Treino" fixo no rodapé
- Aba Mobilidade: lista de exercícios de mobilidade via `ExerciseCard` (com suporte a edição)
- Botão "Iniciar Treino" só aparece quando aba Principal está ativa
- `MobilitySection` (accordion) é removido

### WorkoutExecution (execução)

- Mesmas duas abas, posicionadas abaixo do timer e da barra de progresso
- Aba Principal: idêntica ao comportamento atual (rows interativas com `SetCounter` e `RestTimer`)
- Aba Mobilidade: lista read-only simples — nome, séries × reps, carga, descrição se houver. Sem contador, sem timer.
- `MobilityCollapse` (accordion no rodapé) é removido
- Barra de progresso e contador `X/Y completos` contam apenas exercícios principais, independente da aba ativa

## Componente compartilhado: `TabBar`

```tsx
interface TabBarProps {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}
```

Reutilizado nas duas telas para manter consistência visual.

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/components/TabBar.tsx` | **Novo** — componente de abas reutilizável |
| `src/pages/WorkoutDay.tsx` | Adiciona estado `activeTab`, substitui `MobilitySection` por abas |
| `src/pages/WorkoutExecution.tsx` | Adiciona estado `activeTab`, substitui `MobilityCollapse` por abas |
| `src/components/MobilitySection.tsx` | **Removido** (absorvido pelas abas) |

## Sem mudanças em

- Schema do banco (`db/schema.ts`) — tipos `main`/`mobility` permanecem
- Lógica de execução (`workoutSession` store) — só exercícios principais são rastreados
- Formato de importação/exportação JSON
