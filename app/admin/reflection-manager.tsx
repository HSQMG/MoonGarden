'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { BookHeart, Edit3, Image as ImageIcon, LoaderCircle, Plus, Trash2, X } from 'lucide-react';

type Reflection = { id: string; reflected_at: string; title: string; source_type: 'photo' | 'post'; feeling: string; image_url: string | null };

export default function ReflectionManager() {
  const [items, setItems] = useState<Reflection[]>([]);
  const [editing, setEditing] = useState<Reflection | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/reflections', { cache: 'no-store' });
    const data = await response.json() as { reflections?: Reflection[]; error?: string };
    if (!response.ok) throw new Error(data.error || 'Không thể tải phần cảm nhận.');
    setItems(data.reflections || []);
  }, []);

  useEffect(() => { load().catch((error) => setMessage(error.message)); }, [load]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const response = editing ? await fetch('/api/reflections', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: editing.id, reflected_at: form.get('reflected_at'), title: form.get('title'), source_type: form.get('source_type'), feeling: form.get('feeling') }),
      }) : await fetch('/api/reflections', { method: 'POST', body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Không thể lưu cảm nhận.');
      await load();
      setEditing(undefined);
      setMessage(editing ? `Đã cập nhật “${form.get('title')}” trong Phần 04.` : `Đã thêm “${form.get('title')}” vào Phần 04.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể lưu cảm nhận.');
    } finally { setBusy(false); }
  };

  const remove = async (item: Reflection) => {
    if (!window.confirm(`Bạn có chắc muốn xóa “${item.title}”?`)) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/reflections', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Không thể xóa cảm nhận.');
      await load();
      setMessage(`Đã xóa “${item.title}” khỏi Phần 04.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể xóa cảm nhận.');
    } finally { setBusy(false); }
  };

  return <section className="journeyManager reflectionManager">
    {message && <p className="adminMessage" role="status">{message}</p>}
    <div className="managerBlock">
      <div className="managerTitle"><div><small>PHẦN 04</small><h2><BookHeart aria-hidden="true" />Cảm nhận qua từng khoảnh khắc</h2></div><button type="button" onClick={() => setEditing(null)}><Plus aria-hidden="true" />Thêm cảm nhận</button></div>
      {items.length ? <div className="managerRows">{items.map((item) => <article key={item.id}>
        <div className="milestoneAdminThumb">{item.image_url ? <img src={item.image_url} alt={item.title} /> : <ImageIcon aria-hidden="true" />}</div>
        <div><small>{item.reflected_at.split('-').reverse().join(' · ')} · {item.source_type === 'post' ? 'Bài đăng' : 'Bức ảnh'}</small><h3>{item.title}</h3><p>{item.feeling}</p></div>
        <div className="rowActions"><button type="button" onClick={() => setEditing(item)}><Edit3 aria-hidden="true" />Sửa</button><button className="danger" type="button" disabled={busy} onClick={() => remove(item)}><Trash2 aria-hidden="true" />Xóa</button></div>
      </article>)}</div> : <div className="adminEmpty"><BookHeart aria-hidden="true" /><p>Chưa có cảm nhận nào trong Phần 04.</p></div>}
    </div>

    {editing !== undefined && <div className="editorOverlay" onClick={() => !busy && setEditing(undefined)}><form className="journeyEditor" onSubmit={save} onClick={(event) => event.stopPropagation()}>
      <div className="editorHead"><div><small>{editing ? 'CHỈNH SỬA' : 'THÊM MỚI'}</small><h2>Cảm nhận</h2></div><button type="button" disabled={busy} onClick={() => setEditing(undefined)} aria-label="Đóng"><X aria-hidden="true" /></button></div>
      <div className="editorFields">
        <label>Ngày đăng / ngày chụp<input name="reflected_at" type="date" required defaultValue={editing?.reflected_at || ''} /></label>
        <label>Phân loại<select name="source_type" defaultValue={editing?.source_type || 'photo'}><option value="photo">Bức ảnh</option><option value="post">Bài đăng</option></select></label>
        <label className="wide">Tiêu đề<input name="title" required defaultValue={editing?.title || ''} placeholder="Điều tôi nhớ về khoảnh khắc này" /></label>
        <label className="wide">Cảm nhận<textarea name="feeling" rows={6} required defaultValue={editing?.feeling || ''} placeholder="Viết những điều bạn đã nghĩ và cảm nhận..." /></label>
        {!editing && <label className="wide">Ảnh hoặc ảnh chụp bài đăng<input name="file" type="file" accept="image/*" /></label>}
        {editing?.image_url && <p className="wide autoSortNote">Ảnh hiện tại được giữ nguyên khi chỉnh sửa nội dung.</p>}
      </div>
      <div className="editorActions"><button type="button" disabled={busy} onClick={() => setEditing(undefined)}>Hủy</button><button className="primary" type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" aria-hidden="true" />}{busy ? 'Đang lưu...' : 'Lưu cảm nhận'}</button></div>
    </form></div>}
  </section>;
}
