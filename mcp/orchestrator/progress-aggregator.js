/**
 * Progress Aggregator
 *
 * Collects and aggregates progress information from distributed workers,
 * providing real-time visibility into overall execution status and completion metrics.
 *
 * @module mcp/orchestrator/progress-aggregator
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

/**
 * ProgressAggregator - Aggregates progress from distributed workers
 *
 * Features:
 * - Real-time progress tracking
 * - Worker status monitoring
 * - Completion metrics calculation
 * - Progress persistence
 * - Event-based updates
 *
 * @extends EventEmitter
 */
export class ProgressAggregator extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      persistencePath: options.persistencePath || null,
      updateInterval: options.updateInterval || 1000, // 1 second
      autoSave: options.autoSave !== false,
      ...options
    };

    /** @type {Map<string, FeatureProgress>} */
    this.featureProgress = new Map();

    /** @type {Map<string, WorkerStatus>} */
    this.workerStatus = new Map();

    /** @type {Object} */
    this.overallProgress = {
      totalFeatures: 0,
      completedFeatures: 0,
      inProgressFeatures: 0,
      failedFeatures: 0,
      pendingFeatures: 0,
      percentComplete: 0,
      startTime: null,
      estimatedEndTime: null,
      lastUpdated: null
    };

    this._autoSaveTimer = null;
    if (this.options.autoSave && this.options.persistencePath) {
      this._startAutoSave();
    }
  }

  /**
   * Initialize progress tracking for features
   *
   * @param {Object[]} features - Array of features to track
   * @param {Object} plan - Execution plan
   */
  initialize(features, plan) {
    this.overallProgress.totalFeatures = features.length;
    this.overallProgress.startTime = new Date().toISOString();

    // Initialize feature progress
    for (const feature of features) {
      this.featureProgress.set(feature.id, {
        featureId: feature.id,
        agent: feature.agent,
        status: 'pending',
        progress: 0,
        workerId: null,
        startTime: null,
        endTime: null,
        error: null,
        metadata: feature.metadata || {}
      });
    }

    // Initialize worker status from plan
    if (plan && plan.workerUtilization) {
      for (const workerId of Object.keys(plan.workerUtilization)) {
        this.workerStatus.set(workerId, {
          workerId,
          status: 'idle',
          currentFeature: null,
          completedFeatures: 0,
          failedFeatures: 0,
          totalTime: 0,
          lastSeen: new Date().toISOString()
        });
      }
    }

    this.overallProgress.pendingFeatures = features.length;
    this._recalculateProgress();

    this.emit('initialized', {
      features: features.length,
      workers: this.workerStatus.size
    });
  }

  /**
   * Update progress for a specific feature
   *
   * @param {string} featureId - Feature ID
   * @param {Object} update - Progress update
   * @param {string} [update.status] - Status: pending|in-progress|complete|failed
   * @param {number} [update.progress] - Progress 0-100
   * @param {string} [update.workerId] - Worker ID
   * @param {string} [update.error] - Error message if failed
   */
  updateFeature(featureId, update) {
    const current = this.featureProgress.get(featureId);
    if (!current) {
      throw new Error(`Unknown feature: ${featureId}`);
    }

    const previous = { ...current };

    // Update fields
    if (update.status) {
      current.status = update.status;

      if (update.status === 'in-progress' && !current.startTime) {
        current.startTime = new Date().toISOString();
      }

      if (update.status === 'complete' || update.status === 'failed') {
        current.endTime = new Date().toISOString();
      }
    }

    if (update.progress !== undefined) {
      current.progress = Math.min(100, Math.max(0, update.progress));
    }

    if (update.workerId) {
      current.workerId = update.workerId;
    }

    if (update.error) {
      current.error = update.error;
    }

    this.featureProgress.set(featureId, current);

    // Update worker status
    if (current.workerId) {
      this._updateWorkerForFeature(current, previous);
    }

    this._recalculateProgress();

    this.emit('feature-updated', {
      featureId,
      previous: previous.status,
      current: current.status,
      progress: current.progress
    });

    // Auto-save if enabled
    if (this.options.autoSave && this.options.persistencePath) {
      this._scheduleSave();
    }
  }

  /**
   * Update worker status based on feature change
   *
   * @private
   * @param {Object} current - Current feature state
   * @param {Object} previous - Previous feature state
   */
  _updateWorkerForFeature(current, previous) {
    const worker = this.workerStatus.get(current.workerId);
    if (!worker) {
      // Create worker status if it doesn't exist
      this.workerStatus.set(current.workerId, {
        workerId: current.workerId,
        status: 'active',
        currentFeature: current.featureId,
        completedFeatures: 0,
        failedFeatures: 0,
        totalTime: 0,
        lastSeen: new Date().toISOString()
      });
      return;
    }

    worker.lastSeen = new Date().toISOString();

    // Update worker state based on feature status
    if (current.status === 'in-progress') {
      worker.status = 'active';
      worker.currentFeature = current.featureId;
    }

    if (current.status === 'complete' && previous.status !== 'complete') {
      worker.completedFeatures++;
      worker.currentFeature = null;
      worker.status = 'idle';

      // Calculate time spent
      if (current.startTime && current.endTime) {
        const elapsed = new Date(current.endTime) - new Date(current.startTime);
        worker.totalTime += elapsed;
      }
    }

    if (current.status === 'failed' && previous.status !== 'failed') {
      worker.failedFeatures++;
      worker.currentFeature = null;
      worker.status = 'idle';
    }
  }

  /**
   * Recalculate overall progress metrics
   *
   * @private
   */
  _recalculateProgress() {
    let completed = 0;
    let inProgress = 0;
    let failed = 0;
    let pending = 0;

    for (const feature of this.featureProgress.values()) {
      switch (feature.status) {
        case 'complete':
          completed++;
          break;
        case 'in-progress':
          inProgress++;
          break;
        case 'failed':
          failed++;
          break;
        case 'pending':
          pending++;
          break;
      }
    }

    this.overallProgress.completedFeatures = completed;
    this.overallProgress.inProgressFeatures = inProgress;
    this.overallProgress.failedFeatures = failed;
    this.overallProgress.pendingFeatures = pending;

    const total = this.overallProgress.totalFeatures;
    this.overallProgress.percentComplete = total > 0 ? (completed / total) * 100 : 0;

    this.overallProgress.lastUpdated = new Date().toISOString();

    // Estimate completion time based on current rate
    if (completed > 0 && this.overallProgress.startTime) {
      const elapsed = Date.now() - new Date(this.overallProgress.startTime).getTime();
      const avgTimePerFeature = elapsed / completed;
      const remainingFeatures = total - completed;
      const estimatedRemaining = avgTimePerFeature * remainingFeatures;
      this.overallProgress.estimatedEndTime = new Date(Date.now() + estimatedRemaining).toISOString();
    }
  }

  /**
   * Get current overall progress
   *
   * @returns {Object} Overall progress metrics
   */
  getProgress() {
    return { ...this.overallProgress };
  }

  /**
   * Get progress for a specific feature
   *
   * @param {string} featureId - Feature ID
   * @returns {Object|null} Feature progress or null
   */
  getFeatureProgress(featureId) {
    const progress = this.featureProgress.get(featureId);
    return progress ? { ...progress } : null;
  }

  /**
   * Get status for a specific worker
   *
   * @param {string} workerId - Worker ID
   * @returns {Object|null} Worker status or null
   */
  getWorkerStatus(workerId) {
    const status = this.workerStatus.get(workerId);
    return status ? { ...status } : null;
  }

  /**
   * Get all worker statuses
   *
   * @returns {Object[]} Array of worker statuses
   */
  getAllWorkerStatuses() {
    return Array.from(this.workerStatus.values());
  }

  /**
   * Get all feature progress
   *
   * @returns {Object[]} Array of feature progress
   */
  getAllFeatureProgress() {
    return Array.from(this.featureProgress.values());
  }

  /**
   * Get summary report
   *
   * @returns {Object} Summary report
   */
  getSummary() {
    const progress = this.getProgress();
    const workers = this.getAllWorkerStatuses();

    return {
      progress,
      workers: workers.map(w => ({
        id: w.workerId,
        status: w.status,
        completed: w.completedFeatures,
        failed: w.failedFeatures,
        active: w.currentFeature !== null
      })),
      timeline: {
        started: progress.startTime,
        estimatedEnd: progress.estimatedEndTime,
        duration: progress.startTime
          ? Date.now() - new Date(progress.startTime).getTime()
          : 0
      }
    };
  }

  /**
   * Save progress to disk
   *
   * @param {string} [filePath] - Optional custom file path
   * @returns {Promise<void>}
   */
  async save(filePath = null) {
    const targetPath = filePath || this.options.persistencePath;
    if (!targetPath) {
      throw new Error('No persistence path configured');
    }

    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      progress: this.overallProgress,
      features: Array.from(this.featureProgress.values()),
      workers: Array.from(this.workerStatus.values())
    };

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, JSON.stringify(data, null, 2));

    this.emit('saved', targetPath);
  }

  /**
   * Load progress from disk
   *
   * @param {string} [filePath] - Optional custom file path
   * @returns {Promise<void>}
   */
  async load(filePath = null) {
    const targetPath = filePath || this.options.persistencePath;
    if (!targetPath) {
      throw new Error('No persistence path configured');
    }

    const content = await fs.readFile(targetPath, 'utf-8');
    const data = JSON.parse(content);

    this.overallProgress = data.progress;

    this.featureProgress.clear();
    for (const feature of data.features) {
      this.featureProgress.set(feature.featureId, feature);
    }

    this.workerStatus.clear();
    for (const worker of data.workers) {
      this.workerStatus.set(worker.workerId, worker);
    }

    this.emit('loaded', targetPath);
  }

  /**
   * Start auto-save timer
   *
   * @private
   */
  _startAutoSave() {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
    }

    this._autoSaveTimer = setInterval(() => {
      this.save().catch(err => {
        this.emit('save-error', err);
      });
    }, this.options.updateInterval);
  }

  /**
   * Schedule a save (debounced)
   *
   * @private
   */
  _scheduleSave() {
    // Simple debouncing: already handled by auto-save interval
  }

  /**
   * Stop auto-save and cleanup
   */
  destroy() {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }

    this.removeAllListeners();
  }
}

/**
 * @typedef {Object} FeatureProgress
 * @property {string} featureId - Feature ID
 * @property {string} agent - Agent type
 * @property {string} status - Status: pending|in-progress|complete|failed
 * @property {number} progress - Progress 0-100
 * @property {string|null} workerId - Assigned worker ID
 * @property {string|null} startTime - Start timestamp
 * @property {string|null} endTime - End timestamp
 * @property {string|null} error - Error message
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} WorkerStatus
 * @property {string} workerId - Worker ID
 * @property {string} status - Status: idle|active|error
 * @property {string|null} currentFeature - Currently executing feature
 * @property {number} completedFeatures - Count of completed features
 * @property {number} failedFeatures - Count of failed features
 * @property {number} totalTime - Total execution time (ms)
 * @property {string} lastSeen - Last activity timestamp
 */

export default ProgressAggregator;
