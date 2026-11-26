# Tệp `.fig` thật của chủ repo làm mẫu cho lát 13.1

Một lượt chỉ đọc, ngày 2026-11-26, plugin 0.76.0 (`main` ở `0fc6096`). Lượt này đọc tệp hệ thiết kế của chính chủ repo một
lần, để lát 13.1 (spec [0018](../../wiki/specs/0018-figma-at-the-foundations-socket.md), tiêu chí 1 đến 7) biết dữ liệu
thật khác mẫu thử của cầu `bring-in` ở đâu. **Trang này không phải lượt đo bốn thước** của 13.4, và không dựng gì: không
mã nào của plugin đổi.

## Chạy trên gì

- **Lời chủ repo.** Phiên điều phối hỏi «Anh cho đọc thử tệp `.fig` làm mẫu thật cho lát 13.1, kèm đường dẫn tệp («Đọc
  thử cho 13.1»), hay đo bốn thước ngay («Đo bốn thước ngay»)?». Chủ repo đáp «Đọc thử cho 13.1». Lời ấy cho chạy công cụ
  đọc đã build sẵn trên một bản chép của tệp, và chạy cầu trên một bản sao bỏ đi của repo. Nó không cho tải, build lại,
  đo hay commit gì.
- **Tệp.** Tệp hệ thiết kế OneHub của chủ repo, 219 256 009 byte (khoảng 219 MB), lấy từ thư mục Tải về của máy. Tệp được
  chép vào thư mục nháp, mọi lệnh chạy trên bản chép; tệp gốc không đổi (cùng `sha256` trước và sau). Tệp và bản xuất
  biến là dữ liệu riêng của chủ repo: chúng không vào repo, trang này chỉ ghi số đếm, hình dạng và vài tên.
- **Công cụ đọc.** Chương trình `export_variables` mà lượt thử trước
  ([`figma-variables-hands-on.md`](figma-variables-hands-on.md), mục «Lối thứ ba») đã build từ crate `designos-fig` của
  design-os-studio (`a26f09a`, giấy phép PolyForm Shield 1.0.0). Nó gọi `import_fig` rồi `export_variables_json`, và ghi
  thân phản hồi `GET /v1/files/:key/variables/local`. Lượt này dùng lại đúng tệp nhị phân ấy, không build lại.
- **Không mạng.** Không lượt gọi Figma nào, không tải gì.

Lệnh, chạy trong thư mục nháp:

```text
export_variables <bản chép>.fig onehub-variables.json
```

| Đo                  | Kết quả                                   |
| ------------------- | ----------------------------------------- |
| Thoát               | 0                                         |
| Thời gian           | 33,1 giây thực (21,0 giây người dùng)     |
| Dòng báo của nó     | «variables: 1713, collections: 43»        |
| Cỡ bản xuất         | 1 516 734 byte                            |
| Khoá ở gốc bản xuất | `error`, `meta`, `status`: đúng hình REST |

## Hình dạng bản xuất

Đếm trên bản xuất, không giá trị nào chép ra ngoài thư mục nháp.

### Collection và mode

- **43 collection.** 11 là của tệp. 32 là bản sao của thư viện ngoài, và cả 32 đều vừa `remote` vừa `hiddenFromPublishing`.
  Không collection nào của tệp bị ẩn.
- **Tên collection lặp:** 13 tên dùng cho hơn một collection («Theme» và «Primitives» mỗi tên bốn lần, 11 tên khác hai
  lần). Trong 11 collection của tệp thì không tên nào lặp: tên chỉ lặp vì bản sao của thư viện.
- **Mode của 11 collection của tệp:**

