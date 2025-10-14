const express = require('express');
const router = express.Router();
const { createSubSubcategory, getAllSubSubcategories, getSubSubcategoryById, deleteSubSubCategory, updateSubSubCategory } = require('../controllers/subSubCategoryCtrl');

router.post('/create-sub-subcategory', createSubSubcategory);
router.get('/', getAllSubSubcategories);
router.get('/:id', getSubSubcategoryById);
router.put('/:id', updateSubSubCategory);
router.delete('/:id', deleteSubSubCategory);

module.exports = router;
