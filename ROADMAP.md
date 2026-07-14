# CanvaCodeCraft Roadmap

This roadmap turns CanvaCodeCraft from a capable prototype into a dependable creator platform. GitHub is the source of truth: roadmap items should connect to issues, pull requests, screenshots, and weekly build reports.

## Product North Star

A creator should be able to move from **story idea → visual scene → playable Ink experience → shareable web build** without wrestling with the toolchain.

## Guiding Principles

1. **Game creation first.** Every feature should shorten the path to a playable story.
2. **Visual without hiding the code.** The canvas and Ink editor should strengthen each other.
3. **Portable by default.** Creators should be able to export and own their work.
4. **Friendly to beginners, useful to developers.** Good defaults first, deeper control nearby.
5. **Build in public safely.** Share progress and reusable knowledge without publishing secrets or private infrastructure.

---

## Phase 0: Product Headquarters

**Goal:** Make the repository understandable, trustworthy, and ready for public development.

- [x] Add public-facing README
- [x] Add phased roadmap
- [x] Add contribution guide
- [ ] Add hero screenshot and product gallery
- [ ] Add short demo GIF
- [ ] Clean up package identity and repository metadata
- [ ] Confirm license and security guidance
- [ ] Begin weekly build reports

**Exit signal:** A new visitor can understand the product, run it locally, and identify the next useful contribution.

## Phase 1: Stable Creator Core

**Goal:** Protect the current editor, preview, persistence, and export workflows.

- [ ] Add Vitest and React Testing Library
- [ ] Test Ink parsing and generation utilities
- [ ] Test shared schemas and API validation
- [ ] Add preview-runtime smoke tests
- [ ] Add GitHub Actions for type-check, test, and build
- [ ] Improve autosave and unsaved-change protection
- [ ] Add clearer error states for Ink compilation
- [ ] Add reliable project loading and recovery

**Exit signal:** Core workflows can change without silent regressions.

## Phase 2: Better Visual Story Building

**Goal:** Make scene creation faster and more expressive.

- [ ] Add alignment guides and snapping
- [ ] Add layer ordering and lock controls
- [ ] Add undo and redo history
- [ ] Add keyboard shortcuts
- [ ] Add reusable element presets
- [ ] Add more element types, beginning with containers and choices
- [ ] Add responsive canvas presets
- [ ] Improve scene duplication and reordering

**Exit signal:** A creator can construct and revise a multi-scene story comfortably without fighting the canvas.

## Phase 3: Ink Intelligence

**Goal:** Turn the Ink editor into a narrative development companion.

- [ ] Improve syntax diagnostics and inline errors
- [ ] Add knot, stitch, variable, and function navigation
- [ ] Add visual links between canvas controls and Ink targets
- [ ] Add broken-binding detection
- [ ] Add story-state inspection during preview
- [ ] Add branching-path visualization
- [ ] Add starter Ink patterns and snippets

**Exit signal:** Creators can understand why a story behaves the way it does and fix broken narrative logic quickly.

## Phase 4: Publish and Share

**Goal:** Make completed projects easy to distribute.

- [ ] Harden standalone HTML export
- [ ] Add export themes and metadata
- [ ] Add downloadable project bundles
- [ ] Add one-click playable preview links
- [ ] Add Cloudflare deployment path
- [ ] Add embed code for websites and learning platforms
- [ ] Add versioned releases and changelogs

**Exit signal:** A creator can publish a playable story without assembling a separate deployment project.

## Phase 5: Templates and Community

**Goal:** Help creators start faster and learn from one another.

- [ ] Add first-party starter templates
- [ ] Add educational scenario templates
- [ ] Add visual-novel and dialogue templates
- [ ] Add import and remix workflow
- [ ] Add searchable component library
- [ ] Add community showcase process
- [ ] Add contributor recognition

**Exit signal:** New users can begin from a proven structure instead of a blank project.

## Phase 6: Responsible AI Assistance

**Goal:** Add optional assistance without replacing creator ownership.

- [ ] Generate scene outlines from creator prompts
- [ ] Suggest Ink branches and variable structures
- [ ] Explain Ink errors in plain language
- [ ] Generate placeholder dialogue and choice variants
- [ ] Support local-model integration through Ollama
- [ ] Add provider-neutral AI configuration
- [ ] Keep generated changes reviewable before insertion

**Exit signal:** AI speeds up drafting and debugging while the creator remains in control of every accepted change.

---

## Current Priority Stack

1. Product screenshots and demo GIF
2. Package identity cleanup
3. Automated tests and CI
4. Ink error handling
5. Autosave and recovery
6. Publishing workflow

## Not Yet

These ideas are intentionally parked until the creator core is stable:

- Large social-network features
- Marketplace payments
- Real-time multiplayer editing
- Native mobile applications
- Complex plugin marketplace

## Progress Rhythm

At least once per active development week:

- Update one roadmap checkbox or linked issue
- Post one screenshot, clip, or technical note
- Record wins, struggles, learnings, blockers, and next steps
- Keep the README aligned with the actual product
