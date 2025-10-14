import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  name: string;
  description: string;
  enabled: boolean;
  cronSchedule: string;
  lastRun?: Date;
}

const JobSchema = new Schema<IJob>({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  enabled: { type: Boolean, required: true, default: true },
  cronSchedule: { type: String, required: true },
  lastRun: { type: Date, default: null },
});

export const Job = mongoose.model<IJob>('Job', JobSchema);
