# 🔧 Configuration Keycloak - Fix Rapide

## 🚨 Problème : Redirection Keycloak ne fonctionne pas

### ✅ Solution 1 : Vérifier la version de Keycloak

**Keycloak 17+ (NOUVEAU)** : URL sans `/auth`
```
http://localhost:8080/realms/logistics-realm
```

**Keycloak 16 et avant (ANCIEN)** : URL avec `/auth`
```
http://localhost:8080/auth/realms/logistics-realm
```

### 🔍 Comment savoir quelle version vous avez ?

Ouvrez dans le navigateur :
1. **Test 1** : http://localhost:8080/realms/logistics-realm
2. **Test 2** : http://localhost:8080/auth/realms/logistics-realm

✅ Si Test 1 fonctionne → Keycloak 17+ (utilisez URL sans `/auth`)
✅ Si Test 2 fonctionne → Keycloak 16- (utilisez URL avec `/auth`)

### 🛠️ Configuration Frontend

**Fichier** : `src/environments/environment.ts`

**Pour Keycloak 17+** (SANS /auth) :
```typescript
keycloak: {
  url: 'http://localhost:8080',
  realm: 'logistics-realm',
  clientId: 'logistics-frontend'
}
```

**Pour Keycloak 16-** (AVEC /auth) :
```typescript
keycloak: {
  url: 'http://localhost:8080/auth',
  realm: 'logistics-realm',
  clientId: 'logistics-frontend'
}
```

### 🛠️ Configuration Backend

**Fichier** : `src/main/resources/application.yml`

**Pour Keycloak 17+** :
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/logistics-realm
```

**Pour Keycloak 16-** :
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/auth/realms/logistics-realm
```

### ⚡ Fix Rapide (Sans redémarrer Keycloak)

1. **Ouvrir la console du navigateur** (F12)
2. **Regarder les erreurs** - vous verrez l'URL qui échoue
3. **Ajuster** `environment.ts` selon l'erreur
4. **Redémarrer** le frontend : `ng serve`

### 🎯 Configuration Keycloak Client

Dans Keycloak Admin Console :
1. Aller dans **Clients** → **logistics-frontend**
2. **Valid Redirect URIs** : `http://localhost:4200/*`
3. **Web Origins** : `http://localhost:4200`
4. **Access Type** : `public`
5. Sauvegarder

### 🔥 Si rien ne fonctionne

```bash
# 1. Arrêter tout
# 2. Nettoyer le cache du navigateur (Ctrl+Shift+Delete)
# 3. Redémarrer dans l'ordre :

# Keycloak
docker-compose up keycloak -d

# Backend
cd LogisticsFlow-api
mvn spring-boot:run

# Frontend
cd LogisticsFlow-FrontEnd
ng serve

# 4. Ouvrir en navigation privée : http://localhost:4200
```

### 📝 Vérification finale

Console du navigateur (F12) devrait afficher :
```
✅ Keycloak initialized successfully
🔐 AUTH INTERCEPTOR LOADED
```

Si vous voyez :
```
❌ Keycloak init error
⚠️ Continuing without Keycloak...
```

→ Vérifiez l'URL Keycloak dans `environment.ts`
