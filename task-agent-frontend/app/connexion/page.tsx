import Link from "next/link";

import { connexion } from "../actions";
import { FormulaireAuth } from "../_components/formulaire-auth";

export default function PageConnexion() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Connexion</h1>
      {/* Un composant serveur peut transmettre une Server Action
          à un composant client, comme une simple fonction. */}
      <FormulaireAuth action={connexion} texteBouton="Se connecter" />
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Pas encore de compte ?{" "}
        {/* Link : un lien interne de Next.js. Il charge la page sans
            recharger tout le site, ce qui est plus rapide qu'un <a>. */}
        <Link href="/inscription" className="text-indigo-600 hover:underline">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}