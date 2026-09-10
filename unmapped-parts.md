# Unmapped / fallback-assigned parts

These parts did not match an explicit rule in `scripts/remap-systems.mjs` and
were placed by a fallback. They are fully visible and clickable in the app, but
are worth reviewing and renaming or reassigning.

Generated: 2026-09-10
Total parts affected: 12 (10 distinct names)

| Part name | Old system | Assigned to | Instances |
|---|---|---|---|
| Left conus elasticus | `connective` | `muscular` | 1 |
| Left pterygomandibular raphe | `connective` | `muscular` | 1 |
| Left tensor fasciae latae | `connective` | `muscular` | 1 |
| Linea alba | `connective` | `muscular` | 1 |
| Pharyngeal raphe | `connective` | `muscular` | 1 |
| Right conus elasticus | `connective` | `muscular` | 1 |
| Right pterygomandibular raphe | `connective` | `muscular` | 1 |
| Right tensor fasciae latae | `connective` | `muscular` | 1 |
| tendinous arch of levator ani | `connective` | `muscular` | 1 |
| Tendinous arch of levator ani | `connective` | `muscular` | 3 |

## Why these fell through

All are muscle-associated connective tissue with no single obvious home under
the Cleveland Clinic taxonomy: fasciae, raphes, tendinous arches, the linea
alba, and the conus elasticus. They attach to or invest muscle, so they default
to `muscular`. Moving any of them to `skeletal` is defensible.
