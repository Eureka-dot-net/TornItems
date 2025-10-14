import { Job } from '../src/models/Job';

describe('Job Model', () => {
  it('should create a Job', async () => {
    const job = await Job.create({
      name: 'test_job',
      description: 'A test job',
      enabled: true,
      cronSchedule: '* * * * *',
    });

    expect(job.name).toBe('test_job');
    expect(job.description).toBe('A test job');
    expect(job.enabled).toBe(true);
    expect(job.cronSchedule).toBe('* * * * *');
    expect(job.lastRun).toBeUndefined();
    
    await Job.deleteOne({ name: 'test_job' });
  });

  it('should update job enabled status', async () => {
    const job = await Job.create({
      name: 'test_job_2',
      description: 'Another test job',
      enabled: true,
      cronSchedule: '*/5 * * * *',
    });

    expect(job.enabled).toBe(true);

    job.enabled = false;
    await job.save();

    const updatedJob = await Job.findOne({ name: 'test_job_2' });
    expect(updatedJob?.enabled).toBe(false);
    
    await Job.deleteOne({ name: 'test_job_2' });
  });

  it('should update lastRun timestamp', async () => {
    const job = await Job.create({
      name: 'test_job_3',
      description: 'Yet another test job',
      enabled: true,
      cronSchedule: '0 * * * *',
    });

    expect(job.lastRun).toBeUndefined();

    const now = new Date();
    job.lastRun = now;
    await job.save();

    const updatedJob = await Job.findOne({ name: 'test_job_3' });
    expect(updatedJob?.lastRun).toBeDefined();
    expect(updatedJob?.lastRun?.getTime()).toBeCloseTo(now.getTime(), -2);
    
    await Job.deleteOne({ name: 'test_job_3' });
  });

  it('should enforce unique job names', async () => {
    await Job.create({
      name: 'unique_job',
      description: 'A unique job',
      enabled: true,
      cronSchedule: '0 0 * * *',
    });

    await expect(
      Job.create({
        name: 'unique_job',
        description: 'Another job with same name',
        enabled: false,
        cronSchedule: '0 1 * * *',
      })
    ).rejects.toThrow();
    
    await Job.deleteOne({ name: 'unique_job' });
  });
});
