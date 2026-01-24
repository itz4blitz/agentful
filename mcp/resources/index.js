/**
 * MCP Resources Index
 * Centralized export of all agentful MCP resources
 */

import { createAdapters } from './adapters.js';
import { productSpecResource } from './product-spec.js';
import { stateResource } from './state.js';
import { completionResource } from './completion.js';
import { decisionsResource } from './decisions.js';
import { agentsResource, agentResource } from './agents.js';

/**
 * All available resources
 */
export const resources = [
  productSpecResource,
  stateResource,
  completionResource,
  decisionsResource,
  agentsResource,
  agentResource
];

/**
 * Resource registry by URI pattern
 */
export const resourceRegistry = {
  'agentful://product/spec': productSpecResource,
  'agentful://state/current': stateResource,
  'agentful://completion': completionResource,
  'agentful://decisions': decisionsResource,
  'agentful://agents/list': agentsResource,
  'agentful://agents/{name}': agentResource
};

/**
 * Get resource by URI
 * Supports template URIs (e.g., agentful://agents/{name})
 * @param {string} uri - Resource URI
 * @returns {Object|null} Resource definition or null if not found
 */
export function getResource(uri) {
  // Direct match
  if (resourceRegistry[uri]) {
    return resourceRegistry[uri];
  }

  // Template match
  for (const [pattern, resource] of Object.entries(resourceRegistry)) {
    if (pattern.includes('{')) {
      const regex = new RegExp('^' + pattern.replace(/\{[^}]+\}/g, '([^/]+)') + '$');
      if (regex.test(uri)) {
        return resource;
      }
    }
  }

  return null;
}

/**
 * Extract parameters from templated URI
 * @param {string} uri - Actual URI
 * @param {string} pattern - URI pattern with {param} placeholders
 * @returns {Object} Extracted parameters
 */
export function extractParams(uri, pattern) {
  const paramNames = [];
  const regex = pattern.replace(/\{([^}]+)\}/g, (match, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });

  const matches = uri.match(new RegExp('^' + regex + '$'));
  if (!matches) {
    return {};
  }

  const params = {};
  paramNames.forEach((name, index) => {
    params[name] = matches[index + 1];
  });

  return params;
}

/**
 * List all available resources
 * @returns {Array} Array of resource metadata
 */
export function listResources() {
  return resources.map(resource => ({
    uri: resource.uri,
    name: resource.name,
    description: resource.description,
    mimeType: resource.mimeType
  }));
}

/**
 * Read a resource by URI
 * @param {string} uri - Resource URI
 * @param {string} [projectRoot] - Optional project root (defaults to cwd)
 * @returns {Promise<Object>} Resource contents
 */
export async function readResource(uri, projectRoot) {
  const resource = getResource(uri);

  if (!resource) {
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          error: 'Resource not found',
          uri,
          hint: 'Use listResources() to see available resources'
        }, null, 2)
      }]
    };
  }

  const adapters = createAdapters(projectRoot);
  const params = extractParams(uri, resource.uri);

  return await resource.read(adapters, params);
}

/**
 * Watch a resource for changes
 * @param {string} uri - Resource URI
 * @param {Function} callback - Callback function to invoke on change
 * @param {Object} options - Watch options
 * @returns {Function} Unwatch function
 */
export function watchResource(uri, callback, options = {}) {
  const interval = options.interval || 5000; // Default 5s polling

  let lastContent = null;
  const timerId = setInterval(async () => {
    try {
      const result = await readResource(uri, options.projectRoot);
      const content = JSON.stringify(result);

      if (content !== lastContent) {
        lastContent = content;
        callback(result);
      }
    } catch (error) {
      // Silently ignore errors in watch loop
    }
  }, interval);

  // Return unwatch function
  return () => clearInterval(timerId);
}

// Export individual resources for direct import
export {
  productSpecResource,
  stateResource,
  completionResource,
  decisionsResource,
  agentsResource,
  agentResource
};

// Export adapters for advanced usage
export { createAdapters };
