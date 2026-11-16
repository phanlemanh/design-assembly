# Bước 8.1a và 8.1b trên một bản sao của repo kiểm chứng

Chạy ngày 2026-11-16, trước khi dựng tiếp 8.1c, 8.2 và 8.3. Hai bước mới chỉ mới chạy trên repo dựng tạm và kho này;
lần này đo chúng trên dữ liệu và công cụ thật của repo kiểm chứng (Inventory), để biết bước 8.4 phải làm gì.

## Làm gì

- **Bản sao:** chép Inventory vào thư mục tạm của phiên, đưa về nhánh chính mới nhất của nó trên GitHub (`7ea2f535`),
  chặn đường đẩy của bản sao. Không lệnh nào ghi vào Inventory thật; commit chỉ ở bản sao.
- **Plugin:** bản 0.3.0, ở commit `4c86684` của kho này.
- **Thứ tự:** lên đời bằng `upgrade`; bật sổ linh kiện ngoài git; rồi tách sổ màn. Mỗi bước đo bằng `make check` của
  chính bản sao. Ca bản chép sạch đo trên một bản clone của bản sao, như máy CI hay một worktree mới.
- **Kit nghiệm thu:** chỉ đọc mã, và chạy lệnh đọc bậc sàn thiết kế của kit (lệnh ấy không ghi gì).

## Kết quả

| Bước                                               | Kết quả                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `make check` trước khi lên đời                     | Thoát 0: 2230 bài; 17 quyết định giữ bằng 20 phép kiểm                                           |
| `upgrade --dry-run` rồi `upgrade`, từ 0.1.0        | 7 tệp công cụ và dấu bản; không sổ nào đổi, không quyết định nào đổi trạng thái; thoát 0         |
| `make check` sau lên đời                           | Thoát 0: 2230 bài; 17 quyết định giữ bằng 20 phép kiểm                                           |
| Bật sổ linh kiện ngoài git                         | Cổng đỏ, nêu đúng việc còn thiếu; sau hai việc trong git: xanh, 21 phép kiểm                     |
| `make check` trên bản chép sạch, chưa có sổ        | **Đỏ**: 5 bài ở 3 tệp bài, đều vì thiếu `design/component-registry.json`                         |
| Cũng bản ấy, sau `components.mjs --write`          | Thoát 0: 2230 bài; 21 phép kiểm                                                                  |
| Tách sổ màn (`screen-fragments.mjs --split`)       | 9 màn, mỗi màn một tệp, đọc lại không mất mục; cổng thiết kế xanh, 22 phép kiểm                  |
| `make -k check` sau khi tách                       | **Đỏ** ở ba bước: 99 bài ở 7 tệp bài, `ontology`, `coverage-matrix`                              |
| Đặt bản `--print` ở đường dẫn cũ                   | `ontology`, `coverage-matrix` xanh lại; còn 4 bài đỏ; cổng thiết kế đỏ (hai hình dạng cạnh nhau) |
| Sinh lại bảng vai × màn × nút                      | Còn 2 bài đỏ: hai bài của Inventory chờ màn đứng theo thứ tự người viết                          |
| Bậc sàn thiết kế của kit, bản chép sạch chưa có sổ | **M1** thay vì M2: «design_floor.registry trỏ tệp không có»                                      |
| Bậc sàn thiết kế của kit, khi có sổ                | M2                                                                                               |

## Điều này nói gì

1. **`upgrade` lên 0.3.0 an toàn.** Repo không bật lựa chọn nào thì không gì đổi, như quyết định 0049 và 0050 hứa.
2. **Sổ linh kiện ngoài git cần thêm một bước vẽ sổ trước bài kiểm ở Inventory.** Cổng của Inventory chạy bài kiểm
   trước bước thiết kế, nên cổng tự vẽ lại thì đã muộn. Ba tệp bài đọc thẳng tệp sổ. Đây đúng là dòng giới hạn
   `out-of-git-file-absent-before-the-gate`, nay thấy trên repo thật.
3. **Kit tụt bậc ở worktree mới.** Kit đọc bậc M2 chỉ khi tệp sổ có trên đĩa. `.worktreeinclude` của Inventory chỉ
   chép `.env`, nên mỗi worktree mới của một vòng đọc ra M1 tới khi có gì đó vẽ sổ. Dòng giới hạn mới:
   `out-of-git-manifest-lowers-kit-tier`.
