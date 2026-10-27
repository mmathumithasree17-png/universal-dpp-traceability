const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductByPassportId,
  createProduct,
  updateProductStatus,
} = require('../controllers/productController');

router.get('/', getAllProducts);
router.get('/:id', getProductByPassportId);
router.post('/', createProduct);
router.patch('/:id/status', updateProductStatus);

module.exports = router;
