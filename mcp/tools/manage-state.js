/**
 * MCP Tool: Manage State
 *
 * Read and write agentful state files (.agentful/state.json, completion.json, decisions.json, etc.).
 * Provides atomic operations with validation and backup support.
 *
 * @module mcp/tools/manage-state
 */

/**
 * Manage State Tool Definition
 *
 * @type {Object}
 */
export const manageStateTool = {
  name: 'manage_state',
  description: 'Read or write agentful state files (state.json, completion.json, decisions.json, architecture.json). Supports atomic operations with validation.',

  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'update', 'delete', 'list'],
        description: 'Operation to perform: read (get content), write (replace), update (merge), delete (remove key), list (show all files)'
      },
      file: {
        type: 'string',
        enum: ['state', 'completion', 'decisions', 'architecture', 'metadata'],
        description: 'State file to operate on (maps to .agentful/{file}.json)'
      },
      data: {
        type: 'object',
        description: 'Data to write or update (required for write/update operations)',
        additionalProperties: true
      },
      path: {
        type: 'string',
        description: 'Dot-notation path to read/update specific field (e.g., "decisions.0.status")'
      },
      validate: {
        type: 'boolean',
        description: 'Validate data against schema before writing',
        default: true
      },
      backup: {
        type: 'boolean',
        description: 'Create backup before writing',
        default: true
      }
    },
    required: ['operation']
  },

  /**
   * Handler function for state management operations
   *
   * @param {Object} input - Tool input parameters
   * @param {string} input.operation - Operation type
   * @param {string} [input.file] - State file name
   * @param {Object} [input.data] - Data to write/update
   * @param {string} [input.path] - Dot-notation path
   * @param {boolean} [input.validate=true] - Validate before write
   * @param {boolean} [input.backup=true] - Create backup
   * @param {Object} adapters - MCP adapters
   * @param {Object} adapters.state - State management adapter
   * @returns {Promise<Object>} MCP response with operation result
   */
  async handler(input, adapters) {
    const {
      operation,
      file,
      data,
      path,
      validate = true,
      backup = true
    } = input;

    // Validate operation
    const allowedOperations = ['read', 'write', 'update', 'delete', 'list'];
    if (!allowedOperations.includes(operation)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid operation',
            message: `Operation must be one of: ${allowedOperations.join(', ')}`,
            received: operation
          }, null, 2)
        }],
        isError: true
      };
    }

    // List operation doesn't require a file
    if (operation === 'list') {
      try {
        const files = await adapters.state.listStateFiles();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              operation: 'list',
              files: files.map(f => ({
                name: f.name,
                path: f.path,
                size: f.size,
                lastModified: f.lastModified,
                exists: f.exists
              })),
              count: files.length,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'List operation failed',
              message: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    // Validate file parameter for non-list operations
    const allowedFiles = ['state', 'completion', 'decisions', 'architecture', 'metadata'];
    if (!file || !allowedFiles.includes(file)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid or missing file',
            message: `File must be one of: ${allowedFiles.join(', ')}`,
            received: file || null
          }, null, 2)
        }],
        isError: true
      };
    }

    // Validate that write/update operations have data
    if ((operation === 'write' || operation === 'update') && !data) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Missing data',
            message: 'Write and update operations require a "data" parameter'
          }, null, 2)
        }],
        isError: true
      };
    }

    // Validate path format if provided
    if (path) {
      // Basic validation - no weird characters
      if (!/^[a-zA-Z0-9._\[\]]+$/.test(path)) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Invalid path',
              message: 'Path must contain only alphanumeric characters, dots, and brackets',
              received: path
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    try {
      let result;

      // Execute operation based on type
      switch (operation) {
        case 'read':
          result = await adapters.state.readState({
            file,
            path
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                operation: 'read',
                file,
                path: path || null,
                data: result.data,
                metadata: {
                  lastModified: result.lastModified,
                  size: result.size
                },
                timestamp: new Date().toISOString()
              }, null, 2)
            }]
          };

        case 'write':
          result = await adapters.state.writeState({
            file,
            data,
            validate,
            backup
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                operation: 'write',
                file,
                written: true,
                validated: validate,
                backupCreated: backup ? result.backupPath : false,
                timestamp: new Date().toISOString(),
                message: `State file "${file}" written successfully`
              }, null, 2)
            }]
          };

        case 'update':
          result = await adapters.state.updateState({
            file,
            data,
            path,
            validate,
            backup
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                operation: 'update',
                file,
                path: path || null,
                updated: true,
                validated: validate,
                backupCreated: backup ? result.backupPath : false,
                previousValue: result.previousValue || null,
                timestamp: new Date().toISOString(),
                message: path
                  ? `Updated "${path}" in ${file}.json`
                  : `Merged updates into ${file}.json`
              }, null, 2)
            }]
          };

        case 'delete':
          if (!path) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Missing path',
                  message: 'Delete operation requires a "path" parameter to specify what to delete'
                }, null, 2)
              }],
              isError: true
            };
          }

          result = await adapters.state.deleteStateField({
            file,
            path,
            backup
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                operation: 'delete',
                file,
                path,
                deleted: true,
                backupCreated: backup ? result.backupPath : false,
                previousValue: result.previousValue || null,
                timestamp: new Date().toISOString(),
                message: `Deleted "${path}" from ${file}.json`
              }, null, 2)
            }]
          };

        default:
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Unhandled operation',
                message: `Operation "${operation}" is not implemented`
              }, null, 2)
            }],
            isError: true
          };
      }

    } catch (error) {
      // Handle state management errors
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'State operation failed',
            message: error.message,
            operation,
            file,
            suggestion: error.code === 'ENOENT'
              ? `State file ${file}.json does not exist. It will be created automatically on first write.`
              : error.code === 'EACCES'
                ? 'Permission denied. Check file permissions for .agentful directory.'
                : error.message.includes('validation')
                  ? 'Data validation failed. Check that data matches the expected schema.'
                  : 'Check that the state adapter is properly configured.'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

export default manageStateTool;