| Collection   | Số mode | Mode (mặc định đầu)                                             |
| ------------ | ------- | --------------------------------------------------------------- |
| Theme        | 2       | Light, Dark                                                     |
| Themes       | 3       | Agent Light, Agent Dark, Customer Light                         |
| Breakpoint   | 6       | base, sm, md, lg, xl, 2xl                                       |
| Spacing      | 3       | Agent Portal, Customer Portal, Spacing                          |
| AI / Density | 3       | CP Desktop, CP Mobile, AP                                       |
| Portal       | 2       | Agent, Customer                                                 |
| Density      | 4       | Default, Compact, Comfortable, Spacious                         |
| Input        | 2       | Pointer, Touch                                                  |
| Icon tone    | 10      | Default, Brand, Subtle, Inverse, Destructive, Info, … (10 mode) |
| Primitives   | 1       | Value                                                           |
| Dimension    | 1       | Value                                                           |

Chín collection có từ hai mode, tức chín trục. Chỉ «Theme» là trục sáng/tối thuần. «Themes» gộp hai trục trong một: cổng
(Agent, Customer) và sáng/tối, nên hai mode của nó có chữ «Light».

### Biến và giá trị

| Đếm                              | Cả tệp | Collection của tệp | Bản sao thư viện |
| -------------------------------- | ------ | ------------------ | ---------------- |
| Biến                             | 1 713  | 908                | 805              |
| Màu (`COLOR`)                    | 792    | 440                | 352              |
| Số (`FLOAT`)                     | 796    | 455                | 341              |
| Chuỗi (`STRING`)                 | 76     | 12                 | 64               |
| Đúng/sai (`BOOLEAN`)             | 49     | 1                  | 48               |
| Giá trị (biến × mode có giá trị) | 3 254  | 1 715              | 1 539            |

- **Alias: 1 971** trên 3 254 giá trị. 1 800 alias trỏ sang collection khác; 716 trỏ vào bản sao thư viện; 649 trỏ tới
  một biến mà chính nó cũng là alias (chuỗi alias). Alias trỏ ra ngoài tệp: 0.
- **Alias từ collection không có mode sáng/tối sang collection có:** 40 giá trị, tất cả từ «Icon tone» (10 mode) sang
  «Theme» (Light, Dark): 10 ở collection của tệp, 30 ở hai bản sao.
- **Biến không có giá trị nào:** 51 (36 ở collection của tệp), tất cả là màu, gần hết thuộc các nhóm màu trong suốt
  (`color/black-alpha/…` 19, `color/blue-alpha/…` 16, `color/white-alpha/…` 13). `valuesByMode` của chúng rỗng. Thêm 68 biến
  thiếu giá trị ở một mode mà collection có (11 ở collection của tệp), như `color/tone/info/tint` chỉ có Light.
- **Giá trị dưới id mode collection không khai:** 108, tất cả ở một bản sao «Layout».
- **Tên trùng trong cùng một collection:** 110 biến (4 ở collection của tệp: 1 ở «Theme», 3 ở «Primitives»).
- **Biến bị ẩn khỏi publish trong collection không ẩn:** 398, ở collection của tệp. Spec 0018 chỉ nói collection ẩn.
- 1 301 biến có `codeSyntax`; mọi biến có `scopes`. Cầu không đọc hai trường ấy.

### Tên trùng giữa các collection

- **485 tên** biến có ở hai collection trở lên (479 tên ở hai, 6 tên ở ba). 430 tên có ở một collection của tệp và ở bản
  sao thư viện; 55 tên chỉ ở các bản sao. **Không tên nào có ở hai collection của tệp.**
- Ví dụ: `color/primary` (Theme và một bản sao «Theme»), `color/accent` (Theme, hai bản sao), `Spacing/Gap/gap-2`,
  `Borders/rounded-lg`.

### Tên có thể làm màu gốc

Biến màu có đoạn tên `primary`, `brand` hay `accent`: 69.

| Tên       | Số collection (của tệp + bản sao) | Collection của tệp        |
| --------- | --------------------------------- | ------------------------- |
| `primary` | 8                                 | Theme, Primitives, Themes |
| `accent`  | 6                                 | Theme, Themes             |
| `brand`   | 3                                 | Theme, Primitives         |

