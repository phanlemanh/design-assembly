# Chạy lại lần dùng đầu của `filters`, sau mục 11.7 và 11.8 (tiêu chí 26)

Tiêu chí 26 của phần bổ sung đề bài [0015](../../wiki/specs/0015-choose-before-make-conform-before-intake.md), cho dòng
«done when» thứ hai của giai đoạn 11. Quyết định: [0107](../../wiki/decisions/0107-filters-rerun-meets-criterion-14.md).
Lần đầu: [filters-through-conform](filters-through-conform.md).

## Lời cho đo

Chủ repo cho chạy ngày 2026-11-24 («Cho chạy»):

- ước tính khoảng 1 triệu token, trần 1,4 triệu cho cả lượt;
- tác tử lần dùng đầu khoảng 900 nghìn, trần riêng 1,2 triệu;
- phiên chạy lượt thử khoảng 120 nghìn;
- không kể đọc lại bộ đệm.

Chỉ chạy lại lần dùng đầu, chỉ trên bản sao trong thư mục nháp, không gọi mạng, không chạy dòng cài.

## Cách làm

Từ 22:17 tới khoảng 23:05. Làm giống lần đầu để đặt cạnh được.

- **Bản sao ứng dụng mẫu:** kho này ở `ac7fe2a` (plugin 0.57.0), dựng bằng `git archive`. Bỏ phần cấm đọc như lần đầu.
  Mốc đầu: `make check` xanh.
- **Plugin cho tác tử:** bản của `ac7fe2a`, đặt ngoài bản sao.
- **Lấy về:**
  - đúng 25 tệp ReUI, năm linh kiện nền và danh mục có ghim của lần đầu, chép từ bản clone chỉ-đọc của repo kiểm chứng ở
    `1ad8469f` đã có trong thư mục nháp; so từng byte với lần đầu: như nhau;
  - ba gói chép từ bản sao của lần đầu;
  - lúc vừa lấy về: 226 lỗi lint, như lần đầu.
- **Repo kiểm chứng:**
  - chỉ được đọc `HEAD` và `git status`, trước và sau;
  - lúc bắt đầu, `HEAD` của nó là `1ea13196`, đã khác `1ad8469f` vì kho ấy có commit mới; lượt này không đụng tới;
  - sau lượt, `HEAD` và `git status` (sạch) y như lúc bắt đầu.
- **Đề:** đúng đề của lần dùng đầu, chỉ đổi đường dẫn. Màn `/` lọc thêm theo trạng thái và ngày bằng `filters`, qua
  `find`, `intake`, `conform`, `intake --file`.
- **Lời đáp thay chủ repo:** tác tử đáp thay, với tên «Owner stand-in (trial)», kể cả câu hỏi danh sách khai miễn. Các lời
  ấy chỉ có giá trị trong bản sao.
- **Giữ trần:** một vòng kiểm chạy nền mỗi phút cộng token của tác tử, để dừng nó khi vượt 1,15 triệu. Không lúc nào
  chạm tới.

## Tiêu chí 26

Phiên chạy lượt thử đếm trên bản sao, không lấy theo lời tác tử.

| Đo gì                                                                   | Kết quả                                                                                                                                                                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cổng (`make check`, gồm 81 phép kiểm trình duyệt và phần kiểm phần nổi) | **xanh**                                                                                                                                                                                                     |
| Luật tắt ngoài danh sách khai miễn                                      | **0**. Đếm mọi dòng tắt luật, cả dạng `/* eslint <rule>: "off" */` (không có dòng nào như vậy), `@ts-nocheck` và `@ts-ignore`, trong `src` và `tests`. Tệp cấu hình: chỉ `.prettierignore` đổi, có khai miễn |
| Khai miễn luật bắt buộc                                                 | **0**                                                                                                                                                                                                        |
| Tiêu chí 18: phần nổi của món có tên                                    | **đạt**: mở «Thêm bộ lọc» trên màn `/` thì `dialog` tên «Thêm bộ lọc», `listbox` tên «Thuộc tính»                                                                                                            |
| Tiêu chí 19: chữ của món đi qua bảng chữ của repo                       | **đạt**: vùng thông báo đọc «Thuộc tính, 2 mục»; không còn «Top level, 2 items», không còn «Use the Right Arrow key…»                                                                                        |
| Phép kiểm của repo khi phần nổi đang mở (`axe`, không lọc nhãn)         | **0 lỗi**: không còn `aria-dialog-name`, `label-title-only`                                                                                                                                                  |
| Lần kiểm thường của `conform`                                           | «holds», 0 lỗi                                                                                                                                                                                               |

Ba ô của tiêu chí 18, 19 và `axe` được kiểm bằng một trình duyệt không giao diện trên máy chủ dev của bản sao: mở
màn, bấm «Thêm bộ lọc», đọc cây truy cập, chạy `axe` khi phần nổi đang mở.

## Đặt cạnh lần đầu

