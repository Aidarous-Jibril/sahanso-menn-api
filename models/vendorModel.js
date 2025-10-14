const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter a name']
  },
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [6, 'Minimum password length is 6 characters']
  },
  description: String,
  address: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String, 
    required: true,
  },
  role: {
    type: String,
    default: 'Vendor',
  },
  avatar: {
    url: { type: String },
    public_id: { type: String },
  },
  zipCode: {
    type: String, 
    required: true,
  },
  vendorBankInfo: {
    accountHolderName: { type: String, required: false },
    bankName: { type: String, required: false },
    bankAccountNumber: { type: String, required: false },
    iban: { type: String, required: false },
  },
  isBlocked: {  
    type: Boolean,
    default: false,  
  },
  isApproved: {  
    type: Boolean,
    default: true,  
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, 
{ timestamps: true }
);


vendorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

vendorSchema.statics.login = async function(email, password) {
  if (!email || !password) {
    throw Error('All fields must be filled');
  }

  const user = await this.findOne({ email });

  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      return user;
    }
    throw Error('Incorrect password');
  }
  throw Error('Incorrect email');
};

module.exports = mongoose.model('Vendor', vendorSchema);
