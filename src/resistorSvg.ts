import { Bands, colorByKey } from './resistor';

export function resistorSvg(bands: Bands, id = 'main'): string {
  const xPositions = bands.length === 4 ? [286, 398, 510, 622] : [264, 344, 424, 548, 664];
  const stops = bands.map((key, index) => {
    if (key === 'none') return '';
    const x = xPositions[index];
    const width = bands.length === 5 && index === 4 ? 27 : 31;
    return `<rect data-preview-band="${index}" x="${x}" y="91" width="${width}" height="107" rx="3" fill="${colorByKey[key].hex}" stroke="rgba(36,39,37,.16)" stroke-width="1"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 290" role="img" aria-label="${bands.map(key => colorByKey[key].label).join(', ')} renk bantlı direnç" class="resistor-art">
    <defs>
      <linearGradient id="wire-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6cdd0"/><stop offset=".46" stop-color="#818d92"/><stop offset="1" stop-color="#d4d9da"/></linearGradient>
      <linearGradient id="body-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8e7"/><stop offset=".21" stop-color="#f3e6c9"/><stop offset=".53" stop-color="#e5d6b3"/><stop offset=".78" stop-color="#e1cfa8"/><stop offset="1" stop-color="#bcae8e"/></linearGradient>
    </defs>
    <rect x="31" y="135" width="858" height="22" rx="8" fill="url(#wire-${id})"/>
    <path d="M215 103 C225 88 242 82 263 82 H657 C681 82 698 90 705 106 V184 C698 200 681 207 657 207 H263 C242 207 225 200 215 185 Z" fill="url(#body-${id})" stroke="#bcae8e" stroke-width="2"/>
    <path d="M221 107 C231 95 244 91 265 91 H655 C675 91 690 97 699 109" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="4" stroke-linecap="round"/>
    ${stops}
    <path d="M218 182 C235 195 246 198 266 198 H655 C677 198 691 192 702 181" fill="none" stroke="rgba(108,91,63,.12)" stroke-width="4"/>
  </svg>`;
}

export function miniResistorSvg(bands: Bands): string {
  const xPositions = bands.length === 4 ? [46, 78, 110, 146] : [42, 64, 86, 118, 150];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 56" role="img" aria-label="${bands.map(key => colorByKey[key].label).join(', ')}">
    <rect x="0" y="25" width="200" height="6" rx="3" fill="#acb7bd"/>
    <rect x="28" y="9" width="144" height="38" rx="18" fill="#e8d9b9" stroke="#cebd99"/>
    ${bands.map((key, index) => key === 'none' ? '' : `<rect x="${xPositions[index]}" y="10" width="8" height="36" rx="1" fill="${colorByKey[key].hex}"/>`).join('')}
  </svg>`;
}
