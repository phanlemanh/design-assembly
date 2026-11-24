# Cổng giữ việc chọn, trên hai bản sao repo như hôm nay

Tiêu chí 11 của đề bài [0015](../../wiki/specs/0015-choose-before-make-conform-before-intake.md) và câu hỏi 7.
Quyết định: [0102](../../wiki/decisions/0102-the-gate-holds-the-choice.md).

Câu cần trả lời: một repo đang xanh lên đời bản này thì cổng có đỏ trên tệp và dòng sổ nó đã có không; và trên
một nhánh, ba ca của tiêu chí 11 có đỏ không.

## Cách làm

- Ngày 2026-11-24, plugin của nhánh lát 5 (0.54.0).
- Không lượt nào tốn token, không gọi mạng. Mọi lệnh chạy trên bản sao trong thư mục nháp của phiên.
- Bản sao 1: chính kho này ở `6e6e5a4` (main lúc lát 4 vừa gộp, plugin 0.53.0), lấy bằng `git archive` vào một
  repo git mới với nhánh `main`.
- Bản sao 2: repo kiểm chứng ở `1ad8469f`, lấy bằng `git clone --no-hardlinks`. Đó là bước duy nhất chạm vào kho
  ấy, và chỉ đọc. Sau lượt thử, `git status` của kho ấy vẫn sạch. Trên bản sao, em bỏ remote để nhánh `main` của
  bản sao là điểm so.

## Bản sao 1: kho này

| Bước                                                            | Cổng                                                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Trước khi lên đời (0.53.0)                                      | xanh                                                                       |
| `upgrade --dry-run`                                             | nói trước «ledger-shapes gains choose-first…», cổng sau khi lên xanh       |
| `upgrade`, ghi vào `main` của bản sao                           | xanh                                                                       |
| Nhánh mới, thêm `src/components/status-badge.tsx`               | đỏ, nêu đúng tệp và `StatusBadge`                                          |
| `intake --need status-badge … --by-hand --why …`, đáp, `--file` | dòng sổ có `searched: status badge`, `nearest: none`; `ledger-shapes` xanh |

Bước cuối còn một dòng đỏ khác: bản xuất `DESIGN.md` cũ đi vì sổ vừa thêm một dòng. Đó là luật có sẵn của cổng;
viết lại bản xuất bằng `make design-exports` thì cổng xanh, 43 quyết định.

Lượt này bắt được một lỗi trước khi mở PR: người làm tệp trước rồi mới hỏi `intake`, nên lúc hỏi, chính
`StatusBadge` đã nằm trong kho và được ghi là ứng viên gần nhất của nó. Cổng từ chối đúng. `intake` nay tra lại khi
viết dòng, bỏ chính khối ấy ra; có bài kiểm.

## Bản sao 2: repo kiểm chứng

Kho ấy giữ sổ nhập kho theo cách viết riêng (khoá tiếng Việt khai ở `keys`). Trong 24 dòng có 10 dòng tạo tay ghi
`nguon: tao-tay`, không dòng nào có chữ đã tra hay ứng viên gần nhất ở dạng của plugin.

- `upgrade --dry-run` từ 0.7.1 dừng vì những lý do không thuộc lát này, đúng như việc đã gác ở kế hoạch: mất 37
  mục của tệp token khi viết lại, và cổng đỏ ở phép tương phản màu và lint (bản sao không có `node_modules`).
  Không lỗi nào của dòng `ledger-shapes`. Nó cũng nói trước hai phép kiểm sẽ thêm: `taken-down` và `choose-first`.
- Lên đời trên bản sao với `--accept-lost-entries --accept-red-gate` (bản sao bỏ đi, không phải kho của chủ repo),
  ghi vào `main` của bản sao. Dòng `ledger-shapes` xanh, đã có `choose-first`, 10 dòng `tao-tay` không đỏ.

Trên một nhánh của bản sao:

| Bước                                                         | `ledger-shapes`                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| Thêm `src/components/candidate/stock-badge.tsx`              | đỏ, nêu đúng tệp                                                     |
| Khai `values: { by-hand: tao-tay }` ở `_shared.yaml`         | 10 dòng cũ vẫn không đỏ; chỉ tệp mới vẫn được nêu                    |
| Thêm dòng `nhan-ton-kho`, `nguon: tao-tay`, không chữ đã tra | đỏ: «is made by hand and has no searched and no nearest»             |
| Thêm `searched: stock badge`, `nearest: KhongCo`             | đỏ: «names KhongCo as its nearest candidate, which no store … holds» |
| Đổi thành `nearest: none`                                    | xanh                                                                 |

Lượt này cũng bắt được một lỗi trước khi mở PR. Bản đầu so «dòng tạo tay ở điểm rẽ» theo nghĩa đã đọc, nên khi kho
ấy bắt đầu khai `values` trên một nhánh, cả 10 dòng cũ thành «dòng tạo tay mới» và cổng đỏ. Nay một dòng là của
nhánh khi điểm rẽ không có dòng cho nhu cầu ấy, hoặc có mà `source` viết khác; có bài kiểm.

## Điều chưa thấy được

- Kho ấy chưa khai `values`, nên hôm nay plugin không biết `tao-tay` là tạo tay: luật dòng tạo tay chưa áp ở đó cho
  tới khi kho ấy khai. Đó là việc của kho ấy.
- Danh sách «có từ trước» của kho ấy viết là `khoi_co_truoc` và không khai ở `keys`, nên plugin không đọc nó. Không
  ảnh hưởng gì hôm nay, vì cổng không giữ tệp đã có ở `main`.
