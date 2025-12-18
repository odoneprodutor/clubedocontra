
import React, { useState, useRef, useEffect } from 'react';
import { Team, TacticalPosition } from '../types';
import { Save, Move } from 'lucide-react';

interface TacticsBoardProps {
  team: Team;
  isEditable: boolean;
  onSave?: (newPositions: TacticalPosition[]) => void;
  onPlayerClick?: (player: any) => void;
  // Controlled Mode Props
  positions?: TacticalPosition[];
  onPositionsChange?: (newPositions: TacticalPosition[]) => void;
}

const TacticsBoard: React.FC<TacticsBoardProps> = ({ team, isEditable, onSave, onPlayerClick, positions: externalPositions, onPositionsChange }) => {
  const [internalPositions, setInternalPositions] = useState<TacticalPosition[]>(team.tacticalFormation);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Use external positions if provided, otherwise internal
  const activePositions = externalPositions || internalPositions;

  // Sync internal state if team changes (only for uncontrolled mode)
  useEffect(() => {
    if (!externalPositions) {
      setInternalPositions(team.tacticalFormation);
    }
  }, [team.id, externalPositions]);

  const handleMouseDown = (e: React.MouseEvent, playerId: string) => {
    // START DRAG OR CLICK
    // We allow mouse down always, but only drag if editable.
    // If NOT editable, we still want to track for CLICK behavior to view players.

    // Position for click detection
    setDragStartPos({ x: e.clientX, y: e.clientY });

    if (isEditable) {
      setDraggingId(playerId);
    } else {
      // If not editable, we 'fake' a drag id just to track the mouseUp on the same element, 
      // OR we just rely on the click handler of the div if we don't care about drag.
      // But to be consistent, let's track an "interactionId"
      setDraggingId(playerId); // reusing this state, but won't update position if !isEditable logic in move.
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !boardRef.current || !isEditable) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values 0-100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    const nextPositions = activePositions.map(p =>
      p.playerId === draggingId ? { ...p, x: clampedX, y: clampedY } : p
    );

    if (onPositionsChange) {
      onPositionsChange(nextPositions);
    } else {
      setInternalPositions(nextPositions);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Detect Click vs Drag
    if (draggingId && dragStartPos) {
      const dist = Math.sqrt(Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2));
      if (dist < 5) {
        // It's a click
        const player = team.roster.find(p => p.id === draggingId);
        if (player && onPlayerClick) {
          onPlayerClick(player);
        }
      }
    }

    setDraggingId(null);
    setDragStartPos(null);
  };

  const handleSave = () => {
    if (onSave) onSave(activePositions);
  };

  return (
    <div className="flex flex-col gap-4">
      {isEditable && (
        <div className="flex justify-between items-center bg-yellow-50 p-2 rounded border border-yellow-200 text-xs text-yellow-800">
          <span className="flex items-center gap-2"><Move size={14} /> Arraste os jogadores para definir a tática</span>
          <button
            onClick={handleSave}
            className="bg-emerald-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-emerald-700"
          >
            <Save size={14} /> Salvar Tática
          </button>
        </div>
      )}

      <div
        ref={boardRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={(e) => handleMouseUp(e as any)}
        className={`bg-green-700 rounded-lg shadow-inner relative overflow-hidden h-96 w-full border-4 border-green-800 select-none ${isEditable ? 'cursor-default' : 'cursor-not-allowed'}`}
      >
        {/* Field Markings */}
        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white opacity-30"></div>
        <div className="absolute inset-0 w-24 h-24 border-2 border-white opacity-30 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-t-0 border-white opacity-30"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-b-0 border-white opacity-30"></div>

        {/* Players */}
        {activePositions.map((pos) => {
          const player = team.roster.find(p => p.id === pos.playerId);
          if (!player) return null;

          return (
            <div
              key={pos.playerId}
              onMouseDown={(e) => handleMouseDown(e, pos.playerId)}
              title={player.name}
              className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-shadow cursor-pointer ${isEditable ? 'hover:ring-2 hover:ring-white z-20' : 'z-10'
                } ${pos.playerId === draggingId && isEditable ? 'scale-110 ring-2 ring-white z-30' : ''}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                backgroundColor: player.position === 'GK' ? '#facc15' : 'white',
                color: '#0f172a',
                border: '2px solid #cbd5e1'
              }}
            >
              {player.number}
              <div className="absolute -bottom-5 bg-black/70 text-white text-[9px] px-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                {player.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TacticsBoard;
