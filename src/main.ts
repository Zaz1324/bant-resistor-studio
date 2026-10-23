import { invoke, isTauri } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { BandCount, Bands, ColorKey, DEFAULT_BANDS, DEFAULT_FOUR_BANDS, Series, TOLERANCE_OPTIONS, ToleranceKey, bandOptions, bandTitle, calculate, colorByKey, formatOhms, parseTarget, searchResistors } from './resistor';
import { miniResistorSvg, resistorSvg } from './resistorSvg';
import { Favorite, loadLibrary, saveFavorites } from './library';
import './style.css';

type Mode = 'builder' | 'finder' | 'favorites';

const app = document.querySelector<HTMLDivElement>('#app')!;
const state: {
  mode: Mode;
  bands: Bands;
  bandCount: BandCount;
  activeBand: number;
  searchValue: string;
  unit: number;
  series: Series;
  toleranceColor: ToleranceKey;
  searchError: string;
  toast: string;
  resultLimit: number;
  favorites: Favorite[];
  favoriteName: string;
  favoriteCategory: string;
  favoriteFilter: string;
  favoriteQuery: string;
  editingFavoriteId: string;
  libraryError: string;
} = {
  mode: 'builder',
  bands: [...DEFAULT_BANDS],
  bandCount: 5,
  activeBand: 0,
  searchValue: '4700',
  unit: 1,
  series: 'e24',
  toleranceColor: 'gold',
  searchError: '',
  toast: '',
  resultLimit: 12,
  favorites: [],
  favoriteName: '',
  favoriteCategory: 'Genel',
  favoriteFilter: '',
  favoriteQuery: '',
  editingFavoriteId: '',
  libraryError: '',
};

let toastTimer: number | undefined;
let libraryBusy = false;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

function categoryOptions(): string[] {
  return [...new Set(state.favorites.map(item => item.category))].sort((a, b) => a.localeCompare(b, 'tr'));
}

function categorySuggestions(): string {
  return `<datalist id="category-suggestions">${categoryOptions().map(category => `<option value="${escapeHtml(category)}"></option>`).join('')}</datalist>`;
}

function swatches(index: number, count: BandCount): string {
  return bandOptions(count)[index].map(key => {
    const color = colorByKey[key];
    const selected = state.bands[index] === key;
    const label = bandTitle(index, count);
    const value = color.digit !== undefined && index < count - 2 ? `, ${color.digit}` : index === count - 1 ? `, ±${color.tolerance}%` : '';
    return `<button type="button" class="swatch ${key === 'none' ? 'swatch-none' : ''} ${selected ? 'is-selected' : ''}" data-band="${index}" data-color="${key}" aria-label="${label}: ${color.label}${value}" aria-pressed="${selected}" title="${color.label}${index === count - 1 ? ` ±${color.tolerance}%` : ''}"><span style="--swatch:${color.hex}"></span></button>`;
  }).join('');
}

function bandValue(index: number, colorKey: ColorKey, count: BandCount): string {
  const color = colorByKey[colorKey];
  if (index < count - 2) return `${color.digit}`;
  if (index === count - 2) return `×${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(color.multiplier!)}`;
  return `±${color.tolerance}%`;
}

