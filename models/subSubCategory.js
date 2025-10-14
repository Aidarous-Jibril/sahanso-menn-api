const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subSubCategorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  imageUrl: { type: String }, // Make imageUrl optional
  subCategory: { type: Schema.Types.ObjectId, ref: 'SubCategory', required: true }
});

module.exports = mongoose.model('SubSubCategory', subSubCategorySchema);
