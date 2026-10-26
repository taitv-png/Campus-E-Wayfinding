# Đồng bộ kiến trúc và bổ sung nội thất hiện trạng

Đã cập nhật bản wayfinding độc lập ngày 26/10/2026; chưa push/deploy online và chưa sửa web TCH chính.

## Hiệu ứng cửa và tường

`components/room-architecture.ts` dùng chung cho mọi scene trong phòng, gồm E104, E102, E401, hai phòng máy và năm phòng mới. Khung nhôm tối, kính và các dải mờ dùng cùng cấu tạo; số lượng và vị trí ô mở theo từng phòng.

Trước đây phòng máy đổi độ trong suốt/depth-write đột ngột khi camera vượt ranh giới phòng, còn các phòng cũ dùng quy tắc khác. Kính dạng hộp với nhiều bề mặt chồng nhau làm thứ tự vẽ dễ nhấp nháy. Bản mới dùng kính một mặt phẳng hai phía, dải mờ tách khỏi kính, cánh cửa mở cố định và các cờ vật liệu giữ nguyên. Chỉ độ mờ được nội suy theo góc camera: hai cạnh gần camera mờ, hai cạnh đối diện giữ rõ. Vòng vẽ tiếp tục đến khi độ mờ ổn định; OrbitControls được cập nhật đều trong lúc xoay.

Bảng gắn tường và rèm đi theo độ mờ của đúng mặt tường, với thứ tự vẽ ổn định để không bị tường che. Chế độ mặt bằng giữ chân tường thấp, nhìn rõ cửa và bố trí; camera tự căn theo kích thước phòng và màn hình. Phòng E102 chừa khoảng trống của cả cửa phụ khi dựng vách lưới.

## Các phòng mới

| Phòng | Nội thất và thiết bị tái dựng | Ảnh đúng phòng |
|---|---|---:|
| E201 | Bàn họp, bàn nhóm chữ U, ghế ba màu, máy tính, giá tài liệu, cột và rèm lá | 6 |
| E202 | Bàn trắng có vách xanh nhạt, hai khu bàn họp, tủ và bảng/trình chiếu | 17 |
| E302 | Sân thử có lưới, drone/robot, bàn điều khiển và ghế chờ | 4 |
| E303 | Hai dãy bàn máy, thiết bị tự động hóa, tủ kính và bàn giảng viên | 14 |
| E304 | Thảm đường thử, dãy robot xe bánh, bàn điều khiển, bảng và rèm | 12 |

Hai phòng E402–E403 và E602–E603 tiếp tục dùng chung 13 ảnh nội thất theo xác nhận người dùng. Tổng cộng 66 ảnh duy nhất trong thư viện hiện trạng của bảy mục phòng. IMG_1401 được người dùng xác nhận xếp nhầm vào E302; đã loại khỏi phần hiển thị, bộ tạo ảnh web và nguồn dựng, không thay đổi ảnh gốc.

Các số đo, số chỗ và chi tiết thiết bị là ước lượng từ ảnh trên mặt bằng giản lược. Không coi mô hình là bảng kiểm kê thiết bị hay bản đo hoàn công. Tên/công năng phòng hiện có trong danh mục được giữ theo ứng dụng.

## Kiểm tra

- TypeScript toàn dự án, lint các file mới và build tĩnh đạt.
- `node scripts/verify-room-tours.mjs`: 26 phòng × hai trạng thái nội thất, 8 hành lang, 103 vị trí tiếp cận thiết bị; lối vào/cửa, va chạm và đường đi đạt.
- Cùng bài kiểm tra xác nhận bốn góc xoay đều mờ đúng hai mặt tường; camera đứng yên không thay đổi opacity, cánh cửa hay cờ vật liệu; các ngưỡng góc cũ không gây bật/tắt đột ngột.
- `node scripts/verify-computer-lab.mjs`: cả hai phòng máy đạt.
- Đã xem trực tiếp năm phòng mới và ba phòng cũ trong Chrome, xoay phòng máy, kiểm tra bảng/rèm và lưu ảnh tại `D:\TCH\outputs\room-survey-2026-10-26\phase2-previews`.

Build vẫn có thông báo bundle JS lớn của ứng dụng Three.js; không có lỗi biên dịch. Máy chủ xem thử: `http://127.0.0.1:5173/Campus-E-Wayfinding/`.
