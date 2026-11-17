# Đo độ rộng trên hai repo ngoài repo kiểm chứng

Chạy ngày 2026-11-17, cho giai đoạn 2 của kế hoạch (mục 2.1, 2.2, 2.3). Lần đầu plugin gặp một repo
ngoài họ, và một repo cùng họ không phải repo kiểm chứng. Hai repo do chủ repo chỉ định cùng ngày, và
chủ repo cho phép đọc, chỉ đọc.

## Làm gì

- **Ba repo, mỗi repo một bản sao** trong thư mục nháp của phiên. Bản sao clone từ thư mục trên máy,
  ở ref chủ repo chọn; `node_modules` chép bằng clone kiểu copy-on-write của APFS, nên không ghi gì
  vào repo thật.
  - **floorplanstudio**, repo web ngoài họ, ở `origin/main` `f548bfe` (2026-10-08). Checkout trên
    máy đang ở nhánh làm việc; nhánh `main` trên máy chậm 102 commit, nên đo ở đỉnh nhánh mặc định
    theo lần fetch cuối.
  - **crm-onehub**, repo cùng họ, ở `onehub` `74a29a68d` (2026-11-03), đỉnh nhánh mặc định.
  - **Inventory**, repo kiểm chứng, ở `main` `ea774a0f` (2026-11-17), để ba repo cùng đo bằng plugin
    0.7.0.
- **Lệnh:** mọi lệnh chỉ đọc mà plugin có, chạy từ trong bản sao bằng script của plugin, không qua
  tệp make của kho này: `status`, `audit` (thường, `--all`, `--json`, `--out`), `status --out`,
  `adopt --dry-run`, `upgrade --dry-run`, `decide`, `apply --dry-run`, `book --dry-run`,
  `specimen --plan`. Tài liệu `--out` ghi vào thư mục nháp ngoài repo. Thêm thang bốn nấc
  (`docs/trials/ladder.mjs`), lệnh đo của kho này, nó tự clone lại bản sao.
- **Canh:** sau mỗi lệnh xem `git status` của bản sao; cuối lượt xem của ba repo thật và của kit
  nghiệm thu. Không có gì đổi ở đâu cả.

## Hình dạng hai repo mới

- **floorplanstudio:** npm workspaces gồm `packages/*`, `service`, `engines`, `mcp-server`;
  TypeScript và Python. Không có tệp `.tsx`, `.jsx` hay `.css` nào; 122 tệp `.html` là trang bằng
  chứng của vòng nghiệm thu. Không có `Makefile`, không có `design/`.
- **crm-onehub:** monorepo bun và turbo, 18 848 tệp, 1 299 tệp `.tsx`. Bốn ứng dụng ở `apps/`; ứng
  dụng chính là Next.js với thư mục `app/` ở đỉnh gói, không có `src/`. Thư viện linh kiện kiểu
  shadcn nằm ở `packages/ui/src/components`, stylesheet ở `packages/ui/src/styles/globals.css`
  (179 biến, `--primary: #006b4f`), nhập `geist.css` khai biến trong `@layer base`. Có
  `design/patterns/ngan-ban-ghi.md` của riêng repo.

## Ba mức phục vụ trên ba repo

Mức theo tài liệu kiến trúc, mục «Bộ chuyển, và ba mức phục vụ»: **Chỉ luật** là audit, sổ quyết
định và phép đo trình duyệt; **Đồng hành** thêm status, nhận, lên đời; **Trọn** thêm dẫn dắt, bảng
mẫu và cuốn sổ. Mỗi ô là mã thoát và điều lệnh nói.

