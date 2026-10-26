# Hiện trạng E402–E403 và E602–E603

Cập nhật 26/10/2026 cho web độc lập `TCH-Wayfinding-Prototype`.
Chưa áp dụng sang `Tech-Convergence-Hub`.

## Nguồn và phạm vi

- 13 ảnh `IMG_5027.HEIC` đến `IMG_5039.HEIC` trong `D:\TCH\Hiện trạng phòng nội thất\Phòng 402-403. 602-603`.
- Người dùng xác nhận hai phòng có cùng nội thất và máy móc. Bộ ảnh được dùng chung, không gán mỗi ảnh cho một tầng khi chưa có chứng cứ.
- Mặt bằng đã raster hóa có sẵn trong `tmp/pdfs/function-6.png`, `function-8.png` dùng để đối chiếu hướng và cửa. Đường bao và tỷ lệ hiện có của app vẫn là mô hình giản lược.
- Ảnh gốc được giữ nguyên. Ảnh JPEG web đã thu nhỏ ở `public/rooms/installed-computer-lab/`; không nạp HEIC khi chạy ứng dụng.

## Hướng dựng và bằng chứng

| Thành phần | Bố trí | Ảnh đối chiếu |
|---|---|---|
| Bảng trắng và màn cuốn | Tường tây, `x = -width/2` | 5035, 5039 |
| Bàn giảng viên trắng, yếm tối, ghế đen | Góc tây nam | 5039 |
| Tường kính | Phía bắc, `z = -depth/2` | 5034, 5035, 5037 |
| Hai cửa trên tường kính | Đầu và cuối dãy kính | 5033, 5035, 5037 |
| Cửa thứ ba | Tường đông nhìn ra phía cầu thang | 5034, 5036 |
| Ba ô cửa sổ đôi | Hai ô giữa hai cửa bắc, một ô sau cửa bắc cuối phòng | 5037 |
| Máy tính | Màn hình đen, lưng và chân bạc; hướng về tây | 5032, 5036, 5039 |
| Bàn và ghế | Gỗ sồi sáng, yếm gỗ, vách ngăn thấp đen; ghế kem/cam/xanh lá, chân thép | 5027–5033 |
| Hai cột | Trong hai lối đi giữa ba cụm bàn | 5035, 5036, 5039 |
| Trần và tường | LED vuông, máy chiếu, máy lạnh, quạt và camera | 5033, 5036, 5039 |

Ba cửa quy về tọa độ mặt bằng app: `[4.2,2.62]` (chính), `[1.3,2.62]` (cửa phòng cũ bị thiếu khi gộp), `[5.38,4.6]` (phía cầu thang). Tọa độ lấy theo mặt bằng giản lược; ảnh xác nhận số cửa và quan hệ giữa các bức tường, không xác nhận số đo chính xác.

## Phần ước lượng

Kích thước phòng hiện có khoảng 12,93 × 11,13 m theo hệ số app, cao dựng khoảng 3 m. Đây không phải số đo khảo sát. Bố trí thử gồm 5 hàng, mỗi hàng 3 cụm 5 + 3 + 2 chỗ từ phía kính sang tường đặc. Số hàng, số máy, kích thước bàn, khoảng cách lối đi, kích thước cửa và vị trí cột được ước lượng từ ảnh bị che khuất; cần cập nhật khi có ảnh bổ sung hoặc đo thực tế. Không coi số máy dựng là bảng kiểm kê. Nội dung bật màn hình/máy chiếu là hiệu ứng minh họa.

## Mã nguồn và kiểm tra

- `components/computer-lab-scene.ts`: scene Three.js dùng chung, hình học thủ tục, vật liệu và vật cản.
- `components/CampusEMap.tsx`: chọn scene cho đúng hai mã phòng, ba cửa dùng chung với sa bàn/hành lang, thư viện ảnh hiện trạng.
- `scripts/verify-computer-lab.mjs`: kiểm tra cửa, vật cản, lối đi và tương tác cho cả hai phòng ở trạng thái có/ẩn nội thất.
- `scripts/prepare-survey-photos.py`: tạo ảnh web từ JPEG giải mã HEIC.

Chạy từ thư mục dự án:

```powershell
node scripts/verify-computer-lab.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build --config vite.pages.config.ts
```

Thư mục xuất tĩnh: `pages-dist`, base URL `/Campus-E-Wayfinding/`. Xem local bằng Vite với `--config vite.pages.config.ts --host 127.0.0.1 --port 5173`.
