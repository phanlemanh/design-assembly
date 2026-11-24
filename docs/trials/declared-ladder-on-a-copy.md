# Thang do repo khai, trên bản sao repo kiểm chứng

Tiêu chí 10 của đề bài [0015](../../wiki/specs/0015-choose-before-make-conform-before-intake.md): trên bản sao repo
kiểm chứng, thêm một tệp nguồn trỏ vào tệp ghim và danh mục kho ấy đã có, thì `find` trả ứng viên từ danh mục ấy.
Quyết định: [0101](../../wiki/decisions/0101-the-repository-declares-its-ladder.md).

## Cách làm

- Ngày 2026-11-24, plugin của nhánh lát 4 (0.53.0).
- Bản sao: `git clone --no-hardlinks` repo kiểm chứng vào thư mục nháp của phiên, ở commit `1ad8469f`. Repo gốc chỉ được
  đọc; sau lượt thử, `git status` của nó vẫn sạch.
- Không lượt nào tốn token: `find` và `plugs --dry-run` không gọi mô hình, không dùng mạng.
- Kho ấy giữ danh mục ReUI ở `design/reui-catalog.json`: ghim nằm trong tệp ở khoá `pin` (lấy về ngày 2026-11-11, hai tệp
  có mã băm), các món xếp theo 167 nhóm. Bản sao không có thư mục `design/sources/`.
- Việc duy nhất làm trên bản sao: thêm `design/sources/reui.json`, với `id` `reui`, `order` 1, `pin_file` và `catalog` cùng
  trỏ vào `design/reui-catalog.json`, và `ladder_place` `before-starter`, đúng thang «kho, ReUI, tạo tay» kho ấy khai.

## Kết quả

| Hỏi `find`  | Trước khi thêm tệp nguồn                    | Sau khi thêm                                                                  |
| ----------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| `kanban`    | không gì đáp; «no outside source is pinned» | `kanban`, `c-kanban-1`…: từ `sources/reui`, ghim 2026-11-11, có trang của món |
| `gantt`     | không gì đáp                                | `gantt`, `c-gantt-1`…: từ `sources/reui`                                      |
| `app shell` | kho của repo đáp                            | kho của repo vẫn đáp trước, nguồn không được đọc                              |

- Sau khi thêm, `sources/reui` được đọc ngay sau kho của repo, với 1969 món, trước bộ khởi đầu và kho của họ.
- `find` nói tệp nguồn không nêu thư mục bản chụp, nên các tệp ghim không được so mã băm: kho ấy giữ ghim, không giữ
  bản chụp.
- `plugs --dry-run` trên bản sao:
  - trước khi thêm, nói `reui` có trong repo mà không là nguồn đã ghim;
  - sau khi thêm, in «reui is in this repository and pinned as the source reui: it stands on rung 2 of intake at the
    components socket.»;
  - thang được in là «1 the repository's own store; 2 the outside source reui, then the starter kit of this plugin, then
    the family's store; 3 made by hand».

## Điều chưa thấy được

- `intake --dry-run` trên bản sao dừng trước khi hỏi gì, vì công cụ của kho ấy là bản 0.7.1: «bring it up to 0.12.0 or
  later with upgrade first». Đây là việc đã gác lại ở kế hoạch (repo kiểm chứng tụt xa bản plugin). Tiêu chí 10 chỉ đòi
  `find`. Thứ tự của `intake` theo thang khai có bài kiểm trên repo thử (`tests/test-declared-ladder.mjs`).
- Kho ấy chưa có tệp nguồn nào. Thêm tệp ấy vào chính kho ấy là việc của kho ấy, không làm ở đây.
