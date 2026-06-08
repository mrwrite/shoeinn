# OpenSpec Workflow

OpenSpec change artifacts live under `openspec/changes`.

Common files in a change:

- `proposal.md`
- `design.md`
- `tasks.md`
- `specs/<capability>/spec.md`
- Optional QA notes or implementation notes

Validate a change:

```powershell
cmd /c openspec validate polish-mobile-modern-ui-experience --strict
```

Check change status:

```powershell
cmd /c openspec status --change "polish-mobile-modern-ui-experience" --json
```

The current mobile polish work is tracked under:

```text
openspec/changes/polish-mobile-modern-ui-experience
```

Use OpenSpec artifacts as implementation context, not as runtime configuration. Application startup, environment, deployment, and troubleshooting guidance now lives in:

- [getting-started.md](getting-started.md)
- [environment.md](environment.md)
- [architecture/overview.md](architecture/overview.md)
- [staging.md](staging.md)
- [troubleshooting.md](troubleshooting.md)

