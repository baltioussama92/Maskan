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

Environment variables (recommended)
- Provide secrets via environment variables or JVM `-D` properties. Example names used by the project:
	- `SPRING_DATA_MONGODB_URI` (e.g. mongodb://localhost:27017/rental_platform)
	- `SPRING_DATA_MONGODB_DATABASE`
	- `JWT_SECRET` (strong random string)
	- `JWT_EXPIRATION_MS`
	- `APP_CORS_ALLOWED_ORIGIN` (frontend origin)
	- `MOCEAN_API_KEY`, `MOCEAN_API_SECRET`, `MOCEAN_API_TOKEN`
	- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`

Quick local dev steps
1. Create a `.env` (not committed) or set environment variables in your shell. Use `.env.example` to list names without values.
2. Start MongoDB (docker or locally).
3. Run the app:

```powershell
cd Backend
.
.\mvnw.cmd spring-boot:run
```

Security notes
- Do **not** commit real credentials. Rotate any secrets found in `application.properties` immediately.
- Add `.env` and `/target/` to `.gitignore` if not already ignored.
