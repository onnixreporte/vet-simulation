# ¡Siguiente Paciente!

Juego de guardia veterinaria para celular, de Petsys. Llegan pacientes con su dueño, leés la ficha, elegís el diagnóstico y arrastrás al paciente a la sala correcta antes de que se termine el turno.

## Stack

- React + Vite + TypeScript
- Vercel para el deploy
- Supabase para casos y ranking (pendiente; hoy los casos están en `src/game/cases.ts` y el ranking usa datos de ejemplo + `localStorage`)

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # chequeo de tipos + build de producción en dist/
npm run lint
```

## Estructura

```
src/
  game/
    sprites.ts   pixel art (personajes, animales, íconos) definido como texto
    draw.ts      dibujo de la clínica y la fachada sobre canvas (192x256 px lógicos)
    cases.ts     casos clínicos y salas
    engine.ts    lógica del juego: cola de pacientes, tiempo, puntos, arrastrar y soltar
  components/    pantallas: Menu, Register, Intro, Game, Ranking
  lib/           tipos del jugador y guardado de puntajes
```

Para sumar un caso, agregalo a `CASES` en `src/game/cases.ts`. El primer diagnóstico de `dx` es el correcto y se mezclan al mostrarse.

## Deploy en Vercel

Vercel detecta Vite solo: build `npm run build`, salida `dist`.
