# MVP Plan: Redactieplanning Webapp

## Doel
Vervanging van de Excel-redactieplanning door een gebruiksvriendelijke webapp met drag-and-drop, vergelijkbare visuele opzet, en expliciete opslag (geen realtime).

## Technische keuzes

### Stack
- **Next.js 14** (App Router) – Vercel-optimized, server components waar nuttig
- **Prisma** – ORM voor type-safe database access
- **SQLite** (lokaal) / **Neon Postgres** (Vercel) – zelfde Prisma-schema, wissel via `DATABASE_URL`
- **@dnd-kit/core** – moderne, toegankelijke drag-and-drop
- **Tailwind CSS** – snelle, consistente styling

### Datamodel

```
Article
├── id          string (cuid)
├── datum       date      -- publicatiedatum
├── onderwerp   string    -- hoofdinhoud kaart
├── wie         string    -- auteur/verantwoordelijke
├── categorie   string    -- bv. Tuinklussen, Moestuin, Kweken
├── opmerkingen string?   -- notities per kaart
├── positie     int       -- volgorde binnen een dag (voor sortering)
├── createdAt   datetime
└── updatedAt   datetime
```

### UI-structuur

1. **Weekweergave** – horizontale kolommen per dag (ma–zo), navigeerbaar met vorige/volgende week
2. **Dagkolommen** – elke kolom is een drop zone met kaarten
3. **Artikelkaarten** – compacte kaarten met Onderwerp (groot), Wie en Categorie (klein)
4. **Detailpaneel** – zijpaneel (niet modal) voor bewerken: Onderwerp, Datum, Wie, Categorie, Opmerkingen
5. **Save-bar** – vaste balk onderaan wanneer er niet-opgeslagen wijzigingen zijn, met “Opslaan”-knop

### State & Opslaan

- **Client state**: alle artikelen in React state, wijzigingen direct zichtbaar
- **Dirty flag**: bij elke wijziging (drag, edit) → `hasUnsavedChanges = true`
- **Save flow**: knop “Wijzigingen opslaan” → POST naar API → batch update → `hasUnsavedChanges = false`
- **Feedback**: toast of inline melding bij succes/fout
- **beforeunload**: waarschuwing bij sluiten met onopgeslagen wijzigingen

### Componenten

```
app/
├── page.tsx              # Hoofdpagina, laadt planning
├── layout.tsx
└── api/
    └── articles/
        └── route.ts      # GET (alle), POST (batch update)

components/
├── PlanningView.tsx      # Hoofdcontainer, state, save-logica
├── WeekNavigator.tsx     # Vorige/volgende week, datumweergave
├── DayColumn.tsx        # Drop zone voor één dag
├── ArticleCard.tsx      # Draggable kaart
├── ArticleDetailPanel.tsx # Zijpaneel voor bewerken
└── SaveBar.tsx          # Balk met opslaan-knop
```

### Categorieën & Wie (uit Excel)

- **Categorieën**: Tuinklussen, Moestuin, Kweken, Kamerplanten, Snoeien, Inspiratie, Biodiversiteit, Hub, Partnerbijdrage, TV-pagina, RERUN, …
- **Wie**: LC*, ID*, HK*, GJ*, KE*, … (initials + optioneel *)

Geen vaste dropdowns in MVP; vrije tekst met suggesties (optioneel later).

## Niet in MVP

- Realtime samenwerking
- Rechten/rollen
- Notificaties
- Activity feed
- Uitgebreide versiegeschiedenis
- Complexe comment-threads

## Volgorde van bouwen

1. Next.js project + dependencies
2. Prisma schema + SQLite + seed script (Excel-import)
3. API routes (GET, POST batch)
4. PlanningView + WeekNavigator + DayColumn (zonder drag)
5. ArticleCard + drag-and-drop
6. ArticleDetailPanel
7. SaveBar + dirty state + beforeunload
