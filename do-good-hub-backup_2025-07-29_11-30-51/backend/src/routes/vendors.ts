import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Vendors route - coming soon' });
});

export default router; 