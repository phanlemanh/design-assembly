---
type: decision
title: "Cầu nối ra, lát 1: DESIGN.md và bộ hệ thiết kế sinh từ sổ, mang dấu bản, cổng đỏ khi bản xuất cũ"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0008-design-tokens-file.md
  - wiki/decisions/0088-claude-design-system-measured-on-four-measures.md
  - wiki/decisions/0091-bring-in-reads-an-outside-source-into-a-candidate-direction.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/exports.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/mk/design-assembly.mk
  - plugins/design-assembly/scripts/bring-out.mjs
  - plugins/design-assembly/skills/bring-out/SKILL.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-bring-out.mjs
  - DESIGN.md
  - design/export/system/
  - "trang công khai đọc ngày 2026-11-23, không gửi gì của kho: github.com/google-labs-code/design.md docs/spec.md (định dạng DESIGN.md, bản alpha)"
  - "chủ repo, 2026-11-23: «Dựng mục 10.4»"
---

# 0092 Cầu nối ra, lát 1: sổ đi ra, cổng giữ

## Status

Accepted, 2026-11-23, chờ chủ repo bác ở các lựa chọn dưới đây. Lát 1 của mục 10.4, theo lời chủ repo «Dựng mục
10.4»; máy chia mục làm hai lát. Lát này giữ tiêu chí 10 và phần sinh và cổng của tiêu chí 14. Lát 2 còn lại: lời cho
phép gửi ra ngoài theo repo và theo phích, lượt đẩy lên Claude in trước gửi gì đi đâu, câu hỏi «đặt làm mặc định»,
bản ghi lần đẩy cuối và dòng của `status`. Tiêu chí 13 là lượt thử có người, không phải việc của máy. Plugin lên
0.40.0.

## Context

Bài học 1 của lần thử tay: công cụ ngoài mang ý đồ tới tác tử bằng bản chép, và bản chép cũ đi ngay khi hệ đổi mà
không gì báo. Kho đã có một tệp sinh từ sổ được cổng giữ: `design/tokens.json` (0008), viết lại bằng
`make design-tokens`, đỏ khi khác stylesheet. Cầu nối ra theo đúng mẫu ấy.

## Decision

1. **Bộ sinh nằm trong công cụ** (`templates/tools/design-assembly/exports.mjs`), vì cổng của repo chạy không có plugin
   bên cạnh. Nó đọc sổ token, sổ thiết kế, dữ liệu công cụ (vai màu «theo»), sổ linh kiện và sổ nguồn, và viết:
   - `DESIGN.md` ở gốc repo: khối đầu với `colors` (sáng ở trên, tối dưới `dark`), `typography` theo từng nấc, `rounded`
     (có `base` là bo góc gốc), `spacing`; rồi các mục theo đúng thứ tự của đặc tả. Vai màu «theo» vai khác được viết
     thành tham chiếu `{colors.primary}`, đúng điều 0088 đòi.
   - Bộ hệ ở `design/export/system/`: `README.md`, `tokens.json` (định dạng của nhóm cộng đồng design token, màu tối
     dưới `color.dark`, tham chiếu cho vai «theo»), `components.md` (liệt kê linh kiện của sổ linh kiện, không vẽ bản
     xem: phần «bản xem linh kiện» của tiêu chí 14 chưa có ở lát này), `assets.json` (phông của sổ nguồn, với bản ghim
     và giấy phép).
2. **Dấu bản.** Mỗi bản xuất mang «written from the design ledgers at X», X là mười hai ký tự đầu của băm dữ liệu các
   sổ đầu vào (đọc như dữ liệu, nên bộ định dạng xếp lại tệp không đổi X).
3. **Cổng.** Loại kiểm mới `export`, một kiểm cho mỗi tệp xuất, dưới quyết định `design-exports` (dòng `formula` của sổ
   quyết định, trỏ vào công cụ). Dấu bản khác thì đỏ, nêu hai bản. Dấu bản đúng mà nội dung khác thì cũng đỏ («sửa tay»):
   tệp văn bản so sau khi bỏ khoảng trắng, nên bộ định dạng xếp lại vẫn xanh; tệp dữ liệu so bằng dữ liệu. Kiểm đầu tiên
   còn nêu tệp xuất nào dữ liệu công cụ thôi giữ. Thông điệp nêu tệp, bản nó được viết từ, bản sổ đang ở, và lệnh viết lại
   `make design-exports`. Như mọi kiểm, nó được thấy đỏ trên một bản sao đổi một màu.
4. **Từ chối.** Lệnh `bring-out` từ chối khi bản sao công cụ của repo chưa có `exports.mjs` (cần `upgrade` trước), và khi dữ
   liệu công cụ không đọc được.
5. **Lệnh `bring-out`** (phích không mặc định của ổ bàn giao, đi qua ổ quyết định để ghi dòng `design-exports`) viết
   các bản xuất, thêm kiểm vào `design/theme.json` và dòng vào sổ quyết định khi chưa có. Nó không gửi gì đi đâu.
6. **Đi ra rồi đi vào khớp.** Bài kiểm đọc lại bộ hệ bằng cầu nối vào (0091): ra đúng màu nguồn, thang chữ và bo góc
   của sổ, không câu hỏi nào.
7. **Kho này mang bản xuất của chính nó** (`DESIGN.md`, `design/export/system/`), và `make check` giữ chúng.

## Consequences

- Năm dòng giới hạn mới, vùng `capabilities` (dòng thứ năm ở dưới): `DESIGN.md` chưa qua bộ kiểm của đặc tả (cần mạng để cài; một phép kiểm
  của plugin đọc khối đầu, màu chính, tham chiếu và thứ tự mục); linh kiện chỉ được liệt kê, không có bản xem; chưa gì
  gửi bộ hệ đi (lát 2); dấu bản đổi theo mọi thay đổi của sổ thiết kế, kể cả lời giải thích.
- Soát độc lập trước khi mở PR: không điểm nghiêm trọng. Hai điểm cao đã sửa, có bài kiểm: sửa tay tệp văn bản lọt cổng;
  thôi giữ một tệp xuất không ai biết. Điểm vừa đã sửa: lệnh không kiểm bản công cụ, đơn vị khoảng cách không đặt trong
  ngoặc kép, nấc `base` trùng tên, dữ liệu công cụ hỏng thành lỗi thô, lời về bản xem linh kiện và tài sản. Ghi giới
  hạn: lối dẫn, lối nhận, nâng cấp và các lệnh `make` viết token không viết lại bản xuất
  (`bring-out-not-rewritten-by-other-writers`).
- Ai đổi một sổ đầu vào thì phải chạy `make design-exports` trong cùng thay đổi, như `make design-tokens` hôm nay.
- Lựa chọn chờ chủ repo: tên lệnh `bring-out`; `DESIGN.md` nằm ở gốc repo; bộ hệ ở `design/export/system/`; kho này
  mang bản xuất của chính nó.
