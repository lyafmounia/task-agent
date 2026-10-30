import { NextResponse, type NextRequest } from "next/server";

import { NOM_COOKIE_JETON } from "./lib/session";

const PAGES_PUBLIQUES = ["/connexion", "/inscription"];

export function proxy(requete: NextRequest) {
  const estPublique = PAGES_PUBLIQUES.includes(requete.nextUrl.pathname);
  const aUnJeton = requete.cookies.has(NOM_COOKIE_JETON);

  // Pas de jeton et page protégée : direction la page de connexion.
  if (!aUnJeton && !estPublique) {
    return NextResponse.redirect(new URL("/connexion", requete.url));
  }

  // Sinon, laisser passer la requête.
  return NextResponse.next();
}

// Sur quelles adresses le proxy s'exécute : toutes, SAUF les fichiers
// techniques de Next.js (JavaScript, CSS, images) et l'icône du site.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};