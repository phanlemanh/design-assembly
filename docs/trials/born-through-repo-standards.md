# Một repo ra đời qua Repo Standards, cả hai plugin thật

Chạy ngày 2026-11-23, cho tiêu chí 11 của [đề bài 0013](../../wiki/specs/0013-the-two-neighbours-call-and-read.md),
dòng «xong khi» của giai đoạn 6, và bước 6 của kế hoạch đề bài. Lần đầu hai plugin chạy thật cùng nhau: trước đó mỗi
bên chỉ ghim hợp đồng bằng mẫu dữ liệu. Kết luận: **đạt**. Một repo bỏ đi ra đời qua `/repo-setup:new`. Không ai gõ lệnh
nào của design-assembly; chính `new` gọi `/design-assembly:adopt --starter` ở bước 6.4 của nó. Sau đó `status` của
plugin in «ledgers from birth: all 7 are here», và `make check` của repo xanh. Mục cuối ghi điều lượt này không chứng.

## Lời cho chạy

Đề bài nói lượt này tốn token, phải hỏi chủ repo trước, kèm ước tính. Ước tính gửi chủ repo: 0,5 đến 1 triệu token,
1 đến 1,5 giờ. Chủ repo trả lời qua phiên điều phối của Repo Standards: «Cho chạy, trần 40 USD, ghi hạn mức trước sau».
Sau đó chủ repo nói thẳng trong phiên này: «Cho chạy». Lời đáp cho hai câu hỏi đã nêu trước khi chạy:

- **Câu A, nạp plugin trước có tính là gõ lệnh không:** không tính. Hai plugin được nạp cho riêng phiên chạy bằng
  `--plugin-dir`, không cài vào cấu hình máy. Sau đó không ai gõ lệnh nào của design-assembly.
- **Câu B, bản nào:** repo-setup ở nhánh chính của Repo Standards, commit `83411c5`, bản `0.10.5.dev0`, gồm PR 84;
  design-assembly ở `48fc3f6`, bản 0.36.1, nhánh chính của kho này.

## Chạy trên gì

- **Repo bỏ đi:** một thư mục rỗng mới, `library-loans`, trong thư mục nháp của phiên. Không phải repo thật nào.
- **Hai plugin:** clone mới từ GitHub vào thư mục nháp, checkout đúng hai commit trên. Lệnh chạy là `claude -p` của
  Claude Code 2.1.293, mô hình `claude-opus-5-5`, chạy trong thư mục rỗng ấy, với
  `--plugin-dir <repo-setup> --plugin-dir <design-assembly>`, `--max-budget-usd 40`,
  `--permission-mode acceptEdits` và một danh sách công cụ được phép. Bản repo-setup 0.9.0 đang cài ở phạm vi user
  không lấn bản nạp bằng `--plugin-dir`: một phép thử trước cho thấy phiên chỉ thấy một `repo-setup:new`, nạp từ bản
  clone `83411c5`.
- **Lời nhắc duy nhất** của người, nguyên văn ở bản sao lưu bằng chứng (mục cuối). Nó mở bằng `/repo-setup:new` và tả
  một ứng dụng một trang cho thủ thư trường học: sách đang cho mượn, sách quá hạn. Người không rành kỹ thuật, giao hết
  cho Claude, cần sàn thiết kế cho giao diện web, không có màu thương hiệu. Duyệt trước bước rà soát cuối, không tạo kho
  GitHub, không đẩy, không chạy `make eval`. Lời nhắc **không nhắc tới design-assembly**.
- **Lần khởi động hỏng:** lần đầu, cờ `--allowedTools` nhận nhiều giá trị và nuốt luôn lời nhắc, nên `claude` thoát 1
  với «Input must be provided», trước khi gọi mô hình. Thư mục vẫn rỗng. Lần chạy thật đưa lời nhắc vào qua stdin.

## Kết quả

