# Lệnh `affected` trên 30 PR đã gộp của repo kiểm chứng

Chạy ngày 2026-11-16, trong lúc dựng bước 8.2. Đây là phép đo của tiêu chí 7 trong đề bài 0005: trên 30 PR đã gộp
của repo kiểm chứng (Inventory), tập màn mà `affected` chọn phải chứa mọi màn mà hợp đồng của vòng ấy khai. Thiếu một
màn là lỗi; thừa thì ghi số đo.

## Làm gì

- **Bản sao:** clone Inventory vào thư mục tạm của phiên, ở commit `7f113f70` của nhánh chính. Không lệnh nào ghi vào
  Inventory thật.
- **PR:** 30 commit gộp gần nhất trên nhánh chính, theo cha thứ nhất (từ PR 38 tới PR 70). Tệp đổi của mỗi PR lấy
  bằng `git diff --name-only --no-renames` giữa cha thứ nhất và commit gộp.
- **Màn khai:** khoá `screens` ở đầu mỗi `_acceptance/<slug>/contract.md` mà PR ấy chạm.
- **Lệnh:** `affected.mjs` của kho này, chạy với `--files` trên bản sao đã đưa về đúng commit gộp. Inventory xếp màn
  theo thư mục trang, nên tệp trang do bộ chuyển tiếp `nextjs` tìm.
- **Bản đồ thay đổi:** Inventory chưa khai `affected`. Mỗi lần chạy, phép đo ghi tạm một bản đồ vào dữ liệu công cụ
  của bản sao, theo ba mức.

## Kết quả

| Bản đồ                                                                                                | PR thu hẹp | Thiếu màn | Màn chọn khi thu hẹp                    |
| ----------------------------------------------------------------------------------------------------- | ---------- | --------- | --------------------------------------- |
| Không khai gì                                                                                         | 0 trên 30  | 0         | —                                       |
| Tệp không phải mã: hồ sơ nghiệm thu, tài liệu, wiki, trang lộ trình, công cụ riêng, sổ quyết định     | 3 trên 30  | 0         | 0 màn ở cả ba (PR chỉ chạm tài liệu)    |
| Trần giả định: thêm mọi bài kiểm, cơ sở dữ liệu, mô hình nghiệp vụ, mọi tệp `design/` và tệp cấu hình | 9 trên 30  | 0         | 0 màn ở 6 PR; 5 tới 7 trên 8 màn ở 3 PR |

- Ở mọi mức và ở mọi lần chạy, không PR nào thiếu màn đã khai. Tiêu chí 7 đạt về mặt an toàn.
- Ở mức trần, 2 PR có hợp đồng khai màn được thu hẹp (PR 38 và 46, cùng khai màn `inventory`). Lệnh chọn 5 và 6 màn
  cho chúng, tức là thừa 4 và 5 màn so với hợp đồng, vì lý do ở mục sau. PR thứ ba chọn được màn (PR 70) không có
  hợp đồng, và lệnh chọn 7 màn cho nó.
- Số ở mức trần giảm qua ba lần chạy, mỗi lần vì một luật an toàn mới. Không lần nào vì một màn bị bỏ sót.
  1. Lần đầu: 15 PR.
  2. Thêm luật «tệp mà máy chủ chạy tới thì đòi trọn bộ»: còn 13. Hai PR (47 và 54) đổi một tệp vừa được trang nhập,
     vừa được một API route dùng. Lần đầu lệnh chỉ chọn màn nhập tệp ấy, tức là có thể bỏ sót màn gọi API ấy lúc chạy.
     Luật này chạm 10 trên 30 PR.
  3. Sau lần đọc lại độc lập: còn 9. Bốn PR (55, 57, 60, 68) đổi sổ màn một tệp `design/screens.yaml`. Lần trước, bản
     đồ mức trần khai cả `design/` là không chạm màn, và lệnh lọc phần ấy trước mọi luật. Nay luật sổ màn và luật
     `import` đứng trước bản đồ: đổi sổ màn thì đòi trọn bộ, và tệp một màn nhập vẫn là của màn ấy dù bản đồ nói gì.
- Bộ đọc `import` rộng hơn sau lần đọc lại không làm PR nào mất thu hẹp:
  - nó thấy `require` và `import()` viết bằng chuỗi khuôn;
  - nó đọc bí danh của `tsconfig.json`, và tệp dữ liệu mà mã nhập;
  - không lần chạy nào trên repo này gặp một `import` mà nó không lần được.

## Vì sao ít PR thu hẹp được

- **PR của repo kiểm chứng chạm nhiều loại tệp ngoài màn.** Tính trên mọi lý do của 30 PR, chỗ gặp nhiều nhất là
  `tests/e2e` (46 lần), `tests/e2e-db` (33), `src/modules` (31), `ontology/entities` (30), `tests/db` (25) và
  `db/tests` (22). Với sổ ở mức đầu, mọi tệp ấy đều đòi trọn bộ. Đó là đúng luật an toàn: lệnh không biết một bài
  kiểm hay một bảng dữ liệu chạm màn nào.
- **Lớp vỏ của ứng dụng kéo gần hết mã vào mọi màn nhân viên.** `src/app/(app)/layout.tsx` kéo khoảng 155 trên 264
  tệp nguồn vào mỗi màn trong 7 màn nhân viên. Vì thế hầu hết thay đổi ở `src/modules` chạm cả 7 màn, và lệnh chỉ
  tách được màn đăng nhập. Đây là cấu trúc của repo ấy, không phải lỗi của lệnh.
- **84 tệp nguồn không thuộc màn nào.** Phần lớn là `src/components/reui` (28 linh kiện thư viện chưa màn nào dùng),
  `src/app/api` (12 API route) và `src/modules/identity` (11). Đổi một tệp như thế thì đòi trọn bộ.

## Còn chưa đo

- Bài trình duyệt của Inventory đặt tên theo tính năng, không theo đường dẫn màn, nên mẫu `grep` của lệnh chưa chọn
  được bài nào ở đó. Đề bài 0005 đã ghi điều này là việc của repo ấy.
- Bản đồ ở bảng trên là của phép đo này, không phải lựa chọn của chủ repo kiểm chứng. Khai bản đồ là việc của bước
  8.4, xin phép riêng.
- Chưa đo trên repo thứ ba.
