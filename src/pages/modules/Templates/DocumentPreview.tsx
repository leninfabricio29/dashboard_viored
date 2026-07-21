import { useRef, useState } from "react";
import { Download, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  showHeader: boolean;
  showFooter: boolean;
  headerText?: string;
  footerText?: string;
}

export function DocumentPreview({ open, onClose, title, content, showHeader, showFooter, headerText, footerText }: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  if (!open) return null;

  const downloadPdf = async () => {
    if (!pageRef.current) return;
    try {
      setGenerating(true);
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(pageRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${title || "documento"}.pdf`);
    } catch {
      window.alert("No se pudo generar el PDF. Verifica que 'html2canvas' y 'jspdf' estén instalados (npm install html2canvas jspdf).");
    } finally {
      setGenerating(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800">Vista previa · {title || "Sin título"}</h2>
        <div className="flex items-center gap-2">
          <button onClick={downloadPdf} disabled={generating} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            <Download size={16} />{generating ? "Generando…" : "Descargar PDF"}
          </button>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
      </div>
      <div className="overflow-auto bg-slate-100 p-6">
        <div ref={pageRef} className="mx-auto w-[210mm] min-h-[297mm] bg-white p-[20mm] shadow-md">
          {showHeader && <div className="mb-6 border-b border-slate-300 pb-3 text-xs text-slate-500">{headerText || "Encabezado del documento"}</div>}
          <div
            className="prose prose-sm max-w-none break-words
              [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2
              [&_img]:max-w-full [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold
              [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600
              [&_pre]:rounded-md [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100 [&_hr]:my-4 [&_hr]:border-slate-300
              [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          {showFooter && <div className="mt-6 border-t border-slate-300 pt-3 text-xs text-slate-500">{footerText || "Pie de página del documento"}</div>}
        </div>
      </div>
    </div>
  </div>;
}