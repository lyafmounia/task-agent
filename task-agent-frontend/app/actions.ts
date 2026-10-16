// "use server" en haut du fichier : TOUTES les fonctions exportées ici
// sont des Server Actions, exécutées sur le serveur Next.js.
"use server";

// refresh() demande à Next.js de réafficher la page avec des données fraîches.
import { refresh } from "next/cache";

// "@/" est un raccourci vers la racine du projet frontend (configuré dans tsconfig.json)
import { fetchApi } from "@/lib/api";


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