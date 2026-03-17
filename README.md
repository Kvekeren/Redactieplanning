# Redactieplanning

Webapp voor de redactieplanning van een tuinierwebsite. Vervangt de Excel-planning met een gebruiksvriendelijke interface met drag-and-drop.

## Functies

- **Weekweergave** – Kalenderachtige planning met kolommen per dag (ma–zo)
- **Artikelkaarten** – Onderwerp, Wie en Categorie per kaart
- **Drag-and-drop** – Kaarten verslepen naar een andere datum
- **Detailpaneel** – Klik op een kaart om Onderwerp, Datum, Wie, Categorie en Opmerkingen te bewerken
- **Opslaan** – Wijzigingen worden pas opgeslagen na klik op "Wijzigingen opslaan"
- **Waarschuwing** – Bij sluiten met onopgeslagen wijzigingen

## Ontwikkeling

### Vereisten

- Node.js 18+
- npm

### Installatie

```bash
npm install
```

### Database

De app gebruikt SQLite lokaal. De database wordt automatisch aangemaakt bij de eerste migratie.

```bash
# Migratie uitvoeren (indien nodig)
npx prisma migrate dev

# Data importeren uit Excel
npm run seed
```

Zorg dat `redactieplanning.xlsx` in de projectmap staat voor de seed.

### Starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database-URL

Voor lokaal gebruik staat in `.env`:

```
DATABASE_URL="file:./prisma/dev.db"
```

Voor Vercel/Neon (Postgres) stel je `DATABASE_URL` in op een connection string:

```
DATABASE_URL="postgresql://..."
```

## Deployment (Vercel)

1. Maak een Neon (of andere Postgres) database aan
2. Stel `DATABASE_URL` in als environment variable
3. Pas het Prisma schema aan: `provider = "postgresql"` en voeg `url = env("DATABASE_URL")` toe (voor Prisma 7: zie configuratie in `prisma.config.ts`)
4. Deploy naar Vercel

**Let op:** SQLite werkt niet op Vercel serverless. Gebruik Postgres voor productie.

## Projectstructuur

```
app/
  api/articles/route.ts   # GET / POST API
  page.tsx
  layout.tsx
components/
  ArticleCard.tsx         # Draggable kaart
  ArticleDetailPanel.tsx  # Zijpaneel voor bewerken
  DayColumn.tsx          # Drop zone per dag
  PlanningView.tsx        # Hoofdcontainer
  SaveBar.tsx            # Opslaan-balk
  WeekNavigator.tsx      # Week navigatie
lib/
  prisma.ts              # Prisma client
  types.ts               # TypeScript types
prisma/
  schema.prisma          # Datamodel
scripts/
  seed-from-excel.js     # Excel import
```

## Licentie

Privé / intern gebruik.
