import mongoose from 'mongoose';

export interface ITeam {
  _id?: string;
  name: string;
  description: string;
  teamLeaderId?: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  projects: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new mongoose.Schema<ITeam>({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true,
    maxLength: [100, 'Team name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Team description is required'],
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  teamLeaderId: {
    type: mongoose.Schema.Types.ObjectId
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
TeamSchema.index({ name: 1, isActive: 1 });
TeamSchema.index({ teamLeaderId: 1 });
TeamSchema.index({ members: 1 });

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);