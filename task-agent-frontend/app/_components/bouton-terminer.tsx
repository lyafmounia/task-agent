import { terminerTache } from "../actions";
import { BoutonEnvoi } from "./bouton-envoi";

export function BoutonTerminer({ id }: { id: string }) {
  // Un formulaire appelle sa Server Action avec ses champs (FormData),
  // mais terminerTache attend un identifiant. .bind(null, id) crée une
  // nouvelle fonction où le premier paramètre est déjà fixé à "id".

  const terminerCetteTache = terminerTache.bind(null, id);

  return (
    <form action={terminerCetteTache}>
      <BoutonEnvoi texte="Terminer" variante="secondaire"/>
    </form>
  );
}