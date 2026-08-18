import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  key: {
    type: String,
    required: true,
    unique: true,
  },
  priceTag: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  desc: {
    type: String,
    default: '',
  },
  img: {
    type: String,
    default: '',
  },
  accentColor: {
    type: String,
    default: '#ffc2d1',
  },
  bgColor: {
    type: String,
    default: '#f9f7f2',
  },
});

export default mongoose.model('Content', ContentSchema, 'content');
