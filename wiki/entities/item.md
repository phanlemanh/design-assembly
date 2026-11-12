---
type: entity
title: Item
links:
  - ontology/entities/Item.yaml
sources:
  - src/example/data.ts
  - design/column-types.json
---

# Item

## Definition

Bản ghi mẫu mà màn mẫu liệt kê: một dòng có tên, trạng thái, ngày và tổng tiền. Nó đứng thay một
bản ghi nghiệp vụ thật, để màn mẫu và tầng bảng dữ liệu có dữ liệu mà chạy. Nó không phải một khái
niệm nghiệp vụ của sản phẩm nào.

## Rules

Không có luật nghiệp vụ. Mỗi trường khai kiểu cột của nó bằng khoá `display` trong
`ontology/entities/Item.yaml`; kiểu cột quyết định canh lề và bề rộng tối thiểu của cột.

## Where in the code

- Kho dữ liệu mẫu: `src/example/data.ts`. Kiểu ở đó do sàn viết tay và giữ ngày ở dạng `Date`.
- Màn hiển thị: `src/example/ReferenceScreen.tsx`.
- Kiểu cột của từng trường, sinh từ mô hình: `design/columns.json`.

## History

- 2026-11-12 — Thêm vào mô hình để tầng bảng dữ liệu của plugin có trường mà gắn kiểu cột.
