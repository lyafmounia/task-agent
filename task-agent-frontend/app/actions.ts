// "use server" en haut du fichier : TOUTES les fonctions exportées ici
// sont des Server Actions, exécutées sur le serveur Next.js.
"use server";

// refresh() demande à Next.js de réafficher la page avec des données fraîches.
import { refresh } from "next/cache";

// "@/" est un raccourci vers la racine du projet frontend (configuré dans tsconfig.json)
import { fetchApi } from "@/lib/api";
import { redirect } from "next/navigation";
import { enregistrerJeton, supprimerJeton } from "@/lib/session";

export async function creerTache(formData: FormData) {
  // Lire les champs par leur attribut "name".
  const title = formData.get("title");
  const priorite = Number(formData.get("priorite"));

  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Le titre est obligatoire.");
  }

  await fetchApi("/taches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title.trim(), priorite }),
  });

  // Réafficher la page : la nouvelle tâche apparaît dans la liste.
  refresh();
}

const FORMAT_OBJECT_ID = /^[a-f0-9]{24}$/;

export async function terminerTache(id: string) {
  if (!FORMAT_OBJECT_ID.test(id)) {
    throw new Error("Identifiant de tâche invalide.");
  }
  await fetchApi(`/taches/${id}/terminer`, { method: "PATCH" });
  refresh();
}

// Supprime définitivement une tâche.
export async function supprimerTache(id: string) {
  if (!FORMAT_OBJECT_ID.test(id)) {
    throw new Error("Identifiant de tâche invalide.");
  }  
  await fetchApi(`/taches/${id}`, { method: "DELETE" });
  refresh();
}

// L'état renvoyé par les actions de formulaire : un éventuel message d'erreur.
// Le "| undefined" correspond à l'état initial, avant le premier envoi.
export type EtatFormulaire = { erreur: string } | undefined;

// Demande un jeton à l'API et l'enregistre dans le cookie.
// Fonction interne (non exportée) : partagée par la connexion et l'inscription.
async function seConnecter(email: string, motDePasse: string) {
  const reponse = await fetchApi("/auth/connexion", {
    method: "POST",
    // L'API attend un FORMULAIRE (standard OAuth2), pas du JSON.
    // URLSearchParams l'encode au bon format, et fetch ajoute lui-même
    // l'en-tête Content-Type correspondant.
    body: new URLSearchParams({ username: email, password: motDePasse }),
  });
  const { access_token } = await reponse.json();
  await enregistrerJeton(access_token);
}

// Lit et vérifie les deux champs du formulaire.
function lireIdentifiants(formData: FormData) {
  const email = formData.get("email");
  const motDePasse = formData.get("mot_de_passe");
  if (typeof email !== "string" || typeof motDePasse !== "string") {
    return null;
  }
  return { email, motDePasse };
}

// Utilisée avec useActionState : elle reçoit l'état PRÉCÉDENT en premier
// paramètre (qu'on n'utilise pas, d'où le "_"), puis les champs du formulaire.
export async function connexion(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const identifiants = lireIdentifiants(formData);
  if (!identifiants) {
    return { erreur: "Formulaire invalide." };
  }

  try {
    await seConnecter(identifiants.email, identifiants.motDePasse);
  } catch (erreur) {
    // Au lieu de laisser l'erreur remonter jusqu'à error.tsx, on RENVOIE
    // le message : il s'affichera dans le formulaire.
    return { erreur: erreur instanceof Error ? erreur.message : "Erreur inattendue." };
  }

  // redirect() fonctionne en levant une exception spéciale : il doit être
  // appelé EN DEHORS du try/catch, sinon le catch l'intercepterait.
  redirect("/");
}

export async function inscription(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const identifiants = lireIdentifiants(formData);
  if (!identifiants) {
    return { erreur: "Formulaire invalide." };
  }

  try {
    await fetchApi("/auth/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: identifiants.email,
        mot_de_passe: identifiants.motDePasse,
      }),
    });
    // Compte créé : on connecte directement l'utilisateur.
    await seConnecter(identifiants.email, identifiants.motDePasse);
  } catch (erreur) {
    return { erreur: erreur instanceof Error ? erreur.message : "Erreur inattendue." };
  }

  redirect("/");
}

export async function deconnexion() {
  await supprimerJeton();
  redirect("/connexion");
}