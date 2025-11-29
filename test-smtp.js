import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Test de connexion SMTP...\n');

// Afficher la configuration (sans le mot de passe complet)
console.log('Configuration:');
console.log(`  Host: ${process.env.SMTP_HOST}`);
console.log(`  Port: ${process.env.SMTP_PORT}`);
console.log(`  Secure: ${process.env.SMTP_SECURE}`);
console.log(`  User: ${process.env.SMTP_USER}`);
console.log(`  Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-3) : 'NON DÉFINI'}`);
console.log('');

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ Configuration SMTP incomplète dans le fichier .env');
  process.exit(1);
}

const isSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465';
const port = parseInt(process.env.SMTP_PORT || '587');

console.log(`Tentative de connexion sur ${process.env.SMTP_HOST}:${port} (${isSecure ? 'SSL' : 'TLS'})...\n`);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: port,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  authMethod: 'PLAIN',
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    ciphers: 'SSLv3'
  },
  requireTLS: !isSecure,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Test de connexion
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur de connexion SMTP:');
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Message: ${error.message || 'N/A'}`);
    console.error(`   Response: ${error.response || 'N/A'}`);
    console.error('');
    
    if (error.code === 'EAUTH') {
      console.error('🔴 Erreur d\'authentification (535):');
      console.error('   1. Vérifiez que l\'email existe dans Hostinger');
      console.error('   2. Vérifiez que le mot de passe est correct');
      console.error('   3. Essayez de réinitialiser le mot de passe dans Hostinger');
      console.error('   4. Essayez le port 465 avec SMTP_SECURE=true');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('🔴 Erreur de connexion:');
      console.error('   1. Vérifiez que le serveur SMTP est accessible');
      console.error('   2. Vérifiez que le port n\'est pas bloqué par un firewall');
      console.error('   3. Essayez le port 465 au lieu de 587');
    }
    
    console.error('');
    console.error('💡 Consultez backend/SMTP_TROUBLESHOOTING.md pour plus d\'aide');
    process.exit(1);
  } else {
    console.log('✅ Connexion SMTP réussie!');
    console.log('');
    console.log('📧 Test d\'envoi d\'email...');
    
    // Test d'envoi
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'BankApp'} <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Envoyer à soi-même pour test
      subject: 'Test SMTP - BankApp',
      html: '<p>Ceci est un email de test. Si vous recevez ce message, la configuration SMTP fonctionne correctement!</p>'
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Erreur lors de l\'envoi:', error.message);
        process.exit(1);
      } else {
        console.log('✅ Email de test envoyé avec succès!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Réponse: ${info.response}`);
        console.log('');
        console.log('🎉 Configuration SMTP opérationnelle!');
        process.exit(0);
      }
    });
  }
});

