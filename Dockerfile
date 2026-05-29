# ---------- Build stage ----------
# Node para compilar la aplicación React/Vite
FROM node:20-alpine AS build
WORKDIR /app

# Copia dependencias primero para aprovechar caché de Docker
# Si package.json no cambia, npm ci no se vuelve a ejecutar
COPY package*.json ./
RUN npm ci

# Copia el código fuente y compila
COPY . .
RUN npm run build:docker
# El resultado es /app/dist — HTML + JS + CSS estáticos listos para servir

# ---------- Runtime stage ----------
# Nginx para servir los estáticos (imagen ~20MB vs ~300MB de Node)
# La imagen final no contiene Node, código fuente ni dependencias de desarrollo
FROM nginx:alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copia el build desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copia la configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=10 \
  CMD wget -qO- http://localhost:80 | grep -q '<html' || exit 1

ENTRYPOINT ["nginx", "-g", "daemon off;"]