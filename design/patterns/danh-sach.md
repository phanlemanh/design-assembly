---
nhom: danh-sach
doi_tuong: Màn cho thấy nhiều mục cùng loại trong một bảng, để người dùng tìm một mục rồi làm việc với nó.
khuon:
  ten: TypedTable
  nhap: "@/components/ui/typed-table"
nhan_dien:
  - "src/example/**/*.tsx"
mau_dang_chay:
  tep: src/example/ReferenceScreen.tsx
khe_bat_buoc: [columns]
cam_ngoai_khuon: [Table]
ngoai_le: []
nhan_viec: Tìm một mục trong danh sách, rồi thêm mục mới hoặc xoá mục không còn dùng
---

Kiểu màn danh sách. Phần đầu trang do bộ đọc của kit nghiệm thu và lệnh kiểm của kho cùng đọc
(`make design-assembly`); phần dưới là lời cho người và tác tử dựng màn. Nội dung trang này do máy
đề xuất ngày 2026-11-12, chủ kho chưa xác nhận.

## Việc chính

Người dùng tới màn này để tìm một mục. Mọi thứ khác (thêm, xoá) là việc làm với mục đã tìm thấy,
nên không được che hay đẩy danh sách xuống dưới.

## Thứ tự thông tin

Từ trên xuống, và cũng là thứ tự bàn phím đi qua:

1. Tiêu đề màn: một tiêu đề cấp một, nói đây là danh sách gì.
2. Ô lọc: chỉ hiện khi danh sách có mục. Đang tải, trống hay lỗi thì không có gì để lọc.
3. Vùng nội dung: bảng dữ liệu, hoặc đúng một trạng thái thay cho bảng (đang tải, trống, lỗi,
   không tìm thấy). Trạng thái hiện ở chỗ của bảng, không hiện thêm bên cạnh nó.
4. Trong bảng: cột nhận ra mục đứng đầu (tên), rồi các cột dữ liệu, cột thao tác đứng cuối.
5. Hộp thoại xác nhận và toast nằm ngoài dòng chảy của trang: chúng không đẩy nội dung.

Cạnh tiêu đề là chỗ của việc chính của màn, khi màn có. Liên kết sang màn khác không đặt ở đó:
đi lại giữa các màn là việc của khung ứng dụng (`design/behaviors.md`, «Đi lại giữa các màn»).

## Thao tác trên một dòng

Một dòng thay đổi thì danh sách đổi tại chỗ, không tải lại cả danh sách. Dòng ở yên với nút bị
khoá tới khi có trả lời; thành công thì dòng rời đi và tiêu điểm sang cùng nút ở dòng kế; thất
bại thì dòng còn nguyên và toast báo. Dòng cuối cùng rời đi thì tiêu điểm vào nút của trạng thái
trống. Chi tiết ở `design/behaviors.md`, «Sau một thao tác».

## Trạng thái trống

Nói vì sao trống và mục tới đây bằng cách nào. Màn thêm được mục thì có nút thêm mục đầu tiên.
Màn không thêm được gì (chỉ nhận mục từ nơi khác) thì không có nút.

## Lời văn

Mọi chữ lấy từ một chỗ (`src/lib/labels.ts`). Tiêu đề là danh từ gọi tên danh sách. Nút mang động
từ của việc nó làm. Trạng thái trống mời làm việc đầu tiên; trạng thái lỗi nói việc gì hỏng rồi
nói làm gì tiếp (`design/behaviors.md`).

## Màn mẫu

`src/example/ReferenceScreen.tsx`, ở đường dẫn `/`. Màn danh sách mới dựng giống nó: cùng các
phần, cùng thứ tự, cùng cách hiện từng trạng thái.

## Dùng khi

Màn có một danh sách nhiều mục cùng loại mà người dùng cần xem, lọc và làm việc với từng mục.

## Không dùng

Hồ sơ của một mục, biểu mẫu nhiều bước, trang tổng quan nhiều khối: chưa có kiểu màn cho chúng.
Cần một kiểu mới thì viết trang của nó trước, đó là quyết định của người.

## Ví dụ sai

```tsx
<Table aria-label={LABELS.tableName}>
  <TableRow className="h-9">
    <TableCell className="w-40 text-right">{item.total}</TableCell>
  </TableRow>
</Table>
```

Dựng thẳng bảng thường và tự đặt canh lề, bề rộng, chiều cao dòng: mất cách kiểu cột quyết định
ba thứ đó, nên màn lệch khỏi các màn danh sách khác ngay từ đầu.
