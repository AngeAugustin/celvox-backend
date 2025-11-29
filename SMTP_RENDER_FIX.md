# 🔧 Résolution du problème SMTP sur Render

## Problème
Vous recevez l'erreur `Connection timeout` lors de l'envoi d'emails depuis Render.

## Causes possibles

1. **Le serveur SMTP Hostinger n'est pas accessible depuis Render**
   - Les serveurs Render peuvent avoir des restrictions réseau
   - Certains fournisseurs SMTP bloquent les connexions depuis des serveurs cloud

2. **Configuration SMTP incorrecte**
   - Variables d'environnement manquantes ou incorrectes
   - Port bloqué

3. **Timeouts trop courts**
   - Les connexions peuvent prendre plus de temps depuis Render

## Solutions

### Solution 1 : Utiliser un service SMTP dédié (Recommandé)

Pour la production, utilisez un service SMTP fiable comme :

#### Option A : SendGrid (Gratuit jusqu'à 100 emails/jour)

1. Créez un compte sur [SendGrid](https://sendgrid.com)
2. Créez une API Key
3. Configurez sur Render :

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=votre_api_key_sendgrid
SMTP_FROM=noreply@votre-domaine.com
SMTP_FROM_NAME=CELVOX
```

#### Option B : Mailgun (Gratuit jusqu'à 5000 emails/mois)

1. Créez un compte sur [Mailgun](https://www.mailgun.com)
2. Obtenez vos credentials SMTP
3. Configurez sur Render :

```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@votre-domaine.mailgun.org
SMTP_PASS=votre_mot_de_passe_mailgun
SMTP_FROM=noreply@votre-domaine.com
SMTP_FROM_NAME=CELVOX
```

#### Option C : Gmail SMTP (Pour tests uniquement)

⚠️ **Attention** : Gmail a des limites strictes et peut bloquer votre compte.

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre_mot_de_passe_application
SMTP_FROM=votre-email@gmail.com
SMTP_FROM_NAME=CELVOX
```

**Note** : Pour Gmail, vous devez créer un "Mot de passe d'application" dans les paramètres de sécurité.

### Solution 2 : Vérifier la configuration Hostinger

Si vous voulez continuer avec Hostinger :

1. **Vérifiez les variables d'environnement sur Render** :
   - Allez dans **Environment** de votre service
   - Vérifiez que toutes les variables SMTP sont définies

2. **Essayez le port 465 avec SSL** :
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASS=votre_mot_de_passe
SMTP_FROM=noreply@votre-domaine.com
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

3. **Vérifiez que l'email existe dans Hostinger** :
   - Connectez-vous à votre panneau Hostinger
   - Allez dans **Email** > **Gestion des emails**
   - Vérifiez que l'email existe et que le mot de passe est correct

### Solution 3 : Configuration actuelle améliorée

Les timeouts ont été augmentés à 30 secondes. Vérifiez que vous avez bien ces variables sur Render :

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASS=votre_mot_de_passe
SMTP_FROM=noreply@votre-domaine.com
SMTP_FROM_NAME=CELVOX
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

## Améliorations apportées

1. ✅ **Timeouts augmentés** : De 10 à 30 secondes
2. ✅ **Gestion d'erreur améliorée** : L'erreur email ne bloque plus la génération du code de réinitialisation
3. ✅ **Messages d'erreur en français** : Messages plus clairs pour l'utilisateur

## Test

Après avoir configuré un service SMTP fiable :

1. Redéployez votre backend sur Render
2. Testez la fonctionnalité "Mot de passe oublié"
3. Vérifiez les logs Render pour voir si l'email est envoyé
4. Vérifiez votre boîte email (et le dossier spam)

## Dépannage

### L'email n'est toujours pas envoyé

1. **Vérifiez les logs Render** : Regardez les erreurs SMTP dans les logs
2. **Testez la connexion SMTP** : Utilisez `test-smtp.js` en local avec les mêmes credentials
3. **Vérifiez le dossier spam** : Les emails peuvent être filtrés
4. **Contactez le support du service SMTP** : Ils peuvent avoir des restrictions

### Erreur "Authentication failed"

- Vérifiez que le mot de passe/API key est correct
- Pour Gmail, utilisez un "Mot de passe d'application"
- Pour SendGrid, utilisez `apikey` comme username et votre API key comme password

### Erreur "Connection timeout"

- Le serveur SMTP n'est pas accessible depuis Render
- **Solution** : Utilisez un service SMTP dédié (SendGrid, Mailgun) qui est conçu pour les serveurs cloud

## Recommandation

Pour la production, **utilisez SendGrid ou Mailgun**. Ces services sont :
- ✅ Conçus pour les serveurs cloud
- ✅ Plus fiables que les serveurs SMTP d'hébergement
- ✅ Offrent des statistiques d'envoi
- ✅ Ont des plans gratuits généreux
- ✅ Supportent mieux les envois depuis Render

