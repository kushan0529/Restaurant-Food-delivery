const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobilenumber: {
  type: String,
  required: true,
  unique: true,
  match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'],
},
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'restaurant', 'delivery_partner', 'admin'],
    default: 'customer' 
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);