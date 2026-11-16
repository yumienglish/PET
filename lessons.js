/* =====================================================================
   PET Grammar – DỮ LIỆU BÀI HỌC (sách Oxford Grammar for Schools 5)
   ---------------------------------------------------------------------
   • OPEN_WEEK: tuần đang mở. Mỗi tuần thêm 1 bài vào LESSONS rồi tăng số này.
     Các bài tuần trước vẫn mở để học sinh xem lại.
   • Từ mới: {{khoá}} hoặc {{khoá|chữ hiển thị}}; khoá phải có trong VOCAB.
   • Chỗ làm bài trong câu:
       ((a/*b))          chọn 1 – dấu * đánh dấu đáp án đúng
       ((*a/*b/c))       chọn 2 (số dấu * = số lựa chọn phải chọn)
       [[some]]          ô gõ chữ, nhiều đáp án đúng thì ngăn bằng |
       [[N:shelf/shelves]] ô gõ "a/an + số ít" hoặc "số đếm + số nhiều"
   • h: gợi ý ngữ pháp, chỉ hiện khi làm lại câu sai (KHÔNG ghi đáp án).
     Câu có nhiều chỗ trống thì h là mảng, theo thứ tự chỗ trống.
   ===================================================================== */
const OPEN_WEEK = 1;

// Máy chủ nhận bài (Code.gs dùng chung với các trang BTVN khác)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyAom9bBpL0ms0VD7_bz5w691011llkFzttYSjKDyRyMCjLLeUZ4EZGGJLtLMFWuiV4sA/exec';

/* ---------- TỪ MỚI: w = từ đọc to, ipa, vi = nghĩa tiếng Việt ---------- */
const VOCAB = {
  'mud':           { w: 'mud', ipa: '/mʌd/', vi: 'bùn' },
  'hopes':         { w: 'hopes', ipa: '/həʊps/', vi: 'những hy vọng, mong ước' },
  'furniture':     { w: 'furniture', ipa: '/ˈfɜːnɪtʃə/', vi: 'đồ đạc trong nhà (bàn, ghế, tủ…)' },
  'shelf':         { w: 'shelf', ipa: '/ʃelf/', vi: 'cái kệ, cái giá (số nhiều: shelves)' },
  'lorry':         { w: 'lorry', ipa: '/ˈlɒri/', vi: 'xe tải (Anh-Mỹ: truck)' },
  'puddle':        { w: 'puddle', ipa: '/ˈpʌdl/', vi: 'vũng nước' },
  'drop of rain':  { w: 'drop of rain', ipa: '/drɒp əv reɪn/', vi: 'giọt mưa' },
  'matches':       { w: 'matches', ipa: '/ˈmætʃɪz/', vi: 'que diêm' },
  'kindness':      { w: 'kindness', ipa: '/ˈkaɪndnəs/', vi: 'lòng tốt' },
  'space':         { w: 'space', ipa: '/speɪs/', vi: 'khoảng trống, chỗ' },
  'slice':         { w: 'slice', ipa: '/slaɪs/', vi: 'lát, miếng mỏng' },
  'spoonful':      { w: 'spoonful', ipa: '/ˈspuːnfʊl/', vi: 'một thìa đầy' },
  'block':         { w: 'block', ipa: '/blɒk/', vi: 'khối, tảng' },
  'sadness':       { w: 'sadness', ipa: '/ˈsædnəs/', vi: 'nỗi buồn' },
  'excitement':    { w: 'excitement', ipa: '/ɪkˈsaɪtmənt/', vi: 'sự hào hứng, phấn khích' },
  'jar':           { w: 'jar', ipa: '/dʒɑː/', vi: 'lọ, hũ (thủy tinh)' },
  'energy':        { w: 'energy', ipa: '/ˈenədʒi/', vi: 'năng lượng' },
  'packet':        { w: 'packet', ipa: '/ˈpækɪt/', vi: 'gói, túi nhỏ' },
  'crisps':        { w: 'crisps', ipa: '/krɪsps/', vi: 'khoai tây chiên lát (bim bim)' },
  'carton':        { w: 'carton', ipa: '/ˈkɑːtn/', vi: 'hộp giấy (đựng trứng, sữa)' },
  'wheel':         { w: 'wheel', ipa: '/wiːl/', vi: 'bánh xe' },
  'pollution':     { w: 'pollution', ipa: '/pəˈluːʃn/', vi: 'sự ô nhiễm' },
  'toast':         { w: 'toast', ipa: '/təʊst/', vi: 'bánh mì nướng' },
  'jam':           { w: 'jam', ipa: '/dʒæm/', vi: 'mứt' },
  'torch':         { w: 'torch', ipa: '/tɔːtʃ/', vi: 'đèn pin' },
  'dessert':       { w: 'dessert', ipa: '/dɪˈzɜːt/', vi: 'món tráng miệng' },
  'design':        { w: 'design', ipa: '/dɪˈzaɪn/', vi: 'thiết kế, hoa văn' },
  'unfortunately': { w: 'unfortunately', ipa: '/ʌnˈfɔːtʃənətli/', vi: 'thật không may' },
  'style':         { w: 'style', ipa: '/staɪl/', vi: 'kiểu, phong cách' },
  'skiing':        { w: 'skiing', ipa: '/ˈskiːɪŋ/', vi: 'trượt tuyết' },
  'Mediterranean Sea': { w: 'Mediterranean Sea', ipa: '/ˌmedɪtəˈreɪniən siː/', vi: 'biển Địa Trung Hải' },
};

