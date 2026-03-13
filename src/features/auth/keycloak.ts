import Keycloak, { type KeycloakConfig } from 'keycloak-js'

/**
 * Configuración de Keycloak.
 *
 * url: dirección pública del servidor Keycloak (accesible desde el navegador).
 * realm: nombre del realm configurado en Keycloak.
 * clientId: identificador del cliente público registrado para esta aplicación.
 */
const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'tfm-bandas',
  clientId: 'frontend-local',
}

/**
 * Instancia singleton de Keycloak.
 * Se importa en AuthContext para inicializar la autenticación.
 */
const keycloak = new Keycloak(keycloakConfig)

export default keycloak
