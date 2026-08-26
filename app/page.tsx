'use client';

import { useEffect, useState } from 'react';
import { Camera, Cat, ChevronLeft, ChevronRight, Flower2, Headphones, Images, Mic2, Play, Sprout, Trees, Upload, Utensils, X } from 'lucide-react';

const milestones = [
  {
    year: '2003',
    title: 'Một cô gái nhỏ ra đời',
    text: 'Ngày thế giới bỗng có thêm một người thật đặc biệt.',
    icon: '✦',
    media: [
      {
        type: 'image',
        src: '/images/avatar/vy.jpg',
        caption: 'Một bức ảnh đáng nhớ của Vy',
      },
    ],
  },
  {
    year: '2018', title: 'Bước qua tuổi mười tám', text: 'Mang theo những ước mơ đầu tiên và bắt đầu hành trình của riêng mình.', icon: '☼',
    media: [{ type: 'image', src: '/images/year-2018/img_01.jpg', caption: 'Khoảnh khắc tuổi 18' }],
  },
  {
    year: '2021', title: 'Tốt nghiệp trung học phổ thông', text: 'Trưởng thành hơn mỗi ngày.', icon: '⌁',
    media: [{ type: 'image', src: '/images/year-2021/img_01.jpg', caption: 'Cô gái năm ấy đã trưởng thành.' }],
  },
  {
    year: '2021', title: 'Bắt đầu một hành trình mới ở cấp bậc đại học', text: 'Cô ấy đã bắt đầu một chặng đường mới đầy hứa hẹn.', icon: '♡',
    media: [{ type: 'image', src: '/images/year-2021/img_02.jpg', caption: 'Một cột mốc quan trọng cho một hành trình mới.' }],
  },
  {
    year: '2025', title: 'Tốt nghiệp đại học', text: 'Cô ấy đã hoàn thành chặng đường học tập đầy thử thách.', icon: '⌁',
    media: [{ type: 'image', src: '/images/year-2025/img_01.jpg', caption: 'Khoảnh khắc tốt nghiệp là một cột mốc quan trọng.' }],
  },
];

const friendTrips = [
  {
    date: "12 · 03 · 2023",
    title: "Một ngày trốn phố",
    friends: "Cùng hội bạn thân",
    caption:
      "Chuyến đi ngẫu hứng, những câu chuyện không đầu không cuối và thật nhiều tiếng cười.",
    tone: "lavender",
  },
  {
    date: "27 · 08 · 2024",
    title: "Hẹn nhau bên biển",
    friends: "Cùng những người bạn đại học",
    caption:
      "Chiều hôm ấy, biển xanh và tuổi trẻ dường như đều không có điểm dừng.",
    tone: "blue",
  },
  {
    date: "05 · 01 · 2025",
    title: "Chuyến đi đầu năm",
    friends: "Cùng nhóm bạn thân",
    caption:
      "Một khởi đầu mới được đánh dấu bằng nắng, gió và những người luôn ở bên.",
    tone: "amber",
  },
];

type TripMedia = { key: string; tripIndex: number; type: 'image' | 'video'; url: string };

