# Configuration de la base de données

## Étape 1 : Créer le fichier .env

Créez un fichier `.env` dans le dossier `backend/` avec le contenu suivant :

```env
# DB
DB_HOST=srv1733.hstgr.io
DB_PORT=3306
DB_USER=u976229909_admindb
DB_PASS=gy##c@3kC
DB_NAME=u976229909_bankappdb

# JWT
JWT_ACCESS_SECRET=verysecret_access_key_change_in_production
JWT_REFRESH_SECRET=another_very_secret_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Cookie
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
COOKIE_SAME_SITE=Lax

# Mail
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
SMTP_FROM=noreply@bankapp.com

# App
APP_PORT=4000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Limits
MAX_DAILY_TRANSFER=5000
ALLOW_OVERDRAFT=false
```

**Note** : L'adresse du serveur Hostinger est déjà configurée : `srv1733.hstgr.io`

## Étape 2 : Installer les dépendances

```bash
cd backend
npm install
```

## Étape 3 : Créer les tables

Exécutez la migration pour créer toutes les tables nécessaires :

```bash
npm run migrate
```

## Étape 4 : Créer les utilisateurs de test (optionnel)

Pour créer des comptes de test (admin et utilisateur) :

```bash
npm run seed
```

Cela créera :
- **Admin** : admin@bankapp.com / admin123
- **Utilisateur** : test@bankapp.com / test123

## Étape 5 : Démarrer le serveur

```bash
npm run dev
```

Le serveur sera accessible sur http://localhost:4000

## Dépannage

### Erreur de connexion à la base de données

1. Vérifiez que `DB_HOST` correspond à l'adresse de votre serveur MySQL
2. Vérifiez que le port `DB_PORT` est correct (3306 par défaut)
3. Vérifiez que les identifiants (`DB_USER` et `DB_PASS`) sont corrects
4. Vérifiez que la base de données `DB_NAME` existe

### Erreur "Access denied"

Assurez-vous que l'utilisateur MySQL a les permissions nécessaires sur la base de données.

