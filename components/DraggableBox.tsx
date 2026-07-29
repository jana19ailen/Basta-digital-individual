
import React, { useState, useEffect, useRef } from 'react';
import { Move, Maximize2 } from 'lucide-react';

interface ElementData {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  bg: string;
  lockRatio: boolean;
}

interface DraggableBoxProps {
  id: string;
  data: ElementData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, newData: Partial<ElementData>) => void;
  children: React.ReactNode;
}

const DraggableBox: React.FC<DraggableBoxProps> = ({ 
  id, 
  data, 
  isSelected, 
  onSelect, 
  onUpdate, 
  children 
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dimsStart = useRef({ w: 0, h: 0, x: 0, y: 0 });

  // --- DRAG LOGIC ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    setIsDragging(true);
    dragStart.current = { x: e.clientX - data.x, y: e.clientY - data.y };
  };

  // --- RESIZE LOGIC ---
  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    dimsStart.current = { w: data.w, h: data.h, x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdate(id, {
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y
        });
      }
      
      if (isResizing) {
        let newW = Math.max(50, dimsStart.current.w + (e.clientX - dimsStart.current.x));
        let newH = Math.max(50, dimsStart.current.h + (e.clientY - dimsStart.current.y));

        if (data.lockRatio) {
          const ratio = dimsStart.current.w / dimsStart.current.h;
          newH = newW / ratio;
        }

        onUpdate(id, { w: newW, h: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, id, onUpdate, data.lockRatio]);

  return (
    <div
      ref={boxRef}
      onMouseDown={handleMouseDown}
      style={{
        transform: `translate(${data.x}px, ${data.y}px)`,
        width: `${data.w}px`,
        height: `${data.h}px`,
        zIndex: data.z,
        backgroundColor: data.bg,
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={`group transition-shadow duration-0 ${isSelected ? 'ring-4 ring-red-500 ring-offset-2 z-[100] shadow-2xl' : 'hover:ring-2 hover:ring-blue-300'}`}
    >
      {/* Content Wrapper - Disable pointer events while dragging to prevent internal clicks */}
      <div className={`w-full h-full overflow-hidden ${isDragging || isResizing ? 'pointer-events-none' : ''}`}>
        {children}
      </div>

      {/* Helper Label */}
      {isSelected && (
        <div className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
          {id}
        </div>
      )}

      {/* Resize Handle */}
      {isSelected && (
        <div 
          onMouseDown={handleResizeDown}
          className="absolute bottom-0 right-0 w-8 h-8 bg-red-500 cursor-nwse-resize flex items-center justify-center rounded-tl-lg hover:scale-110 transition-transform z-50"
        >
          <Maximize2 size={16} className="text-white" />
        </div>
      )}

      {/* Drag Hint (only visible on hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/20 p-1 rounded transition-opacity">
        <Move size={16} className="text-white/80" />
      </div>
    </div>
  );
};

export default DraggableBox;
