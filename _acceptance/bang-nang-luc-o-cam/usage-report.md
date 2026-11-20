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

### S4 round 2 — wf_3ae6b10e-b66 (16 agent, 40,236 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 11 | 5,468 | 22 | 423,689 | 90 |
| review:conventions | claude-opus-5-5 | 15 | 5,230 | 30 | 684,789 | 102 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,700 | 4 | 34,165 | 31 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,859 | 6 | 65,300 | 157 |
| review:measurement | claude-opus-5-5 | 9 | 3,781 | 18 | 328,077 | 72 |
| judge:E11:domain-correctness | claude-sonnet-5-5 | 2 | 2,998 | 4 | 25,993 | 23 |
| judge:E11:operational-feasibility | claude-sonnet-5-5 | 2 | 2,530 | 4 | 25,995 | 20 |
| judge:E11:spec-alignment | claude-sonnet-5-5 | 2 | 2,174 | 4 | 25,993 | 18 |
| judge:E10:domain-correctness | claude-sonnet-5-5 | 2 | 1,930 | 4 | 22,379 | 16 |
| judge:E10:operational-feasibility | claude-sonnet-5-5 | 2 | 1,730 | 4 | 25,997 | 15 |
| judge:E10:spec-alignment | claude-sonnet-5-5 | 2 | 1,664 | 4 | 25,995 | 14 |
| machine:make check | claude-haiku-5-5 | 2 | 1,107 | 4 | 22,918 | 18 |
| triage | claude-sonnet-5-5 | 2 | 949 | 4 | 24,680 | 9 |
| machine:node --test plugins/design-assembly/test | claude-haiku-5-5 | 2 | 947 | 4 | 26,370 | 6 |
| machine:bash _acceptance/bang-nang-luc-o-cam/ran | claude-haiku-5-5 | 2 | 836 | 4 | 26,387 | 17 |
| capture:provenance | claude-sonnet-5-5 | 2 | 333 | 4 | 21,724 | 5 |


wall: 193s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 14,479 | 1,436,555 | 102 | 07:46:51 | 07:48:34 |
| baseline | 1 | 3,859 | 65,300 | 157 | 07:46:51 | 07:49:29 |
| judge | 6 | 13,026 | 152,352 | 24 | 07:46:51 | 07:47:15 |
| machine | 3 | 2,890 | 75,675 | 18 | 07:46:51 | 07:47:09 |
| triage | 1 | 949 | 24,680 | 9 | 07:48:34 | 07:48:43 |
| capture | 1 | 333 | 21,724 | 5 | 07:49:29 | 07:49:33 |
| synthesize | 1 | 4,700 | 34,165 | 31 | 07:49:33 | 07:50:04 |

- **claude-opus-5-5**: 3 agent · 35 calls · out 14,479 · in 70 · cache_read 1,436,555 · cache_create 155,289
- **claude-sonnet-5-5**: 10 agent · 21 calls · out 22,867 · in 42 · cache_read 298,221 · cache_create 435,417
- **claude-haiku-5-5**: 3 agent · 6 calls · out 2,890 · in 12 · cache_read 75,675 · cache_create 86,755

### S4 round 3 — wf_2ff5864b-604 (15 agent, 29,303 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 5,267 | 4 | 32,206 | 35 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,918 | 6 | 68,892 | 168 |
| judge:E11:spec-alignment | claude-sonnet-5-5 | 2 | 2,516 | 4 | 25,998 | 20 |
| judge:E11:operational-feasibility | claude-sonnet-5-5 | 2 | 2,472 | 4 | 26,000 | 20 |
| judge:E11:domain-correctness | claude-sonnet-5-5 | 2 | 2,230 | 4 | 25,998 | 18 |
| judge:E10:domain-correctness | claude-sonnet-5-5 | 3 | 2,137 | 8 | 72,540 | 18 |
| review:bugs | claude-opus-5-5 | 7 | 1,794 | 14 | 198,554 | 36 |
| judge:E10:spec-alignment | claude-sonnet-5-5 | 2 | 1,660 | 4 | 26,000 | 15 |
| judge:E10:operational-feasibility | claude-sonnet-5-5 | 2 | 1,618 | 4 | 26,002 | 14 |
| machine:make check | claude-haiku-5-5 | 2 | 1,497 | 4 | 22,923 | 130 |
| review:measurement | claude-opus-5-5 | 4 | 1,058 | 8 | 93,390 | 20 |
| review:conventions | claude-opus-5-5 | 4 | 1,023 | 8 | 86,708 | 35 |
| machine:node --test plugins/design-assembly/test | claude-haiku-5-5 | 2 | 975 | 4 | 26,375 | 6 |
| machine:bash _acceptance/bang-nang-luc-o-cam/ran | claude-haiku-5-5 | 2 | 804 | 4 | 26,392 | 17 |
| capture:provenance | claude-sonnet-5-5 | 2 | 334 | 4 | 21,729 | 5 |


