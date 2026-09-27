# Lulu Code Project Instructions Specification

## `LULU.md` Specification

When present in the root directory of a project, `LULU.md` provides guiding rules and context for the Lulu Code agent.

### Example `LULU.md`

```markdown
# Project Guidelines for Lulu Code

## Coding Conventions
- Use Rust edition 2021.
- All public functions must have doc comments.
- Prefer explicit error handling over unwrap().

## Build & Test Commands
- Build: `cargo build`
- Unit tests: `cargo test --lib`
- Integration tests: `cargo test --test integration`

## Forbidden Files
- Do not modify `schema.sql` directly; create migrations under `migrations/`.
- Do not edit `.env.production`.
```

## `.lulu/` Directory Memory

Projects can also contain a `.lulu/` directory for structured agent memory:
- `.lulu/config.json`: Project-specific settings and overrides.
- `.lulu/instructions.md`: Extended architecture guides and developer notes.
- `.lulu/memory.md`: Persistent task notes and lessons learned by the agent.
