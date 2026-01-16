# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- SEO improvements with sitemap.ts and robots.ts
- Schema.org JSON-LD structured data components
- OpenGraph and Twitter Card metadata helpers
- GitHub Actions CI/CD workflow
- PWA support with manifest.json
- Meta Pixel (Facebook) integration
- Google Tag Manager integration
- Google Search Console verification
- Contributing guidelines (CONTRIBUTING.md)

## [1.0.0] - 2026-01-16

### Added

#### Core Infrastructure
- Next.js 15 with App Router and React 19
- TypeScript 5 with strict mode
- Tailwind CSS 4 for styling
- Drizzle ORM with Neon PostgreSQL

#### Authentication
- Clerk authentication integration
- Social login support (Google, GitHub)
- Protected routes and middleware
- User profile management
- Webhook sync for user data

#### Payments
- Stripe integration for subscriptions
- Checkout session management
- Webhook handlers for payment events
- Subscription lifecycle management
- Customer portal integration

#### Storage
- Cloudflare R2 for file storage
- Presigned URL uploads
- File management utilities

#### Email
- Resend for transactional emails
- Email templates with React Email
- Welcome email on signup
- Subscription notification emails
- Payment failure notifications

#### AI Integration
- Vercel AI SDK for streaming
- OpenRouter multi-model support
- Anthropic Claude integration
- Rate-limited AI endpoints

#### Background Jobs
- Trigger.dev v3 for job processing
- Email jobs (welcome, notifications)
- Subscription jobs (renewals, cancellations)
- Data jobs (export, cleanup, analytics)
- Automatic retry with exponential backoff

#### Caching & Rate Limiting
- Upstash Redis integration
- API rate limiting by tier
- Response caching
- Webhook idempotency

#### Monitoring & Analytics
- Sentry error tracking (client, server, edge)
- PostHog product analytics
- Custom event tracking

#### Testing
- Vitest for unit tests
- Playwright for E2E tests
- Integration test suite
- Mock utilities for external services

#### Security
- Webhook signature verification
- CSRF protection
- Rate limiting
- Input validation
- SQL injection prevention

### Security
- Webhook idempotency to prevent replay attacks
- Timestamp validation on webhooks
- CSV injection prevention in exports
- Rate limiting on AI endpoints

## [0.1.0] - 2026-01-01

### Added
- Initial project setup
- Basic Next.js structure
- Clerk authentication
- Stripe skeleton
- Database schema

---

## Release Notes Format

### Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

### Versioning

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes
