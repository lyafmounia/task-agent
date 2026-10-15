export type Tache = {
    _id: string;
    title: string;
    description: string | null;
    priorite: number;
    terminee: boolean;
    etiquettes: string[];
  };
  
  // Adresse de l'API, lue dans .env.local.
  export const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";
  
  // Récupère toutes les tâches.
  export async function recupererTaches(): Promise<Tache[]> {
    const reponse = await fetch(`${API_URL}/taches`, { cache: "no-store" });
    if (!reponse.ok) {
      throw new Error(`Erreur de l'API : ${reponse.status}`);
    }
    return reponse.json();
  }