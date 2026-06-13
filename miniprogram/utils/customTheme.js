const CUSTOM_THEME_COLORS = [
  { value: '#4DA3FF', label: '商务蓝', suffix: '-custom-blue' },
  { value: '#8659D5', label: '韵味紫', suffix: '-custom-purple' },
  { value: '#FF5A6E', label: '爆燃红', suffix: '-custom-red' },
  { value: '#FF8A3D', label: '活力橙', suffix: '-custom-orange' },
  { value: '#35D6D0', label: '七英青', suffix: '-custom-cyan' }
];

const DEFAULT_CUSTOM_PRIMARY = '#4DA3FF';

function normalizeHex(hex) {
  const value = String(hex || '').trim();
  const match = value.match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : DEFAULT_CUSTOM_PRIMARY;
}

function hexToRgb(hex) {
  const value = normalizeHex(hex).slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((item) => Math.max(0, Math.min(255, Math.round(item))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function rgbToHsl({ r, g, b }) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === nr) h = (ng - nb) / d + (ng < nb ? 6 : 0);
    else if (max === ng) h = (nb - nr) / d + 2;
    else h = (nr - ng) / d + 4;
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }) {
  const ns = s / 100;
  const nl = l / 100;
  const c = (1 - Math.abs(2 * nl - 1)) * ns;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = nl - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255
  };
}

function hslToHex(h, s, l) {
  return rgbToHex(hslToRgb({ h: ((h % 360) + 360) % 360, s, l }));
}

function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCustomPrimaryColor() {
  return normalizeHex(wx.getStorageSync('customPrimaryColor') || DEFAULT_CUSTOM_PRIMARY);
}

function saveCustomPrimaryColor(color) {
  const normalized = normalizeHex(color);
  wx.setStorageSync('customPrimaryColor', normalized);
  return normalized;
}

function getCustomThemeIconSuffix(color) {
  const normalized = normalizeHex(color || getCustomPrimaryColor());
  const matched = CUSTOM_THEME_COLORS.find((item) => item.value === normalized);
  return matched ? matched.suffix : CUSTOM_THEME_COLORS[0].suffix;
}

function buildCustomThemePalette(primaryHex) {
  const primary = normalizeHex(primaryHex);
  const hsl = rgbToHsl(hexToRgb(primary));
  const hue = hsl.h;
  const saturation = Math.max(55, Math.min(92, hsl.s));
  const lightness = Math.max(54, Math.min(66, hsl.l));
  const normalizedPrimary = hslToHex(hue, saturation, lightness);
  const primaryStrong = hslToHex(hue, Math.max(50, saturation - 8), Math.max(34, lightness - 18));

  return {
    bg: hslToHex(hue, 26, 7),
    surface: hslToHex(hue, 24, 10),
    card: hslToHex(hue, 24, 14),
    cardStrong: hslToHex(hue, 24, 11),
    border: hslToHex(hue, 28, 24),
    primary: normalizedPrimary,
    primaryStrong,
    danger: '#FF5148',
    text: hslToHex(hue, 32, 96),
    muted: hslToHex(hue, 20, 62),
    buttonText: '#071014',
    radial1: rgbaFromHex(normalizedPrimary, 0.14),
    radial2: rgbaFromHex(primaryStrong, 0.1),
    fade5: rgbaFromHex(normalizedPrimary, 0.05),
    fade6: rgbaFromHex(normalizedPrimary, 0.06),
    fade8: rgbaFromHex(normalizedPrimary, 0.08),
    fade12: rgbaFromHex(normalizedPrimary, 0.12),
    fade15: rgbaFromHex(normalizedPrimary, 0.15),
    fade34: rgbaFromHex(normalizedPrimary, 0.34)
  };
}

function buildCustomThemeStyle(primaryHex) {
  const palette = buildCustomThemePalette(primaryHex);
  return [
    `--bg: ${palette.bg}`,
    `--surface: ${palette.surface}`,
    `--card: ${palette.card}`,
    `--card-strong: ${palette.cardStrong}`,
    `--border: ${palette.border}`,
    `--primary: ${palette.primary}`,
    `--primary-strong: ${palette.primaryStrong}`,
    `--danger: ${palette.danger}`,
    `--text: ${palette.text}`,
    `--muted: ${palette.muted}`,
    `--button-text: ${palette.buttonText}`,
    `--primary-fade-5: ${palette.fade5}`,
    `--primary-fade-6: ${palette.fade6}`,
    `--primary-fade-8: ${palette.fade8}`,
    `--primary-fade-12: ${palette.fade12}`,
    `--primary-fade-15: ${palette.fade15}`,
    `--primary-fade-34: ${palette.fade34}`,
    `--radial-1: ${palette.radial1}`,
    `--radial-2: ${palette.radial2}`
  ].join('; ');
}

module.exports = {
  CUSTOM_THEME_COLORS,
  DEFAULT_CUSTOM_PRIMARY,
  buildCustomThemePalette,
  buildCustomThemeStyle,
  getCustomPrimaryColor,
  getCustomThemeIconSuffix,
  saveCustomPrimaryColor
};