| Đo gì                                   | Lần đầu (plugin 0.54.0) | Chạy lại (plugin 0.57.0)                |
| --------------------------------------- | ----------------------- | --------------------------------------- |
| Cổng lúc xong                           | xanh                    | xanh                                    |
| Bản vá                                  | 24                      | **30**                                  |
| Điều khai miễn                          | 82, trên 16 luật        | **58, trên 11 luật**                    |
| Khai miễn luật bắt buộc                 | 25                      | **0**                                   |
| Luật tắt ngoài khai miễn                | 0                       | 0                                       |
| Ô nổi không tên                         | còn                     | **không còn**                           |
| «Top level, 2 items»                    | còn                     | **không còn**                           |
| Câu tiếng Anh thứ ba                    | chưa ai thấy            | **không còn**                           |
| Vòng sửa                                | 2                       | 2 (ba lần chạy `make check`)            |
| Câu hỏi đáp thay chủ repo               | 9                       | 8, gồm câu hỏi 58 điều khai miễn        |
| Chỗ tác tử tự quyết, phiên này đếm      | 13                      | **21**: tác tử khai 22, bỏ dòng `Plan:` |
| Thời gian                               | khoảng 21 phút          | **khoảng 33 phút**                      |
| Token đã xử lý, không kể đọc lại bộ đệm | 447 781                 | **552 937** (trần riêng 1,2 triệu)      |
| Token công cụ báo                       | 367 869                 | 432 854                                 |
| Lần gọi công cụ                         | 122                     | 159                                     |

Chi phí chuẩn hoá lần này:

- **30 bản vá**, mỗi bản một lý do:
  - 4 bản định dạng linh kiện nền;
  - 2 bản cho linh kiện nền thiếu (`separator`, `spinner`);
  - 10 bản đưa mã về luật bắt buộc: bỏ lớp mà linh kiện nền sở hữu, đổi giá trị tuỳ ý sang giá trị của thang, đổi kiểu
    viết trong dòng sang biến CSS, đổi nút thô sang `Button` của repo, viết lớp trọn vẹn;
  - khoảng 45 chỗ trong 12 tệp, vá một lỗi báo nhầm của phép kiểm chữ;
  - 4 bản ở vòng hai, cho chữ của `cascader` qua bảng chữ của repo và tên cho ô nổi.
- **58 điều khai miễn** người đứng thay giữ: `@ts-nocheck` 16, `ban-ts-comment` 16, `only-export-components` 9, năm
  luật `react-hooks` 12, `no-unused-vars` 3, `no-explicit-any` 1, `formatter-ignore` 1, `lint-config` 1.

## Cả lượt

| Ai                                        | Token đã xử lý, không kể đọc lại bộ đệm | Trần          |
| ----------------------------------------- | --------------------------------------- | ------------- |
| Tác tử lần dùng đầu                       | 552 937                                 | 1,2 triệu     |
| Phiên chạy lượt thử, tới lúc viết bản ghi | khoảng 60 nghìn, số cuối ở mô tả PR     |               |
| **Cả lượt**                               | **khoảng 615 nghìn**                    | **1,4 triệu** |

Ước tính là 1 triệu; lượt này dưới cả ước tính lẫn trần.

## Điều lượt chạy lại tìm ra

- **`inventory` báo nhầm.** Nó nêu 12 tệp của món đã nhập kho là «unrecorded», vì chỉ tính tệp mà dòng sổ nêu tên,
  không tính tệp mà bản ghi chuẩn hoá giữ. Dòng giới hạn mới `inventory-reads-conformed-files-as-unrecorded`.
- **Khối của kho bị sửa mà cổng vẫn xanh.** Tác tử sửa `src/lib/list.ts`, khối `useList` của bộ khởi đầu, mà không qua
  `change --widen`. Chỉ phát hiện «modified» của `inventory` nói điều ấy. Dòng giới hạn mới
  `store-block-changed-without-widening`.
- **Thư mục của thư viện nền vẫn bị đòi khai miễn.** `conform` đòi điều khai miễn `lint-config` cho cấu hình đặt
  `src/components/ui` ra ngoài lint, dù thư mục ấy là của repo. Dòng giới hạn mới
  `base-library-folder-still-asks-an-exemption`.
- **Các lỗi đã có dòng giới hạn:**
  - phép kiểm chữ đọc tham số kiểu `<T>` như chữ giữa hai thẻ (`words-check-reads-type-parameters`), nên tác tử phải vá
    khoảng 45 chỗ chỉ để qua nó;
  - `find` đọc tệp mới lấy về như linh kiện của repo (`find-reads-taken-down-files-as-own`);
  - các ô nổi mở từ thẻ điều kiện không được kiểm (`item-popups-one-level`).
- **Tác tử tự tạo một khối bọc** `ItemFilters` và nhập kho nó bằng tay, dưới nhu cầu mới `item-filter-bar`. Đó là đường
  đúng mà cổng chọn trước, tạo sau đòi.
