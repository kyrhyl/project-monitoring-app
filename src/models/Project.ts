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

export interface IGeotaggedPhoto {
  _id?: string;
  filename: string;
  originalName: string;
  cloudinaryId: string;
  url: string;
  thumbnailUrl: string;
  mimetype: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  description?: string;
  geoData?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    address?: string;
    city?: string;
    country?: string;
  };
  exifData?: {
    make?: string;
    model?: string;
    dateTime?: string;
    orientation?: number;
    flash?: boolean;
  };
}

export interface IProject {
  _id?: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high';
  startDate: Date;
  endDate?: Date;
  progress: number; // 0-100
  contractId?: string;
  contractName?: string;
  appropriation?: string;
  location?: string;
  approvedBudgetContract?: number; // ABC in currency
  contractDuration?: string; // e.g., "12 months", "2 years"
  teamId?: mongoose.Types.ObjectId;
  teamMembers?: mongoose.Types.ObjectId[]; // Specific team members assigned to this project
  attachments?: IAttachment[]; // File attachments
  geotaggedPhotos?: IGeotaggedPhoto[]; // Geotagged photos for project overview
  createdBy: mongoose.Types.ObjectId;
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

const GeotaggedPhotoSchema = new mongoose.Schema<IGeotaggedPhoto>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  cloudinaryId: { type: String, required: true },
  url: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  geoData: {
    latitude: { type: Number },
    longitude: { type: Number },
    altitude: { type: Number },
    accuracy: { type: Number },
    address: { type: String },
    city: { type: String },
    country: { type: String }
  },
  exifData: {
    make: { type: String },
    model: { type: String },
    dateTime: { type: String },
    orientation: { type: Number },
    flash: { type: Boolean }
  }
});

const ProjectSchema = new mongoose.Schema<IProject>({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxLength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'on-hold'],
    default: 'planning',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(this: IProject, value: Date) {
        return !value || value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  progress: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be less than 0'],
    max: [100, 'Progress cannot be more than 100']
  },
  contractId: {
    type: String,
    trim: true,
    maxLength: [50, 'Contract ID cannot exceed 50 characters']
  },
  contractName: {
    type: String,
    trim: true,
    maxLength: [200, 'Contract name cannot exceed 200 characters']
  },
  appropriation: {
    type: String,
    trim: true,
    maxLength: [100, 'Appropriation cannot exceed 100 characters']
  },
  location: {
    type: String,
    trim: true,
    maxLength: [200, 'Location cannot exceed 200 characters']
  },
  approvedBudgetContract: {
    type: Number,
    min: [0, 'Approved budget cannot be negative']
  },
  contractDuration: {
    type: String,
    trim: true,
    maxLength: [50, 'Contract duration cannot exceed 50 characters']
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId
  },
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [AttachmentSchema],
  geotaggedPhotos: [GeotaggedPhotoSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);