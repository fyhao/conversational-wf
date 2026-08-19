# Release smoke test

1. Copy `.env.example` to `.env` and replace both secret values.
2. Run `docker compose up --build`.
3. Verify `http://localhost:8081/control/health`, `http://localhost:8082/health`,
   and `http://localhost:8080/health` each return HTTP 200.
4. Sign in at `http://localhost:8080` using the configured controller credentials.
5. Create an application through `POST /apps`, then publish it using
   `POST /apps/{id}/publish`; confirm the workflow engine returns success.
6. Run `npm test` and `npm run security` before release.
