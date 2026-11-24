# Lấy lại `filters` qua lối mới: lấy về, chuẩn hoá, nhập kho, rồi dùng lần thứ hai

Tiêu chí 14 và 15 của đề bài [0015](../../wiki/specs/0015-choose-before-make-conform-before-intake.md), câu hỏi 9.
Quyết định: [0104](../../wiki/decisions/0104-filters-taken-in-through-conform-measured.md). Lần đo trước, theo lối cũ:
[reui-components-measured](reui-components-measured.md).

## Lời cho đo

Chủ repo cho chạy ngày 2026-11-24 («Cho chạy»): ước tính khoảng 850 nghìn token, trần 1,2 triệu cho cả lượt; khoảng
450 nghìn (trần 600 nghìn) cho lần dùng đầu, khoảng 200 nghìn (trần 300 nghìn) cho lần thứ hai. Chỉ trên bản sao
trong thư mục nháp, không gọi mạng, không chạy dòng cài; repo kiểm chứng chỉ được đọc.

## Cách làm

Một lượt, từ 18:18 tới khoảng 19:10.

- **Bản sao ứng dụng mẫu:** kho này ở `7802802`, dựng bằng `git archive` trong thư mục nháp. Bỏ phần cấm đọc như vai
  dựng màn: `plugins/`, `docs/`, bản quyết định, đề bài, `tests/plugin-*`, `mk/plugin.mk`, `mk/plan.mk`, và các dòng
  của nhật ký và chỉ mục trỏ tới chúng. `node_modules` chép từ kho này (bản sao theo khối, mỗi bên một bản). Mốc đầu:
  `make check` xanh.
- **Plugin cho tác tử:** bản của `7802802`, đặt ngoài bản sao. Tác tử chạy lệnh của nó và được đọc các trang kỹ năng,
  `contract.md`, `checks.md`; không được đọc mã nguồn của plugin.
- **Lấy về, không mạng:** repo kiểm chứng ở `1ad8469f` được `git clone --no-hardlinks` vào thư mục nháp. Từ bản sao
  ấy chép sang:
  - 14 tệp của `filters` và 11 tệp của `cascader` (25 tệp, 18 832 dòng);
  - năm linh kiện nền chúng đòi (`popover`, `tooltip`, `scroll-area`, `dropdown-menu`, `button-group`);
  - danh mục có ghim `design/reui-catalog.json`;
  - từ `node_modules` của kho ấy, ba gói `date-fns`, `@tanstack/react-virtual`, `@tanstack/virtual-core`, và hai dòng
    ở `package.json`.
  - Phiên này viết thêm `design/sources/reui.json`: đứng trước bộ khởi đầu, `folder: src/components/reui`,
    `pin_file` và `catalog` cùng trỏ vào danh mục.
- **Lúc vừa lấy về, cổng đỏ:** 226 lỗi lint, đúng số của lần trước. Thêm 73 lỗi kiểu, 30 tệp chưa định dạng, và phép
  kiểm chữ của plugin báo 2 lỗi.
- **Câu hỏi cho chủ repo** được tác tử đáp thay, với tên «Owner stand-in (trial)», và chỉ có giá trị trong bản sao.
  Không câu nào vào hàng chờ hay sổ của kho này.
- **Sau lượt thử:** `HEAD` của repo kiểm chứng vẫn là `1ad8469f`, `git status` vẫn sạch.

Một điều không kiểm được: các tệp `filters` lấy từ bản của repo kiểm chứng. Trong đó có dòng đặt tên mức gốc theo
tên trường thay cho «Top level». Không mạng thì không so được với bản ReUI giao hôm nay; số lỗi lint lúc vừa lấy về
khớp đúng lần trước.

## Lần dùng đầu (tiêu chí 14)

Một tác tử, nhánh `first-use`. Việc: màn `/` lọc thêm theo trạng thái và ngày, chỉ màn này, bằng `filters` qua
`find`, `intake`, `conform`, `intake --file`.

