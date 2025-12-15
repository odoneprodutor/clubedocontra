
import React, { useState, useRef, useEffect } from 'react';
import { Team, TacticalPosition } from '../types';
import { Save, Move } from 'lucide-react';

interface TacticsBoardProps {
  team: Team;
  isEditable: boolean;
  onSave?: (newPositions: TacticalPosition[]) => void;
}

const TacticsBoard: React.FC<TacticsBoardProps> = ({ team, isEditable, onSave }) => {
  const [positions, setPositions] = useState<TacticalPosition[]>(team.tacticalFormation);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Sync props if team changes
  useEffect(() => {
    setPositions(team.tacticalFormation);
  }, [team.id]);

  const handleMouseDown = (e: React.MouseEvent, playerId: string) => {
    if (!isEditable) return;
    setDraggingId(playerId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values 0-100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setPositions(prev => prev.map(p => 
      p.playerId === draggingId ? { ...p, x: clampedX, y: clampedY } : p
    ));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const handleSave = () => {
    if (onSave) onSave(positions);
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
        onMouseLeave={handleMouseUp}
        className={`bg-green-700 rounded-lg shadow-inner relative overflow-hidden h-96 w-full border-4 border-green-800 select-none ${isEditable ? 'cursor-default' : 'cursor-not-allowed'}`}
      >
         {/* Field Markings */}
         <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white opacity-30"></div>
         <div className="absolute inset-0 w-24 h-24 border-2 border-white opacity-30 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-t-0 border-white opacity-30"></div>
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-b-0 border-white opacity-30"></div>
         
         {/* Players */}
         {positions.map((pos) => {
           const player = team.roster.find(p => p.id === pos.playerId);
           if (!player) return null;

           return (
             <div
                key={pos.playerId}
                onMouseDown={(e) => handleMouseDown(e, pos.playerId)}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-shadow ${
                  isEditable ? 'cursor-move hover:ring-2 hover:ring-white z-20' : 'z-10'
                } ${pos.playerId === draggingId ? 'scale-110 ring-2 ring-white z-30' : ''}`}
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
