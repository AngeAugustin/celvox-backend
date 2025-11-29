# Guide de déploiement sur Render

Ce guide vous explique comment déployer le backend Celvox sur Render.

## Prérequis

1. Un compte Render (gratuit) : [https://render.com](https://render.com)
2. Un dépôt Git (GitHub, GitLab, ou Bitbucket) avec votre code
3. Accès à votre base de données MySQL (Hostinger ou autre)

## Étape 1 : Préparer votre dépôt Git

Assurez-vous que votre code est poussé sur GitHub/GitLab/Bitbucket :

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Étape 2 : Créer un nouveau service Web sur Render

1. Connectez-vous à [Render Dashboard](https://dashboard.render.com)
2. Cliquez sur **"New +"** puis **"Web Service"**
3. Connectez votre dépôt Git si ce n'est pas déjà fait
4. Sélectionnez le dépôt `celvox-app`

## Étape 3 : Configurer le service

### Configuration de base

- **Name** : `celvox-backend` (ou le nom de votre choix)
- **Region** : Choisissez la région la plus proche de vos utilisateurs
- **Branch** : `main` (ou votre branche principale)
- **Root Directory** : `backend`
- **Environment** : `Node`
- **Build Command** : `npm install`
- **Start Command** : `npm start`

### Variables d'environnement

Cliquez sur **"Environment"** et ajoutez toutes les variables suivantes :

#### Base de données
```
DB_HOST=srv1733.hstgr.io
DB_PORT=3306
DB_USER=u976229909_admindb
DB_PASS=gy##c@3kC
DB_NAME=u976229909_bankappdb
```

#### JWT (IMPORTANT : Changez ces valeurs en production !)
```
JWT_ACCESS_SECRET=votre_secret_access_tres_securise_en_production
JWT_REFRESH_SECRET=votre_secret_refresh_tres_securise_en_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

#### Cookies
```
COOKIE_DOMAIN=votre-domaine-render.onrender.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=None
```

**Note** : Pour `COOKIE_DOMAIN`, utilisez votre URL Render (ex: `celvox-backend.onrender.com`).  
Pour `COOKIE_SECURE`, utilisez `true` en production (Render utilise HTTPS).  
Pour `COOKIE_SAME_SITE`, utilisez `None` si votre frontend est sur un domaine différent.

#### Email (SMTP)
```
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=votre_email_smtp 
SMTP_PASS=votre_mot_de_passe_smtp
SMTP_FROM=noreply@celvox.com
```

**Note** : Configurez un service SMTP réel (Gmail, SendGrid, Mailgun, etc.) pour la production.

#### Application
```
NODE_ENV=production
FRONTEND_URL=https://votre-frontend.com,http://localhost:3000
MAX_DAILY_TRANSFER=5000
ALLOW_OVERDRAFT=false
ALLOW_LOCALHOST=true
```

**Note** : 
- Remplacez `FRONTEND_URL` par l'URL réelle de votre frontend déployé.
- Pour permettre le développement local, vous pouvez :
  - **Option 1** : Ajouter plusieurs URLs séparées par des virgules : `https://celvox-bank.vercel.app,http://localhost:3000`
  - **Option 2** : Ajouter `ALLOW_LOCALHOST=true` pour autoriser automatiquement `http://localhost:3000` en plus de `FRONTEND_URL`

### Port

Render fournit automatiquement la variable `PORT`. Le serveur est configuré pour l'utiliser automatiquement.

## Étape 4 : Déployer

1. Cliquez sur **"Create Web Service"**
2. Render va automatiquement :
   - Cloner votre dépôt
   - Installer les dépendances (`npm install`)
   - Démarrer le serveur (`npm start`)

## Étape 5 : Vérifier le déploiement

1. Attendez que le build se termine (2-5 minutes)
2. Une fois déployé, votre backend sera accessible sur : `https://celvox-backend.onrender.com`
3. Testez l'endpoint de santé : `https://celvox-backend.onrender.com/api/health` (si disponible)

## Configuration de la base de données

### Autoriser l'accès depuis Render

Si votre base de données MySQL est sur Hostinger, vous devez autoriser l'accès depuis les IPs de Render :

1. Connectez-vous à votre panneau Hostinger
2. Allez dans **"Bases de données"** > **"Accès à distance"**
3. Ajoutez les plages d'IP de Render (ou autorisez toutes les IPs `%` temporairement pour tester)

**Note** : Les IPs de Render peuvent changer. Pour une solution plus robuste, considérez :
- Utiliser une base de données gérée par Render
- Utiliser un VPN ou un tunnel SSH
- Configurer un whitelist dynamique

## Configuration CORS

Le backend est configuré pour accepter les requêtes depuis plusieurs origines. Vous avez deux options :

### Option 1 : URLs multiples (recommandé)
Configurez `FRONTEND_URL` avec plusieurs URLs séparées par des virgules :
```
FRONTEND_URL=https://celvox-bank.vercel.app,http://localhost:3000
```

### Option 2 : Autoriser localhost automatiquement
Configurez `FRONTEND_URL` avec votre URL de production et ajoutez `ALLOW_LOCALHOST=true` :
```
FRONTEND_URL=https://celvox-bank.vercel.app
ALLOW_LOCALHOST=true
```

Cela permettra automatiquement les requêtes depuis `http://localhost:3000` en plus de l'URL de production.

## Mises à jour automatiques

Render peut être configuré pour déployer automatiquement à chaque push sur votre branche principale :

1. Allez dans **Settings** de votre service
2. Activez **"Auto-Deploy"**
3. Choisissez la branche (ex: `main`)

## Logs et monitoring

- **Logs** : Cliquez sur **"Logs"** dans le dashboard Render pour voir les logs en temps réel
- **Metrics** : Render fournit des métriques de base (CPU, mémoire, etc.)

## Dépannage

### Le service ne démarre pas

1. Vérifiez les logs dans le dashboard Render
2. Vérifiez que toutes les variables d'environnement sont définies
3. Vérifiez que la connexion à la base de données fonctionne

### Erreur de connexion à la base de données

1. Vérifiez que `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` sont corrects
2. Vérifiez que votre base de données autorise les connexions depuis Render
3. Testez la connexion depuis votre machine locale avec les mêmes identifiants

### Erreur "Port already in use"

Le serveur utilise maintenant `process.env.PORT` automatiquement. Cette erreur ne devrait plus se produire.

### Le service se met en veille (plan gratuit)

Sur le plan gratuit, Render met les services en veille après 15 minutes d'inactivité. Le premier démarrage peut prendre 30-60 secondes.

Pour éviter cela :
- Utilisez un service de ping (UptimeRobot, etc.) pour maintenir le service actif
- Passez au plan payant

## Sécurité

⚠️ **IMPORTANT** :

1. **Ne commitez jamais** votre fichier `.env` dans Git
2. Changez tous les secrets JWT en production
3. Utilisez des mots de passe forts pour la base de données
4. Configurez `COOKIE_SECURE=true` en production
5. Limitez `FRONTEND_URL` à votre domaine réel
6. Activez le rate limiting (déjà configuré)

## Coûts

- **Plan gratuit** : 
  - Service en veille après 15 min d'inactivité
  - 750 heures/mois gratuites
  - Limites de ressources
  
- **Plan payant** : 
  - Service toujours actif
  - Plus de ressources
  - Support prioritaire

## Support

Pour plus d'aide :
- [Documentation Render](https://render.com/docs)
- [Support Render](https://render.com/support)

