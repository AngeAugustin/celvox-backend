# Dépannage SMTP - Erreur 535 Authentication failed

## Problème
Erreur `535 Authentication failed` lors de la connexion au serveur SMTP Hostinger.

## Solutions à essayer

### 1. Vérifier les identifiants dans Hostinger
1. Connectez-vous à votre compte Hostinger
2. Allez dans **Email** > **Gestion des emails**
3. Vérifiez que l'email `noreply@celvox.org` existe bien
4. **Réinitialisez le mot de passe** de l'email si nécessaire
5. Utilisez le nouveau mot de passe dans votre `.env`

### 2. Essayer le port 465 avec SSL
Modifiez votre `.env` pour utiliser le port 465 :

```env
SMTP_PORT=465
SMTP_SECURE=true
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

### 3. Vérifier le format du mot de passe
Si votre mot de passe contient des caractères spéciaux (`@`, `#`, `$`, etc.), assurez-vous qu'ils sont correctement échappés dans le fichier `.env`.

**Important** : Ne mettez pas de guillemets autour du mot de passe dans le `.env`.

### 4. Tester avec un client email
Testez d'abord la connexion avec un client email (Thunderbird, Outlook) pour vérifier que les identifiants fonctionnent :
- Serveur SMTP : `smtp.hostinger.com`
- Port : `587` (TLS) ou `465` (SSL)
- Authentification : Oui
- Email : `noreply@celvox.org`
- Mot de passe : `Celvox@2025`

### 5. Vérifier les restrictions Hostinger
Certains hébergeurs imposent des restrictions :
- Vérifiez que l'email n'est pas désactivé
- Vérifiez qu'il n'y a pas de restrictions IP
- Vérifiez les limites d'envoi d'emails

### 6. Configuration alternative
Si le problème persiste, essayez cette configuration dans votre `.env` :

```env
# Option 1: Port 587 avec TLS
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@celvox.org
SMTP_PASS=Celvox@2025
SMTP_TLS_REJECT_UNAUTHORIZED=false

# Option 2: Port 465 avec SSL (essayez si Option 1 ne fonctionne pas)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@celvox.org
SMTP_PASS=Celvox@2025
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

### 7. Vérifier les logs
Après chaque modification, redémarrez le serveur et vérifiez les logs :
- ✅ `Serveur SMTP configuré avec succès` = Configuration correcte
- ❌ `Erreur de configuration SMTP` = Vérifiez les identifiants

## Contact Hostinger
Si le problème persiste après avoir essayé toutes ces solutions, contactez le support Hostinger pour :
- Vérifier que l'email est actif
- Vérifier les paramètres SMTP
- Vérifier s'il y a des restrictions sur votre compte

## Test rapide
Pour tester rapidement, créez un fichier `test-smtp.js` dans le dossier `backend/` :

```javascript
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur:', error);
  } else {
    console.log('✅ Serveur SMTP prêt');
  }
});
```

Exécutez avec : `node test-smtp.js`