| Kiểm                                 | Lệnh hay chỗ đọc                                                       | Kết quả                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `new` tới bước gọi plugin (bước 6.4) | bản ghi stream-json của lượt lồng nhau                                 | Đạt: lần gọi công cụ thứ 35 trên 44, sau cài đặt và miền, trước `make check`   |
| `adopt --starter` chạy, mã thoát     | cùng bản ghi: `Skill design-assembly:adopt --starter`, rồi `adopt.mjs` | Chạy, thoát **1**: sổ đã đặt, 4 câu chờ người. 34 dòng sổ, 57 tệp              |
| Không ai gõ lệnh design-assembly     | lời nhắc, và mọi lượt «user» trong bản ghi                             | Đạt: chỉ có lời nhắc trên và kết quả công cụ; lời gọi do `new` phát            |
| `status` in bộ sổ lúc ra đời đủ      | `node scripts/status.mjs --target .` của plugin `48fc3f6`, chạy sau    | Đạt: «ledgers from birth: all 7 are here»; thoát 1 vì có câu chờ               |
| Dấu bản công cụ                      | `design/tool-stamp.json`                                               | `0.36.1`, cây `f53b645`; `status`: «version 0.36.1, as stamped»                |
| Hàng chờ                             | `status`                                                               | 4: `product-type`, `conformance-level`, `source-color`, font licence của Geist |
| Cổng xanh                            | `make check` của repo bỏ đi, chạy lại sau lượt                         | Thoát 0; mười bước, có `design-assembly`; 24 bài đơn vị, 28 bài trình duyệt    |
| Repo Standards thấy cùng điều        | `doctor.py --json --design-assembly-version 0.36.1`                    | `design_ledgers.missing: []`, `behind: false`; điểm 100                        |
| Lời mời đi tiếp                      | thư cuối của lượt lồng nhau                                            | Mời `/design-assembly:new`, đúng nhánh không màu thương hiệu của bước 8        |

Chi tiết từng dòng:

- **Thứ tự trong `new`.** Lượt lồng nhau đi hết mười lớp theo lối «giao hết cho Claude», gọi một tác tử phản biện
  độc lập, chạy `apply.py`, cài gói, viết miền (Book, Borrower, Loan và luật quá hạn) cùng màn danh sách mượn. Rồi nó
  gọi skill `adopt` của plugin với `--starter` và không cờ nào khác, nói «no questions answered on your behalf», và chạy
  script của bản plugin đã nạp: `node <design-assembly>/scripts/adopt.mjs --target . --starter`, thoát 1. Sau đó mới
  `make check`, `npm run build`, `doctor.py`, bản ghi quyết định, tour và một commit cục bộ.
- **Bộ sổ.** `design/` có `tokens.json`, `component-registry.json`, `column-types.json`, `columns.json`,
  `decisions.yaml`, `screens.yaml`, `states.json`, `screen-sizes.json`, `theme.json` và `sources/geist-variable.json`.
  Có thêm `tool-stamp.json`, công cụ ở `tools/design-assembly/`, bước cổng `mk/design-assembly.mk` và trang luật
  `.claude/rules/design-assembly.md`. `behaviors.md` và `terms.json` do Repo Standards dựng, như hôm nay.
- **Câu chờ không ai trả lời thay.** Bốn câu `status` liệt kê cũng là bốn câu thư cuối của lượt lồng nhau nói là «I did
  not answer». Màu chính vẫn là xám mặc định của sàn, `oklch(0.205 0 0)`, và `status` ghi «no values chosen».
- **Cổng.** `make check passed: upgrade lint typecheck test ontology derived-untracked ledgers-check design-assembly
design-guards ui-floor`. Bước của plugin in «30 decisions held by 33 checks, each seen failing on a changed copy». Cây
  làm việc vẫn sạch sau đó.
- **Đã cài gì.** `.repo-setup.json` ghi `repo-setup 0.10.5.dev0`, preset `react-vite`, mức `starter`, năng lực
  `design`. `.claude/settings.json` biết marketplace `phanlemanh/design-assembly` và bật `design-assembly@design-assembly`.

## Chi phí và hạn mức

| Đo                  | Trước (2026-11-23 00:59:57 UTC) | Sau (2026-11-23 01:10:22 UTC) |
| ------------------- | ------------------------------- | ----------------------------- |
| Weekly · all models | 18%                             | 18%                           |
| Weekly · Fable      | 21%                             | 21%                           |

Hạn mức đọc bằng thẻ hạn mức của ứng dụng, đặt lại ngày 2026-11-26 00:00 UTC. Thẻ chỉ ghi phần trăm nguyên, nên lượt
này không đẩy con số nào lên một bậc. Gói của tài khoản không bật dùng thêm, nên trần 40 USD chỉ là mức dừng, không phải
tiền trả.

