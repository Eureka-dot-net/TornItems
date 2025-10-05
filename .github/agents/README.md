# GitHub Copilot Agent Configuration

This directory contains instructions and guidelines for GitHub Copilot agents working on this repository.

## Files

- **COPILOT_INSTRUCTIONS.md** - Core principles and guidelines for Copilot agents
  - Emphasizes NO backward compatibility unless explicitly requested
  - Code cleanup best practices
  - Testing and documentation philosophy

## Purpose

These instructions help ensure that Copilot agents:
1. Make clean, surgical changes
2. Remove obsolete code completely (no "backward compatibility" by default)
3. Keep the codebase minimal and current
4. Ask for clarification when needed rather than assuming compatibility requirements

## For Repository Maintainers

When working with Copilot:
- If you need backward compatibility, explicitly mention it in your request
- These guidelines ensure agents don't leave legacy code "just in case"
- Review agent instructions periodically to ensure they match your preferences

## For Copilot Agents

Read `COPILOT_INSTRUCTIONS.md` before making any changes to this repository.
