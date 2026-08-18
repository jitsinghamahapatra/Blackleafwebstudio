import mongoose from 'mongoose';

const PackageSchema = new mongoose.Schema({
  _id: {
    type: String, // Maps to package id (e.g. "1", "2")
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    default: '',
  },
  features: {
    type: [String],
    default: [],
  },
}, { _id: false }); // Disable auto-generation of _id so we can manually set it

export default mongoose.model('Package', PackageSchema);
