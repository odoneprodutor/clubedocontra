
import React, { useMemo } from 'react';
import { Arena, Match, Team, UserRole } from '../types';
import { ArrowLeft, MapPin, Calendar, ExternalLink } from 'lucide-react';
import MatchCard from './MatchCard';

interface ArenaDetailViewProps {
    arena: Arena;
    matches: Match[];
    teams: Team[];
    currentUserRole: UserRole;
    onClose: () => void;
    onMatchClick: (matchId: string) => void;
    onUpdateScore: (matchId: string, h: number, a: number, status: any) => void;
    onEditMatch: (match: Match) => void;
    onTeamClick: (teamId: string) => void;
}

const ArenaDetailView: React.FC<ArenaDetailViewProps> = ({
    arena,
    matches,
    teams,
    currentUserRole,
    onClose,
    onMatchClick,
    onUpdateScore,
    onEditMatch,
    onTeamClick
}) => {
    const arenaMatches = useMemo(() =>
        matches.filter(m => m.arenaId === arena.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [matches, arena.id]);

    const getTeam = (id: string) => teams.find(t => t.id === id) || teams[0];
    const getArena = (id: string) => arena; // We are in the arena view

    return (
        <div className="animate-in fade-in slide-in-from-right duration-300">
            <div className="mb-4">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition"
                >
                    <ArrowLeft size={16} /> Voltar para lista
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <div className="h-48 bg-slate-200 relative">
                    {arena.coverPicture ? (
                        <img src={arena.coverPicture} alt={arena.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <MapPin size={64} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 text-white">
                        <h1 className="text-3xl font-black mb-1">{arena.name}</h1>
                        <p className="flex items-center gap-2 opacity-90 font-medium">
                            <MapPin size={16} className="text-emerald-400" />
                            {arena.address}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                        <Calendar className="text-emerald-600" />
                        Histórico de Jogos
                    </h3>

                    {arenaMatches.length > 0 ? (
                        <div className="space-y-4">
                            {arenaMatches.map(m => (
                                <div key={m.id} onClick={() => onMatchClick(m.id)} className="cursor-pointer">
                                    <MatchCard
                                        match={m}
                                        homeTeam={getTeam(m.homeTeamId)}
                                        awayTeam={getTeam(m.awayTeamId)}
                                        arena={arena}
                                        userRole={currentUserRole}
                                        onUpdateScore={onUpdateScore}
                                        onEditDetails={onEditMatch}
                                        onTeamClick={onTeamClick}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                            Nenhum jogo realizado nesta arena ainda.
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-red-500" /> Localização
                        </h3>
                        <div className="aspect-square w-full bg-slate-100 rounded-lg overflow-hidden mb-4 border border-slate-200">
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                title={arena.name}
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(arena.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            ></iframe>
                        </div>
                        {arena.googleMapsUrl && (
                            <a
                                href={arena.googleMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition text-sm border border-slate-200"
                            >
                                <ExternalLink size={14} /> Abrir no Google Maps
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArenaDetailView;
