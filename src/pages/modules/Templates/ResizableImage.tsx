import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";

// Nodo de imagen personalizado: reemplaza a @tiptap/extension-image.
// Soporta: redimensionado con handle en la esquina, alineación (izq/centro/der)
// y una mini barra flotante que aparece cuando la imagen está seleccionada.

export interface ResizableImageOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableImage: {
      setResizableImage: (options: { src: string; alt?: string; title?: string; width?: string; align?: string }) => ReturnType;
    };
  }
}

function ResizableImageView({ node, updateAttributes, deleteNode, selected }: any) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [, setResizing] = useState(false);
  const { src, alt, title, width, align } = node.attrs;

  const startResize = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const img = wrapperRef.current?.querySelector("img");
      if (!img) return;
      const startX = event.clientX;
      const startWidth = img.getBoundingClientRect().width;
      setResizing(true);

      const onMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(60, Math.round(startWidth + delta));
        updateAttributes({ width: `${newWidth}px` });
      };
      const onUp = () => {
        setResizing(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [updateAttributes],
  );

  const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const align_btn = (value: string) => `rounded p-1 ${align === value || (!align && value === "left") ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`;

  return (
    <NodeViewWrapper as="div" data-drag-handle className="relative my-2" style={{ display: "flex", justifyContent: justify }}>
      <div
        ref={wrapperRef}
        className={`group relative inline-block ${selected ? "outline outline-2 outline-offset-2 outline-blue-400" : ""}`}
        style={{ width: width || "auto", maxWidth: "100%" }}
      >
        <img src={src} alt={alt || ""} title={title || ""} className="block h-auto w-full select-none rounded-md" draggable={false} />
        {selected && (
          <>
            <div className="absolute -top-9 left-0 flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1 py-1 shadow-md">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => updateAttributes({ align: "left" })} className={align_btn("left")} title="Alinear a la izquierda">
                <AlignLeft size={14} />
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => updateAttributes({ align: "center" })} className={align_btn("center")} title="Centrar">
                <AlignCenter size={14} />
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => updateAttributes({ align: "right" })} className={align_btn("right")} title="Alinear a la derecha">
                <AlignRight size={14} />
              </button>
              <span className="mx-1 h-4 w-px bg-slate-200" />
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => deleteNode()} className="rounded p-1 text-red-500 hover:bg-red-50" title="Eliminar imagen">
                <Trash2 size={14} />
              </button>
            </div>
            <div
              onMouseDown={startResize}
              className="absolute bottom-0 right-0 h-3.5 w-3.5 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-full border-2 border-white bg-blue-500 shadow"
              title="Arrastra para redimensionar"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Node.create<ResizableImageOptions>({
  name: "resizableImage",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      align: { default: "left" },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { align, width, ...rest } = HTMLAttributes;
    const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
    return [
      "div",
      { style: `display:flex;justify-content:${justify};margin:8px 0;` },
      [
        "img",
        mergeAttributes(this.options.HTMLAttributes, rest, {
          style: width ? `width:${width};max-width:100%;height:auto;` : "max-width:100%;height:auto;",
        }),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },

  addCommands() {
    return {
      setResizableImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});