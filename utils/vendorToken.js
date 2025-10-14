const jwt = require('jsonwebtoken')

const createVendorToken = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '3d',
  });

   // Set JWT as an HTTP-Only cookie
   res.cookie('vendor_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

module.exports = createVendorToken;