/* ---------- BÀI HỌC THEO TUẦN ---------- */
const LESSONS = {
  1: {
    code: 'Unit 1', title: 'Countable and uncountable nouns; articles', pages: 'Student’s Book p.6–9',
    // Ô Grammar: tóm tắt thật ngắn, ví dụ KHÔNG trùng với câu trong bài tập
    grammar: `
      <h4>1. Đếm được (C) – Không đếm được (U)</h4>
      <ul>
        <li><b>C</b>: đếm được 1, 2, 3… → có số nhiều: <i>a cat → two cats, a child → two children</i>.</li>
        <li><b>U</b>: chất lỏng, đồ ăn dạng hạt / bột, chất liệu, ý tưởng, cảm xúc: <i>coffee, rice, salt, advice, happiness</i>.<br>
          → <b>không</b> có số nhiều, <b>không</b> dùng a/an, động từ chia <b>số ít</b>: <i>Your advice <b>is</b> great.</i></li>
        <li>Muốn đếm U → thêm từ chỉ lượng + <b>of</b>: <i>a cup <b>of</b> tea, a kilo <b>of</b> rice</i>.</li>
        <li>Có từ vừa C vừa U, <b>nghĩa khác nhau</b>: <i>chicken</i> (thịt gà, U) / <i>a chicken</i> (con gà, C).</li>
      </ul>
      <h4>2. a / an / some / any</h4>
      <ul>
        <li><b>a / an</b> + C số ít. <b>an</b> đứng trước <b>âm</b> nguyên âm: <i>a dog, an ant, an hour</i>.</li>
        <li><b>some / any</b> + C số nhiều hoặc U. <b>some</b>: câu khẳng định, lời mời / nhờ lịch sự. <b>any</b>: câu phủ định, câu hỏi.<br>
          <i>I’ve got <b>some</b> pencils. There isn’t <b>any</b> salt. Would you like <b>some</b> tea?</i></li>
      </ul>
      <h4>3. the: người nghe biết rõ là cái nào</h4>
      <ul>
        <li>đã nhắc đến rồi: <i>I’ve got a dog. <b>The</b> dog is black.</i> · có thông tin chỉ rõ phía sau: <i><b>the</b> book on my desk</i></li>
        <li>chỉ có một: <i><b>the</b> sun</i> · nhạc cụ: <i>play <b>the</b> guitar</i> · sông, đại dương, dãy núi: <i><b>the</b> Nile, <b>the</b> Atlantic, <b>the</b> Himalayas</i></li>
      </ul>
      <h4>4. Không dùng mạo từ (–)</h4>
      <ul>
        <li>nói <b>chung chung</b>: <i>Cats are cute. Coffee is hot.</i></li>
        <li>màu sắc, môn thể thao, bữa ăn, tên nước: <i>Red is nice. I play football. We have dinner at 7. I live in Vietnam.</i></li>
      </ul>`,
    ex: [
      /* Exercise 1 – C hay U */
      { id: '1', type: 'list', page: 'p.7',
        title: 'Countable or uncountable?',
        how: 'Are the underlined nouns countable (C) or uncountable (U)? Tap C or U.',
        vn: 'Nhìn danh từ <u>gạch chân</u>: đếm được thì chọn <b>C</b>, không đếm được thì chọn <b>U</b>.',
        examples: [
          'I’ve got a good <u>idea</u>! ((*C/U))',
          'Was the <u>weather</u> good? ((C/*U))',
        ],
        items: [
          { t: 'Have you got an <u>umbrella</u>? ((*C/U))', h: 'Có “an” đứng trước. a/an chỉ đi với loại danh từ nào?' },
          { t: 'Where are the <u>keys</u>? ((*C/U))', h: 'Từ này có đuôi -s và đi với “are”. Danh từ không đếm được có số nhiều không?' },
          { t: 'It takes <u>time</u> to learn a language. ((C/*U))', h: 'Ở đây “time” = thời gian nói chung (không phải “lần”). Thời gian có đếm 1, 2, 3 được không?' },
          { t: 'We need 300 grams of <u>sugar</u>. ((C/*U))', h: 'Ta phải đếm bằng “grams of…”, không nói “two sugars”. Thức ăn dạng hạt, bột thuộc loại nào?' },
          { t: 'Is it made of <u>glass</u>? ((C/*U))', h: '“made of” = làm bằng chất liệu gì. Chất liệu (thủy tinh) thuộc loại nào?' },
          { t: 'He’s phoned them six <u>times</u>. ((*C/U))', h: '“six times” = 6 lần. Đếm 1 lần, 2 lần… được không?' },
          { t: 'Look at the <u>people</u> over there. ((*C/U))', h: '“people” là số nhiều của “person”. Có số nhiều nghĩa là…?' },
          { t: 'There’s <u>{{mud}}</u> on the floor. ((C/*U))', h: 'Bùn là một chất (giống nước, cát). Không ai nói “a mud” hay “two muds”.' },
          { t: 'What are your <u>{{hopes}}</u> for the future? ((*C/U))', h: 'Từ này có đuôi -s và đi với “are”: có số nhiều.' },
          { t: 'Could I have a <u>glass</u> of water? ((*C/U))', h: 'Có “a” đứng trước: ở đây là “cái cốc” (đồ vật), không phải “thủy tinh”.' },
        ] },

      /* Exercise 2 – ghi tên tranh */
      { id: '2', type: 'label', page: 'p.7',
        title: 'Label the pictures',
        how: 'Label the pictures with the words in the box. Use <b>a</b>, <b>an</b> or a number with the countable nouns. Use a plural form where necessary. Numbers 1–4 are topics.',
        vn: 'Mỗi tranh có 1 <b>chủ đề</b> (dòng số 1, 2, 3, 4) và 4 đồ vật <b>a, b, c, d</b>. Danh từ đếm được phải có <b>a / an</b> hoặc <b>số đếm</b> phía trước. Có 2 cái trở lên thì đếm rồi viết số nhiều, VD: <b>two chairs</b>. Từ gạch ngang trong khung là đã dùng ở ví dụ.',
        box: ['bus', 'car', '~chair', 'boy', '{{drop of rain}}', '~{{furniture}}', 'people', '{{lorry}}', 'man', 'motorbike',
          '{{puddle}}', 'girl', 'weather', 'raincoat', 'sofa', '{{shelf}}', '~table', 'transport', 'umbrella', 'woman'],
        groups: [
          { n: '1', img: 'u1-ex2-1.jpg', head: 'furniture', rows: [
            { l: 'a', ex: 'a table' }, { l: 'b', ex: 'two chairs' },
            { l: 'c', t: '[[N:shelf/shelves]]' }, { l: 'd', t: '[[N:sofa/sofas]]' } ] },
          { n: '2', img: 'u1-ex2-2.jpg', head: '[[transport]]', h: 'Dòng số là <b>chủ đề</b> của cả tranh (giống “furniture” ở tranh 1). Tranh này có xe buýt, xe tải, ô tô… → chọn từ chung trong khung.', rows: [
            { l: 'a', t: '[[N:lorry/lorries]]' }, { l: 'b', t: '[[N:bus/buses]]' },
            { l: 'c', t: '[[N:car/cars]]' }, { l: 'd', t: '[[N:motorbike/motorbikes]]' } ] },
          { n: '3', img: 'u1-ex2-3.jpg', head: '[[weather]]', h: 'Dòng số là <b>chủ đề</b> của cả tranh. Trời đang mưa → chọn từ chung trong khung.', rows: [
            { l: 'a', t: '[[N:umbrella/umbrellas]]' }, { l: 'b', t: '[[N:raincoat/raincoats]]' },
            { l: 'c', t: '[[N:puddle/puddles]]' }, { l: 'd', t: '[[N:drop of rain/drops of rain]]' } ] },
          { n: '4', img: 'u1-ex2-4.jpg', head: '[[people]]', h: 'Dòng số là <b>chủ đề</b> của cả tranh. Tranh có đàn ông, phụ nữ, trẻ em → chọn từ chung trong khung.', rows: [
            { l: 'a', t: '[[N:man/men]]' }, { l: 'b', t: '[[N:boy/boys]]' },
            { l: 'c', t: '[[N:girl/girls]]' }, { l: 'd', t: '[[N:woman/women]]' } ] },
        ] },

      /* Exercise 4 – chọn đáp án đúng (KHÔNG nghe để kiểm tra) */
      { id: '4', type: 'list', page: 'p.7',
        title: 'Choose the correct word',
        how: 'Tap the correct option.',
        vn: 'Mỗi câu chạm vào <b>1</b> từ đúng.',
        examples: [ 'There were ten ((mouses/*mice)).' ],
        items: [
          { t: 'Could I have two ((box/*boxes)) of {{matches}}?', h: 'Sau “two” là danh từ số nhiều. Từ tận cùng bằng -x thì thêm -s hay -es?' },
          { t: '((*It’s/They’re)) good news! We won!', h: '“news” có chữ s nhưng là danh từ không đếm được → động từ chia số ít.' },
          { t: 'His feet ((was/*were)) very dirty.', h: '“feet” là số nhiều của “foot”.' },
          { t: 'The rings are made of ((golds/*gold)).', h: 'Vàng là chất liệu → không đếm được, không có số nhiều.' },
          { t: '{{kindness|Kindness}} ((*is/are)) important.', h: 'Lòng tốt là một ý niệm, cảm xúc → không đếm được → động từ chia số ít.' },
          { t: 'Six vanilla ((ice-cream/*ice-creams)), please.', h: 'Ở đây “ice-cream” = 1 cây / 1 ly kem (đếm được). Phía trước có “six”…' },
          { t: 'You can read ((*a newspaper/newspaper)) while I get the drinks.', h: 'Đọc “1 tờ báo” (đồ vật, đếm được, số ít). Danh từ đếm được số ít cần gì đứng trước?' },
          { t: 'I’d like a bedroom with more ((*{{space}}/spaces)). It’s very small.', h: '“space” ở đây = chỗ trống, không gian nói chung → không đếm được.' },
        ] },

      /* Exercise 5 – chọn 2 từ đúng */
      { id: '5', type: 'list', page: 'p.7',
        title: 'Choose two correct words',
        how: 'Tap the <b>two</b> correct words in each line.',
        vn: 'Mỗi dòng có 3 từ, <b>2 từ đúng</b> và 1 từ sai. Chạm vào <b>2</b> từ đúng (chạm lại để bỏ chọn).',
        examples: [ 'a ((*{{slice}}/*piece/drop)) of cake' ],
        items: [
          { t: 'a ((*bit/*piece/litre)) of information', h: '“information” là ý niệm, không phải chất lỏng. Từ nào chỉ dùng để đo chất lỏng?' },
          { t: 'a ((*{{spoonful}}/slice/*bag)) of sugar', h: 'Đường ở dạng hạt nhỏ. Không thể cắt đường thành lát.' },
          { t: 'a ((*drop/*bottle/piece)) of water', h: 'Nước là chất lỏng. Chất lỏng không có “miếng”.' },
          { t: 'a {{block}} of ((*cheese/milk/*wood))', h: '“block” = khối cứng. Chất nào không thể thành khối?' },
          { t: 'a feeling of ((*{{sadness}}/oxygen/*{{excitement}}))', h: '“a feeling of” = cảm giác. Từ nào không phải là cảm xúc?' },
          { t: 'a {{jar}} of ((*honey/*{{jam}}/{{energy}}))', h: '“jar” = lọ, hũ đựng đồ ăn. Thứ nào không bỏ vào lọ được?' },
          { t: 'a {{packet}} of ((*{{crisps}}/juice/*biscuits))', h: '“packet” = gói nhỏ đựng đồ khô. Đồ uống thì không đựng trong gói.' },
          { t: 'a ((*{{carton}}/packet/*box)) of eggs', h: 'Trứng dễ vỡ nên đựng trong hộp cứng, không đựng trong gói mềm.' },
        ] },

      /* Exercise 6 – tranh: a, an hay some */
      { id: '6', type: 'pics', page: 'p.8', only: ['a', 'an', 'some'],
        title: 'a, an or some?',
        how: 'Look at the pictures and write <b>a</b>, <b>an</b> or <b>some</b>.',
        vn: 'Nhìn tranh rồi gõ <b>a</b>, <b>an</b> hoặc <b>some</b> vào ô trống.',
        examples: [ { img: 'u1-ex6-0.jpg', t: '[[some]] orange juice' } ],
        items: [
          { img: 'u1-ex6-1.jpg', t: '[[a]] glass', h: 'Tranh là 1 cái cốc (đồ vật, đếm được, số ít). “glass” bắt đầu bằng âm phụ âm.' },
          { img: 'u1-ex6-2.jpg', t: '[[some]] water', h: 'Nước là chất lỏng → không đếm được → không dùng a/an.' },
          { img: 'u1-ex6-3.jpg', t: '[[some]] people', h: '“people” là số nhiều → không dùng a/an.' },
          { img: 'u1-ex6-4.jpg', t: '[[a]] {{wheel}}', h: '1 cái bánh xe: đếm được, số ít. “wheel” bắt đầu bằng âm /w/ (phụ âm).' },
          { img: 'u1-ex6-5.jpg', t: '[[some]] {{pollution}}', h: 'Ô nhiễm là danh từ không đếm được → không dùng a/an.' },
          { img: 'u1-ex6-6.jpg', t: '[[an]] elephant', h: '1 con voi: đếm được, số ít. “elephant” bắt đầu bằng âm nguyên âm /e/.' },
          { img: 'u1-ex6-7.jpg', t: '[[some]] plants', h: '“plants” có đuôi -s → số nhiều → không dùng a/an.' },
        ] },

      /* Exercise 9 – hội thoại: a, an, the, any, some (KHÔNG nghe để kiểm tra) */
      { id: '9', type: 'list', page: 'p.9', conv: true, only: ['a', 'an', 'the', 'any', 'some'],
        title: 'Complete the conversations',
        how: 'Complete the conversations with <b>a</b>, <b>an</b>, <b>the</b>, <b>any</b> or <b>some</b>.',
        vn: 'Gõ 1 từ vào mỗi ô: <b>a, an, the, any</b> hoặc <b>some</b>. Gõ xong bấm <b>Enter</b> để nhảy sang ô tiếp theo. Mở ô 📘 Grammar ở đầu bài nếu chưa chắc.',
        examples: [ '‘I bought [[some]] magazines for you.’<br>‘Thanks. Where are they?’<br>‘In [[the]] living room.’' ],
        items: [
          { t: '‘Can I have [[a]] piece of {{toast}} with [[some]] butter, please?’<br>‘Yes, of course.’<br>‘Is there [[any]] {{jam}}?’<br>‘No, I’m afraid not. Do you want [[an]] apple?’<br>‘No, thanks.’',
            h: ['“piece” đếm được, số ít: xin 1 miếng.', '“butter” không đếm được, đây là lời nhờ lịch sự (please).', 'Câu hỏi, “jam” không đếm được.', '“apple” số ít, bắt đầu bằng âm nguyên âm.'] },
          { t: '‘What’s that? Is it [[a]] pen?’<br>‘No, it’s [[the]] {{torch}} I told you about.’',
            h: ['“pen” số ít, chưa xác định (1 cây bút bất kỳ).', '“I told you about” cho biết đó là cái đèn pin cụ thể mà cả hai đều biết.'] },
          { t: '‘I can see [[some]] butterflies.’<br>‘Where?’<br>‘Over there, by [[the]] trees.’',
            h: ['“butterflies” số nhiều, câu khẳng định.', 'Những cái cây cụ thể ở đằng kia (cả hai cùng nhìn thấy).'] },
          { t: '‘Did you have [[a]] swimming lesson today?’<br>‘No, because there was [[a]] problem with [[the]] water.’',
            h: ['“lesson” đếm được, số ít.', '“problem” đếm được, số ít, nhắc đến lần đầu.', 'Nước cụ thể ở bể bơi đó (cả hai đều biết là nước nào).'] },
          { t: '‘We need [[some]] sugar for this {{dessert}}.’<br>‘Do we need a lot?’<br>‘No, just [[a]] spoonful of brown sugar.’',
            h: ['“sugar” không đếm được, câu khẳng định.', '“spoonful” = 1 thìa: đếm được, số ít.'] },
          { t: '‘Look, I got [[some]] new plates. Do you like [[the]] {{design}}?’<br>‘Yes. I like [[the]] little blue flowers in [[the]] middle.’<br>‘Me too. {{unfortunately|Unfortunately}} there weren’t [[any]] cups or bowls in the same {{style}}.’',
            h: ['“plates” số nhiều, câu khẳng định.', 'Hoa văn của chính những cái đĩa này (đã biết rõ là cái nào).', 'Những bông hoa cụ thể trên đĩa đó.', '“in ___ middle” = ở chính giữa: chỉ có 1 chỗ giữa.', 'Câu phủ định (weren’t) với danh từ số nhiều.'] },
        ] },

      /* Exercise 10 – the hay không mạo từ */
      { id: '10', type: 'list', page: 'p.9',
        title: '<i>the</i> or – (no article)?',
        how: 'Complete the sentences with <b>the</b> or <b>–</b> (no article).',
        vn: 'Chạm <b>the</b> nếu cần “the”, chạm <b>–</b> nếu <b>không</b> cần mạo từ.',
        examples: [ 'They’re {{skiing}} in ((*the/–)) Alps.' ],
        items: [
          { t: 'I’d like to speak to ((*the/–)) manager.', h: 'Người quản lý của chính nơi này: chỉ có 1 người, ai cũng biết là ai.' },
          { t: 'I don’t usually like ((the/*–)) tomatoes but I like ((*the/–)) tomatoes my grandfather grows.',
            h: ['Câu này nói về cà chua <b>nói chung</b>.', '“my grandfather grows” cho biết đó là cà chua nào.'] },
          { t: 'These two colours make ((the/*–)) blue.', h: 'Xem ô Grammar: màu sắc có dùng mạo từ không?' },
          { t: 'It lives in ((*the/–)) {{Mediterranean Sea}}.', h: 'Tên biển, đại dương, sông thì dùng gì?' },
          { t: 'Can you play ((*the/–)) piano?', h: 'Chơi nhạc cụ: play ___ + nhạc cụ.' },
          { t: 'It’s made of ((the/*–)) butter and ((the/*–)) oil.', h: 'Nói về chất liệu nói chung (danh từ không đếm được).' },
          { t: 'What time do you have ((the/*–)) lunch?', h: 'Bữa ăn (breakfast, lunch, dinner) có dùng mạo từ không?' },
          { t: 'Look at ((*the/–)) moon!', h: 'Vật chỉ có một trên đời.' },
          { t: 'She comes from ((*the/–)) Philippines.', h: 'Tên nhóm đảo hoặc tên nước ở dạng số nhiều (giống the USA, the Canaries).' },
          { t: 'They had ((the/*–)) fun yesterday.', h: '“fun” không đếm được, nói chung chung.' },
        ] },
    ],
  },
};
