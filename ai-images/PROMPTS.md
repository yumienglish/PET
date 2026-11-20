# Prompt tạo hình bằng ChatGPT – PET Arena ⚡

Phong cách: game xếp hạng / esports cho học sinh ~16 tuổi (nền tối, neon cyan + magenta). Khác B2 First (B2 là phiêu lưu, màu sáng).

## Cách làm
1. Mở ChatGPT, chọn tạo hình (Create image).
2. Mỗi hình: dán **đoạn STYLE** + **đoạn prompt của hình đó**, gửi.
3. Tải ảnh về, lưu vào `D:\pet\ai-images\` với **đúng tên file** ghi ở mỗi hình.
4. Báo mình: mình nén ảnh, cắt các ô của hình lưới, đưa vào `img/ai/` rồi đưa lên web.

Hình nào chưa có thì trang tự dùng giao diện hiện tại (không lỗi). Nếu ảnh có chữ, bảo ChatGPT: *"Same image, but remove all text, letters and numbers."*
Hình lưới (ranks, badges, avatars): các ô phải **đều nhau, không chạm nhau, nền phẳng** để cắt chính xác.

---

## STYLE (dán kèm mọi hình)

```
Premium esports video-game art for a teenage (age 15–17) English learning app. Dark navy background (#0a0e1c), neon cyan (#22d3ee) and magenta (#e94bff) rim lighting, glossy stylised 3D game-asset rendering, crisp clean edges, high detail, cool and mature — not childish. Absolutely no text, no letters, no numbers, no logos, no watermark.
```

---

## 1. `hero.png` – ảnh nền đầu trang (Lobby)
Khổ ngang 3:2.
```
Wide panoramic view of a futuristic esports arena at night, seen from high above the stage: glowing neon cyan and magenta light beams, giant holographic screens (blank, no text), a huge crowd silhouette, light haze and sparkles. Keep the centre of the picture darker and calm so a title can be placed on top. Cinematic, wide landscape 3:2.
```

## 2. `ranks.png` – 7 huy hiệu hạng (lưới 4 × 2)
Khổ ngang 3:2.
```
A sprite sheet of 7 esports rank emblems arranged in a neat grid of 4 columns and 2 rows (8 equal cells, the last cell bottom-right left completely empty). Each emblem sits centred in its own cell, same size, with generous empty space around it, on a plain flat dark navy background, no overlap. Each emblem is a hexagonal shield crest that gets more ornate with each rank: 1 Bronze (simple bronze metal shield), 2 Silver (silver shield with small wings), 3 Gold (gold shield with wings and a gem), 4 Platinum (teal-platinum shield with larger wings), 5 Diamond (light-blue crystal diamond shield, sparkling), 6 Master (purple shield with a crown and glowing aura), 7 Legend (crimson-pink and gold shield with flames, a crown and huge wings). Order: top row 1–4 left to right, bottom row 5–7.
```

## 3. `badges.png` – 8 thành tựu (lưới 4 × 2)
Khổ ngang 3:2.
```
A sprite sheet of 8 achievement medal icons arranged in a neat grid of 4 columns and 2 rows, 8 equal cells. Each icon centred in its own cell, same size, with empty space around it, on a plain flat dark navy background, no overlap. Each is a round glowing game achievement medal with a metal rim: 1 a target with an arrow in the bullseye, 2 a brilliant cut diamond, 3 two circular arrows forming a loop (comeback), 4 gaming headphones, 5 a blazing flame, 6 a lightning bolt, 7 a stack of glowing books, 8 a gold trophy cup. Order: top row 1–4 left to right, bottom row 5–8.
```

## 4. `avatars.png` – 16 avatar (lưới 4 × 4)
Khổ vuông 1:1.
```
A sprite sheet of 16 circular profile avatars for a teen gaming app, arranged in a neat grid of 4 columns and 4 rows, 16 equal cells. Each avatar is a head-and-shoulders portrait inside its own glowing neon circle frame, centred in its cell, same size, with empty space between them, on a plain flat dark navy background. Stylised 3D characters, cool and friendly: 1 fox with a gaming headset, 2 grey wolf with a hoodie, 3 eagle with visor goggles, 4 small dragon, 5 shark with sunglasses, 6 tiger with a cap, 7 sleek robot, 8 ninja with a mask, 9 astronaut with helmet, 10 cyber cat with neon whiskers, 11 owl with round glasses, 12 panda with a hoodie, 13 teenage girl gamer with headphones, 14 teenage boy with a backwards cap, 15 teenage girl skateboarder, 16 teenage boy basketball player. Order: left to right, top to bottom.
```

## 5. `coach.png` – nhân vật huấn luyện viên (hiện ở màn RANK UP, thành tựu, Word Rush)
Khổ dọc 2:3.
```
A friendly holographic AI coach character for a teen esports learning app: a sleek futuristic fox-robot with glowing cyan eyes and magenta accents, giving a confident thumbs-up, full body, slight floating hologram glow. Plain flat dark navy background with nothing else. Portrait 2:3.
```

## 6. `word-rush.png` – biểu tượng game ôn từ Word Rush
Khổ vuông 1:1.
```
A square game icon: a huge neon lightning bolt bursting through a swirl of flying blank glowing cards (the cards have no writing), speed lines, energy sparks. Centred, plain flat dark navy background.
```

## 7. Ảnh thẻ Mission (mỗi Unit 1 hình, khổ ngang 3:2)

### `mission-unit5.png` – Unit 5: The present
```
A neon city street at dusk shown as a split moment: on the left, people doing daily routines (jogging, catching a bus) with a glowing circular repeat arrow in the sky; on the right, the same street frozen "right now" with a big glowing clock and motion trails. Dark, cinematic, neon cyan and magenta. Landscape 3:2.
```

### `mission-unit1.png` – Unit 1: Countable and uncountable nouns; articles
```
A futuristic holographic inventory screen floating in a dark room: game-style item slots filled with everyday objects — a lorry, an umbrella, a jar of honey, a slice of cheese, a carton of eggs, a drop of rain, a pile of sugar, a bottle of water — some items stacked as several copies, some shown as a substance. Neon cyan and magenta glow, no text. Landscape 3:2.
```

### `mission-unit8.png` – Unit 8: The -ing form and the infinitive
```
A dynamic collage of teenagers doing hobbies in a neon-lit skatepark at night: skateboarding, playing guitar, playing chess, taking photos, skipping, cycling. Energetic action poses, motion trails, neon cyan and magenta lighting. Landscape 3:2.
```

---
Tuần mới: thêm 1 prompt `mission-unit<số>.png` theo nội dung Unit đó.
