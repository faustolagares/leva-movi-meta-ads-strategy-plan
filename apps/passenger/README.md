# Leva Movi — App Passageiro (Expo / React Native)

Tela de pedir corrida, padrão Apple/Uber, com **Liquid Glass nativo** na camada
de navegação e **Apple Maps** como conteúdo. Primeira superfície do app
passageiro da plataforma (PRD §5, Arquitetura §7).

## O que tem aqui

- `src/screens/RideRequestScreen.tsx` — mapa + controles de vidro flutuantes + sheet.
- `src/components/MapCanvas.tsx` — `react-native-maps` (Apple Maps no iOS), rota e marcadores.
- `src/components/GlassSurface.tsx` — Liquid Glass via `expo-glass-effect`, com fallback `expo-blur`.
- `src/components/RideSheet.tsx` — sheet de opções (material neutro), ícones SF Symbols.
- `src/theme/tokens.ts` — tokens neutros light/dark (acento de marca entra por cima, doc 3).

## Decisões de design (alinhadas à skill Liquid Glass)

- **Conteúdo embaixo, vidro em cima.** O mapa é o conteúdo; só a navegação flutuante é vidro.
- **`clear` sobre o mapa.** Glass `clear` (alta transparência) nos controles sobre mídia.
- **Material neutro no sheet.** Surface de conteúdo usa material, não vidro tintado.
- **SF Symbols reais**, paleta de sistema, San Francisco. Zero cor de marca injetada.

## Como rodar

> O **Liquid Glass real exige iOS 26+** e um **dev build** (não funciona no Expo Go,
> nem no Android — nesses casos cai para o fallback de blur, preservando legibilidade).

```bash
cd apps/passenger
npx expo install        # reconcilia as versões com o SDK
npx expo prebuild       # gera ios/ android/
npx expo run:ios        # simulador/iPhone com iOS 26 para ver o vidro nativo
```

Maps no iOS usa Apple Maps por padrão (`PROVIDER_DEFAULT`) — sem chave. Para Google
Maps/Android, preencha `iosGoogleMapsApiKey`/chave Android em `app.json`.

## Próximos passos

- Ligar o botão "Confirmar" ao módulo `trip` (criar corrida) quando o backend da Fase 3 existir.
- Extrair `GlassSurface`, tokens e ícones para `packages/design-system` (doc 5) quando o monorepo Turborepo for montado (Fase 1).
