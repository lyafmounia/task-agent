import { Suspense } from "react";

import { recupererTaches } from "@/lib/api";
import { FormulaireTache } from "./_components/formulaire-tache";
import { BoutonTerminer } from "./_components/bouton-terminer"
import { BoutonSupprimer } from "./_components/bouton-supprimer";

// Le composant de la page. "export default" indique à Next.js que c'est
// LE composant à afficher pour cette adresse. Il est "async" : c'est un
// composant serveur, qui peut attendre des données avant de s'afficher.
async function ListeTaches() {
  // Récupérer les tâches avant de construire la page.
  const taches = await recupererTaches();

  const nbTachesTerminees = taches.filter((tache) => tache.terminee).length;

  return (
    <>
      <p>{nbTachesTerminees} / {taches.length} tâches terminées</p>

      <ul>
        {taches.map((tache) => (
          // "key" est un identifiant unique, obligatoire dans une liste :
          <li key={tache._id}>
            {tache.terminee ? "✅" : "⬜"} {tache.title} (priorité {tache.priorite})
            {!tache.terminee && <BoutonTerminer id={tache._id} />}
            <BoutonSupprimer id={tache._id} />
            {tache.description && <p>{tache.description}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function Accueil() {
  return (
    <main>
      <h1>Mes tâches</h1>

      <FormulaireTache />

      {/* Partie dynamique : tant que ListeTaches attend l'API,
          on affiche le "fallback" à sa place. */}
      <Suspense fallback={<p>Chargement des tâches…</p>}>
        <ListeTaches />
      </Suspense>
    </main>
  );
}