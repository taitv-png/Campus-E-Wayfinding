import { useEffect, useRef, useState } from 'react';
import CampusEMap from './CampusEMap';
import IntroScreen from './IntroScreen';
import { floorRooms } from './floor-rooms';
import { mapIsEnglish, tr } from './locale';

const roomCount = Array.from({ length: 8 }, (_, floor) => floorRooms(floor).length)
  .reduce((total, count) => total + count, 0);

function languageUrl(language: 'en' | 'vi') {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', language);
  return url.href;
}

export default function WayfindingApp() {
  const [welcome, setWelcome] = useState(true);
  const content = useRef<HTMLDivElement>(null);
  const english = mapIsEnglish();

  useEffect(() => {
    if (!welcome) content.current?.focus({ preventScroll: true });
  }, [welcome]);

  return <div className="wayfinding-app">
    <nav className="language-bar" aria-label={tr('Ngôn ngữ', 'Language')}>
      <span>Campus E · 3D Wayfinding</span>
      <div>
        <a href={languageUrl('en')} lang="en" hrefLang="en" aria-label="English" aria-current={english ? 'true' : undefined}>EN</a>
        <a href={languageUrl('vi')} lang="vi" hrefLang="vi" aria-label="Tiếng Việt" aria-current={!english ? 'true' : undefined}>VI</a>
      </div>
    </nav>
    <div className="wayfinding-content" ref={content} tabIndex={-1}>
      {welcome ? <IntroScreen roomCount={roomCount} onDone={() => setWelcome(false)} /> : <CampusEMap />}
    </div>
  </div>;
}