function builderView(): string {
  const resistor = calculate(state.bands);
  const count = state.bandCount;
  const colors = state.bands.map(key => colorByKey[key].label).join(' · ');
  const positions = count === 4 ? [32.8, 44.9, 57.1, 69.3] : [30.4, 39.1, 47.8, 61.3, 73.6];
  return `<div class="page-heading">
      <div><h1>Renklerden değere</h1><p>${count} bandın renklerini seçin; direnç değeri ve aralığı anında hesaplansın.</p></div>
      <div class="heading-side"><span class="live-dot"></span> Canlı hesaplama</div>
    </div>
    <div class="compact-readout" aria-label="Canlı direnç sonucu"><span><small>Direnç</small><strong>${formatOhms(resistor.ohms)}</strong></span><span><small>Tolerans</small><strong>±${resistor.tolerance}%</strong></span><span class="compact-range"><small>Aralık</small><strong>${formatOhms(resistor.min)} – ${formatOhms(resistor.max)}</strong></span></div>
    <div class="workspace-grid">
      <section class="preview-panel" aria-labelledby="preview-title">
        <div class="panel-top"><div><h2 id="preview-title">Oluşturulan direnç</h2><p>Seçiminizin görsel karşılığı</p></div><span class="panel-index"><select id="builder-band-count" aria-label="Bant sayısı"><option value="4" ${count === 4 ? 'selected' : ''}>4 bant</option><option value="5" ${count === 5 ? 'selected' : ''}>5 bant</option></select></span></div>
        <div class="art-stage">
          <div class="stage-ruler">${positions.map((position, index) => `<span style="left:${position}%">${index + 1}</span>`).join('')}</div>
          ${resistorSvg(state.bands, 'preview')}
          <div class="stage-caption">${escapeHtml(colors)}</div>
        </div>
        <div class="readout">
          <div class="readout-main"><span class="label">Nominal direnç</span><strong>${formatOhms(resistor.ohms)}</strong></div>
          <div class="readout-tolerance"><span class="label">Tolerans</span><strong>±${resistor.tolerance}%</strong></div>
        </div>
        <div class="range-block"><div><span>Alt sınır</span><strong>${formatOhms(resistor.min)}</strong></div><div class="range-line"><span></span></div><div><span>Üst sınır</span><strong>${formatOhms(resistor.max)}</strong></div></div>
        <div class="panel-footer"><p>Üretim toleransı dahil olası direnç aralığı</p><button type="button" class="export-button" data-action="export">PNG kaydet <span aria-hidden="true">↗</span></button></div>
        <form id="favorite-form" class="favorite-save-form"><div class="favorite-save-heading"><strong>Projeye kaydet</strong><span>Bu direnç ve renklerini favorilerde saklayın</span></div>
          <div class="favorite-save-fields"><label><span>Ad</span><input id="favorite-name" name="name" maxlength="80" value="${escapeHtml(state.favoriteName)}" placeholder="Örn. Giriş filtresi" required></label><label><span>Kategori</span><input id="favorite-category" name="category" list="category-suggestions" maxlength="40" value="${escapeHtml(state.favoriteCategory)}" placeholder="Örn. Güç devresi" required></label></div>
          ${categorySuggestions()}${state.libraryError ? `<p class="form-error">${escapeHtml(state.libraryError)}</p>` : ''}<button class="favorite-save-button" type="submit" ${state.libraryError ? 'disabled' : ''}>Favorilere ekle <span aria-hidden="true">＋</span></button>
        </form>
      </section>
      <section class="controls-panel" aria-labelledby="controls-title">
        <div class="panel-top"><div><h2 id="controls-title">Renk bantları</h2><p>Her bant için geçerli rengi seçin</p></div></div>
        <div class="band-list">${state.bands.map((key, index) => `<div class="band-row ${state.activeBand === index ? 'is-active' : ''}">
          <div class="band-row-top"><div class="band-name"><span class="band-number">${index + 1}</span><span>${bandTitle(index, count)}</span></div><div class="chosen"><span>${colorByKey[key].label}</span><b>${bandValue(index, key, count)}</b></div></div>
          <div class="swatches" role="group" aria-label="${bandTitle(index, count)} renkleri">${swatches(index, count)}</div>
        </div>`).join('')}</div>
        <p class="helper-copy">${count === 4 ? 'İlk iki bant rakamı, üçüncü çarpanı, son bant toleransı belirler.' : 'İlk üç bant rakamı, dördüncü çarpanı, son bant toleransı belirler.'}</p>
      </section>
    </div>`;
}

