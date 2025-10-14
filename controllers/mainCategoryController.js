const MainCategory = require("../models/mainCategory");
const expressAsyncHandler = require("express-async-handler");

// Create a new category
const createCategory = expressAsyncHandler(async (req, res) => {
    try {
        // Extract name, slug, imageUrl, and subcategories from the request body
        const { name, slug, imageUrl, subcategories } = req.body;

        // Create a new main category with the provided data
        const category = new MainCategory({ name, slug, imageUrl, subcategories });
        const savedCategory = await category.save();

        res.status(200).json({
            message: 'Main Category has been created successfully',
            category: savedCategory
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get all categories
const getCategories = expressAsyncHandler(async  (req, res) => {
    try {
        // Find all categories and populate subcategories with subsubcategories
        const categories = await MainCategory.find()
            .populate({
                path: 'subcategories',
                populate: {
                    path: 'subsubcategories'
                }
            });
        res.status(200).json({categories, message: "Categories fetched Successfully"});
    } catch (error) {
        res.status(500).json({ msg: 'Internal Server Error' });
    }
});

// Get a single category by ID
const getCategoryById = expressAsyncHandler(async  (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await MainCategory.findById(categoryId).populate('subcategories');

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update a category by ID
const updateCategory = expressAsyncHandler(async  (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, slug, imageUrl, subcategories } = req.body;

        const updatedCategory = await MainCategory.findByIdAndUpdate(
            categoryId,
            { name, slug, imageUrl, subcategories },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({
            message: 'Category has been updated successfully',
            category: updatedCategory
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a category by ID
const deleteCategory = expressAsyncHandler(async  (req, res) => {
    try {
        const categoryId = req.params.id;
        const deletedCategory = await MainCategory.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ msg: 'Main Category has been deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
