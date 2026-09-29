(() => {
  'use strict';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const card = document.getElementById('business-card');
  const frame = document.getElementById('card-frame');
  const status = document.getElementById('card-status');
  const save = document.getElementById('save-card');
  const saveLabel = document.getElementById('save-label');
  const retry = document.getElementById('retry-qr');
  const themeButtons = [...document.querySelectorAll('[data-theme]')];
  const result = document.getElementById('saved-result');
  const resultImage = document.getElementById('saved-image');
  const resultLink = document.getElementById('download-again');
  const palettes = {
    forest: { background: '#00451b', ink: '#f5f3e9', muted: '#d0ddc9', rule: '#598454', art: '#b4c9a5' },
    ivory: { background: '#f5f1e6', ink: '#193f35', muted: '#536f60', rule: '#c7d0bd', art: '#64876b' }
  };
  let theme = 'forest';
  let qrReady = false;
  let exporting = false;
  let exportVersion = 0;
  let resultUrl = null;
  const retiredUrls = new Map();

  function announce(message, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
  }

  // Keep old downloads alive briefly: Safari may consume the blob asynchronously.
  function retireUrl(url) {
    if (!url || retiredUrls.has(url)) return;
    retiredUrls.set(url, window.setTimeout(() => {
      URL.revokeObjectURL(url);
      retiredUrls.delete(url);
    }, 60000));
  }

  function clearResult() {
    result.hidden = true;
    resultImage.removeAttribute('src');
    resultLink.removeAttribute('href');
    retireUrl(resultUrl);
    resultUrl = null;
  }

  function selectTheme(nextTheme) {
    if (!palettes[nextTheme] || nextTheme === theme) return;
    theme = nextTheme;
    exportVersion += 1;
    clearResult();
    const palette = palettes[theme];
    card.querySelectorAll('[data-color]').forEach(node => node.setAttribute('fill', palette[node.dataset.color]));
    card.querySelectorAll('[data-stroke]').forEach(node => node.setAttribute('stroke', palette[node.dataset.stroke]));
    card.querySelectorAll('[data-card-logo], [data-card-brain]').forEach(node => {
      if (theme === 'forest') {
        node.setAttribute('filter', node.hasAttribute('data-card-logo') ? 'url(#card-logo-light)' : 'url(#card-brain-light)');
      } else {
        node.removeAttribute('filter');
      }
    });
    card.querySelectorAll('[data-card-company]').forEach(node => {
      if (theme === 'forest') {
        node.setAttribute('filter', 'url(#card-company-light)');
      } else {
        node.removeAttribute('filter');
      }
    });
    card.querySelectorAll('[data-card-grain]').forEach(node => node.setAttribute('opacity', theme === 'forest' ? '0.20' : '0.025'));
    themeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === theme)));
    document.getElementById('theme-name').textContent = theme === 'forest' ? '01 — 磨砂绿' : '02 — 米白';
    if (qrReady) announce(`已切换为${theme === 'forest' ? '磨砂绿' : '米白'}，可保存高清名片。`);
  }

  // Rebuild only basic geometry; never insert fetched SVG markup or executable attributes.
  function copyQrGeometry(source, target) {
    const allowedTags = new Set(['g', 'path', 'rect']);
    const allowedAttributes = new Set(['x', 'y', 'width', 'height', 'd', 'fill', 'fill-rule', 'transform', 'shape-rendering']);
    for (const child of source.children) {
      if (!allowedTags.has(child.localName)) continue;
      const clean = document.createElementNS(SVG_NS, child.localName);
      for (const attribute of child.attributes) {
        const name = attribute.name;
        const value = attribute.value;
        if (!allowedAttributes.has(name)) continue;
        if (name === 'fill' && !/^(?:#[\da-f]{3,8}|black|white|none)$/i.test(value)) continue;
        if (name === 'transform' && !/^(?:(?:translate|scale|matrix|rotate)\([\d\s.,eE+\-]+\)\s*)+$/.test(value)) continue;
        if (name === 'd' && !/^[MmZzLlHhVvCcSsQqTtAa\d\s.,eE+\-]+$/.test(value)) continue;
        if (['x', 'y', 'width', 'height'].includes(name) && !/^\d*\.?\d+$/.test(value)) continue;
        if (name === 'fill-rule' && !/^(nonzero|evenodd)$/.test(value)) continue;
        if (name === 'shape-rendering' && !/^(auto|crispEdges|geometricPrecision)$/.test(value)) continue;
        clean.setAttribute(name, value);
      }
      if (child.localName === 'g') copyQrGeometry(child, clean);
      target.appendChild(clean);
    }
  }

  async function loadQr() {
    qrReady = false;
    save.disabled = true;
    retry.hidden = true;
    frame.setAttribute('aria-busy', 'true');
    announce('正在准备名片二维码…');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/assets/card-qr.svg', { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error('QR request failed');
      const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
      const root = source.documentElement;
      if (source.querySelector('parsererror') || root.localName !== 'svg') throw new Error('Invalid QR SVG');
      const viewBox = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
      if (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[2] !== viewBox[3]) throw new Error('Invalid QR dimensions');
      const group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('transform', `translate(718 353) scale(${122 / viewBox[2]}) translate(${-viewBox[0]} ${-viewBox[1]})`);
      group.setAttribute('fill', '#153d34');
      group.setAttribute('shape-rendering', 'crispEdges');
      const background = document.createElementNS(SVG_NS, 'rect');
      background.setAttribute('x', viewBox[0]);
      background.setAttribute('y', viewBox[1]);
      background.setAttribute('width', viewBox[2]);
      background.setAttribute('height', viewBox[3]);
      background.setAttribute('fill', '#ffffff');
      group.appendChild(background);
      copyQrGeometry(root, group);
      if (group.querySelectorAll('path, rect').length < 2) throw new Error('Empty QR geometry');
      document.getElementById('card-qr').replaceChildren(group);
      document.getElementById('qr-loading').setAttribute('display', 'none');
      qrReady = true;
      save.disabled = exporting;
      announce('名片已就绪，可以保存或选择另一种配色。');
    } catch (error) {
      document.querySelector('#qr-loading text').textContent = '二维码暂未加载';
      announce('二维码加载失败，请检查网络后重试。完整名片准备好后即可保存。', true);
      retry.hidden = false;
    } finally {
      window.clearTimeout(timeout);
      frame.setAttribute('aria-busy', 'false');
    }
  }

  function decodeImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = async () => {
        try {
          if (typeof image.decode === 'function') await image.decode();
          resolve(image);
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(new Error('Image decoding failed'));
      image.src = url;
    });
  }

  async function embedCardImages(cloned) {
    try {
      await Promise.all([...cloned.querySelectorAll('image')].map(async node => {
        const href = node.getAttribute('href') || node.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        if (!href) throw new Error('Missing logo URL');
        const url = new URL(href, document.baseURI);
        if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) throw new Error('Unsupported logo origin');
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 12000);
        let blob;
        try {
          const response = await fetch(url.href, { signal: controller.signal, redirect: 'error' });
          if (!response.ok) throw new Error('Logo request failed');
          blob = await response.blob();
          if (!['image/png', 'image/svg+xml'].includes(blob.type.split(';')[0].trim().toLowerCase())) throw new Error('Unsupported logo type');
        } finally {
          window.clearTimeout(timeout);
        }
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error || new Error('Logo reading failed'));
          reader.onabort = () => reject(new Error('Logo reading aborted'));
          reader.readAsDataURL(blob);
        });
        await decodeImage(dataUrl);
        node.setAttribute('href', dataUrl);
        node.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      }));
    } catch (error) {
      const failure = new Error('Logo embedding failed');
      failure.name = 'LogoLoadError';
      throw failure;
    }
  }

  async function exportCard() {
    if (!qrReady || exporting) return;
    exporting = true;
    save.disabled = true;
    themeButtons.forEach(button => { button.disabled = true; });
    saveLabel.textContent = '正在生成图片…';
    announce('正在生成高清名片，请稍候…');
    const version = ++exportVersion;
    let svgUrl;
    let pngUrl;
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const cloned = card.cloneNode(true);
      cloned.setAttribute('width', '1800');
      cloned.setAttribute('height', '1080');
      await embedCardImages(cloned);
      const svgBlob = new Blob([new XMLSerializer().serializeToString(cloned)], { type: 'image/svg+xml;charset=utf-8' });
      svgUrl = URL.createObjectURL(svgBlob);
      const image = await decodeImage(svgUrl);
      const canvas = document.createElement('canvas');
      canvas.width = 1800;
      canvas.height = 1080;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.drawImage(image, 0, 0, 1800, 1080);
      const png = await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png'));
      if (version !== exportVersion) return;
      pngUrl = URL.createObjectURL(png);
      await decodeImage(pngUrl);
      clearResult();
      resultUrl = pngUrl;
      pngUrl = null;
      const filename = `Ziyan-Shi-card-${theme}-1800x1080.png`;
      resultImage.src = resultUrl;
      resultLink.href = resultUrl;
      resultLink.download = filename;
      result.hidden = false;
      // The visible image and link remain usable when mobile browsers ignore download.
      const anchor = document.createElement('a');
      anchor.href = resultUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      announce('高清名片已生成。若未自动下载，可点击“再次下载”，或长按下方图片保存。');
    } catch (error) {
      announce(error.name === 'LogoLoadError'
        ? 'Logo 或脑模型图片未能载入，请检查网络后再次保存。'
        : '图片生成失败，请再次尝试。若仍失败，可换用浏览器打开本页后保存。', true);
    } finally {
      if (svgUrl) URL.revokeObjectURL(svgUrl);
      if (pngUrl) URL.revokeObjectURL(pngUrl);
      exporting = false;
      save.disabled = !qrReady;
      saveLabel.textContent = '保存高清名片';
      themeButtons.forEach(button => { button.disabled = false; });
    }
  }

  themeButtons.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => selectTheme(button.dataset.theme));
  });
  save.addEventListener('click', exportCard);
  retry.addEventListener('click', loadQr);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    for (const [url, timer] of retiredUrls) {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
    }
    retiredUrls.clear();
  });
  loadQr();
})();
