# Maskan — Project Overview

Objectif: fournir une description synthétique et les décisions techniques clés pour toute personne qui découvre le projet.

1) Ce que propose Maskan
- Plateforme de location entre particuliers (guest/host) adaptée au marché tunisien.
- Fonctionnalités principales: découverte de biens, réservation, paiements (card/cash), QR check-in, KYC (email OTP + documents), messagerie temps-réel, administration et modération.

2) Pourquoi ce design
- Séparation des responsabilités (SPA frontend + API backend) pour scalabilité et maintenabilité.
- Stateless security (JWT) pour faciliter intégration et montée en charge.
- MongoDB choisi pour la flexibilité des documents (listings, verifications, messages).

3) Où commencer (contribution / démonstration)
- Lancer MongoDB local (ou via Docker), démarrer Backend puis Frontend.
- Voir `ARCHITECTURE.md` pour la vue globale et `MASKAN_TECHNICAL_ANALYSIS.md` pour les détails techniques approfondis.

4) Composants importants
- `Frontend/`: UI, logique client, appels API, routes.
- `Backend/`: API REST, sécurité, services métier, persistance.
- `Backend/uploads/`: stockage local des documents et images.

5) Demandes courantes
- Vous voulez une démo locale ? Je peux générer un `docker-compose.yml` pour lancer MongoDB + backend + frontend.
- Vous voulez déployer ? Documenter les variables d'environnement (SMTP, JWT keys, Stripe, Twilio) est la prochaine priorité.
