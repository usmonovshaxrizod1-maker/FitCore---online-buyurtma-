// Browser/WebView-safe local image byte handling.
(function attachFitcoreImageIO(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FitcoreImageIO = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function buildFitcoreImageIO() {
  'use strict';

  function readWithFileReader(blob, timeoutMs = 12000) {
    if (typeof FileReader === 'undefined') return Promise.reject(new Error('filereader_unavailable'));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn(value);
      };
      const timer = setTimeout(() => {
        try { reader.abort(); } catch (_) {}
        finish(reject, new Error('blob_read_timeout'));
      }, timeoutMs);
      reader.onload = () => finish(resolve, reader.result);
      reader.onerror = () => finish(reject, reader.error || new Error('blob_read_failed'));
      reader.onabort = () => finish(reject, new Error('blob_read_aborted'));
      try { reader.readAsArrayBuffer(blob); }
      catch (e) { finish(reject, e); }
    });
  }

  async function readBlobAsArrayBuffer(blob) {
    if (!blob) throw new Error('blob_required');
    // Telegram WebView'da FileReader native file-picker handle bilan barqarorroq.
    // arrayBuffer() fallback bo'lib qoladi; bir xil transportni ikki marta urmaymiz.
    let firstError = null;
    try { return await readWithFileReader(blob); }
    catch (e) { firstError = e; }
    if (typeof blob.arrayBuffer === 'function') {
      try { return await blob.arrayBuffer(); }
      catch (e) {
        const err = new Error('blob_read_failed_all_methods');
        err.cause = e || firstError;
        throw err;
      }
    }
    throw firstError || new Error('blob_array_buffer_unavailable');
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
