import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProgressAggregator } from '../../orchestrator/progress-aggregator.js';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

describe('ProgressAggregator', () => {
  let aggregator;
  let tempFile;

  beforeEach(async () => {
    tempFile = path.join(tmpdir(), `progress-test-${Date.now()}.json`);
    aggregator = new ProgressAggregator({
      persistencePath: tempFile,
      autoSave: false // Disable auto-save for tests
    });
  });

  afterEach(async () => {
    aggregator.destroy();

    // Cleanup temp file
    try {
      await fs.unlink(tempFile);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('Initialization', () => {
    it('should initialize with features', () => {
      const features = [
        { id: 'A', agent: 'backend' },
        { id: 'B', agent: 'frontend' }
      ];

      const plan = {
        workerUtilization: {
          'worker-1': { assignedFeatures: 0 },
          'worker-2': { assignedFeatures: 0 }
        }
      };

      aggregator.initialize(features, plan);

      expect(aggregator.overallProgress.totalFeatures).toBe(2);
      expect(aggregator.featureProgress.size).toBe(2);
      expect(aggregator.workerStatus.size).toBe(2);
    });

    it('should emit initialized event', (done) => {
      aggregator.on('initialized', (data) => {
        expect(data.features).toBe(1);
        expect(data.workers).toBe(1);
        done();
      });

      aggregator.initialize(
        [{ id: 'A', agent: 'backend' }],
        { workerUtilization: { 'worker-1': {} } }
      );
    });
  });

  describe('Feature Progress Updates', () => {
    beforeEach(() => {
      aggregator.initialize([
        { id: 'A', agent: 'backend' },
        { id: 'B', agent: 'frontend' }
      ], {});
    });

    it('should update feature to in-progress', () => {
      aggregator.updateFeature('A', {
        status: 'in-progress',
        workerId: 'worker-1',
        progress: 50
      });

      const feature = aggregator.getFeatureProgress('A');
      expect(feature.status).toBe('in-progress');
      expect(feature.progress).toBe(50);
      expect(feature.workerId).toBe('worker-1');
      expect(feature.startTime).toBeDefined();
    });

    it('should update feature to complete', () => {
      aggregator.updateFeature('A', { status: 'in-progress', workerId: 'worker-1' });
      aggregator.updateFeature('A', { status: 'complete', progress: 100 });

      const feature = aggregator.getFeatureProgress('A');
      expect(feature.status).toBe('complete');
      expect(feature.progress).toBe(100);
      expect(feature.endTime).toBeDefined();
    });

    it('should update feature to failed with error', () => {
      aggregator.updateFeature('A', {
        status: 'failed',
        error: 'Test error',
        workerId: 'worker-1'
      });

      const feature = aggregator.getFeatureProgress('A');
      expect(feature.status).toBe('failed');
      expect(feature.error).toBe('Test error');
    });

    it('should throw on unknown feature', () => {
      expect(() => {
        aggregator.updateFeature('unknown', { status: 'complete' });
      }).toThrow('Unknown feature: unknown');
    });

    it('should clamp progress to 0-100', () => {
      aggregator.updateFeature('A', { progress: 150 });
      expect(aggregator.getFeatureProgress('A').progress).toBe(100);

      aggregator.updateFeature('A', { progress: -10 });
      expect(aggregator.getFeatureProgress('A').progress).toBe(0);
    });
  });

  describe('Overall Progress Calculation', () => {
    beforeEach(() => {
      aggregator.initialize([
        { id: 'A', agent: 'backend' },
        { id: 'B', agent: 'backend' },
        { id: 'C', agent: 'backend' },
        { id: 'D', agent: 'backend' }
      ], {});
    });

    it('should calculate percent complete', () => {
      aggregator.updateFeature('A', { status: 'complete', workerId: 'worker-1' });
      aggregator.updateFeature('B', { status: 'complete', workerId: 'worker-1' });

      const progress = aggregator.getProgress();
      expect(progress.percentComplete).toBe(50); // 2 of 4
    });

    it('should track in-progress features', () => {
      aggregator.updateFeature('A', { status: 'in-progress', workerId: 'worker-1' });
      aggregator.updateFeature('B', { status: 'in-progress', workerId: 'worker-1' });

      const progress = aggregator.getProgress();
      expect(progress.inProgressFeatures).toBe(2);
      expect(progress.pendingFeatures).toBe(2);
    });

    it('should track failed features', () => {
      aggregator.updateFeature('A', { status: 'failed', workerId: 'worker-1' });

      const progress = aggregator.getProgress();
      expect(progress.failedFeatures).toBe(1);
    });

    it('should estimate completion time', () => {
      // Complete 1 feature
      aggregator.updateFeature('A', { status: 'in-progress', workerId: 'worker-1' });

      // Wait a bit
      setTimeout(() => {
        aggregator.updateFeature('A', { status: 'complete' });

        const progress = aggregator.getProgress();
        expect(progress.estimatedEndTime).toBeDefined();
      }, 10);
    });
  });

  describe('Worker Status Tracking', () => {
    beforeEach(() => {
      aggregator.initialize(
        [{ id: 'A', agent: 'backend' }],
        { workerUtilization: { 'worker-1': {} } }
      );
    });

    it('should update worker status when feature starts', () => {
      aggregator.updateFeature('A', {
        status: 'in-progress',
        workerId: 'worker-1'
      });

      const worker = aggregator.getWorkerStatus('worker-1');
      expect(worker.status).toBe('active');
      expect(worker.currentFeature).toBe('A');
    });

    it('should update worker status when feature completes', () => {
      aggregator.updateFeature('A', { status: 'in-progress', workerId: 'worker-1' });
      aggregator.updateFeature('A', { status: 'complete' });

      const worker = aggregator.getWorkerStatus('worker-1');
      expect(worker.status).toBe('idle');
      expect(worker.currentFeature).toBeNull();
      expect(worker.completedFeatures).toBe(1);
    });

    it('should track failed features on worker', () => {
      aggregator.updateFeature('A', { status: 'in-progress', workerId: 'worker-1' });
      aggregator.updateFeature('A', { status: 'failed' });

      const worker = aggregator.getWorkerStatus('worker-1');
      expect(worker.failedFeatures).toBe(1);
    });

    it('should create worker on first feature assignment', () => {
      aggregator.updateFeature('A', {
        status: 'in-progress',
        workerId: 'worker-new'
      });

      const worker = aggregator.getWorkerStatus('worker-new');
      expect(worker).toBeDefined();
      expect(worker.workerId).toBe('worker-new');
    });

    it('should get all worker statuses', () => {
      aggregator.initialize(
        [{ id: 'A', agent: 'backend' }],
        {
          workerUtilization: {
            'worker-1': {},
            'worker-2': {}
          }
        }
      );

      const workers = aggregator.getAllWorkerStatuses();
      expect(workers).toHaveLength(2);
    });
  });

  describe('Progress Queries', () => {
    beforeEach(() => {
      aggregator.initialize([
        { id: 'A', agent: 'backend' },
        { id: 'B', agent: 'frontend' }
      ], {});
    });

    it('should get progress for specific feature', () => {
      aggregator.updateFeature('A', { progress: 75 });

      const progress = aggregator.getFeatureProgress('A');
      expect(progress.progress).toBe(75);
    });

    it('should return null for unknown feature', () => {
      const progress = aggregator.getFeatureProgress('unknown');
      expect(progress).toBeNull();
    });

    it('should get all feature progress', () => {
      const allProgress = aggregator.getAllFeatureProgress();
      expect(allProgress).toHaveLength(2);
    });

    it('should get summary report', () => {
      aggregator.updateFeature('A', { status: 'complete', workerId: 'worker-1' });

      const summary = aggregator.getSummary();
      expect(summary.progress).toBeDefined();
      expect(summary.workers).toBeDefined();
      expect(summary.timeline).toBeDefined();
    });
  });

  describe('Persistence', () => {
    beforeEach(() => {
      aggregator.initialize([
        { id: 'A', agent: 'backend' }
      ], { workerUtilization: { 'worker-1': {} } });
    });

    it('should save progress to file', async () => {
      aggregator.updateFeature('A', { status: 'complete', workerId: 'worker-1' });

      await aggregator.save();

      const exists = await fs.access(tempFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should load progress from file', async () => {
      aggregator.updateFeature('A', { status: 'complete', workerId: 'worker-1' });
      await aggregator.save();

      // Create new aggregator and load
      const newAggregator = new ProgressAggregator({ persistencePath: tempFile });
      await newAggregator.load();

      const feature = newAggregator.getFeatureProgress('A');
      expect(feature.status).toBe('complete');

      newAggregator.destroy();
    });

    it('should emit saved event', async () => {
      const savedPromise = new Promise((resolve) => {
        aggregator.on('saved', (path) => {
          expect(path).toBe(tempFile);
          resolve();
        });
      });

      await aggregator.save();
      await savedPromise;
    });

    it('should emit loaded event', async () => {
      await aggregator.save();

      const loadedPromise = new Promise((resolve) => {
        aggregator.on('loaded', (path) => {
          expect(path).toBe(tempFile);
          resolve();
        });
      });

      await aggregator.load();
      await loadedPromise;
    });

    it('should throw when saving without path', async () => {
      const noPersistence = new ProgressAggregator({ persistencePath: null });

      await expect(async () => {
        await noPersistence.save();
      }).rejects.toThrow('No persistence path configured');

      noPersistence.destroy();
    });
  });

  describe('Event Emission', () => {
    beforeEach(() => {
      aggregator.initialize([{ id: 'A', agent: 'backend' }], {});
    });

    it('should emit feature-updated event', (done) => {
      aggregator.on('feature-updated', (update) => {
        expect(update.featureId).toBe('A');
        expect(update.current).toBe('in-progress');
        done();
      });

      aggregator.updateFeature('A', { status: 'in-progress', workerId: 'worker-1' });
    });

    it('should include previous status in update event', (done) => {
      aggregator.updateFeature('A', { status: 'in-progress', workerId: 'worker-1' });

      aggregator.on('feature-updated', (update) => {
        expect(update.previous).toBe('in-progress');
        expect(update.current).toBe('complete');
        done();
      });

      aggregator.updateFeature('A', { status: 'complete' });
    });
  });

  describe('Auto-Save', () => {
    it('should auto-save when enabled', async () => {
      const autoSaveAggregator = new ProgressAggregator({
        persistencePath: tempFile,
        autoSave: true,
        updateInterval: 100
      });

      autoSaveAggregator.initialize([{ id: 'A', agent: 'backend' }], {});
      autoSaveAggregator.updateFeature('A', { status: 'complete', workerId: 'worker-1' });

      // Wait for auto-save
      await new Promise(resolve => setTimeout(resolve, 200));

      const exists = await fs.access(tempFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      autoSaveAggregator.destroy();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const listenerCount = aggregator.listenerCount('feature-updated');
      aggregator.destroy();

      // Should remove all listeners
      expect(aggregator.listenerCount('feature-updated')).toBe(0);
    });
  });
});