4. **Bước S3 «sinh lại» của kit không vướng.** Nó chụp cây bằng `git status`, mà git không liệt kê tệp bị bỏ qua, nên
   sổ vẽ lại không bị commit nhầm.
5. **Tách sổ màn mà không có tệp tổng hợp thì repo gãy nặng.** Hơn hai mươi chỗ của Inventory đọc `design/screens.yaml`:
   bài kiểm, công cụ Python, bộ mẫu e2e. Dòng giới hạn `screen-fragments-own-readers-get-no-file`, nay thấy trên repo
   thật.
6. **Tệp tổng hợp ở đường dẫn cũ gỡ gần hết**, đúng như quyết định 0050 tính cho bước 8.4. Nhưng hai chỗ phải sửa:
   - phép kiểm hình dạng sổ đang từ chối một tệp một khối nằm cạnh thư mục; nó phải nhận tệp tổng hợp khi tệp ấy ở
     ngoài git và khớp các mảnh;
   - thứ tự theo mã đổi bảng vai × màn × nút mà Inventory commit, và làm đỏ hai bài chờ thứ tự cũ. Ứng dụng không đọc
     sổ màn, nên người dùng không thấy gì khác.

## Bước 8.4 cần gì, từ lần thử này

- Ghi tệp tổng hợp của sổ màn ra đường dẫn cũ, ngoài git, trước mọi bên đọc của repo, và cho phép kiểm hình dạng nhận nó.
- Vẽ hai tệp dẫn xuất trước bài kiểm của repo, không chỉ trong cổng thiết kế. Ứng viên: lệnh sinh của repo (`make gen`,
  kit đã gọi lệnh này ở S3) hoặc bước cài đặt. Repo không có `Makefile` vẫn phải có đường.
- Lo bậc của kit ở worktree mới: hoặc repo vẽ sổ lúc dựng worktree, hoặc kit vẽ trước khi đọc bậc. Kit là kho chỉ đọc
  với kho này, nên phần của kit phải đi qua chủ repo.
- Hỏi chủ repo: Inventory sửa hai bài chờ thứ tự cũ, hay sổ màn cần một cách khai thứ tự. Máy khuyên sửa hai bài, vì
  thứ tự ở đó chỉ là thói quen của bài, và một danh sách thứ tự chung sẽ lại là tệp mọi PR cùng sửa.

## Vòng hai: sau quyết định 0051

Cùng ngày, sau khi plugin có lệnh `derived.mjs`, bản một tệp của sổ màn và bước `make` chờ nó (bản 0.4.0). Làm trên
một bản clone sạch của bản sao, ở commit đã có sổ linh kiện ngoài git.

| Bước                                                    | Kết quả                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `upgrade` bản 0.4.0 trước khi sửa, bản chép sạch        | **Dừng**: so sổ linh kiện vắng với rỗng, đếm «1 mục mất»                            |
| `upgrade` sau khi sửa                                   | Thoát 0: sổ linh kiện «kept out of git», vẽ lại; 5 tệp ghi                          |
| Chép tay bước `make` mới (upgrade không ghi tệp ấy)     | Như bước 8.4 sẽ làm                                                                 |
| Tách sổ màn, `--copy`, dòng `.gitignore`, sinh lại bảng | Cổng thiết kế xanh, 23 phép kiểm                                                    |
| `make -k check` trên bản clone sạch, chưa có hai tệp    | `derived.mjs` viết cả hai trước bài kiểm; mọi bước xanh trừ 2 bài chờ thứ tự màn cũ |
| Bậc của kit, trước và sau `make`                        | M1 trước, M2 sau                                                                    |

- Bốn bài của repo kiểm chứng bị bỏ qua ở vòng này vì bản clone không có nhánh `main` để so; không liên quan.
- Bảng vai × màn × nút phải sinh sau khi bản một tệp được vẽ: sinh trước thì bảng chỉ thấy 1 màn.

## Chưa thử

- Một vòng trọn của kit nghiệm thu, và bài e2e cần Postgres (không nằm trong `make check`).
- `upgrade` trên một repo đã tách sổ màn.
- Gộp hai nhánh thật của Inventory, mỗi nhánh thêm một màn.

## Giá

- **Chủ repo:** một lời «Thử trên bản sao»; không lần chạm cổng nào.
- **Máy:** khoảng mười lần `make check` của Inventory, mỗi lần chừng một phút.
