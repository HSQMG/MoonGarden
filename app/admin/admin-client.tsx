'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Film, Image as ImageIcon, LoaderCircle, Trash2, Upload } from 'lucide-react';

type Trip = { id: string; trip_date: string; title: string; friends: string };
type Media = { key: string; tripIndex: number; type: 'image' | 'video'; url: string; name?: string; size?: number };

export default function AdminClient() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    const [journeyResponse, mediaResponse] = await Promise.all([
      fetch('/api/journey', { cache: 'no-store' }),
      fetch('/api/trip-media', { cache: 'no-store' }),
    ]);
    if (!journeyResponse.ok || !mediaResponse.ok) throw new Error('Không thể tải dữ liệu quản lý.');
    const journey = await journeyResponse.json() as { friendTrips: Trip[] };
    const gallery = await mediaResponse.json() as { media: Media[] };
    setTrips(journey.friendTrips);
    setMedia(gallery.media);
  }, []);

  useEffect(() => { loadData().catch((error) => setMessage(error.message)); }, [loadData]);

  const upload = async (tripIndex: number, files: FileList | null) => {
    if (!files?.length) return;
    setBusy(`upload-${tripIndex}`);
    setMessage('');
    const form = new FormData();
    form.append('tripIndex', String(tripIndex));
    Array.from(files).forEach((file) => form.append('files', file));
    try {
      const response = await fetch('/api/trip-media', { method: 'POST', body: form });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Không thể tải tệp lên.');
      await loadData();
      setMessage(`Đã tải lên ${files.length} tệp.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể tải tệp lên.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (item: Media) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh/video này? Thao tác không thể hoàn tác.')) return;
    setBusy(item.key);
    setMessage('');
    try {
      const response = await fetch('/api/trip-media', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: item.key }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Không thể xóa tệp.');
      await loadData();
      setMessage('Đã xóa tệp khỏi thư viện.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể xóa tệp.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="adminPage">
      <header className="adminHeader">
        <div><p>HÀNH TRÌNH CỦA VY</p><h1>Quản lý thư viện</h1><span>Thêm hoặc xóa ảnh và video của từng chuyến đi.</span></div>
        <a href="/"><ArrowLeft aria-hidden="true" />Xem trang người dùng</a>
      </header>

      {message && <p className="adminMessage" role="status">{message}</p>}

      <section className="adminTrips">
        {trips.map((trip, tripIndex) => {
          const tripMedia = media.filter((item) => item.tripIndex === tripIndex);
          const uploading = busy === `upload-${tripIndex}`;
          return (
            <article className="adminTrip" key={trip.id}>
              <div className="adminTripHead">
                <div><small>{trip.trip_date.split('-').reverse().join(' · ')}</small><h2>{trip.title}</h2><p>{trip.friends}</p></div>
                <label className={uploading ? 'isBusy' : ''}>
                  {uploading ? <LoaderCircle className="spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
                  {uploading ? 'Đang tải...' : 'Thêm ảnh / video'}
                  <input type="file" accept="image/*,video/*" multiple disabled={busy !== null} onChange={(event) => { upload(tripIndex, event.target.files); event.target.value = ''; }} />
                </label>
              </div>

              {tripMedia.length ? (
                <div className="adminMediaGrid">{tripMedia.map((item) => (
                  <div className="adminMediaItem" key={item.key}>
                    {item.type === 'image' ? <img src={item.url} alt="" /> : <video src={item.url} preload="metadata" />}
                    <span>{item.type === 'image' ? <ImageIcon aria-hidden="true" /> : <Film aria-hidden="true" />}{item.name || item.key.split('/').at(-1)}</span>
                    <button type="button" disabled={busy !== null} onClick={() => remove(item)} aria-label={`Xóa ${item.name || 'tệp'}`}>
                      {busy === item.key ? <LoaderCircle className="spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />} Xóa
                    </button>
                  </div>
                ))}</div>
              ) : <div className="adminEmpty"><ImageIcon aria-hidden="true" /><p>Chuyến đi này chưa có ảnh hoặc video.</p></div>}
            </article>
          );
        })}
      </section>
    </main>
  );
}
