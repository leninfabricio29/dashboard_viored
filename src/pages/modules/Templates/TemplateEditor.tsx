import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {TextStyle} from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Extension } from "@tiptap/core";
import * as TableModule from "@tiptap/extension-table";
import * as TableRowModule from "@tiptap/extension-table-row";
import * as TableHeaderModule from "@tiptap/extension-table-header";
import * as TableCellModule from "@tiptap/extension-table-cell";
import { ResizableImage } from "./ResizableImage";

// Distintas versiones de estos paquetes exponen la extensión como export
// nombrado o como `default`; esto cubre ambos casos.
const Table = (TableModule as any).Table ?? (TableModule as any).default;
const TableRow = (TableRowModule as any).TableRow ?? (TableRowModule as any).default;
const TableHeader = (TableHeaderModule as any).TableHeader ?? (TableHeaderModule as any).default;
const TableCell = (TableCellModule as any).TableCell ?? (TableCellModule as any).default;

import {
  ImagePlus,
  Table as TableIcon,
  Columns,
  Rows,
  Trash2,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Quote,
  Code,
  Minus,
  Undo2,
  Redo2,
  Highlighter,
  Palette,
  Combine,
  SplitSquareHorizontal,
  PaintBucket,
} from "lucide-react";
import type { DocumentVariable } from "../../../services/document-service";

interface Props { content: string; onChange: (html: string) => void; variables: DocumentVariable[]; }

// Extiende TableCell para permitir color de fondo por celda.
const TableCellWithBg = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
        renderHTML: (attributes: any) => (attributes.backgroundColor ? { style: `background-color: ${attributes.backgroundColor}` } : {}),
      },
    };
  },
});

