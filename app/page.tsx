'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Cat, ChevronLeft, ChevronRight, Flower2, Headphones, Images, Mic2, Play, Sprout, Trees, Utensils, X } from 'lucide-react';

type TripMedia = { key: string; tripId: string | null; type: 'image' | 'video'; url: string };
type Milestone = { id: string; year: string; title: string; text: string; icon: string; media: Array<{ type: 'image'; src: string; caption: string }> };
type FriendTrip = { id: string; date: string; title: string; friends: string; caption: string; tone: string };
type JourneyResponse = {
  milestones: Array<{ id: string; event_year: number; title: string; description: string; icon: string; image_path: string | null; image_alt: string | null }>;
  friendTrips: Array<{ id: string; trip_date: string; title: string; friends: string; description: string; tone: string }>;
};

export default function Home() {
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swipeEnd = useRef<{ x: number; y: number } | null>(null);
  const [viewer, setViewer] = useState<{ tripIndex: number; mediaIndex: number } | null>(null);
  const [tripMedia, setTripMedia] = useState<Record<string, TripMedia[]>>({});
  const [journeyMilestones, setJourneyMilestones] = useState<Milestone[]>([]);
  const [journeyTrips, setJourneyTrips] = useState<FriendTrip[]>([]);
  const [journeyLoading, setJourneyLoading] = useState(true);
  const [journeyError, setJourneyError] = useState('');
  const activeTrip = viewer ? journeyTrips[viewer.tripIndex] : null;
  const activeList = viewer && activeTrip ? (tripMedia[activeTrip.id] || []) : [];
  const activeMedia = viewer ? activeList[viewer.mediaIndex] : null;

  const loadMedia = async () => {
    const response = await fetch('/api/trip-media', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json() as { media: TripMedia[] };
    const grouped: Record<string, TripMedia[]> = {};
    for (const media of data.media) if (media.tripId) (grouped[media.tripId] ||= []).push(media);
    setTripMedia(grouped);
  };

  const loadJourney = async () => {
    setJourneyLoading(true);
    setJourneyError('');
    try {
      const response = await fetch('/api/journey', { cache: 'no-store' });
      const data = await response.json() as JourneyResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Không thể đọc dữ liệu từ Supabase.');

      setJourneyMilestones(data.milestones.map((item) => ({
        id: item.id,
        year: String(item.event_year),
        title: item.title,
        text: item.description,
        icon: item.icon,
        media: [{ type: 'image', src: item.image_path || '', caption: item.image_alt || item.title }],
      })));
      setJourneyTrips(data.friendTrips.map((trip) => ({
        id: trip.id,
        date: trip.trip_date.split('-').reverse().join(' · '),
        title: trip.title,
        friends: trip.friends,
        caption: trip.description,
        tone: trip.tone,
      })));
    } catch (error) {
      setJourneyError(error instanceof Error ? error.message : 'Không thể đọc dữ liệu từ Supabase.');
    } finally {
      setJourneyLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadMedia(); loadJourney(); }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.revealItem'));
    elements.forEach((element) => element.classList.add('revealReady'));
    elements.forEach((element, index) => element.style.setProperty('--reveal-delay', `${(index % 4) * 90}ms`));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('isVisible');
        } else {
          entry.target.classList.remove('isVisible');
        }
      });
    }, { threshold: .1, rootMargin: '-5% 0px -8% 0px' });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [journeyMilestones.length, journeyTrips.length]);

  const changeMedia = (direction: number) => {
    setViewer((current) => {
      if (!current) return null;
      const tripId = journeyTrips[current.tripIndex]?.id;
      const total = tripId ? (tripMedia[tripId] || []).length : 0;
      if (!total) return current;
      return { ...current, mediaIndex: (current.mediaIndex + direction + total) % total };
    });
  };

  const startSwipe = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
    swipeEnd.current = null;
  };

  const trackSwipe = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    swipeEnd.current = { x: touch.clientX, y: touch.clientY };
  };

  const finishSwipe = () => {
    const start = swipeStart.current;
    const end = swipeEnd.current;
    swipeStart.current = null;
    swipeEnd.current = null;
    if (!start || !end || activeList.length < 2) return;

    const distanceX = end.x - start.x;
    const distanceY = end.y - start.y;
    if (Math.abs(distanceX) < 50 || Math.abs(distanceX) <= Math.abs(distanceY) * 1.2) return;
    changeMedia(distanceX < 0 ? 1 : -1);
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
      <nav className={`nav ${viewer ? 'navHidden' : ''}`} aria-label="Điều hướng chính" aria-hidden={viewer ? 'true' : undefined}>
        <a className="brand" href="#top"><span className="brandMark">V</span><span className="brandWords"><small>Một câu chuyện dành riêng cho</small>Hành trình của Vy</span></a>
        <div className="navLinks"><a href="#about"><span>01</span> Về Vy</a><a href="#timeline"><span>02</span> Chặng đường</a><a href="#friends"><span>03</span> Gặp gỡ &amp; kỷ niệm</a></div>
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
        <div className="sectionLabel revealItem"><span>01</span> VỀ VY</div>
        <div className="portraitCard revealItem" aria-label="Ảnh chân dung của Vy">
          <img
            src="/images/avatar/vy.jpg"
            alt="Ảnh của Vy"
            className="portraitImage"
          />
        </div>
        <div className="aboutCopy revealItem">
          <p className="script">Nếu phải kể về cô ấy...</p><h2>Cô ấy là một bản nhạc<br />dịu dàng giữa thành phố vội.</h2>
          <dl className="profileFacts">
            <div><dt>Họ và tên</dt><dd>Hoàng Thuỵ Thuý Vy</dd></div>
            <div><dt>Biệt danh</dt><dd>MoonGarden</dd></div>
            <div><dt>Ngày sinh</dt><dd>15 tháng 3, 2003</dd></div>
            <div><dt>Tuổi</dt><dd>23 tuổi</dd></div>
            <div><dt>Công việc</dt><dd>Content Creator</dd></div>
            <div><dt>Học vấn</dt><dd>Đại học Kinh tế Hồ Chí Minh</dd></div>
            <div><dt>Ngành học</dt><dd>Bất động sản</dd></div>
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
        <div className="sectionHead revealItem"><div className="sectionLabel light"><span>02</span> NHỮNG CHẶNG ĐƯỜNG</div><h2>Mỗi chặng đường<br /><i>đều làm nên Vy của hôm nay.</i></h2></div>
        {journeyLoading && <p className="dataStatus" role="status">Đang tải dữ liệu từ Supabase...</p>}
        {journeyError && <p className="uploadError" role="alert">{journeyError}</p>}
        <div className="timeline">{journeyMilestones.map((item, index) => (
          <article className={`milestone revealItem ${index % 2 ? 'right' : ''}`} key={item.id}>
            <div className="milestoneIcon">{item.icon}</div>
            <div className="milestoneCard">
              <div className="milestoneGallery">
                {item.media.slice(0, 1).map((media) => (
                  <figure className="milestoneMedia" key={item.id}>
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
        <div className="friendsIntro revealItem"><div className="sectionLabel"><span>03</span> NHỮNG CUỘC GẶP GỠ VÀ NHỮNG KỶ NIỆM XƯA</div><h2>Đi cùng nhau,<br />nhớ cùng nhau.</h2><p>Không chỉ là nơi đã đến, điều đáng nhớ nhất luôn là những người đã có mặt trong hành trình ấy.</p></div>
        <div className="tripGrid">{journeyTrips.map((trip, index) => {
          const media = tripMedia[trip.id] || [];
          const images = media.filter((item) => item.type === 'image');
          const videos = media.filter((item) => item.type === 'video');
          const firstImageIndex = images.length ? media.findIndex((item) => item.key === images[0].key) : -1;
          const firstVideoIndex = videos.length ? media.findIndex((item) => item.key === videos[0].key) : -1;
          return (
            <article className={`tripCard revealItem ${trip.tone}`} key={trip.id}>
              <div className={`tripPreviewGrid ${videos.length ? 'hasVideo' : ''}`}>
                <button className="tripMedia" type="button" disabled={!images.length} onClick={() => firstImageIndex >= 0 && setViewer({ tripIndex: index, mediaIndex: firstImageIndex })} aria-label={images.length ? `Xem ${images.length} ảnh của ${trip.title}` : `Chưa có ảnh cho ${trip.title}`}>
                  <span className="tripIndex">0{index + 1}</span>
                  {images[0] ? <img src={images[0].url} alt="" /> : <Images aria-hidden="true" />}
                  <span className="mediaType"><Images aria-hidden="true" />{images.length} ảnh</span>
                  {images.length > 0 && <span className="openGallery">Xem tất cả ảnh</span>}
                </button>
                {videos.length > 0 && <button className="tripMedia tripVideoPreview" type="button" onClick={() => setViewer({ tripIndex: index, mediaIndex: firstVideoIndex })} aria-label={`Xem ${videos.length} video của ${trip.title}`}>
                  <video src={videos[0].url} preload="metadata" muted playsInline />
                  <Play className="videoPlayIcon" aria-hidden="true" />
                  <span className="mediaType"><Play aria-hidden="true" />{videos.length} video</span>
                  <span className="openGallery">Xem tất cả video</span>
                </button>}
              </div>
              <div className="tripCopy">
                <time>{trip.date}</time><h3>{trip.title}</h3><p className="friendsWith">{trip.friends}</p><p>{trip.caption}</p>
              </div>
            </article>
          );
        })}</div>
      </section>

      {viewer && activeTrip && activeMedia && (
        <div className="mediaViewer" role="dialog" aria-modal="true" aria-label={`Thư viện ${activeTrip.title}`} onClick={() => setViewer(null)}>
          <button className="viewerClose" type="button" onClick={() => setViewer(null)} aria-label="Đóng thư viện"><X aria-hidden="true" /></button>
          <div className="viewerPanel" onClick={(event) => event.stopPropagation()}>
            <div
              className="viewerStage"
              onTouchStart={startSwipe}
              onTouchMove={trackSwipe}
              onTouchEnd={finishSwipe}
              onTouchCancel={finishSwipe}
            >
              {activeMedia.type === 'video' ? (
                <video className="viewerMedia" key={activeMedia.url} src={activeMedia.url} controls playsInline autoPlay />
              ) : (
                <img className="viewerMedia" key={activeMedia.url} src={activeMedia.url} alt="" />
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

      <section className="letter" id="letter"><div className="letterPaper revealItem"><span className="tape" /><p className="script">Gửi Vy,</p><h2>Cảm ơn Vy vì đã xuất hiện.</h2><p>Có thể Vy chưa từng biết, nhưng sự hiện diện của Vy đã khiến rất nhiều khoảnh khắc bình thường trở nên có ý nghĩa. Trang nhỏ này chỉ là cách một người muốn lưu lại những điều đẹp đẽ.</p><p className="signature">— Từ một người luôn âm thầm dõi theo Vy </p></div></section>
      <footer className="revealItem"><p>Được tạo bằng tất cả sự chân thành</p><span>✦ 2024 ✦</span></footer>
    </main>
  );
}