| Mức       | Lệnh                | floorplanstudio                          | crm-onehub, ở đỉnh                        | Inventory                                                  |
| --------- | ------------------- | ---------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| Chỉ luật  | `audit`             | 0; 0 stylesheet, 0 tệp nguồn, 0/40       | 0; 0 stylesheet, 0 tệp nguồn, 0/40        | 1; 4 stylesheet, 83 tệp, 29/40 (10 giữ, 13 tự khai, 6 ghi) |
| Chỉ luật  | bậc                 | chưa tới «rà soát»                       | chưa tới «rà soát»; 0 trên 1 sổ đúng dạng | «nền tảng», tự khai                                        |
| Chỉ luật  | `decide`            | 0; không câu nào chờ                     | 0; không câu nào chờ                      | 0; không câu nào chờ                                       |
| Đồng hành | `status`            | 0; «nothing to run now»                  | 0; «nothing to run now»                   | 1; bước kế `upgrade` (0.1.0 lên 0.7.0), rồi `adopt`        |
| Đồng hành | `adopt --dry-run`   | 1; 0 dòng, 2 câu cần người               | 1; 0 dòng, 2 câu cần người                | 0; 2 dòng thêm, 8 dòng có thể giữ, 3 lời lint không thấy   |
| Đồng hành | `upgrade --dry-run` | 2; chưa có công cụ, đúng                 | 2; chưa có công cụ, đúng                  | 0; 16 tệp công cụ, cổng vẫn xanh                           |
| Đồng hành | thang bốn nấc       | M0; 0/40 ở cả bốn bước                   | M0; 0/40 ở cả bốn bước                    | M2; 7/7 sổ, 29/40, 10 giữ, giữ cả ngoài lõi 17 lên 18      |
| Trọn      | `apply --dry-run`   | 2; không có `src/index.css`              | 2; không có `src/index.css`               | 2; «no design floor», sai                                  |
| Trọn      | `specimen --plan`   | 2; không có `src/index.css`              | 2; không có `src/index.css`               | 2; «no screen to draw», sai                                |
| Trọn      | `book`              | xem trước 0; ghi thật 1, 0/40, không ảnh | xem trước 0                               | xem trước 0                                                |

- **Phép đo trình duyệt** của mức «Chỉ luật» chưa đo: plugin chưa có lệnh chỉ đọc nào chạy nó trên
  một repo chưa cài phần.
- Ở Inventory số khớp lần đo ngày 2026-11-15 ở [thang bốn nấc](inventory-ladder.md): 29 trên 40
  câu lõi, 10 máy giữ, 7 trên 7 sổ, bậc M2. «Giữ cả ngoài lõi» là 17 thay cho 16. Bước nhận thêm hai
  dòng mới của plugin 0.7.0 (`decision-sheet`, `owner-calls`) mà số ấy chỉ lên 1; chưa truy vì sao.
- **crm-onehub theo từng gói**, vì ở đỉnh plugin không đọc được gì (xem phần sau). Chỉ `--target`
  vào gói giao diện `packages/ui`: `audit` thoát 1, 2 stylesheet, 153 tệp, 0 trên 40, tới bậc «rà
  soát», 4 câu bị đi vòng ở 35 chỗ (màu 17, cỡ chữ 10, khoảng cách 7, bo góc 1); `status` thoát 1,
  bước kế là audit; `adopt --dry-run` thoát 1, 0 dòng thêm, 2 dòng «sẽ đỏ hôm nay», tương phản không
  đọc được. Chỉ vào gói ứng dụng `apps/app`: `audit` thoát 0, 0 tệp nguồn.

## Không lần chạy nào sập

- **Plugin:** 58 lần chạy trên ba bản sao và hai gói của crm-onehub. Mọi lần thoát 0, 1 hoặc 2; mọi
  lần thoát 2 có một dòng lý do, không lần nào in dấu vết ngăn xếp.
- **Thang bốn nấc** sập ở lần đầu, trên cả hai repo mới: bước 2 luôn truyền `--record source-color`,
  `adopt` từ chối đúng (thoát 2, «--primary is not declared»), còn thang ném lỗi không bắt, kèm dấu
  vết, không in hai dòng cuối và không nói repo thật có đổi không. Chủ repo cho sửa trong giai đoạn
  này. Nay thang ghi bước bị từ chối thành một dòng của bảng rồi đo tiếp, và bài kiểm của thang có
  thêm một repo không có cổng, không có `--primary`. Sửa xong lại thấy một câu sai: bốn dòng bằng
  nhau được nói là «repo đã nhận mọi nấc», trong khi hai repo chưa nhận gì. Câu ấy nay tách hai
  trường hợp. Đo lại: ba lần chạy thoát 0, không in gì ra luồng lỗi.

## Plugin nói sai ở đâu

