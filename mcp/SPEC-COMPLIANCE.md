# MCP Specification Compliance

**Current Implementation:** agentful MCP Server v1.2.0
**Protocol Version:** 2024-11-05
**Last Updated:** 2026-01-23

---

## Executive Summary

The agentful MCP server currently implements **MCP Protocol 2024-11-05**, which is the foundational specification **without authorization features**. OAuth and authentication were added in later specifications (2025-03-26 and beyond).

**Current Status:**
- ✅ **2024-11-05 Spec: FULLY COMPLIANT**
- ⚠️ **OAuth/Auth Support: NOT IMPLEMENTED** (not required for 2024-11-05)

---

## MCP Protocol Evolution

| Version | Release Date | Key Features | Our Status |
|---------|-------------|--------------|------------|
| **2024-11-05** | Nov 2024 | Core protocol, tools, resources | ✅ **Implemented** |
| **2025-03-26** | Mar 2025 | OAuth 2.1, authorization | ❌ Not implemented |
| **2025-06-18** | Jun 2025 | Enterprise features, client registration | ❌ Not implemented |

---

## 2024-11-05 Specification Compliance

### ✅ Core Protocol (FULLY COMPLIANT)

| Feature | Status | Notes |
|---------|--------|-------|
| JSON-RPC 2.0 | ✅ | Via @modelcontextprotocol/sdk |
| STDIO Transport | ✅ | Primary transport method |
| Initialize Handshake | ✅ | Protocol version negotiation |
| Server Capabilities | ✅ | Tools and resources advertised |
| Error Handling | ✅ | Proper JSON-RPC error codes |

### ✅ Tools (FULLY COMPLIANT)

| Capability | Status | Implementation |
|------------|--------|----------------|
| tools/list | ✅ | 8 tools registered |
| tools/call | ✅ | Full execution support |
| Input Schema Validation | ✅ | JSON Schema validation |
| Tool Registration | ✅ | Dynamic tool registry |

**Registered Tools:**
1. launch_specialist
2. get_status
3. update_progress
4. run_validation
5. resolve_decision
6. analyze_architecture
7. generate_agents
8. manage_state

### ✅ Resources (FULLY COMPLIANT)

| Capability | Status | Implementation |
|------------|--------|----------------|
| resources/list | ✅ | 6 resources registered |
| resources/read | ✅ | Full read support |
| URI Schemes | ✅ | agentful:// custom scheme |
| Resource Templates | ✅ | Dynamic URIs supported |

**Registered Resources:**
1. agentful://product/spec
2. agentful://state/current
3. agentful://completion
4. agentful://decisions
5. agentful://agents/list
6. agentful://agents/{agentName}

### ✅ Transport (STDIO - FULLY COMPLIANT)

| Feature | Status | Notes |
|---------|--------|-------|
| Stdin/Stdout | ✅ | JSON-RPC over stdio |
| Logging to Stderr | ✅ | All logs go to stderr only |
| Message Framing | ✅ | Newline-delimited JSON |
| Graceful Shutdown | ✅ | SIGINT/SIGTERM handlers |

---

## ❌ Authorization (NOT IMPLEMENTED)

The following features from **MCP 2025-03-26** and later are **not currently implemented**:

### Missing OAuth 2.1 Support
- ❌ OAuth 2.1 Authorization Code Flow
- ❌ Client Credentials Grant
- ❌ PKCE (Proof Key for Code Exchange)
- ❌ Authorization Server Metadata (RFC8414)
- ❌ Dynamic Client Registration (RFC7591)
- ❌ Token Validation and Rotation
- ❌ Bearer Token Authorization

### Missing Authentication Endpoints
- ❌ Authorization Endpoint
- ❌ Token Endpoint
- ❌ Registration Endpoint
- ❌ Metadata Discovery Endpoint

### Missing Security Features
- ❌ Redirect URI Validation
- ❌ Token Expiration
- ❌ Secure Token Storage
- ❌ HTTPS Enforcement (for remote servers)

---

## Why No OAuth for 2024-11-05?

The **2024-11-05 specification did not include authorization** as part of the core protocol:

> "In the very beginning, version 2024-11-05 of the MCP specification didn't cover authorization as a concern, and so in hindsight, it was no surprise to find that nearly all MCP servers from back then were expected to be run on localhost."

