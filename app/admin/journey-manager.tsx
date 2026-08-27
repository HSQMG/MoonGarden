'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CalendarDays, Edit3, Flag, Image as ImageIcon, LoaderCircle, Plus, Trash2, Upload, X } from 'lucide-react';

type Milestone = { id: string; event_year: number; title: string; description: string; icon: string; image_path: string | null; image_alt: string | null; sort_order: number };
type Trip = { id: string; trip_date: string; title: string; friends: string; description: string; tone: string; sort_order: number };
type Editor = { entity: 'milestone' | 'friendTrip'; item: Milestone | Trip | null } | null;

export default function JourneyManager() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editor, setEditor] = useState<Editor>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/journey', { cache: 'no-store' });
    const data = await response.json() as { milestones?: Milestone[]; friendTrips?: Trip[]; error?: string };
    if (!response.ok) throw new Error(data.error || 'Không thể tải dữ liệu hành trình.');
    setMilestones(data.milestones || []);
    setTrips(data.friendTrips || []);
  }, []);

  useEffect(() => { load().catch((error) => setMessage(error.message)); }, [load]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const isMilestone = editor.entity === 'milestone';
    const data = isMilestone ? {
      event_year: Number(form.get('event_year')),
      title: String(form.get('title') || ''),
      description: String(form.get('description') || ''),
      icon: String(form.get('icon') || '✦'),
      image_alt: String(form.get('image_alt') || '') || null,
      sort_order: Number(form.get('sort_order')),
    } : {
      trip_date: String(form.get('trip_date') || ''),
      title: String(form.get('title') || ''),
      friends: String(form.get('friends') || ''),
      description: String(form.get('description') || ''),
      tone: String(form.get('tone') || 'lavender'),
    };

    try {
      const response = await fetch('/api/admin/journey', {
        method: editor.item ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entity: editor.entity, id: editor.item?.id, data }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Không thể lưu dữ liệu.');
      await load();
      setEditor(null);
      const section = editor.entity === 'milestone' ? 'Phần 02' : 'Phần 03';
      setMessage(editor.item ? `Đã cập nhật “${data.title}” trong ${section}.` : `Đã thêm “${data.title}” vào ${section}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể lưu dữ liệu.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entity: 'milestone' | 'friendTrip', id: string, title: string, tripIndex?: number) => {
    if (!window.confirm(`Bạn có chắc muốn xóa “${title}”? Dữ liệu đã xóa không thể khôi phục.`)) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/journey', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entity, id, tripIndex }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Không thể xóa dữ liệu.');
      await load();
      setMessage(`Đã xóa “${title}” khỏi ${entity === 'milestone' ? 'Phần 02' : 'Phần 03'}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể xóa dữ liệu.');
    } finally {
      setBusy(false);
    }
  };

  const uploadMilestoneImage = async (milestoneId: string, file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMessage('');
    const form = new FormData();
    form.append('milestoneId', milestoneId);
    form.append('file', file);
    try {
      const response = await fetch('/api/milestone-media', { method: 'POST', body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Không thể tải ảnh lên.');
      await load();
      const milestone = milestones.find((item) => item.id === milestoneId);
      setMessage(`Đã ${milestone?.image_path ? 'thay' : 'thêm'} ảnh cho “${milestone?.title || 'cột mốc'}”.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
    } finally {
      setBusy(false);
    }
  };

  const removeMilestoneImage = async (milestoneId: string) => {
    const milestone = milestones.find((item) => item.id === milestoneId);
    if (!window.confirm(`Bạn có chắc muốn xóa ảnh của “${milestone?.title || 'cột mốc này'}”?`)) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/milestone-media', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ milestoneId }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Không thể xóa ảnh.');
      await load();
      setMessage(`Đã xóa ảnh của “${milestone?.title || 'cột mốc'}”.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể xóa ảnh.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="journeyManager">
      {message && <p className="adminMessage" role="status">{message}</p>}

      <div className="managerBlock">
        <div className="managerTitle"><div><small>PHẦN 02</small><h2><Flag aria-hidden="true" />Những chặng đường</h2></div><button type="button" onClick={() => setEditor({ entity: 'milestone', item: null })}><Plus aria-hidden="true" />Thêm cột mốc</button></div>
        <div className="managerRows">{milestones.map((item) => (
          <article key={item.id}><div className="milestoneAdminThumb">{item.image_path ? <img src={item.image_path} alt={item.image_alt || item.title} /> : <b>{item.icon}</b>}</div><div><small>{item.event_year}</small><h3>{item.title}</h3><p>{item.description}</p></div><div className="rowActions milestoneActions"><label><Upload aria-hidden="true" />{item.image_path ? 'Thay ảnh' : 'Thêm ảnh'}<input type="file" accept="image/*" disabled={busy} onChange={(event) => { uploadMilestoneImage(item.id, event.target.files?.[0]); event.target.value = ''; }} /></label>{item.image_path && <button className="danger" type="button" disabled={busy} onClick={() => removeMilestoneImage(item.id)}><ImageIcon aria-hidden="true" />Xóa ảnh</button>}<button type="button" onClick={() => setEditor({ entity: 'milestone', item })}><Edit3 aria-hidden="true" />Sửa</button><button className="danger" type="button" disabled={busy} onClick={() => remove('milestone', item.id, item.title)}><Trash2 aria-hidden="true" />Xóa mục</button></div></article>
        ))}</div>
      </div>

      <div className="managerBlock">
        <div className="managerTitle"><div><small>PHẦN 03</small><h2><CalendarDays aria-hidden="true" />Những cuộc gặp gỡ và những kỷ niệm xưa</h2></div><button type="button" onClick={() => setEditor({ entity: 'friendTrip', item: null })}><Plus aria-hidden="true" />Thêm chuyến đi</button></div>
        <div className="managerRows">{trips.map((item, index) => (
          <article key={item.id}><b>0{index + 1}</b><div><small>{item.trip_date.split('-').reverse().join(' · ')}</small><h3>{item.title}</h3><p>{item.friends}</p></div><div className="rowActions"><button type="button" onClick={() => setEditor({ entity: 'friendTrip', item })}><Edit3 aria-hidden="true" />Sửa</button><button className="danger" type="button" disabled={busy} onClick={() => remove('friendTrip', item.id, item.title, index)}><Trash2 aria-hidden="true" />Xóa</button></div></article>
        ))}</div>
      </div>

      {editor && <div className="editorOverlay" onClick={() => !busy && setEditor(null)}><form className="journeyEditor" onSubmit={save} onClick={(event) => event.stopPropagation()}>
        <div className="editorHead"><div><small>{editor.item ? 'CHỈNH SỬA' : 'THÊM MỚI'}</small><h2>{editor.entity === 'milestone' ? 'Cột mốc' : 'Chuyến đi'}</h2></div><button type="button" disabled={busy} onClick={() => setEditor(null)} aria-label="Đóng"><X aria-hidden="true" /></button></div>
        {editor.entity === 'milestone' ? <MilestoneFields item={editor.item as Milestone | null} nextOrder={milestones.length + 1} /> : <TripFields item={editor.item as Trip | null} nextOrder={trips.length + 1} />}
        <div className="editorActions"><button type="button" disabled={busy} onClick={() => setEditor(null)}>Hủy</button><button className="primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : null}{busy ? 'Đang lưu...' : 'Lưu dữ liệu'}</button></div>
      </form></div>}
    </section>
  );
}

function MilestoneFields({ item, nextOrder }: { item: Milestone | null; nextOrder: number }) {
  return <div className="editorFields"><label>Năm<input name="event_year" type="number" min="1900" max="2200" required defaultValue={item?.event_year || new Date().getFullYear()} /></label><label>Biểu tượng<input name="icon" maxLength={8} defaultValue={item?.icon || '✦'} /></label><label className="wide">Tiêu đề<input name="title" required defaultValue={item?.title || ''} /></label><label className="wide">Mô tả<textarea name="description" rows={3} defaultValue={item?.description || ''} /></label><label className="wide">Chú thích ảnh<input name="image_alt" placeholder="Có thể thêm sau khi tải ảnh" defaultValue={item?.image_alt || ''} /></label><label>Thứ tự<input name="sort_order" type="number" min="0" required defaultValue={item?.sort_order ?? nextOrder} /></label></div>;
}

function TripFields({ item }: { item: Trip | null; nextOrder: number }) {
  return <div className="editorFields"><label>Ngày đi<input name="trip_date" type="date" required defaultValue={item?.trip_date || ''} /></label><label>Màu sắc<select name="tone" defaultValue={item?.tone || 'lavender'}><option value="lavender">Tím nhạt</option><option value="blue">Xanh</option><option value="amber">Vàng nâu</option></select></label><label className="wide">Tên chuyến đi<input name="title" required defaultValue={item?.title || ''} /></label><label className="wide">Đi cùng ai<input name="friends" defaultValue={item?.friends || ''} /></label><label className="wide">Ghi chú<textarea name="description" rows={3} defaultValue={item?.description || ''} /></label><p className="wide autoSortNote">Các chuyến đi sẽ tự động sắp xếp theo ngày, từ cũ đến mới.</p></div>;
}