// Extensión ligera de tamaño de fuente sobre la marca textStyle.
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: any) => (attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff"];

export function TemplateEditor({ content, onChange, variables }: Props) {
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"], defaultAlignment: "left" }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: "text-blue-600 underline underline-offset-2" } }),
      ResizableImage,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCellWithBg,
    ],
    content,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  }, []);

  if (!editor) return null;

  const insertVariable = (variable: string) => editor.chain().focus().insertContent(`{{${variable}}}`).run();
  const inTable = editor.isActive("table");

  const btn = (active?: boolean) =>
    `inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium disabled:opacity-30 disabled:hover:bg-transparent ${
      active ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-100"
    }`;
  const selectClass = "rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-600 outline-none focus:border-blue-500";

  const insertImageFromUrl = () => {
    if (!imageUrl.trim()) return;
    editor.chain().focus().insertContent({ type: "resizableImage", attrs: { src: imageUrl.trim(), align: "left" } }).run();
    setImageUrl("");
    setShowImageInput(false);
  };

  const insertImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        editor.chain().focus().insertContent({ type: "resizableImage", attrs: { src: reader.result, align: "left" } }).run();
      }
    };
    reader.readAsDataURL(file);
  };

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
    ? "h3"
    : "p";

  const applyHeading = (value: string) => {
    if (value === "p") editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: Number(value.replace("h", "")) as 1 | 2 | 3 }).run();
  };

  return <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 p-2">
      {/* Deshacer / rehacer */}
      <button type="button" className={btn()} onClick={() => editor.chain().focus().undo().run()} title="Deshacer"><Undo2 size={14} /></button>
      <button type="button" className={btn()} onClick={() => editor.chain().focus().redo().run()} title="Rehacer"><Redo2 size={14} /></button>
      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Bloque / encabezado */}
      <select className={selectClass} value={currentHeading} onChange={(e) => applyHeading(e.target.value)} title="Estilo de párrafo">
        <option value="p">Párrafo</option>
        <option value="h1">Título 1</option>
        <option value="h2">Título 2</option>
        <option value="h3">Título 3</option>
      </select>

      {/* Tamaño de fuente */}
      <select
        className={selectClass}
        value={editor.getAttributes("textStyle").fontSize || ""}
        onChange={(e) => (e.target.value ? (editor.chain().focus() as any).setFontSize(e.target.value).run() : (editor.chain().focus() as any).unsetFontSize().run())}
        title="Tamaño de fuente"
      >
        <option value="">Tamaño</option>
        {FONT_SIZES.map((size) => <option key={size} value={size}>{size.replace("px", "")}</option>)}
      </select>
      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Formato de texto */}
      <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita"><BoldIcon size={14} /></button>
      <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva"><ItalicIcon size={14} /></button>
      <button type="button" className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado"><UnderlineIcon size={14} /></button>
      <button type="button" className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado"><Strikethrough size={14} /></button>

      {/* Color de texto */}
      <label className={`${btn()} cursor-pointer`} title="Color de texto">
        <Palette size={14} />
        <input
          type="color"
          className="h-3.5 w-3.5 cursor-pointer border-0 bg-transparent p-0"
          value={editor.getAttributes("textStyle").color || "#0f172a"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>

      {/* Resaltado */}
      <div className="flex items-center gap-0.5">
        <button type="button" className={btn(editor.isActive("highlight"))} onClick={() => editor.chain().focus().toggleHighlight({ color: HIGHLIGHT_COLORS[0] }).run()} title="Resaltar">
          <Highlighter size={14} />
        </button>
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
            className="h-3.5 w-3.5 rounded-full border border-slate-300"
            style={{ backgroundColor: color }}
            title={`Resaltar ${color}`}
          />
        ))}
      </div>
      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Alineación */}
      <button type="button" className={btn(editor.isActive({ textAlign: "left" }))} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Alinear izquierda"><AlignLeft size={14} /></button>
      <button type="button" className={btn(editor.isActive({ textAlign: "center" }))} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centrar"><AlignCenter size={14} /></button>
      <button type="button" className={btn(editor.isActive({ textAlign: "right" }))} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Alinear derecha"><AlignRight size={14} /></button>
      <button type="button" className={btn(editor.isActive({ textAlign: "justify" }))} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justificar"><AlignJustify size={14} /></button>
      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Listas y bloques */}
      <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Viñetas">Lista</button>
      <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">Numerada</button>
      <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita"><Quote size={14} /></button>
      <button type="button" className={btn(editor.isActive("codeBlock"))} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Bloque de código"><Code size={14} /></button>
      <button type="button" className={btn()} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Línea divisoria"><Minus size={14} /></button>
      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Enlaces */}
      <button type="button" className={btn(editor.isActive("link"))} onClick={setLink} title="Insertar enlace"><LinkIcon size={14} /></button>
      <button type="button" disabled={!editor.isActive("link")} className={btn()} onClick={() => editor.chain().focus().unsetLink().run()} title="Quitar enlace"><Unlink size={14} /></button>
      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Tabla */}
      <button type="button" className={btn()} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insertar tabla">
        <TableIcon size={14} className="inline" /> Tabla
      </button>
      <button type="button" disabled={!inTable} className={btn()} onClick={() => editor.chain().focus().addRowAfter().run()} title="Agregar fila"><Rows size={14} className="inline" /> +Fila</button>
      <button type="button" disabled={!inTable} className={btn()} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Agregar columna"><Columns size={14} className="inline" /> +Columna</button>
      <button type="button" disabled={!inTable} className={btn()} onClick={() => editor.chain().focus().deleteRow().run()}>-Fila</button>
      <button type="button" disabled={!inTable} className={btn()} onClick={() => editor.chain().focus().deleteColumn().run()}>-Columna</button>
      <button type="button" disabled={!inTable} className={btn()} onClick={() => editor.chain().focus().mergeCells().run()} title="Combinar celdas"><Combine size={14} /></button>
      <button type="button" disabled={!inTable} className={btn()} onClick={() => editor.chain().focus().splitCell().run()} title="Dividir celda"><SplitSquareHorizontal size={14} /></button>
      <label className={`${btn()} cursor-pointer ${!inTable ? "pointer-events-none opacity-30" : ""}`} title="Color de celda">
        <PaintBucket size={14} />
        <input
          type="color"
          className="h-3.5 w-3.5 cursor-pointer border-0 bg-transparent p-0"
          onChange={(e) => (editor.chain().focus() as any).setCellAttribute("backgroundColor", e.target.value).run()}
        />
      </label>
      <button type="button" disabled={!inTable} className={btn()} onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 size={14} className="inline" /> Tabla</button>
      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Imagen */}
      <button type="button" className={btn(showImageInput)} onClick={() => setShowImageInput((v) => !v)}>
        <ImagePlus size={14} className="inline" /> Imagen
      </button>
    </div>
    {showImageInput && <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
      <input className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs outline-none" placeholder="URL de la imagen" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      <button type="button" onClick={insertImageFromUrl} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Insertar</button>
      <label className="cursor-pointer rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
        Subir archivo
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) insertImageFromFile(file); }} />
      </label>
      <span className="text-xs text-slate-400">Selecciona la imagen insertada para redimensionarla o alinearla.</span>
    </div>}
    <EditorContent
      editor={editor}
      onDrop={(event) => { const variable = event.dataTransfer.getData("application/x-document-variable"); if (variable) { event.preventDefault(); insertVariable(variable); } }}
      className="min-h-72 p-4 text-sm text-slate-800 [&_.ProseMirror]:min-h-64 [&_.ProseMirror]:outline-none [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:p-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 [&_pre]:rounded-md [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100 [&_hr]:my-4 [&_hr]:border-slate-300 [&_a]:text-blue-600 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
    />
    <div className="border-t border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-medium text-slate-500">Arrastra una variable al editor o haz clic para insertarla</p>
      <div className="flex flex-wrap gap-2">
        {variables.filter((variable) => variable.status).map((variable) =>
          <button key={variable._id} type="button" draggable onDragStart={(event) => event.dataTransfer.setData("application/x-document-variable", variable.variable)} onClick={() => insertVariable(variable.variable)} className="cursor-grab rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-xs text-blue-700 active:cursor-grabbing">
            {`{{${variable.variable}}}`}
          </button>)}
      </div>
    </div>
  </div>;
}