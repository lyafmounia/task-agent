"use client";

import { useFormStatus } from "react-dom";

export function BoutonEnvoi({ texte }: { texte: string }) {
    // pending vaut true tant que la Server Action du formulaire s'exécute.
    const { pending } = useFormStatus();
  
    return (
      // disabled empêche un second clic pendant l'envoi.
      // Pendant l'envoi on affiche "…", sinon le texte normal.
      <button type="submit" disabled={pending}>
        {pending ? "…" : texte}
      </button>
    );
  }