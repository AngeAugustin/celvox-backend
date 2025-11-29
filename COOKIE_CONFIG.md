# 🍪 Configuration des Cookies pour Cross-Origin

## Problème
Quand vous actualisez la page, vous êtes déconnecté automatiquement. Cela signifie que les cookies ne sont pas correctement configurés pour les requêtes cross-origin.

## Solution : Configuration des variables d'environnement sur Render

### ⚠️ IMPORTANT pour Cross-Origin (Frontend Vercel + Backend Render)

Quand votre frontend est sur un domaine différent (Vercel) et votre backend sur Render, vous devez configurer les cookies ainsi :

```
COOKIE_SECURE=true
COOKIE_SAME_SITE=None
# NE PAS définir COOKIE_DOMAIN (laissez-le vide ou ne l'ajoutez pas)
```

### Configuration complète sur Render

Dans le dashboard Render, allez dans **Environment** et configurez :

```
COOKIE_SECURE=true
COOKIE_SAME_SITE=None
```

**NE PAS définir `COOKIE_DOMAIN`** ou laissez-le vide.

### Pourquoi ?

1. **`COOKIE_SECURE=true`** : Obligatoire en HTTPS (Render utilise HTTPS)
2. **`COOKIE_SAME_SITE=None`** : Obligatoire pour les cookies cross-origin (frontend et backend sur des domaines différents)
3. **Pas de `COOKIE_DOMAIN`** : Si vous définissez `COOKIE_DOMAIN=celvox-backend.onrender.com`, le cookie ne sera accessible QUE depuis ce domaine, pas depuis Vercel

### Configuration pour développement local

Si vous testez en local (frontend et backend sur localhost), utilisez :

```
COOKIE_SECURE=false
COOKIE_SAME_SITE=Lax
COOKIE_DOMAIN=localhost
```

Mais pour la production avec Vercel + Render, utilisez la configuration cross-origin ci-dessus.

## Vérification

Après avoir configuré et redéployé :

1. Connectez-vous depuis votre frontend Vercel
2. Ouvrez les DevTools (F12) > Application > Cookies
3. Vous devriez voir un cookie `refreshToken` avec :
   - Domain : `.celvox-backend.onrender.com` ou similaire
   - Secure : ✅
   - SameSite : None
4. Actualisez la page - vous devriez rester connecté

## Dépannage

### Le cookie n'apparaît pas dans les DevTools

1. Vérifiez que `COOKIE_SECURE=true` et `COOKIE_SAME_SITE=None` sont configurés
2. Vérifiez que vous n'avez PAS défini `COOKIE_DOMAIN`
3. Vérifiez que votre frontend fait des requêtes avec `credentials: 'include'` (déjà configuré dans `api.js`)

### Le cookie apparaît mais vous êtes déconnecté après refresh

1. Vérifiez les logs Render pour voir si le refresh token est reçu
2. Vérifiez que le endpoint `/api/auth/refresh` fonctionne
3. Vérifiez la console du navigateur pour les erreurs

### Erreur "SameSite=None requires Secure"

Assurez-vous que `COOKIE_SECURE=true` est défini. `SameSite=None` nécessite `Secure=true`.

