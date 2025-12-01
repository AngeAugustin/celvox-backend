# Configuration Resend pour l'envoi d'emails

## Introduction

Ce projet utilise [Resend](https://resend.com) pour l'envoi d'emails transactionnels. Resend est un service moderne d'envoi d'emails via API qui remplace la configuration SMTP traditionnelle.

## Avantages de Resend

- ✅ Configuration simple avec une seule clé API
- ✅ Pas besoin de configuration SMTP complexe
- ✅ Meilleure délivrabilité
- ✅ Analytics et tracking intégrés
- ✅ Support pour les domaines vérifiés

## Configuration

### 1. Créer un compte Resend

1. Allez sur https://resend.com
2. Créez un compte gratuit (100 emails/jour en version gratuite)
3. Vérifiez votre email

### 2. Créer une clé API

1. Dans votre dashboard Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Donnez un nom à votre clé (ex: "Celvox Production")
4. Copiez la clé API (elle commence par `re_`)
5. ⚠️ **Important** : Sauvegardez-la immédiatement, vous ne pourrez plus la voir après

### 3. Vérifier votre domaine

1. Dans votre dashboard Resend, allez dans **Settings** > **Domains**
2. Cliquez sur **Add Domain**
3. Entrez votre domaine (ex: `celvox.org`)
4. Suivez les instructions pour ajouter les enregistrements DNS :
   - Un enregistrement SPF
   - Un enregistrement DKIM
   - Un enregistrement DMARC (optionnel mais recommandé)
5. Attendez la vérification (peut prendre quelques minutes)

### 4. Configurer les variables d'environnement

Ajoutez les variables suivantes dans votre fichier `.env` :

```env
# Resend Configuration
RESEND_API_KEY=re_votre_cle_api_ici
RESEND_FROM_EMAIL=noreply@celvox.org
SMTP_FROM_NAME=BankApp
```

**Note** : `SMTP_FROM` est conservé pour compatibilité, mais `RESEND_FROM_EMAIL` est utilisé en priorité.

## Test de la configuration

Pour tester votre configuration Resend, exécutez :

```bash
npm run test-email
```

Vous devriez voir :
- ✅ `Email de test envoyé avec succès!` si tout fonctionne
- ❌ Un message d'erreur avec des instructions si quelque chose ne va pas

## Exemple de fichier .env complet

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
FRONTEND_URL=https://celvox-bank.vercel.app

# Email Configuration (Resend)
RESEND_API_KEY=re_votre_cle_api_ici
RESEND_FROM_EMAIL=noreply@celvox.org
SMTP_FROM_NAME=BankApp

# Business Rules
MAX_DAILY_TRANSFER=5000
ALLOW_OVERDRAFT=false
```

## Dépannage

### Erreur "Invalid API key"

- Vérifiez que votre clé API est correcte
- Assurez-vous qu'elle commence par `re_`
- Vérifiez qu'elle n'a pas expiré ou été révoquée

### Erreur "Domain not verified"

- Allez dans Settings > Domains dans votre dashboard Resend
- Vérifiez que votre domaine est bien vérifié
- Vérifiez que les enregistrements DNS sont correctement configurés
- Attendez quelques minutes si vous venez de les ajouter

### Erreur "From email must be from a verified domain"

- Assurez-vous que l'email dans `RESEND_FROM_EMAIL` utilise un domaine vérifié
- Par exemple, si votre domaine vérifié est `celvox.org`, utilisez `noreply@celvox.org`

### Les emails ne sont pas envoyés

1. Vérifiez les logs du serveur pour voir les erreurs
2. Exécutez `npm run test-email` pour tester la configuration
3. Vérifiez votre quota dans le dashboard Resend (100 emails/jour en version gratuite)
4. Vérifiez que votre domaine est bien vérifié

## Migration depuis SMTP

Si vous migrez depuis une configuration SMTP (comme Hostinger), vous pouvez supprimer ces variables :

```env
# Ces variables ne sont plus nécessaires avec Resend
# SMTP_HOST=smtp.hostinger.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=noreply@celvox.org
# SMTP_PASS=Celvox@2025
# SMTP_TLS_REJECT_UNAUTHORIZED=false
```

Gardez uniquement :
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SMTP_FROM_NAME` (pour le nom d'affichage)

## Support

Pour plus d'aide :
- Documentation Resend : https://resend.com/docs
- Support Resend : support@resend.com
