# GitHub Copilot Agent Instructions

## Core Principles

### 1. NO Backward Compatibility by Default

**IMPORTANT**: Do NOT maintain backward compatibility, legacy code, or deprecated features unless the user EXPLICITLY requests it.

- ❌ **DO NOT** keep old code "just in case"
- ❌ **DO NOT** create "legacy" functions or wrapper functions for compatibility
- ❌ **DO NOT** maintain parallel systems (old and new)
- ❌ **DO NOT** add comments like "maintained for backward compatibility"
- ✅ **DO** remove obsolete code completely
- ✅ **DO** make clean breaks when updating systems
- ✅ **DO** ask the user if they need compatibility before adding it

**Example of what NOT to do:**
```typescript
// ❌ BAD: Keeping legacy code without being asked
export async function updateMonitoredItems() {
  // ... new implementation ...
  
  // Also update legacy collection for backward compatibility
  await updateTrackedItemsLegacy();  // NO! Don't do this unless asked!
}
```

**Example of what TO do:**
```typescript
// ✅ GOOD: Clean implementation without legacy baggage
export async function updateMonitoredItems() {
  // ... new implementation only ...
}
```

### 2. Clean Code Over Convenience

- Remove code that is no longer used
- Delete unused imports, models, functions, and files
- Prefer clarity over cleverness
- Make surgical, minimal changes but don't leave dead code behind

### 3. When to Ask About Backward Compatibility

Only consider backward compatibility if:
1. The user explicitly mentions it in their request

If unsure, ASK the user instead of assuming compatibility is needed.

## Code Cleanup Guidelines

### Removing Obsolete Code

When removing old systems:

1. **Verify it's truly unused:**
   - Check all API endpoints
   - Search for imports/references
   - Check client-side code
   - Look for database queries

2. **Remove completely:**
   - Delete model files
   - Remove functions
   - Update documentation
   - Remove from imports

3. **Don't leave traces:**
   - No commented-out code
   - No "just in case" wrappers
   - No "TODO: remove this later" comments

### Example Cleanup Process

```bash
# ✅ GOOD: Complete removal
- Delete API/src/models/OldModel.ts
- Remove all imports of OldModel
- Remove all functions that only exist for the old model
- Update documentation to remove references
- Clean up any related configuration

# ❌ BAD: Half-hearted cleanup
- Keep OldModel.ts "just in case"
- Add a legacy wrapper function
- Comment out code instead of deleting
- Leave "backward compatibility" notes everywhere
```

## Making Changes

### Principle: Minimal but Complete

- Make the SMALLEST changes necessary to solve the problem
- But don't leave orphaned or dead code behind
- Remove what's obsolete, don't hide it

### Documentation Updates

When removing features:
- Update all relevant documentation files
- Remove references to deprecated systems
- Don't add "legacy" or "deprecated" sections unless code still exists
- Be clear about what the current system is

## Testing Philosophy

### Don't Test Legacy Code

- If you're removing legacy code, don't write tests for it
- Focus tests on the current, active implementation
- Remove tests for deleted functionality

### Migration vs. Compatibility

- **Migration**: Help users move from old to new (temporary documentation)
- **Compatibility**: Keep both systems running (avoid unless requested)

Prefer migration guides over compatibility layers.

## Communication

### When Making Removals

Be clear in commit messages and PR descriptions:
- What was removed and why
- What replaces it (if anything)
- Confirmation that it was verified as unused

### Example PR Description

```markdown
## Removed Obsolete XYZ System

After analysis, confirmed XYZ was completely unused:
- ❌ No API endpoints reference it
- ❌ No client code uses it
- ❌ No database queries depend on it

Removed:
- src/models/XYZ.ts (entire file)
- updateXYZLegacy() function
- All XYZ references from documentation

The ABC system has completely replaced XYZ functionality.
```

## Common Mistakes to Avoid

### ❌ Mistake 1: "Better Safe Than Sorry"
```typescript
// Don't do this unless explicitly asked!
if (useNewSystem) {
  await newImplementation();
} else {
  await oldImplementation(); // "just in case"
}
```

### ❌ Mistake 2: Commented Dead Code
```typescript
// Don't leave commented code
// async function oldFunction() {
//   // old implementation
// }
```

### ❌ Mistake 3: Unnecessary Abstraction
```typescript
// Don't create wrappers for "compatibility"
export const newFunction = oldFunction; // NO!
```

### ✅ Correct Approach: Clean Break
```typescript
// Just use the new implementation directly
export async function currentFunction() {
  // current implementation
}
```

## Summary

**Key Takeaway**: Code should reflect the current state of the system, not its history. Remove obsolete code completely unless the user explicitly asks for backward compatibility.

When in doubt:
1. Remove it completely
2. If the user needs it back, they'll tell you
3. Version control (git) preserves history if needed

Keep the codebase clean, current, and minimal.
