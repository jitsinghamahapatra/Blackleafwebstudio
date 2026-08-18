import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    default: '',
  },
  img: {
    type: String,
    default: '', // If empty, we automatically generate screenshot in frontend
  },
  link: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Project', ProjectSchema);
