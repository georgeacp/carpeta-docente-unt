# anti-slop provenance

- Source: https://github.com/dmmulroy/anti-slop
- Source commit: `13909c9e07590f5a85d93c62712259fe14a883f7`
- Source assets: `skills/install-anti-slop/assets/anti-slop/` at that commit.
- Installed path: `tools/oxlint/anti-slop/`.
- Installer skill: `.agents/skills/install-anti-slop/`, downloaded at the same commit.
- Pristine snapshot: the installer skill's `assets/anti-slop/` directory.
- Local source deviations: none; this provenance record and the upstream root MIT license were added locally. `tools/oxlint/package.json` declares the ESM scope required by the copied TypeScript imports without changing the application module type.
- Runtime dependencies: `oxlint` and `@oxlint/plugins`, both pinned to `1.89.0` in the root development dependencies.
- Configuration: root `.oxlintrc.json`; all generic rules and the native companion rule enabled at error severity. Effect rules are not enabled because the project has no direct Effect dependency.
- ESLint remains configured in `frontend/eslint.config.mjs`. Root `npm run lint:anti-slop` checks the frontend with Oxlint; root `npm run lint` runs Oxlint followed by the existing frontend lint command.

Keep the nested `vendor/eslint-stylistic/LICENSE` and its `UPSTREAM.md` with the vendored source.
