# 🔧 Configuration Hostinger SMTP pour Render

## ✅ Hostinger est compatible avec Render !

Hostinger fonctionne parfaitement avec Render. Le problème de timeout est généralement dû à la configuration SMTP.

## Configuration recommandée pour Render

### Option 1 : Port 587 avec TLS (Recommandé)

Dans le dashboard Render, configurez ces variables d'environnement :

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASS=votre_mot_de_passe_email
SMTP_FROM=noreply@votre-domaine.com
SMTP_FROM_NAME=CELVOX
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

### Option 2 : Port 465 avec SSL (Si le port 587 ne fonctionne pas)

Si vous avez des problèmes avec le port 587, essayez le port 465 :

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASS=votre_mot_de_passe_email
SMTP_FROM=noreply@votre-domaine.com
SMTP_FROM_NAME=CELVOX
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

## Vérifications importantes

### 1. Vérifier que l'email existe dans Hostinger

1. Connectez-vous à votre panneau Hostinger
2. Allez dans **Email** > **Gestion des emails**
3. Vérifiez que l'email existe (ex: `noreply@celvox.org`)
4. Si l'email n'existe pas, créez-le

### 2. Vérifier le mot de passe

- Le mot de passe doit être celui de l'email, pas celui de votre compte Hostinger
- Si vous avez des doutes, réinitialisez le mot de passe de l'email dans Hostinger
- Utilisez le nouveau mot de passe dans Render

### 3. Vérifier les restrictions Hostinger

Certains plans Hostinger peuvent avoir des restrictions :
- Vérifiez que l'email n'est pas désactivé
- Vérifiez qu'il n'y a pas de limites d'envoi atteintes
- Vérifiez qu'il n'y a pas de restrictions IP (normalement pas de problème avec Render)

## Améliorations apportées

Les modifications suivantes ont été faites pour améliorer la compatibilité avec Render :

1. ✅ **Timeouts augmentés** : 60 secondes pour la connexion (au lieu de 10)
2. ✅ **Configuration TLS améliorée** : Utilisation de TLSv1.2 minimum
3. ✅ **Pooling désactivé** : Meilleure compatibilité avec les serveurs SMTP
4. ✅ **Gestion d'erreur améliorée** : Les erreurs email ne bloquent plus les fonctionnalités

## Test de la configuration

Après avoir configuré les variables sur Render :

1. **Redéployez votre backend** sur Render
2. **Vérifiez les logs** au démarrage - vous devriez voir :
   - ✅ `Serveur SMTP configuré avec succès` si tout est correct
   - ❌ `Erreur de configuration SMTP` en cas de problème

3. **Testez l'envoi d'email** :
   - Utilisez la fonctionnalité "Mot de passe oublié"
   - Vérifiez les logs Render pour voir si l'email est envoyé
   - Vérifiez votre boîte email (et le dossier spam)

## Dépannage

### Erreur "Connection timeout"

1. **Essayez le port 465** au lieu de 587
2. **Vérifiez que `SMTP_TLS_REJECT_UNAUTHORIZED=false`** est défini
3. **Vérifiez les logs Render** pour voir l'erreur exacte
4. **Testez en local** avec `test-smtp.js` pour vérifier que les credentials fonctionnent

### Erreur "Authentication failed" (535)

1. **Vérifiez que l'email existe** dans Hostinger
2. **Vérifiez le mot de passe** - réinitialisez-le si nécessaire
3. **Essayez le port 465** avec `SMTP_SECURE=true`

### L'email n'est pas reçu

1. **Vérifiez le dossier spam**
2. **Vérifiez les logs Render** pour confirmer l'envoi
3. **Vérifiez que `SMTP_FROM`** correspond à une adresse email valide sur votre domaine Hostinger

## Configuration complète sur Render

Voici toutes les variables d'environnement que vous devriez avoir :

```
# Base de données
DB_HOST=srv1733.hstgr.io
DB_PORT=3306
DB_USER=u976229909_admindb
DB_PASS=votre_mot_de_passe_db
DB_NAME=u976229909_bankappdb

# JWT
JWT_ACCESS_SECRET=votre_secret_access
JWT_REFRESH_SECRET=votre_secret_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Cookies
COOKIE_SECURE=true
COOKIE_SAME_SITE=None

# SMTP Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@celvox.org
SMTP_PASS=votre_mot_de_passe_email
SMTP_FROM=noreply@celvox.org
SMTP_FROM_NAME=CELVOX
SMTP_TLS_REJECT_UNAUTHORIZED=false

# Application
NODE_ENV=production
FRONTEND_URL=https://celvox-bank.vercel.app,http://localhost:3000
ALLOW_LOCALHOST=true
MAX_DAILY_TRANSFER=5000
ALLOW_OVERDRAFT=false
```

## Note importante

Si après avoir essayé toutes ces configurations, vous avez toujours des problèmes de timeout, cela peut être dû à :
- Des restrictions réseau entre Render et Hostinger
- Des limitations de votre plan Hostinger
- Des problèmes temporaires de réseau

Dans ce cas, vous pouvez :
1. Contacter le support Hostinger pour vérifier les restrictions
2. Utiliser un service SMTP dédié (SendGrid, Mailgun) qui est optimisé pour les serveurs cloud

Mais normalement, avec la bonne configuration, Hostinger devrait fonctionner parfaitement avec Render ! ✅

