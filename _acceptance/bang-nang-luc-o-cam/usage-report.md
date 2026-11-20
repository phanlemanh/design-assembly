### S4 round 1 — wf_62435cde-450 (18 agent, 70,523 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 26 | 15,266 | 52 | 1,665,147 | 256 |
| review:conventions | claude-opus-5-5 | 22 | 10,909 | 44 | 1,332,931 | 188 |
| synthesize:report | claude-sonnet-5-5 | 2 | 8,290 | 4 | 37,921 | 53 |
| review:measurement | claude-opus-5-5 | 7 | 7,217 | 14 | 255,420 | 94 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,462 | 6 | 66,924 | 127 |
| triage | claude-sonnet-5-5 | 2 | 3,303 | 4 | 26,791 | 25 |
| judge:E10:spec-alignment | claude-sonnet-5-5 | 3 | 3,163 | 6 | 75,980 | 26 |
| judge:E11:spec-alignment | claude-sonnet-5-5 | 3 | 2,778 | 6 | 75,976 | 24 |
| judge:E11:domain-correctness | claude-sonnet-5-5 | 3 | 2,556 | 8 | 75,976 | 21 |
| judge:E11:operational-feasibility | claude-sonnet-5-5 | 3 | 2,547 | 8 | 75,980 | 22 |
| judge:E10:operational-feasibility | claude-sonnet-5-5 | 2 | 2,139 | 4 | 25,989 | 19 |
| judge:E10:domain-correctness | claude-sonnet-5-5 | 2 | 1,961 | 4 | 22,371 | 19 |
| machine:node --test plugins/design-assembly/test | claude-haiku-5-5 | 2 | 1,491 | 4 | 26,359 | 18 |
| machine:make plugin-test | claude-haiku-5-5 | 2 | 1,413 | 4 | 26,334 | 83 |
| machine:node --test plugins/design-assembly/test | claude-haiku-5-5 | 2 | 961 | 4 | 26,362 | 7 |
| machine:bash _acceptance/bang-nang-luc-o-cam/ran | claude-haiku-5-5 | 2 | 861 | 4 | 26,379 | 33 |
| machine:make check | claude-haiku-5-5 | 2 | 808 | 4 | 22,910 | 30 |
| capture:provenance | claude-sonnet-5-5 | 2 | 398 | 4 | 21,716 | 7 |


wall: 359s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,462 | 66,924 | 127 | 07:36:27 | 07:38:34 |
| judge | 6 | 15,144 | 352,272 | 27 | 07:36:27 | 07:36:53 |
| machine | 5 | 5,534 | 128,344 | 84 | 07:36:27 | 07:37:51 |
| review | 3 | 33,392 | 3,253,498 | 267 | 07:36:35 | 07:41:01 |
| triage | 1 | 3,303 | 26,791 | 25 | 07:41:02 | 07:41:26 |
| capture | 1 | 398 | 21,716 | 7 | 07:41:26 | 07:41:33 |
| synthesize | 1 | 8,290 | 37,921 | 53 | 07:41:33 | 07:42:26 |

- **claude-opus-5-5**: 3 agent · 55 calls · out 33,392 · in 110 · cache_read 3,253,498 · cache_create 229,825
- **claude-sonnet-5-5**: 10 agent · 25 calls · out 31,597 · in 54 · cache_read 505,624 · cache_create 449,788
- **claude-haiku-5-5**: 5 agent · 10 calls · out 5,534 · in 20 · cache_read 128,344 · cache_create 142,633

