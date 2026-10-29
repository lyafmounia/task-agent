import { supprimerTache } from "../actions";
import { BoutonEnvoi } from "./bouton-envoi";

export function BoutonSupprimer({ id }: { id: string }) {

  // Fixer l'identifiant de cette tâche comme premier paramètre de l'action.
  const supprimerCetteTache = supprimerTache.bind(null, id);

  return (
    <form action={supprimerCetteTache}>
      <BoutonEnvoi texte="Supprimer" variante="danger" />
    </form>
  );
}