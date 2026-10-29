"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

type Choix = "light" | "dark" | "system";

const AFFICHAGE: Record<Choix, { icone: string; libelle: string }> = {
  light: { icone: "☀️", libelle: "Thème clair" },
  dark: { icone: "🌙", libelle: "Thème sombre" },
  system: { icone: "💻", libelle: "Thème du système" },
};

const SUIVANT: Record<Choix, Choix> = {
  light: "dark",
  dark: "system",
  system: "light",
};

// Nom de l'événement émis à chaque changement de thème
const EVENEMENT_THEME = "changement-theme";

// Lit le choix enregistré. Aucune valeur enregistrée = "system"
function lireChoix(): Choix {
  try {
    const valeur = localStorage.getItem("theme");
    return valeur === "light" || valeur === "dark" ? valeur : "system";
  } catch {
    return "system";
  }
}

// Valeur utilisée sur le serveur, qui n'a pas accès à localStorage
function choixServeur(): Choix {
  return "system";
}

// Abonnement : React nous donne une fonction "prevenir", à appeler quand le
// choix change. On l'attache à notre événement
function sAbonner(prevenir: () => void) {
  window.addEventListener(EVENEMENT_THEME, prevenir);
  return () => window.removeEventListener(EVENEMENT_THEME, prevenir);
}

// Applique un choix à la page
function appliquer(choix: Choix) {
  const sombre =
    choix === "dark" ||
    (choix === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", sombre);
}

export function BoutonTheme() {

  const choix = useSyncExternalStore(sAbonner, lireChoix, choixServeur);


  // En développement, le mode strict de React "remonte" les composants une
  // seconde fois pour détecter des bugs, et remet alors à zéro les classes de
  // <html>, effaçant celle ajoutée par le script. On la réapplique ici.
  // useLayoutEffect s'exécute juste avant l'affichage, ce qui évite un flash.
  // En production, cet effet ne change rien : la classe est déjà en place.
  useLayoutEffect(() => {
    appliquer(lireChoix());
  }, []);

  function basculerTheme() {
    const nouveauChoix = SUIVANT[choix];
    try {
      if (nouveauChoix === "system") {
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", nouveauChoix);
      }
    } catch {
      // localStorage indisponible : le thème change sans être mémorisé
    }
    appliquer(nouveauChoix);
    window.dispatchEvent(new Event(EVENEMENT_THEME));
  }

  const { icone, libelle } = AFFICHAGE[choix];

  return (
    <button
      type="button"
      onClick={basculerTheme}
      title={libelle}
      aria-label={libelle}
      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5
          hover:bg-slate-100
          dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
    >
      {icone}
    </button>
  );
}