| Đo gì                                                        | Kết quả                                                                                                                                                                                       |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cổng (`make check`) lúc tác tử nói xong, phiên này chạy lại  | **xanh**                                                                                                                                                                                      |
| Vòng sửa                                                     | 2                                                                                                                                                                                             |
| Bản ghi chuẩn hoá                                            | `design/conform/filter-by-status-and-date.json`, giữ mã băm ghim; 30 tệp như lấy về và sau khi vá: 25 tệp ReUI và 5 linh kiện nền                                                             |
| Bản vá                                                       | **24**, mỗi bản một lý do                                                                                                                                                                     |
| Điều khai miễn                                               | **82**, trên 16 luật; nhiều nhất `@ts-nocheck` 16, `@typescript-eslint/ban-ts-comment` 16, `react-refresh/only-export-components` 9, `no-restricted-syntax` 7, `shadcn/no-arbitrary-values` 7 |
| Luật tắt ngoài danh sách khai miễn                           | **0**: phiên này đối chiếu mọi dòng tắt luật, `@ts-nocheck`, `@ts-ignore` trong `src` và `tests` với danh sách, và đọc thay đổi của tệp cấu hình                                              |
| Lỗi 1 đã lọt lần trước: ô nổi không tên                      | **còn**: trên màn đang chạy, mở «Thêm bộ lọc» thì có một phần tử `role="dialog"` không `aria-label`, không `aria-labelledby`                                                                  |
| Lỗi 2 đã lọt lần trước: câu tiếng Anh cho trình đọc màn hình | **còn**: vùng `role="status"` đọc «Top level, 2 items» khi mở trình đơn                                                                                                                       |
| Câu hỏi lên hàng chờ, đáp thay                               | 9                                                                                                                                                                                             |
| Chỗ tác tử tự quyết, phiên này đếm                           | 13: tác tử khai 15, bỏ 2 chỉ có vì bản sao thiếu kế hoạch (dòng `Plan:`) và về ngôn ngữ báo cáo                                                                                               |
| Thời gian                                                    | khoảng 21 phút                                                                                                                                                                                |
| Token                                                        | công cụ báo 367 869; đã xử lý, không kể đọc lại bộ đệm, **447 781**; kể cả đọc lại bộ đệm 31 786 482                                                                                          |

Hai lỗi được kiểm bằng một trình duyệt không giao diện trên máy chủ dev của bản sao: mở màn `/`, bấm «Thêm bộ lọc»,
đọc cây truy cập. Không gọi gì ra ngoài.

Điều khai miễn và chi phí chuẩn hoá, theo bảng dự kiến của đề bài:

- Kiểm kiểu chặt được khai miễn trọn bằng `@ts-nocheck` trên 16 tệp. Đề bài cho khai miễn mục này.
- 18 điều khai miễn thuộc luật kiểu dáng của thư viện nền: `no-arbitrary-values` 7, `require-static-classes` 5,
  `no-inline-styles` 3, `no-restyle` 3. Mức «bắt buộc» của đề bài nói giá trị kiểu dáng là của hệ, nên những điều này
  lẽ ra không khai miễn được. `intake` vẫn nhận, vì không gì phân biệt luật bắt buộc với luật được khai miễn.
- Lý do của mọi điều khai miễn do tác tử viết. Không người thật nào duyệt; giai đoạn 11 đòi chủ repo duyệt từng điều.
- Chữ người dùng thấy đi qua bảng chữ của repo (`labels.ts`); tác tử viết lấy chữ tiếng Việt.

## Lần dùng thứ hai (tiêu chí 15)

Một tác tử mới, nhánh `second-use`, sau khi `first-use` được gộp vào `main` của bản sao. Việc: màn `/overdue` lọc
thêm theo trạng thái và ngày, bằng khối kho đã có.