**Current Use Case:**
- ✅ **localhost-only execution** (Claude Desktop, Kiro, local MCP clients)
- ✅ **stdio transport** (process-based, no network exposure)
- ✅ **OS-level permissions** (user's filesystem access controls)

**When OAuth is NOT needed:**
- Running on localhost only
- Using stdio transport (stdin/stdout)
- No remote network access
- Single-user execution

**When OAuth IS needed:**
- Remote MCP servers over HTTP/HTTPS
- Multi-user environments
- Third-party client access
- Enterprise deployments

---

## Roadmap: Adding OAuth Support

If remote/multi-user access is required, we would need to upgrade to **MCP 2025-03-26** or later:

### Phase 1: HTTP/SSE Transport
- [ ] Implement HTTP transport
- [ ] Add SSE (Server-Sent Events) support
- [ ] HTTPS enforcement

### Phase 2: OAuth 2.1 Foundation
- [ ] Authorization Code Flow with PKCE
- [ ] Client Credentials Grant
- [ ] Authorization Server Metadata (RFC8414)
- [ ] Token issuance and validation

### Phase 3: Client Management
- [ ] Dynamic Client Registration (RFC7591)
- [ ] Client ID/Secret management
- [ ] Redirect URI validation

### Phase 4: Enterprise Features
- [ ] Token rotation and expiration
- [ ] Revocation support
- [ ] Audit logging
- [ ] Rate limiting

**Estimated Effort:** 15-20 hours for full OAuth 2.1 compliance

---

## Current Deployment Model

**Primary Use Case:** Local execution via stdio

```json
{
  "mcpServers": {
    "agentful": {
      "command": "npx",
      "args": ["@itz4blitz/agentful-mcp"],
      "env": {
        "AGENTFUL_PROJECT_ROOT": "/path/to/project"
      }
    }
  }
}
```

**Security Model:**
- Process runs with user's OS-level permissions
- No network exposure (stdio only)
- Filesystem access controlled by OS
- No authentication needed (local trust boundary)

This is the **standard MCP deployment pattern** for 2024-11-05 servers.

---

## Compatibility Matrix

| MCP Client | Transport | Auth Required | Supported |
|------------|-----------|---------------|-----------|
| Claude Desktop | stdio | No | ✅ YES |
| Kiro | stdio | No | ✅ YES |
| MCP Inspector | stdio | No | ✅ YES |
| Custom stdio client | stdio | No | ✅ YES |
| Remote HTTP client | HTTP/SSE | OAuth 2.1 | ❌ NO (not implemented) |

---

## Testing Coverage

### ✅ Protocol Compliance Tests
- [x] Initialize handshake
- [x] Protocol version negotiation
- [x] Capability advertisement
- [x] Error handling

### ✅ Tool Tests
- [x] tools/list
- [x] tools/call with valid parameters
- [x] Schema validation (rejects invalid inputs)
- [x] Error responses

### ✅ Resource Tests
- [x] resources/list
- [x] resources/read
- [x] URI resolution
- [x] Template expansion

### ❌ Authorization Tests (N/A for 2024-11-05)
- [ ] OAuth authorization flow
- [ ] Token validation
- [ ] Client registration
- [ ] Metadata discovery

---

## Recommendations

### For localhost-only use (current):
✅ **No changes needed** - Current implementation is fully compliant with MCP 2024-11-05

### For remote/multi-user use:
⚠️ **Upgrade required** - Implement MCP 2025-03-26 specification with OAuth 2.1 support

### Migration Path:
1. Continue using 2024-11-05 for local stdio clients (current)
2. Add HTTP/SSE transport for remote access (optional)
3. Implement OAuth 2.1 when remote access is needed (future)
4. Support both modes: stdio (no auth) + HTTP (OAuth) (hybrid)

---

## Conclusion

The agentful MCP server is **100% compliant with MCP Protocol 2024-11-05**, which is the correct specification for localhost-based stdio execution.

**OAuth/Authentication is NOT required** for the current use case and was not part of the 2024-11-05 specification.

If you need OAuth support for remote/multi-user deployments, that would require upgrading to MCP 2025-03-26 or later, which is a separate initiative.

**Current Status:** ✅ Production-ready for local stdio clients
