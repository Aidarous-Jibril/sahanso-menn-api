const express = require('express');
const router = express.Router();
const {
    createSubCategory, 
    getSubCategories, 
    getSubCategoryBySlug, 
    updateSubCategory, 
    deleteSubCategory
} = require('../controllers/subCategoryController');

// Define routes
router.get('/', getSubCategories); 
router.get('/:slug', getSubCategoryBySlug);
router.put('/:slug', updateSubCategory); 
router.delete('/:slug', deleteSubCategory); 
router.post('/create-subcategory', createSubCategory);

module.exports = router;
