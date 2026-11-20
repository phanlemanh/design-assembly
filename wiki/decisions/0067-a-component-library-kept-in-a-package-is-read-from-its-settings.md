---
type: decision
title: "Thư viện linh kiện đặt trong một gói được đọc từ cấu hình của nó, theo từng tệp khi thư mục dùng chung"
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/decisions/0066-next-js-is-the-second-build-the-plugin-draws-with.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/adapters/shadcn.mjs
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/templates/tools/design-assembly/owner-calls.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/probes.mjs
  - plugins/design-assembly/scripts/audit.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/tests/test-library-package.mjs
  - docs/trials/library-in-a-package.md
  - "chủ repo, 2026-11-20: «tiếp tục 4.4»; nguồn thứ hai: «shadcn trong một gói riêng»"
---

# 0067 Thư viện linh kiện đặt trong một gói được đọc từ cấu hình của nó, theo từng tệp khi thư mục dùng chung

## Status

Accepted, 2026-11-20. Mục 4.4 của kế hoạch («Nguồn linh kiện thứ hai»), theo đề bài 0002. Ngày 2026-11-20 chủ repo chọn
nguồn thứ hai: shadcn đặt trong một gói riêng của monorepo, như gói `packages/ui` của crm-onehub. Đây là lối máy khuyên.
Hai lối kia là một thư viện ngoài họ shadcn, và tách ReUI thành bộ chuyển riêng.

## Context

Đề bài 0002 ghi rằng mỗi loại bộ chuyển mới có một bản. Với linh kiện, bản ấy là shadcn đặt trong `src/components/ui` của
ứng dụng. Mọi repo của chủ repo đều dùng shadcn; ReUI đã được đọc như một thư mục phụ của cấu hình shadcn.

Repo cùng họ crm-onehub giữ thư viện theo một cách khác:

- thư viện nằm trong gói `packages/ui`;
- bí danh `@crm/ui/components` dẫn qua `exports` của gói tới `src/components`;
- thư mục ấy chứa chung linh kiện của shadcn và linh kiện riêng của nhóm.

Plugin nhận ra thư viện bằng tên thư mục `components/ui` hay `components/reui`. Vì vậy ở gói ấy, nó tính các chỗ đi vòng
trong linh kiện của thư viện là của nhóm, và nói toaster của thư viện là một màn gọi thẳng thư viện thông báo. Dòng giới
hạn `library-folder-not-read-from-settings` ghi điều này.

## Decision

1. **Bộ chuyển shadcn đi theo bí danh của chính gói.**
   - `@/x` là `src/x`, như trước.
   - Một bí danh bắt đầu bằng tên gói được dẫn qua `exports` của gói. Chẳng hạn `./components/*` trỏ tới
     `./src/components/*.tsx` thì thư mục là `src/components`.
   - Bí danh không đi tới đâu thì là thư mục thường dùng, như trước.
   - Thư mục của registry khác (ReUI) đi theo cùng cách.
2. **Bộ chuyển giữ danh sách tên linh kiện của registry shadcn:** 65 tên, đọc ngày 2026-11-20 ở
   `https://ui.shadcn.com/r/index.json`. Nguồn và ngày đọc được ghi ngay trong bộ chuyển.
3. **`components.mjs` kê «phần của thư viện» (`libraryParts`), một danh sách dùng chung.**
   - Thư mục mà thư viện giữ riêng, tức thư mục mang tên `ui` hay thư mục của một registry khác, là của thư viện, ghi
     dưới dạng `thư-mục/`.
   - Ở thư mục thư viện dùng chung với linh kiện riêng, chỉ những tệp ở ngay thư mục ấy mang tên một linh kiện của
     registry mới là của thư viện, ghi bằng đường dẫn đầy đủ.
   - `inLibrary` thử một tệp với danh sách ấy. `libraryTest` cho một phép thử. Repo không có cấu hình linh kiện thì vẫn
     nhận theo tên thư mục, như trước.
