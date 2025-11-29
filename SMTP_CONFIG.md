# Configuration SMTP pour Hostinger

## Paramètres SMTP Hostinger

Pour configurer l'envoi d'emails avec Hostinger, ajoutez les variables suivantes dans votre fichier `.env` :

```env
# SMTP Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASS=votre-mot-de-passe-email
SMTP_FROM=noreply@votre-domaine.com
SMTP_FROM_NAME=BankApp
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

## Options de configuration

### Port 587 (TLS - Recommandé)
```env
SMTP_PORT=587
SMTP_SECURE=false
```

### Port 465 (SSL)
```env
SMTP_PORT=465
SMTP_SECURE=true
```

## Comment obtenir vos identifiants SMTP Hostinger

1. Connectez-vous à votre compte Hostinger
2. Allez dans **Email** > **Gestion des emails**
3. Créez une adresse email si vous n'en avez pas encore
4. Notez votre adresse email et votre mot de passe
5. Utilisez ces informations dans votre fichier `.env`

## Test de la configuration

Une fois configuré, le serveur vérifiera automatiquement la connexion SMTP au démarrage. Vous verrez un message :
- ✅ `Serveur SMTP configuré avec succès` si tout est correct
- ❌ `Erreur de configuration SMTP` en cas de problème

## Exemple de fichier .env complet

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=bank_app

# JWT
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Server
APP_PORT=4000
NODE_ENV=production
FRONTEND_URL=https://celvox-bank.vercel.app

# SMTP Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@votre-domaine.com
SMTP_PASS=votre-mot-de-passe-email
SMTP_FROM=noreply@votre-domaine.com
SMTP_FROM_NAME=BankApp
SMTP_TLS_REJECT_UNAUTHORIZED=false

# Business Rules
MAX_DAILY_TRANSFER=5000
ALLOW_OVERDRAFT=false
```

## Dépannage

### Erreur "Invalid login"
- Vérifiez que votre adresse email et mot de passe sont corrects
- Assurez-vous que l'email est bien créé dans Hostinger

### Erreur "Connection timeout"
- Vérifiez que le port 587 ou 465 n'est pas bloqué par votre firewall
- Essayez avec `SMTP_TLS_REJECT_UNAUTHORIZED=false`

### Emails non reçus
- Vérifiez le dossier spam
- Vérifiez les logs du serveur pour voir les erreurs
- Assurez-vous que `SMTP_FROM` correspond à une adresse email valide sur votre domaine

