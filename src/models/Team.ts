import mongoose from 'mongoose';

// Historical tracking interfaces
interface IHistoryEntry {
  userId: mongoose.Types.ObjectId;
  assignedAt: Date;
  unassignedAt?: Date;
  assignedBy: mongoose.Types.ObjectId;
}

interface ILeaderSlot {
  currentHolder?: mongoose.Types.ObjectId;
  history: IHistoryEntry[];
}

interface IMemberSlot {
  slotId: mongoose.Types.ObjectId;
  currentHolder?: mongoose.Types.ObjectId;
  history: IHistoryEntry[];
}

export interface ITeam {
  _id?: string;
  name: string;
  description: string;
  
  // Legacy fields (keep for backwards compatibility)
  teamLeaderId?: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  
  // New slot-based structure
  leaderSlot?: ILeaderSlot;
  memberSlots: IMemberSlot[];
  
  projects: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // Deletion tracking fields
  deletedAt?: Date;
  deletedBy?: string;
  originalName?: string;
}

const HistoryEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  unassignedAt: {
    type: Date
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { _id: false });

const LeaderSlotSchema = new mongoose.Schema({
  currentHolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  history: [HistoryEntrySchema]
}, { _id: false });

const MemberSlotSchema = new mongoose.Schema({
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    default: () => new mongoose.Types.ObjectId()
  },
  currentHolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  history: [HistoryEntrySchema]
}, { _id: false });

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
  // Legacy fields (keep for backwards compatibility)
  teamLeaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // New slot-based structure
  leaderSlot: {
    type: LeaderSlotSchema,
    default: () => ({ history: [] })
  },
  memberSlots: {
    type: [MemberSlotSchema],
    default: []
  },
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
  },
  // Deletion tracking fields
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: String
  },
  originalName: {
    type: String // Store original name before marking as deleted
  }
}, {
  timestamps: true
});

// Indexes
TeamSchema.index({ name: 1, isActive: 1 });
TeamSchema.index({ teamLeaderId: 1 });
TeamSchema.index({ members: 1 });
TeamSchema.index({ 'leaderSlot.currentHolder': 1 });
TeamSchema.index({ 'memberSlots.currentHolder': 1 });

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);