Lượt lồng nhau, theo kết quả stream-json: `total_cost_usd` 3,47 USD, 45 lượt, 44 lần gọi công cụ, 9 phút 39 giây (từ
01:00:34 tới 01:10:15 UTC). Token: 5 411 289 đọc từ bộ nhớ đệm, 220 056 ghi vào bộ nhớ đệm, 80 vào thường, 35 257 ra (5 691
là suy nghĩ). Ba phép thử trước lượt, để biết phiên thấy bản nào, tốn thêm khoảng 1,5 USD. Một phiên mới mở đã mang
khoảng 80 nghìn token ngữ cảnh: các plugin và skill có sẵn trên máy. Ước tính gửi chủ repo cao hơn thật nhiều lần.

## Điều lượt này không chứng

- **Lối của người dùng thật trên máy mới.** Ở đó plugin chưa có trong phiên dựng repo: `.claude/settings.json` chỉ bật
  nó từ phiên sau, nên bước 6.4 nói một câu cách cài rồi đi tiếp, và bộ sổ chỉ có khi người cài plugin rồi gọi nó, hoặc
  khi `doctor` nhắc. CHANGELOG của Repo Standards đã ghi giới hạn ấy. Lượt này nạp plugin trước bằng `--plugin-dir`; chủ
  repo nhận cách ấy là không gõ lệnh (câu A).
- **Repo ra đời có màu thương hiệu.** Chủ repo không yêu cầu lượt thứ hai; lối ấy (quyết định 0087) chưa chạy thật.
- **Lối `adopt` và `doctor` của Repo Standards ở repo đã có** (tiêu chí 5): chỉ `doctor` chạy, trên repo vừa ra đời.
- **Câu hỏi thật của người.** Lời nhắc giao hết cho Claude; không ai trả lời câu nào của `new`, nên lượt này không đo
  cuộc hỏi đáp từng lớp.
- **delivery-loop.** Không chạy ở đây; bên đọc của kit (mục 6.2) đi riêng.

## Điều thấy thêm

Không điều nào chặn tiêu chí 11. Ba điều do chính `adopt --starter` in ra trên repo vừa ra đời, kiểm lại bằng tay:

1. **Phép kiểm trình duyệt của sàn không nêu mã quyết định.** `adopt` in «a proof is there but the ledger cannot point
   at it yet» cho `one-main-one-h1`, `no-sideways-scroll` và `wcag-aa`: `tests/e2e/floor.spec.ts`, tệp của sàn do Repo
   Standards dựng (`capabilities/design/starter/tests/e2e/floor.spec.ts`), không nêu `decision:<id>`. Phép kiểm làm
   đúng việc ấy, nhưng ba quyết định không vào sổ, nên `status` đếm 22 trên 40 câu lõi. Hợp đồng chỗ giáp
   (`docs/seam-contracts.md` của Repo Standards) không nói chuỗi `decision:` này. Sửa ở bên nào là lời chủ repo: sàn
   nêu ba mã, hoặc plugin nhận tệp của sàn như một bằng chứng đã biết. Cách nêu mã nằm ở `references/checks.md` của plugin.
2. **`color-role` nằm ở «claimed» dù lint giữ được nó.** Sổ bằng chứng đã biết của plugin
   (`references/known-proofs.json`) gắn `color-role` với `eslint:shadcn/no-raw-colors`. Trên sàn, mẫu
   `text-[#ff0000]` bị từ chối, nhưng bởi `shadcn/no-arbitrary-values` (đã chạy eslint trên repo bỏ đi để xem). Nên
   `adopt` không giữ dòng ấy bằng công cụ. Đây là việc của kho này; đã gác lại trong kế hoạch.
3. **`whole-class-names` nằm ở «claimed».** Mẫu của plugin đặt lớp động trên một `<div>`; `shadcn/require-static-classes`
   của `@shadcn/lint` 0.2.5 chỉ xét lớp của linh kiện («Component classes the linter cannot read», README của gói).
   ``<div className={cn(`text-${tone}`)} />`` qua lint. Mẫu của plugin đo sai phạm vi luật; cũng là việc của kho này, đã gác lại.

Ngoài ra, lượt lồng nhau gọi `blueprint.py --help` một lần và nhận mã thoát 2 cùng trang hướng dẫn; nó đi tiếp, không
hỏng gì.

## Bằng chứng

Lời nhắc, bản ghi stream-json đầy đủ (441 dòng), bảng các lần gọi công cụ, đầu ra `status` và `make check` được sao vào
thư mục ghi chú chung của nhóm phiên, ngoài kho, trong thư mục `criterion-11-trial`. Repo bỏ đi nằm ở thư mục nháp của
phiên, commit `e0e7db0`, và đi cùng thư mục ấy khi bị dọn.
