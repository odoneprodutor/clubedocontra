
import React, { useState, useMemo, useEffect } from 'react';
import { Tournament, Match, Team, NewsItem, UserRole, MatchStatus, MatchType, MatchEventType, Arena, CurrentUser, SportType } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, Trophy, Calendar, Medal, Newspaper, Target, Users, UserPlus, X, Edit, Trash2, Save, MapPin } from 'lucide-react';
import { SPORT_TYPE_DETAILS } from '../constants';
import MatchCard from './MatchCard';
import StandingsTable from './StandingsTable';

interface TournamentDetailViewProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  news: NewsItem[];
  arenas: Arena[];
  currentUser: CurrentUser;
  onClose: () => void;
  onMatchClick: (matchId: string) => void;
  onUpdateScore: (matchId: string, h: number, a: number, status: MatchStatus) => void;
  onEditMatch: (match: Match) => void;
  onTeamClick: (teamId: string) => void;
  onInviteTeam: (tournamentId: string, teamId: string) => void;
  onDeleteTournament: (tournamentId: string) => void;
  onUpdateTournament: (updatedTournament: Tournament) => void;
}

const TournamentDetailView: React.FC<TournamentDetailViewProps> = ({
  tournament,
  matches,
  teams,
  news,
  arenas,
  currentUser,
  onClose,
  onMatchClick,
  onUpdateScore,
  onEditMatch,
  onTeamClick,
  onInviteTeam,
  onDeleteTournament,
  onUpdateTournament
}) => {
  // State for Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [teamToInvite, setTeamToInvite] = useState<string>('');

  // State for Edit Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: tournament.name,
    status: tournament.status,
    totalRounds: tournament.totalRounds,
    sportType: tournament.sportType || SportType.FUT7
  });

  // Filter matches for this tournament
  const tournamentMatches = useMemo(() =>
    matches.filter(m => m.tournamentId === tournament.id),
    [matches, tournament.id]);

  // Extract unique rounds and sort them
  const rounds = useMemo(() => {
    const uniqueRounds = Array.from(new Set(tournamentMatches.map(m => m.round || 'Desconhecido')));
    return uniqueRounds.sort();
  }, [tournamentMatches]);

  // State for Round Selector
  const [currentRoundIndex, setCurrentRoundIndex] = useState(() => {
    const idx = rounds.findIndex(r => r.includes(tournament.currentRound.toString()));
    return idx !== -1 ? idx : 0;
  });

  const selectedRound = rounds[currentRoundIndex];

  // Matches filtered by selected round
  const roundMatches = useMemo(() =>
    tournamentMatches.filter(m => m.round === selectedRound),
    [tournamentMatches, selectedRound]);

  // Top Scorers Logic
  const topScorers = useMemo(() => {
    const scorerMap: Record<string, number> = {};

    tournamentMatches.forEach(match => {
      match.events.forEach(event => {
        if (event.type === MatchEventType.GOAL && event.playerId) {
          scorerMap[event.playerId] = (scorerMap[event.playerId] || 0) + 1;
        }
      });
    });

    // Convert to array and sort
    const sortedScorers = Object.entries(scorerMap)
      .map(([playerId, goals]) => {
        const playerTeam = teams.find(t => t.roster.some(p => p.id === playerId));
        const player = playerTeam?.roster.find(p => p.id === playerId);
        return {
          id: playerId,
          name: player?.name || 'Desconhecido',
          teamName: playerTeam?.shortName || '???',
          teamColor: playerTeam?.logoColor || '#ccc',
          goals
        };
      })
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5); // Top 5

    return sortedScorers;
  }, [tournamentMatches, teams]);

  // Contextual News
  const tournamentNews = useMemo(() =>
    news.filter(n => n.tournamentId === tournament.id),
    [news, tournament.id]);

  // Participating Teams Logic
  const participatingTeams = useMemo(() =>
    teams.filter(t => tournament.participatingTeamIds?.includes(t.id)),
    [teams, tournament.participatingTeamIds]);

  // Available Teams to Invite (Not already participating)
  const availableTeams = useMemo(() =>
    teams.filter(t => !tournament.participatingTeamIds?.includes(t.id) && !t.isDeleted),
    [teams, tournament.participatingTeamIds]);

  const isCreator = currentUser.id === tournament.createdBy;

  // Navigation handlers
  const handlePrevRound = () => {
    if (currentRoundIndex > 0) setCurrentRoundIndex(prev => prev - 1);
  };

  const handleNextRound = () => {
    if (currentRoundIndex < rounds.length - 1) setCurrentRoundIndex(prev => prev + 1);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamToInvite) {
      onInviteTeam(tournament.id, teamToInvite);
      setIsInviteModalOpen(false);
      setTeamToInvite('');
    }
  };

  // Tournament Arena Logic
  const tournamentArena = useMemo(() => {
    const arenaIds = [...new Set(tournamentMatches.map(m => m.arenaId).filter(Boolean))];
    if (arenaIds.length === 1) {
      return arenas.find(a => a.id === arenaIds[0]);
    }
    return null;
  }, [tournamentMatches, arenas]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTournament({
      ...tournament,
      name: editForm.name,
      status: editForm.status as 'ACTIVE' | 'FINISHED',
      totalRounds: editForm.totalRounds,
      sportType: editForm.sportType
    });
    setIsEditing(false);
  };

  const getArena = (id: string) => arenas.find(a => a.id === id) || arenas[0];
  const getTeam = (id: string) => teams.find(t => t.id === id) || teams[0];

  return (
    <div className="animate-in fade-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={16} /> Voltar para lista
        </button>

        {isCreator && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-bold"
            >
              <Edit size={16} /> Editar
            </button>
            <button
              onClick={() => onDeleteTournament(tournament.id)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-bold"
            >
              <Trash2 size={16} /> Excluir
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Trophy size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase">{tournament.format === 'LEAGUE' ? 'Pontos Corridos' : 'Mata-Mata'}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${tournament.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {tournament.status === 'ACTIVE' ? 'Em Andamento' : 'Encerrado'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-700">
                {SPORT_TYPE_DETAILS[tournament.sportType]?.label || 'Futebol'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{tournament.name}</h1>
            <p className="text-slate-500">Rodada {tournament.currentRound} de {tournament.totalRounds} • {SPORT_TYPE_DETAILS[tournament.sportType]?.players} Jogadores por Time</p>
          </div>

          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
              <span>Progresso</span>
              <span>{Math.round((tournament.currentRound / tournament.totalRounds) * 100)}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(tournament.currentRound / tournament.totalRounds) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Matches & Round Selector */}
        <div className="lg:col-span-2 space-y-6">

          {/* Round Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex items-center justify-between sticky top-20 z-10">
            <button
              onClick={handlePrevRound}
              disabled={currentRoundIndex === 0}
              className="p-2 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-sm text-slate-400 font-medium uppercase tracking-widest">Visualizando</span>
              <span className="text-lg font-bold text-slate-900">{selectedRound || 'Nenhuma rodada'}</span>
            </div>
            <button
              onClick={handleNextRound}
              disabled={currentRoundIndex === rounds.length - 1}
              className="p-2 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Match List */}
          <div className="space-y-4">
            {roundMatches.length > 0 ? (
              roundMatches.map(m => (
                <div key={m.id} onClick={() => onMatchClick(m.id)} className="cursor-pointer hover:ring-2 hover:ring-emerald-500 rounded-xl transition">
                  <MatchCard
                    match={m}
                    homeTeam={getTeam(m.homeTeamId)}
                    awayTeam={getTeam(m.awayTeamId)}
                    arena={getArena(m.arenaId)}
                    userRole={currentUser.role}
                    onUpdateScore={onUpdateScore}
                    onEditDetails={onEditMatch}
                    onTeamClick={onTeamClick}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400">Nenhum jogo encontrado para esta rodada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stats & Data */}
        <div className="space-y-6">

          {/* Tournament Arena Map */}
          {tournamentArena && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                <MapPin size={18} className="text-red-500" />
                Local do Campeonato
              </h3>
              <div className="mb-2">
                <p className="font-bold text-sm">{tournamentArena.name}</p>
                <p className="text-xs text-slate-500">{tournamentArena.address}</p>
              </div>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(tournamentArena.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
              </div>
              {tournamentArena.googleMapsUrl && (
                <a href={tournamentArena.googleMapsUrl} target="_blank" rel="noreferrer" className="text-emerald-600 text-xs font-bold mt-2 block hover:underline">
                  Abrir no Google Maps
                </a>
              )}
            </div>
          )}

          {/* Participating Teams & Management */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                Times Participantes
              </h3>
              {isCreator && (
                (tournament.maxTeams === undefined || participatingTeams.length < tournament.maxTeams) ? (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="text-xs bg-slate-900 text-white px-2 py-1 rounded hover:bg-slate-800 flex items-center gap-1"
                  >
                    <UserPlus size={12} /> Convidar
                  </button>
                ) : (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    Lotado ({tournament.maxTeams}/{tournament.maxTeams})
                  </span>
                )
              )}
            </div>

            {participatingTeams.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {participatingTeams.map(t => (
                  <div key={t.id} onClick={() => onTeamClick(t.id)} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.logoColor }}></span>
                    <span className="text-xs font-bold text-slate-700">{t.shortName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">Nenhum time inscrito ainda.</div>
            )}
          </div>

          {/* Standings (Always Visible) */}
          {tournament.format === 'LEAGUE' && (
            <StandingsTable teams={teams.filter(t => tournament.participatingTeamIds.includes(t.id))} matches={tournamentMatches} onTeamClick={onTeamClick} />
          )}

          {/* Top Scorers */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Target size={18} className="text-emerald-400" />
                Artilharia
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {topScorers.length > 0 ? topScorers.map((scorer, index) => (
                <div key={scorer.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{scorer.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scorer.teamColor }}></span>
                        {scorer.teamName}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-emerald-600">{scorer.goals}</div>
                </div>
              )) : (
                <div className="p-4 text-center text-sm text-slate-400">Nenhum gol registrado ainda.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Editar Campeonato</h3>
              <button onClick={() => setIsEditing(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'ACTIVE' | 'FINISHED' })}
                  className="w-full border rounded p-2 text-sm"
                >
                  <option value="ACTIVE">Em Andamento</option>
                  <option value="FINISHED">Encerrado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modalidade</label>
                <select
                  value={editForm.sportType}
                  onChange={(e) => setEditForm({ ...editForm, sportType: e.target.value as SportType })}
                  className="w-full border rounded p-2 text-sm"
                >
                  {Object.values(SportType).map((type) => (
                    <option key={type} value={type}>
                      {SPORT_TYPE_DETAILS[type].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total de Rodadas</label>
                <input
                  type="number"
                  value={editForm.totalRounds}
                  onChange={(e) => setEditForm({ ...editForm, totalRounds: parseInt(e.target.value) })}
                  className="w-full border rounded p-2 text-sm"
                  min={1}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-2 text-slate-500 text-sm">Cancelar</button>
                <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                  <Save size={16} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Convidar Time</h3>
              <button onClick={() => setIsInviteModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>

            <p className="text-xs text-slate-500 mb-4">Selecione um time para convidar para o campeonato <strong>{tournament.name}</strong>.</p>

            <form onSubmit={handleInviteSubmit}>
              <div className="mb-4">
                {availableTeams.length > 0 ? (
                  <select
                    value={teamToInvite}
                    onChange={(e) => setTeamToInvite(e.target.value)}
                    className="w-full border rounded p-2 text-sm"
                    required
                  >
                    <option value="">Selecione um time...</option>
                    {availableTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    Não há times disponíveis para convidar.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-3 py-2 text-slate-500 text-sm">Cancelar</button>
                <button type="submit" disabled={!teamToInvite} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TournamentDetailView;
