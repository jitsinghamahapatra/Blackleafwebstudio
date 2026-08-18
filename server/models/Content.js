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
});

export default mongoose.model('Content', ContentSchema, 'content');