Tên đúng `color/primary` chỉ có ở «Theme» của tệp và ở một bản sao «Theme». Cả hai, ở cả Light lẫn Dark, đều là alias tới
`color/bright-blue/600` của «Primitives».

## Cầu đọc được gì

Bản sao bỏ đi của repo, dựng bằng `git archive HEAD` rồi `git init` riêng trong thư mục nháp. Lệnh là
`bring-in.mjs --from <bản xuất> --target <bản sao> --dry-run`, một lần để cầu tự đoán loại, một lần `--kind variables`.

- **Loại tự đoán đúng** là `variables`; hai lần ra giống hệt nhau, thoát 1 (có câu hỏi chờ).
- **Đọc 3 060 trên 3 254** giá trị; 1 840 trong số đó phải đi theo alias tới giá trị cuối. **194 không đọc**, mỗi giá trị
  một dòng `not read`:
  - 144 «names no token»: alias không tới được giá trị;
  - 50 «not text, a length or a colour»: giá trị đúng/sai (48 ở bản sao, 2 ở collection của tệp).
- **Lần theo 144 alias hỏng** (theo cách tiêu chí 1 đòi: mode cùng tên ở đích, không thì mode mặc định):
  - 98 dừng ở chỗ bản xuất **không có giá trị**: 91 tới một biến rỗng, 7 tới một biến thiếu mode ấy. Đây không phải lỗ
    của cầu; sửa cầu cũng không lấy lại được chúng.
  - 40 là **lỗ của tiêu chí 1**: «Icon tone» trỏ sang «Theme», cầu khoá «Theme» là `tên@light`, `tên@dark` và không có
    khoá không mode.
  - 6 là **alias bị bắt nhầm**: một alias trỏ vào «Primitives» (một mode, khoá không mode) được tra `tên@light` trước, và
    gặp biến cùng tên của «Theme». Ba trong số đó kiểm tay: `color/accent-default` của một bản sao «Color / Themes» trỏ tới
    `color/accent` của «Primitives», nhưng cầu lấy `color/accent@light` của «Theme», biến này lại hỏng.
- **Ghi đè không báo:** 990 khoá token được ghi hai lần trở lên (2 131 mục); ở 679 khoá các bản ghi có giá trị khác nhau.
  Theo nguồn:
  - 836 khoá: collection của tệp gặp bản sao thư viện của nó;
  - 57 khoá: hai bản sao thư viện;
  - 97 khoá: **trong cùng một collection**, hai mode thành một khoá. «Themes» có Agent Light và Customer Light, cả hai thành
    `@light`; cộng các tên trùng trong một collection và các id mode không khai;
  - 0 khoá: hai collection của tệp.

### Ứng viên

| Khoá      | Giá trị                   | Lấy từ                                                                                         |
| --------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| màu gốc   | `#0246ff`, tối `#0246ff`  | `color.primary`; trùng màu chủ repo đã chốt                                                    |
| thang chữ | `modular`, `major-second` | 40 token cỡ chữ, 11 cỡ từ 12 tới 48; có 28, 32, 40 ngoài thang chuẩn; tỉ lệ 1,143 lấy về 1,125 |
| bo góc    | `small` (8px)             | `radius.default` = 8, ở collection của tệp                                                     |
| font      | `Inter`                   | cả chữ lẫn tiêu đề; repo đặt `Geist Variable`, cầu chỉ nêu tên, không hỏi                      |

- **Màu gốc đúng, không phải tình cờ.** Hai bản `color/primary` trỏ tới cùng một tên biến và ra cùng một giá trị, nên
  thứ tự đọc không đổi kết quả.
- **Bản sao thư viện có đổi ứng viên.** Chạy lại trên một bản xuất chỉ giữ 11 collection của tệp (908 biến): màu, thang,
  bo góc và font không đổi, nhưng tỉ lệ thang chữ khớp `major-second` mà không phải lấy xấp xỉ, và chỉ còn 91 dòng
  `not read`. 15 trong 40 token cỡ chữ chỉ có ở bản sao.
