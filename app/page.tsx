const milestones = [
  { year: '2001', title: 'Một cô gái nhỏ ra đời', text: 'Ngày thế giới bỗng có thêm một người thật đặc biệt.', icon: '✦', media: 'Ảnh tuổi thơ', type: 'ẢNH' },
  { year: '2019', title: 'Bước qua tuổi mười tám', text: 'Mang theo những ước mơ đầu tiên và bắt đầu hành trình của riêng mình.', icon: '☼', media: 'Khoảnh khắc tuổi 18', type: 'VIDEO' },
  { year: '2022', title: 'Chuyến đi đáng nhớ', text: 'Lần đầu chạm vào một vùng đất mới, gom nắng và gió vào ký ức.', icon: '⌁', media: 'Kỷ niệm của chuyến đi', type: 'ẢNH' },
  { year: '2024', title: 'Ngày mình biết đến em', text: 'Một cột mốc bé thôi, nhưng lại khiến thế giới của ai đó đổi khác.', icon: '♡', media: 'Một đoạn phim rất riêng', type: 'VIDEO' },
];

const friendTrips = [
  { date: '12 · 03 · 2023', title: 'Một ngày trốn phố', friends: 'Cùng hội bạn thân', caption: 'Chuyến đi ngẫu hứng, những câu chuyện không đầu không cuối và thật nhiều tiếng cười.', tone: 'lavender', type: 'BỘ ẢNH', symbol: '☼' },
  { date: '27 · 08 · 2024', title: 'Hẹn nhau bên biển', friends: 'Cùng những người bạn đại học', caption: 'Chiều hôm ấy, biển xanh và tuổi trẻ dường như đều không có điểm dừng.', tone: 'blue', type: 'VIDEO', symbol: '▶' },
  { date: '05 · 01 · 2025', title: 'Chuyến đi đầu năm', friends: 'Cùng nhóm bạn thân', caption: 'Một khởi đầu mới được đánh dấu bằng nắng, gió và những người luôn ở bên.', tone: 'amber', type: 'ẢNH', symbol: '✦' },
];

export default function Home() {
  return (
    <main>
      <nav className="nav" aria-label="Điều hướng chính">
        <a className="brand" href="#top">Hành trình của em <span>♡</span></a>
        <div className="navLinks"><a href="#about">Về em</a><a href="#timeline">Chặng đường</a><a href="#friends">Bạn bè</a></div>
        <a className="navHeart" href="#letter" aria-label="Đến lời nhắn">♡</a>
      </nav>

      <section className="hero" id="top">
        <div className="heroOrb orbOne" /><div className="heroOrb orbTwo" />
        <p className="eyebrow">Một nơi nhỏ dành riêng cho</p>
        <h1>cô gái mang nắng<br />vào những ngày thường.</h1>
        <p className="heroText">Có những người ta gặp không phải để lướt qua,<br className="desktop" /> mà để âm thầm ghi nhớ từng điều bé xíu.</p>
        <a className="scrollCue" href="#about"><span>Khám phá câu chuyện</span><b>↓</b></a>
        <div className="doodle starA">✦</div><div className="doodle starB">✧</div>
      </section>

      <section className="about section" id="about">
        <div className="sectionLabel"><span>01</span> VỀ EM</div>
        <div className="portraitCard" aria-label="Vị trí dành cho ảnh chân dung"><div className="portraitGlow" /><div className="flower">❀</div><p>Ảnh của cô ấy</p><small>Thay bằng ảnh chân dung tại đây</small></div>
        <div className="aboutCopy">
          <p className="script">Nếu phải kể về em...</p><h2>Em là một bản nhạc<br />dịu dàng giữa thành phố vội.</h2>
          <dl className="profileFacts">
            <div><dt>Họ và tên</dt><dd>Tên của cô ấy</dd></div>
            <div><dt>Tuổi</dt><dd>00 tuổi</dd></div>
            <div><dt>Công việc</dt><dd>Công việc của cô ấy</dd></div>
          </dl>
          <p>Có một cô gái yêu những buổi chiều có gió, thích nhâm nhi ly cà phê thật lâu và luôn mỉm cười khi nhìn thấy hoa nở. Chỉ cần là chính em, đã đủ khiến một ngày trở nên đáng nhớ.</p>
          <div className="traits"><span>☕ Cà phê sữa</span><span>☁ Những ngày mưa</span><span>♫ Nhạc dịu dàng</span><span>✿ Hoa cúc trắng</span></div>
        </div>
      </section>

      <section className="timelineSection" id="timeline">
        <div className="sectionHead"><div className="sectionLabel light"><span>02</span> NHỮNG CHẶNG ĐƯỜNG</div><h2>Mỗi chặng đường<br /><i>đều làm nên em hôm nay.</i></h2></div>
        <div className="timeline">{milestones.map((item, index) => (
          <article className={`milestone ${index % 2 ? 'right' : ''}`} key={item.year}>
            <div className="milestoneIcon">{item.icon}</div>
            <div className="milestoneCard">
              <div className="milestoneMedia"><span>{item.type}</span><b>{item.type === 'VIDEO' ? '▶' : '▧'}</b><small>{item.media}</small></div>
              <time>{item.year}</time><h3>{item.title}</h3><p>{item.text}</p>
            </div>
          </article>
        ))}</div>
      </section>

      <section className="friends section" id="friends">
        <div className="friendsIntro"><div className="sectionLabel"><span>03</span> NHỮNG LẦN ĐI CÙNG BẠN BÈ</div><h2>Đi cùng nhau,<br />nhớ cùng nhau.</h2><p>Không chỉ là nơi đã đến, điều đáng nhớ nhất luôn là những người đã có mặt trong hành trình ấy.</p></div>
        <div className="tripGrid">{friendTrips.map((trip, index) => (
          <article className={`tripCard ${trip.tone}`} key={trip.date}>
            <div className="tripMedia"><span className="tripIndex">0{index + 1}</span><b>{trip.symbol}</b><span className="mediaType">{trip.type}</span></div>
            <div className="tripCopy"><time>{trip.date}</time><h3>{trip.title}</h3><p className="friendsWith">{trip.friends}</p><p>{trip.caption}</p><small>Chú thích cho ảnh / video</small></div>
          </article>
        ))}</div>
      </section>

      <section className="letter" id="letter"><div className="letterPaper"><span className="tape" /><p className="script">Gửi em,</p><h2>Cảm ơn em vì đã xuất hiện.</h2><p>Có thể em chưa từng biết, nhưng sự hiện diện của em đã khiến rất nhiều khoảnh khắc bình thường trở nên có ý nghĩa. Trang nhỏ này chỉ là cách ai đó muốn lưu lại những điều đẹp đẽ về em.</p><p className="signature">— Từ một người luôn âm thầm dõi theo em ♡</p></div></section>
      <footer><p>Được tạo bằng tất cả sự chân thành</p><span>✦ 2026 ✦</span></footer>
    </main>
  );
}
