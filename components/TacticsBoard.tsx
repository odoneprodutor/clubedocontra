
import React, { useState, useRef, useEffect } from 'react';
import { Team, TacticalPosition } from '../types';
import { Save, Move, MoveHorizontal, RefreshCw, X, User } from 'lucide-react';

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
  const [internalPositions, setInternalPositions] = useState<TacticalPosition[]>(team.tacticalFormation || []);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);

  // New State for Swap Interaction
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);

  // Use external positions if provided, otherwise internal
  const activePositions = externalPositions || internalPositions;


  // Filter Reserves (Players in roster NOT in activePositions - using ID check)
  const fieldPlayerIds = activePositions.map(p => p.playerId).filter(id => !id.startsWith('placeholder-'));
  // Ensure we handle case where roster player might have been deleted but position remains (cleanup)
  const rosterIds = team.roster.map(p => p.id);
  // Valid positions are real players OR explicitly placeholders
  // const validPositions = activePositions.filter(p => p.playerId.startsWith('placeholder-') || rosterIds.includes(p.playerId));

  const validFieldPlayerIds = activePositions.filter(p => !p.playerId.startsWith('placeholder-')).map(p => p.playerId);
  const reserves = team.roster.filter(p => !validFieldPlayerIds.includes(p.id));

  // Sync internal state...
  useEffect(() => {
    if (!externalPositions) {
      setInternalPositions(team.tacticalFormation || []);
    }
  }, [team.id, team.tacticalFormation, externalPositions]);

  const handleMouseDown = (e: React.MouseEvent, playerId: string) => {
    // Cannot drag empty slots usually, unless we want to move the formation slot itself?
    // Let's allow moving placeholders too so user can adjust formation even if empty.
    setDragStartPos({ x: e.clientX, y: e.clientY });

    if (isEditable) {
      setDraggingId(playerId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // ... same implementation
    if (!draggingId || !boardRef.current || !isEditable) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

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
    if (dragStartPos) {
      const dist = Math.sqrt(Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2));

      if (dist < 5) {
        // Click detected
        if (draggingId) {
          // Check if it's a real player OR a placeholder
          const isPlaceholder = draggingId.startsWith('placeholder-');
          const player = team.roster.find(p => p.id === draggingId);

          if (player || isPlaceholder) {
            if (isEditable) {
              // Open swap menu even for empty slots
              setSwapTargetId(draggingId);
            } else if (onPlayerClick && player) {
              // Only view profile for real players
              onPlayerClick(player);
            }
          }
        }
      }
    }

    setDraggingId(null);
    setDragStartPos(null);
  };

  const executeSwap = (reserveId: string) => {
    if (!swapTargetId) return;

    // Find the position of the field player (Swap Target)
    const newPositions = activePositions.map(pos => {
      if (pos.playerId === swapTargetId) {
        return { ...pos, playerId: reserveId };
      }
      return pos;
    });

    if (onPositionsChange) {
      onPositionsChange(newPositions);
    } else {
      setInternalPositions(newPositions);
      if (onSave) onSave(newPositions); // Auto-save
    }
    setSwapTargetId(null);
  };

  const handleSave = () => {
    if (onSave) onSave(activePositions);
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Header Instructions */}
      {isEditable && (
        <div className="flex justify-between items-center bg-yellow-50 p-2 rounded border border-yellow-200 text-xs text-yellow-800">
          <span className="flex items-center gap-2"><Move size={14} /> Arraste movê-los • Clique para substituir</span>
          <button
            onClick={handleSave}
            className="bg-emerald-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-emerald-700 shadow-sm"
          >
            <Save size={14} /> Salvar
          </button>
        </div>
      )}

      <div className="relative w-full aspect-[2/3] bg-emerald-700 rounded-lg border-2 border-white/20 shadow-inner overflow-hidden" ref={boardRef}>
        {/* Field Markings */}
        <div className="absolute inset-4 border border-white/30 rounded-sm pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-b border-x border-white/30 rounded-b-lg pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t border-x border-white/30 rounded-t-lg pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/30 rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-white/30 pointer-events-none"></div>

        {/* Players */}
        {activePositions.map((pos) => {
          const isPlaceholder = pos.playerId.startsWith('placeholder-');
          const player = team.roster.find(p => p.id === pos.playerId);

          const pName = player ? player.name.split(' ')[0] : (isPlaceholder ? 'Vazio' : '???');
          const pNumber = player ? player.number : '';
          const pAvatar = player ? ((player as any).avatar || (player as any).profilePicture) : null;
          const isSelected = swapTargetId === pos.playerId;

          return (
            <div
              key={pos.playerId}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 active:scale-95 flex flex-col items-center group
                  ${isSelected ? 'z-30 scale-110' : 'z-10'}
                  ${isPlaceholder ? 'opacity-70 hover:opacity-100' : ''}
              `}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onMouseDown={(e) => handleMouseDown(e, pos.playerId)}
              onMouseUp={handleMouseUp}
            >
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold shadow-lg overflow-hidden relative transition-all duration-200
                  ${isSelected ? 'bg-yellow-400 border-yellow-200 text-yellow-900 ring-4 ring-yellow-400/50' :
                  isPlaceholder ? 'bg-slate-900/40 border-slate-300/50 border-dashed text-white/50' : 'bg-white border-slate-200 text-slate-800'}
              `}>
                {pAvatar ? (
                  <img src={pAvatar} className="w-full h-full object-cover" alt={pName} />
                ) : (
                  <span className="text-xs">{isPlaceholder ? <User size={16} /> : pNumber}</span>
                )}
              </div>
              <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap backdrop-blur-sm
                  ${isSelected ? 'bg-yellow-400 text-yellow-900' :
                  isPlaceholder ? 'bg-black/30 text-white/70' : 'bg-black/50 text-white'}
              `}>
                {pName} {/* {isPlaceholder && pos.playerId.includes('gk') ? 'Goleiro' : pName} */}
              </div>
            </div>
          );
        })}

        {/* Mouse Interaction Overlay for Move */}
        {draggingId && isEditable && (
          <div className="absolute inset-0 z-20 cursor-move" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}></div>
        )}
      </div>

      {/* RESERVES / BENCH Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center justify-between">
          Banco de Reservas ({reserves.length})
          {reserves.length > 0 && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded">Clique para trocar</span>}
        </h4>

        {reserves.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nenhum jogador no banco.</p>
        ) : (
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
            {reserves.map(player => (
              <button
                key={player.id}
                disabled={!isEditable || !swapTargetId}
                onClick={() => executeSwap(player.id)}
                className={`flex flex-col items-center p-2 rounded-lg transition border ${isEditable && swapTargetId
                  ? 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 ring-2 ring-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 opacity-60 cursor-not-allowed border-transparent'
                  }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 overflow-hidden">
                  {((player as any).avatar || (player as any).profilePicture) ? <img src={((player as any).avatar || (player as any).profilePicture)} className="w-full h-full object-cover" /> : player.number}
                </div>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{player.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SWAP MODAL / OVERLAY (When a player is selected) */}
      {swapTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setSwapTargetId(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Trocar Jogador</h3>
              <button onClick={() => setSwapTargetId(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} className="text-slate-500" /></button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-600 shadow-md">
                {(() => {
                  const p = team.roster.find(r => r.id === swapTargetId);
                  return ((p as any)?.avatar || (p as any)?.profilePicture) ? <img src={((p as any).avatar || (p as any).profilePicture)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20} /></div>;
                })()}
              </div>
              <div>
                <p className="font-bold text-lg text-slate-900 dark:text-white">{team.roster.find(r => r.id === swapTargetId)?.name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Titular Atual</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium flex items-center gap-2">
                <RefreshCw size={14} /> Substituir por:
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                {reserves.map(player => (
                  <button
                    key={player.id}
                    onClick={() => executeSwap(player.id)}
                    className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition text-left group bg-white dark:bg-slate-800"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 overflow-hidden group-hover:bg-white dark:group-hover:bg-slate-600 text-center border border-slate-100 dark:border-slate-600">
                      {((player as any).avatar || (player as any).profilePicture) ? <img src={((player as any).avatar || (player as any).profilePicture)} className="w-full h-full object-cover" /> : player.number}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">{player.name}</span>
                  </button>
                ))}
              </div>
              {reserves.length === 0 && <div className="text-center text-slate-400 py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm">Sem opções no banco.</div>}
            </div>

            <div className="text-xs text-slate-400 text-center">
              Toque no jogador do banco para confirmar a troca.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TacticsBoard;
