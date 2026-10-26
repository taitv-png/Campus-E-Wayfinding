export type SurveyPhoto = { file: string; label: string };
export type RoomSurvey = { folder: string; summary: string; sourceLabel: string; photos: SurveyPhoto[]; note?: string };

const series = (first: number, last: number): SurveyPhoto[] => Array.from({ length: last - first + 1 }, (_, index) => ({
  file: `IMG_${first + index}`, label: `Hiện trạng · góc ${index + 1}`,
}));
const computers: RoomSurvey = {
  folder: 'installed-computer-lab', sourceLabel: 'Bộ ảnh nội thất dùng chung cho E402–E403 và E602–E603',
  summary: 'Dãy máy tính · bàn gỗ chia khoang · ghế kem, cam và xanh lá · bảng trắng · bàn giảng viên · máy chiếu',
  photos: [
    { file: 'IMG_5033', label: 'Toàn cảnh · dãy máy tính và cửa kính' },
    { file: 'IMG_5035', label: 'Bảng trắng · hai cửa trên dãy kính' },
    { file: 'IMG_5036', label: 'Nhìn về cửa phía cầu thang' },
    { file: 'IMG_5039', label: 'Bàn giảng viên · máy chiếu và cột' },
    { file: 'IMG_5037', label: 'Các khoang cửa sổ và lối đi' },
    ...[5031, 5027, 5028, 5029, 5030, 5032, 5034, 5038].map(number => ({ file: `IMG_${number}`, label: `Hiện trạng · ảnh ${number}` })),
  ],
  note: 'Hai phòng dùng chung bố trí theo xác nhận của bạn. Số hàng và số chỗ dựng trong mô hình là ước lượng từ ảnh.',
};

export const ROOM_SURVEYS: Record<string, RoomSurvey> = {
  E002: {
        folder: 'survey-e002', sourceLabel: 'Ảnh hiện trạng phòng E002',
        summary: 'Bàn trao đổi 8 chỗ, màn hình di động, vách lưới trưng bày hologram, buồng thiết bị khung nhôm, bàn điều khiển và sàn gạch hoa',
        photos: [
            { file: 'IMG_5023', label: 'Toàn cảnh bàn và khu trưng bày' },
            { file: 'IMG_5024', label: 'Cửa phòng và các ô kính' },
            ...series(5015, 5022),
        ],
        note: 'Bố trí và kích thước là ước lượng từ 10 ảnh hiện trạng; cửa vào giữ đúng tọa độ trên mặt bằng ứng dụng.',
    },
  'E402+E403': computers,
  'E602+E603': computers,
  E201: {
    folder: 'survey-e201', sourceLabel: 'Ảnh hiện trạng phòng E201',
    summary: 'Bàn họp · cụm bàn trao đổi · bàn máy tính · kệ tài liệu · cột giữa phòng · rèm lá dọc',
    photos: series(5102, 5107),
  },
  E202: {
    folder: 'survey-e202', sourceLabel: 'Ảnh hiện trạng phòng E202',
    summary: 'Bàn làm việc có vách ngăn · bàn họp · tủ lưu trữ · bảng trắng · máy chiếu',
    photos: series(5084, 5100),
  },
  E302: {
    folder: 'survey-e302', sourceLabel: 'Ảnh hiện trạng phòng E302',
    summary: 'Khu thử nghiệm có lưới bảo vệ · sân đánh dấu · thiết bị bay/robot · bàn điều khiển nhiều màn hình',
    photos: [1391, 1394, 1396, 1397].map(number => ({ file: `IMG_${number}`, label: `Khu thử nghiệm lưới · ảnh ${number}` })),
  },
  E303: {
    folder: 'survey-e304', sourceLabel: 'Ảnh hiện trạng phòng E303',
    summary: 'Sa bàn đường giao thông trên sàn · dãy robot xe bánh · bàn máy tính điều khiển · bảng và máy chiếu',
    photos: series(5040, 5051),
  },
  E304: {
    folder: 'survey-e303', sourceLabel: 'Ảnh hiện trạng phòng E304',
    summary: 'Hai dãy bàn máy tính · tủ kính thiết bị · cụm thực hành tự động hóa · bàn giảng viên và bảng',
    photos: series(5053, 5066),
  },
};

export const hasRoomSurvey = (id: string) => Object.prototype.hasOwnProperty.call(ROOM_SURVEYS, id);
