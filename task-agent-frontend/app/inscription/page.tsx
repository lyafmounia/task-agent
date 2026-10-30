import Link from "next/link";

import { inscription } from "../actions";
import { FormulaireAuth } from "../_components/formulaire-auth";

export default function PageInscription() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Créer un compte</h1>
      <FormulaireAuth action={inscription} texteBouton="Créer mon compte" nouveauCompte />
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-indigo-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}