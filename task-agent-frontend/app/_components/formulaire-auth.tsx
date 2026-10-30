"use client";

import { useActionState } from "react";
import type { EtatFormulaire } from "../actions";

type ActionAuth = (
  etat: EtatFormulaire,
  formData: FormData
) => Promise<EtatFormulaire>;

export function FormulaireAuth({
  action,
  texteBouton,
  nouveauCompte = false,
}: {
  action: ActionAuth;
  texteBouton: string;
  nouveauCompte?: boolean;
}) {
  // useActionState relie le formulaire à l'action, et renvoie :
  // - etat : le dernier état renvoyé par l'action (ici, l'éventuelle erreur) ;
  // - actionFormulaire : à passer au <form> ;
  // - enCours : true pendant l'exécution de l'action.
  // undefined : l'état initial, avant le premier envoi.
  const [etat, actionFormulaire, enCours] = useActionState(action, undefined);

  // Classes communes aux deux champs.
  const classesChamp =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 " +
    "dark:border-slate-600 dark:bg-slate-800";

  return (
    <form action={actionFormulaire} className="flex flex-col gap-3">
      <input
        type="email"
        name="email"
        placeholder="E-mail"
        required
        // Aide le navigateur et les gestionnaires de mots de passe
        // à remplir automatiquement ce champ.
        autoComplete="email"
        className={classesChamp}
      />
      <input
        type="password"
        name="mot_de_passe"
        placeholder="Mot de passe"
        required
        minLength={8}
        // "new-password" : le gestionnaire de mots de passe propose d'en
        // générer un ; "current-password" : il propose celui enregistré.
        autoComplete={nouveauCompte ? "new-password" : "current-password"}
        className={classesChamp}
      />

      {/* Message d'erreur renvoyé par l'action, s'il y en a un.
            role="alert" : les lecteurs d'écran l'annoncent immédiatement. */}
      {etat?.erreur && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {etat.erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="rounded-md bg-indigo-600 px-3 py-2 font-medium text-white
            hover:bg-indigo-700 disabled:opacity-50"
      >
        {enCours ? "…" : texteBouton}
      </button>
    </form>
  );
}
