import { Suspense } from "react";

import { recupererTaches } from "@/lib/api";
import { FormulaireTache } from "./_components/formulaire-tache";
import { BoutonTerminer } from "./_components/bouton-terminer";
import { BoutonSupprimer } from "./_components/bouton-supprimer";
import { BoutonTheme } from "./_components/bouton-theme";
import { BoutonEnvoi } from "./_components/bouton-envoi";
import { deconnexion } from "./actions";

// Libellé et couleurs de chaque niveau de priorité.
// Record<number, ...> : un objet dont les clés sont des nombres (1, 2, 3).
const PRIORITES: Record<number, { libelle: string; classes: string }> = {
  1: {
    libelle: "Basse",
    classes:
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  },
  2: {
    libelle: "Moyenne",
    classes:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  3: {
    libelle: "Haute",
    classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
};

// Le composant de la page. "export default" indique à Next.js que c'est
// LE composant à afficher pour cette adresse. Il est "async" : c'est un
// composant serveur, qui peut attendre des données avant de s'afficher.
async function ListeTaches() {
  const taches = await recupererTaches();
  const nombreTerminees = taches.filter((tache) => tache.terminee).length;

  return (
    <>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        {nombreTerminees} / {taches.length} tâches terminées
      </p>

      {/* space-y-2 : un espace vertical entre chaque élément de la liste */}
      <ul className="space-y-2">
        {taches.map((tache) => {
          // Récupérer le style de la priorité de cette tâche.
          const priorite = PRIORITES[tache.priorite];

          return (
            <li
              key={tache._id}
              // Une carte : fond blanc, bordure, coins arrondis, espacement.
              // flex + justify-between : contenu à gauche, boutons à droite.
              className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm
              sm:flex-row sm:items-start sm:justify-between sm:gap-4
              dark:border-slate-700 dark:bg-slate-800"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      tache.terminee
                        ? "text-slate-400 line-through dark:text-slate-500"
                        : "font-medium"
                    }
                  >
                    {tache.title}
                  </span>
                  {/* Étiquette de priorité, en forme de pilule (rounded-full) */}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorite.classes}`}
                  >
                    {priorite.libelle}
                  </span>
                </div>
                {tache.description && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {tache.description}
                  </p>
                )}
              </div>

              {/* shrink-0 : les boutons ne rétrécissent jamais,
                  même si le titre est très long. */}
              <div className="flex shrink-0 gap-2">
                {!tache.terminee && <BoutonTerminer id={tache._id} />}
                <BoutonSupprimer id={tache._id} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function Accueil() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mes tâches</h1>
        <BoutonTheme />
      </header>

      <form action={deconnexion}>
        <BoutonEnvoi texte="Déconnexion" variante="secondaire" />
      </form>
      
      <div className="mb-8">
        <FormulaireTache />
      </div>

      {/* Partie dynamique : tant que ListeTaches attend l'API,
          on affiche le "fallback" à sa place. */}
      <Suspense
        fallback={
          <p className="text-slate-500 dark:text-slate-400">
            Chargement des tâches…
          </p>
        }
      >
        <ListeTaches />
      </Suspense>
    </main>
  );
}
