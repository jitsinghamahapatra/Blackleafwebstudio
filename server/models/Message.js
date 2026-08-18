import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema({
  sender: {
    type: String, // 'admin' or 'user'
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const MessageSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  uid: {
    type: String, // User ID (if logged in, null if guest)
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  replies: [ReplySchema],
  status: {
    type: String,
    enum: ['Open', 'Replied', 'Closed'],
    default: 'Open',
  },
  readByAdmin: {
    type: Boolean,
    default: false,
  },
  readByUser: {
    type: Boolean,
    default: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Message', MessageSchema);
