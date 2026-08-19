# Security gate

CI runs `npm audit --omit=dev --audit-level=high` after the automated test suite.
The pipeline fails for a high or critical production dependency finding.

When a finding is reported:

1. Confirm the affected dependency is reachable in production.
2. Upgrade, replace, or remove it and add a regression test where practical.
3. Run `npm run security` locally and include the result in the pull request.
4. If a temporary exception is necessary, document the advisory, exposure analysis,
   owner, and expiry date in a tracked issue; do not suppress the CI check silently.

The historical `snyk protect` hook is deliberately not run. It rewrites dependency
trees during installation and is incompatible with deterministic `npm ci` builds;
the repository now uses npm's built-in audit gate instead.
