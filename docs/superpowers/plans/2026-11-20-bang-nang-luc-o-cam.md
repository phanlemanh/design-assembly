# Bảng năng lực, ổ cắm và phích — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mục 5.0: một bảng năng lực máy đọc được, năm phép kiểm giữ nó, và bảng ổ cắm trong `status`, không đổi hành
vi lệnh nào đang có.

**Architecture:** Dữ liệu ở `references/capabilities.json` cộng mỗi phích ngoài một tệp ở `references/plugs/`. Một
mô-đun thuần `scripts/capabilities.mjs` đọc chúng và trả danh sách vấn đề cho từng phép kiểm. `status` gọi cùng mô-đun
để dựng khoá `sockets`.

**Tech Stack:** Node ≥ 22, ESM, `node:test`, không gói mới.

**Spec:** `docs/superpowers/specs/2026-11-20-bang-nang-luc-o-cam-design.md`; hợp đồng
`_acceptance/bang-nang-luc-o-cam/contract.md`; phép đo `_acceptance/bang-nang-luc-o-cam/evals.yaml`.

## Global Constraints

- Mã, chú thích, tên tệp, thông điệp bài kiểm trong `plugins/`: tiếng Anh; không nêu tên repo hay sản phẩm nào của
  chủ repo.
- Script của plugin không gọi mô hình, không dùng mạng.
- Tên công cụ bên thứ ba chỉ ở `references/plugs/` và `templates/tools/design-assembly/adapters/`.
- `status` cho người: tối đa 40 dòng trên hai mẫu của bài kiểm «one screen».
- Không đổi mã thoát của lệnh nào: ổ trống không làm `status` thoát 1.
- Plugin lên 0.19.0 theo luật phiên bản: `make format`, `make design-apply`, `make plugin-version VERSION=0.19.0`,
  `make design-apply`, `make check`.
- `make check` xanh trước khi nói xong.

## Review Focus

1. Một tệp `references/plugs/*.json` hỏng (không phải JSON, thiếu `socket`): phép kiểm phải nêu tên tệp, không ném
   lỗi trần. Bài kiểm ở Task 2.
2. `detect` của một phích trỏ tệp không có trong repo đích, hay repo đích không đọc được: `status` vẫn chạy, phích
   không «here». Bài kiểm ở Task 3.
3. Tên ngắn như `axe` khớp nhầm một từ chứa nó: so nguyên từ như `libraryNamesIn`. Bài kiểm ở Task 2.
4. Thứ tự năng lực trong `sockets` ổn định qua hai lần chạy (bài kiểm «same answer twice» sẵn có). Task 3.
5. Một dòng `limit` trỏ tới dòng `closed`: là lủng, không phải lấp. Bài kiểm ở Task 1.

---

### Task 1: Bảng năng lực, phích ngoài, dòng giới hạn, và ba phép kiểm hình dạng

Phục vụ E1, E2, E5, E9, E10, E11. `independent: false` (Task 2 và 3 dựng trên nó).

**Files:**

- Create: `plugins/design-assembly/references/capabilities.json`
- Create: `plugins/design-assembly/references/plugs/<id>.json` cho mỗi phích ngoài đề bài 0008 nêu ở cột «Phích khác»,
  trừ tên của sản phẩm chủ repo và trừ shadcn (đã là bộ chuyển)
- Modify: `plugins/design-assembly/references/limits.json` (một dòng `no-check` cho mỗi ổ trống chưa có dòng mở nói
  đúng điều ấy; area mới `capabilities`; một dòng cho giới hạn của phép dò tĩnh ở Task 2)
- Create: `plugins/design-assembly/scripts/capabilities.mjs`
- Create: `plugins/design-assembly/tests/test-capabilities.mjs`

**Interfaces:**

- Produces: `readCapabilities(plugin = PLUGIN) → { capabilities, plugs, problems }`;
  `shapeProblems(table, { scripts, ledgers, targets, commands }) → string[]`;
  `gapProblems(table, limits) → string[]`; `reachProblems(table, layers, tiers) → string[]`;
  `faceProblems(table) → string[]`. Mỗi chuỗi mở bằng id năng lực hay tên tệp.
