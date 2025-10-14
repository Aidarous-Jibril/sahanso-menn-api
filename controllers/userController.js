const expressAsyncHandler = require("express-async-handler");
const userToken = require("../utils/userToken");
const cloudinary = require("../utils/cloudinary");
const validator = require("validator");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendMail"); 

const registerUser = expressAsyncHandler(async (req, res) => {
  const { name, email, password, avatar } = req.body;

  if (!name || !email || !password || !avatar || !validator.isEmail(email)) {
    res.status(400).json({ error: "Invalid input data" });
    return;
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    // Upload avatar to Cloudinary
    const myCloud = await cloudinary.uploader.upload(avatar, { folder: "avatars" });

    const newUser = {
      name,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    };

    const user = await User.create(newUser);

    const token = userToken(res, user._id);
    
    // Create a notification for admins when new user registers
    await Notification.create({
      type: "new_user",
      message: `👤 New user registered: ${name}`,
    });

    res.status(201).json({ success: true, user, token, message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Log in user
const loginUser = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "All fields must be filled" });
    return;
  }

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    userToken(res, user._id);
    res.status(200).json({
      success: true,
      user,
      message: "User logged in successfully!",
    });
  } else {
    res.status(400).json({ error: "Invalid email or password" });
  }
});

// Forgot PWD
const forgotPassword = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString("hex");

  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  const resetUrl = `http://localhost:3000/user/reset-password/${resetToken}`;
  const message = `You requested a password reset. Click to reset: ${resetUrl}`;

  await sendEmail({
    to: user.email,
    subject: "Password Reset",
    text: message,
  });

  res.status(200).json({ message: "Password reset email sent" });
});

// Reset Password 
const resetPassword = expressAsyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ error: "Token is invalid or has expired" });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({ message: "Password reset successful!" });
});

// Log out user
const logoutUser = (req, res) => {
  res.cookie("user_token", null, {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ user: {}, message: "Logged out successfully" });
};

// Update user profile
const updateUserProfile = expressAsyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.body.id); 
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

    if (req.body.password) {
      user.password = req.body.password; 
    }

    await user.save();

    res.status(200).json({
      success: true,
      user,
      message: "User profile updated successfully!",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by user-id
const getUser = expressAsyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(400).json({ message: "User doesn't exist" });
    }
    res.status(200).json({
      success: true,
      user,
      message: "User fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "User not found" });
  }
});

// Update user avatar
const updateUserAvatar = expressAsyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.file) {
      // Delete existing avatar from Cloudinary
      if (user.avatar?.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }

      // Upload new avatar to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "avatars",
        width: 150,
      });

      user.avatar = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      user,
      message: "Avatar updated successfully",
    });
  } catch (error) {
    console.error("Error updating user avatar:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add user address
const addUserAddress = expressAsyncHandler(async (req, res) => {
  console.log("BODY", req.body)
  console.log("USER ID", req.user.id)
  try {
    const user = await User.findById(req.user.id);

    const sameTypeAddress = user.addresses.find(
      (address) => address.addressType === req.body.addressType
    );
    if (sameTypeAddress) {
      res.status(400).json({ error: "Address already exists" });
      return;
    }

    user.addresses.push(req.body);

    await user.save();

    res.status(200).json({
      success: true,
      user,
      message: "Address added successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user address
const deleteUserAddress = expressAsyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const addressId = req.params.id;

    await User.updateOne(
      {
        _id: userId,
      },
      { $pull: { addresses: { _id: addressId } } }
    );

    const user = await User.findById(userId);

    res.status(200).json({ success: true, user, message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user password
const updateUserPassword = expressAsyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password");

    const passwordMatch = await user.matchPassword(req.body.oldPassword);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Old password is incorrect!" });
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add payment method
const addPaymentMethod = expressAsyncHandler(async (req, res) => {
  const { cardHolderName, cardNumber, expiryDate, cvv } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.paymentMethod = { cardHolderName, cardNumber, expiryDate, cvv };
    await user.save();

    res.status(200).json({
      success: true,
      user,
      message: "Payment method added successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete payment method
const deletePaymentMethod = expressAsyncHandler(async (req, res) => {
  const { id } = req.user; 

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.paymentMethod = null; // Clear the payment method
    await user.save();

    res.status(200).json({
      success: true,
      user,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const googleLogin = expressAsyncHandler(async (req, res) => {
  const { name, email, image } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  let user = await User.findOne({ email });

  if (!user) {
    // Create user if not exists
    user = await User.create({
      name,
      email,
      avatar: {
        public_id: "google_avatar",
        url: image,
      },
      password: "", // No password for Google users
    });

    await Notification.create({
      type: "new_user",
      message: `👤 New Google user registered: ${name}`,
    });
  }

  // Issue cookie
  userToken(res, user._id);

  res.status(200).json({
    success: true,
    user,
    message: "Google login successful",
  });
});


module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  updateUserProfile,
  updateUserAvatar,
  addUserAddress,
  deleteUserAddress,
  getUser,
  updateUserPassword,
  addPaymentMethod,
  deletePaymentMethod,
  googleLogin
};
