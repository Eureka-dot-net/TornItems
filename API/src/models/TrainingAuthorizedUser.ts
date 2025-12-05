import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingAuthorizedUser extends Document {
  tornUserId: number;
  name: string;
  authorizedAt: Date;
}

const TrainingAuthorizedUserSchema = new Schema<ITrainingAuthorizedUser>({
  tornUserId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  authorizedAt: { type: Date, default: Date.now }
});

export const TrainingAuthorizedUser = mongoose.model<ITrainingAuthorizedUser>('TrainingAuthorizedUser', TrainingAuthorizedUserSchema);
