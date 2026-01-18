#!/usr/bin/env node

/**
 * agentful Analysis Engine
 * Smart project analysis for autonomous development
 *
 * @module agentful/analyzer
 */

export { analyzeProject, exportToArchitectureJson } from './project-analyzer.js';
export { detectDomains, getDomainKeywords, getAllDomains, addCustomDomainPattern } from './domain-detector.js';
export { detectTechStack } from './tech-stack-detector.js';

/**
 * Main entry point for project analysis
 * @param {string} projectRoot - Root directory of the project to analyze
 * @returns {Promise<Object>} Comprehensive project analysis
 */
export async function analyze(projectRoot) {
  return await analyzeProject(projectRoot);
}

/**
 * Quick tech stack detection
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} Detected tech stack
 */
export async function detectStack(projectRoot) {
  return await detectTechStack(projectRoot);
}

/**
 * Domain detection
 * @param {string} projectRoot - Root directory of the project
 * @param {Object} quickScan - Optional quick scan results
 * @returns {Promise<Object>} Detected domains with confidence scores
 */
export async function detectBusinessDomains(projectRoot, quickScan) {
  return await detectDomains(projectRoot, quickScan);
}
