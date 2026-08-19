# conversational-wf

## Run and verify

The repository contains a Node.js workflow engine (`wf-converse`), a small
token-authenticated controller service (`controller`), and a browser admin shell
(`admin-ui`). The controller provisions in-memory application definitions and
publishes them to the workflow engine.

```sh
npm --prefix wf-converse ci --ignore-scripts
npm test
cp .env.example .env
docker compose up --build
```

Use `GET /control/health`, `GET /health` on port 8082, and `GET /health` on port
8080 for service health checks. Set strong `CONTROLLER_PASSWORD` and
`CONTROLLER_TOKEN_SECRET` values before starting containers. The admin shell is
available on port 8080, the controller on 8082, and the workflow engine on 8081.

API details and release verification steps are in [docs/SMOKE-TEST.md](docs/SMOKE-TEST.md).
The production dependency quality gate is documented in [docs/SECURITY.md](docs/SECURITY.md).
