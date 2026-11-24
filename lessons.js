/* =====================================================================
   PET Arena – DỮ LIỆU BÀI HỌC (sách Oxford Grammar for Schools 5)
   ---------------------------------------------------------------------
   • OPEN_WEEK: tuần đang mở. Mỗi tuần thêm 1 bài vào LESSONS rồi tăng số này.
     Các bài tuần trước vẫn mở để học sinh xem lại.
   • Chữ highlight (bấm xem nghĩa): {{khoá}} hoặc {{khoá|chữ hiển thị}}; khoá phải có trong VOCAB.
   • newWords = danh sách "New words" đầu bài (để chép vở): CHỈ từ B1 cho đỡ ngợp. Từ A2 ít gặp / trên B1 vẫn tô vàng trong bài để bấm xem nghĩa
     với học sinh VN. Không lấy từ trong câu lệnh đề bài.
   • Chỗ làm bài trong câu:
       ((a/*b))          chọn 1 – dấu * đánh dấu đáp án đúng
       ((*a/*b/c))       chọn 2 (số dấu * = số lựa chọn phải chọn)
       [[some]]          ô gõ chữ, nhiều đáp án đúng thì ngăn bằng |
       [[N:shelf/shelves]]   ô gõ "a/an + số ít" hoặc "số đếm + số nhiều" · [[N:shelf/shelves=3]] = phải đúng số lượng trong tranh (=2|3: nhiều số đều đúng)
   • h: gợi ý ngữ pháp, chỉ hiện khi làm lại câu sai (KHÔNG ghi đáp án).
     Câu có nhiều chỗ trống thì h là mảng, theo thứ tự chỗ trống.
   ===================================================================== */
const OPEN_WEEK = 2;

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
  /* Unit 8 */
  'chess':         { w: 'chess', ipa: '/tʃes/', vi: 'cờ vua' },
  'ski':           { w: 'ski', ipa: '/skiː/', vi: 'trượt tuyết' },
  'skip':          { w: 'skip', ipa: '/skɪp/', vi: 'nhảy dây' },
  'feel like':     { w: 'feel like', ipa: '/fiːl laɪk/', vi: 'muốn, thấy thích (làm gì)' },
  'pastime':       { w: 'pastime', ipa: '/ˈpɑːstaɪm/', vi: 'trò tiêu khiển, thú vui' },
  'shells':        { w: 'shells', ipa: '/ʃelz/', vi: 'vỏ sò, vỏ ốc' },
  'gloves':        { w: 'gloves', ipa: '/ɡlʌvz/', vi: 'găng tay' },
  'washing-up':    { w: 'washing-up', ipa: '/ˌwɒʃɪŋ ˈʌp/', vi: 'việc rửa bát đĩa' },
  'worth':         { w: 'worth', ipa: '/wɜːθ/', vi: 'đáng (làm gì)' },
  'possessions':   { w: 'possessions', ipa: '/pəˈzeʃnz/', vi: 'đồ đạc, của cải mình sở hữu' },
  'own':           { w: 'own', ipa: '/əʊn/', vi: 'sở hữu, có' },
  'promise':       { w: 'promise', ipa: '/ˈprɒmɪs/', vi: 'hứa' },
  'borrow':        { w: 'borrow', ipa: '/ˈbɒrəʊ/', vi: 'mượn (của ai)' },
  'in public':     { w: 'in public', ipa: '/ɪn ˈpʌblɪk/', vi: 'trước đám đông, nơi công cộng' },
  'chopsticks':    { w: 'chopsticks', ipa: '/ˈtʃɒpstɪks/', vi: 'đôi đũa' },
  'lie':           { w: 'lie', ipa: '/laɪ/', vi: 'nói dối' },
  'refuse':        { w: 'refuse', ipa: '/rɪˈfjuːz/', vi: 'từ chối' },
  'discuss':       { w: 'discuss', ipa: '/dɪˈskʌs/', vi: 'thảo luận, bàn bạc' },
  'imagine':       { w: 'imagine', ipa: '/ɪˈmædʒɪn/', vi: 'tưởng tượng' },
  'pretend':       { w: 'pretend', ipa: '/prɪˈtend/', vi: 'giả vờ' },
  'practise':      { w: 'practise', ipa: '/ˈpræktɪs/', vi: 'luyện tập' },
  'fancy':         { w: 'fancy', ipa: '/ˈfænsi/', vi: 'thích, muốn (làm gì)' },
  'intend':        { w: 'intend', ipa: '/ɪnˈtend/', vi: 'dự định' },
  "can't stand":   { w: "can't stand", ipa: '/kɑːnt stænd/', vi: 'không chịu nổi' },
  'arrange':       { w: 'arrange', ipa: '/əˈreɪndʒ/', vi: 'sắp xếp, hẹn (làm gì)' },
  'prefer':        { w: 'prefer', ipa: '/prɪˈfɜː/', vi: 'thích hơn' },
  "don't mind":    { w: "don't mind", ipa: '/dəʊnt maɪnd/', vi: 'không ngại, không phiền' },
  'deserve':       { w: 'deserve', ipa: '/dɪˈzɜːv/', vi: 'xứng đáng' },
  'manage':        { w: 'manage', ipa: '/ˈmænɪdʒ/', vi: 'xoay xở được, làm được (việc khó)' },
  'risk':          { w: 'risk', ipa: '/rɪsk/', vi: 'liều, mạo hiểm (làm gì)' },
  'aim':           { w: 'aim', ipa: '/eɪm/', vi: 'đặt mục tiêu, nhắm tới' },
  'fascinating':   { w: 'fascinating', ipa: '/ˈfæsɪneɪtɪŋ/', vi: 'cực kỳ hấp dẫn, lôi cuốn' },
  'explore':       { w: 'explore', ipa: '/ɪkˈsplɔː/', vi: 'khám phá' },
  'expect':        { w: 'expect', ipa: '/ɪkˈspekt/', vi: 'đoán trước, chờ đợi (điều gì sẽ xảy ra)' },
  'stalls':        { w: 'stalls', ipa: '/stɔːlz/', vi: 'quầy hàng, sạp hàng' },
  'workshops':     { w: 'workshops', ipa: '/ˈwɜːkʃɒps/', vi: 'xưởng thủ công' },
  'ceramics':      { w: 'ceramics', ipa: '/səˈræmɪks/', vi: 'đồ gốm' },
  'jewellery':     { w: 'jewellery', ipa: '/ˈdʒuːəlri/', vi: 'đồ trang sức' },
  'underground':   { w: 'underground', ipa: '/ˈʌndəɡraʊnd/', vi: 'tàu điện ngầm' },
  'sights':        { w: 'sights', ipa: '/saɪts/', vi: 'cảnh đẹp, điểm tham quan' },
  'suggest':       { w: 'suggest', ipa: '/səˈdʒest/', vi: 'gợi ý, đề nghị' },
  'get about':     { w: 'get about', ipa: '/ɡet əˈbaʊt/', vi: 'đi lại (trong thành phố)' },
  'avoid':         { w: 'avoid', ipa: '/əˈvɔɪd/', vi: 'tránh' },
  'identity card': { w: 'identity card', ipa: '/aɪˈdentəti kɑːd/', vi: 'thẻ căn cước' },
  'Mediterranean Sea': { w: 'Mediterranean Sea', ipa: '/ˌmedɪtəˈreɪniən siː/', vi: 'biển Địa Trung Hải' },
  /* Unit 5 */
  'covering':      { w: 'covering', ipa: '/ˈkʌvərɪŋ/', vi: 'lớp che phủ, lớp bọc' },
  'eyelids':       { w: 'eyelids', ipa: '/ˈaɪlɪdz/', vi: 'mí mắt' },
  'hardly ever':   { w: 'hardly ever', ipa: '/ˈhɑːdli ˈevə/', vi: 'hầu như không bao giờ' },
  'flavour':       { w: 'flavour', ipa: '/ˈfleɪvə/', vi: 'hương vị' },
  'depend on':     { w: 'depend on', ipa: '/dɪˈpend ɒn/', vi: 'phụ thuộc vào, tuỳ vào' },
  'matter':        { w: 'matter', ipa: '/ˈmætə/', vi: 'quan trọng, có ý nghĩa (It doesn’t matter = không sao đâu)' },
  'seem':          { w: 'seem', ipa: '/siːm/', vi: 'có vẻ, dường như' },
  'belong to':     { w: 'belong to', ipa: '/bɪˈlɒŋ tə/', vi: 'thuộc về (của ai)' },
  'measure':       { w: 'measure', ipa: '/ˈmeʒə/', vi: 'đo (kích thước)' },
  'weigh':         { w: 'weigh', ipa: '/weɪ/', vi: 'cân; nặng (bao nhiêu)' },
  'realize':       { w: 'realize', ipa: '/ˈrɪəlaɪz/', vi: 'nhận ra' },
  'notice':        { w: 'notice', ipa: '/ˈnəʊtɪs/', vi: 'tấm biển, thông báo' },
  'treasure':      { w: 'treasure', ipa: '/ˈtreʒə/', vi: 'kho báu' },
};

