import type { jsPDF } from 'jspdf';

let exposeFontBase64: Promise<string> | undefined;

async function loadExposeFont() {
  exposeFontBase64 ??= fetch('/fonts/Expose-Variable.ttf')
    .then(async response => {
      if (!response.ok) throw new Error('La police Expose est introuvable.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = '';
      const chunkSize = 0x8000;
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
      }
      return btoa(binary);
    })
    .catch(error => {
      exposeFontBase64 = undefined;
      throw error;
    });
  return exposeFontBase64;
}

export async function registerExposePdfFont(doc: jsPDF) {
  const font = await loadExposeFont();
  doc.addFileToVFS('Expose-Variable.ttf', font);
  doc.addFont('Expose-Variable.ttf', 'Expose', 'normal');
  doc.addFont('Expose-Variable.ttf', 'Expose', 'bold');
  doc.setFont('Expose', 'normal');
}
