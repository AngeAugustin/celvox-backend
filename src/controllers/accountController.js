import {
  getUserAccounts,
  getAccountById,
  createAccount,
  deleteAccount
} from '../services/accountService.js';

export async function getAccounts(req, res) {
  try {
    const accounts = await getUserAccounts(req.user.id);
    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAccount(req, res) {
  try {
    const accountId = parseInt(req.params.id);
    const account = await getAccountById(accountId, req.user.id);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createAccountHandler(req, res) {
  try {
    const { type, label } = req.body;
    const account = await createAccount(req.user.id, type, label, req);
    res.status(201).json({ account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteAccountHandler(req, res) {
  try {
    const accountId = parseInt(req.params.id);
    await deleteAccount(accountId, req.user.id, req);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

