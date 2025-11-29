# Dépannage des problèmes de base de données

## Erreur : "Access denied for user 'u976229909_admindb'@'%' to database 'u976229909_bankapp'"

Cette erreur indique que l'utilisateur MySQL n'a pas les permissions nécessaires pour accéder à la base de données.

### Solutions possibles

#### 1. Vérifier le nom de la base de données dans le fichier .env

Le nom de la base de données dans votre fichier `.env` doit correspondre exactement au nom de la base de données dans votre hébergeur MySQL.

Vérifiez votre fichier `backend/.env` :

```env
DB_NAME=u976229909_bankapp
```

**Important** : Le nom doit être exactement le même que celui dans votre panneau d'administration Hostinger.

#### 2. Vérifier les permissions de l'utilisateur MySQL

Dans votre panneau d'administration Hostinger (ou phpMyAdmin) :

1. Allez dans **Bases de données MySQL**
2. Vérifiez que l'utilisateur `u976229909_admindb` a bien accès à la base de données `u976229909_bankapp`
3. Si nécessaire, accordez les permissions suivantes :
   - SELECT
   - INSERT
   - UPDATE
   - DELETE
   - CREATE
   - ALTER
   - INDEX

#### 3. Vérifier que la base de données existe

Assurez-vous que la base de données `u976229909_bankapp` existe bien dans votre hébergeur.

#### 4. Vérifier les identifiants de connexion

Dans votre fichier `backend/.env`, vérifiez que :

```env
DB_HOST=srv1733.hstgr.io
DB_PORT=3306
DB_USER=u976229909_admindb
DB_PASS=votre_mot_de_passe
DB_NAME=u976229909_bankapp
```

**Note** : Le nom de la base de données peut varier. Vérifiez dans votre panneau d'administration le nom exact.

### Test de connexion

Pour tester la connexion, vous pouvez utiliser cette commande dans le terminal :

```bash
cd backend
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();
mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
}).then(conn => {
  console.log('✅ Connexion réussie !');
  conn.end();
}).catch(err => {
  console.error('❌ Erreur:', err.message);
});
"
```

### Créer les tables

Une fois la connexion établie, créez les tables nécessaires :

```bash
cd backend
npm run migrate
```

### Problèmes courants

#### Le nom de la base de données est différent

Si votre base de données s'appelle `u976229909_bankappdb` au lieu de `u976229909_bankapp`, mettez à jour votre `.env` :

```env
DB_NAME=u976229909_bankappdb
```

#### L'utilisateur n'a pas les bonnes permissions

Si vous avez accès à phpMyAdmin ou à l'interface MySQL de Hostinger :

1. Connectez-vous avec un compte administrateur
2. Allez dans **Privilèges** ou **Users**
3. Trouvez l'utilisateur `u976229909_admindb`
4. Cliquez sur **Modifier les privilèges**
5. Sélectionnez la base de données `u976229909_bankapp`
6. Cochez toutes les permissions nécessaires
7. Cliquez sur **Exécuter**

### Support

Si le problème persiste :
1. Vérifiez les logs du serveur backend
2. Vérifiez les logs dans votre panneau d'administration Hostinger
3. Contactez le support Hostinger si nécessaire

