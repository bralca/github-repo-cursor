# Cursor Rules Architecture

This directory contains the Cursor Rules that guide AI assistance in the GitHub Explorer project. These rules are designed to activate contextually based on the files you're working with and the development tasks you're performing.

## How Rules Work in Cursor

Cursor Rules provide context-specific guidance to AI models. Unlike global User Rules (custom instructions), these rules:

- Are stored in your repository and versioned with your code
- Only activate when relevant to your current task
- Can be more detailed without bloating your context window
- Automatically attach to conversations based on file patterns

## Rules Structure

Our rules are organized by domain and follow a consistent naming pattern:

| Rule File | Purpose | Trigger Context |
|-----------|---------|-----------------|
| `database-interactions.mdc` | Database schema update guidance | When modifying database schemas |
| `database-operations.mdc` | Database write operation patterns | When writing to Supabase |
| `error-resolution-prompt.mdc` | Structured error resolution | When resolving code errors |
| `failing-tests.mdc` | Test integrity maintenance | When working with failing tests |
| `file-system-navigation.mdc` | File system operation guidance | When using terminal commands |
| `supabase-migrations.mdc` | Supabase migration protocols | When executing migrations |
| `test-cases.mdc` | Test case implementation | When writing tests |
| `use-of-mock-data.mdc` | Mock data usage guidelines | When working with test data |

## Using Rules Effectively

To leverage these rules effectively:

1. **Be aware of which rules apply** to your current task
2. **Reference specific rules** when needed in your queries
3. **Update rules** when patterns change or new conventions emerge
4. **Create new rules** for recurring patterns that need consistent guidance

## Relationship with Documentation

These rules work in tandem with our documentation architecture:

- Rules provide immediate guidance for specific contexts
- Documentation provides deeper understanding and background
- Together they create a comprehensive development system

See `DOCS/AI_COLLABORATION_ARCHITECTURE.md` for a complete explanation of how our AI collaboration system works.

## Maintaining Rules

When updating rules:

1. Keep rules focused on a single concern
2. Use clear, concise language
3. Include explicit instructions for common edge cases
4. Test rule effectiveness in actual development tasks
5. Document rule changes in commit messages 