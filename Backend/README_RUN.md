# Backend — Run & Dev Notes

Emplacement: `Backend/` — application Spring Boot 3.2 (Java 17) + MongoDB.

Prérequis
- Java 17 installed
- Maven wrapper (in repo)
- MongoDB running locally (par défaut `mongodb://localhost:27017`)

Commandes utiles (Windows PowerShell)

```powershell
cd Backend
.\mvnw.cmd spring-boot:run
```

Packaging

```powershell
.\mvnw.cmd -DskipTests package
java -jar target\your-artifact-name.jar
```

Tests

```powershell
.\mvnw.cmd test
```

Seed data & uploads
- Seed helpers: `scripts/` and `seed-admin.ps1`.
- Uploaded files are stored under `uploads/` and served via `/uploads/**`.

Configuration
- Voir `src/main/resources/application.properties` pour les valeurs par défaut.
- Variables sensibles à fournir via `-D` properties ou variables d'environnement: JWT signing key, SMTP creds, Twilio creds, Stripe keys.

Notes opérationnelles
- Phone OTP endpoints disabled by default; enable only with credentials.
- Payment provider is simulated for demo. Replace payment service implementation to integrate Stripe.
