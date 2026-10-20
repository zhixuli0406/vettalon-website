// Desktop installers shown on /download/. One version for every platform;
// update VERSION and FILES together when a desktop release is published
// (`npm run check:downloads` confirms every link answers before a deploy).
// There is no Intel Mac build: the desktop app supports Apple Silicon only.

export const DESKTOP_VERSION = '0.3.8';
const BASE = `https://github.com/zhixuli0406/vettalon-releases/releases/download/desktop-v${DESKTOP_VERSION}/`;

const file = (name, bytes, sha256) => ({ name, bytes, sha256, url: BASE + name });

export const FILES = {
  mac: file(`Vettalon_${DESKTOP_VERSION}_aarch64.dmg`, 9240585, '78aaa0e2dab154509777ccd5e7d59074283019006779b90265d3c8b5eec2968c'),
  windows: file(`Vettalon_${DESKTOP_VERSION}_x64-setup.exe`, 6129367, 'db193a2fd213178eae160cebd1f200117235a57102451b70647473e144b05e3d'),
  deb: file(`Vettalon_${DESKTOP_VERSION}_amd64.deb`, 9889678, '0a6ee4626fe27e8aed25a1c6e4451d621651e881d528ae6f4cd6cd95a2402aa0'),
  appimage: file(`Vettalon_${DESKTOP_VERSION}_amd64.AppImage`, 87366136, 'e4417dff023526621bfff87bb6e49fa1714646e888b5fa796e35fff14fcc43a2'),
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
