# ¡Siguiente Paciente!

Juego de guardia veterinaria para celular, de Petsys. Llegan pacientes con su dueño, leés la ficha, elegís el diagnóstico y arrastrás al paciente a la sala correcta antes de que se termine el turno.

## Stack

- React + Vite + TypeScript
- Vercel para el deploy
- Supabase para casos y ranking. Sin las variables de entorno el juego usa los casos de `src/game/cases.ts` y un ranking de ejemplo en `localStorage`

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase (opcional)
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
  lib/
    supabase.ts  cliente REST mínimo (sin supabase-js)
    content.ts   carga los casos activos desde Supabase
    scores.ts    guardar turno y leer ranking
supabase/
  migrations/    tablas `cases` y `scores`, funciones `submit_score` y `top_scores`, casos iniciales
```

## Supabase

Proyecto: vetsafe. Las migraciones de `supabase/migrations/` ya están aplicadas ahí; para un proyecto nuevo, correrlas en orden (SQL Editor o `supabase db push`).

- `cases`: lectura pública de los casos con `active = true`. Para sumar un caso, insertá una fila desde el panel; el primer elemento de `diagnoses` es el correcto (se mezclan al mostrarse). Para sacarlo, `active = false`. Cada cuarto paciente sale de los casos con `rare = true`. `pet` tiene que ser uno de los sprites de `src/game/sprites.ts`.
- `scores`: sin acceso directo. El juego guarda con `submit_score()` (valida datos, puntos múltiplos de 100 y no más de 300 por paciente atendido, y un guardado cada 30 s por jugador) y lee con `top_scores()` (mejor turno de cada jugador, identificado por su Instagram o, si no puso, por nombre + veterinaria).

Los casos de `src/game/cases.ts` quedan como respaldo si Supabase no responde.

## Deploy en Vercel

Vercel detecta Vite solo: build `npm run build`, salida `dist`. Cargar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Settings > Environment Variables (Production y Preview) y volver a desplegar.
