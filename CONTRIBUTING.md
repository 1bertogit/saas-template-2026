# Contributing to SaaS Template 2026

Thank you for your interest in contributing to SaaS Template 2026! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/saas-template-2026.git
   cd saas-template-2026
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```

5. Set up the database:
   ```bash
   pnpm db:push
   ```

6. Start the development server:
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names following this pattern:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions or modifications

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add social login with Google
fix(payments): resolve webhook signature verification
docs(readme): update installation instructions
```

## Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes** following our coding standards

3. **Write/update tests** for your changes

4. **Run the test suite**:
   ```bash
   pnpm test
   ```

5. **Ensure linting passes**:
   ```bash
   pnpm lint
   ```

6. **Update documentation** if needed

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature
   ```

8. **Open a Pull Request** with:
   - Clear title and description
   - Reference to any related issues
   - Screenshots for UI changes

### PR Review Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally and in CI
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Responsive design (if applicable)
- [ ] Accessibility considerations

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Export types alongside implementations

### React/Next.js

- Use functional components with hooks
- Prefer Server Components when possible
- Use `'use client'` only when necessary
- Follow the App Router conventions

### File Structure

```
src/
├── app/              # Next.js App Router
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── [feature]/   # Feature-specific components
├── lib/             # Utility functions
├── hooks/           # Custom React hooks
└── types/           # TypeScript types
```

### Naming Conventions

- **Files**: `kebab-case.ts` or `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use CSS variables for theming
- Keep component styles colocated

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test:unit

# Run with coverage
pnpm test:unit --coverage

# Watch mode
pnpm test:unit --watch
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e --ui
```

### Writing Tests

- Place unit tests next to source files: `component.test.tsx`
- Place integration tests in `tests/integration/`
- Place E2E tests in `tests/e2e/`
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

## Documentation

- Update README.md for significant changes
- Add JSDoc comments for public APIs
- Include examples for new features
- Keep CHANGELOG.md updated

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase

Thank you for contributing! 🎉
