"use client";

import { useFormStatus } from "react-dom";

type Variante = "principal" | "secondaire" | "danger";

// Les classes Tailwind de chaque variante.
// Record<Variante, string> : un objet dont les clés sont les variantes
// et les valeurs des textes (équivalent d'un dict[str, str] en Python).
const STYLES: Record<Variante, string> = {
  principal: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondaire: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 " +
    "dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700",
  danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50 " +
  "dark:bg-slate-800 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/40",
};


export function BoutonEnvoi({ texte, variante = "principal" }: { texte: string; variante?: Variante; }) {
  // pending vaut true tant que la Server Action du formulaire s'exécute.
  const { pending } = useFormStatus();

  return (
    // disabled empêche un second clic pendant l'envoi.
    // Pendant l'envoi on affiche "…", sinon le texte normal.
    <button type="submit"
      disabled={pending}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors
        disabled:cursor-wait disabled:opacity-50 ${STYLES[variante]}`}
    >
      {pending ? "…" : texte}
    </button>
  );
}