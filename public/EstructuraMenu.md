# 📌 Estructura final del menú de la aplicación

Este documento describe la **estructura definitiva del menú** y las **funcionalidades asociadas a cada sección**, teniendo en cuenta:

- Las encuestas tienen un campo `type`, siendo `ATTENDANCE` la única que establece relación usuario–evento.
- Un evento puede tener **0..N encuestas**.
- Las partituras están asociadas a eventos y se filtran por instrumento para los músicos.
- La visibilidad del menú depende del rol (`ADMIN`, `MUSICIAN`).

---

## 🌐 Zona común (todos los usuarios autenticados)

### 1️⃣ Dashboard
**Objetivo:** vista resumen y accionable.

**Contenido:**
- Próximos eventos (3–5):
  - Fecha / hora
  - Título
  - Lugar
- Encuestas pendientes:
  - Solo encuestas abiertas
  - Solo las no respondidas por el usuario
- Accesos rápidos según rol:
  - **MUSICIAN:** Mis encuestas, Partituras, Eventos
  - **ADMIN:** Crear evento, Crear encuesta, Usuarios

---

### 2️⃣ Eventos
**Objetivo:** consulta global del calendario de la banda.

**Subsecciones (tabs o vistas):**
- 📅 Calendario (mensual / semanal)
- 📋 Listado de eventos (con filtros)

**Detalle de evento:**
- Información general (fecha, lugar, descripción)
- Encuestas asociadas (con estado: abierta / cerrada / cancelada)
- Partituras asociadas:
  - Músico: solo las de sus instrumentos
  - Admin: todas

---

### 3️⃣ Encuestas (Mis encuestas)
**Objetivo:** punto único para responder y consultar encuestas.

**Subsecciones:**
- 🕓 Pendientes: abiertas y no respondidas
- 🟢 Activas: abiertas (respondidas o no)
- 📁 Historial: cerradas o canceladas

**Funcionalidades:**
- Responder encuesta
- Ver mi respuesta
- Consultar estado

---

### 4️⃣ Partituras
**Objetivo:** acceso al material musical.

**Subsecciones:**
- 📂 Por evento
- 🔍 Todas / buscador

**Funcionalidades:**
- Filtros por evento, instrumento, tipo
- Previsualizar y descargar
- Músico: solo partituras de sus instrumentos
- Admin: todas

---

### 5️⃣ Mi perfil
**Objetivo:** gestión de información personal.

**Funcionalidades:**
- Ver datos personales
- Editar campos permitidos:
  - Nombre y apellidos
  - Teléfono
  - Foto de perfil
  - Notas personales
- Ver roles e instrumentos (solo lectura)
- Cambio de contraseña vía Keycloak

---

## 🎵 Zona músico (solo rol MUSICIAN)

### 6️⃣ Mis eventos
**Objetivo:** eventos que afectan directamente al músico.

**Criterio:** eventos donde el usuario ha respondido **YES o MAYBE** a una encuesta `ATTENDANCE`.

**Subsecciones:**
- ✅ Confirmados (futuros)
- ⏳ Pendientes de confirmar
- 🗂 Histórico (opcional)

**Funcionalidades:**
- Acceso al detalle del evento
- Acceso directo a la encuesta de asistencia si está pendiente

> Nota: eventos sin encuesta `ATTENDANCE` no aparecen aquí, solo en “Eventos”.

---

## 🛠️ Zona administrador (solo rol ADMIN)

### 7️⃣ Administración → Usuarios
**Objetivo:** gestión completa de usuarios.

**Funcionalidades:**
- Listado con filtros, ordenación y paginación
- Ver detalle de usuario
- Crear / editar / eliminar
- Activar / desactivar
- Asignar / desasignar:
  - Roles
  - Instrumentos
- (Opcional) Reset de contraseña vía Keycloak

---

### 8️⃣ Administración → Instrumentos
**Objetivo:** gestión del catálogo de instrumentos.

**Funcionalidades:**
- Listado con filtros y ordenación
- Crear / editar / eliminar
- Ver usuarios asociados a un instrumento

---

### 9️⃣ Administración → Eventos
**Objetivo:** gestión del calendario de eventos.

**Funcionalidades:**
- Listado con filtros y ordenación
- Crear / editar / eliminar
- Ver detalle del evento
- (Opcional) Duplicar eventos o usar plantillas

---

### 🔟 Administración → Encuestas
**Objetivo:** gestión de encuestas asociadas a eventos.

**Funcionalidades:**
- Listado con filtros (evento, tipo, estado)
- Crear encuesta:
  - Asociada a un evento
  - Selección de `type` (`ATTENDANCE`, `GENERAL`, etc.)
  - Validación: máximo una `ATTENDANCE` por evento
- Abrir / cerrar / cancelar
- Ver resultados agregados
- Ver respuestas detalladas

---

### 1️⃣1️⃣ (Futuro) Administración → Partituras
**Objetivo:** gestión del material musical.

**Funcionalidades:**
- Subir partituras con metadatos (evento, instrumento, tipo)
- Editar / eliminar
- Control de visibilidad

---

## 🧭 Notas de UX y navegación

- Menú lateral único con agrupación visual:
  - **General**
  - **Músico**
  - **Administración**
- Las secciones se muestran u ocultan según rol.
- Evitar duplicidades:
  - “Mis encuestas” (usuario)
  - “Gestión de encuestas” (admin)
- El Dashboard mantiene el mismo layout, pero cambia el contenido según rol.

---
