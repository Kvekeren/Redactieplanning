export interface Article {
  id: string;
  datum: string;
  onderwerp: string;
  url: string | null;
  naam: string;
  status: string;
  categorie: string;
  opmerkingen: string | null;
  positie: number;
  createdAt: string;
  updatedAt: string;
}