- **Câu hỏi:** hai. Thang chữ `modular` gặp `standard` đã chốt, bo góc `small` gặp `floor` (10px) đã chốt. Cả hai là khác
  biệt thật. Font khác sổ không thành câu hỏi: spec 0018 (câu hỏi mở 5) đã nhận việc ấy vào 13.1.
- **Từ chối:** không. Cầu không từ chối bản xuất nào trong lượt này.

### Chạy thật trong bản sao

- `bring-in.mjs --kind variables` thoát 1 và ghi đúng hai tệp vào `design/waiting/`: một cho thang chữ, một cho bo góc.
- Cổng `make design-assembly` (mượn `node_modules` của worktree bằng một liên kết) xanh trước và sau, cùng một dòng «43
  decisions held by 86 checks, each seen failing on a changed copy». Cổng không nói gì về ứng viên.
- `status` liệt kê đúng hai câu chờ chủ repo, khuyến nghị giữ `floor` và `standard`.

## Bảy tiêu chí của lát 13.1, trên tệp thật hôm nay

| #   | Tiêu chí                                   | Hôm nay   | Số trên tệp này                                                                                             |
| --- | ------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Alias sang collection có mode sáng/tối     | chưa đạt  | 40 giá trị mất (10 của tệp, 30 ở bản sao); thêm 6 alias bị bắt nhầm sang biến cùng tên                      |
| 2   | Tên trùng giữa collection giữ cả hai       | chưa đạt  | 990 khoá ghi đè, 679 khác giá trị; 0 giữa hai collection của tệp, 97 trong cùng một collection              |
| 3   | Màu gốc ở hai collection khác giá trị      | không gặp | `color/primary` ở 2 collection, cùng giá trị; pick đúng. Tên collection lặp (Theme ×4) nếu không bỏ bản sao |
| 4   | Bỏ bản sao `remote` / ẩn, in một dòng đếm  | chưa đạt  | 32 collection, 805 biến, 1 539 giá trị vào ứng viên, không dòng nào; đổi cách đọc tỉ lệ thang chữ           |
| 5   | Đúng/sai đếm trong một dòng                | chưa đạt  | 50 giá trị, 50 dòng `not read`                                                                              |
| 6   | In tên trục mode không mang và mode đã lấy | chưa đạt  | 8 trục của tệp ngoài sáng/tối, không dòng nào; «Themes» trộn cổng với sáng/tối                              |
| 7   | Mẫu cùng hình: không còn giá trị bị bỏ     | chưa đạt  | 46 giá trị mất vì lỗ của cầu; 98 khác mất vì bản xuất không có giá trị, tiêu chí không nói về chúng         |

## Hình dạng bài kiểm của cầu chưa phủ

Mẫu `VARIABLES` trong `plugins/design-assembly/tests/test-bring-in.mjs` có một collection, hai mode Light/Dark, ba biến,
một alias cùng collection. Tệp thật có thêm:

1. Nhiều collection, alias chéo collection, chuỗi alias nhiều bước.
2. Alias từ collection nhiều mode không sáng/tối (10 mode) sang collection sáng/tối.
3. Alias vào collection một mode, khi collection sáng/tối có biến cùng tên (bắt nhầm).
4. Collection `remote` và `hiddenFromPublishing`, trùng tên collection và tên biến của tệp, cùng hoặc khác giá trị.
5. Hai mode trong một collection cùng có chữ «Light» (trục cổng × sáng/tối).
6. Biến đúng/sai, biến chuỗi.
7. Biến không có giá trị nào (`valuesByMode` rỗng) và biến thiếu một mode.
8. Giá trị dưới id mode mà collection không khai.
9. Hai biến cùng tên trong một collection.
10. Biến ẩn khỏi publish trong collection không ẩn.
11. Màu có alpha nhỏ hơn 1 (30 giá trị đọc được): cầu đọc thành hex sáu chữ số, bỏ alpha.

## Đề xuất mẫu thử cho 13.1

