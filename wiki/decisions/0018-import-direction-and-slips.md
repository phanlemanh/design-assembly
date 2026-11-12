---
type: decision
title: Hướng nhập giữa các phần, và sổ lỗi lọt
links:
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/decisions/0016-screen-kinds-and-failed-actions.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/governance.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - design/parts.json
  - design/escapes.md
---

# 0018 Hướng nhập giữa các phần, và sổ lỗi lọt

## Status

Accepted. Chủ kho duyệt bốn khuyến nghị cho bậc governance ngày 2026-11-12 («Làm tiếp»).

## Context

Bậc governance còn thiếu một câu lõi (phần nào của mã được nhập phần nào) và một tệp. Hai điều
thấy khi đọc lại:

- Bảng bậc của plugin gọi tệp đó là «sổ các lần lệch chuẩn được chấp nhận», nhưng tệp nó nhận là
  sổ lỗi lọt của kho đối chứng. Lệch chuẩn có chủ ý và lỗi lọt qua lệnh kiểm là hai việc khác nhau.
- Sổ lỗi lọt ở kho đối chứng đang trống, và bản đề xuất chuẩn của chủ kho đã ghi «sổ này đang 0
  dòng dù đã nhiều audit». Một tệp trống vẫn làm bậc này đạt.

Nguồn đã đọc ngày 2026-11-12: Feature-Sliced Design (một tệp chỉ nhập từ các tầng nằm hẳn bên
dưới); ESLint (luật cấm nhập chỉ áp cho nhập tĩnh; lý do của ngoại lệ viết sau hai gạch ngang);
Brad Frost, quy trình governance và chương 5 của Atomic Design (thứ làm riêng một lần phải được
ghi lại; ai duyệt thay đổi là câu mỗi tổ chức tự trả lời); Google SRE, postmortem (bản ghi có
nguyên do và việc làm để không tái diễn; bản không ai xem lại coi như chưa từng có). Kho đối
chứng giữ hướng nhập bằng luật lint và giữ sổ lỗi lọt dạng bốn cột.

## Decision

1. **Hướng nhập** (`tier-direction`). Kho khai các phần của mã từ trên xuống trong
   `design/parts.json`. Mỗi tệp thuộc phần đầu tiên nêu tên nó, và chỉ nhập phần của mình cùng các
   phần liệt kê sau. Cuộc dẫn dắt viết bản đầu khi đã có trang kiểu màn: khung ứng dụng, các màn
   (lấy từ trang kiểu màn), linh kiện, phần nền; từ đó tệp là của người. Công cụ của plugin đọc
   lệnh nhập trong mã, cả tĩnh lẫn động, nên câu này là «máy giữ».
2. **Sổ lỗi lọt** (`escapes`, ngoài lõi). `design/escapes.md`, đúng dạng của kho đối chứng: ngày,
   lỗi gì, tầng nào đáng ra phải chặn, đã làm gì. Công cụ kiểm rằng mỗi dòng có đủ bốn phần và
   nêu một tầng có thật. Audit in số dòng và ngày của dòng mới nhất, và nói thẳng khi sổ trống.
3. **Ngoại lệ có chủ ý ở lại cạnh luật mà nó bẻ, kèm lý do**; không lập sổ riêng. Tệp rời khỏi
   kiểu màn giờ cũng bị buộc có lý do. Audit đếm ba loại ngoại lệ trong một dòng.
4. **Lời của plugin sửa cho đúng nghĩa**: tệp của bậc governance là sổ những gì lọt qua lệnh kiểm.

Không làm: quy trình đóng góp, đánh số phiên bản, loại bỏ linh kiện cũ (chưa có kho thứ hai dùng
chung hệ này); quy trình «ai duyệt»; hai câu ngoài lõi của kho đối chứng về cửa vào của mô-đun và
luật sản phẩm.

## Consequences

- Kho này đáp 37/38 quyết định lõi: 14 máy giữ, 17 tự khai, 6 đã ghi. Bậc governance 3/3 và có
  tệp. Câu lõi duy nhất còn mở là «mở hồ sơ cạnh danh sách», chưa màn nào cần.
- Sổ lỗi lọt của kho này bắt đầu với sáu dòng thật từ ngày 2026-11-12, trong đó một dòng còn mở
  (tương phản khi rê chuột) và một dòng thuộc Repo Standards.
- Bài kiểm của plugin 150 lên 163.

Giới hạn:

- **Không máy nào buộc được người ghi sổ lỗi lọt.** Công cụ chỉ kiểm dạng của dòng đã ghi; sổ
  trống vẫn qua.
- **Hướng nhập chỉ giữ được ở kho đã có trang kiểu màn**, vì phần «màn» lấy từ đó.
- Công cụ không đi theo lệnh nhập vào trong một gói, và coi `@/` là thư mục `src`.
- Các tệp cùng một phần nhập nhau tự do: hai màn nhập lẫn nhau không bị bắt.
- Adopt chưa nhận hai luật này ở kho đã có.
- Chưa được tác tử độc lập thử.
