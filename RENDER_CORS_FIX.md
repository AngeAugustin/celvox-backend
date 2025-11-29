# 🔧 Configuration CORS pour Render - Guide rapide

## Problème
Les requêtes depuis le frontend sont bloquées par CORS.

## Solution : Configurer les variables d'environnement sur Render

### Étape 1 : Aller dans le Dashboard Render

1. Connectez-vous à [Render Dashboard](https://dashboard.render.com)
2. Sélectionnez votre service backend (`celvox-backend`)
3. Allez dans **"Environment"** dans le menu de gauche

### Étape 2 : Configurer les variables d'environnement

Ajoutez ou modifiez ces variables :

```
FRONTEND_URL=https://celvox-bank.vercel.app,http://localhost:3000
ALLOW_LOCALHOST=true
NODE_ENV=production
```

**Explication :**
- `FRONTEND_URL` : Liste des URLs autorisées, séparées par des virgules
  - `https://celvox-bank.vercel.app` : Votre frontend en production
  - `http://localhost:3000` : Pour le développement local
- `ALLOW_LOCALHOST=true` : Autorise automatiquement localhost même en production
- `NODE_ENV=production` : Indique que vous êtes en production

### Étape 3 : Sauvegarder et redéployer

1. Cliquez sur **"Save Changes"**
2. Render redéploiera automatiquement votre service
3. Attendez la fin du déploiement (2-5 minutes)

### Étape 4 : Vérifier les logs

Après le redéploiement, vérifiez les logs. Vous devriez voir :

```
🌐 Allowed CORS origins: [ 'https://celvox-bank.vercel.app', 'http://localhost:3000' ]
🌐 NODE_ENV: production
🌐 ALLOW_LOCALHOST: true
🌐 FRONTEND_URL: https://celvox-bank.vercel.app,http://localhost:3000
```

## Configuration complète recommandée

Voici toutes les variables d'environnement que vous devriez avoir sur Render :

```
# Base de données
DB_HOST=srv1733.hstgr.io
DB_PORT=3306
DB_USER=u976229909_admindb
DB_PASS=gy##c@3kC
DB_NAME=u976229909_bankappdb

# JWT (Changez ces valeurs en production !)
JWT_ACCESS_SECRET=votre_secret_access_tres_securise
JWT_REFRESH_SECRET=votre_secret_refresh_tres_securise
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Cookies (IMPORTANT pour cross-origin)
# NE PAS définir COOKIE_DOMAIN pour les cookies cross-origin (frontend Vercel + backend Render)
COOKIE_SECURE=true
COOKIE_SAME_SITE=None
# COOKIE_DOMAIN=  (laissez vide ou ne définissez pas cette variable)

# Email (SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=votre_email_smtp
SMTP_PASS=votre_mot_de_passe_smtp
SMTP_FROM=noreply@celvox.com

# Application
NODE_ENV=production
FRONTEND_URL=https://celvox-bank.vercel.app,http://localhost:3000
ALLOW_LOCALHOST=true
MAX_DAILY_TRANSFER=5000
ALLOW_OVERDRAFT=false
```

## Test rapide

Après le redéploiement, testez depuis votre frontend :
- Production : https://celvox-bank.vercel.app
- Local : http://localhost:3000

Les deux devraient fonctionner maintenant ! ✅

## Dépannage

### Si ça ne fonctionne toujours pas

1. **Vérifiez les logs Render** : Regardez les logs au démarrage pour voir les origines autorisées
2. **Vérifiez les variables** : Assurez-vous que `FRONTEND_URL` contient bien toutes les URLs
3. **Videz le cache du navigateur** : Parfois le navigateur cache les erreurs CORS
4. **Vérifiez l'URL exacte** : Assurez-vous que l'URL dans `FRONTEND_URL` correspond exactement à celle utilisée par le navigateur (avec ou sans `/` à la fin)

### URLs Vercel avec préfixes

Si Vercel génère des URLs avec des préfixes (comme `celvox-bank-ztg9dq7qq-augustins-projects-970e4196.vercel.app`), vous pouvez :

**Option 1** : Ajouter toutes les URLs dans `FRONTEND_URL` :
```
FRONTEND_URL=https://celvox-bank.vercel.app,https://celvox-bank-ztg9dq7qq-augustins-projects-970e4196.vercel.app,http://localhost:3000
```

**Option 2** : Utiliser un pattern wildcard (nécessite une modification du code)

Pour l'instant, l'option 1 est la plus simple et la plus sûre.

