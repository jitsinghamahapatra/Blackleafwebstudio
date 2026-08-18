import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  uid: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  package: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Designing', 'Coding', 'Review', 'Completed'],
    default: 'Pending',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Request', RequestSchema);
