// Composant serveur (pas de "use client") : un formulaire relié à une
// Server Action fonctionne même si le JavaScript du navigateur n'est
// pas encore chargé. C'est ce qu'on appelle l'amélioration progressive.
import { creerTache } from "../actions";
import { BoutonEnvoi } from "./bouton-envoi";

export function FormulaireTache() {
  return (
    // action={creerTache} : à l'envoi du formulaire, Next.js appelle
    // la Server Action avec les valeurs des champs.
    <form className="flex flex-col gap-2 sm:flex-row" action={creerTache}>
      <input
        name="title"
        placeholder="Nouvelle tâche"
        required
        className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2
      focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200
      dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-indigo-900"
      />

      <select
        name="priorite"
        defaultValue="1"
        className="rounded-md border border-slate-300 bg-white px-2 py-2
        dark:border-slate-600 dark:bg-slate-800"
      >
        <option value="1">Basse</option>
        <option value="2">Moyenne</option>
        <option value="3">Haute</option>
      </select>

      <BoutonEnvoi texte="Ajouter" />
    </form>
  );
}
