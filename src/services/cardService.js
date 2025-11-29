import pool from '../config/database.js';
import { auditLog } from './auditService.js';
import { createNotification } from './notificationService.js';

function generateCardNumber() {
  // Generate 16-digit card number (Luhn algorithm compatible)
  let cardNumber = '';
  for (let i = 0; i < 16; i++) {
    cardNumber += Math.floor(Math.random() * 10);
  }
  return cardNumber.match(/.{1,4}/g).join(' '); // Format: XXXX XXXX XXXX XXXX
}

function generateCVV() {
  return Math.floor(100 + Math.random() * 900).toString();
}

function generateExpiryDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 3);
  return date.toISOString().split('T')[0];
}

export async function getUserCards(userId) {
  const [cards] = await pool.execute(
    `SELECT c.*, a.type as account_type, a.label as account_label, a.account_number as account_number
     FROM cards c
     JOIN accounts a ON c.account_id = a.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return cards;
}

export async function getCardById(cardId, userId) {
  const [cards] = await pool.execute(
    'SELECT * FROM cards WHERE id = ? AND user_id = ?',
    [cardId, userId]
  );
  return cards[0] || null;
}

export async function createCard(userId, accountId, label = null) {
  // Verify account belongs to user
  const [accounts] = await pool.execute(
    'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
    [accountId, userId]
  );

  if (accounts.length === 0) {
    throw new Error('Account not found');
  }

  // Check if there's already an active card on this account
  const [activeCards] = await pool.execute(
    'SELECT * FROM cards WHERE account_id = ? AND is_active = TRUE',
    [accountId]
  );

  if (activeCards.length > 0) {
    throw new Error('Account already has an active card. Please deactivate the existing card first.');
  }

  // Check if there's a recently deactivated card (within 3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const [recentlyDeactivated] = await pool.execute(
    `SELECT * FROM cards 
     WHERE account_id = ? 
     AND is_active = FALSE 
     AND deactivated_at IS NOT NULL 
     AND deactivated_at > ? 
     ORDER BY deactivated_at DESC 
     LIMIT 1`,
    [accountId, threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ')]
  );

  if (recentlyDeactivated.length > 0) {
    const deactivatedDate = new Date(recentlyDeactivated[0].deactivated_at);
    const daysSinceDeactivation = Math.ceil((new Date() - deactivatedDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = 3 - daysSinceDeactivation;
    
    throw new Error(`You must wait ${daysRemaining} more day(s) before creating a new card for this account. A card was deactivated ${daysSinceDeactivation} day(s) ago.`);
  }

  const cardNumber = generateCardNumber();
  const last4 = cardNumber.replace(/\s/g, '').slice(-4);
  const cvv = generateCVV();
  const expiresAt = generateExpiryDate();

  const [result] = await pool.execute(
    `INSERT INTO cards (user_id, account_id, card_number, last4, cvv, expires_at, label) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, accountId, cardNumber, last4, cvv, expiresAt, label || 'Carte Virtuelle']
  );

  await auditLog(userId, 'card_created', { cardId: result.insertId, accountId }, null, null, null, null);

  await createNotification(
    userId,
    'card_created',
    'Carte créée',
    `Votre carte virtuelle ${last4} a été créée avec succès`,
    { cardId: result.insertId }
  );

  return {
    id: result.insertId,
    card_number: cardNumber,
    last4,
    cvv,
    expires_at: expiresAt,
    is_active: true
  };
}

export async function updateCard(cardId, userId, updates) {
  const card = await getCardById(cardId, userId);
  if (!card) {
    throw new Error('Card not found');
  }

  const allowedUpdates = ['is_active', 'label'];
  const updateFields = [];
  const updateValues = [];

  // Track if we're deactivating the card
  const isDeactivating = updates.is_active === false && card.is_active === true;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedUpdates.includes(key)) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  }

  // If deactivating, set deactivated_at timestamp
  if (isDeactivating) {
    updateFields.push('deactivated_at = CURRENT_TIMESTAMP');
  } else if (updates.is_active === true && card.is_active === false) {
    // If reactivating, clear deactivated_at
    updateFields.push('deactivated_at = NULL');
  }

  if (updateFields.length === 0) {
    return card;
  }

  updateValues.push(cardId, userId);

  await pool.execute(
    `UPDATE cards SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
    updateValues
  );

      await auditLog(userId, 'card_updated', { cardId, updates }, null, null, null, null);

  return await getCardById(cardId, userId);
}

export async function deleteCard(cardId, userId) {
  const card = await getCardById(cardId, userId);
  if (!card) {
    throw new Error('Card not found');
  }

  await pool.execute('DELETE FROM cards WHERE id = ? AND user_id = ?', [cardId, userId]);
      await auditLog(userId, 'card_deleted', { cardId }, null, null, null, null);
}

