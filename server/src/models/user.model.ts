// src/models/user.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: {
    darkMode: boolean;
    language: string;
    notifications: {
      email: boolean;
      dashboard: boolean;
      telegram?: string;
    };
  };
  watchlist: mongoose.Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profilePicture: {
    type: String
  },
  preferences: {
    darkMode: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      dashboard: {
        type: Boolean,
        default: true
      },
      telegram: {
        type: String
      }
    }
  },
  watchlist: [{
    type: Schema.Types.ObjectId,
    ref: 'Currency'
  }]
}, {
  timestamps: true
});

// Password hash middleware
UserSchema.pre('save', async function(next) {
  const user = this;
  if (!user.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    return next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);