- Khoá của một năng lực: `id`, `stage`, `name`, `socket { writes[], outputs[], checks[], decides, human, machine }`,
  `plugs[] { id, kind, default, scripts[] }`, `layers[]`, `tiers[]`, `limit?`. Khoá cấp tệp: `routes[] { script,
through[] }`. `human`/`machine`: `{ shows?, asks? }` / `{ rules?, held_by? }`, hoặc `{ reason }`.
- `checks` nhận `make <đích>` có trong `templates/mk/design-assembly.mk`, hoặc `/design-assembly:<skill>` có thư mục
  ở `skills/`.

- [ ] Viết bài kiểm: bảng thật có đúng 20 mục và `shapeProblems` rỗng; bốn bản sao hỏng (ổ thiếu `checks`, phích trỏ
      script không có, `writes` có khoá ngoài `LEDGERS`, `checks` nêu đích make không có), mỗi bản đỏ với thông điệp
      ghim tên năng lực và vật sai.
- [ ] Viết bài kiểm «no gap»: bảng thật rỗng; bản sao bỏ phích mặc định của một năng lực và bỏ `limit` thì đỏ nêu id;
      bản sao trỏ `limit` tới một dòng `closed` thì đỏ.
- [ ] Viết bài kiểm «every layer and tier is reached»: bảng thật rỗng; bỏ một tầng khỏi mọi năng lực thì đỏ nêu tầng;
      bỏ một bậc thì đỏ nêu bậc.
- [ ] Viết bài kiểm «two faces»: bảng thật rỗng; bỏ `machine` của một ổ, không `reason`, thì đỏ nêu ổ và mặt.
- [ ] Chạy: `node --test plugins/design-assembly/tests/test-capabilities.mjs` → đỏ vì mô-đun chưa có.
- [ ] Viết `capabilities.mjs` và dữ liệu; hai mươi mục theo bảng của đề bài 0008, tám ổ trống có `limit`.
- [ ] Chạy lại → xanh. Chạy `make plugin-test` → xanh (bài kiểm `test-limits.mjs` nhận dòng mới).
- [ ] Commit `feat: the capability table and its shape checks` (dòng cuối `Plan: 5.0`).

### Task 2: Không trùng và lõi sạch

Phục vụ E3, E4. `independent: false` (cùng tệp với Task 1).

**Files:**

- Modify: `plugins/design-assembly/scripts/capabilities.mjs`, `plugins/design-assembly/tests/test-capabilities.mjs`
- Modify: `plugins/design-assembly/templates/tools/design-assembly/components.mjs:33` và
  `plugins/design-assembly/templates/tools/design-assembly/adapters/shadcn.mjs`: các thư mục linh kiện của nhà
  cung cấp chuyển vào bộ chuyển (`vendorFolders`), `VENDOR` dựng từ đó; biểu thức sinh ra giống hệt, để lõi không nêu
  tên của phích ngoài.

**Interfaces:**

- Produces: `overlapProblems(table) → string[]`; `writesOf(scriptText, ledgers) → string[]` (khoá sổ mà một văn bản
  script ghi: có lời gọi `writeFiles(`, `writeFileSync(` hay `appendFileSync(` và nêu `file`/`folder` của sổ hay
  `LEDGERS.<khoá>`); `scriptProblems(table, scripts) → string[]` với `scripts` là `{ path, text }[]`;
  `coreProblems(plugs, files) → string[]` với `files` là `{ path, text }[]`; `coreFiles(plugin) → string[]`.
- `outsideNamesIn(text, plugs) → string[]`, so nguyên từ như `libraryNamesIn`.

- [ ] Bài kiểm «no overlap»: bảng thật rỗng; `writesOf` trên script thật trả danh sách không rỗng có cặp adopt và
      `decisions`; mỗi sổ trong `writes` được một script thật ghi hoặc có dòng giới hạn mở; bản sao cho hai ổ cùng
      `decisions` đỏ nêu sổ và hai ổ; bản sao của một script thật đọc từ đĩa, đổi để ghi sổ khác, đỏ nêu script và sổ.
- [ ] Bài kiểm «clean core»: plugin thật rỗng; tên của một phích ngoài chèn vào bản sao `capabilities.json`, một tệp
      `skills/`, và một tệp của mỗi thư mục lõi đều đỏ nêu tệp và tên; một từ chứa tên mà không phải tên thì không khớp;
      một tệp phích hỏng đỏ nêu tên tệp.
- [ ] Chạy → đỏ. Viết các hàm, chuyển `VENDOR`. Chạy lại → xanh; `node --test plugins/design-assembly/tests/test-adapters.mjs`
      và `test-components.mjs` xanh.
