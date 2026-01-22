---
name: agentful-mode
description: Toggle agentful mode on/off for automatic routing
---

# /agentful-mode

Toggle agentful mode on/off. When enabled, all user prompts automatically route to `/agentful`.

## Usage

```bash
/agentful-mode          # Toggle mode (on ↔ off)
/agentful-on            # Enable agentful mode
/agentful-off           # Disable agentful mode
```

## What is Agentful Mode?

When **enabled**:
- All user messages automatically route to `/agentful` command
- Natural language requests go through conversation skill
- Structured development workflow is always active
- Slash commands still work normally

When **disabled** (default):
- Normal Claude Code behavior
- Must explicitly use `/agentful` or other commands
- Direct chat with Claude without framework

## Implementation

When you run this command:

1. Read current mode from `.agentful/mode.json`
2. Toggle the `enabled` flag
3. Save back to file
4. Show current status

```javascript
import fs from 'fs/promises';
import path from 'path';

const STATE_FILE = '.agentful/mode.json';

async function toggleMode() {
  // Ensure .agentful directory exists
  await fs.mkdir('.agentful', { recursive: true });

  // Read current state
  let currentState = { enabled: false };
  try {
    const content = await fs.readFile(STATE_FILE, 'utf-8');
    currentState = JSON.parse(content);
  } catch (error) {
    // File doesn't exist yet, use default
  }

  // Toggle
  const newState = { enabled: !currentState.enabled };

  // Save
  await fs.writeFile(STATE_FILE, JSON.stringify(newState, null, 2));

  return newState.enabled;
}

// Determine action from command
const args = process.env.COMMAND_ARGS || '';
let action = 'toggle';

if (args.includes('on')) {
  action = 'enable';
} else if (args.includes('off')) {
  action = 'disable';
}

// Execute action
let enabled;
if (action === 'enable') {
  await fs.writeFile(STATE_FILE, JSON.stringify({ enabled: true }, null, 2));
  enabled = true;
} else if (action === 'disable') {
  await fs.writeFile(STATE_FILE, JSON.stringify({ enabled: false }, null, 2));
  enabled = false;
} else {
  enabled = await toggleMode();
}

// Show status
if (enabled) {
  console.log('🤖 Agentful mode: ENABLED');
  console.log('');
  console.log('All prompts will route to /agentful automatically.');
  console.log('Slash commands still work normally.');
  console.log('');
  console.log('To disable: /agentful-off');
} else {
  console.log('💬 Agentful mode: DISABLED');
  console.log('');
  console.log('Normal Claude Code chat mode.');
  console.log('Use /agentful explicitly when needed.');
  console.log('');
  console.log('To enable: /agentful-on');
}
```

## Examples

### Enable Agentful Mode

```
User: /agentful-on

🤖 Agentful mode: ENABLED

All prompts will route to /agentful automatically.
Slash commands still work normally.

To disable: /agentful-off
```

Now all messages go through agentful:

```
User: Add user authentication

🤖 Agentful mode active - routing to /agentful
Original: "Add user authentication"
Routed: /agentful Add user authentication

[Conversation skill processes request and routes to orchestrator]
```

### Disable Agentful Mode

```
User: /agentful-off

💬 Agentful mode: DISABLED

Normal Claude Code chat mode.
Use /agentful explicitly when needed.

To enable: /agentful-on
```

Now back to normal chat:

```
User: What is authentication?

[Direct Claude response without agentful framework]
```

## When to Use Each Mode

### Use Agentful Mode (ON) when:
- Working on product development
- Need structured workflow
- Want automatic task routing
- Building features systematically
- Long coding sessions

### Use Normal Mode (OFF) when:
- Quick questions or explanations
- Learning/exploring concepts
- Code review or debugging
- Ad-hoc tasks
- Casual conversation

## Technical Details

### State File: `.agentful/mode.json`

```json
{
  "enabled": true
}
```

### Hook Integration

The mode is checked by `bin/hooks/agentful-mode-toggle.js` in the `UserPromptSubmit` hook:

1. User submits prompt
2. Hook checks `.agentful/mode.json`
3. If enabled AND not a slash command → Show routing message
4. User sees they're in agentful mode
5. Must manually prepend `/agentful` to prompt if desired

**Note**: Claude Code hooks are read-only. They can't modify prompts, only provide feedback. Users must manually use `/agentful` when mode is enabled, but the hook reminds them.

### Workaround for Auto-Routing

Since hooks can't modify prompts, true auto-routing isn't possible. However, you can:

1. **Create an alias** in your shell:
   ```bash
   # In ~/.zshrc or ~/.bashrc
   claude() {
     if [ -f .agentful/mode.json ] && grep -q '"enabled": true' .agentful/mode.json; then
       command claude --message "/agentful $*"
     else
       command claude "$@"
     fi
   }
   ```

2. **Use Ralph Wiggum plugin** with auto-prepend:
   ```bash
   /ralph-loop "/agentful" --prepend-to-user-input
   ```

3. **Reminder hook** (current implementation):
   - Hook reminds you that mode is active
   - You manually prepend `/agentful` to messages
   - Still faster than typing full slash command each time

## See Also

- `/agentful` - Natural language agentful interface
- `/agentful-start` - Start structured development
- `/agentful-status` - Check current progress
