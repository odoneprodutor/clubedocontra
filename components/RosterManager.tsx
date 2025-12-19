import React, { useState, useMemo } from 'react';
import { Player, Team, UserRole, PlayerEvaluation, TacticalPosition } from '../types';
import {
    Activity,
    Edit2,
    Save,
    X,
    ChevronLeft,
    Star,
    Hash,
    User as UserIcon,
    Users,
    Stethoscope,
    ClipboardList,
    Trash2,
    Crown,
    Move
} from 'lucide-react';
import TacticsBoard from './TacticsBoard';

interface RosterManagerProps {
    team: Team;
    isEditable: boolean;
    onSaveRoster: (updatedRoster: Player[]) => void;
    onBack: () => void;
    evaluations: PlayerEvaluation[];
    onEvaluatePlayer: (player: Player) => void;
    onSaveTactics: (newPositions: TacticalPosition[]) => void;
    onApplyFormation: (formation: any) => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
    team,
    isEditable,
    onSaveRoster,
    onBack,
    evaluations,
    onEvaluatePlayer,
    onSaveTactics,
    onApplyFormation
}) => {
    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Player>>({});
    const [roster, setRoster] = useState<Player[]>(team.roster);

    // Filter evaluations for this team's players
    const playerEvals = useMemo(() => {
        const map: Record<string, PlayerEvaluation[]> = {};
        evaluations.forEach(ev => {
            if (!map[ev.playerId]) map[ev.playerId] = [];
            map[ev.playerId].push(ev);
        });
        return map;
    }, [evaluations]);

    const handleEdit = (player: Player) => {
        setEditingPlayerId(player.id);
        setEditData({ ...player });
    };

    const handleCancel = () => {
        setEditingPlayerId(null);
        setEditData({});
    };

    const handleSavePlayer = () => {
        if (!editingPlayerId) return;
        const updatedRoster = roster.map(p =>
            p.id === editingPlayerId ? { ...p, ...editData } as Player : p
        );
        setRoster(updatedRoster);
        onSaveRoster(updatedRoster);
        setEditingPlayerId(null);
        setEditData({});
    };

    const toggleInjury = (player: Player) => {
        const updatedRoster = roster.map(p =>
            p.id === player.id ? { ...p, isInjured: !p.isInjured } : p
        );
        setRoster(updatedRoster);
        onSaveRoster(updatedRoster);
    };

    const handleRemove = (playerId: string) => {
        if (!window.confirm("Tem certeza que deseja remover este jogador do elenco?")) return;
        const updatedRoster = roster.filter(p => p.id !== playerId);
        setRoster(updatedRoster);
        onSaveRoster(updatedRoster);
    };

    const getPlayerAvgRating = (playerId: string) => {
        const evs = playerEvals[playerId] || [];
        if (evs.length === 0) return 0;
        const sum = evs.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / evs.length).toFixed(1);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition btn-feedback"
                    >
                        <ChevronLeft size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            Gestão de Elenco <span className="text-emerald-500 text-sm font-normal px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-full">{team.name}</span>
                        </h2>
                        <p className="text-slate-500 text-sm">Edite números, posições e status médico dos atletas.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                {/* Roster List/Table */}
                <div className="lg:col-span-2">
                    <div className="glass-panel rounded-3xl overflow-hidden interactive-card border border-slate-100 dark:border-slate-800">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Atleta</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Número</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Posição</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Estatísticas</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Avaliação</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {roster.map(p => {
                                        const isEditing = editingPlayerId === p.id;
                                        const evsCount = (playerEvals[p.id] || []).length;
                                        const avgRating = getPlayerAvgRating(p.id);

                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                                                {/* Atleta Info */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                                                            {(p as any).avatar || (p as any).profilePicture ? (
                                                                <img src={(p as any).avatar || (p as any).profilePicture} className="w-full h-full object-cover" alt={p.name} />
                                                            ) : (
                                                                <UserIcon size={20} />
                                                            )}
                                                            {p.isInjured && (
                                                                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                                                    <Stethoscope size={16} className="text-red-600 drop-shadow-sm" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editData.name}
                                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                                className="px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-32"
                                                            />
                                                        ) : (
                                                            <div>
                                                                <div className="font-bold text-slate-800 dark:text-white text-sm">{p.name}</div>
                                                                {p.isInjured && <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">No DM 🚑</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Número */}
                                                <td className="px-6 py-4">
                                                    {isEditing ? (
                                                        <div className="relative w-16">
                                                            <Hash className="absolute left-1 top-1.5 text-slate-400" size={14} />
                                                            <input
                                                                type="number"
                                                                value={editData.number}
                                                                onChange={(e) => setEditData({ ...editData, number: parseInt(e.target.value) })}
                                                                className="pl-5 pr-1 py-1 bg-white dark:bg-slate-900 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="font-mono font-bold text-slate-500 dark:text-slate-400">#{p.number}</span>
                                                    )}
                                                </td>

                                                {/* Posição */}
                                                <td className="px-6 py-4">
                                                    {isEditing ? (
                                                        <select
                                                            value={editData.position}
                                                            onChange={(e) => setEditData({ ...editData, position: e.target.value as any })}
                                                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                        >
                                                            <option value="GK">Goleiro (GK)</option>
                                                            <option value="CB">Zagueiro (CB)</option>
                                                            <option value="LB">Lateral Esquerdo (LB)</option>
                                                            <option value="RB">Lateral Direito (RB)</option>
                                                            <option value="LWB">Ala Esquerdo (LWB)</option>
                                                            <option value="RWB">Ala Direito (RWB)</option>
                                                            <option value="CDM">Volante (CDM)</option>
                                                            <option value="CM">Meio-Campo (CM)</option>
                                                            <option value="CAM">Meia Armador (CAM)</option>
                                                            <option value="LM">Meia Esquerda (LM)</option>
                                                            <option value="RM">Meia Direita (RM)</option>
                                                            <option value="LW">Ponta Esquerda (LW)</option>
                                                            <option value="RW">Ponta Direita (RW)</option>
                                                            <option value="CF">Falso 9 / Centroavante (CF)</option>
                                                            <option value="ST">Centroavante (ST)</option>
                                                            <option value="Curinga">Curinga</option>
                                                        </select>
                                                    ) : (
                                                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">
                                                            {p.position}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status Médico */}
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => isEditable && toggleInjury(p)}
                                                        disabled={!isEditable}
                                                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition ${p.isInjured
                                                            ? 'bg-red-50 text-red-600 border border-red-200'
                                                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                            } ${isEditable ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
                                                    >
                                                        {p.isInjured ? (
                                                            <> <Stethoscope size={14} /> LESIONADO </>
                                                        ) : (
                                                            <> <Activity size={14} /> APTO </>
                                                        )}
                                                    </button>
                                                </td>

                                                {/* Estatísticas */}
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-3 text-xs">
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-400 text-[9px] uppercase font-bold">Gols</span>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">{p.stats.goals}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-400 text-[9px] uppercase font-bold">Assists</span>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">{p.stats.assists}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Avaliação */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center text-amber-500">
                                                            <Star size={14} fill={Number(avgRating) > 0 ? "currentColor" : "none"} />
                                                            <span className="ml-1 font-bold text-sm">{avgRating}</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-medium">({evsCount})</span>
                                                    </div>
                                                </td>

                                                {/* Ações */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => onEvaluatePlayer(p)}
                                                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition btn-feedback"
                                                            title="Avaliar Atleta"
                                                        >
                                                            <ClipboardList size={18} />
                                                        </button>
                                                        {isEditable && (
                                                            <>
                                                                {isEditing ? (
                                                                    <div className="flex gap-1 animate-in zoom-in-95">
                                                                        <button onClick={handleSavePlayer} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-lg shadow-emerald-200 transition btn-feedback">
                                                                            <Save size={18} />
                                                                        </button>
                                                                        <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition btn-feedback">
                                                                            <X size={18} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleEdit(p)}
                                                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition btn-feedback"
                                                                            title="Editar Atleta"
                                                                        >
                                                                            <Edit2 size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRemove(p.id)}
                                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition opacity-100"
                                                                            title="Remover do Elenco"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {roster.length === 0 && (
                            <div className="p-12 text-center">
                                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 italic">Nenhum atleta vinculado a este elenco.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tactics Board Column */}
                <div className="lg:col-span-1">
                    <div className="glass-panel rounded-3xl p-6 interactive-card flex flex-col gap-4 border border-slate-100 dark:border-slate-800 h-full">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                                <Crown size={20} className="text-amber-500 icon-hover" /> Formação
                            </h3>
                        </div>

                        {/* Formation Presets - Horizontal Scroll */}
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1 overflow-x-auto custom-scrollbar no-scrollbar">
                            {(function () {
                                const formations: Record<string, string[]> = {
                                    'FUTSAL': ['1-2-1', '2-2', '3-1', 'GK-PLAY'],
                                    'FUT6': ['2-2-1', '3-1-1', '2-1-2'],
                                    'FUT7': ['2-3-1', '3-2-1', '3-3', '4-2', '4-1-1'],
                                    'FUT8': ['3-3-1', '3-2-2', '2-4-1'],
                                    'AMATEUR': ['4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-2-3-1'],
                                    'PROFESSIONAL': ['4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-2-3-1']
                                };
                                const type = team.sportType || 'FUT7';
                                const availableFormations = formations[type] || ['4-4-2', '4-3-3'];

                                return availableFormations.map(form => (
                                    <button
                                        key={form}
                                        onClick={() => isEditable && onApplyFormation(form as any)}
                                        disabled={!isEditable}
                                        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${isEditable ? 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm btn-feedback' : 'text-slate-300 dark:text-slate-600 cursor-default'}`}
                                    >
                                        {form}
                                    </button>
                                ));
                            })()}
                        </div>

                        <TacticsBoard
                            team={team}
                            isEditable={isEditable}
                            onSave={onSaveTactics}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

