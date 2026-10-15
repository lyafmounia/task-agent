// Composant serveur (pas de "use client") : un formulaire relié à une
// Server Action fonctionne même si le JavaScript du navigateur n'est
// pas encore chargé. C'est ce qu'on appelle l'amélioration progressive.
import { creerTache } from "../actions";
import { BoutonEnvoi } from "./bouton-envoi";


export function FormulaireTache() {
  return (
    // action={creerTache} : à l'envoi du formulaire, Next.js appelle
    // la Server Action avec les valeurs des champs.
    <form action={creerTache}>

      <input name="title" placeholder="Nouvelle tâche" required />

      <select name="priorite" defaultValue="1">
        <option value="1">Basse</option>
        <option value="2">Moyenne</option>
        <option value="3">Haute</option>
      </select>

      <BoutonEnvoi texte="Ajouter" />
    </form>
  );
}