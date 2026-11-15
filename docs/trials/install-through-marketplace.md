# Cài plugin qua marketplace vào một repo thử

Chạy ngày 2026-11-16, cho mục 1.1 của kế hoạch. Lần đầu plugin được cài và chạy từ bản đã cài, thay
vì gọi script từ kho này.

## Làm gì

- **Repo thử:** một ứng dụng React, Vite và TypeScript dựng tạm trong thư mục nháp, có stylesheet,
  vài linh kiện và cấu hình eslint, cố ý để một màu viết thẳng trong một linh kiện.
- **Cài:** thêm marketplace từ thư mục của kho này, rồi cài plugin với phạm vi dự án, cả hai bằng
  dòng lệnh của Claude Code, bản 2.1.281.
- **Chạy:** mọi lệnh gọi script trong bản đã cài, nằm ở thư mục bộ nhớ đệm của plugin. Một bộ canh
  nạp vào từng tiến trình ghi lại mọi lần đọc tệp hay mở tiến trình con có nhắc tới thư mục của kho
  này.
- **Dọn:** gỡ plugin và marketplace, rồi so từng byte ba tệp cấu hình của máy với bản sao lưu.

## Kết quả

| Bước                   | Thoát | Kết quả                                                                         |
| ---------------------- | ----- | ------------------------------------------------------------------------------- |
| `status`               | 1     | Repo ở nấc «rà soát», bước kế là `audit`                                        |
| `audit`                | 1     | 0 trên 40 câu lõi; thấy màu viết thẳng đã cài sẵn                               |
| `adopt`, chưa có cổng  | 1     | Không ghi gì: repo không có tệp `Makefile` gom các tệp `mk/*.mk`                |
| `adopt`, có cổng       | 1     | Ghi 9 dòng sổ, công cụ, bước cổng và trang luật; dấu bản 0.1.0; 3 câu chờ người |
| `make check` của repo  | 0     | 9 quyết định giữ bằng 9 lệnh kiểm, chạy bằng bản công cụ trong repo thử         |
| `upgrade`, đã mới nhất | 0     | Không có gì để ghi                                                              |
| `upgrade`, bản bị sửa  | 0     | Thấy «đổi sau khi đóng dấu», đưa tệp về như bản đã cài, cổng vẫn xanh           |
| `decide`               | 1     | 3 câu chờ chủ repo, đều trả lời qua cờ của `adopt`                              |

- **Không gọi gì của kho này:** bộ canh ghi 0 lần chạm tới thư mục của kho này, kể cả eslint, tsc và
  lệnh kiểm do cổng của repo thử chạy. Không đường dẫn nào trong script hay khuôn mẫu của bản đã cài
  trỏ ra ngoài thư mục plugin.
- **Bản đã cài đúng bản 0.1.0:** cây của khuôn mẫu, script và công cụ trùng với cây ghi cho 0.1.0
  trong `plugins/design-assembly/references/releases.json`.
- **Cấu hình của máy:** sau khi gỡ, ba tệp cấu hình trùng từng byte với bản sao lưu. Lệnh cài đã
  xếp lại thứ tự khoá trong một tệp; tác tử chép lại từ bản sao lưu.
- **Còn sót:** bản sao trong bộ nhớ đệm của plugin ở lại, có đánh dấu bị bỏ; lệnh gỡ không xoá nó.

## Điều này nói gì

Điều kiện đầu của giai đoạn 1 đạt, trừ một chỗ: repo thử đi trọn rà soát, nhận và lên đời bằng
đường của plugin mà không gọi lệnh nào của kho này, nhưng chỉ sau khi người chạy thử tự viết tệp
`Makefile` cho nó. Repo không ra đời từ repo-setup thì `adopt` không ghi gì cả.

## Chưa thử

- Gọi các lệnh như lệnh gạch chéo trong một phiên Claude Code thật, và `${CLAUDE_PLUGIN_ROOT}` có
  được thay đúng ở đó không.
- Cài từ marketplace trên GitHub thay vì từ một thư mục trên máy.
- Lên đời từ một bản sang bản khác: mới chỉ có bản 0.1.0.
- `decide` ghi một lời đáp, cuộc dẫn dắt, cuốn sổ bàn giao, và tài liệu `--out`.

Phát hiện vào sổ giới hạn: `adopt-without-makefile-writes-nothing`,
`local-install-copies-working-tree`, `installed-copy-names-checkout-files`,
`checks-md-names-absent-targets`, `person-calls-have-no-recommendation`. Dòng
`plugin-never-installed` đóng theo lần chạy này.
