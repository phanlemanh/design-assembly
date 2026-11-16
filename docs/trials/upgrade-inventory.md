# Lên đời repo kiểm chứng bằng `upgrade`

Chạy ngày 2026-11-16, cho mục 1.4 của kế hoạch. Đây là lần đầu repo kiểm chứng (Inventory) nhận bản sửa của plugin
bằng chính lệnh `upgrade`, thay vì chép tay như lần ngày 2026-11-15.

## Làm gì

- **Cho phép:** chủ repo trả lời «Cho phép» ngày 2026-11-16, cho lên đời trên một nhánh riêng của Inventory, kèm hồ sơ
  nghiệm thu để duyệt và ký.
- **Nhánh:** `chore/upgrade-design-assembly`, cắt từ main của Inventory ở `b6f4f29`. Lệnh chạy từ plugin bản 0.1.0, ở
  commit `34a7938` của repo này.
- **Hồ sơ:** `_acceptance/upgrade-design-assembly-tool/` ở Inventory, theo vòng của bộ kit nghiệm thu, hạng T3 vì thư
  mục công cụ thuộc vùng hạng cao nhất của Inventory.
  - Chủ repo duyệt Cổng Phạm vi, kế hoạch và ký Cổng Bằng chứng.
  - PR [phanlemanh/onehub-inventory#72](https://github.com/phanlemanh/onehub-inventory/pull/72), gộp theo khe giám sát
    đợt điều phối của Inventory xếp.

## Kết quả

| Bước                                         | Kết quả                                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `upgrade --dry-run`, nhánh chưa cài thư viện | Dừng, không ghi gì: báo sổ token mất 37 mục và cổng sẽ đỏ — nguyên nhân thật là thiếu thư viện       |
| `upgrade --dry-run`, sau `make setup`        | 6 tệp công cụ đổi; sổ linh kiện thêm 3 mục «dựng từ»; không quyết định nào đổi trạng thái; cổng xanh |
| `upgrade`                                    | 8 tệp ghi, dấu bản 0.1.0, thoát 0                                                                    |
| `make check` của Inventory                   | Thoát 0: 1961 bài, 17 quyết định giữ bằng 20 lệnh kiểm, sổ linh kiện khớp mã (291)                   |
| `audit` của plugin, trước và sau             | Quyết định máy giữ 16 → 17; quyết định hỏng 1 → 0; câu lõi máy giữ 10 → 10                           |
| Lượt chấm của hồ sơ                          | ĐẠT: 12 phép đo của hồ sơ và ba bộ kiểm của Inventory; 11 mục ngoài hợp đồng, chủ repo quyết         |

- **Đúng bản:** cây thư mục công cụ trên nhánh bằng cây ghi cho bản 0.1.0 ở cột `tool` của
  `plugins/design-assembly/references/releases.json`, và dấu bản của Inventory ghi cùng cây ấy.
- **Hai bản sửa còn nợ đã vào:**
  - bộ đọc linh kiện vẽ được linh kiện mà tệp nhập vào rồi xuất lại, nên sổ có lại ba quan hệ «dựng từ» của bộ lọc mà
    lần chép tay làm mất;
  - lint của repo được hỏi qua tệp, có hạn 120 giây (quyết định 0042).

## Câu «16 hay 18»

Lần đo ngày 2026-11-14 đếm 18 quyết định máy giữ, lần đo ngày 2026-11-15 đếm 16. Không có hồi quy ẩn:

- **Thang khoảng cách:** hồ sơ `adopt-design-assembly` của Inventory gỡ có chủ ý phép kiểm lint của câu này ngày
  2026-11-15 (commit `ca48707`), vì luật lint của Inventory không chặn được đoạn mã phạm nào.
- **Sổ linh kiện:** lệch mã dưới bản plugin mới tới khi lên đời; lần lên đời này sửa nó.

## Điều này nói gì

Điều kiện thứ hai của giai đoạn 1 đạt khi PR gộp (gộp ngày 2026-11-16 ở `7bc5f69`): repo kiểm chứng chạy đúng bản công cụ của plugin sau khi lên đời.
Đường lên đời đi được trên một repo thật, và bản xem trước dừng đúng ở ca đáng dừng. Nhưng lời báo của nó khi thiếu thư
viện chỉ sai chỗ (dòng giới hạn `upgrade-blames-ledger-for-missing-dependencies`).

## Giá

- **Chủ repo:** ba lần chạm cổng (phạm vi, kế hoạch, chữ ký), vì thư mục công cụ thuộc hạng T3 ở Inventory.
- **Máy:** khoảng 1,2 giờ máy cho cả vòng, khoảng 1,6% hạn mức tuần, theo dòng đo của bộ kit.
- **Chờ:** một lượt nhường khoá chấm cho đợt điều phối đang chạy ở Inventory.

## Chưa thử

- Lên đời từ một bản có dấu sang bản sau: lần này Inventory chưa có dấu, lệnh so theo nội dung.
- Bước cổng mới có canh phiên bản: lệnh `upgrade` không ghi bước cổng (giới hạn `upgrade-leaves-gate-step`). Chủ repo
  nhận không canh thư mục công cụ ở Inventory tới lần lên đời sau.
