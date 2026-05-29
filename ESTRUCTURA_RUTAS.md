# Estructura de Rutas del Proyecto TFM Bandas

## 📍 Índice
1. [Rutas Front-End (React Router)](#rutas-front-end)
2. [Rutas API Back-End](#rutas-api-back-end)
3. [Configuración de Proxy](#configuración-de-proxy)
4. [Autenticación (Keycloak)](#autenticación-keycloak)
5. [Archivos de Configuración](#archivos-de-configuración)

---

## 1. Rutas Front-End (React Router)

### Archivos de Definición
- **Archivo Principal**: `src/App.tsx`
- **Provider de Autenticación**: `src/features/auth/AuthContext.tsx`
- **Guard de Rutas**: `src/features/auth/RequireAuth.tsx`
- **Guard de Roles**: `src/features/auth/RequireRole.tsx`

### Estructura de Rutas

#### Ruta Pública
```
/login                          → LoginPage
                                Componente: src/features/auth/LoginPage.tsx
                                Descripción: Página de autenticación sin protección
```

#### Rutas Protegidas - Zona Común
*(Accesible para todos los usuarios autenticados)*

```
/                               → Redirect a /dashboard
/dashboard                      → DashboardPage
                                Componente: src/features/layout/DashboardPage.tsx
                                Descripción: Panel principal del usuario

/events                         → MyEventsPage
                                Componente: src/features/events/MyEventsPage.tsx
                                Descripción: Mis eventos (eventos del usuario actual)

/surveys                        → MySurveysPage
                                Componente: src/features/surveys/MySurveysPage.tsx
                                Descripción: Mis encuestas (encuestas del usuario)

/scores                         → Placeholder
                                Estado: Por implementar
                                Descripción: Partituras

/profile                        → ProfilePage
                                Componente: src/features/users/ProfilePage.tsx
                                Descripción: Perfil del usuario autenticado
```

#### Rutas Protegidas - Zona Administrador
*(Solo accesibles para usuarios con rol ADMIN)*

```
/admin/users                    → UsersPage
                                Componente: src/features/users/UsersPage.tsx
                                Descripción: Gestión de usuarios (CRUD)
                                Guard: RequireRole role="ADMIN"

/admin/instruments              → InstrumentsPage
                                Componente: src/features/instruments/InstrumentsPage.tsx
                                Descripción: Gestión de instrumentos (CRUD)
                                Guard: RequireRole role="ADMIN"

/admin/events                   → EventsPage
                                Componente: src/features/events/EventsPage.tsx
                                Descripción: Gestión de eventos (CRUD)
                                Guard: RequireRole role="ADMIN"

/admin/surveys                  → SurveysPage
                                Componente: src/features/surveys/SurveysPage.tsx
                                Descripción: Gestión de encuestas (CRUD)
                                Guard: RequireRole role="ADMIN"
```

#### Rutas por Defecto
```
*                               → Redirect a /dashboard
                                (Cualquier ruta no definida)
```

---

## 2. Rutas API Back-End

### Base de Configuración

**Archivo**: `src/api/httpClient.ts`

```typescript
const baseURL = '';  // URL relativa (se usa proxy en desarrollo/producción)
```

### 2.1 Endpoints de USUARIOS

**Archivo**: `src/api/usersApi.ts`

```
GET    /api/users/search                    → searchUsersPage()
       Parámetros: page, size, sort, username, firstName, lastName, 
                   secondLastName, email, active, instrumentId, roleName, 
                   birthDateFrom, birthDateTo, bandJoinDateFrom, bandJoinDateTo
       Retorna: PaginatedResponseUserDTO
       
GET    /api/users/{userId}                 → getUserById(userId)
       Parámetros: userId (path)
       Retorna: UserDTO
       
GET    /api/users/me                       → getMyProfile()
       Descripción: Obtiene el perfil del usuario autenticado
       Retorna: UserDTO
       
GET    /api/users/iam/{iamId}              → getUserByIamId(iamId)
       Parámetros: iamId (path)
       Retorna: UserDTO

POST   /api/users                           → createUser(payload)
       Body: UserCreatePayload
       Retorna: UserDTO
       
PUT    /api/users/{userId}                 → updateUser(userId, payload, version)
       Parámetros: userId (path), version (header If-Match)
       Body: UserUpdatePayload
       Retorna: UserDTO
       
DELETE /api/users/{userId}                 → deleteUser(userId, version)
       Parámetros: userId (path), version (header If-Match)
       
PUT    /api/users/{userId}/enable          → enableUser(userId, version)
       Parámetros: userId (path), version (header If-Match)
       
PUT    /api/users/{userId}/disable         → disableUser(userId, version)
       Parámetros: userId (path), version (header If-Match)

PUT    /api/users/me                       → updateMyProfile(payload)
       Body: MyProfileUpdateRequestDTO
       Retorna: UserDTO
       
PUT    /api/users/me/password              → updateMyPassword(payload)
       Body: PasswordUpdateRequestDTO
```

---

### 2.2 Endpoints de EVENTOS

**Archivo**: `src/api/eventsApi.ts`

```
GET    /api/events/search                  → searchEventsPage(params)
       Parámetros: page, size, sort, q (texto libre), title, description, 
                   location, type, status, visibility, startAtFrom, startAtTo, 
                   endAtFrom, endAtTo
       Retorna: PaginatedResponseEventDTO
       
GET    /api/events/{id}                    → getEventById(id)
       Parámetros: id (path)
       Retorna: EventDTO
       
GET    /api/events/calendar                → getCalendar(from, to, page, size, sort)
       Parámetros: from (ISO-8601), to (ISO-8601), page, size, sort
       Retorna: PaginatedResponseCalendarEventItemDTO
       
GET    /api/events/available-types         → getAvailableEventTypes()
       Retorna: EventType[]
       
GET    /api/events/available-statuses      → getAvailableEventStatuses()
       Retorna: EventStatus[]
       
GET    /api/events/available-visibilities  → getAvailableEventVisibilities()
       Retorna: EventVisibility[]

POST   /api/events                         → createEvent(event)
       Body: EventCreateRequestDTO
       Retorna: EventDTO
       
PUT    /api/events/{id}                    → updateEvent(id, version, event)
       Parámetros: id (path), version (header If-Match)
       Body: EventCreateRequestDTO
       Retorna: EventDTO
       
DELETE /api/events/{id}                    → deleteEvent(id, version)
       Parámetros: id (path), version (header If-Match)
```

**Funciones Auxiliares**:
```
getUpcomingEvents(limit = 5, daysAhead = 90)
    → Obtiene los próximos eventos usando /calendar
    Retorna: CalendarEventItemDTO[]
```

---

### 2.3 Endpoints de ENCUESTAS

**Archivo**: `src/api/surveysApi.ts`

```
GET    /api/surveys/search                 → searchSurveysPage(params)
       Parámetros: page, size, sort, qText, title, description, eventId, 
                   status, surveyType, opensFrom, opensTo, closesFrom, closesTo
       Retorna: PaginatedResponseSurveyDTO
       
GET    /api/surveys/{surveyId}             → getSurveyById(surveyId)
       Parámetros: surveyId (path)
       Retorna: SurveyDTO

POST   /api/surveys                        → createSurvey(payload)
       Body: CreateSurveyRequestDTO
       Retorna: SurveyDTO
       
PUT    /api/surveys/{surveyId}             → updateSurvey(surveyId, payload, version)
       Parámetros: surveyId (path), version (header If-Match)
       Body: UpdateSurveyRequestDTO
       Retorna: SurveyDTO
       
DELETE /api/surveys/{surveyId}             → deleteSurvey(surveyId, version)
       Parámetros: surveyId (path), version (header If-Match)

POST   /api/surveys/{surveyId}/open        → openSurvey(surveyId, version)
       Parámetros: surveyId (path), version (header If-Match)
       Retorna: SurveyDTO
       
POST   /api/surveys/{surveyId}/close       → closeSurvey(surveyId, version)
       Parámetros: surveyId (path), version (header If-Match)
       Retorna: SurveyDTO
       
POST   /api/surveys/{surveyId}/cancel      → cancelSurvey(surveyId, version)
       Parámetros: surveyId (path), version (header If-Match)
       Retorna: SurveyDTO
       
POST   /api/surveys/{surveyId}/reset       → resetSurvey(surveyId, version)
       Parámetros: surveyId (path), version (header If-Match)
       Retorna: SurveyDTO

POST   /api/surveys/responses/{surveyId}   → respondToSurvey(surveyId, payload, version)
       Parámetros: surveyId (path), version (header If-Match)
       Body: RespondYesNoMaybeRequestDTO
       Retorna: SurveyResponseDTO
```

---

### 2.4 Endpoints de INSTRUMENTOS

**Archivo**: `src/api/instrumentsApi.ts`

```
GET    /api/instruments/search             → searchInstrumentsPage(params)
       Parámetros: page, size, sort, instrumentName, voice
       Retorna: PaginatedResponseInstrumentDTO
       
GET    /api/instruments/{id}               → getInstrumentById(id)
       Parámetros: id (path)
       Retorna: InstrumentDTO

POST   /api/instruments                    → createInstrument(body)
       Body: InstrumentRequestDTO
       Retorna: InstrumentDTO
       
PUT    /api/instruments/{id}               → updateInstrument(id, body, version)
       Parámetros: id (path), version (header If-Match)
       Body: InstrumentRequestDTO
       Retorna: InstrumentDTO
       
DELETE /api/instruments/{id}               → deleteInstrument(id, version)
       Parámetros: id (path), version (header If-Match)

GET    /api/instruments/{id}/users         → getInstrumentUsers(id)
       Parámetros: id (path)
       Retorna: UserDTO[]
```

---

### 2.5 Endpoints de ROLES

**Archivo**: `src/api/rolesApi.ts`

```
GET    /api/roles                          → getAllRoles()
       Retorna: RoleResponse []
```

---

## 3. Configuración de Proxy

### 3.1 Desarrollo (Vite)

**Archivo**: `vite.config.ts`

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8085',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

**Comportamiento**: 
- Las peticiones a `/api/*` en desarrollo se redirigen a `http://localhost:8085/api/*`
- La aplicación se ejecuta en `http://localhost:5173`

---

### 3.2 Producción (Nginx)

**Archivo**: `nginx.conf`

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Proxy hacia el gateway backend
    location /api/ {
        proxy_pass http://gateway:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # React Router - cualquier ruta no estática redirige a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
```

**Comportamiento**:
- Las peticiones a `/api/*` se redirigen al servicio backend `gateway:8080/api/*`
- Cualquier ruta que no sea un archivo estático se redirige a `index.html` (para React Router)
- Los assets de Vite (en `/assets/`) se cachean agresivamente (1 año)

---

## 4. Autenticación (Keycloak)

**Archivo**: `src/features/auth/keycloak.ts`

```typescript
const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'tfm-bandas',
  clientId: 'frontend-local',
}
```

**Configuración**:
- **URL del servidor**: `http://localhost:8080`
- **Realm**: `tfm-bandas`
- **Client ID**: `frontend-local`
- **Tipo de Cliente**: Público (Sin secreto de cliente)

**Integración**:
- **Archivo de contexto**: `src/features/auth/AuthContext.tsx`
- **Guard de autenticación**: `src/features/auth/RequireAuth.tsx`
- **Guard de roles**: `src/features/auth/RequireRole.tsx`

**Headers de Autorización**:
```typescript
Authorization: Bearer {token}
```

---

## 5. Archivos de Configuración

### Estructura de Archivos Relacionados con Rutas

```
src/
├── App.tsx                          ← Definición principal de rutas
├── main.tsx                         ← Punto de entrada (BrowserRouter)
├── features/
│   ├── auth/
│   │   ├── AuthContext.tsx          ← Context de autenticación
│   │   ├── RequireAuth.tsx          ← Guard de autenticación
│   │   ├── RequireRole.tsx          ← Guard de roles
│   │   ├── keycloak.ts              ← Configuración de Keycloak
│   │   └── LoginPage.tsx
│   ├── layout/
│   │   ├── MainLayout.tsx           ← Layout con navegación
│   │   └── DashboardPage.tsx
│   ├── users/
│   │   ├── UsersPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── ...
│   ├── events/
│   │   ├── EventsPage.tsx
│   │   ├── MyEventsPage.tsx
│   │   └── ...
│   ├── surveys/
│   │   ├── SurveysPage.tsx
│   │   ├── MySurveysPage.tsx
│   │   └── ...
│   └── instruments/
│       ├── InstrumentsPage.tsx
│       └── ...
├── api/
│   ├── httpClient.ts                ← Configuración de Axios
│   ├── usersApi.ts                  ← Endpoints de usuarios
│   ├── eventsApi.ts                 ← Endpoints de eventos
│   ├── surveysApi.ts                ← Endpoints de encuestas
│   ├── instrumentsApi.ts            ← Endpoints de instrumentos
│   └── rolesApi.ts                  ← Endpoints de roles
├── hooks/
│   └── (hooks personalizados)
├── types/
│   ├── users.ts
│   ├── events.ts
│   ├── surveys.ts
│   ├── instruments.ts
│   ├── roles.ts
│   └── pagination.ts
└── context/
    └── ToastContext.tsx             ← Context de notificaciones

Raíz del proyecto:
├── vite.config.ts                   ← Configuración de Vite (proxy desarrollo)
├── nginx.conf                       ← Configuración de Nginx (proxy producción)
├── Dockerfile                       ← Contenedor Docker
├── package.json
└── tsconfig.json
```

---

## 6. Parámetros Comunes de Query

### Paginación
```
?page=0&size=10&sort=fieldName,asc|desc
```

Ejemplo:
```
GET /api/users/search?page=0&size=20&sort=firstName,asc&sort=lastName,asc
```

### Filtros de Búsqueda Temporal
```
?dateFrom=ISO_8601_DATE&dateTo=ISO_8601_DATE
```

Ejemplo (eventos):
```
GET /api/events/search?startAtFrom=2026-04-01T00:00:00Z&startAtTo=2026-04-30T23:59:59Z
```

### Búsqueda Libre
```
?q=queryText
```

---

## 7. Gestión de Versiones (Optimistic Locking)

Para operaciones de actualización y eliminación, se utiliza **Optimistic Locking** con el header `If-Match`:

```typescript
headers: {
  'If-Match': `"${version}"`,  // Para EventsApi y SurveysApi
  'If-Match': `W/"${version}"`, // Para UsersApi
}
```

Este mecanismo previene conflictos de actualización concurrente.

---

## 8. Resumen de Flujos Principales

### Flow de Autenticación
```
1. Usuario accede a /login
2. LoginPage delega a Keycloak
3. Keycloak redirige a http://localhost:8080/auth/...
4. Usuario autenticado → Redirect a /dashboard
5. Token guardado en AuthContext
```

### Flow de Request a API
```
Cliente (React) 
  ↓
  → Axios Instance (httpClient.ts)
    ↓
    → Proxy (Vite en desarrollo / Nginx en producción)
      ↓
      → Backend Gateway (http://localhost:8085 o gateway:8080)
```

### Flow de Autorización
```
1. Usuario accede a ruta protegida
2. RequireAuth verifica autenticación
3. RequireRole verifica roles (para zonas admin)
4. Si cumple → Renderiza componente
5. Si no cumple → Redirect a /login
```

---

## 9. Documentación de Tipos (TypeScript)

La mayoría de endpoints retornan tipos TypeScript definidos en `src/types/`:

- **Users**: [src/types/users.ts](src/types/users.ts)
- **Events**: [src/types/events.ts](src/types/events.ts)
- **Surveys**: [src/types/surveys.ts](src/types/surveys.ts)
- **Instruments**: [src/types/instruments.ts](src/types/instruments.ts)
- **Roles**: [src/types/roles.ts](src/types/roles.ts)
- **Pagination**: [src/types/pagination.ts](src/types/pagination.ts)

---

**Última actualización**: Abril 2026
