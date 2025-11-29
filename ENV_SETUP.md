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

# SMTP Configuration (Hostinger)
# Si vous avez une erreur 535 (Authentication failed), essayez :
# 1. Vérifiez que le mot de passe est correct dans Hostinger
# 2. Essayez le port 465 avec SMTP_SECURE=true
# 3. Assurez-vous que l'email existe bien dans Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@celvox.org
SMTP_PASS=Celvox@2025
SMTP_FROM=noreply@celvox.org
SMTP_FROM_NAME=BankApp
SMTP_TLS_REJECT_UNAUTHORIZED=false

# Alternative: Port 465 avec SSL (si 587 ne fonctionne pas)
# SMTP_PORT=465
# SMTP_SECURE=true

# Business Rules
MAX_DAILY_TRANSFER=5000
ALLOW_OVERDRAFT=false
```

## Vérification

Une fois le fichier créé, redémarrez le serveur backend. Vous devriez voir :
- ✅ `Serveur SMTP configuré avec succès` si la configuration est correcte

## Test d'envoi d'email

Pour tester l'envoi d'emails, effectuez un virement par email depuis l'interface. Le destinataire recevra un email avec :
- Le montant du virement
- Les informations de l'expéditeur
- Un lien pour accéder à son compte

