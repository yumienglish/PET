# PET Adventure 🚀

Trang bài tập về nhà tự học cho lớp PET (sách *Oxford Grammar for Schools 5*). Mỗi tuần mở 1 bài, chỉ lấy các bài tập cô chỉ định.

Link cho học sinh: https://yumienglish.github.io/PET/

## Cấu trúc
- `index.html`: trang chủ (danh sách bài) và trang bài làm (`?w=1`, `?w=2`…)
- `lessons.js`: **dữ liệu bài học**, gồm `OPEN_WEEK`, `VOCAB` (từ mới: nghĩa, phiên âm), `LESSONS` (đề, đáp án, gợi ý, ô Grammar)
- `app.js`: giao diện, chấm điểm, làm lại câu sai, gửi bài
- `img/`: hình cắt từ sách · `audio/`: audio đã cắt sẵn (bỏ phần giới thiệu, chỉ giữ từ câu hỏi đầu tiên)

## Cách viết câu hỏi trong `lessons.js`
- `((a/*b))`: chọn 1, dấu `*` là đáp án đúng · `((*a/*b/c))`: chọn 2
- `[[some]]`: ô gõ chữ (nhiều đáp án thì ngăn bằng `|`)
- `[[N:shelf/shelves]]`: ô "a/an + số ít" hoặc "số đếm + số nhiều"
- `{{từ}}` hoặc `{{khoá|chữ hiện}}`: từ mới, chạm vào thì hiện nghĩa và máy đọc to
- `h`: gợi ý ngữ pháp khi làm lại câu sai (không ghi đáp án)
- Bài nghe: thêm `track: 'tên-file'` (file trong `audio/`). Bài "listen and check" thì không gắn audio.

## Mở bài tuần mới
1. Thêm `LESSONS[n]` và từ mới vào `VOCAB`.
2. Chép hình vào `img/`, audio đã cắt vào `audio/`.
3. Đổi `OPEN_WEEK = n`, tăng `?v=` trong `index.html`, rồi push.

## Nộp bài
Dùng chung máy chủ Code.gs với các trang BTVN (unit `PET`): lần 1 chấm và gửi mail ngay; học sinh làm lại câu sai (có gợi ý), nộp lần 2 → mail so sánh lần 1 / lần 2, thời gian làm bài và số lần rời trang.
