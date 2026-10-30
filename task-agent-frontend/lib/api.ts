import { redirect } from "next/navigation";
import { lireJeton } from "./session";
import { headers } from "next/headers";

const API_KEY = process.env.API_KEY ?? "cle-de-developpement";

export type Tache = {
  _id: string;
  title: string;
  description: string | null;
  priorite: number;
  terminee: boolean;
  etiquettes: string[];
};

export const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

// Appelle l'API FastAPI et vérifie la réponse.
// - chemin : la fin de l'adresse, par exemple "/taches" ;
// - options : la méthode, le corps, les en-têtes... (facultatif, d'où le "?").
// RequestInit est le type TypeScript qui décrit les options acceptées par fetch.
// Renvoie la réponse si tout va bien, lève une erreur explicite sinon.
export async function fetchApi(
  path: string,
  options?: RequestInit
): Promise<Response> {
  // Le jeton de l'utilisateur connecté, s'il y en a un.
  const jeton = await lireJeton();

  // L'adresse du visiteur, telle que Next.js l'a reçue. En développement, cet
  // en-tête peut être absent : on ne transmet alors rien, et l'API utilisera
  // l'adresse du serveur Next.js.
  const adresseVisiteur = (await headers()).get("x-forwarded-for");

  // "...options" recopie toutes les options reçues dans ce nouvel objet
  const reponse = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...options?.headers,
      "X-Api-Key": API_KEY,
      // on ajoute authorization seulement si on a un jeton
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      ...(adresseVisiteur ? { "X-Forwarded-For": adresseVisiteur } : {}),
    },
  });

  if (reponse.status === 401 && !path.startsWith("/auth/")) {
    // redirect() interrompt tout et envoie le navigateur vers /connexion.
    redirect("/connexion");
  }
  // Code entre 200 et 299 : tout va bien, on renvoie la réponse telle quelle.
  if (reponse.ok) {
    return reponse;
  }

  let detail = reponse.statusText;

  try {
    const body = await reponse.json();

    if (typeof body.detail === "string") {
      // Cas des HTTPException : {"detail": "Tâche introuvable"}
      detail = body.detail;
    } else if (Array.isArray(body.detail)) {
      // Cas des erreurs 422 de Pydantic : {"detail": [{"msg": "..."}, ...]}
      // On assemble tous les messages, séparés par des virgules.
      detail = body.detail
        .map((erreur: { msg: string }) => erreur.msg)
        .join(", ");
    }
  } catch {
    // Corps illisible : on garde le détail par défaut.
  }

  throw new Error(`Erreur de l'API (${reponse.status}) : ${detail}`);
}

// Récupère toutes les tâches.
export async function recupererTaches(): Promise<Tache[]> {
  const reponse = await fetchApi("/taches");
  return reponse.json();
}
