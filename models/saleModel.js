const mongoose = require("mongoose");
const slugify = require("slugify");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.Mixed },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  productId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const saleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // <- make it required
    description: { type: String, required: true },
    mainCategory: { type: String, required: true },
    subCategory: { type: String, required: true },
    subSubCategory: { type: String, required: true },
    brand: { type: String },
    originalPrice: { type: Number },
    discountPrice: { type: Number, required: true },
    saleStart: { type: Date },
    saleEnd: { type: Date },
    stock: { type: Number, required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    isFeatured: { type: Boolean, default: false },
    images: [{ url: { type: String, required: true } }],
    attributes: { type: Map, of: String },
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 1) set base slug from name
saleSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// 2) ensure uniqueness (append -1, -2, … if needed)
saleSchema.pre("save", async function (next) {
  if (!this.isModified("slug")) return next();

  let base = this.slug || slugify(this.name || "", { lower: true, strict: true });
  if (!base) base = `sale-${Date.now().toString(36)}`;

  let candidate = base;
  let i = 1;
  while (await this.constructor.exists({ slug: candidate })) {
    candidate = `${base}-${i++}`;
  }
  this.slug = candidate;
  next();
});

module.exports = mongoose.model("Sale", saleSchema);
