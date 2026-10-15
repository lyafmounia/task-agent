"use client";

// Le composant reçoit deux "props" (paramètres) de Next.js :
// - error : l'erreur qui s'est produite ;
// - retry : une fonction qui recharge les données et réaffiche la page.
// La partie après les deux-points décrit leur type.
export default function Erreur({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main>
      <h1>Mes tâches</h1>
      <p>Impossible de charger les tâches pour le moment.</p>

      <p>Détail : {error.message}</p>

      {/* onClick : la fonction exécutée au clic. "() => retry()" est une
          petite fonction sans paramètre qui appelle retry. */}
      <button onClick={() => retry()}>Réessayer</button>
    </main>
  );
}