export default function Home() {
  const [viewer, setViewer] = useState<{ tripIndex: number; mediaIndex: number } | null>(null);
  const [tripMedia, setTripMedia] = useState<Record<number, TripMedia[]>>({});
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');
  const activeTrip = viewer ? friendTrips[viewer.tripIndex] : null;
  const activeList = viewer ? (tripMedia[viewer.tripIndex] || []) : [];
  const activeMedia = viewer ? activeList[viewer.mediaIndex] : null;

  const loadMedia = async () => {
    const response = await fetch('/api/trip-media', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json() as { media: TripMedia[] };
    const grouped: Record<number, TripMedia[]> = {};
    for (const media of data.media) (grouped[media.tripIndex] ||= []).push(media);
    setTripMedia(grouped);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadMedia(); }, []);

  const uploadMedia = async (tripIndex: number, files: FileList | null) => {
    if (!files?.length) return;
    setUploading(tripIndex);
    setUploadError('');
    const form = new FormData();
    form.append('tripIndex', String(tripIndex));
    Array.from(files).forEach((file) => form.append('files', file));
    try {
      const response = await fetch('/api/trip-media', { method: 'POST', body: form });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Không thể tải tệp lên.');
      await loadMedia();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Không thể tải tệp lên.');
    } finally {
      setUploading(null);
    }
  };

  const changeMedia = (direction: number) => {
    setViewer((current) => {
      if (!current) return null;
      const total = (tripMedia[current.tripIndex] || []).length;
      return { ...current, mediaIndex: (current.mediaIndex + direction + total) % total };
    });
  };

  useEffect(() => {
    if (!viewer) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewer(null);
      if (event.key === 'ArrowLeft') changeMedia(-1);
      if (event.key === 'ArrowRight') changeMedia(1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [viewer]);

  return (
    <main>
      <nav className="nav" aria-label="Điều hướng chính">
        <a className="brand" href="#top"><span className="brandMark">V</span><span className="brandWords"><small>Một câu chuyện dành riêng cho</small>Hành trình của Vy</span></a>
        <div className="navLinks"><a href="#about"><span>01</span> Về Vy</a><a href="#timeline"><span>02</span> Chặng đường</a><a href="#friends"><span>03</span> Bạn bè</a></div>
      </nav>

      <section className="hero" id="top">
        <div className="heroOrb orbOne" /><div className="heroOrb orbTwo" />
        <p className="eyebrow">Một nơi nhỏ dành riêng cho người đặc biệt</p>
        <h1>cô gái mang nắng<br />vào những ngày bình thường.</h1>
        <p className="heroText">Có những người ta gặp không phải để lướt qua,<br className="desktop" /> mà để âm thầm ghi nhớ từng điều bé xíu.</p>
        <a className="scrollCue" href="#about"><span>Khám phá câu chuyện</span><b>↓</b></a>
        <div className="doodle starA">✦</div><div className="doodle starB">✧</div>
      </section>

      <section className="about section" id="about">
        <div className="sectionLabel"><span>01</span> VỀ VY</div>
        <div className="portraitCard" aria-label="Ảnh chân dung của Vy">
          <img
            src="/images/avatar/vy.jpg"
            alt="Ảnh của Vy"
            className="portraitImage"
          />
        </div>
        <div className="aboutCopy">
          <p className="script">Nếu phải kể về cô ấy...</p><h2>Cô ấy là một bản nhạc<br />dịu dàng giữa thành phố vội.</h2>
          <dl className="profileFacts">
            <div><dt>Họ và tên</dt><dd>Hoàng Thuỵ Thuý Vy</dd></div>
            <div><dt>Biệt danh</dt><dd>MoonGarden</dd></div>
            <div><dt>Ngày sinh</dt><dd>15 tháng 3, 2003</dd></div>
            <div><dt>Tuổi</dt><dd>23 tuổi</dd></div>
            <div><dt>Công việc</dt><dd>Content Creator</dd></div>
            <div><dt>Nơi làm việc</dt><dd>TP. Hồ Chí Minh</dd></div>
          </dl>
          <p>Cô ấy yêu những buổi chiều có gió, thích nhâm nhi một ly cà phê thật lâu và luôn mỉm cười khi nhìn thấy hoa nở. Chỉ cần cô ấy là chính mình cũng đã đủ khiến một ngày trở nên đáng nhớ.</p>
          <div className="traits">
            <span><Utensils aria-hidden="true" />Ăn uống</span>
            <span><Cat aria-hidden="true" />Nuôi mèo</span>
            <span><Sprout aria-hidden="true" />Trồng sen</span>
            <span><Camera aria-hidden="true" />Chụp hình</span>
            <span><Mic2 aria-hidden="true" />Hát hay</span>
            <span><Headphones aria-hidden="true" />Nghe nhạc</span>
            <span><Flower2 aria-hidden="true" />Hoa</span>
            <span><Trees aria-hidden="true" />Đi công viên</span>
          </div>
        </div>
      </section>

      <section className="timelineSection" id="timeline">
        <div className="sectionHead"><div className="sectionLabel light"><span>02</span> NHỮNG CHẶNG ĐƯỜNG</div><h2>Mỗi chặng đường<br /><i>đều làm nên Vy của hôm nay.</i></h2></div>
        <div className="timeline">{milestones.map((item, index) => (
          <article className={`milestone ${index % 2 ? 'right' : ''}`} key={item.year}>
            <div className="milestoneIcon">{item.icon}</div>
            <div className="milestoneCard">
              <div className="milestoneGallery">
                {item.media.slice(0, 1).map((media) => (
                  <figure className="milestoneMedia" key={item.year}>
                    {media.src ? (
                      <img src={media.src} alt={media.caption} loading="lazy" />
                    ) : (
                      <div className="mediaPlaceholder" aria-label="Vị trí thêm ảnh">
                        <span>ẢNH</span>
                        <b>▧</b>
                      </div>
                    )}
                    <figcaption>{media.caption}</figcaption>
                  </figure>
                ))}
              </div>
              <time>{item.year}</time><h3>{item.title}</h3><p>{item.text}</p>
            </div>
          </article>
        ))}</div>
      </section>

      <section className="friends section" id="friends">
        <div className="friendsIntro"><div className="sectionLabel"><span>03</span> NHỮNG LẦN ĐI CÙNG BẠN BÈ</div><h2>Đi cùng nhau,<br />nhớ cùng nhau.</h2><p>Không chỉ là nơi đã đến, điều đáng nhớ nhất luôn là những người đã có mặt trong hành trình ấy.</p></div>
        {uploadError && <p className="uploadError" role="alert">{uploadError}</p>}
        <div className="tripGrid">{friendTrips.map((trip, index) => {
          const media = tripMedia[index] || [];
          return (
            <article className={`tripCard ${trip.tone}`} key={trip.date}>
              <button className="tripMedia" type="button" disabled={!media.length} onClick={() => setViewer({ tripIndex: index, mediaIndex: 0 })} aria-label={media.length ? `Xem ${media.length} ảnh và video của ${trip.title}` : `Chưa có media cho ${trip.title}`}>
                <span className="tripIndex">0{index + 1}</span>
                {media[0]?.type === 'image' ? <img src={media[0].url} alt="" /> : media[0]?.type === 'video' ? <Play aria-hidden="true" /> : <Images aria-hidden="true" />}
                <span className="mediaType"><Images aria-hidden="true" />{media.length} mục</span>
                {media.length > 0 && <span className="openGallery">Nhấn để xem tất cả</span>}
              </button>
              <div className="tripCopy">
                <time>{trip.date}</time><h3>{trip.title}</h3><p className="friendsWith">{trip.friends}</p><p>{trip.caption}</p>
                <label className={`uploadMedia ${uploading === index ? 'isUploading' : ''}`}>
                  <Upload aria-hidden="true" />{uploading === index ? 'Đang tải lên...' : 'Thêm nhiều ảnh / video'}
                  <input type="file" accept="image/*,video/*" multiple disabled={uploading !== null} onChange={(event) => { uploadMedia(index, event.target.files); event.target.value = ''; }} />
                </label>
              </div>
            </article>
          );
        })}</div>
      </section>

      {viewer && activeTrip && activeMedia && (
        <div className="mediaViewer" role="dialog" aria-modal="true" aria-label={`Thư viện ${activeTrip.title}`} onClick={() => setViewer(null)}>
          <button className="viewerClose" type="button" onClick={() => setViewer(null)} aria-label="Đóng thư viện"><X aria-hidden="true" /></button>
          <div className="viewerPanel" onClick={(event) => event.stopPropagation()}>
            <div className="viewerStage">
              {activeMedia.type === 'video' ? (
                <video key={activeMedia.url} src={activeMedia.url} controls playsInline autoPlay />
              ) : (
                <img src={activeMedia.url} alt="" />
              )}
              {activeList.length > 1 && <>
                <button className="viewerNav prev" type="button" onClick={() => changeMedia(-1)} aria-label="Mục trước"><ChevronLeft aria-hidden="true" /></button>
                <button className="viewerNav next" type="button" onClick={() => changeMedia(1)} aria-label="Mục tiếp theo"><ChevronRight aria-hidden="true" /></button>
              </>}
            </div>
            <div className="viewerInfo"><small>{activeTrip.title}</small><span>{viewer.mediaIndex + 1} / {activeList.length}</span></div>
            <div className="viewerThumbs">{activeList.map((media, mediaIndex) => (
              <button className={mediaIndex === viewer.mediaIndex ? 'active' : ''} type="button" key={media.key} onClick={() => setViewer({ ...viewer, mediaIndex })} aria-label={`Xem mục ${mediaIndex + 1}`}>
                {media.type === 'image' ? <img src={media.url} alt="" /> : <Play aria-hidden="true" />}
              </button>
            ))}</div>
          </div>
        </div>
      )}

      <section className="letter" id="letter"><div className="letterPaper"><span className="tape" /><p className="script">Gửi Vy,</p><h2>Cảm ơn Vy vì đã xuất hiện.</h2><p>Có thể Vy chưa từng biết, nhưng sự hiện diện của Vy đã khiến rất nhiều khoảnh khắc bình thường trở nên có ý nghĩa. Trang nhỏ này chỉ là cách một người muốn lưu lại những điều đẹp đẽ về Vy.</p><p className="signature">— Từ một người luôn âm thầm dõi theo Vy ♡</p></div></section>
      <footer><p>Được tạo bằng tất cả sự chân thành</p><span>✦ 2026 ✦</span></footer>
    </main>
  );
}
