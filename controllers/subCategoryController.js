const mongoose = require('mongoose');
const MainCategory = require("../models/mainCategory");
const SubCategory = require('../models/subCategory');
const slugify = require('slugify');
const expressAsyncHandler = require("express-async-handler");

// Create SubCategory with Slug
const createSubCategory = expressAsyncHandler (async (req, res) => {
    try {
        const { name, imageUrl, mainCategory, subsubcategories } = req.body;

        if (!mongoose.Types.ObjectId.isValid(mainCategory)) {
            return res.status(400).json({ error: 'Invalid mainCategory' });
        }

        const existingMainCategory = await MainCategory.findById(mainCategory);
        if (!existingMainCategory) {
            return res.status(404).json({ error: 'Main category not found' });
        }

        const slug = slugify(name, { lower: true });

        const subcategory = new SubCategory({
            name,
            slug,
            imageUrl,
            mainCategory: new mongoose.Types.ObjectId(mainCategory),
            subsubcategories
        });

        const savedSubCategory = await subcategory.save();

        // Add the newly created subcategory to the main category's subcategories array
        existingMainCategory.subcategories.push(savedSubCategory._id);
        await existingMainCategory.save();

        res.status(200).json({
            message: 'Sub Category has been created successfully',
            subCategory: savedSubCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get SubCategories by Main Category Slug
const getSubCategories = expressAsyncHandler (async (req, res) => {
    try {
        const { categorySlug } = req.query;
        let subcategories = [];

        if (categorySlug) {
            const mainCategory = await MainCategory.findOne({ slug: categorySlug });

            if (!mainCategory) {
                return res.status(404).json({ error: 'Main category not found' });
            }

            subcategories = await SubCategory.find({ mainCategory: mainCategory._id })
                .populate('subsubcategories');
        } else {
            subcategories = await SubCategory.find().populate('subsubcategories');
        }
        res.status(200).json({subcategories, message: "Sub categories Fetched Successfully"});
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
});

// Get SubCategory by Slug
const getSubCategoryBySlug = expressAsyncHandler (async (req, res) => {
    try {
        const { slug } = req.params;
        const subcategory = await SubCategory.findOne({ slug }).populate('subsubcategories');

        if (!subcategory) {
            return res.status(404).json({ error: 'Subcategory not found' });
        }

        res.status(200).json(subcategory);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update SubCategory with Slug
const updateSubCategory = expressAsyncHandler (async (req, res) => {
    try {
        const { slug } = req.params;
        const { name, imageUrl, mainCategory, subsubcategories } = req.body;

        const newSlug = slugify(name, { lower: true });

        const updatedSubCategory = await SubCategory.findOneAndUpdate(
            { slug },
            { name, slug: newSlug, imageUrl, mainCategory, subsubcategories },
            { new: true }
        );

        if (!updatedSubCategory) {
            return res.status(404).json({ error: 'Subcategory not found' });
        }

        res.status(200).json({
            message: 'Sub Category has been updated successfully',
            subCategory: updatedSubCategory
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete SubCategory by Slug
const deleteSubCategory = expressAsyncHandler (async (req, res) => {
    try {
        const { slug } = req.params;
        const deletedSubCategory = await SubCategory.findOneAndDelete({ slug });

        if (!deletedSubCategory) {
            return res.status(404).json({ error: 'Subcategory not found' });
        }

        // Optionally, you can remove the deleted subcategory from the corresponding main category
        await MainCategory.updateOne(
            { _id: deletedSubCategory.mainCategory },
            { $pull: { subcategories: deletedSubCategory._id } }
        );

        res.status(200).json({ msg: 'Sub Category has been deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = {
    createSubCategory,
    getSubCategories,
    getSubCategoryBySlug,
    updateSubCategory,
    deleteSubCategory
};
