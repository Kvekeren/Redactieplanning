export interface Article {
  id: string;
  datum: string | null;
  onderwerp: string;
  url: string | null;
  naam: string;
  status: string;
  categorie: string;
  rerun: boolean;
  opmerkingen: string | null;
  positie: number;
  createdAt: string;
  updatedAt: string;
}

export interface Melding {
  id: string;
  weekStart: string;
  tekst: string;
  createdAt: string;
  updatedAt: string;
}
