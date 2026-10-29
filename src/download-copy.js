// Copy for /download/. Platform requirements here must match the desktop
// build: macOS 11+ on Apple Silicon only, Windows 10/11 x64, Linux x86_64
// built on Ubuntu 22.04. PDF export drives a locally installed Chromium.

import { PLAN } from './plan.js';
import { DESKTOP_VERSION } from './downloads.js';

export const downloadCopy = {
  zh: {
    title: '下載 Vettalon 桌面 App',
    metaDescription: `下載 Vettalon Pro／Team 桌面 App ${DESKTOP_VERSION}：macOS（限 Apple Silicon，不支援 Intel Mac）、Windows 10／11、Linux。安裝後輸入授權金鑰即可啟用。`,
    eyebrow: 'Vettalon Pro／Team 桌面 App',
    lead: `${DESKTOP_VERSION} 支援來源綁定的 PoC 重現與修補檢查、每階段全新容器，以及 AI 引擎不可用時的 incomplete 判定。驗證目前限支援的 Python command／path／SQL 目標。安裝後輸入購買時 email 收到的授權金鑰即可啟用。`,
    version: (v) => `版本 ${v}`,
    detecting: '正在判斷你的作業系統…',
    pick: '選擇下方的作業系統下載。',
    allPlatforms: '所有平台',
    download: '下載',
    downloadFor: { mac: '下載 macOS 版', windows: '下載 Windows 版', deb: '下載 .deb', appimage: '下載 AppImage' },
    detected: { mac: '偵測到 Mac', windows: '偵測到 Windows', linux: '偵測到 Linux' },
    macUnknownArch: '僅支援 Apple Silicon（M1 以上）。不確定的話，點左上角蘋果選單 →「關於這台 Mac」，「晶片」顯示 Apple M 開頭就能使用。',
    intel: {
      title: '這台 Mac 看起來是 Intel 處理器',
      body: 'Vettalon 桌面 App 不支援 Intel Mac，只能在 Apple Silicon（M1 以上）的 Mac 上執行。還沒購買的話，請不要為這台電腦購買 Pro／Team。免費的開源 CLI 可以在 Intel Mac 上使用。',
      check: '想確認的話，點左上角蘋果選單 →「關於這台 Mac」：顯示「處理器 … Intel」就是 Intel Mac，顯示「晶片 Apple M…」則可使用。',
      wrong: '偵測錯了？仍然下載 macOS 版',
    },
    mobile: 'Vettalon 是桌面 App，請在 Mac、Windows 或 Linux 電腦上開啟這一頁下載。',
    other: '目前沒有你這個系統的版本。可用的平台列在下方。',
    noIntel: '不支援 Intel Mac',
    platforms: {
      mac: { name: 'macOS', req: ['Apple Silicon 晶片（M1 以上）', 'macOS 11 Big Sur 以上', '已通過 Apple 公證'], files: [{ key: 'mac', label: 'DMG 安裝檔' }] },
      windows: { name: 'Windows', req: ['Windows 10／11，64 位元（x64）', '缺少 WebView2 時，安裝程式會自動下載'], files: [{ key: 'windows', label: '安裝程式（.exe）' }] },
      linux: { name: 'Linux', req: ['x86_64', '以 Ubuntu 22.04 建置，較舊的發行版可能無法執行'], files: [{ key: 'deb', label: 'Debian／Ubuntu（.deb）' }, { key: 'appimage', label: '其他發行版（AppImage）' }] },
    },
    sha: 'SHA-256',
    install: {
      title: '安裝與啟用',
      steps: {
        mac: '打開 DMG，把 Vettalon 拖進「應用程式」資料夾。',
        windows: '執行安裝程式。Windows 若顯示 SmartScreen 提示，點「其他資訊」→「仍要執行」。',
        linux: '.deb 用 sudo apt install ./檔名.deb 安裝；AppImage 先 chmod +x 再執行。',
      },
      activate: `第一次開啟時，貼上購買後 email 收到的授權金鑰。Pro 可啟用 ${PLAN.proDevices} 台裝置，Team 可啟用 ${PLAN.teamSeats} 台。`,
      update: `App 會自動檢查並下載更新，通過簽章驗證後先問你再安裝；側欄的「檢查更新」可以立即檢查。安全更新至少免費 ${PLAN.supportYears} 年，不需要 Update Plan。`,
    },
    notes: {
      title: '下載前請確認',
      items: [
        `桌面 App 不支援 Intel 處理器的 Mac。購買後才發現無法使用，可在付款後 ${PLAN.refundDays} 天內來信全額退款。`,
        '匯出 PDF 時需要電腦上已安裝 Chrome、Edge 或 Chromium。HTML 與 Word 匯出不需要。',
        '下載後可用上方的 SHA-256 核對檔案是否完整。',
        `每筆購買的安全更新至少免費到購買日起第 ${PLAN.supportYears} 年同一個月的月底，和 Update Plan 無關。細節見頁尾的「支援期與安全更新」。`,
      ],
    },
    cli: { title: '只需要命令列？', body: '開源 CLI 免費，Intel Mac、Apple Silicon 與 Linux 都能用：', cmd: 'npm install -g vettalon' },
  },
  en: {
    title: 'Download the Vettalon desktop app',
    metaDescription: `Download Vettalon Pro / Team desktop app ${DESKTOP_VERSION} for macOS (Apple Silicon only, Intel Macs are not supported), Windows 10/11 and Linux. Activate it with your license key.`,
    eyebrow: 'Vettalon Pro / Team desktop app',
    lead: `Version ${DESKTOP_VERSION} supports source-bound PoC reproduction and fix checks, fresh containers for every phase, and an incomplete verdict when no AI engine is available. Verification currently supports selected Python command, path, and SQL targets. After installing, enter the license key emailed to you at purchase.`,
    version: (v) => `Version ${v}`,
    detecting: 'Checking your operating system…',
    pick: 'Pick your operating system below.',
    allPlatforms: 'All platforms',
    download: 'Download',
    downloadFor: { mac: 'Download for macOS', windows: 'Download for Windows', deb: 'Download .deb', appimage: 'Download AppImage' },
    detected: { mac: 'Mac detected', windows: 'Windows detected', linux: 'Linux detected' },
    macUnknownArch: 'Apple Silicon (M1 or later) only. To check, open the Apple menu > About This Mac: a chip named "Apple M…" is supported.',
    intel: {
      title: 'This Mac looks like it has an Intel processor',
      body: 'The Vettalon desktop app does not run on Intel Macs. It needs a Mac with Apple Silicon (M1 or later). If you have not bought a license yet, do not buy Pro or Team for this computer. The free open-source CLI works on Intel Macs.',
      check: 'To check, open the Apple menu > About This Mac. "Processor … Intel" means an Intel Mac; "Chip Apple M…" is supported.',
      wrong: 'Wrong guess? Download for macOS anyway',
    },
    mobile: 'Vettalon is a desktop app. Open this page on a Mac, Windows or Linux computer to download it.',
    other: 'There is no build for your system yet. The supported platforms are listed below.',
    noIntel: 'Intel Macs not supported',
    platforms: {
      mac: { name: 'macOS', req: ['Apple Silicon (M1 or later)', 'macOS 11 Big Sur or later', 'Notarized by Apple'], files: [{ key: 'mac', label: 'DMG installer' }] },
      windows: { name: 'Windows', req: ['Windows 10/11, 64-bit (x64)', 'Installs WebView2 if it is missing'], files: [{ key: 'windows', label: 'Installer (.exe)' }] },
      linux: { name: 'Linux', req: ['x86_64', 'Built on Ubuntu 22.04; older distributions may not run it'], files: [{ key: 'deb', label: 'Debian / Ubuntu (.deb)' }, { key: 'appimage', label: 'Other distributions (AppImage)' }] },
    },
    sha: 'SHA-256',
    install: {
      title: 'Install and activate',
      steps: {
        mac: 'Open the DMG and drag Vettalon into Applications.',
        windows: 'Run the installer. If SmartScreen appears, choose More info > Run anyway.',
        linux: 'Install the .deb with sudo apt install ./file.deb, or chmod +x the AppImage and run it.',
      },
      activate: `On first launch, paste the license key from your purchase email. Pro activates up to ${PLAN.proDevices} devices, Team up to ${PLAN.teamSeats}.`,
      update: `The app checks for and downloads updates automatically and asks before installing a signature-checked update; Check for updates in the sidebar checks right away. Security updates stay free for at least ${PLAN.supportYears} years, no Update Plan needed.`,
    },
    notes: {
      title: 'Before you download',
      items: [
        `The desktop app does not support Macs with Intel processors. If you bought it and it does not run, email us within ${PLAN.refundDays} days of payment for a full refund.`,
        'PDF export needs Chrome, Edge or Chromium installed. HTML and Word export do not.',
        'Use the SHA-256 values above to check each download.',
        `Security updates are free for every purchase until at least the end of the same calendar month ${PLAN.supportYears} years after the purchase date, whatever your Update Plan status. See Support and security updates in the footer.`,
      ],
    },
    cli: { title: 'Only need the command line?', body: 'The open-source CLI is free and runs on Intel Macs, Apple Silicon and Linux:', cmd: 'npm install -g vettalon' },
  },
};
