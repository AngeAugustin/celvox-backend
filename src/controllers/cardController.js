import {
  getUserCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard
} from '../services/cardService.js';

export async function getCards(req, res) {
  try {
    const cards = await getUserCards(req.user.id);
    res.json({ cards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getCard(req, res) {
  try {
    const cardId = parseInt(req.params.id);
    const card = await getCardById(cardId, req.user.id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ card });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createCardHandler(req, res) {
  try {
    const { accountId, label } = req.body;
    const card = await createCard(req.user.id, accountId, label);
    res.status(201).json({ card });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateCardHandler(req, res) {
  try {
    const cardId = parseInt(req.params.id);
    const card = await updateCard(cardId, req.user.id, req.body);
    res.json({ card });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteCardHandler(req, res) {
  try {
    const cardId = parseInt(req.params.id);
    await deleteCard(cardId, req.user.id);
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

