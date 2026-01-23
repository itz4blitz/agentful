/**
 * Global teardown for integration tests
 * Forces process exit to prevent hanging from background operations
 */
export default function teardown() {
  // Give a small grace period for cleanup
  setTimeout(() => {
    console.log('[TEARDOWN] Forcing process exit');
    process.exit(0);
  }, 1000);
}