function favoritesView(): string {
  const categories = categoryOptions();
  const query = state.favoriteQuery.trim().toLocaleLowerCase('tr');
  const filtered = state.favorites.filter(item => (!state.favoriteFilter || item.category === state.favoriteFilter) && (!query || `${item.name} ${item.category} ${formatOhms(calculate(item.bands).ohms)}`.toLocaleLowerCase('tr').includes(query)));
  return `<div class="page-heading"><div><h1>Favoriler</h1><p>Projelerinizde kullandığınız dirençleri adlandırın ve kategorilere ayırın.</p></div><div class="heading-side">${state.favorites.length} kayıt</div></div>
    ${state.libraryError ? `<div class="library-error" role="alert">${escapeHtml(state.libraryError)}</div>` : ''}
    <section class="favorites-panel" aria-label="Kayıtlı dirençler">${categorySuggestions()}<div class="favorites-toolbar"><label><span>Ara</span><input id="favorite-query" type="search" value="${escapeHtml(state.favoriteQuery)}" placeholder="Ad veya değer ara"></label><label><span>Kategori</span><select id="favorite-filter"><option value="">Tüm kategoriler</option>${categories.map(category => `<option value="${escapeHtml(category)}" ${state.favoriteFilter === category ? 'selected' : ''}>${escapeHtml(category)}</option>`).join('')}</select></label></div>
    ${filtered.length ? `<div class="favorites-grid">${filtered.map(item => {
      const resistor = calculate(item.bands);
      const editing = state.editingFavoriteId === item.id;
      return `<article class="favorite-card"><div class="favorite-card-top"><span class="category-pill">${escapeHtml(item.category)}</span><span class="favorite-date">${new Date(item.createdAt).toLocaleDateString('tr-TR')}</span></div>
        <div class="favorite-illustration">${miniResistorSvg(item.bands)}</div>
        ${editing ? `<form class="favorite-edit-form" data-edit-form="${escapeHtml(item.id)}"><label><span>Ad</span><input name="name" maxlength="80" value="${escapeHtml(item.name)}" required></label><label><span>Kategori</span><input name="category" list="category-suggestions" maxlength="40" value="${escapeHtml(item.category)}" required></label><div class="favorite-actions"><button type="submit" class="primary-small">Kaydet</button><button type="button" data-action="cancel-edit">Vazgeç</button></div></form>` : `<h2>${escapeHtml(item.name)}</h2><div class="favorite-value"><strong>${formatOhms(resistor.ohms)}</strong><span>±${resistor.tolerance}%</span></div><p class="favorite-range">${formatOhms(resistor.min)} – ${formatOhms(resistor.max)}</p><p class="favorite-colors">${item.bands.map(key => colorByKey[key].label).join(' · ')}</p><div class="favorite-actions"><button type="button" class="primary-small" data-open-favorite="${escapeHtml(item.id)}">Direnci aç</button><button type="button" data-edit-favorite="${escapeHtml(item.id)}">Düzenle</button><button type="button" class="delete-small" data-delete-favorite="${escapeHtml(item.id)}">Sil</button></div>`}</article>`;
    }).join('')}</div>` : `<div class="empty-results"><span class="empty-mark" aria-hidden="true">☆</span><h3>${state.favorites.length ? 'Bu filtrede kayıt bulunamadı' : 'Henüz favori yok'}</h3><p>${state.favorites.length ? 'Arama veya kategori filtresini değiştirebilirsiniz.' : 'Renklerden değere bölümünde bir direnci kaydedin.'}</p>${state.favorites.length ? '' : '<button type="button" class="empty-action" data-mode="builder">Direnç oluştur</button>'}</div>`}</section>`;
}