- [ ] Commit `feat: the overlap and clean-core checks of the capability table` (`Plan: 5.0`).

### Task 3: Bảng ổ cắm trong `status`

Phục vụ E6. `independent: false` (đọc mô-đun của Task 1).

**Files:**

- Modify: `plugins/design-assembly/scripts/status.mjs` (`resultOf` thêm `sockets` cuối; `report` thêm dòng sau dòng
  `tool:`; `documentOf` thêm một phần); `plugins/design-assembly/skills/status/SKILL.md` nếu nó liệt khoá
- Modify: `plugins/design-assembly/tests/test-status.mjs`

**Interfaces:**

- Consumes: `readCapabilities()`.
- Produces: `socketsOf(root, table) → { id, name, plug, state: "plugged"|"empty", limit, outside: { id, here }[] }[]`
  trong `capabilities.mjs`. `detect` là `{ file }` hay `{ package }` (tên trong `dependencies`/`devDependencies` của
  `package.json` repo đích); không đọc được thì `here: false`.
- Dòng cho người: `sockets: <n> of 20 with a default plug; empty: <id>, <id> (references/limits.json of this plugin)`;
  thêm `  plugged in here: <id> (<socket>), …` chỉ khi có.

- [ ] Sửa bài kiểm khoá: danh sách khoá thêm `sockets` cuối; mỗi mục có đúng sáu khoá.
- [ ] Bài kiểm mới: bản cho người có dòng `sockets:` nêu đúng số và các ổ trống; hai mẫu «one screen» vẫn ≤ 40 dòng;
      bảng mà mọi ổ có phích thì không có vế `empty:`; repo mẫu có tệp `detect` của một phích thì phích ấy `here: true`,
      repo không có thì không; hai lần chạy cho cùng kết quả; mã thoát không đổi.
- [ ] Chạy → đỏ. Viết. Chạy `node --test plugins/design-assembly/tests/test-status.mjs` → xanh.
- [ ] Commit `feat: status shows the socket board` (`Plan: 5.0`).

### Task 4: Phép đo «đầu ra không đổi» của hồ sơ

Phục vụ E8. `independent: true`.

**Files:**

- Create: `_acceptance/bang-nang-luc-o-cam/rang/same-outputs.sh`

**Interfaces:**

- `bash same-outputs.sh [--base <ref>] [--self-test]`. Mặc định `--base` là `git merge-base HEAD main`. Dựng cây gốc
  bằng `git worktree add` vào thư mục tạm, nối `node_modules`, chạy trên repo này ở hai cây: `audit --json`,
  `inventory`, `find <một nhu cầu cố định>`, `decide --dry-run`, `upgrade --dry-run`, `status --json`. Bỏ khoá
  `sockets`, các dòng mở bằng `sockets:` và `  plugged in here:`, rồi so. Riêng con số giới hạn mở của `audit` phải
  bằng số ở gốc cộng số dòng `"status": "open"` mới của `limits.json` trong diff. In commit gốc. Thoát 0 khi khớp, 1
  kèm tên lệnh và dòng khác đầu tiên. `--self-test` chèn một dòng lạ vào đầu ra HEAD của một lệnh và phải thoát 1.
- Gỡ worktree tạm khi xong, kể cả khi lỗi (`trap`).

- [ ] Viết script. Chạy `--self-test` → thoát 1 nêu lệnh. Chạy thường → thoát 0, in commit gốc.
- [ ] Commit `test: the same-outputs measure of the record` (`Plan: 5.0`).

### Task 5: Phiên bản, wiki, kế hoạch

Phục vụ E7. `independent: false` (cuối cùng).

**Files:**

- Modify: `plugins/design-assembly/.claude-plugin/plugin.json`, `references/releases.json` (qua `make plugin-version`),
  `tools/design-assembly/**` (qua `make design-apply`)
- Create: `wiki/decisions/0069-the-capability-table-and-its-checks.md`
- Modify: `wiki/log.md`, `wiki/index.md`, `wiki/specs/0008-capabilities-sockets-and-plugs.md` (dòng trạng thái),
  `docs/plan/plan.json` (mục 5.0 sang `done` kèm bằng chứng)

- [ ] Chạy chuỗi lệnh phiên bản ở Global Constraints. `make check` → xanh, `plugin tests:` không ít hơn 770 bài qua.
- [ ] Commit `chore: release plugin 0.19.0 with the capability table` (`Plan: 5.0`).
