# My TV-Board (Couzan-desu)

Suivi de films, séries et animes : coche tes épisodes, retrouve les prochaines
sorties et consulte tes statistiques.

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Motion · Supabase · TMDB.

## Démarrer

```bash
cp .env.example .env.local   # puis renseigner les trois variables
npm install
npm run dev
```

## Organisation

| Dossier | Rôle |
| --- | --- |
| `app/` | Pages. Les fiches, l'accueil, l'exploration et le calendrier sont rendus côté serveur et mis en cache une heure. |
| `app/api/` | Les seules routes appelées par le navigateur : recherche, filtres, épisodes d'une saison, résumés de titres par lot. |
| `components/` | Interface. `AuthProvider` partage la session, `SeriesTracker` porte toute la logique de suivi d'une série. |
| `lib/tmdb.ts` | Unique point d'accès à TMDB (serveur uniquement). |
| `lib/library.ts` | Lecture paginée des données Supabase de l'utilisateur. |
| `app/globals.css` | Design tokens (couleurs, ombres, courbes d'animation) et classes `.btn`, `.card`, `.glass`, `.chip`, `.field`. |

## Charte graphique

Inspirée d'Apple : fond `#f5f5f7`, texte `#1d1d1f`, accent bleu `#0071e3`,
boutons en pilule, cartes très arrondies sans bordure, barres translucides
floutées et en-têtes sombres plein cadre sur les fiches.

La police est SF Pro (police système) sur les appareils Apple, et Inter
partout ailleurs, chargée par `next/font`. Les animations passent par
`motion` et respectent le réglage « réduire les animations ».

## Base de données attendue (Supabase)

- `user_shows (user_id, tmdb_id, media_type, status)` — unique sur
  `(user_id, tmdb_id, media_type)` ; `status` ∈ `a_voir`, `en_cours`,
  `termine`, `abandonne`.
- `watched_episodes (user_id, tmdb_id, season_number, episode_number)` — unique
  sur ces quatre colonnes.

Toutes les lectures et écritures passent par la clé publique depuis le
navigateur : les deux tables doivent avoir la **Row Level Security** activée,
avec des règles limitant chaque ligne à `auth.uid() = user_id`.

## Vérifications

```bash
npm run lint
npx tsc --noEmit
npm run build
```
