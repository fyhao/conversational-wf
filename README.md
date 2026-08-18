# conversational-wf

## Run and verify

The current repository contains the Node.js workflow-engine service in
`wf-converse`; controller and admin UI are tracked as separate open work items.

```sh
cd wf-converse
npm ci --ignore-scripts
npm run test:unit
npm start
```

Use `GET /control/health` for container and platform health checks. Deployment
requests to `POST /control/deploy` must include a `conf` object with an `action`.