| Đo gì                                   | Lần đầu                     | Lần thứ hai                                                                                |
| --------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------ |
| Cổng lúc xong                           | xanh                        | **xanh**                                                                                   |
| Vòng sửa                                | 2                           | **0**                                                                                      |
| `intake` cho nhu cầu                    | hỏi, đáp thay, rồi ghi dòng | **bậc 1: «in the store already», thoát 0**                                                 |
| Đổi tệp của khối hay của nguồn          | 24 bản vá                   | **không** (phiên này so `main..second-use` trên `src/components/reui`, bản ghi và dòng sổ) |
| Câu hỏi lên hàng chờ                    | 9                           | 2                                                                                          |
| Chỗ tự quyết, phiên này đếm             | 13                          | **8**: tác tử khai 9, bỏ dòng `Plan:`                                                      |
| Thời gian                               | khoảng 21 phút              | **khoảng 11 phút**                                                                         |
| Token đã xử lý, không kể đọc lại bộ đệm | 447 781                     | **231 101**                                                                                |
| Token công cụ báo                       | 367 869                     | 237 718                                                                                    |
| Lần gọi công cụ                         | 122                         | 48                                                                                         |

Lần thứ hai còn làm thêm một việc không ai đòi: dời thanh lọc vào `ItemList` để hai màn dùng chung, và gọn màn `/`.
Tám chỗ nó tự quyết phần lớn xoay quanh việc ấy: thanh lọc đặt ở đâu, hook đặt ở tệp nào, có sửa màn kia không. Cùng
lúc, nó thấy một bài kiểm chập chờn (2 trên khoảng 15 lần chạy) mà không gì bắt.

## Cả lượt

| Ai                                                 | Token đã xử lý, không kể đọc lại bộ đệm | Kể cả đọc lại bộ đệm |
| -------------------------------------------------- | --------------------------------------- | -------------------- |
| Lần dùng đầu                                       | 447 781                                 | 31 786 482           |
| Lần dùng thứ hai                                   | 231 101                                 | 8 741 280            |
| Phiên chạy lượt thử, từ 18:18 tới lúc viết bản ghi | 78 523                                  | 18 067 653           |
| **Cộng tới lúc viết bản ghi**                      | **757 405**                             |                      |

Số trên cộng từ nhật ký của từng tác tử và của phiên này, mỗi lượt trả lời một lần, cùng cách của lần đo trước. Phần
viết bản ghi, quyết định và PR sau đó được cộng ở mô tả PR. Mỗi tác tử dưới trần của nó, cả lượt dưới trần 1,2 triệu.

## Tiêu chí

| Tiêu chí                                         | Đạt không                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 14: cổng xanh                                    | **đạt**                                                                                       |
| 14: không luật nào tắt ngoài danh sách khai miễn | **đạt** (0); nhưng danh sách có 18 điều khai miễn luật kiểu dáng, mà mức «bắt buộc» không cho |
| 14: không lỗi nào của hai lỗi đã lọt còn lại     | **không đạt**: cả hai còn                                                                     |
| 14: bản ghi nêu chi phí chuẩn hoá                | **đạt**: 24 bản vá, 82 điều khai miễn, 21 phút, 447 781 token                                 |
| 15: lần dùng thứ hai được đo, đặt cạnh lần đầu   | **đạt**                                                                                       |

## Điều lượt thử tìm ra mà không gì bắt

- `find` đọc các tệp mới lấy về, chưa nhập kho, như linh kiện của repo, và khuyên dùng `Filters`. Điều này hết khi
  tác tử khai registry `@reui` ở `components.json`, với một địa chỉ tự đoán.
- Câu hỏi nhập kho không nói được món mang gì, vì nguồn không có bản chụp. Hai linh kiện nền thiếu (`separator`,
  `spinner`) chỉ lộ ra ở phép kiểm kiểu.
- Phép kiểm chữ của plugin đọc tham số kiểu `<T>` trong tệp `.tsx` như chữ nằm giữa hai thẻ.
- Dòng «by-hand» của câu hỏi nhập kho nói «nothing in sources/reui answers», ngay dưới ba ứng viên của chính nguồn ấy.
- `find` gắn cho `Filters` các thuộc tính của `FiltersRow`.
- Bấm «Xoá bộ lọc» ở trạng thái không có kết quả làm mất tiêu điểm; lỗi này có từ trước lượt thử.
- Một bài kiểm của khung ứng dụng chập chờn.
- Lời khuyên «khai miễn cấu hình lint cho cả thư mục» của kỹ năng `conform` không làm được, vì phép kiểm của sàn đỏ khi
  luật sàn khác nhau giữa các thư mục.