/* ---------- BÀI HỌC THEO TUẦN ---------- */
const LESSONS = {
  /* ===================== TUẦN 1 – Unit 5 ===================== */
  1: {
    code: 'Unit 5', title: 'The present',
    newWords: ['hardly ever', 'flavour', 'depend on', 'matter', 'seem', 'belong to', 'own', 'measure', 'weigh', 'realize', 'notice', 'treasure'],
    // Ô Grammar: tóm tắt thật ngắn, ví dụ KHÔNG trùng với câu / cụm trong bài tập
    grammar: `
      <h4>1. Hiện tại đơn: V / V-s</h4>
      <ul>
        <li>Thói quen, việc lặp lại: <i>My dad <b>walks</b> to work.</i> Trạng từ <i>always, usually, often, sometimes, rarely, hardly ever, never</i> đứng <b>trước</b> động từ thường, <b>sau</b> be: <i>She <b>often</b> cooks. He’s <b>never</b> late.</i></li>
        <li>Sự thật, khoa học: <i>Water <b>boils</b> at 100°C.</i> · Tình huống lâu dài: <i>They <b>live</b> in Hanoi.</i></li>
        <li>Lịch trình, giờ tàu xe (cả trong tương lai): <i>The film <b>starts</b> at 7.</i></li>
      </ul>
      <h4>2. Hiện tại tiếp diễn: am / is / are + V-ing</h4>
      <ul>
        <li>Đang xảy ra lúc nói (<i>now, at the moment</i>): <i>Listen! Someone <b>is knocking</b> at the door.</i></li>
        <li>Tạm thời (<i>this week, these days</i>): <i>I<b>’m staying</b> with my aunt this month.</i></li>
        <li>Đang thay đổi dần: <i>Prices <b>are going</b> up.</i></li>
        <li>Kế hoạch đã hẹn (có thời gian tương lai): <i>We<b>’re flying</b> to Da Nang on Sunday.</i></li>
      </ul>
      <h4>3. Động từ trạng thái: thường KHÔNG dùng -ing</h4>
      <ul>
        <li>Thích, muốn: <i>love, prefer, wish</i> · Suy nghĩ: <i>forget, suppose</i> · Giác quan: <i>sound, smell</i> · Đặc điểm, sở hữu: <i>cost, possess, equal, exist</i></li>
        <li><i>This bag <b>costs</b> $20.</i> (không nói <s>is costing</s>)</li>
      </ul>
      <h4>4. Động từ có 2 nghĩa</h4>
      <table>
        <tr><th>Trạng thái → đơn</th><th>Hành động → tiếp diễn được</th></tr>
        <tr><td><i>She <b>has</b> a cat.</i> (sở hữu)</td><td><i>She<b>’s having</b> a shower.</i></td></tr>
        <tr><td><i>I <b>think</b> it’s easy.</i> (= cho rằng)</td><td><i>He<b>’s thinking</b> of his holiday.</i> (= đang nghĩ)</td></tr>
        <tr><td><i>This milk <b>tastes</b> sour.</i></td><td><i>Mum <b>is tasting</b> the sauce.</i></td></tr>
        <tr><td><i>He <b>is</b> funny.</i> (tính cách)</td><td><i>He<b>’s being</b> silly today.</i> (cư xử nhất thời)</td></tr>
        <tr><td><i>The label <b>says</b> ‘Shake well’.</i> (chữ viết)</td><td><i>What <b>is</b> she <b>saying</b>?</i> (lời nói)</td></tr>
      </table>`,
    ex: [
      /* Bài 1 (sách Ex 2) – chọn thì trong hội thoại, KHÔNG có audio để nghe check */
      { id: '2', type: 'list', conv: true,
        title: 'Four conversations',
        how: 'Tap the correct options.',
        examples: [ '<b>A</b> Hello, Hanford Theatre. Can I help you?<br><b>B</b> Yes, I ((come/*’m coming)) to the show <i>Up and Up</i> this evening. What time ((*does it finish/is it finishing))?<br><b>A</b> At half past eight.' ],
        items: [
          { t: '<b>A</b> Where are your glasses?<br><b>B</b> What do you mean?<br><b>A</b> You usually ((*wear/are wearing)) glasses.<br><b>B</b> Yes, but I don’t <i>always</i> wear glasses. I ((*wear/’m wearing)) them for reading, that’s all.<br><b>A</b> But you ((read/*’re reading)) a magazine now!<br><b>B</b> I ((only look/*’m only looking)) at the pictures at the moment.',
            h: ['“usually” → thói quen.', 'B nói chung chung: đeo kính khi nào (thói quen), không phải lúc này.', '“now” → đang xảy ra lúc nói.', '“at the moment” → đang xảy ra lúc nói.'] },
          { t: '<b>A</b> What ((do you do/*are you doing)) this afternoon, Tim?<br><b>B</b> I ((meet/*’m meeting)) my friend George. We ((*play/’re playing)) chess every Monday.<br><b>A</b> Really? I ((*still don’t understand/’m still not understanding)) the rules of chess!',
            h: ['Hỏi về <b>kế hoạch</b> chiều nay (đã sắp xếp).', 'Kế hoạch đã hẹn với bạn.', '“every Monday” → thói quen.', '“understand” là động từ <b>suy nghĩ</b> → trạng thái.'] },
          { t: '<b>A</b> Here’s an interesting fact for you. A fish never ((*closes/’s closing)) its eyes.<br><b>B</b> Really?<br><b>A</b> No. It ((*has/’s having)) a clear {{covering}} over its eyes. It ((*doesn’t have/isn’t having)) {{eyelids}} like other animals.<br><b>B</b> Amazing!',
            h: ['Sự thật về loài cá, luôn đúng.', '“have” ở đây = có (đặc điểm cơ thể).', '“have” ở đây = có (đặc điểm cơ thể). Câu phủ định.'] },
          { t: '<b>A</b> Have you got any plans for this evening, Claire?<br><b>B</b> Yes, I ((play/*’m playing)) tennis with a friend.<br><b>A</b> How often ((*do you play/are you playing))?<br><b>B</b> Once or twice a week.',
            h: ['Kế hoạch đã hẹn cho tối nay.', '“How often” hỏi về thói quen.'] },
        ] },

      /* Bài 2 (sách Ex 4) – gõ thì đúng */
      { id: '4', type: 'list',
        title: 'Present simple or present continuous?',
        how: 'Complete the sentences with the present simple or present continuous form of the verb in brackets.',
        examples: [ 'I [[visit]] the dentist twice a year. <span class="vb">(visit)</span>' ],
        items: [
          { t: 'She [[likes]] cold weather.', v: 'like', h: '“like” là động từ trạng thái. Chủ ngữ “She”.' },
          { t: 'What time [[does the bank open]]?', v: 'the bank/open', h: 'Giờ mở cửa = lịch cố định. Nhớ trật tự câu hỏi.' },
          { t: 'We usually have hot meals but this week we [[’re having|are having]] sandwiches.', v: 'have', h: '“this week” → tình huống tạm thời. “have” = ăn (hành động).' },
          { t: 'Giraffes [[sleep]] for three or four hours a day.', v: 'sleep', h: 'Sự thật về loài vật, luôn đúng.' },
          { t: 'What [[are you doing]] this afternoon?', v: 'you/do', h: 'Hỏi về <b>kế hoạch</b> chiều nay. Nhớ trật tự câu hỏi.' },
          { t: 'It [[hardly ever rains]] here.', v: '{{hardly ever}}/rain', h: 'Thói quen, tình huống chung. Trạng từ tần suất đứng trước động từ. Chủ ngữ “It”.' },
          { t: 'My sister [[hasn’t got|has not got]] black hair.', v: 'not/have got', h: 'Đặc điểm (tóc màu gì). Dùng đúng “have got”, câu phủ định, chủ ngữ “My sister”.' },
          { t: 'Molly [[’s getting|is getting]] hungry. I’ll make her a snack.', v: 'get', h: 'Đang <b>thay đổi dần</b> (càng lúc càng đói).' },
        ] },

      /* Bài 3 (sách Ex 6) – nghe và chọn */
      { id: '6', type: 'list', track: 'u5-ex6',
        title: 'What is it?',
        how: 'Listen to the clues and tap the correct answer.',
        examples: [ '((Portugal/India/*Argentina))' ],
        items: [
          { t: '((*a lemon/a potato/a book))', h: 'Nghe lại 3 gợi ý: nặng bao nhiêu, có chất gì, vị ra sao.' },
          { t: '((*flowers/rocks/animals))', h: 'Nghe lại: thấy ở đâu, cần những gì để sống, mùi thế nào.' },
          { t: '((rice/coffee/*tea))', h: 'Nghe lại: cần gì để pha, đến từ đâu.' },
          { t: '((*the past/the present/the future))', h: 'Nghe lại: ta nhớ và quên một phần, xem ảnh và kể chuyện về nó.' },
          { t: '((music/*love/money))', h: 'Nghe lại: không nặng, không tốn tiền, ở nước nào cũng giống nhau.' },
        ] },

      /* Bài 4 (sách Ex 7) – động từ trạng thái trong khung */
      { id: '7', type: 'list', conv: true,
        title: 'State verbs',
        how: 'Complete the answers with the correct form of the state verbs in the box.',
        box: ['{{matter}}', 'remember', 'know', 'agree', '~hate', 'understand', '{{depend on}}', 'look', 'believe'],
        examples: [ '‘Does he like basketball?’<br>‘No, he [[hates]] it!’' ],
        items: [
          { t: '‘Do you like ice-cream?’<br>‘It [[depends on]] the {{flavour}}.’', h: 'Ý: “còn tuỳ vào” vị kem. Chủ ngữ “It” → thêm -s.' },
          { t: '‘Why isn’t he saying anything?’<br>‘He [[doesn’t understand|does not understand]] you.’', h: 'Anh ấy im lặng vì không hiểu. Câu phủ định, chủ ngữ “He”.' },
          { t: '‘What’s the capital city of New Zealand?’<br>‘I [[don’t know|do not know]].’', h: 'Trả lời khi không có thông tin. Câu phủ định.' },
          { t: '‘We should do something about it.’<br>‘I [[agree]]. Let’s tell a teacher.’', h: 'Đồng ý với ý kiến của bạn.' },
          { t: '‘I’m really sorry. Your book got wet in the rain.’<br>‘It [[doesn’t matter|does not matter]].’', h: 'Ý: “không sao đâu”. Câu phủ định, chủ ngữ “It”.' },
          { t: '‘What do you think of my new dress?’<br>‘You [[look]] very nice.’', h: 'Khen vẻ bề ngoài (trông…).' },
          { t: '‘I told you last week!’<br>‘Really? I [[don’t remember|do not remember]].’', h: 'Bạn nói rồi nhưng mình quên. Câu phủ định.' },
          { t: '‘I didn’t tell Rosy! Really I didn’t!’<br>‘It’s OK. I [[believe]] you!’', h: 'Mình tin lời bạn nói.' },
        ] },

      /* Bài 5 (sách Ex 8) – trạng thái hay hành động */
      { id: '8', type: 'list',
        title: 'State or action?',
        how: 'Is the verb in <b>bold</b> a <b>state</b> verb or an <b>action</b> verb? Tap the correct answer.',
        examples: [ 'They <b>work</b> hard. → ((State/*Action))' ],
        items: [
          { t: 'You <b>{{seem}}</b> very happy today! → ((*State/Action))', h: 'Động từ chỉ <b>ấn tượng</b> (trông có vẻ).' },
          { t: 'They <b>have</b> lunch together every day. → ((State/*Action))', h: '“have lunch” = ăn trưa, không phải “có / sở hữu”.' },
          { t: 'I <b>need</b> more time. → ((*State/Action))', h: 'Động từ chỉ <b>nhu cầu, mong muốn</b>.' },
          { t: 'This <b>{{belong to|belongs}}</b> to my brother. → ((*State/Action))', h: 'Động từ chỉ <b>sở hữu</b> (của ai).' },
          { t: 'Andy <b>{{measure|measures}}</b> people’s feet. → ((State/*Action))', h: 'Andy làm công việc <b>đo</b> chân cho khách: đó là việc anh ấy làm.' },
          { t: 'Ted <b>collects</b> stamps. → ((State/*Action))', h: 'Sưu tầm tem là việc Ted <b>làm</b>.' },
          { t: 'Molly <b>{{own|owns}}</b> that book. → ((*State/Action))', h: 'Động từ chỉ <b>sở hữu</b>.' },
          { t: 'This suitcase <b>{{weigh|weighs}}</b> 18kg. → ((*State/Action))', h: 'Nói về <b>đặc điểm</b> của cái va li (nặng bao nhiêu).' },
          { t: 'I <b>don’t believe</b> you. → ((*State/Action))', h: 'Động từ chỉ <b>niềm tin, ý kiến</b>.' },
          { t: 'They <b>weigh</b> all the bags at the airport. → ((State/*Action))', h: 'Ở sân bay, người ta <b>cân</b> túi: đó là việc họ làm.' },
        ] },

      /* Bài 6 (sách Ex 9) – chọn đơn / tiếp diễn */
      { id: '9', type: 'list',
        title: 'Choose the correct option',
        how: 'Tap the correct option.',
        examples: [ '((*Do you {{realize}}/Are you realizing)) what time it is?' ],
        items: [
          { t: 'Why ((does he taste/*is he tasting)) the soup? Is it OK?', h: 'Anh ấy <b>đang nếm thử</b> (hành động lúc này). Xem mục 4 ô Grammar.' },
          { t: 'I ((think/*’m thinking)) about learning the guitar.', h: '“think about” = đang cân nhắc trong đầu (hành động).' },
          { t: 'Look, that {{notice}} ((*says/’s saying)) ‘Please be quiet.’', h: 'Chữ viết trên tấm biển → nghĩa trạng thái.' },
          { t: 'They ((’re/*’re being)) very noisy! We don’t usually hear them.', h: 'Họ <b>cư xử</b> ồn ào khác thường, chỉ tạm thời (bình thường không vậy).' },
          { t: 'He ((has/*’s having)) lunch at the moment.', h: '“have lunch” là hành động, đang diễn ra lúc này.' },
          { t: 'I’m really sorry, but I ((*don’t understand/’m not understanding)).', h: '“understand” là động từ <b>suy nghĩ</b> → trạng thái.' },
          { t: 'I think we should give him some money. ((*Do you agree/Are you agreeing))?', h: '“agree” chỉ <b>ý kiến</b> → trạng thái.' },
          { t: 'A square ((*has/’s having)) four sides.', h: '“have” ở đây = có (đặc điểm cố định).' },
        ] },

      /* Bài 7 (sách Ex 10) – NGHE rồi điền thì + động từ (bỏ động từ cho sẵn) */
      { id: '10', type: 'text', track: 'u5-ex10',
        title: 'What’s he doing?',
        how: 'Listen to the conversation and write the missing words: the verb in the present simple or present continuous. Some gaps need more than one word.',
        paras: [
          { t: '<b>A</b> What <span class="exv">are you doing</span>?<br><b>B</b> I [[’m watching|am watching]] that man over there.<br><b>A</b> Oh yes! What [[’s he doing|is he doing]]?<br><b>B</b> I [[don’t know|do not know]].<br><b>A</b> [[Is he digging]]?<br><b>B</b> Yes, and now he [[’s jumping|is jumping]] up and down!',
            h: ['Việc B <b>đang</b> làm lúc nói.', 'Hỏi việc ông ấy <b>đang</b> làm. Nhớ trật tự câu hỏi (2 từ trở lên).', 'B không có thông tin → câu phủ định, động từ trạng thái.', 'Câu hỏi Yes/No về việc <b>đang</b> diễn ra. Bắt đầu bằng trợ động từ (3 từ).', '“now” → đang diễn ra lúc nói.'] },
          { t: '<b>A</b> Shall we go and talk to him?<br><b>B</b> That [[depends]]. [[Does he look]] happy?<br><b>A</b> Yes, I [[think]] so.',
            h: ['Ý: “còn tuỳ”. Động từ trạng thái, chủ ngữ “That”.', 'Hỏi về vẻ ngoài (trông có vẻ…): động từ trạng thái. Câu hỏi 3 từ.', '“… so” = cho rằng (ý kiến) → trạng thái.'] },
          { t: '<b>B</b> Wait a minute … He [[’s coming|is coming]] this way … He [[wants]] to talk to us … He [[’s holding|is holding]] a box in his hand …<br><b>A</b> I hope it [[contains]] {{treasure}}!',
            h: ['Ông ấy <b>đang</b> đi về phía này.', 'Chỉ <b>mong muốn</b> → trạng thái, chủ ngữ “He”.', 'Việc ông ấy <b>đang</b> làm với cái hộp.', 'Nói về thứ <b>bên trong</b> hộp → trạng thái, chủ ngữ “it”.'] },
        ] },
    ],
  },

  /* ===================== TUẦN 2 – Unit 1 ===================== */
  2: {
    code: 'Unit 1', title: 'Countable and uncountable nouns; articles',
    newWords: ['mud', 'hopes', 'drop of rain', 'matches', 'kindness', 'space', 'slice', 'spoonful', 'block', 'sadness', 'excitement', 'jar', 'energy', 'packet', 'carton', 'pollution', 'torch', 'design', 'style'],
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
        how: 'Label the pictures with the words in the box. Use <b>a</b>, <b>an</b> or a number with the countable nouns. Count the things in each picture. Use a plural form where necessary. Numbers 1–4 are topics.',
        box: ['bus', 'car', '~chair', 'boy', '{{drop of rain}}', '~{{furniture}}', 'people', '{{lorry}}', 'man', 'motorbike',
          '{{puddle}}', 'girl', 'weather', 'raincoat', 'sofa', '{{shelf}}', '~table', 'transport', 'umbrella', 'woman'],
        groups: [
          { n: '1', img: 'u1-ex2-1.jpg', head: 'furniture', rows: [
            { l: 'a', ex: 'a table' }, { l: 'b', ex: 'two chairs' },
            { l: 'c', t: '[[N:shelf/shelves=3]]' }, { l: 'd', t: '[[N:sofa/sofas=1]]' } ] },
          { n: '2', img: 'u1-ex2-2.jpg', head: '[[transport]]', h: 'Dòng số là <b>chủ đề</b> của cả tranh (giống “furniture” ở tranh 1). Tranh này có xe buýt, xe tải, ô tô… → chọn từ chung trong khung.', rows: [
            { l: 'a', t: '[[N:lorry/lorries=3]]' }, { l: 'b', t: '[[N:bus/buses=2]]' },
            { l: 'c', t: '[[N:car/cars=1]]' }, { l: 'd', t: '[[N:motorbike/motorbikes=1]]' } ] },
          { n: '3', img: 'u1-ex2-3.jpg', head: '[[weather]]', h: 'Dòng số là <b>chủ đề</b> của cả tranh. Trời đang mưa → chọn từ chung trong khung.', rows: [
            { l: 'a', t: '[[N:umbrella/umbrellas=1|3]]' }, { l: 'b', t: '[[N:raincoat/raincoats=4]]' },
            { l: 'c', t: '[[N:puddle/puddles=2|3]]' }, { l: 'd', t: '[[N:drop of rain/drops of rain=1]]' } ] },
          { n: '4', img: 'u1-ex2-4.jpg', head: '[[people]]', h: 'Dòng số là <b>chủ đề</b> của cả tranh. Tranh có đàn ông, phụ nữ, trẻ em → chọn từ chung trong khung.', rows: [
            { l: 'a', t: '[[N:man/men=2]]' }, { l: 'b', t: '[[N:boy/boys=1]]' },
            { l: 'c', t: '[[N:girl/girls=1]]' }, { l: 'd', t: '[[N:woman/women=2]]' } ] },
        ] },

      /* Exercise 4 – chọn đáp án đúng (KHÔNG nghe để kiểm tra) */
      { id: '4', type: 'list', page: 'p.7',
        title: 'Choose the correct word',
        how: 'Tap the correct option.',
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

  /* ===================== TUẦN 3 – Unit 8 ===================== */
  3: {
    code: 'Unit 8', title: 'The -ing form and the infinitive',
    newWords: ['feel like', 'washing-up', 'worth', 'own', 'promise', 'borrow', 'lie', 'refuse', 'discuss', 'imagine', 'pretend',
      'fancy', 'intend', "can't stand", 'arrange', 'manage', 'fascinating', 'explore', 'expect', 'sights', 'suggest', 'avoid'],
    // Ô Grammar: chỉ phần liên quan các bài được chọn, ví dụ KHÔNG trùng câu trong bài tập
    grammar: `
      <h4>1. V-ing</h4>
      <ul>
        <li>Làm <b>chủ ngữ</b> hoặc đứng sau <b>is</b>: <i><b>Dancing</b> is fun. My hobby is <b>drawing</b>.</i></li>
        <li>Sau <b>giới từ</b> (at, in, for, of, about…): <i>She’s good at <b>singing</b>.</i></li>
        <li><b>go</b> + V-ing (hoạt động, thể thao): <i>go fishing, go running</i></li>
        <li>Sau các cụm: <i>spend time / be busy / feel like / be used to / it’s worth</i> + V-ing</li>
        <li><b>see someone + V-ing</b>: thấy hành động <b>đang diễn ra</b> (chỉ thấy 1 phần).</li>
      </ul>
      <h4>2. V nguyên mẫu (không “to”)</h4>
      <ul>
        <li>Sau <b>can, could, must, should, will…</b>: <i>We should leave now.</i></li>
        <li><b>make / let + someone + V</b>: <i>Mum made me tidy my room. Dad lets me use his phone.</i></li>
        <li><b>see someone + V</b>: thấy <b>trọn</b> một hành động ngắn.</li>
      </ul>
      <h4>3. to + V</h4>
      <ul>
        <li>Chỉ <b>mục đích</b> (để làm gì): <i>I went to the shop <b>to buy</b> milk.</i></li>
        <li>Sau <b>tính từ</b> (easy, difficult, nice, great, OK…), có thể thêm <b>for + someone</b>: <i>It was hard <b>for us to find</b> the hotel.</i></li>
        <li><b>how / what / where + to V</b>: <i>She asked me where <b>to sit</b>.</i></li>
      </ul>
      <h4>4. Động từ + V-ing hay to + V?</h4>
      <table>
        <tr><th>+ V-ing</th><th>+ to V</th></tr>
        <tr><td>enjoy, don’t mind, can’t stand, finish, imagine, fancy, practise, miss, risk, avoid, suggest</td>
          <td>want, would like, would prefer, plan, hope, decide, arrange, promise, intend, expect, manage, need, refuse, deserve, pretend, aim, agree</td></tr>
      </table>
      <p>Dùng được cả hai, nghĩa như nhau: <b>start, like, love, hate</b>.</p>
      <p>Dùng được cả hai nhưng <b>khác nghĩa</b>:</p>
      <ul>
        <li><b>stop</b> + V-ing = ngừng làm việc đó · <b>stop</b> + to V = dừng lại <b>để</b> làm việc khác</li>
        <li><b>try</b> + to V = cố gắng làm · <b>try</b> + V-ing = làm thử xem có được không</li>
        <li><b>remember</b> + to V = nhớ phải làm (việc chưa làm) · <b>remember</b> + V-ing = nhớ là đã làm</li>
      </ul>`,
    ex: [
      /* Bài 1 (sách Ex 1) – nhìn tranh, điền V-ing */
      { id: '1', type: 'list', img: 'u8-ex1.jpg',
        title: 'What can you see?',
        how: 'Complete the sentences with the -ing forms of the verbs below.',
        box: ['{{chess|play chess}}', '{{ski}}', 'take photos', 'paint', 'swim', '{{skip}}'],
        examples: [ 'I can see someone [[painting]].' ],
        items: [
          { t: 'I can see someone [[swimming]].', h: 'Động từ 1 âm tiết, tận cùng là <b>1 nguyên âm + 1 phụ âm</b> → gấp đôi phụ âm cuối rồi thêm -ing.' },
          { t: 'I can see someone [[skiing]].', h: 'Động từ tận cùng bằng <b>-i</b> → giữ nguyên, chỉ thêm -ing.' },
          { t: 'I can see someone [[skipping]].', h: 'Động từ 1 âm tiết, tận cùng là <b>1 nguyên âm + 1 phụ âm</b> → gấp đôi phụ âm cuối rồi thêm -ing.' },
          { t: 'I can see someone [[taking photos|taking a photo|taking pictures|taking a picture]].', h: 'Viết cả cụm trong khung. Động từ tận cùng bằng <b>-e</b> → bỏ e rồi thêm -ing.' },
          { t: 'I can see two people [[playing chess]].', h: 'Viết cả cụm trong khung (động từ + danh từ), động từ thêm -ing.' },
        ] },

      /* Bài 2 (sách Ex 4) – V-ing + đọc to */
      { id: '4', type: 'list', readAloud: true,
        title: 'Complete with the -ing form',
        how: 'Complete the sentences with the -ing form of the verb in brackets.',
        examples: [ 'I’m not used to [[getting]] up before six o’clock. <span class="vb">(get)</span>' ],
        items: [
          { t: 'I {{feel like}} [[going]] for a long walk.', v: 'go', h: '“feel like” (= muốn) + dạng nào? Xem mục 1 ô Grammar.' },
          { t: 'They went [[camping]] last year.', v: 'camp', h: '<b>go</b> + hoạt động giải trí, thể thao.' },
          { t: 'I spend a lot of time [[reading]].', v: 'read', h: '<b>spend time</b> + dạng nào?' },
          { t: 'Her favourite {{pastime}} is [[collecting]] {{shells}} on the beach.', v: 'collect', h: 'Động từ đứng sau <b>is</b>, làm tên một hoạt động (như danh từ).' },
          { t: 'Jason isn’t interested in [[watching]] films.', v: 'watch', h: 'Sau <b>giới từ</b> (in, at, for…) dùng dạng nào?' },
          { t: 'I use these {{gloves}} for [[cycling]].', v: 'cycle', h: 'Sau <b>giới từ</b> “for”. Động từ tận cùng bằng <b>-e</b> → bỏ e rồi thêm -ing.' },
          { t: 'Amy saw you [[working]] in the garden.', v: 'work', h: '<b>see someone</b> + hành động <b>đang diễn ra</b>.' },
          { t: 'She was busy [[cooking]] all morning.', v: 'cook', h: '<b>be busy</b> + dạng nào?' },
          { t: 'Can you start [[doing]] the {{washing-up}}?', v: 'do', h: 'Đề bài yêu cầu dạng <b>-ing</b>.' },
          { t: 'It’s always {{worth}} [[asking]] a friend for advice.', v: 'ask', h: '<b>it’s worth</b> + dạng nào?' },
        ] },

      /* Bài 3 (sách Ex 6, đổi thành nói về bản thân + ghi âm) */
      { id: '6', type: 'speak',
        title: 'Talk about yourself',
        how: 'Finish each sentence about <b>you</b>. Say two or three things that are true for you. Use the -ing form, like the example. Record your answer.',
        prompts: [
          { lead: 'I like …', ex: 'I like meeting my friends, listening to music and kicking a ball.' },
          { lead: 'I’m not very good at …', ex: 'I’m not very good at singing, dancing or drawing.' },
          { lead: 'I don’t like …', ex: 'I don’t like cleaning my room, waiting for the bus or eating vegetables.' },
          { lead: 'I spend a lot of time …', ex: 'I spend a lot of time playing football and chatting with my friends.' },
          { lead: 'I’ve never tried …', ex: 'I’ve never tried surfing or riding a horse.' },
        ] },

      /* Bài 4 (sách Ex 7) – V-ing + ✓/✗ (không chấm) */
      { id: '7', type: 'list', tick: true,
        title: 'What’s important to you?',
        how: 'Complete the phrases with the -ing form of the verbs in the box. Then tap ✓ (important to you) or ✗ (not important).',
        box: ['be', 'do', 'have', 'have', '{{own}}', 'spend'],
        examples: [ '[[having]] lots of friends' ],
        items: [
          { t: '[[having]] one or two good friends', h: 'Động từ tận cùng bằng <b>-e</b> → bỏ e rồi thêm -ing.' },
          { t: '[[being]] healthy', h: '“healthy” là tính từ. Động từ nào trong khung đi trước tính từ?' },
          { t: '[[doing]] well at school', h: 'Cụm “___ well at school” = học tốt.' },
          { t: '[[spending]] time with your family', h: 'Cụm “___ time with…” = dành thời gian cho…' },
          { t: '[[owning]] lots of {{possessions}} (DVDs, clothes, a computer, etc.)', h: 'Có nhiều đồ đạc = <b>sở hữu</b> nhiều đồ đạc.' },
        ] },

      /* Bài 5 (sách Ex 10) – V hay to V + đọc to */
      { id: '10', type: 'list', readAloud: true,
        title: 'Choose the correct option',
        how: 'Tap the correct option.',
        examples: [ 'You must {{promise}} ((be/*to be)) careful.' ],
        items: [
          { t: 'It’s wonderful ((see/*to see)) you again.', h: 'Sau <b>tính từ</b> (wonderful, nice, easy…) dùng dạng nào? Xem mục 3 ô Grammar.' },
          { t: 'The medicine will make you ((*feel/to feel)) better.', h: '<b>make + someone</b> + dạng nào? Xem mục 2.' },
          { t: 'They’ve decided ((buy/*to buy)) a new one.', h: '“decide” là động từ về <b>kế hoạch</b>. Xem bảng ở mục 4.' },
          { t: 'Are you OK? I saw you ((*fall/to fall)).', h: 'Thấy <b>trọn</b> một hành động ngắn: <b>see someone</b> + dạng nào?' },
          { t: 'Jack let me ((*borrow/to borrow)) his coat.', h: '<b>let + someone</b> + dạng nào? Xem mục 2.' },
          { t: 'We could ((*phone/to phone)) Milly.', h: 'Sau <b>could</b> (động từ khuyết thiếu) dùng dạng nào?' },
          { t: 'I did it ((save/*to save)) time.', h: 'Câu này nói <b>mục đích</b> (làm vậy <b>để</b> làm gì).' },
          { t: 'That looks impossible ((open/*to open)).', h: 'Sau <b>tính từ</b> (impossible) dùng dạng nào?' },
          { t: 'I don’t know what ((do/*to do)).', h: '<b>what / how / where</b> + dạng nào? Xem mục 3.' },
          { t: 'It’s not easy for me ((speak/*to speak)) {{in public}}.', h: '<b>easy for + someone</b> + dạng nào?' },
        ] },

      /* Bài 6 (sách Ex 11) – V hay to V (gõ) */
      { id: '11', type: 'list',
        title: 'Infinitive with or without <i>to</i>',
        how: 'Complete the sentences with the infinitive of the verb in brackets, with or without <b>to</b>.',
        examples: [ 'Can you [[walk]] on your hands? <span class="vb">(walk)</span>' ],
        items: [
          { t: 'What are you planning [[to do]] tomorrow?', v: 'do', h: '“plan” là động từ về <b>kế hoạch</b>. Nhớ gõ cả “to” nếu cần.' },
          { t: 'Are you good at making people [[laugh]]?', v: 'laugh', h: '<b>make + someone</b> + dạng nào?' },
          { t: 'How often do you use {{chopsticks}} [[to eat]] rice or noodles?', v: 'eat', h: 'Dùng đũa <b>để</b> làm gì → câu chỉ <b>mục đích</b>.' },
          { t: 'Do you let your friends [[borrow]] your books?', v: '{{borrow}}', h: '<b>let + someone</b> + dạng nào?' },
          { t: 'Do you know how [[to cook]] pasta?', v: 'cook', h: '<b>how</b> + dạng nào?' },
          { t: 'Is it ever OK [[to lie]] to someone?', v: '{{lie}}', h: 'Sau <b>tính từ</b> (OK) dùng dạng nào?' },
          { t: 'Is it difficult for you [[to get]] up in the morning?', v: 'get', h: '<b>difficult for + someone</b> + dạng nào?' },
        ] },

      /* Bài 7 (sách Ex 14) – to V hay V-ing */
      { id: '14', type: 'list',
        title: 'Choose the correct form',
        how: 'Tap the correct form.',
        examples: [ 'She {{refuse|refuses}} ((*to {{discuss}}/discussing)) it.' ],
        items: [
          { t: 'I can’t {{imagine}} ((to live/*living)) there.', h: '“imagine” thuộc cột nào trong bảng ở mục 4 ô Grammar?' },
          { t: 'He’s {{pretend|pretending}} ((*to be/being)) sad.', h: '“pretend” thuộc cột nào trong bảng ở mục 4?' },
          { t: 'You need to {{practise}} ((to hit/*hitting)) the ball.', h: '“practise” thuộc cột nào trong bảng ở mục 4?' },
          { t: 'Do you {{fancy}} ((to meet/*meeting)) at the park?', h: '“fancy” (= muốn, thích) thuộc cột nào trong bảng ở mục 4?' },
          { t: 'I don’t {{intend}} ((*to take/taking)) the exam.', h: '“intend” (= dự định) là động từ về <b>kế hoạch</b>.' },
          { t: 'Do you promise ((*to stay/staying)) here?', h: '“promise” thuộc cột nào trong bảng ở mục 4?' },
          { t: 'He {{can\'t stand|can’t stand}} ((to wait/*waiting)) for people.', h: '“can’t stand” thuộc cột nào trong bảng ở mục 4?' },
          { t: 'Ryan has {{arrange|arranged}} ((*to visit/visiting)) them.', h: '“arrange” thuộc cột nào trong bảng ở mục 4?' },
          { t: 'I’d {{prefer}} ((*to go/going)) by bus.', h: '“would prefer” thuộc cột nào trong bảng ở mục 4?' },
        ] },

      /* Bài 8 (sách Ex 15) – dạng đúng của động từ (gõ) */
      { id: '15', type: 'list',
        title: 'Complete the sentences',
        how: 'Complete the sentences with the correct form of the verbs in brackets.',
        examples: [ 'Does Mike enjoy [[acting]]? <span class="vb">(act)</span>' ],
        items: [
          { t: 'I {{don\'t mind|don’t mind}} [[asking]] for help.', v: 'ask', h: '“don’t mind” thuộc cột nào trong bảng ở mục 4?' },
          { t: 'It’s starting [[to rain|raining]].', v: 'rain', h: '“start” đi được với cả hai dạng. Nhớ gõ cả “to” nếu dùng to V.' },
          { t: 'I think Alice {{deserve|deserves}} [[to win]].', v: 'win', h: '“deserve” thuộc cột nào trong bảng ở mục 4? Nhớ gõ cả “to” nếu cần.' },
          { t: 'He {{practise|practised}} [[writing]] his name.', v: 'write', h: '“practise” thuộc cột nào? Động từ tận cùng bằng <b>-e</b> → bỏ e rồi thêm -ing.' },
          { t: 'I hate [[being|to be]] late.', v: 'be', h: '“hate” đi được với cả hai dạng. Kiểm tra lại cách viết.' },
          { t: 'Did you {{manage}} [[to speak]] to her?', v: 'speak', h: '“manage” thuộc cột nào trong bảng ở mục 4?' },
          { t: 'We can’t {{risk}} [[stopping]] now.', v: 'stop', h: '“risk” thuộc cột nào? “stop” 1 âm tiết, tận cùng nguyên âm + phụ âm → gấp đôi phụ âm cuối.' },
          { t: 'They {{refuse|refused}} [[to give]] me a reason.', v: 'give', h: '“refuse” thuộc cột nào trong bảng ở mục 4?' },
          { t: 'Let’s stop [[talking]] about this now. We’ve said everything.', v: 'talk', h: 'Ý câu: <b>ngừng</b> nói chuyện này. Xem phần “stop” ở mục 4.' },
          { t: 'You need [[to open]] the door now.', v: 'open', h: '“need” thuộc cột nào trong bảng ở mục 4?' },
          { t: 'We tried [[switching]] the computer on and off again, but that didn’t help.', v: 'switch', h: 'Ý câu: đã <b>làm thử</b> (tắt rồi bật lại) xem có được không. Xem phần “try” ở mục 4.' },
          { t: 'We’re {{aim|aiming}} [[to leave]] at two.', v: 'leave', h: '“aim” thuộc cột nào trong bảng ở mục 4?' },
        ] },

      /* Bài 9 (sách Ex 16) – đoạn văn, 15 chỗ trống */
      { id: '16', type: 'text',
        title: 'A guide to the city',
        how: 'Complete the text with the infinitive or -ing form of the verbs in brackets.',
        paras: [
          { t: '<b class="ph">Shopping</b> – If you want <span class="exv">to go</span> [[shopping]] (shop), then it’s {{fascinating}} [[to explore]] ({{explore}}) the Riverside area. {{expect|Expect}} [[to see]] (see) high prices in the shops: this isn’t a cheap part of town! For a different shopping experience, spend some time [[walking]] (walk) around Central Market. It’s not {{worth}} [[going]] (go) after one o’clock, though. Most of the {{stalls}} start closing at midday. At the Crafts Centre there are shops and {{workshops}} where you can [[see]] (see) people [[making|make]] (make) {{ceramics}} and {{jewellery}}.',
            h: ['<b>go</b> + hoạt động mua sắm, giải trí.', 'Sau <b>tính từ</b> (fascinating) dùng dạng nào?', '“expect” thuộc cột nào trong bảng ở mục 4?', '<b>spend time</b> + dạng nào?', '<b>it’s (not) worth</b> + dạng nào?', 'Sau <b>can</b> (động từ khuyết thiếu) dùng dạng nào?', 'Thấy người ta <b>đang</b> làm (chỉ thấy 1 phần hành động).'] },
          { t: '<b class="ph">Transport</b> – [[travelling|traveling]] (travel) by {{underground}} is expensive, and you’ll miss [[seeing]] (see) many interesting {{sights}}. We {{suggest}} [[taking]] (take) the bus or the tram. The water taxis are also an excellent way of [[getting]] (get) {{get about|about}}.',
            h: ['Động từ làm <b>chủ ngữ</b> của câu. Viết hoa chữ đầu không bắt buộc.', '“miss” thuộc cột nào trong bảng ở mục 4?', '“suggest” thuộc cột nào trong bảng ở mục 4?', 'Sau <b>giới từ</b> “of” dùng dạng nào?'] },
          { t: '<b class="ph">Security</b> – {{avoid|Avoid}} [[walking]] (walk) around the city on your own late at night. Remember [[to keep]] (keep) your {{identity card}} with you at all times.',
            h: ['“avoid” thuộc cột nào trong bảng ở mục 4?', 'Đây là lời <b>nhắc phải làm</b>. Xem phần “remember” ở mục 4.'] },
          { t: '<b class="ph">Would you like [[to know]] (know) more?</b> – Visit our website [[to read]] (read) about the history of this exciting city.',
            h: ['“would like” thuộc cột nào trong bảng ở mục 4?', 'Vào website <b>để</b> làm gì → câu chỉ <b>mục đích</b>.'] },
        ] },
    ],
  },
};

/* =====================================================================
   NHIỆM VỤ TỪ VỰNG (?w=tuần&m=vocab) – sách English Vocabulary in Use Pre-intermediate
   Các bước: 1 đọc truyện + bấm từ vàng xem nghĩa + chép vở → 4 vòng game
   (Recognition · Meaning recall · Form recall · Context) → mở Flashcards ôn lại.
   Mỗi thẻ: k = khoá (dùng trong truyện {{k|chữ hiện}}), w = chữ hiện trên thẻ, say = chữ máy đọc,
     ipa, vi = nghĩa, en = định nghĩa dễ, ex = câu ví dụ (vòng nhớ nghĩa + flashcard),
     f = mẫu vòng gõ từ ({…} = phần em phải gõ; fa = cách viết khác được chấp nhận),
     c = câu vòng Context ([[đáp án|cách khác]], có thể kèm gợi ý trong ngoặc ở cuối).
   Câu ví dụ / câu Context KHÔNG trùng câu trong truyện.
   ===================================================================== */
const VOCAB_LESSONS = {
  1: {
    code: 'Unit 14', title: 'Growing up', book: 'English Vocabulary in Use Pre-intermediate',
    story: {
      title: 'Three generations, one house',
      paras: [
        'Hi, I’m Linh. I’m sixteen, so I’m {{in your teens|in my teens}}. I live in Da Nang with my parents and my grandmother. My aunt Mai is only {{in my early twenties|in her early twenties}}, so she feels more like a big sister than an aunt. She often brings her son Bao to our house. Bao is a {{toddler}}: he’s two, he can walk, but he falls over all the time!',
        'My parents are {{in their mid-fifties}}. Mum was {{nearly / almost|nearly}} forty when I was born. Dad says he feels {{middle-aged}} because his back hurts after football. Mum works in a hospital, and she wants to work for {{approximately / roughly|roughly}} ten more years before her {{retirement}}.',
        'My grandmother is {{in her late seventies}}. She is {{retired}} now, but she was a nurse for {{nearly / almost|almost}} forty years. She says life for {{the elderly}} can be lonely, so she is happy to live with us. My grandfather {{die|died}} when I was a baby. Grandma keeps his photo on the wall and says, ‘He’s {{dead ≠ alive|dead}}, but he’s still {{dead ≠ alive|alive}} in my stories.’',
        'Grandma had a very different {{childhood}}. She was {{bring up|brought up}} in a small village, and her parents were very {{strict}}. They didn’t {{allow sb to do sth|allow her to go}} to school after the age of twelve. {{at first|At first}} she was very sad, but she studied at home every night. {{in the end|In the end}}, she {{manage to do sth|managed to pass}} the nursing exam and moved to the city. There she met {{a 30-year-old man}} who worked at the hospital: my grandfather!',
        'Now it’s my turn. My parents are not as strict as Grandma’s parents. I’m {{be allowed to|allowed to}} go out with my friends at the weekend, and they {{let sb do sth|let me choose}} my own clothes. But I can’t {{stay out late}}. The bus home takes {{approximately / roughly|approximately}} forty minutes, so I have to leave the café by half past nine. When I complain, Grandma just laughs: ‘When I was your age, I was in bed by eight!’',
      ],
    },
    cards: [
      { k: 'toddler', w: 'toddler', ipa: '/ˈtɒdlə/', vi: 'trẻ mới biết đi (1–3 tuổi)', en: 'a young child (1–3) who is learning to walk',
        ex: 'The toddler held his mum’s hand and took a few steps.', f: '{toddler}',
        c: 'My cousin is two, so she’s a [[toddler]] – she has just learned to walk.' },
      { k: 'childhood', w: 'childhood', ipa: '/ˈtʃaɪldhʊd/', vi: 'thời thơ ấu', en: 'the time when you are a child',
        ex: 'I have lots of happy memories of my childhood.', f: '{childhood}',
        c: 'He spent his [[childhood]] in the countryside, so he loves nature.' },
      { k: 'in your teens', w: 'in your teens', ipa: '/ɪn jɔː tiːnz/', vi: 'ở tuổi thiếu niên (13–19 tuổi)', en: 'between 13 and 19 years old',
        ex: 'She started playing the guitar when she was in her teens.', f: 'in your {teens}', fa: ['in your teens', 'in my teens'],
        c: 'Most of my classmates are sixteen or seventeen – we’re all [[in our teens]].' },
      { k: 'middle-aged', w: 'middle-aged', ipa: '/ˌmɪdl ˈeɪdʒd/', vi: 'trung niên (khoảng 40–60 tuổi)', en: 'about 40 to 60 years old',
        ex: 'A middle-aged man was reading a newspaper on the bus.', f: '{middle-aged}',
        c: 'My uncle is 48. He’s [[middle-aged]], but he still plays football every week.' },
      { k: 'retirement', w: 'retirement', ipa: '/rɪˈtaɪəmənt/', vi: 'sự nghỉ hưu, thời kỳ nghỉ hưu', en: 'the time when you stop working because of your age',
        ex: 'After his retirement, my grandfather started growing vegetables.', f: '{retirement} (noun)',
        c: 'My aunt wants to travel around the world after her [[retirement]].' },
      { k: 'retired', w: 'retired', ipa: '/rɪˈtaɪəd/', vi: 'đã nghỉ hưu', en: 'not working any more because of your age',
        ex: 'My grandparents are retired, so they have lots of free time.', f: '{retired} (adjective)',
        c: 'Mr Lam doesn’t teach any more – he’s [[retired]] now.' },
      { k: 'the elderly', w: 'the elderly', ipa: '/ði ˈeldəli/', vi: 'người cao tuổi', en: 'old people',
        ex: 'The city has free buses for the elderly.', f: 'the {elderly}', fa: ['the elderly'],
        c: 'Our class visits a home for [[the elderly]] every Tet holiday.' },
      { k: 'in my early twenties', w: 'in my early twenties', ipa: '/ˈɜːli ˈtwentiz/', vi: 'khoảng 21–23 tuổi', en: 'about 21, 22 or 23 years old',
        ex: 'She moved to Hanoi when she was in her early twenties.', f: 'in my {early twenties}', fa: ['in my early twenties'],
        c: 'Lan is 22, so she’s [[in her early twenties]].' },
      { k: 'in their mid-fifties', w: 'in their mid-fifties', ipa: '/mɪd ˈfɪftiz/', vi: 'khoảng 54–56 tuổi', en: 'about 54, 55 or 56 years old',
        ex: 'The couple next door are in their mid-fifties.', f: 'in their {mid-fifties}', fa: ['in their mid-fifties'],
        c: 'Both of my parents are 55 – they’re [[in their mid-fifties]].' },
      { k: 'in her late seventies', w: 'in her late seventies', ipa: '/leɪt ˈsevntiz/', vi: 'khoảng 77–79 tuổi', en: 'about 77, 78 or 79 years old',
        ex: 'My great-aunt is in her late seventies, but she still cycles to the market.', f: 'in her {late seventies}', fa: ['in her late seventies'],
        c: 'Grandpa is 78, so he’s [[in his late seventies]].' },
      { k: 'nearly / almost', w: 'nearly = almost', say: 'nearly, almost', ipa: '/ˈnɪəli/ = /ˈɔːlməʊst/', vi: 'gần, gần như (chưa đến hẳn)', en: 'a little less than; not quite',
        ex: 'It’s nearly midnight – go to bed!', f: '{nearly} = almost', fa: ['almost'],
        c: 'Hurry up! The film starts at eight, and it’s [[nearly|almost]] eight o’clock now.' },
      { k: 'approximately / roughly', w: 'approximately = roughly', say: 'approximately, roughly', ipa: '/əˈprɒksɪmətli/ = /ˈrʌfli/', vi: 'khoảng, xấp xỉ', en: 'about; more or less (not exactly)',
        ex: 'The journey takes roughly three hours.', f: '{roughly} = approximately', fa: ['approximately'],
        c: 'There were [[approximately|roughly]] 200 people at the concert – maybe a few more.' },
      { k: 'a 30-year-old man', w: 'a 30-year-old man', say: 'a thirty-year-old man', ipa: '/ˈθɜːti jɪər əʊld/', vi: 'một người đàn ông 30 tuổi', en: 'a man who is 30 (year, NOT years)',
        ex: 'A 15-year-old girl won the singing competition.', f: 'a 30-{year-old} man', fa: ['a 30-year-old man', '30-year-old'],
        c: 'The winner was a [[16-year-old|sixteen-year-old]] student from Hue. (16)' },
      { k: 'dead ≠ alive', w: 'dead ≠ alive', say: 'dead, alive', ipa: '/ded/ ≠ /əˈlaɪv/', vi: 'đã chết ≠ còn sống', en: 'dead = not living; alive = living',
        ex: 'Are your great-grandparents still alive?', f: '{alive} (≠ dead)',
        c: '‘Is your great-grandfather still [[alive]]?’ ‘No, he died last year.’' },
      { k: 'die', w: 'die', ipa: '/daɪ/', vi: 'chết, qua đời (quá khứ: died)', en: 'to stop living (past: died)',
        ex: 'Many plants die in winter.', f: '{die} (verb)',
        c: 'My great-grandmother [[died]] in 2015, when I was five. (die)' },
      { k: 'bring up', w: 'bring up', ipa: '/brɪŋ ʌp/', vi: 'nuôi nấng, nuôi dạy (quá khứ: brought up)', en: 'to look after a child until he or she is an adult (past: brought up)',
        ex: 'She was brought up by her aunt in Hue.', f: '{bring up}',
        c: 'I was [[brought up]] by my grandparents because my parents worked abroad. (bring up)' },
      { k: 'strict', w: 'strict', ipa: '/strɪkt/', vi: 'nghiêm khắc', en: 'making people obey rules',
        ex: 'Our maths teacher is very strict – nobody talks in her class.', f: '{strict}',
        c: 'My parents are quite [[strict]]: I can’t use my phone after 9 p.m.' },
      { k: 'allow sb to do sth', w: 'allow sb to do sth', say: 'allow somebody to do something', ipa: '/əˈlaʊ/', vi: 'cho phép ai làm gì', en: 'to give somebody permission to do something',
        ex: 'Our teacher allows us to use dictionaries in class.', f: '{allow} sb to do sth',
        c: 'The museum doesn’t [[allow]] visitors to take photos.' },
      { k: 'in the end', w: 'in the end', ipa: '/ɪn ði end/', vi: 'cuối cùng (sau một thời gian dài / nhiều suy nghĩ)', en: 'finally, after a lot of time or thought',
        ex: 'We waited for an hour, and in the end the bus came.', f: '{in the end}',
        c: 'We couldn’t decide where to eat. [[In the end]], we ordered pizza at home.' },
      { k: 'at first', w: 'at first', ipa: '/ət ˈfɜːst/', vi: 'lúc đầu, ban đầu', en: 'at the beginning',
        ex: 'At first I didn’t like coffee, but now I love it.', f: '{at first}',
        c: '[[At first]] the new school was scary, but now I have lots of friends.' },
      { k: 'manage to do sth', w: 'manage to do sth', say: 'manage to do something', ipa: '/ˈmænɪdʒ/', vi: 'xoay xở làm được việc gì (dù khó)', en: 'to be able to do something difficult',
        ex: 'The test was hard, but I managed to finish it.', f: '{manage} to do sth',
        c: 'The exam was really difficult, but I [[managed]] to pass it. (manage)' },
      { k: 'be allowed to', w: 'be allowed to', ipa: '/bi əˈlaʊd tə/', vi: 'được phép (làm gì)', en: 'to have permission to do something',
        ex: 'Students are not allowed to use phones in the exam.', f: 'be {allowed} to', fa: ['be allowed to'],
        c: 'When I was ten, I [[wasn’t allowed|was not allowed]] to go to the park alone. (not)' },
      { k: 'let sb do sth', w: 'let sb do sth', say: 'let somebody do something', ipa: '/let/', vi: 'để cho ai làm gì (quá khứ: let)', en: 'to allow somebody to do something (no “to”)',
        ex: 'My mum lets me cook dinner on Sundays.', f: '{let} sb do sth',
        c: 'Dad [[lets]] me play video games for an hour after homework. (every day)' },
      { k: 'stay out late', w: 'stay out late', ipa: '/steɪ aʊt leɪt/', vi: 'đi chơi về muộn', en: 'not to come home until late at night',
        ex: 'My parents don’t like it when I stay out late on school nights.', f: '{stay out late}',
        c: 'It’s a school day tomorrow, so don’t [[stay out late]] tonight!' },
    ],
  },
};
// thẻ từ vựng → VOCAB (để tô vàng trong truyện và bấm xem nghĩa)
Object.values(VOCAB_LESSONS).forEach(V => V.cards.forEach(c => { VOCAB[c.k] = { w: c.say || c.w, ipa: c.ipa, vi: c.vi }; }));
