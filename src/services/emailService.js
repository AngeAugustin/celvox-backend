import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

let resend = null;

function getResendClient() {
  if (resend) return resend;

  if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
    // Mock client for development
    resend = {
      emails: {
        send: async (options) => {
          console.log('📧 Email would be sent:', {
            to: options.to,
            subject: options.subject,
            from: options.from
          });
          return { id: 'mock-message-id', error: null };
        }
      }
    };
    return resend;
  }

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  Resend API key non configurée. Les emails ne seront pas envoyés.');
    resend = {
      emails: {
        send: async (options) => {
          console.log('📧 Email would be sent (Resend not configured):', {
            to: options.to,
            subject: options.subject
          });
          return { id: 'mock-message-id', error: null };
        }
      }
    };
    return resend;
  }

  // Initialize Resend client
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend configuré avec succès');
  
  return resend;
}

export async function sendTransferEmail(toEmail, amount, description, senderName = null, senderEmail = null, platformName = 'CELVOX') {
  try {
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);

    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@celvox.org';
    const fromName = process.env.SMTP_FROM_NAME || platformName;
    
    const result = await getResendClient().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject: `Virement bancaire reçu - ${formattedAmount}`,
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
            .amount-box {
              background: white;
              border: 2px solid #0066FF;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .amount {
              font-size: 32px;
              font-weight: bold;
              color: #0066FF;
              margin: 10px 0;
            }
            .info-box {
              background: white;
              border-left: 4px solid #0066FF;
              padding: 15px;
              margin: 15px 0;
            }
            .button {
              display: inline-block;
              background: #0066FF;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💰 Virement bancaire reçu</h1>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            
            <p>Vous avez reçu un virement bancaire sur la plateforme <strong>${platformName}</strong>.</p>
            
            <div class="amount-box">
              <div style="color: #666; font-size: 14px;">Montant reçu</div>
              <div class="amount">${formattedAmount}</div>
            </div>
            
            ${senderName || senderEmail ? `
            <div class="info-box">
              <strong>Expéditeur :</strong><br>
              ${senderName ? `${senderName}<br>` : ''}
              ${senderEmail ? `<span style="color: #666;">${senderEmail}</span>` : ''}
            </div>
            ` : ''}
            
            ${description ? `
            <div class="info-box">
              <strong>Description :</strong><br>
              ${description}
            </div>
            ` : ''}
            
            <p>Pour consulter votre solde et gérer vos comptes, connectez-vous à votre espace personnel.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Accéder à mon compte</a>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              <strong>Note importante :</strong> Si vous n'avez pas de compte sur ${platformName}, vous pouvez créer un compte gratuitement pour recevoir ce virement.
            </p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par ${platformName}.</p>
            <p>Ne répondez pas à cet email. Pour toute question, contactez notre support client.</p>
          </div>
        </body>
        </html>
      `
    });

    if (result.error) {
      throw new Error(result.error.message || 'Erreur lors de l\'envoi de l\'email');
    }
    
    console.log(`✅ Email de virement envoyé à ${toEmail}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    // Don't throw - email failure shouldn't break the transfer
    // L'erreur est loggée mais ne bloque pas le virement
  }
}

export async function sendWelcomeEmail(toEmail, name) {
  try {
    const platformName = process.env.PLATFORM_NAME || 'CELVOX';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@celvox.org';
    const fromName = process.env.SMTP_FROM_NAME || platformName;
    
    const result = await getResendClient().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject: `Bienvenue sur ${platformName}`,
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
            .button {
              display: inline-block;
              background: #0066FF;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Bienvenue sur ${platformName}!</h1>
          </div>
          <div class="content">
            <p>Bonjour ${name},</p>
            
            <p>Votre compte a été créé avec succès sur <strong>${platformName}</strong>.</p>
            
            <p>Vous pouvez maintenant vous connecter et commencer à utiliser nos services bancaires en ligne.</p>
            
            <div style="text-align: center;">
              <a href="${frontendUrl}/login" class="button">Se connecter à mon compte</a>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Nous sommes ravis de vous compter parmi nos clients !
            </p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par ${platformName}.</p>
            <p>Ne répondez pas à cet email. Pour toute question, contactez notre support client.</p>
          </div>
        </body>
        </html>
      `
    });

    if (result.error) {
      throw new Error(result.error.message || 'Erreur lors de l\'envoi de l\'email');
    }
    
    console.log(`✅ Welcome email sent to ${toEmail}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
}

export async function sendPasswordResetEmail(toEmail, name, code) {
  try {
    const platformName = process.env.PLATFORM_NAME || 'CELVOX';
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@celvox.org';
    const fromName = process.env.SMTP_FROM_NAME || platformName;
    
    const result = await getResendClient().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject: `Réinitialisation de votre mot de passe - ${platformName}`,
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
            .code-box {
              background: white;
              border: 3px solid #0066FF;
              border-radius: 8px;
              padding: 25px;
              text-align: center;
              margin: 25px 0;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #0066FF;
              font-family: 'Courier New', monospace;
              margin: 15px 0;
            }
            .info-box {
              background: white;
              border-left: 4px solid #FFA500;
              padding: 15px;
              margin: 15px 0;
            }
            .button {
              display: inline-block;
              background: #0066FF;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour ${name},</p>
            
            <p>Vous avez demandé à réinitialiser votre mot de passe sur <strong>${platformName}</strong>.</p>
            
            <p>Utilisez le code suivant pour réinitialiser votre mot de passe :</p>
            
            <div class="code-box">
              <div style="color: #666; font-size: 14px; margin-bottom: 10px;">Votre code de réinitialisation</div>
              <div class="code">${code}</div>
              <div style="color: #666; font-size: 12px; margin-top: 10px;">Ce code est valide pendant 15 minutes</div>
            </div>
            
            <div class="info-box">
              <strong>⚠️ Important :</strong><br>
              • Ce code est valide pendant 15 minutes uniquement<br>
              • Ne partagez jamais ce code avec personne<br>
              • Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
            </div>
            
            <p>Entrez ce code dans le formulaire de réinitialisation avec votre nouveau mot de passe.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/forgot-password" class="button" style="display: inline-block; background: #0066FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Réinitialiser mon mot de passe</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par ${platformName}.</p>
            <p>Ne répondez pas à cet email. Pour toute question, contactez notre support client.</p>
          </div>
        </body>
        </html>
      `
    });

    if (result.error) {
      throw new Error(result.error.message || 'Erreur lors de l\'envoi de l\'email');
    }
    
    console.log(`✅ Password reset email sent to ${toEmail}`);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error; // Re-throw to handle in controller
  }
}

