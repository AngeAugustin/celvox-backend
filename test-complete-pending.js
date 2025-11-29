import { completePendingTransfers } from './src/services/transactionService.js';
import pool from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCompletePending() {
  try {
    // Test avec l'utilisateur likeflybro@gmail.com (ID: 5)
    const userId = 5;
    const testEmail = 'likeflybro@gmail.com';
    
    console.log(`🧪 Test de complétion des virements pour l'utilisateur ${userId} (${testEmail})\n`);
    
    // Vérifier les virements en attente avant
    const [pendingBefore] = await pool.execute(
      `SELECT COUNT(*) as count, SUM(amount) as total
       FROM transactions
       WHERE status = 'pending'
       AND type = 'transfer'
       AND counterparty_email = ?
       AND related_account_id IS NULL`,
      [testEmail]
    );
    
    console.log(`📊 Avant: ${pendingBefore[0].count} virement(s) en attente, total: ${pendingBefore[0].total || 0} EUR\n`);
    
    // Vérifier si l'utilisateur a un compte
    const [accounts] = await pool.execute(
      'SELECT id, type, balance FROM accounts WHERE user_id = ?',
      [userId]
    );
    
    if (accounts.length === 0) {
      console.log('⚠️  L\'utilisateur n\'a pas de compte. Créez un compte d\'abord.');
      process.exit(1);
    }
    
    const accountId = accounts[0].id;
    console.log(`📁 Utilisation du compte ${accountId} (${accounts[0].type}), solde actuel: ${accounts[0].balance} EUR\n`);
    
    // Tester la complétion
    console.log('🔄 Appel de completePendingTransfers...\n');
    const result = await completePendingTransfers(userId, accountId, null);
    
    console.log(`\n✅ Résultat:`);
    console.log(`   - Virements complétés: ${result.completed}`);
    console.log(`   - Montant total: ${result.totalAmount.toFixed(2)} EUR\n`);
    
    // Vérifier les virements en attente après
    const [pendingAfter] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM transactions
       WHERE status = 'pending'
       AND type = 'transfer'
       AND counterparty_email = ?
       AND related_account_id IS NULL`,
      [testEmail]
    );
    
    console.log(`📊 Après: ${pendingAfter[0].count} virement(s) en attente restant(s)\n`);
    
    // Vérifier le solde du compte
    const [updatedAccount] = await pool.execute(
      'SELECT balance FROM accounts WHERE id = ?',
      [accountId]
    );
    
    console.log(`💰 Nouveau solde du compte: ${updatedAccount[0].balance} EUR`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCompletePending();

