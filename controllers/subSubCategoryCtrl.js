// controllers/subSubCat.js
const mongoose = require('mongoose');
const SubCategory = require('../models/subCategory');
const SubSubCategory = require('../models/subSubCategory');
const expressAsyncHandler = require("express-async-handler");

// Get all sub-subcategories by SubCategory Slug
const getAllSubSubcategories = expressAsyncHandler( async (req, res) => {
    try {
        const { subCategorySlug } = req.query;
        let subSubcategories = [];

        if (subCategorySlug) {
            const subCategory = await SubCategory.findOne({ slug: subCategorySlug });

            if (!subCategory) {
                return res.status(404).json({ error: 'Subcategory not found' });
            }

            subSubcategories = await SubSubCategory.find({ subCategory: subCategory._id });
        } else {
            subSubcategories = await SubSubCategory.find();
        }

        res.status(200).json({subSubcategories, message: "sub-Subcategories fetchech successfully"});
    } catch (error) {
        console.error('Error fetching sub-subcategories:', error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
});

// Create a new sub-subcategory
const createSubSubcategory = expressAsyncHandler( async (req, res) => {
    try {
        const { name, subCategory, imageUrl } = req.body; // Removed 'link'

        if (!mongoose.Types.ObjectId.isValid(subCategory)) {
            return res.status(400).json({ error: 'Invalid SubCategory' });
        }

        const existingSubCategory = await SubCategory.findById(subCategory);
        if (!existingSubCategory) {
            return res.status(404).json({ error: 'Subcategory not found' });
        }

        const subSubCategory = new SubSubCategory({ 
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'), // Generate slug from name
            subCategory: new mongoose.Types.ObjectId(subCategory),
            imageUrl // Optional field for image URL
        });

        const savedSubSubCategory = await subSubCategory.save();

        existingSubCategory.subsubcategories.push(savedSubSubCategory._id);
        await existingSubCategory.save();

        res.status(200).json({
            message: 'Sub Sub-Category has been created successfully',
            subSubCategory: savedSubSubCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get sub-subcategory by ID
const getSubSubcategoryById = expressAsyncHandler( async (req, res) => {
    const subSubcategoryId = req.params.id;
    try {
        const subSubcategoryId = req.params.id;
        const subSubcategory = await SubSubCategory.findById(subSubcategoryId);
        if (!subSubcategory) {
            return res.status(404).json({ error: 'Sub-subcategory not found' });
        }
        res.status(200).json(subSubcategory);
    } catch (error) {
        console.error("Error fetching sub-subcategories:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
});

// Update a sub-subcategory by ID
const updateSubSubCategory = expressAsyncHandler( async (req, res) => {
    try {
        const subSubCategoryId = req.params.id;
        const { name, subCategory, imageUrl } = req.body; // Removed 'link'

        if (subCategory && !mongoose.Types.ObjectId.isValid(subCategory)) {
            return res.status(400).json({ error: 'Invalid SubCategory ID' });
        }

        const updatedSubSubCategory = await SubSubCategory.findByIdAndUpdate(
            subSubCategoryId,
            { 
                name, 
                slug: name.toLowerCase().replace(/\s+/g, '-'), // Update slug from name
                subCategory: subCategory ? new mongoose.Types.ObjectId(subCategory) : undefined,
                imageUrl // Update imageUrl
            },
            { new: true }
        );

        if (!updatedSubSubCategory) {
            return res.status(404).json({ error: 'Sub-subcategory not found' });
        }

        res.status(200).json({
            message: 'Sub Sub-Category has been updated successfully',
            subSubCategory: updatedSubSubCategory
        });
    } catch (error) {
        console.error("Error updating sub-subcategory:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a sub-subcategory by ID
const deleteSubSubCategory = expressAsyncHandler( async (req, res) => {
    try {
        const subSubcategoryId = req.params.id;
        const deletedSubSubCategory = await SubSubCategory.findByIdAndDelete(subSubcategoryId);
        if (!deletedSubSubCategory) {
            return res.status(404).json({ error: "Sub-subcategory not found" });
        }
        res.status(200).json({ msg: 'Sub Sub-Category has been deleted' });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = {
    createSubSubcategory,
    getAllSubSubcategories,
    getSubSubcategoryById,
    updateSubSubCategory,
    deleteSubSubCategory,
};
