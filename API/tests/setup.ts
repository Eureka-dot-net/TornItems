import { connectDB, closeDB } from '../src/config/db';

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await closeDB();
});
