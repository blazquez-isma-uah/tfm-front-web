# Front-Web - Gestión de Bandas de Música

Aplicación web para la gestión interna de agrupaciones musicales.
Frontend React del sistema de microservicios desarrollado como TFM en el "Máster Universitario Desarrollo Ágil de Software para la Web".

## Funcionalidades principales

- Autenticación y autorización con Keycloak (OIDC/PKCE, roles ADMIN y MUSICIAN)
- Gestión completa de usuarios, instrumentos, eventos y encuestas (rol ADMIN)
- Consulta de calendario de eventos con inscripción de asistencia (rol MUSICIAN)
- Respuesta a encuestas activas y visualización de resultados (rol MUSICIAN)
- Edición de perfil de usuario propio
- Diseño Mobile First, responsive desde 320px hasta escritorio

## Stack tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | React 19 + TypeScript 5 |
| Build Tool | Vite 6 |
| Autenticación | keycloak-js 26 |
| Routing | React Router 6 |
| Estilos | CSS puro con Custom Properties |
| UI | Sin librerías externas (componentes propios) |

## Requisitos y arranque local

**Requisitos previos:**
- Node.js 18+ y npm

**Instalación:**
```bash
npm install
```

**Configuración:**
- Editar `src/features/auth/keycloak.ts` con la URL del servidor Keycloak y el realm
- El backend API debe estar ejecutándose (por defecto en `http://localhost:8080`)

**Desarrollo:**
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

**Docker:**
Este frontend forma parte del `docker-compose.yml` del proyecto raíz. 
Se construye con el `Dockerfile` incluido y se sirve con nginx.

## Estructura de carpetas

```
src/
├── api/          # Funciones de llamada a la API REST organizadas por dominio
├── components/   # Componentes UI genéricos y reutilizables (DataTable, Spinner, ConfirmDialog, etc.)
├── context/      # Providers React globales (autenticación, notificaciones toast)
├── features/     # Módulos por funcionalidad de negocio
│   ├── auth/     # Autenticación Keycloak, protección de rutas, página de login
│   ├── events/   # Gestión y visualización de eventos (calendario, inscripciones)
│   ├── instruments/ # CRUD de instrumentos y asignación a usuarios
│   ├── layout/   # Layout principal, dashboard, navegación
│   ├── surveys/  # Gestión de encuestas, respuestas y resultados
│   └── users/    # CRUD de usuarios, perfil, gestión de roles e instrumentos
├── hooks/        # Custom hooks reutilizables (paginación, sorting, validación de forms)
├── styles/       # Design system: tokens CSS (colores, tipografía, espaciado) y clases utilitarias
├── types/        # Tipos TypeScript compartidos organizados por dominio
└── utils/        # Funciones auxiliares (formateo de fechas, traducciones, manejo de errores)
```

## Roles y acceso

| Rol | Acceso |
|-----|--------|
| **ADMIN** | Acceso completo: gestión de usuarios, instrumentos, eventos y encuestas. Dashboard con métricas. |
| **MUSICIAN** | Consulta y respuesta: calendario de eventos propios, inscripción a eventos, respuesta a encuestas activas, edición de perfil. |

**Rutas protegidas:**
- `/login` — acceso público
- `/dashboard`, `/users`, `/instruments` — solo ADMIN
- `/events`, `/my-events`, `/surveys`, `/my-surveys`, `/profile` — ADMIN y MUSICIAN

## Decisiones de diseño destacadas

- **Mobile First obligatorio:** Los usuarios reales (músicos) acceden principalmente desde dispositivos móviles durante ensayos y conciertos.
- **Sin librerías UI externas:** Se ha implementado un design system propio con componentes reutilizables para mantener control total sobre la experiencia y el tamaño del bundle.
- **Protección de rutas en dos niveles:** `RequireAuth` verifica autenticación (redirección a login), `RequireRole` verifica autorización por rol (redirección a dashboard).
- **Seguridad en backend:** El frontend solo controla navegación y visibilidad de UI. La seguridad real de las operaciones se implementa en el backend con Spring Security.

## Construcción y despliegue

**Build de producción:**
```bash
npm run build
```
Genera los archivos estáticos optimizados en `dist/`

**Preview de producción:**
```bash
npm run preview
```

**Linting:**
```bash
npm run lint
```

El contenedor Docker incluye nginx configurado para SPA (todas las rutas redirigen a `index.html`).
