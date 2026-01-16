import mongoose from 'mongoose';

export interface IAttachment {
  _id?: string;
  filename: string;
  originalName: string;
  cloudinaryId: string;
  url: string;
  mimetype: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  description?: string;
}

export interface ITask {
  _id?: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  phase: 'architectural' | 'structural' | 'electrical' | 'mechanical' | 'final-plan' | 'final-estimate' | 'checking' | 'other';
  projectId: mongoose.Types.ObjectId;
  assigneeId?: mongoose.Types.ObjectId; // User ObjectId instead of string
  assigneeName?: string; // Keep for backward compatibility and display
  attachments?: IAttachment[]; // File attachments
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  createdBy: mongoose.Types.ObjectId; // Who created the task
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new mongoose.Schema<IAttachment>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  cloudinaryId: { type: String, required: true },
  url: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  description: { type: String, default: '' }
});

const TaskSchema = new mongoose.Schema<ITask>({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxLength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: true
  },
  phase: {
    type: String,
    enum: ['architectural', 'structural', 'electrical', 'mechanical', 'final-plan', 'final-estimate', 'checking', 'other'],
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  assigneeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assigneeName: {
    type: String,
    trim: true,
    maxLength: [100, 'Assignee name cannot exceed 100 characters']
  },
  attachments: [AttachmentSchema],
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours cannot be negative'],
    max: [1000, 'Estimated hours cannot exceed 1000']
  },
  actualHours: {
    type: Number,
    min: [0, 'Actual hours cannot be negative'],
    max: [1000, 'Actual hours cannot exceed 1000']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  }
}, {
  timestamps: true
});

// Index for efficient queries
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ projectId: 1, assigneeId: 1 });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);