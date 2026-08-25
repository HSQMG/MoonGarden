const milestones = [
  { year: '2001', title: 'Một cô gái nhỏ ra đời', text: 'Ngày thế giới bỗng có thêm một người thật đặc biệt.', icon: '✦' },
  { year: '2019', title: 'Bước qua tuổi mười tám', text: 'Mang theo những ước mơ đầu tiên và bắt đầu hành trình của riêng mình.', icon: '☼' },
  { year: '2022', title: 'Chuyến đi đáng nhớ', text: 'Lần đầu chạm vào một vùng đất mới, gom nắng và gió vào ký ức.', icon: '⌁' },
  { year: '2024', title: 'Ngày mình biết đến em', text: 'Một cột mốc bé thôi, nhưng lại khiến thế giới của ai đó đổi khác.', icon: '♡' },
];

const places = [
  { city: 'Đà Lạt', note: 'Thành phố của sương và những chiều thật chậm', number: '01', tone: 'lavender' },
  { city: 'Đà Nẵng', note: 'Nơi biển xanh giữ lại tiếng cười trong veo', number: '02', tone: 'blue' },
  { city: 'Hội An', note: 'Một tối đèn lồng, một miền ký ức màu mật ong', number: '03', tone: 'amber' },
];

export default function Home() {
  return (
    <main>
      <nav className="nav" aria-label="Điều hướng chính">
        <a className="brand" href="#top">Hành trình của em <span>♡</span></a>
        <div className="navLinks"><a href="#about">Về em</a><a href="#timeline">Dấu mốc</a><a href="#places">Những nơi đã qua</a></div>
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
        <div className="portraitCard" aria-label="Vị trí dành cho ảnh chân dung"><div className="portraitGlow" /><div className="flower">❀</div><p>Ảnh của cô ấy</p><small>Bạn có thể thay ảnh thật tại đây</small></div>
        <div className="aboutCopy">
          <p className="script">Nếu phải kể về em...</p><h2>Em là một bản nhạc<br />dịu dàng giữa thành phố vội.</h2>
          <p>Có một cô gái yêu những buổi chiều có gió, thích nhâm nhi ly cà phê thật lâu và luôn mỉm cười khi nhìn thấy hoa nở. Em không cần làm điều gì quá lớn lao — chỉ cần là chính em, đã đủ khiến một ngày trở nên đáng nhớ.</p>
          <div className="traits"><span>☕ Cà phê sữa</span><span>☁ Những ngày mưa</span><span>♫ Nhạc dịu dàng</span><span>✿ Hoa cúc trắng</span></div>
        </div>
      </section>

      <section className="timelineSection" id="timeline">
        <div className="sectionHead"><div className="sectionLabel light"><span>02</span> NHỮNG DẤU MỐC</div><h2>Mỗi chặng đường<br /><i>đều làm nên em hôm nay.</i></h2></div>
        <div className="timeline">{milestones.map((item, index) => <article className={`milestone ${index % 2 ? 'right' : ''}`} key={item.year}><div className="milestoneIcon">{item.icon}</div><div className="milestoneCard"><time>{item.year}</time><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div>
      </section>

      <section className="places section" id="places">
        <div className="placesIntro"><div className="sectionLabel"><span>03</span> NHỮNG NƠI ĐÃ QUA</div><h2>Thế giới qua<br />đôi mắt của em.</h2><p>Mỗi vùng đất là một trang nhật ký, mỗi chuyến đi lại có một phiên bản thật khác của em.</p></div>
        <div className="placeGrid">{places.map((place) => <article className={`placeCard ${place.tone}`} key={place.city}><div className="placeArt"><span>{place.number}</span><b>⌖</b></div><div><p>VIỆT NAM</p><h3>{place.city}</h3><span>{place.note}</span></div></article>)}</div>
      </section>

      <section className="letter" id="letter"><div className="letterPaper"><span className="tape" /><p className="script">Gửi em,</p><h2>Cảm ơn em vì đã xuất hiện.</h2><p>Có thể em chưa từng biết, nhưng sự hiện diện của em đã khiến rất nhiều khoảnh khắc bình thường trở nên có ý nghĩa. Trang nhỏ này chỉ là cách ai đó muốn lưu lại những điều đẹp đẽ về em.</p><p className="signature">— Từ một người luôn âm thầm dõi theo em ♡</p></div></section>
      <footer><p>Được tạo bằng tất cả sự chân thành</p><span>✦ 2026 ✦</span></footer>
    </main>
  );
}
