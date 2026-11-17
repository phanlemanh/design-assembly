# Repo kiểm chứng lên plugin 0.7.0 bằng `upgrade`

Chạy ngày 2026-11-17, mục 8.4 của kế hoạch. Repo kiểm chứng (Inventory) nhận các bước 8.1 tới 8.3 qua lệnh `upgrade`,
trên một nhánh riêng có hồ sơ nghiệm thu T3 do chủ repo ký. Mỗi bước có lời cho phép riêng của chủ repo.

## Làm gì

- **Nhánh:** `chore/upgrade-design-assembly-0.7.0`, cắt từ nhánh chính trên GitHub ở `69253032`. Bản trên máy chậm
  155 commit và chưa có lần lên đời 1.4, nên không cắt từ đó. Thay đổi nằm ở commit `ec2c4597`.
- **Chạy thử trước:** mọi bước chạy trên một bản sao ở thư mục tạm trước khi đụng tới nhánh thật. Cây tệp cuối của
  nhánh thật trùng hẳn cây của bản chạy thử.
- **Hồ sơ:** `_acceptance/upgrade-design-assembly-0-7-0/` trên nhánh ấy. Có 10 tiêu chí và 22 eval. Lượt 1 bị trả
  lại vì lint của chính hồ sơ, lượt 2 PASS. Chủ repo ký ở Cổng 2, commit `07cc1d9f`.
