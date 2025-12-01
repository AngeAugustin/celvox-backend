import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Test de connexion Resend...\n');

// Afficher la configuration (sans la clé API complète)
console.log('Configuration:');
console.log(`  API Key: ${process.env.RESEND_API_KEY ? 're_' + process.env.RESEND_API_KEY.substring(0, 10) + '...' : 'NON DÉFINI'}`);
console.log(`  From Email: ${process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'NON DÉFINI'}`);
console.log(`  From Name: ${process.env.SMTP_FROM_NAME || 'NON DÉFINI'}`);
console.log('');

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY non configurée dans le fichier .env');
  console.error('');
  console.error('💡 Pour obtenir une clé API Resend:');
  console.error('   1. Créez un compte sur https://resend.com');
  console.error('   2. Allez dans API Keys et créez une nouvelle clé');
  console.error('   3. Ajoutez RESEND_API_KEY=votre-clé-api dans votre fichier .env');
  console.error('   4. Ajoutez RESEND_FROM_EMAIL=votre-email@votre-domaine.com');
  console.error('   5. Vérifiez votre domaine dans Resend (Settings > Domains)');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM;
const fromName = process.env.SMTP_FROM_NAME || 'BankApp';

if (!fromEmail) {
  console.error('❌ RESEND_FROM_EMAIL ou SMTP_FROM non configuré dans le fichier .env');
  console.error('');
  console.error('💡 Ajoutez RESEND_FROM_EMAIL=votre-email@votre-domaine.com dans votre fichier .env');
  console.error('   Assurez-vous que ce domaine est vérifié dans Resend (Settings > Domains)');
  process.exit(1);
}

console.log(`Tentative d'envoi d'email de test depuis ${fromName} <${fromEmail}>...\n`);

// Test d'envoi
try {
  const result = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: fromEmail, // Envoyer à soi-même pour test
    subject: 'Test Resend - BankApp',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #0066FF 0%, #0044CC 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Test Resend réussi!</h1>
        </div>
        <div class="content">
          <p>Ceci est un email de test. Si vous recevez ce message, la configuration Resend fonctionne correctement!</p>
          <p>Votre service d'email est maintenant opérationnel avec Resend.</p>
        </div>
      </body>
      </html>
    `
  });

  if (result.error) {
    console.error('❌ Erreur lors de l\'envoi:', result.error.message);
    console.error('');
    
    if (result.error.message.includes('domain')) {
      console.error('🔴 Erreur de domaine:');
      console.error('   1. Vérifiez que votre domaine est vérifié dans Resend');
      console.error('   2. Allez dans Settings > Domains dans votre dashboard Resend');
      console.error('   3. Ajoutez et vérifiez votre domaine si nécessaire');
    } else if (result.error.message.includes('API')) {
      console.error('🔴 Erreur d\'API:');
      console.error('   1. Vérifiez que votre clé API est correcte');
      console.error('   2. Vérifiez que votre clé API a les permissions nécessaires');
    }
    
    process.exit(1);
  } else {
    console.log('✅ Email de test envoyé avec succès!');
    console.log(`   Message ID: ${result.data?.id || 'N/A'}`);
    console.log('');
    console.log('🎉 Configuration Resend opérationnelle!');
    process.exit(0);
  }
} catch (error) {
  console.error('❌ Erreur inattendue:', error.message);
  process.exit(1);
}
