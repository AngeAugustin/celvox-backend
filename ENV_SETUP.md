# Configuration du fichier .env

## Instructions

Créez un fichier `.env` dans le dossier `backend/` avec le contenu suivant :

```env
# Database Configuration
DB_HOST=srv1733.hstgr.io
DB_PORT=3306
DB_USER=u976229909_admindb
DB_PASS=BankAdmin@2025
DB_NAME=u976229909_bankapp

# JWT Configuration
JWT_ACCESS_SECRET=your-access-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
APP_PORT=4000
NODE_ENV=development
# Pour le développement local
# FRONTEND_URL=http://localhost:3000
# Pour la production, utilisez :
FRONTEND_URL=https://celvox-bank.vercel.app

# Email Configuration (Resend)
# Pour obtenir une clé API Resend :
# 1. Créez un compte sur https://resend.com
# 2. Allez dans API Keys et créez une nouvelle clé
# 3. Vérifiez votre domaine dans Settings > Domains
RESEND_API_KEY=re_votre_cle_api_ici
RESEND_FROM_EMAIL=noreply@celvox.org
SMTP_FROM_NAME=BankApp

# Note: SMTP_FROM est conservé pour compatibilité, mais RESEND_FROM_EMAIL est utilisé en priorité

# Business Rules
MAX_DAILY_TRANSFER=5000
ALLOW_OVERDRAFT=false
```

## Vérification

Une fois le fichier créé, redémarrez le serveur backend. Vous devriez voir :
- ✅ `Resend configuré avec succès` si la configuration est correcte

## Test d'envoi d'email

Pour tester la configuration Resend, exécutez :
```bash
npm run test-email
```

Pour tester l'envoi d'emails en conditions réelles, effectuez un virement par email depuis l'interface. Le destinataire recevra un email avec :
- Le montant du virement
- Les informations de l'expéditeur
- Un lien pour accéder à son compte

## Configuration Resend

1. **Créer un compte Resend** : https://resend.com
2. **Créer une clé API** : Allez dans API Keys et créez une nouvelle clé
3. **Vérifier votre domaine** : Allez dans Settings > Domains et ajoutez/vérifiez votre domaine
4. **Ajouter les variables d'environnement** : Ajoutez `RESEND_API_KEY` et `RESEND_FROM_EMAIL` dans votre `.env`

