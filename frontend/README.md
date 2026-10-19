# Carpeta Docente UNT — Sistema Digital de Gestión Académica

**Carpeta Docente UNT** es la plataforma oficial de la **Universidad Nacional de Trujillo** para la gestión, versionado documental inmutable y dictamen colegiado de evidencias académicas conforme a los estándares de acreditación universitaria ICACIT y SINEACE.

---

## Características Principales

- **10 Secciones Oficiales Predefinidas:** Carga lectiva, sílabos, rúbricas de evaluación, evidencias de clases, registros SUV y exámenes.
- **Versionado Inmutable (RF5):** Almacenamiento seguro fuera de base de datos con control estricto de versiones (v1, v2) y trazabilidad completa.
- **Dictamen Colegiado (RF6 / RF7):** Monitoreo directo por la Dirección de Escuela y Comités de Calidad, con emisión y resolución de observaciones en tiempo real.
- **Roles Institucionales:** Estaciones de trabajo especializadas para Docente, Revisor y Administrador con autenticación JWT institucional.
- **Integración Backend:** Conectado vía proxy `/api/*` al backend de FastAPI + SQLAlchemy + PostgreSQL.

---

## Inicio Rápido

Para iniciar el entorno de desarrollo:

```bash
cd frontend
npm install
npm run dev
```

Install dependencies:

```bash
npm install
```

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're good. **Happy coding**!

## Working with AI agents

Open the project in Claude Code, Cursor, Codex, Copilot, or Zed. Your agent reads `AGENTS.md` and the skill files, then builds inside the structure that's already there, so folders, naming, and styling stay the same across sessions.

El proyecto proporciona una base arquitectónica sólida y estructurada. Los componentes, pantallas de autenticación institucional, modelo de datos y reglas de desarrollo se mantienen estandarizados.

A few things worth knowing:

- **Agent Skills** give your agent the full picture of the components, design system, and file structure, so it doesn't start from zero
- **React Aria skills** keep keyboard navigation, focus, and ARIA attributes correct after your agent edits a component
- **The api-integration skill** swaps the mock data for your live endpoints from a single prompt
- **Custom Prompts** cover the common jobs across core setup, layout, UI, and auth, ready to copy into your editor

## Despliegue

Compatible con cualquier proveedor que soporte Next.js (Vercel, Node.js Docker container, etc.).

## Update Logs

### Version 2.0.0 - [July 20, 2026]

- **Complete UI/UX Overhaul**: Redesigned the entire dashboard with a modern aesthetic and enhanced visual hierarchy.
- **Design System Integration**: Replaced raw UI components with Tailgrids UI for improved design consistency and accessibility.
- **Expanded Page & Component Library**: Added 10+ new pages and 20+ customizable component variants.
- **Functional Mock API Integration**: Made all pages interactive and connected them with mock REST APIs.
- **AI-Native Repository**: Optimized codebase architecture following deep modularity principles and added comprehensive AI guidelines in `AGENTS.md`.
- **Custom Agent Skills & Accessibility**: Integrated `/api-integration` for instant API binding and `/react-aria` to enforce WCAG best practices and accessible UI primitives.

### Version 1.3.0 - [May 14, 2026]

- Updated Next.js, Tailwind CSS, and all dependencies to their latest versions.
- Replaced `next-auth` with `better-auth`.
- Made authentication and authorization dynamic.
- Added 2 Step verification, email verification, and password reset.
- Added `Admin` plugin from `better-auth` for RBAC.
- Replaced Algolia search with `cmdk`.
- Improved ApexCharts hydration handling.
- Moved utility files from `libs` into `utils`.
- Fixed file and folder naming inconsistencies.
- Reorganized environment variables and removed unused entries.
- Renamed the unused proxy file to `example.proxy.ts` and fixed its import path.
- Fixed modal position shift issues.
- Improved responsiveness across marketing, CRM, profile, manage team, tables, and not found pages.

### Version 1.2.3 - [Mar 16, 2026]

- Update Next.js to ^16.1.6 and configure image qualities

### Version 1.2.2 - [Dec 01, 2025]

- Updated to Next.js 16
- Updated all the dependencies.

### Version 1.2.1 - Fix peer dependency issue - [Mar 19, 2025]

- Fixed peer dependency issue with React 19
- Migrated from `react-table` to `@tanstack/react-table`
- Fixed reference error in `top-countries/map.tsx` component

### Version 1.2.0 - Major Upgrade and UI Improvements - [Jan 27, 2025]

- Upgraded to Next.js v15 and updated dependencies
- API integration with loading skeleton for tables and charts.
- Improved code structure for better readability.
- Rebuilt components like dropdown, modals, and all ui-elements using accessibility practices.
- Using search-params to store dropdown selection and refetch data.
- Semantic markups, better separation of concerns and more.

### Version 1.1.0 - Initial Release - [May 13, 2024]

- Updated Dependencies
- Removed Unused Integrations
- Optimized App

### Version 1.0.0 - Initial Release - [May 13, 2024]

- Initial release