Mỗi chỗ thành một dòng của `plugins/design-assembly/references/limits.json`, mở ngày 2026-11-17.

| Dòng                                         | Mức       | Plugin nói gì, ở repo hình dạng nào                                                                                                                                                                                                            |
| -------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit-workspace-reads-top-src-only`         | nặng      | Repo nhiều gói: audit và status chỉ đọc `src/` ở đỉnh, nói «không có gì để đọc», status thoát 0 «nothing to run»; gói giao diện có màu chính riêng và 35 chỗ đi vòng.                                                                          |
| `audit-undecided-with-nothing-read`          | vừa       | Gói có thư mục `app/` ở đỉnh: đọc 0 tệp, «không có stylesheet», vẫn trích màu chính của stylesheet do cấu hình linh kiện trỏ ra ngoài gói, và gọi bốn câu dùng thang là «chưa quyết».                                                          |
| `values-under-a-cascade-layer-unread`        | vừa       | Biến khai ở `:root` trong `@layer base` không được đọc: vai màu trỏ tới đó bị nói «points nowhere», tương phản bị nói không đọc được.                                                                                                          |
| `words-check-reads-type-parameters-as-text`  | vừa       | Tham số kiểu `<TData extends Omit<…>>` trong tệp `.tsx` bị đọc là thẻ chứa chữ, nên `adopt` nói câu «nhãn» sẽ đỏ hôm nay.                                                                                                                      |
| `library-folder-not-read-from-settings`      | vừa       | Thư mục thư viện linh kiện chỉ là `components/ui` hay `components/reui`, không đọc từ cấu hình; gói giữ thư viện ở `src/components` bị tính đi vòng trong chính linh kiện của thư viện, và bộ hiện thông báo bị nói là màn gọi thẳng thư viện. |
| `guide-commands-look-for-src-index-css-only` | nhẹ       | Bảng mẫu và bộ ghi của dẫn dắt chỉ tìm `src/index.css`; ở repo đã nhận có stylesheet khác chỗ, chúng nói «không có màn để vẽ», «không có nền».                                                                                                 |
| `ladder-stopped-where-adopt-refused`         | vừa, đóng | Thang sập khi `adopt` từ chối, rồi nói sai nghĩa của bốn dòng bằng nhau. Đóng cùng thay đổi này.                                                                                                                                               |

- **floorplanstudio không thêm dòng nào.** Repo không có giao diện viết bằng biến CSS, nên mức «Chỉ
  luật» không đọc được gì. Điều ấy đã có ở dòng `audit-web-css-vars-only`, và audit nói đúng: 0 tệp,
  0 stylesheet, không bậc nào đạt; cuốn sổ ghi thật cũng chỉ ra 0 trên 40.
- `design/patterns/ngan-ban-ghi.md` của crm-onehub lệch hình dạng hợp đồng ở hai khoá. Đó là việc
  của repo ấy, không phải plugin nói sai.
- Dòng `trials-on-this-repository-only` giữ nguyên: nay đã có repo ngoài họ được rà soát, nhưng
  mười lượt thử độc lập vẫn chạy trên bản sao của kho này.

## Điều này nói gì

- Mức «Đồng hành» chưa tới được repo cùng họ thứ hai: hình dạng nhiều gói làm audit đọc ra rỗng và
  bảo người không phải làm gì. Đây là chỗ chặn mục 7.3 («một repo thứ hai cùng họ thừa hưởng lõi»);
  đã để ở mục để dành của kế hoạch.
- Mức «Chỉ luật» trên repo ngoài họ đúng nghĩa đen của nó: nói thật là không đọc được gì. Nó chưa
  có gì để đưa cho một repo không viết giao diện bằng biến CSS.
- Ba lệnh của mức «Trọn» chỉ chạy được trên repo có `src/index.css`, tức là repo ra đời trên sàn.

## Chưa đo

- Phép đo trình duyệt của mức «Chỉ luật».
- Cài plugin qua marketplace vào hai repo mới: lượt này gọi script của plugin trực tiếp, vì cài sẽ
  ghi vào thư mục cấu hình của repo.
- Ba gói ứng dụng còn lại của crm-onehub (`apps/agent`, `apps/agent-okr`, `apps/api`).
