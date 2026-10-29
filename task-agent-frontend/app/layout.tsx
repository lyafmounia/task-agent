import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task agent",
  description: "Gestionnaire de tâches avec FastAPI, MongoDB et Next.js",
};

// Script exécuté par le navigateur PENDANT la lecture du HTML, avant le premier
// affichage. Il décide du thème :
// - "dark" enregistré dans localStorage → mode sombre ;
// - aucun choix enregistré → on suit le réglage du système (matchMedia) ;
// - sinon → mode clair (on n'ajoute rien).
// try/catch : localStorage peut être indisponible (navigation privée stricte...),
// la page doit alors simplement s'afficher en clair, sans planter.
// (function(){ ... })() exécute la fonction immédiatement, sans créer de
// variables globales qui pourraient entrer en conflit avec d'autres scripts.
const SCRIPT_THEME = `(function(){try{
  var choix = localStorage.getItem("theme");
  var sombre = choix === "dark" ||
    (choix === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (sombre) document.documentElement.classList.add("dark");
}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* dangerouslySetInnerHTML insère le texte tel quel dans la balise.
            Son nom rappelle que c'est dangereux avec un texte venant de
            l'utilisateur (risque d'injection de code). Ici, le script est
            un texte fixe écrit par nous : aucun risque. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      </head>
      <body className="bg-slate-50 text-slate-800 scheme-light-dark
    dark:bg-slate-900 dark:text-slate-100">{children}</body>
    </html>
  );
}
