import React, { useRef } from "react";

interface CarouselProps {
  children: React.ReactNode;
}

const Carousel: React.FC<CarouselProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      containerRef.current.scrollBy({
        left: direction === "left" ? -width : width,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => scroll("left")}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-indigo-100 rounded-full p-2 shadow-lg border border-indigo-200"
        aria-label="Anterior"
      >
        <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div
        ref={containerRef}
        className="flex overflow-x-auto gap-8 scroll-smooth py-2 px-1 hide-scrollbar"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {React.Children.map(children, (child) => (
          <div className="min-w-full max-w-full flex-shrink-0" style={{ scrollSnapAlign: "center" }}>
            {child}
          </div>
        ))}
      </div>
      <button
        onClick={() => scroll("right")}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-indigo-100 rounded-full p-2 shadow-lg border border-indigo-200"
        aria-label="Siguiente"
      >
        <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default Carousel;
