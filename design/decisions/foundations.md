# Foundations

Status: decided (proposed).

## Choice

- source color: `#0246ff`
- type scale: `standard`
- spacing scale: `4px`
- corner radius: `floor`

## Why

Kho này chưa có nhận diện. Máy đề xuất một màu lam để reference implementation có thứ cho người xem phản ứng; chủ kho thay được bất cứ lúc nào. Type scale và corner radius giữ của sàn theo khuyến nghị cho một application: các cỡ quen thuộc với mọi người dùng Tailwind, và bộ linh kiện sàn vốn được vẽ cho chúng.

## Rejected

- Giữ theme trung tính của sàn: Khi đó cuộc dẫn dắt không sinh design token màu nào, và không có gì để chứng minh.
- modular, major-third: Đã thử trên trình duyệt ngày 2026-11-11: text-xs xuống 10px, và nút của bộ linh kiện sàn vẫn giữ cỡ chữ riêng nên thang không đồng nhất.

## What is held

- `source-color`: judgment, a person's call, no check
- `tonal-palette`: formula, checked by this plugin's tool
- `color-contrast`: formula, checked by this plugin's tool
- `type-scale-values`: standard, checked by this plugin's tool
- `spacing-values`: standard, checked by this plugin's tool
- `radius-value`: closed, checked by this plugin's tool
- `design-tokens`: formula, checked by this plugin's tool
