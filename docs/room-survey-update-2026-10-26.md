# Đồng bộ kiến trúc và bổ sung nội thất hiện trạng

Đã cập nhật và xuất bản ngày 26/10/2026 trên cả web wayfinding độc lập và web TCH chính.

Xác nhận mới nhất của người dùng: E303 dùng đường thử robot, E304 dùng dãy máy tính và thiết bị tự động hóa. Chỉ đổi liên kết ảnh và nội thất; mã phòng, đường bao và cửa vật lý giữ nguyên. Các thư mục ảnh gốc không đổi tên hoặc di chuyển.

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
| E303 | Thảm đường thử, dãy robot xe bánh, bàn điều khiển, bảng và rèm | 12 |
| E304 | Hai dãy bàn máy, thiết bị tự động hóa, tủ kính và bàn giảng viên | 14 |

Hai phòng E402–E403 và E602–E603 tiếp tục dùng chung 13 ảnh nội thất theo xác nhận người dùng. Tổng cộng 66 ảnh duy nhất trong thư viện hiện trạng của bảy mục phòng. IMG_1401 được người dùng xác nhận xếp nhầm vào E302; đã loại khỏi phần hiển thị, bộ tạo ảnh web và nguồn dựng, không thay đổi ảnh gốc.

E303 liên kết ảnh IMG_5040-5051 trong `survey-e304`; E304 liên kết ảnh IMG_5053-5066 trong `survey-e303`. Tên các thư mục này ghi nhận cách nhập ảnh ban đầu, không phải tên phòng đang hiển thị.

Các số đo, số chỗ và chi tiết thiết bị là ước lượng từ ảnh trên mặt bằng giản lược. Không coi mô hình là bảng kiểm kê thiết bị hay bản đo hoàn công. Tên phòng dùng danh mục đã được người dùng xác nhận trong `components/room-catalogue.ts`; bản chuẩn chung ở `D:\TCH\outputs\lab_signs\lab_names_current.json`. Giữ đúng cách viết `and`, `&`, `Laboratory` và các tên riêng của từng mục, gồm `Cyber Security Lab` cho E602-E603.

## Kiểm tra

- TypeScript toàn dự án và build tĩnh đạt.
- `node scripts/verify-room-tours.mjs`: 26 phòng × hai trạng thái nội thất, 8 hành lang, 103 vị trí tiếp cận thiết bị; lối vào/cửa, va chạm và đường đi đạt.
- Cùng bài kiểm tra xác nhận bốn góc xoay đều mờ đúng hai mặt tường; camera đứng yên không thay đổi opacity, cánh cửa hay cờ vật liệu; các ngưỡng góc cũ không gây bật/tắt đột ngột.
- `node scripts/verify-computer-lab.mjs`: cả hai phòng máy đạt.
- `node scripts/verify-furniture-orientation.mjs`: hình học 26 phòng, 387 ghế và 146 màn hình đạt; bốn trường hợp cố ý quay ngược bị phát hiện. E303 có ba ghế/một màn hình, E304 có 13 ghế/14 màn hình.

Build vẫn có thông báo bundle JS lớn của ứng dụng Three.js; không có lỗi biên dịch.
