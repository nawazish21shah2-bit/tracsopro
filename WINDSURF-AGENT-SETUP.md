# Windsurf Agent Setup Guide - Similar to Cursor Agent Mode

## Overview
This guide helps you set up an agent workflow in Windsurf similar to Cursor's agent mode for your Guard Tracking App development.

## What is Cascade (Windsurf's Agent)?

Cascade is Windsurf's AI agent that can:
- **Autonomously execute tasks** across multiple files
- **Run commands** and verify results
- **Create and modify** entire project structures
- **Debug and test** code automatically
- **Research codebases** to understand context
- **Plan and execute** multi-step development tasks

## Key Differences from Cursor Agent

| Feature | Cursor Agent | Windsurf Cascade |
|---------|-------------|------------------|
| Activation | Agent mode toggle | Available by default in chat |
| File Operations | Multi-file edits | Multi-file edits with `multi_edit` |
| Command Execution | Terminal integration | Requires approval for unsafe commands |
| Memory | Session-based | Persistent memory system |
| Planning | Implicit | Explicit task planning with `update_plan` |

## How to Use Windsurf Agent Effectively

### 1. **Task-Based Requests**
Instead of asking for code snippets, request complete tasks:

❌ **Don't**: "Show me how to create a login screen"
✅ **Do**: "Create a complete login screen with email/password validation, error handling, and navigation to home screen"

### 2. **Multi-Step Projects**
Let Cascade handle complex workflows:

```
"Implement the guard check-in feature:
1. Create the check-in screen UI
2. Add location tracking service
3. Implement API integration
4. Add photo capture functionality
5. Create unit tests
6. Update documentation"
```

### 3. **Code Research & Analysis**
Cascade can explore your codebase:

```
"Analyze the current authentication flow and identify where we should add biometric authentication"
```

### 4. **Bug Fixing**
Provide context and let Cascade investigate:

```
"The app crashes when guards try to submit incident reports. Debug and fix the issue."
```

### 5. **Documentation Generation**
Cascade can create comprehensive docs:

```
"Generate complete API documentation for all services in the src/services directory"
```

## Agent Configuration Guidelines

### Memory System
Windsurf has a persistent memory system. You can:
- Save important project context
- Store coding preferences
- Document architectural decisions

Example: "Remember that we're using Redux Toolkit for state management and React Navigation v6"

### Task Planning
For complex tasks, Cascade will create a plan. You can:
- Review the plan before execution
- Request plan modifications
- Track progress step-by-step

### Command Execution
Cascade can run commands but will ask for approval if they:
- Modify files destructively
- Install dependencies
- Make network requests
- Change system state

You can mark commands as "safe to auto-run" in settings.

## Best Practices for Guard Tracking App

### 1. **Start with Architecture**
```
"Review the current project structure and suggest improvements for scalability. 
Then implement the recommended changes."
```

### 2. **Feature Development**
```
"Implement the real-time location tracking feature:
- Add location permissions
- Create location service
- Implement background tracking
- Add map visualization
- Update guard profile with location data
- Add tests"
```

### 3. **Code Quality**
```
"Audit the entire codebase for:
- TypeScript strict mode compliance
- Missing error handling
- Performance issues
- Security vulnerabilities
Then fix all issues found"
```

### 4. **Testing**
```
"Set up comprehensive testing framework with:
- Jest configuration
- React Native Testing Library
- Example unit tests for auth service
- Example integration tests for login flow
- CI/CD test scripts"
```

## Workflow Examples

### Example 1: New Feature Implementation
```
Request: "Implement incident reporting feature with photo upload"

Cascade will:
1. Research existing code structure
2. Create UI components
3. Add camera integration
4. Implement image compression
5. Add API service methods
6. Update navigation
7. Add error handling
8. Create tests
9. Update documentation
```

### Example 2: Debugging
```
Request: "App crashes when opening guard schedule. Debug and fix."

Cascade will:
1. Search for schedule-related code
2. Analyze error patterns
3. Add logging
4. Identify root cause
5. Implement fix
6. Test the fix
7. Add regression tests
```

### Example 3: Refactoring
```
Request: "Refactor all API calls to use a centralized error handling system"

Cascade will:
1. Analyze current API services
2. Design error handling architecture
3. Create error handling utilities
4. Update all API services
5. Add error boundaries
6. Update tests
7. Document new pattern
```

## Quick Command Reference

### Development Commands
```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check
```

### Useful Agent Prompts

**Setup & Configuration:**
- "Set up ESLint and Prettier with React Native best practices"
- "Configure TypeScript strict mode for the entire project"
- "Add pre-commit hooks for linting and testing"

**Feature Development:**
- "Implement [feature] following the existing code patterns"
- "Add [feature] with proper error handling and tests"
- "Create [component] with accessibility support"

**Code Quality:**
- "Refactor [file/folder] to improve maintainability"
- "Add comprehensive error handling to [feature]"
- "Optimize [component] for better performance"

**Documentation:**
- "Generate README for the [feature] module"
- "Create API documentation for all services"
- "Document the deployment process"

**Debugging:**
- "Debug why [issue] is happening"
- "Find and fix all console warnings"
- "Investigate memory leaks in [component]"

## Advanced Features

### 1. **Parallel File Operations**
Cascade can modify multiple files simultaneously for faster development.

### 2. **Code Search & Analysis**
Uses semantic search to understand your codebase context.

### 3. **Persistent Memory**
Remembers your preferences and project decisions across sessions.

### 4. **Browser Preview**
Can spin up and monitor development servers.

### 5. **Deployment Support**
Can help deploy web apps to platforms like Netlify.

## Tips for Maximum Productivity

1. **Be Specific**: Provide clear requirements and context
2. **Trust the Agent**: Let Cascade handle multi-step tasks autonomously
3. **Review Plans**: Check task plans before execution for complex tasks
4. **Provide Feedback**: If output isn't right, explain what needs changing
5. **Use Memory**: Save important decisions for future reference
6. **Iterate**: Break very large features into smaller, manageable tasks

## Migration from Cursor

If you're transitioning from Cursor:

1. **Agent Mode → Always Active**: Cascade is always ready for agentic tasks
2. **Cursor Rules → Memory System**: Use memories to store preferences
3. **@-mentions → Direct Requests**: Reference files/folders directly
4. **Composer → Chat**: Use the chat interface for all requests
5. **Cmd+K → Cmd+L**: Quick actions (check Windsurf shortcuts)

## Common Patterns for Guard Tracking App

### Pattern 1: New Screen
```
"Create a [ScreenName] screen with:
- Navigation setup
- UI components
- State management
- API integration
- Error handling
- Loading states
- Tests"
```

### Pattern 2: Service Integration
```
"Add [ServiceName] service:
- Create service class
- Add API methods
- Implement error handling
- Add response types
- Create mock data for tests
- Write unit tests
- Update documentation"
```

### Pattern 3: State Management
```
"Add Redux slice for [feature]:
- Create slice with actions and reducers
- Add TypeScript types
- Implement selectors
- Create thunks for async operations
- Add tests
- Update store configuration"
```

## Resources

- **Windsurf Documentation**: Check official docs for latest features
- **Guard Tracking App Docs**: See `docs/` folder for project-specific guides
- **Setup Guide**: See `SETUP-GUIDE.md` for environment setup

## Getting Started

Simply start chatting with Cascade about what you want to accomplish:

```
"Let's continue developing the Guard Tracking App. 
Review the current state and suggest the next feature to implement."
```

Cascade will research your code, create a plan, and execute the work autonomously!
