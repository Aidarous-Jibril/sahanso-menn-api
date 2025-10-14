const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subCategorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  imageUrl: { type: String }, // Make imageUrl optional
  mainCategory: { type: Schema.Types.ObjectId, ref: 'MainCategory', required: true },
  subsubcategories: [{ type: Schema.Types.ObjectId, ref: 'SubSubCategory' }]
});

module.exports = mongoose.model('SubCategory', subCategorySchema);