wall: 207s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,918 | 68,892 | 168 | 07:54:33 | 07:57:21 |
| judge | 6 | 12,633 | 202,538 | 21 | 07:54:33 | 07:54:55 |
| review | 3 | 3,875 | 378,652 | 38 | 07:54:33 | 07:55:11 |
| machine | 3 | 3,276 | 75,690 | 130 | 07:54:33 | 07:56:43 |
| capture | 1 | 334 | 21,729 | 5 | 07:57:21 | 07:57:26 |
| synthesize | 1 | 5,267 | 32,206 | 35 | 07:57:26 | 07:58:00 |

- **claude-sonnet-5-5**: 9 agent · 20 calls · out 22,152 · in 42 · cache_read 325,365 · cache_create 396,891
- **claude-opus-5-5**: 3 agent · 15 calls · out 3,875 · in 30 · cache_read 378,652 · cache_create 98,088
- **claude-haiku-5-5**: 3 agent · 6 calls · out 3,276 · in 12 · cache_read 75,690 · cache_create 86,923

### S4 round 4 — wf_7bc5ef22-cd2 (14 agent, 39,081 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 13 | 8,531 | 26 | 714,654 | 116 |
| review:bugs | claude-opus-5-5 | 12 | 5,890 | 24 | 616,467 | 92 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,867 | 4 | 34,613 | 35 |
| judge:E11:spec-alignment | claude-sonnet-5-5 | 3 | 2,794 | 6 | 76,502 | 22 |
| judge:E11:domain-correctness | claude-sonnet-5-5 | 2 | 2,534 | 4 | 26,173 | 20 |
| judge:E10:spec-alignment | claude-sonnet-5-5 | 2 | 2,097 | 4 | 26,175 | 18 |
| judge:E11:operational-feasibility | claude-sonnet-5-5 | 2 | 1,991 | 4 | 26,175 | 16 |
| review:measurement | claude-opus-5-5 | 6 | 1,809 | 12 | 170,978 | 37 |
| judge:E10:domain-correctness | claude-sonnet-5-5 | 2 | 1,799 | 4 | 22,559 | 15 |
| judge:E10:operational-feasibility | claude-sonnet-5-5 | 2 | 1,714 | 4 | 26,177 | 15 |
| machine:node --test plugins/design-assembly/test | claude-haiku-5-5 | 2 | 1,445 | 4 | 26,547 | 12 |
| triage | claude-sonnet-5-5 | 2 | 1,381 | 4 | 25,544 | 12 |
| machine:node --test plugins/design-assembly/test | claude-haiku-5-5 | 2 | 826 | 4 | 23,134 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 403 | 4 | 21,904 | 7 |


wall: 171s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 2 | 2,271 | 49,681 | 18 | 08:48:06 | 08:48:23 |
| review | 3 | 16,230 | 1,502,099 | 116 | 08:48:06 | 08:50:02 |
| judge | 6 | 12,929 | 203,761 | 24 | 08:48:06 | 08:48:29 |
| triage | 1 | 1,381 | 25,544 | 12 | 08:50:02 | 08:50:14 |
| capture | 1 | 403 | 21,904 | 7 | 08:50:14 | 08:50:21 |
| synthesize | 1 | 5,867 | 34,613 | 35 | 08:50:21 | 08:50:56 |

- **claude-opus-5-5**: 3 agent · 31 calls · out 16,230 · in 62 · cache_read 1,502,099 · cache_create 199,431
- **claude-sonnet-5-5**: 9 agent · 19 calls · out 20,580 · in 38 · cache_read 285,822 · cache_create 402,093
- **claude-haiku-5-5**: 2 agent · 4 calls · out 2,271 · in 8 · cache_read 49,681 · cache_create 59,883

