// Desktop installers shown on /download/. One version for every platform;
// update VERSION and FILES together when a desktop release is published
// (`npm run check:downloads` confirms every link answers before a deploy).
// There is no Intel Mac build: the desktop app supports Apple Silicon only.

export const DESKTOP_VERSION = '0.6.0';
const BASE = `https://github.com/zhixuli0406/vettalon-releases/releases/download/desktop-v${DESKTOP_VERSION}/`;

const file = (name, bytes, sha256) => ({ name, bytes, sha256, url: BASE + name });

export const FILES = {
  mac: file(`Vettalon_${DESKTOP_VERSION}_aarch64.dmg`, 11136601, 'b0e64281ad581d83062d93779f2e76ffbc602d28c3173255feac40de7e3416fd'),
  windows: file(`Vettalon_${DESKTOP_VERSION}_x64-setup.exe`, 7461487, '6288ecf1629de5bec3573a716682783d9c43c2ba36c702065f7ab993b0dc6b9e'),
  deb: file(`Vettalon_${DESKTOP_VERSION}_amd64.deb`, 12185016, '918f5be7f6f75e9f9f75aa27c4e0709e0691b7ae8429b0dcec1feb2f9f213fe2'),
  appimage: file(`Vettalon_${DESKTOP_VERSION}_amd64.AppImage`, 89405944, 'd6694f06524d6bcb38fdecd99f0c6567b0b3d995a3cb7d19bc1af453f8dbfb1a'),
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
