import pool from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkAccounts() {
  try {
    const emails = ['augustinfachehoun97@gmail.com', 'kolabashorun@gmail.com', 'likeflybro@gmail.com'];
    
    console.log('🔍 Vérification des comptes pour les utilisateurs avec virements en attente...\n');
    
    for (const email of emails) {
      const [users] = await pool.execute('SELECT id, email, name FROM users WHERE email = ?', [email]);
      
      if (users.length > 0) {
        const user = users[0];
        const [accounts] = await pool.execute(
          'SELECT id, type, balance, label, created_at FROM accounts WHERE user_id = ?',
          [user.id]
        );
        
        console.log(`👤 ${user.name} (${user.email}) - ID: ${user.id}`);
        if (accounts.length > 0) {
          console.log(`   ✅ ${accounts.length} compte(s) existant(s):`);
          accounts.forEach(acc => {
            console.log(`      - Compte ${acc.id} (${acc.type}): ${acc.balance} EUR - Créé le ${acc.created_at}`);
          });
        } else {
          console.log(`   ⚠️  Aucun compte - Les virements en attente devraient être complétés lors de la création du premier compte`);
        }
        
        // Check pending transfers
        const [pending] = await pool.execute(
          `SELECT COUNT(*) as count, SUM(amount) as total
           FROM transactions
           WHERE status = 'pending'
           AND type = 'transfer'
           AND counterparty_email = ?
           AND related_account_id IS NULL`,
          [email]
        );
        
        if (pending[0].count > 0) {
          console.log(`   💰 ${pending[0].count} virement(s) en attente: ${pending[0].total} EUR`);
        }
        console.log('');
      }
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkAccounts();

