// "use server" en haut du fichier : TOUTES les fonctions exportées ici
// sont des Server Actions, exécutées sur le serveur Next.js.
"use server";

// refresh() demande à Next.js de réafficher la page avec des données fraîches.
import { refresh } from "next/cache";

// "@/" est un raccourci vers la racine du projet frontend (configuré dans
// tsconfig.json) : "@/lib/api" désigne le fichier frontend/lib/api.ts.
import { API_URL } from "@/lib/api";

// Appelée par le formulaire. Next.js lui transmet automatiquement
// les champs du formulaire dans un objet FormData.
export async function creerTache(formData: FormData) {
  // Lire les champs par leur attribut "name".
  const title = formData.get("title");
  const priorite = Number(formData.get("priorite"));

  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Le titre est obligatoire.");
  }

  // Envoyer la tâche à l'API
  const reponse = await fetch(`${API_URL}/taches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({ title: title.trim(), priorite }),
  });

  // Si l'API refuse (422 par exemple), on remonte l'erreur :
  // elle sera affichée par error.tsx.
  if (!reponse.ok) {
    throw new Error(`Erreur de l'API : ${reponse.status}`);
  }

  // Réafficher la page : la nouvelle tâche apparaît dans la liste.
  refresh();
}