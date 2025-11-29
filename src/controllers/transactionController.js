import {
  getTransactions,
  getTransactionById,
  deposit,
  withdraw,
  transfer,
  acceptPendingTransfer
} from '../services/transactionService.js';

export async function getTransactionsHandler(req, res) {
  try {
    const filters = {
      accountId: req.query.accountId ? parseInt(req.query.accountId) : null,
      type: req.query.type || null,
      from: req.query.from || null,
      to: req.query.to || null,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0
    };

    const transactions = await getTransactions(req.user.id, filters);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTransactionHandler(req, res) {
  try {
    const transactionId = parseInt(req.params.id);
    const transaction = await getTransactionById(transactionId, req.user.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function depositHandler(req, res) {
  try {
    const { accountId, amount, description } = req.body;
    const result = await deposit(accountId, amount, description, req.user.id);
    res.status(201).json({ transaction: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function withdrawHandler(req, res) {
  try {
    const { accountId, amount, description } = req.body;
    const result = await withdraw(accountId, amount, description, req.user.id);
    res.status(201).json({ transaction: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function transferHandler(req, res) {
  try {
    const { fromAccountId, toEmail, toAccountId, toAccountNumber, amount, description } = req.body;
    const result = await transfer(
      fromAccountId,
      toEmail,
      toAccountId,
      amount,
      description,
      req.user.id,
      toAccountNumber
    );
    res.status(201).json({ transaction: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function acceptPendingTransferHandler(req, res) {
  try {
    const { transactionId, accountId } = req.body;
    
    if (!transactionId || !accountId) {
      return res.status(400).json({ error: 'transactionId and accountId are required' });
    }

    const result = await acceptPendingTransfer(
      parseInt(transactionId),
      parseInt(accountId),
      req.user.id
    );
    
    res.status(200).json({ 
      message: 'Transfer accepted successfully',
      transaction: result 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

