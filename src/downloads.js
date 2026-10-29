// Desktop installers shown on /download/. One version for every platform;
// update VERSION and FILES together when a desktop release is published
// (`npm run check:downloads` confirms every link answers before a deploy).
// There is no Intel Mac build: the desktop app supports Apple Silicon only.

export const DESKTOP_VERSION = '0.7.0';
const BASE = `https://github.com/zhixuli0406/vettalon-releases/releases/download/desktop-v${DESKTOP_VERSION}/`;

const file = (name, bytes, sha256) => ({ name, bytes, sha256, url: BASE + name });

export const FILES = {
  mac: file(`Vettalon_${DESKTOP_VERSION}_aarch64.dmg`, 11458460, 'd3135b02f88a26866adbe4022a1cbd3fa140934821293b7bfb844b67a271ec57'),
  windows: file(`Vettalon_${DESKTOP_VERSION}_x64-setup.exe`, 7699033, 'cfe313341ef8dfda02faf0437fc701d811266b8f9dcc512b1113125ff42f0da0'),
  deb: file(`Vettalon_${DESKTOP_VERSION}_amd64.deb`, 12569358, 'b9de24de8b647de51c8e0fbeb15d2a58b5aa13d18181678d2fe8883067c3e95f'),
  appimage: file(`Vettalon_${DESKTOP_VERSION}_amd64.AppImage`, 89750008, 'c8b947dd6530ec0cbf0ae5bc3444b96ae9944bf06dd7cf128b1d3503968c52f0'),
};

export const formatSize = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`;

// Classify a browser from plain values so it can be tested without a DOM.
// os: mac | windows | linux | mobile | other; arch (Mac only): arm | x86 | ''.
export function classifyPlatform({ userAgent = '', uaPlatform = '', maxTouchPoints = 0, architecture = '', renderer = '' } = {}) {
  const ua = userAgent;
  const hint = uaPlatform.toLowerCase();
  if (/iPhone|iPad|iPod|Android/i.test(ua) || hint === 'android' || hint === 'ios') return { os: 'mobile', arch: '' };
  if (hint === 'macos' || /Macintosh|Mac OS X/i.test(ua)) {
    // iPadOS asks for the desktop site with a Mac user agent.
    if (maxTouchPoints > 1) return { os: 'mobile', arch: '' };
    return { os: 'mac', arch: macArch(architecture, renderer) };
  }
  if (hint === 'windows' || /Windows/i.test(ua)) return { os: 'windows', arch: '' };
  if (hint === 'chrome os' || /CrOS/i.test(ua)) return { os: 'other', arch: '' };
  if (hint === 'linux' || /Linux|X11/i.test(ua)) return { os: 'linux', arch: '' };
  return { os: 'other', arch: '' };
}

// Every Mac browser reports "Intel Mac OS X", so the user agent cannot tell
// the chip. Chromium exposes it through client hints; other browsers only
// sometimes through the WebGL renderer name. Unknown stays unknown.
function macArch(architecture, renderer) {
  if (architecture === 'arm') return 'arm';
  if (architecture === 'x86') return 'x86';
  if (/Apple M\d/i.test(renderer)) return 'arm';
  if (/Intel/i.test(renderer)) return 'x86';
  return '';
}

function webglRenderer() {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const info = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  } catch {
    return '';
  }
}

// Browser-only: read what the browser offers and classify it.
export async function probePlatform() {
  const nav = window.navigator;
  const uaData = nav.userAgentData;
  let architecture = '';
  if (uaData?.getHighEntropyValues) {
    try {
      ({ architecture = '' } = await uaData.getHighEntropyValues(['architecture']));
    } catch {
      architecture = '';
    }
  }
  const base = { userAgent: nav.userAgent, uaPlatform: uaData?.platform ?? '', maxTouchPoints: nav.maxTouchPoints ?? 0, architecture };
  const first = classifyPlatform(base);
  if (first.os !== 'mac' || first.arch) return first;
  return classifyPlatform({ ...base, renderer: webglRenderer() });
}
