import Keycloak, { type KeycloakConfig } from 'keycloak-js'

const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:8080',       // URL pública de Keycloak desde el navegador
  realm: 'tfm-bandas',               // ajusta al nombre real de tu realm
  clientId: 'frontend-local',   // el clientId que hayas creado
}

const keycloak = new Keycloak(keycloakConfig)

export default keycloak
