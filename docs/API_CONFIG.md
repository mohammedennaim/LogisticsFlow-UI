# Configuration API - LogisticsFlow

## 🔧 Configuration Backend

### 1. Vérifier que le backend est démarré
```bash
cd LogisticsFlow-api
mvn spring-boot:run
```

Le backend doit être accessible sur : `http://localhost:8093`

### 2. Vérifier la configuration CORS
✅ Déjà configuré dans `SecurityConfig.java`
- Permet toutes les origines
- Permet tous les headers
- Permet les credentials

### 3. Vérifier Keycloak
Le backend utilise Keycloak pour l'authentification OAuth2.

Configuration dans `application.yml`:
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/auth/realms/logistics-realm
```

## 🎨 Configuration Frontend

### 1. Variables d'environnement
Fichier: `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8093',
  keycloak: {
    url: 'http://localhost:8080/auth',
    realm: 'logistics-realm',
    clientId: 'logistics-frontend'
  }
};
```

### 2. Services disponibles

#### ApiService
Service centralisé pour tous les appels HTTP avec gestion d'erreurs automatique.

#### LogisticsService
Service métier utilisant ApiService pour accéder aux endpoints:
- Products: `/api/products`
- Inventory: `/api/inventories`
- Warehouses: `/api/warehouses`
- Carriers: `/api/carriers`
- Shipments: `/api/shipments`
- Sales Orders: `/api/sales-orders`
- Reports: `/api/reports/*`

#### ApiHealthService
Vérifie la disponibilité de l'API via `/api/test`

### 3. Intercepteur d'authentification
L'intercepteur `authInterceptor` ajoute automatiquement le token JWT à toutes les requêtes.

## 🚀 Utilisation dans les Dashboards

### Exemple: Admin Dashboard
```typescript
import { LogisticsService } from '../../../core/services/logistics.service';

export class AdminDashboardComponent implements OnInit {
  private logisticsService = inject(LogisticsService);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    forkJoin({
      orderReport: this.logisticsService.getOrderReport(),
      inventoryReport: this.logisticsService.getInventoryReport(),
      shipmentReport: this.logisticsService.getShipmentReport(),
      warehouses: this.logisticsService.getWarehouses()
    }).subscribe({
      next: (data) => {
        // Traiter les données
      },
      error: (err) => {
        console.error('Erreur:', err.message);
      }
    });
  }
}
```

## 🔍 Vérification de la connexion

### Test manuel
1. Ouvrir la console du navigateur (F12)
2. Vérifier les logs de l'intercepteur: `🔐 AUTH INTERCEPTOR LOADED`
3. Vérifier que le token est ajouté: `🔐 Authorization header added`

### Test endpoint
```typescript
// Dans un composant
this.logisticsService.getWarehouses().subscribe({
  next: (data) => console.log('✅ API OK:', data),
  error: (err) => console.error('❌ API Error:', err.message)
});
```

## ⚠️ Problèmes courants

### 1. CORS Error
**Symptôme**: `Access to XMLHttpRequest has been blocked by CORS policy`
**Solution**: Vérifier que le backend est démarré et que CORS est configuré

### 2. 401 Unauthorized
**Symptôme**: Toutes les requêtes retournent 401
**Solution**: 
- Vérifier que Keycloak est démarré
- Vérifier que le token est présent dans localStorage
- Vérifier la configuration Keycloak

### 3. Connection Refused
**Symptôme**: `ERR_CONNECTION_REFUSED`
**Solution**: Vérifier que le backend est démarré sur le port 8093

### 4. Token expiré
**Symptôme**: 401 après un certain temps
**Solution**: L'intercepteur gère automatiquement le refresh du token

## 📝 Checklist de démarrage

- [ ] Backend démarré sur port 8093
- [ ] Keycloak démarré sur port 8080
- [ ] PostgreSQL démarré sur port 5433
- [ ] Frontend démarré avec `ng serve`
- [ ] Authentification réussie
- [ ] Token présent dans localStorage
- [ ] Appels API fonctionnels dans la console