Mẫu tự dựng, tên và giá trị bịa, chỉ giữ hình dạng. Không ghi vào `plugins/` trong lượt này.

```text
c-prim   «Base»        1 mode  Value
  ink/500 (màu), ink/alpha/10 (màu, valuesByMode rỗng), space/4 (số), accent (màu)
c-theme  «Look»        2 mode  Light*, Dark
  color/primary   → alias ink/500 (Light), alias c-prim:ink/500 (Dark)
  color/accent    → alias ink/alpha/10            (chuỗi tới biến rỗng)
  color/tint      chỉ có giá trị ở Light          (thiếu mode)
  show/icon       BOOLEAN
c-tone   «Tone»        3 mode  Plain*, Strong, Quiet
  icon/fg         → alias c-theme:color/primary   (tiêu chí 1)
c-brand  «Looks»       3 mode  North Light*, North Dark, South Light
  color/accent-default → alias c-prim:accent      (bắt nhầm, ô 3)
c-axis   «Size»        4 mode  Base*, Small, Large, Huge
  control/height  số                               (tiêu chí 6)
c-lib    «Look»        2 mode  Light*, Dark   remote + hiddenFromPublishing
  color/primary   giá trị khác c-theme            (tiêu chí 2, 3, 4)
  font/size/md    số chỉ có ở bản sao             (bản sao đổi ứng viên)
c-theme có thêm: một biến hiddenFromPublishing, hai biến cùng tên «color/dup»,
một giá trị dưới id mode «x:9» không khai.
```

Mỗi tiêu chí kèm phép kiểm làm hỏng, như spec đã nói: đổi thứ tự `c-theme` và `c-lib` thì ứng viên không đổi; cho
`c-lib` ra khỏi `remote` thì cầu từ chối và nêu hai collection cùng tên «Look» bằng id, không chỉ bằng tên.

## Cho lát 13.1, ngoài bảy tiêu chí

- **Tiêu chí 3 cần một cách gọi collection không chỉ bằng tên.** Trên tệp này tên collection lặp tới bốn lần, dù chỉ vì
  bản sao. Nếu bản sao bị bỏ trước (tiêu chí 4) thì tên của tệp là duy nhất; thứ tự ấy nên thành luật.
- **Hai mode cùng là «Light» trong một collection** (Themes) không có trong bảy tiêu chí. Hôm nay mode sau đè mode trước
  không báo. Cách đọc tên mode bằng chữ `light`/`dark` không đủ cho trục gộp.
- **Biến rỗng và mode thiếu** làm mất 98 giá trị, nhiều hơn cả ba lỗ của cầu cộng lại. Chưa biết lỗi ở công cụ đọc hay ở
  tệp. Cầu nên đếm chúng trong một dòng riêng, tách khỏi «names no token», để người đọc biết không phải lỗi của cầu.
- **Alpha.** Spec không nói; cầu bỏ alpha lặng lẽ. Ổ nền có thể không cần alpha cho màu gốc, nhưng nên nói ra.

## Không kiểm

- **Độ trung thực của công cụ đọc** trên tệp này: không có bản xuất của chính Figma để so, như lượt AG Grid đã có. 51 biến
  rỗng (gần hết là màu trong suốt) và 68 biến thiếu mode có thể là lỗi giải mã, hoặc là tệp thật như thế: chưa phân biệt.
- Tiêu chí 1 đến 7 chỉ được xét trên dữ liệu; không phép kiểm nào của 13.1 được viết hay chạy.
- Bảng mẫu (`specimen.mjs --section direction`) không vẽ ứng viên.
- Chỉ đọc biến. Kiểu chữ, hiệu ứng, linh kiện trong tệp không đọc.
- Đọc `.fig` bằng giải mã ngược có hợp điều khoản của Figma không, và giấy phép PolyForm Shield cho phép dùng thế nào: vẫn
  chưa kiểm, như lượt trước.
- Tệp `.fig` khác trong cùng thư mục không được đọc: lời chủ repo chỉ cho một tệp.