- **PR:** [phanlemanh/onehub-inventory#84](https://github.com/phanlemanh/onehub-inventory/pull/84), mở theo lời chủ repo
  sau khi ký. Gộp ngày 2026-11-17, commit gộp `8925e8ff`. Trước khi gộp, bài `tests/e2e-db/screens.spec.ts` được sửa
  cho màn xếp theo mã; hợp đồng thêm tiêu chí AC-11, và chủ repo ký lại ở commit `632ae1fd`.

## Các bước, theo thứ tự

1. **`upgrade` từ 0.1.0 lên 0.7.0:** 16 tệp công cụ và tệp dấu phiên bản. Không sổ nào đổi, cổng xanh. Tệp
   `mk/design-assembly.mk` phải chép tay từ mẫu; giới hạn `upgrade-leaves-gate-step` đã ghi điều đó.
2. **Sổ linh kiện ra khỏi git:** chạy `components.mjs --out-of-git`, thêm tệp vào `.gitignore`, bỏ tệp khỏi chỉ mục.
3. **Sổ màn thành mỗi màn một tệp:** `screen-fragments.mjs --split` rồi `--copy`, tạo 9 tệp màn. Bản sao một tệp nằm
   ngoài git cho các bộ đọc của chính repo.
4. **Bảng vai × màn × nút ra khỏi git:** tên mới là `design/role-screen-buttons.md`. Tệp mới `mk/derived.mk` viết lại
   bảng trước các bước `test`, `e2e` và `ci-db`.
5. **Sổ khối thành mỗi khối một tệp:** đổi tên `design/so-khoi.yaml` thành `design/intake.yaml`, giữ khoá tiếng Việt
   qua `keys`, rồi tách thành 23 tệp. Các bộ đọc của repo phải sửa theo:
   - cổng chứng minh, viết bằng Python, đọc thẳng thư mục khi chưa có bản sao (có bài kiểm mới, đã thấy đỏ trên mã cũ);
   - ngày luật ra đời đọc qua mọi đường dẫn sổ từng có;
   - skill dựng màn của repo.
6. **Bảng luật hành vi:** 28 hàng trong `design/behaviors.md` thành một danh sách.
7. **Bản đồ `affected`:** khai các tệp không chạm màn: hồ sơ nghiệm thu, tài liệu, wiki, kiến trúc, quản trị, eval,
   công cụ, `.claude/`, tệp `*.md`, trang lộ trình, sổ quyết định.
8. **Sửa theo:** sáu liên kết ở đầu trang wiki, hai bài kiểm thứ tự, và một mục miễn trong bài kiểm bản sao nông cho
   `owner-calls.mjs`.

## Kết quả

| Phép đo                                                             | Kết quả                                                          |
| ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `make check` ở chỗ rời nhánh chính                                  | xanh, 2459 bài                                                   |
| `make check` trên nhánh                                             | thoát 0, 2460 bài đạt, 2 bỏ qua, 17 quyết định giữ bởi 25 phép   |
| `make check` trên bản sao sâu 1 commit, dựng như CI của repo ấy     | thoát 0, tự viết đủ bốn tệp dẫn xuất, git không theo dõi tệp nào |
| Kiểm kê của plugin, trước và sau                                    | chỉ một dòng đổi: sổ đúng hình dạng từ 7 trên 7 lên 8 trên 8     |
| `affected` trên 30 PR đã gộp gần nhất, với bản đồ đã khai           | thu hẹp 4 PR, không PR nào thiếu màn đã khai                     |
| Hai nhánh, mỗi nhánh thêm một tệp màn và một tệp khối, gộp với nhau | gộp sạch                                                         |

## Ba dòng «xong khi» của giai đoạn 8

1. **Số PR chạm sổ linh kiện và bảng vai × màn × nút về 0: mới có về cấu trúc.**
   - Cả hai tệp nay nằm ngoài git, và hai nhánh cùng thêm màn thì gộp sạch.
   - Con số trên 30 PR tới thì chưa đo được: PR #84 chưa gộp, và chưa có PR nào sau nó.
2. **Lệnh bản đồ màn: có.** Phép đo trên 30 PR ở bảng trên, cộng phép đo của bước 8.2 ở
   [`affected-on-a-reference-copy.md`](affected-on-a-reference-copy.md).
3. **Một lượt dựng màn không hỏi chủ repo giữa chừng: chưa có trên repo kiểm chứng.** Hai dòng của 8.3
   (`decision-sheet`, `owner-calls`) được hoãn, xem mục sau. Repo này có dòng ấy từ bước 8.3; repo kiểm chứng thì chưa.

Vì dòng 1 và dòng 3 chưa có, giai đoạn 8 chưa đóng và mục 8.4 còn dở.

## Chỗ va: hai dòng của 8.3 và bản sao nông

- `decision-sheet` và `owner-calls` cần lịch sử của nhánh chính. Trên bản sao sâu 1 commit, hai dòng đỏ với lời «no
  main branch». Đó là đúng như [quyết định 0054](../../wiki/decisions/0054-the-decision-ledger-stands-in-for-the-head-of-design.md)
  mục 8 muốn: không tìm ra nhánh chính thì cả hai đỏ, thay vì để khuôn mới lọt qua.
- Repo kiểm chứng có luật riêng là CI chạy trên bản sao nông, và `make check` phải xanh trong bản sao ấy (`ci-thu.sh`
  của repo dựng bản sao như thế). Bài kiểm bản sao nông của repo ấy cũng bắt `owner-calls.mjs` đọc lịch sử.
- Chủ repo chọn hoãn hai dòng. Hướng sửa là ở plugin, bản 0.7.1: hai phép kiểm tự lấy phần lịch sử còn thiếu khi gặp
  bản sao nông. Một lần lên đời sau đó sẽ thêm hai dòng vào repo kiểm chứng.

## Điều thấy thêm

- **Bộ đọc bài kiểm có gắn thẻ của `decision-sheet` đọc cả chuỗi trong dữ liệu mẫu.** Một bài kiểm của repo ấy có
  chuỗi `decision:a`, `decision:other` trong dữ liệu mẫu, và phép kiểm coi chúng là thẻ thật. Chưa dòng giới hạn nào
  của plugin ghi điều này.
- **Bản sao ngoài git có thể cũ hơn thư mục mảnh.** Sửa một mảnh mà chưa vẽ lại thì bộ đọc nào ưu tiên bản sao sẽ đọc
  số cũ. Ở repo ấy, bộ đọc Python ưu tiên bản sao còn bộ đọc JavaScript đọc thư mục. Hội đồng chấm ghi điều này ở
  Cổng 2.
- **Ở Cổng 2, chủ repo chia 17 mục nằm ngoài hợp đồng:** 10 ghi vào giới hạn đã biết, 5 thành hợp đồng mới ở repo
  ấy, 2 chấp nhận không sửa. Năm hợp đồng mới là việc của repo ấy. Hai trong số đó nói tới bản sao cũ, nên chạm cả
  mẫu của plugin: skill và khuôn cổng chứng minh bảo người ghi vào bản sao dẫn xuất thay vì vào mảnh.

## Còn chưa làm

- Đo dòng 1 trên các PR sau PR #84.
- Plugin 0.7.1: `decision-sheet` và `owner-calls` chạy được trên bản sao nông. Thêm hai dòng giới hạn cho hai điều ở mục
  trên.
- Lên đời repo kiểm chứng thêm một lần để thêm hai dòng của 8.3.
