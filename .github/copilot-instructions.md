# GitHub Copilot Workspace Instructions

## Pre-task Checklist
- Review the issue or PR description completely.
- Check existing test coverage for the modified area.
- Verify that standard linting and formatting rules apply.

## Code Standards
- Ensure all TypeScript is strictly typed.
- Python code must include type hints and docstrings.
- Follow the overarching repository style. No exceptions.

## PR Requirements
- **Title format**: `type(scope): description` (e.g., `feat(api): implement user auth`)
- **Description**: Must clearly state what changed, why it changed, and how it was tested.
- **Checklist**:
  - [ ] Code compiles/builds successfully.
  - [ ] Tests have been added or updated.
  - [ ] Linter passes with zero warnings.

## Commit Types Allowed
`feat` | `fix` | `refactor` | `docs` | `test` | `chore`

## Forbidden Actions
- **NO self-merging** PRs.
- **NO pushing directly to `main`**. All work MUST be in branches.
- **NO skipping tests** in the CI pipeline or local environment.
