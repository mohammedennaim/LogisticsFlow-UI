# 🔍 Vérification Keycloak - Checklist Complète

## Étape 1 : Vérifier que Keycloak est démarré

Ouvrir dans le navigateur : **http://localhost:8080**

✅ Vous devriez voir la page d'accueil Keycloak
❌ Si erreur → Keycloak n'est pas démarré

## Étape 2 : Tester les URLs

### Test A : SANS /auth (Keycloak 17+)
http://localhost:8080/realms/logistics-realm

### Test B : AVEC /auth (Keycloak 16-)
http://localhost:8080/auth/realms/logistics-realm

**Résultat attendu** : Page JSON avec les infos du realm
```json
{
  "realm": "logistics-realm",
  "public_key": "...",
  ...
}
```

## Étape 3 : Vérifier le Client Keycloak

1. Aller sur **http://localhost:8080** (ou /auth)
2. Cliquer sur **Administration Console**
3. Se connecter (admin/admin par défaut)
4. Sélectionner le realm **logistics-realm**
5. Menu **Clients** → Chercher **logistics-frontend**

### Configuration requise du client :

```
Client ID: logistics-frontend
Client Protocol: openid-connect
Access Type: public
Standard Flow Enabled: ON
Direct Access Grants Enabled: ON

Valid Redirect URIs:
  http://localhost:4200/*
  http://localhost:4200/dashboard
  http://localhost:4200/auth/login

Web Origins:
  http://localhost:4200
  *
```

## Étape 4 : Créer le client si inexistant

Si le client n'existe pas :

1. Cliquer sur **Create**
2. **Client ID** : `logistics-frontend`
3. **Client Protocol** : `openid-connect`
4. Sauvegarder
5. Dans l'onglet **Settings** :
   - **Access Type** : `public`
   - **Valid Redirect URIs** : `http://localhost:4200/*`
   - **Web Origins** : `*`
6. Sauvegarder

## Étape 5 : Créer un utilisateur de test

1. Menu **Users** → **Add user**
2. **Username** : `test@test.com`
3. Sauvegarder
4. Onglet **Credentials**
5. **Password** : `test123`
6. **Temporary** : OFF
7. **Set Password**

## Étape 6 : Tester la connexion

### Option A : Test HTML simple
Ouvrir : `test-keycloak.html` dans le navigateur
Cliquer sur "Se connecter"

### Option B : Test depuis l'app
1. Démarrer : `ng serve`
2. Ouvrir : http://localhost:4200
3. Cliquer sur "Se connecter via Keycloak"

## 🆘 Problèmes courants

### Problème 1 : "Client not found"
**Solution** : Créer le client (voir Étape 4)

### Problème 2 : "Invalid redirect_uri"
**Solution** : Ajouter `http://localhost:4200/*` dans Valid Redirect URIs

### Problème 3 : "CORS error"
**Solution** : Ajouter `*` dans Web Origins

### Problème 4 : Page blanche après connexion
**Solution** : Vérifier que le backend est démarré sur port 8093

## 📋 Commandes utiles

```bash
# Vérifier si Keycloak tourne
curl http://localhost:8080

# Vérifier le realm
curl http://localhost:8080/realms/logistics-realm

# Démarrer Keycloak (Docker)
docker-compose up keycloak -d

# Voir les logs Keycloak
docker-compose logs -f keycloak
```

## ✅ Configuration finale qui doit fonctionner

**Frontend** (`environment.ts`) :
```typescript
keycloak: {
  url: 'http://localhost:8080',  // SANS /auth pour Keycloak 17+
  realm: 'logistics-realm',
  clientId: 'logistics-frontend'
}
```

**Backend** (`application.yml`) :
```yaml
issuer-uri: http://localhost:8080/realms/logistics-realm
```