4. **Mọi phép kiểm bỏ thư viện ra đều đọc danh sách ấy:**
   - `audit` (đếm chỗ đi vòng, và đếm ngoại lệ lint);
   - phép so tổng của cổng (`decision-sheet`), đọc lại từ cấu hình mỗi lần chạy;
   - luật kênh thông báo và luật lời báo lỗi;
   - sổ linh kiện;
   - các tệp mà phép thử lint chọn.
     Danh sách bỏ qua vốn so theo tiền tố, nên một đường dẫn tệp đầy đủ khớp đúng tệp ấy. Dữ liệu công cụ giữ hình dạng
     cũ, và chỉ có thêm khoá `library` ở phép kiểm sổ linh kiện khi thư mục dùng chung.

5. **Cách nhận cũ vẫn giữ.** Thư mục mang tên `components/ui` hay `components/reui`, ở bất kỳ tầng nào, vẫn là của thư
   viện. Danh sách mới chỉ cộng thêm, nên một repo có cấu hình không mất phần nào nó đã có.
6. **Danh sách rỗng nghĩa là không tệp nào là của thư viện.** Điều này đúng ở sổ linh kiện, ở cổng và ở `audit`. Chỉ khi
   không có danh sách nào, sổ linh kiện mới kê mọi linh kiện là của thư viện, như trước.
7. **Cổng cộng thêm phần của thư viện đọc lúc chạy vào danh sách bỏ qua mà cuộc dẫn dắt đã ghi.** Một linh kiện cài sau
   lần dẫn dắt cuối vẫn được bỏ ra, ở mọi phép kiểm dùng danh sách ấy.

Một người đọc lại độc lập nêu năm chỗ, và đề nghị chặn việc gộp vì hai chỗ đầu. Cả ba chỗ đầu đã sửa, mỗi chỗ kèm một bài
kiểm thấy đỏ trước khi sửa: mục 5, 6 và 7 ở trên. Hai chỗ còn lại được ghi, không sửa:

- **Tên trùng:** một tệp riêng mang tên một linh kiện của registry, như `table.tsx` hay `form.tsx`, ở thư mục dùng chung
  thì bị tính là của thư viện. Repo mà bí danh trỏ tới `@/components` sẽ vào trường hợp này. Dòng giới hạn
  `library-items-read-on-a-date` ghi điều ấy.
- **So theo tiền tố:** một mục bỏ qua là đường dẫn tệp cũng khớp tệp mang thêm đuôi, như `button.tsx.snap`. Các lệnh hôm
  nay chỉ đọc tệp `.tsx` và `.jsx`, nên chưa gặp.

Thử 10 cách làm hỏng mã. Một cách lúc đầu lọt: bỏ phép kiểm «bí danh phải bắt đầu bằng tên gói». Nay có một ca dùng tên
gói cùng độ dài mà khác gói, và cả 10 cách đều bị bắt.

## Consequences

- **Lệnh chứng:** `node --test plugins/design-assembly/tests/test-library-package.mjs`, 10 bài.
- **Đo trên bản sao gói CRM** (`docs/trials/library-in-a-package.md`):
  - Số chỗ đi vòng giảm từ 35 xuống 22. Mười ba chỗ không còn bị tính đều nằm trong bảy tệp của thư viện.
  - Toaster của thư viện không còn bị nói là màn.
  - Hai tệp của nhóm gọi thẳng thư viện thông báo vẫn được báo; đó là phát hiện thật.
- **Kho này không đổi:** cấu hình của kho trỏ tới `src/components/ui`, một thư mục thư viện giữ riêng.
- **Sổ giới hạn:**
  - Đóng `library-folder-not-read-from-settings`.
  - Mở ba dòng mới:
    - `library-items-read-on-a-date`: danh sách tên đọc một lần, có ngày;
    - `shared-library-folder-top-level-only`;
    - `library-alias-through-exports-only`: bí danh chỉ có ở cấu hình TypeScript chưa được đi theo.
- **Plugin lên 0.17.0.** `adapters/`, `components.mjs`, `owner-calls.mjs`, `check.mjs` và `probes.mjs` nằm trong công cụ
  chép vào repo.
