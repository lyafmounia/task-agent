import { cookies } from "next/headers";

export const NOM_COOKIE_JETON = "jeton";
const DUREE_SECONDES = 30 * 60;

// Lit le jeton, ou renvoie undefined si l'utilisateur n'est pas connecté.
export async function lireJeton(): Promise<string | undefined> {
  const magasin = await cookies();
  // ?. : si le cookie n'existe pas, get() renvoie undefined, et on ne
  // cherche pas à lire .value (sinon : erreur).
  return magasin.get(NOM_COOKIE_JETON)?.value;
}

// Enregistre le jeton dans un cookie sécurisé.
// Ne fonctionne que dans une Server Action (ou un "route handler") :
// un composant serveur peut LIRE les cookies, mais pas les MODIFIER.
export async function enregistrerJeton(jeton: string) {
  const magasin = await cookies();
  magasin.set(NOM_COOKIE_JETON, jeton, {
    // Inaccessible au JavaScript de la page
    httpOnly: true,
    // En production, le cookie n'est envoyé que sur une connexion HTTPS.
    secure: process.env.NODE_ENV === "production",
    // Le cookie n'est pas envoyé par les requêtes venant d'autres sites :
    // protection contre les attaques dites CSRF.
    sameSite: "lax",
    // Valable pour tout le site.
    path: "/",
    maxAge: DUREE_SECONDES,
  });
}

// Supprime le cookie : l'utilisateur est déconnecté.
export async function supprimerJeton() {
  const magasin = await cookies();
  magasin.delete(NOM_COOKIE_JETON);
}
