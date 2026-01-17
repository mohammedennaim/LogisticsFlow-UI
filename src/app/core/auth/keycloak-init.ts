import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';

export function initializeKeycloak(keycloak: KeycloakService) {
    return async () => {
        try {
            // Tester d'abord sans /auth (Keycloak 17+)
            const result = await keycloak.init({
                config: {
                    url: environment.keycloak.url,
                    realm: environment.keycloak.realm,
                    clientId: environment.keycloak.clientId
                },
                initOptions: {
                    onLoad: 'check-sso',
                    silentCheckSsoRedirectUri:
                        window.location.origin + '/assets/silent-check-sso.html',
                    checkLoginIframe: false
                },
                enableBearerInterceptor: true,
                bearerExcludedUrls: ['/assets', '/clients/public']
            });
            console.log('✅ Keycloak initialized successfully');
            return result;
        } catch (err) {
            console.error('❌ Keycloak init error:', err);
            console.log('⚠️ Continuing without Keycloak...');
            return false;
        }
    };
}
