import pool from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPendingTransfers() {
  try {
    console.log('🔍 Test des virements en attente...\n');

    // Test 1: Vérifier les virements en attente dans la base
    const [allPending] = await pool.execute(
      `SELECT t.*, a.user_id as sender_user_id, u.email as sender_email
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE t.status = 'pending'
       AND t.type = 'transfer'
       ORDER BY t.created_at DESC
       LIMIT 10`
    );

    console.log(`📊 Total de virements en attente: ${allPending.length}\n`);

    if (allPending.length > 0) {
      console.log('Détails des virements en attente:');
      allPending.forEach((tx, index) => {
        console.log(`\n${index + 1}. Transaction ID: ${tx.id}`);
        console.log(`   Montant: ${tx.amount} EUR`);
        console.log(`   Email destinataire: ${tx.counterparty_email || 'NULL'}`);
        console.log(`   Expéditeur (user_id): ${tx.sender_user_id}`);
        console.log(`   Expéditeur (email): ${tx.sender_email || 'N/A'}`);
        console.log(`   Date: ${tx.created_at}`);
        console.log(`   related_account_id: ${tx.related_account_id || 'NULL'}`);
      });
    } else {
      console.log('ℹ️  Aucun virement en attente trouvé dans la base de données.');
    }

    // Test 2: Vérifier pour un email spécifique
    const testEmail = process.argv[2];
    if (testEmail) {
      console.log(`\n🔍 Recherche de virements en attente pour: ${testEmail}`);
      const [pendingForEmail] = await pool.execute(
        `SELECT t.*, a.user_id as sender_user_id
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         WHERE t.status = 'pending'
         AND t.type = 'transfer'
         AND t.counterparty_email = ?
         AND t.related_account_id IS NULL`,
        [testEmail]
      );

      console.log(`📊 ${pendingForEmail.length} virement(s) en attente trouvé(s) pour ${testEmail}`);
      if (pendingForEmail.length > 0) {
        pendingForEmail.forEach((tx, index) => {
          console.log(`   ${index + 1}. ${tx.amount} EUR - Transaction ID: ${tx.id}`);
        });
      }
    }

    // Test 3: Vérifier les utilisateurs et leurs emails
    console.log('\n👥 Liste des utilisateurs:');
    const [users] = await pool.execute('SELECT id, email, name FROM users LIMIT 10');
    users.forEach(user => {
      console.log(`   ID: ${user.id}, Email: ${user.email}, Nom: ${user.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testPendingTransfers();

