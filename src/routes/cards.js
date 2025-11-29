import express from 'express';
import {
  getCards,
  getCard,
  createCardHandler,
  updateCardHandler,
  deleteCardHandler
} from '../controllers/cardController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.get('/', authenticate, getCards);
router.get('/:id', authenticate, getCard);
router.post('/', authenticate, validate(schemas.createCard), createCardHandler);
router.patch('/:id', authenticate, updateCardHandler);
router.delete('/:id', authenticate, deleteCardHandler);

export default router;