function finderView(): string {
  const target = parseTarget(state.searchValue, state.unit);
  const results = target ? searchResistors(target, state.series, state.toleranceColor, state.bandCount) : [];
  const visible = results.slice(0, state.resultLimit);
  const targetLabel = target ? formatOhms(target) : '—';
  return `<div class="page-heading"><div><h1>Değerden renge</h1><p>İhtiyacınız olan değeri yazın; tolerans aralığı o değeri kapsayan dirençleri görün.</p></div></div>
    <div class="finder-layout">
      <section class="finder-form-panel" aria-labelledby="finder-title">
        <div class="panel-top"><div><h2 id="finder-title">Hedef direnç</h2><p>Devrenizde gereken değeri girin</p></div></div>
        <form id="finder-form" novalidate>
          <label class="field-label" for="target-value">Direnç değeri</label>
          <div class="value-field"><input id="target-value" name="target" type="text" inputmode="decimal" value="${escapeHtml(state.searchValue)}" autocomplete="off" aria-describedby="target-help"/><select id="unit" name="unit" aria-label="Birim"><option value="1" ${state.unit === 1 ? 'selected' : ''}>Ω</option><option value="1000" ${state.unit === 1e3 ? 'selected' : ''}>kΩ</option><option value="1000000" ${state.unit === 1e6 ? 'selected' : ''}>MΩ</option></select></div>
          <p id="target-help" class="field-hint">Örnek: 4700 Ω veya 4,7 kΩ</p>
          <div class="finder-fields"><div><label class="field-label" for="finder-band-count">Bant sayısı</label><select id="finder-band-count" name="bandCount" class="select-field"><option value="4" ${state.bandCount === 4 ? 'selected' : ''}>4 bant</option><option value="5" ${state.bandCount === 5 ? 'selected' : ''}>5 bant</option></select></div>
          <div><label class="field-label" for="series">Değer serisi</label><select id="series" name="series" class="select-field"><option value="e24" ${state.series === 'e24' ? 'selected' : ''}>E24 · standart değerler</option><option value="all" ${state.series === 'all' ? 'selected' : ''}>Tüm geçerli değerler</option></select></div>
          <div><label class="field-label" for="tolerance">Tolerans</label><select id="tolerance" name="tolerance" class="select-field">${(state.bandCount === 4 ? TOLERANCE_OPTIONS : TOLERANCE_OPTIONS.filter(key => key !== 'none')).map(key => `<option value="${key}" ${state.toleranceColor === key ? 'selected' : ''}>±${colorByKey[key].tolerance}% · ${colorByKey[key].label}</option>`).join('')}</select></div></div>
          ${state.searchError ? `<p class="form-error" role="alert">${escapeHtml(state.searchError)}</p>` : ''}
          <button class="search-button" type="submit">Uygun dirençleri bul <span aria-hidden="true">→</span></button>
        </form>
        <div class="finder-note"><strong>Nasıl eşleşir?</strong><p>Bir direncin alt ve üst tolerans sınırı hedef değeri içeriyorsa sonuçlarda yer alır. Sonuçlar nominal değere yakınlığa göre sıralanır.</p></div>
      </section>
      <section class="results-panel" aria-labelledby="results-title"><div class="results-header"><div><h2 id="results-title">Uygun dirençler</h2><p>${target ? `${targetLabel} değerini kapsayan seçenekler` : 'Geçerli bir hedef değer girin'}</p></div><span class="result-count">${results.length} sonuç</span></div>
        ${visible.length ? `<div class="results-list">${visible.map((resistor, index) => `<button type="button" class="result-row" data-result="${index}" aria-label="${formatOhms(resistor.ohms)}, ±${resistor.tolerance} tolerans, renk seçimine geç">
          <span class="result-mini">${miniResistorSvg(resistor.bands)}</span><span class="result-value"><strong>${formatOhms(resistor.ohms)}</strong><small>${resistor.bands.map(key => colorByKey[key].label).join(' · ')}</small></span><span class="result-range">${formatOhms(resistor.min)}<span>–</span>${formatOhms(resistor.max)}</span><span class="result-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>${results.length > state.resultLimit ? `<button type="button" class="more-results" data-action="more-results">Daha fazla göster <span>${visible.length} / ${results.length}</span></button>` : ''}` : `<div class="empty-results"><span class="empty-mark" aria-hidden="true">Ω</span><h3>Bu aralıkta sonuç bulunamadı</h3><p>Farklı bir tolerans veya hedef değer deneyin.</p></div>`}
      </section>
    </div>`;
}

function render(): void {
  const active = document.activeElement as HTMLElement | null;
  const focusSelector = active?.id ? `#${active.id}` : active?.dataset.color ? `[data-band="${active.dataset.band}"][data-color="${active.dataset.color}"]` : active?.dataset.mode ? `[data-mode="${active.dataset.mode}"]` : active?.dataset.action ? `[data-action="${active.dataset.action}"]` : null;
  app.innerHTML = `<div class="app-shell">
    <aside class="sidebar"><div class="brand"><span class="brand-symbol" aria-hidden="true"><i></i><i></i><i></i></span><div><strong>BANT</strong><small>Direnç çalışma alanı</small></div></div>
      <nav class="nav" aria-label="Çalışma alanları"><span class="nav-label">ARAÇLAR</span><button type="button" data-mode="builder" class="nav-item ${state.mode === 'builder' ? 'is-current' : ''}" aria-current="${state.mode === 'builder' ? 'page' : 'false'}"><span class="nav-icon nav-icon-bands" aria-hidden="true"><i></i><i></i><i></i></span>Renklerden değere</button><button type="button" data-mode="finder" class="nav-item ${state.mode === 'finder' ? 'is-current' : ''}" aria-current="${state.mode === 'finder' ? 'page' : 'false'}"><span class="nav-icon nav-icon-omega" aria-hidden="true">Ω</span>Değerden renge</button><button type="button" data-mode="favorites" class="nav-item ${state.mode === 'favorites' ? 'is-current' : ''}" aria-current="${state.mode === 'favorites' ? 'page' : 'false'}"><span class="nav-icon nav-icon-favorites" aria-hidden="true">☆</span>Favoriler <span class="nav-count">${state.favorites.length}</span></button></nav>
      <div class="sidebar-bottom"><div class="standard-mark"><span class="standard-dot"></span><span>IEC 60062 renk kodu</span></div><p>4 ve 5 bantlı direnç hesaplayıcı<br/>Çevrimdışı çalışır</p></div>
    </aside>
    <div class="main-area"><header class="topbar"><span>Direnç hesaplayıcı</span><span class="topbar-right">Masaüstü çalışma alanı <span class="topbar-separator"></span> v1.1.1</span></header><main class="content">${state.mode === 'builder' ? builderView() : state.mode === 'finder' ? finderView() : favoritesView()}</main></div>
    ${state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : ''}
  </div>`;
  if (focusSelector) app.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
}

function showToast(message: string): void {
  state.toast = message;
  render();
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { state.toast = ''; render(); }, 3200);
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG oluşturulamadı')), 'image/png'));
}

