'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Film, Image as ImageIcon, LoaderCircle, Trash2, Upload } from 'lucide-react';
import JourneyManager from './journey-manager';
import ReflectionManager from './reflection-manager';

type Trip = { id: string; trip_date: string; title: string; friends: string };
type Media = { key: string; tripId: string | null; type: 'image' | 'video'; url: string; name?: string; size?: number };

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

  const upload = async (trip: Trip, files: FileList | null) => {
    if (!files?.length) return;
    setBusy(`upload-${trip.id}`);
    setMessage('');
    const form = new FormData();
    form.append('tripId', trip.id);
    Array.from(files).forEach((file) => form.append('files', file));
    try {
      const response = await fetch('/api/trip-media', { method: 'POST', body: form });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Không thể tải tệp lên.');
      await loadData();
      setMessage(`Đã thêm ${files.length} tệp vào “${trip.title}”.`);
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
      setMessage(`Đã xóa “${item.name || 'tệp media'}” khỏi thư viện.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể xóa tệp.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="adminPage">
      <header className="adminHeader">
        <div><p>HÀNH TRÌNH CỦA VY</p><h1>Trang quản lý</h1><span>Quản lý cột mốc, chuyến đi, ảnh, video và cảm nhận.</span></div>
        <a href="/"><ArrowLeft aria-hidden="true" />Xem trang người dùng</a>
      </header>

      {message && <p className="adminMessage" role="status">{message}</p>}

      <JourneyManager />
      <ReflectionManager />

      <section className="adminTrips">
        {trips.map((trip, tripIndex) => {
          const tripMedia = media.filter((item) => item.tripId === trip.id);
          const uploading = busy === `upload-${trip.id}`;
          return (
            <article className="adminTrip" key={trip.id}>
              <div className="adminTripHead">
                <div><small>{trip.trip_date.split('-').reverse().join(' · ')}</small><h2>{trip.title}</h2><p>{trip.friends}</p></div>
                <label className={uploading ? 'isBusy' : ''}>
                  {uploading ? <LoaderCircle className="spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
                  {uploading ? 'Đang tải...' : 'Thêm ảnh / video'}
                  <input type="file" accept="image/*,video/*" multiple disabled={busy !== null} onChange={(event) => { upload(trip, event.target.files); event.target.value = ''; }} />
                </label>
              </div>

              {tripMedia.length ? (
                <div className="adminMediaGrid">{tripMedia.map((item) => (
                  <div className="adminMediaItem" key={item.key}>
                    {item.type === 'image' ? <img src={item.url} alt="" /> : <video src={item.url} preload="metadata" />}
                    <span title={item.name}>{item.type === 'image' ? <ImageIcon aria-hidden="true" /> : <Film aria-hidden="true" />}{item.key.split('/').at(-1)}</span>
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
