const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a name"],
    },
    email: {
      type: String,
      required: [true, "Please enter an email"],
      unique: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: false, // Allow Google users to skip password
      validate: {
        validator: function (value) {
          // Only validate length if password is provided
          return !value || value.length >= 6;
        },
        message: "Minimum password length is 6 characters",
      },
    },
    
    phoneNumber: {
      type: String,
      default: 72000000
    },
    addresses: [
      {
        country: String,
        state: String,
        city: String,
        street: String,
        zipCode: Number,
        addressType: String,
      },
    ],
    role: {
      type: String,
      default: "user",
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    paymentMethod: {
      cardHolderName: {
        type: String,
        default: ""
      },
      cardNumber: {
        type: String,
        default: ""
      },
      expiryDate: {
        type: String,
        default: ""
      },
      cvv: {
        type: String,
        default: ""
      },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
