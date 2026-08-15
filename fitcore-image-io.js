// Browser/WebView-safe local image byte handling.
(function attachFitcoreImageIO(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FitcoreImageIO = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function buildFitcoreImageIO() {
  'use strict';

  function readBlobAsArrayBuffer(blob) {
    if (!blob) return Promise.reject(new Error('blob_required'));
    if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
    if (typeof FileReader === 'undefined') return Promise.reject(new Error('blob_array_buffer_unavailable'));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('blob_read_failed'));
      reader.readAsArrayBuffer(blob);
    });
  }

  function makeDetachedImageFile(bytes, source) {
    const mimeType = String(source?.type || '').toLowerCase();
    const blob = new Blob([bytes], { type: mimeType });
    const name = String(source?.name || 'product-image').slice(0, 180);
    if (typeof File === 'function') {
      try { return new File([blob], name, { type: mimeType, lastModified: Date.now() }); } catch (_) {}
    }
    try { Object.defineProperty(blob, 'name', { value: name }); } catch (_) {}
    return blob;
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    const chunks = [];
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      chunks.push(String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunkSize)));
    }
    const binary = chunks.join('');
    if (typeof btoa === 'function') return btoa(binary);
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    throw new Error('base64_encoder_unavailable');
  }

  async function blobToBase64(blob) {
    return arrayBufferToBase64(await readBlobAsArrayBuffer(blob));
  }

  return Object.freeze({ readBlobAsArrayBuffer, makeDetachedImageFile, arrayBufferToBase64, blobToBase64 });
});
