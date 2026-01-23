---
name: agentful-update
description: Smart update mechanism - fetches latest agentful templates and gracefully migrates changes
---

# agentful Update

This command updates your local `.claude/` configuration to the latest agentful version while preserving your customizations.

## What It Does

1. **Fetches latest templates** from npm package `@itz4blitz/agentful`
2. **Three-way merge analysis** - compares:
   - Your current `.claude/` files (with customizations)
   - Old template version (what you started with)
   - New template version (what's available now)
3. **Smart migration** using specialized sub-agent
4. **Validation** to ensure nothing broke
5. **Backup** with rollback capability

## CRITICAL: Do NOT modify .claude/ yourself

This command is the ONLY authorized way to update `.claude/` files after initial installation.

Other agentful commands should NEVER touch `.claude/` - only this command has permission.

## Implementation

### 1. Pre-flight Checks

```javascript
// Check if agentful is initialized
if (!exists('.agentful/state.json')) {
  console.error(`
❌ agentful not initialized!

Run: npx @itz4blitz/agentful init

Cannot update before initialization.
`);
  return;
}

// Check if .claude/ exists
if (!exists('.claude/settings.json')) {
  console.error(`
❌ .claude/ directory missing or corrupted!

This might have been deleted accidentally. To restore:

1. Reinstall from templates: npx @itz4blitz/agentful init --force
2. Or restore from backup: cp -r .claude.backup/ .claude/

Cannot update without existing .claude/ directory.
`);
  return;
}

// Check for git (required for safe updates)
const gitCheck = Bash("git rev-parse --is-inside-work-tree 2>/dev/null");
if (!gitCheck.success) {
  console.error(`
⚠️  Not in a git repository!

For safety, agentful-update requires git to track changes.

Initialize git first:
  git init
  git add .
  git commit -m "Initial commit"

Then run /agentful-update again.
`);
  return;
}

// Check for uncommitted changes in .claude/
const dirtyCheck = Bash("git diff --quiet .claude/ && git diff --cached --quiet .claude/");
if (!dirtyCheck.success) {
  console.error(`
⚠️  Uncommitted changes in .claude/

Please commit or stash your .claude/ changes before updating:

  git add .claude/
  git commit -m "Save .claude/ customizations"

Or stash:
  git stash push .claude/

This ensures we can safely merge updates.
`);
  return;
}
```

### 2. Create Backup

```javascript
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = `.claude.backup-${timestamp}`;

console.log("📦 Creating backup...");
Bash(`cp -r .claude/ ${backupDir}`);

console.log(`✅ Backup created: ${backupDir}`);
```

### 3. Get Latest Templates

```javascript
console.log("🔍 Checking for updates...");

// Get current installed version
const currentVersion = JSON.parse(Read('node_modules/@itz4blitz/agentful/package.json')).version;

// Get latest version from npm
const latestVersionCmd = Bash("npm view @itz4blitz/agentful version");
const latestVersion = latestVersionCmd.stdout.trim();

if (currentVersion === latestVersion) {
  console.log(`✅ Already on latest version (${currentVersion})`);

  // Still offer to re-sync templates
  console.log(`
Would you like to re-sync your .claude/ with the current templates?
This will preserve your customizations but update base files.

Reply 'yes' to continue, or 'no' to cancel.
`);

  // Wait for user confirmation
  // If no, return early
}

console.log(`📥 Updating from ${currentVersion} to ${latestVersion}...`);

// Install latest version
Bash("npm install @itz4blitz/agentful@latest");

console.log("✅ Latest version installed");
```

### 4. Analyze Differences

```javascript
// Path to new templates
const templatePath = 'node_modules/@itz4blitz/agentful/template/.claude/';

console.log("🔍 Analyzing changes...");

// Get list of all template files
const templateFiles = Bash(`find ${templatePath} -type f -not -path "*/.*"`).stdout
  .split('\n')
  .filter(f => f.trim())
  .map(f => f.replace(templatePath, ''));

// Categorize files
const analysis = {
  new_in_template: [],      // Files in new template, not in user's .claude/
  modified_by_user: [],     // Files user customized vs old template
  updated_in_template: [],  // Files changed in new template
  unchanged: [],            // No changes needed
  conflicts: []             // Both user and template modified same file
};

for (const file of templateFiles) {
  const templateFile = `${templatePath}${file}`;
  const userFile = `.claude/${file}`;

  const userExists = exists(userFile);

  if (!userExists) {
    // New file in template
    analysis.new_in_template.push(file);
    continue;
  }

  // Compare hashes to detect changes
  const templateContent = Read(templateFile);
  const userContent = Read(userFile);

  if (templateContent === userContent) {
    analysis.unchanged.push(file);
  } else {
    // File differs - need to determine if user customized or template updated
    // For now, mark as potential conflict (we'll handle in migration step)
    analysis.conflicts.push(file);
  }
}

console.log(`
📊 Analysis complete:
  - ${analysis.new_in_template.length} new files in template
  - ${analysis.conflicts.length} files with potential conflicts
  - ${analysis.unchanged.length} files unchanged
`);
```

### 5. Delegate to Update Agent

```javascript
console.log("🤖 Launching update agent...");

// Use Task tool with specialized update agent
const updatePrompt = `
You are the agentful update agent. Your job is to safely migrate .claude/ files from an old template version to a new one while preserving user customizations.

## Current State

**Backup created**: ${backupDir}

**New template files** (${analysis.new_in_template.length}):
${analysis.new_in_template.map(f => '  - ' + f).join('\n')}

**Potential conflicts** (${analysis.conflicts.length}):
${analysis.conflicts.map(f => '  - ' + f).join('\n')}

**Unchanged** (${analysis.unchanged.length} files)

## Your Task

For each category:

### New Files
- Copy directly from template to .claude/
- These are new features/improvements

### Conflicts
For each conflicting file:
1. Read both versions (user's .claude/ and new template)
2. Identify what changed:
   - If user made cosmetic changes (comments, formatting): keep user's version, log it
   - If template has critical updates (new validation, bug fixes): merge carefully
   - If both have substantial changes: create side-by-side comparison and ask user

3. Strategy:
   - **Commands** (agentful-*.md): Usually safe to replace unless user added custom logic
   - **Agents**: Check if user customized. If yes, preserve personality/style but merge new capabilities
   - **Skills**: Usually safe to replace
   - **settings.json**: Merge carefully - preserve user's hooks/customizations

### Merge Process

Use a git-like approach:
1. Copy new template file to .claude/
2. If user had customizations, apply them on top
3. Mark file with comment: "Updated by /agentful-update on ${new Date().toISOString()}"

## Validation

After all files are updated:
1. Run validation to ensure .claude/ is still functional
2. Test that settings.json is valid JSON
3. Verify all agent files have required frontmatter

## Output

Provide a summary:
- Files added
- Files updated (with merge strategy used)
- Files unchanged
- Any manual review needed

## CRITICAL RULES

- NEVER delete user's customizations without asking
- ALWAYS preserve user's hooks in settings.json
- If uncertain about a merge, ask the user
- Keep backup directory intact until user confirms success
`;

Task({
  description: "Update .claude/ templates",
  prompt: updatePrompt,
  subagent_type: "general-purpose"
});
```

### 6. Post-Update Validation

```javascript
console.log("✅ Update complete!");

console.log(`
🔍 Running validation...
`);

// Validate settings.json
try {
  const settings = JSON.parse(Read('.claude/settings.json'));
  console.log("  ✅ settings.json is valid");
} catch (e) {
  console.error(`
  ❌ settings.json is invalid!

  Error: ${e.message}

  Restoring from backup...
`);
  Bash(`cp ${backupDir}/settings.json .claude/settings.json`);
  return;
}

// Validate agent files have frontmatter
const agents = Bash("find .claude/agents -name '*.md'").stdout.split('\n').filter(f => f.trim());
for (const agent of agents) {
  const content = Read(agent);
  if (!content.startsWith('---')) {
    console.error(`
  ❌ ${agent} missing frontmatter!

  Restoring from backup...
`);
    Bash(`cp ${backupDir}/${agent.replace('.claude/', '')} ${agent}`);
  }
}

console.log("  ✅ All agents valid");

console.log(`
✅ Update successful!

Backup preserved at: ${backupDir}

To remove backup:
  rm -rf ${backupDir}

To rollback:
  rm -rf .claude/
  cp -r ${backupDir} .claude/

Next steps:
1. Review changes: git diff .claude/
2. Test commands: /agentful-start
3. If everything works, commit: git add .claude/ && git commit -m "Update agentful to ${latestVersion}"
`);
```

## Rollback Process

If update fails or causes issues:

```bash
# Remove broken .claude/
rm -rf .claude/

# Restore from backup
cp -r .claude.backup-<timestamp> .claude/

# Verify
/agentful-status
```

## Update Strategies

### Aggressive (--force)
Replace everything with new templates, discarding customizations.

```bash
/agentful-update --force
```

### Conservative (default)
Preserve customizations, only update unchanged files.

### Interactive (--interactive)
Prompt for each file with conflicts.

```bash
/agentful-update --interactive
```

## Common Scenarios

**Scenario: You customized agent personalities**
→ Update preserves personality while merging new capabilities

**Scenario: You added custom commands**
→ Custom commands preserved, core commands updated

**Scenario: You modified settings.json hooks**
→ Hooks preserved, new settings merged in

**Scenario: Template has breaking changes**
→ Update agent creates migration guide and asks for confirmation

## Frequency

Check for updates:
- Monthly for active projects
- Before major feature work
- After reporting bugs (fixes might be available)

## Compatibility

agentful follows semantic versioning:
- **Patch** (0.5.1 → 0.5.2): Bug fixes, safe to update anytime
- **Minor** (0.5.0 → 0.6.0): New features, backward compatible
- **Major** (0.5.0 → 1.0.0): Breaking changes, review carefully

The update agent handles version-specific migrations automatically.