async function exportPng(): Promise<void> {
  const resistor = calculate(state.bands);
  const canvas = document.createElement('canvas');
  canvas.width = 1500;
  canvas.height = 860;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Görsel alanı başlatılamadı');
  context.fillStyle = '#f5f7f8';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#172b34';
  context.font = '700 34px "Segoe UI", sans-serif';
  context.fillText('BANT', 84, 98);
  context.fillStyle = '#74828a';
  context.font = '24px "Segoe UI", sans-serif';
  context.fillText(`${state.bands.length} bantlı direnç renk kodu`, 84, 141);
  context.fillStyle = '#ffffff';
  context.fillRect(84, 183, 1332, 417);
  const image = new Image();
  const imageUrl = URL.createObjectURL(new Blob([resistorSvg(state.bands, 'export')], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Direnç çizimi yüklenemedi')); image.src = imageUrl; });
    context.drawImage(image, 112, 215, 1276, 365);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
  context.fillStyle = '#172b34';
  context.font = '700 56px "Segoe UI", sans-serif';
  context.fillText(formatOhms(resistor.ohms), 84, 700);
  context.font = '600 31px "Segoe UI", sans-serif';
  context.fillText(`±${resistor.tolerance}%`, 84, 754);
  context.fillStyle = '#596b74';
  context.font = '25px "Segoe UI", sans-serif';
  context.fillText(`${formatOhms(resistor.min)} – ${formatOhms(resistor.max)}`, 84, 805);
  context.textAlign = 'right';
  context.fillText(state.bands.map(key => colorByKey[key].label).join('  /  '), 1416, 754);
  const blob = await toBlob(canvas);
  const filename = `bant-${Math.round(resistor.ohms * 1000) / 1000}-ohm.png`;
  if (isTauri()) {
    const path = await save({ defaultPath: filename, filters: [{ name: 'PNG görseli', extensions: ['png'] }] });
    if (!path) return;
    await invoke('save_png', { path, bytes: Array.from(new Uint8Array(await blob.arrayBuffer())) });
    showToast('PNG görseli kaydedildi.');
  } else {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('PNG görseli indirildi.');
  }
}

app.addEventListener('click', async event => {
  const target = event.target as Element;
  const modeButton = target.closest<HTMLButtonElement>('[data-mode]');
  if (modeButton) { state.mode = modeButton.dataset.mode as Mode; state.searchError = ''; render(); return; }
  const openFavorite = target.closest<HTMLButtonElement>('[data-open-favorite]');
  if (openFavorite) {
    const favorite = state.favorites.find(item => item.id === openFavorite.dataset.openFavorite);
    if (!favorite) return;
    state.bands = [...favorite.bands];
    state.bandCount = favorite.bands.length as BandCount;
    state.favoriteName = favorite.name;
    state.favoriteCategory = favorite.category;
    state.mode = 'builder';
    render();
    return;
  }
  const editFavorite = target.closest<HTMLButtonElement>('[data-edit-favorite]');
  if (editFavorite) { state.editingFavoriteId = editFavorite.dataset.editFavorite!; render(); return; }
  if (target.closest('[data-action="cancel-edit"]')) { state.editingFavoriteId = ''; render(); return; }
  const deleteFavorite = target.closest<HTMLButtonElement>('[data-delete-favorite]');
  if (deleteFavorite && !libraryBusy) {
    const favorite = state.favorites.find(item => item.id === deleteFavorite.dataset.deleteFavorite);
    if (!favorite || !window.confirm(`“${favorite.name}” favorilerden silinsin mi?`)) return;
    libraryBusy = true;
    try {
      const next = state.favorites.filter(item => item.id !== favorite.id);
      await saveFavorites(next);
      state.favorites = next;
      if (state.favoriteFilter && !next.some(item => item.category === state.favoriteFilter)) state.favoriteFilter = '';
      showToast('Favori silindi.');
    } catch (error) { showToast(`Silinemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`); }
    finally { libraryBusy = false; }
    return;
  }
  if (target.closest('[data-action="more-results"]')) { state.resultLimit += 12; render(); return; }
  const swatch = target.closest<HTMLButtonElement>('[data-color]');
  if (swatch) {
    const index = Number(swatch.dataset.band);
    const key = swatch.dataset.color as ColorKey;
    if (!bandOptions(state.bandCount)[index].includes(key)) return;
    state.bands[index] = key;
    state.activeBand = index;
    render();
    return;
  }
  const previewBand = target.closest<SVGRectElement>('[data-preview-band]');
  if (previewBand) {
    state.activeBand = Number(previewBand.dataset.previewBand);
    render();
    app.querySelectorAll('.band-row')[state.activeBand]?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    return;
  }
  const resultButton = target.closest<HTMLButtonElement>('[data-result]');
  if (resultButton) {
    const targetValue = parseTarget(state.searchValue, state.unit);
    if (!targetValue) return;
    const match = searchResistors(targetValue, state.series, state.toleranceColor, state.bandCount)[Number(resultButton.dataset.result)];
    if (!match) return;
    state.bands = [...match.bands];
    state.bandCount = match.bands.length as BandCount;
    state.mode = 'builder';
    render();
    return;
  }
  if (target.closest('[data-action="export"]')) {
    try { await exportPng(); } catch (error) { showToast(`Kaydedilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`); }
  }
});

app.addEventListener('input', event => {
  const target = event.target as HTMLInputElement;
  if (target.id === 'target-value') { state.searchValue = target.value; state.resultLimit = 12; }
  if (target.id === 'favorite-name') state.favoriteName = target.value;
  if (target.id === 'favorite-category') state.favoriteCategory = target.value;
  if (target.id === 'favorite-query') state.favoriteQuery = target.value;
});

app.addEventListener('change', event => {
  const target = event.target as HTMLSelectElement;
  if (target.id === 'builder-band-count') {
    state.bandCount = Number(target.value) as BandCount;
    state.bands = [...(state.bandCount === 4 ? DEFAULT_FOUR_BANDS : DEFAULT_BANDS)];
    state.activeBand = 0;
    render();
    return;
  }
  if (target.id === 'finder-band-count') {
    state.bandCount = Number(target.value) as BandCount;
    state.bands = [...(state.bandCount === 4 ? DEFAULT_FOUR_BANDS : DEFAULT_BANDS)];
    state.activeBand = 0;
    if (state.bandCount === 5 && state.toleranceColor === 'none') state.toleranceColor = 'gold';
  }
  if (target.id === 'unit') state.unit = Number(target.value);
  if (target.id === 'series') state.series = target.value as Series;
  if (target.id === 'tolerance') state.toleranceColor = target.value as ToleranceKey;
  if (target.id === 'favorite-filter') { state.favoriteFilter = target.value; render(); return; }
  if (target.id === 'favorite-query') { render(); return; }
  if (['unit', 'series', 'tolerance', 'finder-band-count'].includes(target.id)) { state.resultLimit = 12; state.searchError = ''; render(); }
});

app.addEventListener('submit', async event => {
  const form = event.target as HTMLFormElement;
  if (form.id === 'favorite-form') {
    event.preventDefault();
    if (libraryBusy || state.libraryError) return;
    const fields = new FormData(form);
    const name = String(fields.get('name') ?? '').trim();
    const category = String(fields.get('category') ?? '').trim();
    if (!name || !category || name.length > 80 || category.length > 40) { showToast('Ad ve kategori girin.'); return; }
    libraryBusy = true;
    try {
      const favorite: Favorite = { id: crypto.randomUUID(), name, category, bands: [...state.bands], createdAt: new Date().toISOString() };
      const next = [favorite, ...state.favorites];
      await saveFavorites(next);
      state.favorites = next;
      state.favoriteName = '';
      state.favoriteCategory = category;
      showToast('Direnç favorilere eklendi.');
    } catch (error) { showToast(`Kaydedilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`); }
    finally { libraryBusy = false; }
    return;
  }
  if (form.dataset.editForm) {
    event.preventDefault();
    if (libraryBusy) return;
    const fields = new FormData(form);
    const name = String(fields.get('name') ?? '').trim();
    const category = String(fields.get('category') ?? '').trim();
    if (!name || !category || name.length > 80 || category.length > 40) { showToast('Ad ve kategori girin.'); return; }
    libraryBusy = true;
    try {
      const next = state.favorites.map(item => item.id === form.dataset.editForm ? { ...item, name, category } : item);
      await saveFavorites(next);
      state.favorites = next;
      state.editingFavoriteId = '';
      if (state.favoriteFilter && !next.some(item => item.category === state.favoriteFilter)) state.favoriteFilter = '';
      showToast('Favori güncellendi.');
    } catch (error) { showToast(`Güncellenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`); }
    finally { libraryBusy = false; }
    return;
  }
  if (form.id !== 'finder-form') return;
  event.preventDefault();
  const value = parseTarget(state.searchValue, state.unit);
  state.resultLimit = 12;
  state.searchError = value ? '' : '0 ile 1 trilyon Ω arasında geçerli bir sayı girin.';
  render();
});

render();
loadLibrary().then(favorites => { state.favorites = favorites; render(); }).catch(error => {
  state.libraryError = `Favoriler yüklenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`;
  render();
});
