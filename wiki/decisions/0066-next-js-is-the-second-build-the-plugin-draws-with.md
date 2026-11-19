---
type: decision
title: "Next.js là nền dựng thứ hai plugin vẽ được, chạy bằng máy chủ phát triển của chính repo"
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/decisions/0065-new-shows-whole-directions-before-any-single-value.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/adapters/nextjs-build.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/vite.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/index.mjs
  - plugins/design-assembly/scripts/stage.mjs
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/scripts/specimen.mjs
  - plugins/design-assembly/tests/test-next-build.mjs
  - plugins/design-assembly/tests/helpers/next-repo.mjs
  - package.json
  - "chủ repo, 2026-11-20: «Tiếp tục 4.3»; nền dựng: «Next.js»; chỗ đo: «Cài Next vào kho này»; phạm vi: «Màn thật, chưa vẽ linh kiện»"
---

# 0066 Next.js là nền dựng thứ hai plugin vẽ được, chạy bằng máy chủ phát triển của chính repo

## Status

Accepted, 2026-11-20. Mục 4.3 của kế hoạch, theo đề bài 0002 (giai đoạn 4, dòng «xong khi» thứ hai) và đề bài 0004.
Ngày 2026-11-20 chủ repo chọn ba điều:

- nền dựng thứ hai là Next.js;
- dòng «xong khi» được chứng bằng một ứng dụng mẫu dựng trên gói `next` cài vào kho này;
- trong mục này, cuốn hướng dẫn vẽ màn thật mà chưa vẽ linh kiện.

Điều thứ hai không theo lối máy khuyên (máy khuyên đo trên bản sao của repo kiểm chứng), và là lời cho phép thêm đúng một
gói.

## Context

Mọi thứ plugin vẽ bằng hình đều mở màn của repo bằng nền dựng của chính repo: bảng mẫu, hướng đi và cuốn hướng dẫn. Đến
nay chỉ có một bộ chuyển dựng, cho Vite. Máy chủ của Vite chạy ngay trong tiến trình của plugin, nên nó làm được ba việc:

- phục vụ thêm một mô-đun của plugin, như trang vẽ linh kiện;
- nạp một mô-đun của repo, như danh sách màn `src/screens.ts`;
- đổi một mô-đun lúc phục vụ, như cách mở bản ghi trên bảng mẫu.

Dòng giới hạn `specimen-needs-vite-and-test-browser` ghi rằng ngoài Vite thì bảng và cuốn hướng dẫn chỉ có chữ. Repo kiểm
chứng và nhiều repo cùng họ dựng bằng Next.js; chúng không có `src/screens.ts`, mà kê màn ở sổ màn.

## Decision

1. **Bộ chuyển dựng thứ hai, `adapters/nextjs-build.mjs`.**
   - Mã là `next.js`, vì bộ chuyển đọc đường dẫn của cùng thư viện đã mang mã `nextjs`.
   - Nó chạy `next dev` lấy từ gói của chính repo, ở một cổng trống của máy này, rồi chờ máy chủ báo sẵn sàng.
   - Nó dừng cả nhóm tiến trình ở mọi lối ra:
     - khi được đóng;
     - khi máy chủ dừng trước lúc sẵn sàng, hay khởi chạy lỗi;
     - khi tiến trình của plugin kết thúc mà chưa đóng nó.
   - Lần dừng cuối luôn là tín hiệu mạnh nhất, vì một tiến trình con có thể sống lâu hơn tiến trình chính.
   - Máy chủ dừng trước khi sẵn sàng thì nó nói dòng cuối máy chủ in ra.
2. **Mỗi bộ chuyển dựng nói nó biết repo của mình thế nào (`detect`) và máy chủ của nó làm được gì (`serves`).**
   - Vite làm được cả ba việc. Next.js không làm được việc nào, vì máy chủ của nó chạy riêng.
   - `detect` cho một mức chắc:
     - 2 khi repo giữ tệp cấu hình của nền ấy, hoặc lệnh `dev` của chính repo chạy nó;
     - 1 khi gói chỉ nêu tên nó;
     - 0 khi gói không nêu.
       Tệp cấu hình của trình chạy bài kiểm Vitest không tính, vì một ứng dụng Next.js có thể kiểm bằng nó.
   - `openStage` dùng nền chắc nhất. Hoà thì dùng nền đứng trước trong danh sách. Gói không nêu nền nào thì dùng nền
     đầu tiên, như trước khi có nền thứ hai.
   - Kho này nêu cả hai, và giữ `vite.config.ts`, nên vẫn dùng Vite.
   - Lời gọi `openStage` trả thêm `build` và `can`. Việc mà nền dựng không làm được thì không được xin, nên người gọi
     phải nói mình không vẽ được gì.
