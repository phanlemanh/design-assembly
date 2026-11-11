---
type: decision
title: Output là plugin dẫn dắt, từ vựng lấy từ chuẩn của ngành
links: [wiki/specs/0001-design-system-for-claude-code.md]
sources: [plugins/design-assembly/references/vocabulary.json, tests/plugin-vocabulary.test.ts]
---

# 0004 Output là plugin dẫn dắt, từ vựng lấy từ chuẩn của ngành

## Status

Accepted. Chủ kho nêu ý định và đồng ý định nghĩa output ngày 2026-11-11, rồi thêm luật từ vựng
cùng ngày.

## Context

Hai bản nháp đầu của đề bài tả sản phẩm là một design system cụ thể, và coi plugin là cái hộp chở
nó. Chủ kho nói rõ ý định khác: tạo một plugin dẫn người dùng dựng được một design system tối ưu
cho Claude Code. Chủ kho cũng muốn mỗi bước đi qua đều quen với bất cứ designer chuyên nghiệp nào.

## Decision

1. **Output là cuộc dẫn dắt.** Người dùng gõ một lệnh trong kho của họ; plugin dẫn qua các tầng
   quyết định; khi xong, kho đó có một design system mà Claude Code dựng màn được mà không phải
   đoán, kèm một điểm đo. Design system là kết quả ở kho người dùng, không phải sản phẩm của kho
   này.
2. **Từ vựng lấy trọn từ chuẩn của ngành.** Một bảng duy nhất ở
   `plugins/design-assembly/references/vocabulary.json`. Mỗi từ có nguồn và mức đã kiểm nguồn. Từ tự
   đặt được phép, nhưng phải ghi là tự đặt. Thuật ngữ giữ tiếng Anh trong mọi ngôn ngữ trò chuyện.

Đã loại: tự đặt tên Việt cho các tầng và các phần (hạt giống, khuôn màn, bộ rào). Lý do: designer
phải học lại từ, và tên tự đặt không tra được ở đâu.

## Consequences

- Bảng khởi đầu có 56 từ. 23 từ lấy lại từ bảng chủ kho đã rà ngày 2026-11-09, giữ nguyên mức tin
  đã ghi ở đó. 3 từ là tự đặt: verification kit, certainty ladder, determinism rate.
- 8 từ đang ở mức `unchecked`: máy nhớ tên chuẩn nhưng chưa đọc lại nguồn. Đề bài đòi con số này về
  0 trước lát đầu.
- Bài kiểm chặn từ không có nguồn, và chặn chữ trong plugin dùng một từ mà bảng bảo tránh.
- Các từ máy đã dùng trong lúc trao đổi (hạt giống, khuôn màn, bãi thử, trang danh mục) không được
  xuất hiện trong plugin. Trong wiki tiếng Việt, từ nay dùng thuật ngữ chuẩn.
- Chưa có tên chuẩn cho việc dữ liệu quyết định cách hiển thị. Đề bài ghi là câu hỏi mở.
- Cập nhật cùng ngày, sau khi tra nguồn: 8 từ `unchecked` đều có ở nguồn và đã chuyển sang mức
  `source`. «Seed color» đổi thành «source color», vì Material Design 3 chỉ dùng từ đó; «seed» là
  từ của Flutter. Bảng nay có 64 từ: 22 đọc tại nguồn, 3 chỉ đọc tóm tắt, 36 thông lệ, 3 tự đặt.
