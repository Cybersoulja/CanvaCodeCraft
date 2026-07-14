# Contributing to CanvaCodeCraft

Thanks for helping build a friendlier visual studio for interactive fiction. Contributions can include code, documentation, accessibility improvements, templates, examples, testing, screenshots, and developer diary entries.

## Start Here

1. Read the [README](README.md) and [ROADMAP](ROADMAP.md).
2. Search existing issues before opening a new one.
3. Choose a focused change that can be reviewed independently.
4. Avoid including credentials, private URLs, production data, or proprietary business details.

## Local Setup

```bash
git clone https://github.com/Cybersoulja/CanvaCodeCraft.git
cd CanvaCodeCraft
npm install
```

Create `.env`:

```env
DATABASE_URL=your_postgresql_connection_string
```

Run the development environment:

```bash
npm run dev
```

## Branch Naming

Use a short category and descriptive name:

```text
feature/undo-redo
fix/ink-preview-crash
docs/export-guide
test/ink-utils
chore/package-metadata
```

## Development Standards

- Use TypeScript strict mode.
- Add explicit types where they improve clarity.
- Validate API input with Zod.
- Use existing shadcn/ui components and Tailwind conventions.
- Keep canvas, preview, property editing, and export behavior aligned when adding a new element type.
- Preserve portability of user-created projects.

## Before Opening a Pull Request

Run:

```bash
npm run check
npm run build
```

When the test suite is added, also run:

```bash
npm test
```

Manually verify the affected workflow in the application.

## Pull Request Checklist

- [ ] The change has one clear purpose
- [ ] TypeScript checks pass
- [ ] The production build succeeds
- [ ] User-facing behavior was manually tested
- [ ] Documentation was updated when behavior changed
- [ ] Screenshots or a short clip are included for visible UI changes
- [ ] No secrets, private infrastructure details, or personal data are included

## Bug Reports

A strong bug report includes:

- What you expected
- What happened
- Steps to reproduce
- Browser and operating system
- Relevant console output
- A screenshot or screen recording when useful

Never paste database URLs, API keys, session cookies, or access tokens into an issue.

## Feature Requests

Explain:

1. The creator problem
2. The desired workflow
3. Why the current workflow is insufficient
4. The smallest useful version of the feature
5. Any effect on Ink scripts, canvas data, exports, or stored projects

## Adding a Game Element Type

Update every affected layer:

1. Shared types and schemas
2. Component library
3. Canvas rendering
4. Property controls
5. Preview rendering
6. Export generation
7. Tests and documentation

An element is not complete if it appears on the canvas but disappears or behaves differently in preview and export.

## Build-in-Public Notes

Development notes are welcome in `docs/build-reports/`. Use the template and record:

- Wins
- Struggles
- Learnings
- Ideas
- Blockers
- Next steps

Keep reports useful to other builders without exposing credentials, customer information, private infrastructure, or unreleased business strategy.

## Community Conduct

Be constructive, specific, and respectful. Review the work, not the person. Beginner questions are welcome, and explanations should help contributors understand the system rather than merely patch the symptom.