3. **Cuốn hướng dẫn đọc màn từ sổ màn khi repo không có `src/screens.ts`.**
   - Trên nền dựng không nạp được danh sách màn, mỗi màn được vẽ một lần ở đường dẫn của nó, ngay khi mở.
   - Ảnh ấy được xếp vào trạng thái đầu tiên sổ ghi. Cách đi tới các trạng thái khác chỉ có ở danh sách màn, nên chúng
     không có ảnh.
   - Màn không có vùng `main` thì bị bỏ qua và được nói tên; các màn khác vẫn được vẽ.
   - Linh kiện không được vẽ. Mỗi phần bị bỏ có một dòng `note:` riêng, và lệnh kết thúc bằng 1.
   - Thiếu gói dựng mà có trình duyệt thì lời báo nêu đúng là thiếu gói dựng, không nói là thiếu trình duyệt.
4. **Bảng mẫu:** mục cách mở bản ghi nói rằng nền dựng không đổi được mô-đun lúc phục vụ, thay vì dừng giữa chừng. Lệnh
   biết điều ấy trước khi mở máy chủ.
5. **Ứng dụng mẫu Next.js được dựng lúc chạy bài kiểm,** trong thư mục đầu ra `coverage/` của kho.
   - Nó có hai màn của app router, một stylesheet, một sổ màn và độ rộng 390 và 1280.
   - Nó dựng từ chữ trong `tests/helpers/next-repo.mjs`, nên cây của kho không có tệp `.jsx` nào cho lint và định dạng
     đọc.
   - Gói `next@16.4.6` vào `devDependencies` của kho, cùng bản với repo kiểm chứng.

Một người đọc lại độc lập nêu mười hai chỗ, không chỗ nào chặn việc gộp. Các chỗ đã sửa, mỗi chỗ kèm một bài kiểm hoặc một
lần thử làm hỏng mã:

- lời báo «không có trình duyệt» khi thật ra thiếu gói dựng;
- máy chủ sót lại khi plugin bị ngắt, hay khi tiến trình con sống lâu hơn tiến trình chính;
- máy chủ bị giết bằng tín hiệu trước lúc sẵn sàng thì lệnh chờ đủ hai phút rồi báo sai;
- lỗi khởi chạy không được bắt;
- một ứng dụng Next.js có kiểm bằng Vitest bị vẽ bằng Vite;
- một màn không có vùng `main` làm hỏng cả cuốn hướng dẫn;
- bảng mẫu mở máy chủ chỉ để từ chối;
- bài kiểm không thấy được ảnh của hai màn có khác nhau hay không.

Hai chỗ được giữ nguyên, có lý do:

- Một repo Vite có sổ màn mà không có `src/screens.ts` nay được vẽ theo sổ màn, thay vì không vẽ gì. Đó là điều mục này
  muốn.
- Trên Windows, máy chủ không được dừng theo nhóm. Dòng giới hạn `second-build-not-stopped-on-windows` ghi điều này.

## Consequences

- **Dòng «xong khi» thứ hai của giai đoạn 4 có lệnh chứng:** `node --test plugins/design-assembly/tests/test-next-build.mjs`,
  9 bài, không bài nào bị bỏ qua. Sau lần vẽ, không máy chủ nào còn chạy.
  - Hai bài dùng một gói giả trong thư mục tạm, để kiểm việc dừng một tiến trình con lờ đi lệnh dừng thường, và một máy
    chủ dừng trước lúc sẵn sàng.
  - Thử 8 cách làm hỏng mã. Lúc đầu một cách lọt: bỏ lần dừng cuối của cả nhóm. Sau khi có gói giả, cả 8 đều bị bắt.
  - Cuốn hướng dẫn vẽ cả hai màn của ứng dụng mẫu ở cả hai độ rộng, trên máy chủ của Next.js.
  - Sau khi đóng, cổng của máy chủ không còn trả lời.
- **Dòng giới hạn:**
  - Đóng `specimen-needs-vite-and-test-browser`.
  - Mở bốn dòng mới:
    - `second-build-draws-screens-as-they-open`: trên nền thứ hai, mỗi màn chỉ có ảnh lúc mở; màn sau đăng nhập được vẽ
      thành trang đăng nhập.
    - `second-build-draws-no-components`: không vẽ linh kiện, và không vẽ mục cách mở bản ghi.
    - `second-build-sheet-not-tried`: chưa bài nào vẽ bảng mẫu trên nền thứ hai.
    - `second-build-writes-its-build-folder`: máy chủ của Next.js ghi thư mục dựng của nó vào repo, như khi người chạy nó.
- **Hai bài kiểm cũ đổi:**
  - Bài kiểm bộ chuyển nay thấy hai bộ chuyển dựng.
  - Một bài của cuốn hướng dẫn nay bỏ cả danh sách màn lẫn sổ màn, vì có sổ màn là đã có màn để vẽ.
- **Plugin lên 0.16.0.** `adapters/` nằm trong công cụ chép vào repo, nên cây công cụ đổi.
- **Chưa thử trên repo thật.** Repo kiểm chứng vẫn ở công cụ 0.7.1, và việc nâng nó là của chủ repo.
