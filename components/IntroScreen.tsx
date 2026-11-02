import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Box, MapPinned, Route } from 'lucide-react';
import { tr } from './locale';

const BASE = import.meta.env.BASE_URL;
const FLOATING = [
  { src: 'rooms/e102/102.jpg', code: 'E102', label: tr('Triển lãm công nghệ đa chiều', 'Immersive technology exhibition'), cls: 'card-a' },
  { src: 'rooms/e401/144.jpg', code: 'E401', label: tr('Cảng biển & đường sắt thông minh', 'Smart seaports & rail systems'), cls: 'card-b' },
  { src: 'rooms/e104/134.jpg', code: 'E104', label: tr('Trung tâm hội tụ công nghệ', 'Immersive technology convergence'), cls: 'card-c' },
];
const FEATURES = [
  { icon: Route, title: tr('Chỉ đường giữa các tầng', 'Find your way between floors'), text: tr('Chọn nơi bạn đứng và phòng cần đến, hệ thống vẽ tuyến qua cầu thang hoặc thang máy.', 'Choose your starting point and destination for a route using stairs or the lift.') },
  { icon: Box, title: tr('Mô hình 3D toàn tòa nhà', 'Explore the building in 3D'), text: tr('Xoay, thu phóng và xem từng tầng như một sa bàn.', 'Rotate, zoom and inspect each floor in the interactive model.') },
  { icon: MapPinned, title: tr('Tham quan phòng như thật', 'Step inside the rooms'), text: tr('Điều khiển nhân vật đi trong phòng, chạm đồ vật để tìm hiểu.', 'Guide your character around a room and tap objects to learn more.') },
];

export default function IntroScreen({ roomCount, onDone }: { roomCount: number; onDone: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const finish = () => { if (leaving) return; setLeaving(true); window.setTimeout(onDone, 650); };

  useEffect(() => {
    const el = stage.current; if (!el) return;
    let frame = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    const move = (e: PointerEvent) => { tx = (e.clientX / window.innerWidth - .5) * 2; ty = (e.clientY / window.innerHeight - .5) * 2; };
    const loop = () => { cx += (tx - cx) * .06; cy += (ty - cy) * .06; el.style.setProperty('--mx', cx.toFixed(3)); el.style.setProperty('--my', cy.toFixed(3)); frame = requestAnimationFrame(loop); };
    window.addEventListener('pointermove', move); frame = requestAnimationFrame(loop);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !(e.target instanceof HTMLElement && e.target.closest('button,a'))) finish();
    };
    window.addEventListener('keydown', key);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', move); window.removeEventListener('keydown', key); };
  });

  return <section className={'intro-screen' + (leaving ? ' leaving' : '')} aria-label={tr('Giới thiệu', 'Introduction')}>
    <div className="intro-bg" style={{ backgroundImage: `url(${BASE}intro/campus-e.jpg)` }} aria-hidden="true" />
    <div className="intro-grid" aria-hidden="true" />
    <header className="intro-top">
      <img src={`${BASE}tch-logo-lockup.png`} alt="Technology Convergence Hub" width={190} height={52} />
      <button className="intro-skip" onClick={finish}>{tr('Bỏ qua giới thiệu', 'Skip introduction')}</button>
    </header>

    <div className="intro-copy">
      <p className="intro-eyebrow"><i />{tr('Đại học Kinh tế TP. Hồ Chí Minh · UEH', 'University of Economics Ho Chi Minh City · UEH')}</p>
      <h1><span>{tr('Chỉ đường & khám phá', 'Find your way & explore')}</span><strong>{tr('Cơ sở E', 'Campus E')}</strong></h1>
      <p className="intro-lead">{tr('Bản đồ 3D tương tác giúp bạn tìm đúng phòng LAB, phòng học và không gian nghiên cứu trong tòa nhà Tech Convergence Hub, 54 Nguyễn Văn Thủ, Quận 1.', 'Find labs, classrooms and research spaces with an interactive 3D map of Technology Convergence Hub, 54 Nguyen Van Thu, District 1.')}</p>
      <dl className="intro-stats">
        <div><dt>8</dt><dd>{tr('tầng, từ tầng trệt đến tầng 7', 'floors, from ground floor to floor 7')}</dd></div>
        <div><dt>{roomCount}</dt><dd>{tr('phòng LAB và không gian chức năng', 'labs and functional spaces')}</dd></div>
        <div><dt>3</dt><dd>{tr('lối lên xuống: CT1, CT2, thang máy', 'connections: CT1, CT2 and lift')}</dd></div>
      </dl>
      <ul className="intro-features">
        {FEATURES.map(({ icon: Icon, title, text }) => <li key={title}><Icon aria-hidden="true" /><div><b>{title}</b><span>{text}</span></div></li>)}
      </ul>
      <div className="intro-actions">
        <button className="intro-cta" onClick={finish}>{tr('Bắt đầu khám phá', 'Start exploring')} <ArrowRight aria-hidden="true" /></button>
        <span>{tr('hoặc nhấn', 'or press')} <kbd>Enter</kbd></span>
      </div>
    </div>

    <div className="intro-stage" ref={stage} aria-hidden="true">
      <div className="intro-rig">
        <figure className="intro-building">
          <img src={`${BASE}intro/campus-e.jpg`} alt="" width={800} height={1199} />
          <div className="intro-scan" />
          <svg viewBox="0 0 800 1199" preserveAspectRatio="none" className="intro-route">
            <path d="M372 1010 L372 905 L560 905 L560 255" pathLength={1} />
          </svg>
          <span className="intro-pin pin-start"><i />{tr('Cổng vào', 'Entrance')}</span>
          <span className="intro-pin pin-end"><i />{tr('E701 · Tầng 7', 'E701 · Floor 7')}</span>
        </figure>
        <ol className="intro-floors">
          {['F7', 'F6', 'F5', 'F4', 'F3', 'F2', 'F1', 'GF'].map((f, i) => <li key={f} style={{ animationDelay: `${1.1 + i * .07}s` }}>{f}</li>)}
        </ol>
        {FLOATING.map(card => <figure key={card.code} className={'intro-card ' + card.cls}>
          <img src={BASE + card.src} alt="" width={960} height={540} />
          <figcaption><b>{card.code}</b>{card.label}</figcaption>
        </figure>)}
      </div>
    </div>
  </section>;
}
