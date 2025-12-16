import React, { useState } from 'react';
import { MapPin, Trophy, Calendar, CheckCircle, Edit, Settings } from 'lucide-react';
import { Match, Team, MatchStatus, Arena, UserRole } from '../types';

interface MatchCardProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  arena: Arena;
  userRole: UserRole;
  onUpdateScore: (matchId: string, h: number, a: number, status: MatchStatus) => void;
  onEditDetails: (match: Match) => void;
  onTeamClick?: (teamId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match, homeTeam, awayTeam, arena, userRole, onUpdateScore, onEditDetails, onTeamClick
}) => {
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [tempHomeScore, setTempHomeScore] = useState(match.homeScore || 0);
  const [tempAwayScore, setTempAwayScore] = useState(match.awayScore || 0);
  const [tempStatus, setTempStatus] = useState<MatchStatus>(match.status);

  const date = new Date(match.date);
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(date);

  const handleSaveScore = () => {
    onUpdateScore(match.id, tempHomeScore, tempAwayScore, tempStatus);
    setIsEditingScore(false);
  };

  const handleTeamClickInternal = (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation();
    if (onTeamClick) {
      onTeamClick(teamId);
    }
  };

  const isReferee = userRole === UserRole.REFEREE;
  const isDirector = userRole === UserRole.DIRECTOR;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden interactive-card relative group backdrop-blur-md">
      {/* Edit Action for Director */}
      {isDirector && (
        <button
          onClick={(e) => { e.stopPropagation(); onEditDetails(match); }}
          className="absolute top-2 right-2 p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition z-10 opacity-0 group-hover:opacity-100 btn-feedback"
          title="Editar Detalhes"
        >
          <Settings size={16} />
        </button>
      )}

      {/* Header */}
      <div className="bg-white/50 dark:bg-transparent px-4 py-3 border-b border-white/40 dark:border-white/5 flex justify-between items-center pr-10">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide truncate">
          {match.type === 'LEAGUE' || match.type === 'KNOCKOUT' ? <Trophy size={14} className="text-amber-500 icon-hover" /> : <Calendar size={14} className="text-blue-500 icon-hover" />}
          <span className="truncate max-w-[120px]">{match.round || 'Amistoso'}</span>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm ${match.status === MatchStatus.FINISHED ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' :
          match.status === MatchStatus.LIVE ? 'bg-red-500 text-white animate-pulse shadow-red-300' :
            'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
          }`}>
          {match.status === MatchStatus.FINISHED ? 'Encerrado' :
            match.status === MatchStatus.LIVE ? 'Ao Vivo' : 'Agendado'}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="p-5 relative">
        {/* Decorative background glow for live matches */}
        {match.status === MatchStatus.LIVE && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-2xl -z-10"></div>
        )}

        <div className="flex items-center justify-between">

          {/* Home Team */}
          <div
            className={`flex-1 flex flex-col items-center gap-3 group/team ${onTeamClick ? 'cursor-pointer' : ''}`}
            onClick={(e) => handleTeamClickInternal(e, homeTeam.id)}
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover/team:scale-110 transition-transform duration-300 border-2 border-white dark:border-slate-700 overflow-hidden" style={{ backgroundColor: homeTeam.logoColor }}>
                {homeTeam.profilePicture ? (
                  <img src={homeTeam.profilePicture} alt={homeTeam.shortName.toUpperCase()} className="w-full h-full object-cover" />
                ) : homeTeam.shortName.toUpperCase()}
              </div>
              {match.status === MatchStatus.LIVE && match.homeScore > match.awayScore && (
                <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-white"><Trophy size={10} className="text-white" /></div>
              )}
            </div>
            <span className="font-bold text-sm text-center text-slate-800 dark:text-slate-100 leading-tight group-hover/team:text-emerald-600 dark:group-hover/team:text-emerald-400 transition-colors">{homeTeam.name}</span>
          </div>

          {/* Score / VS */}
          <div className="mx-2 flex flex-col items-center justify-center min-w-[80px]">
            {match.status === MatchStatus.SCHEDULED && !isEditingScore ? (
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500">VS</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {isEditingScore ? (
                  <input
                    type="number"
                    value={tempHomeScore}
                    onChange={(e) => setTempHomeScore(parseInt(e.target.value) || 0)}
                    className="w-12 h-12 text-center border-2 border-slate-200 dark:border-slate-600 rounded-xl font-bold text-2xl focus:border-emerald-500 focus:outline-none bg-white/80 dark:bg-slate-800/80 dark:text-white input-focus-effect"
                  />
                ) : (
                  <span className={`text-4xl font-black ${match.status === MatchStatus.LIVE ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{match.homeScore || 0}</span>
                )}
                <span className="text-slate-300 dark:text-slate-600 text-xl font-light">:</span>
                {isEditingScore ? (
                  <input
                    type="number"
                    value={tempAwayScore}
                    onChange={(e) => setTempAwayScore(parseInt(e.target.value) || 0)}
                    className="w-12 h-12 text-center border-2 border-slate-200 dark:border-slate-600 rounded-xl font-bold text-2xl focus:border-emerald-500 focus:outline-none bg-white/80 dark:bg-slate-800/80 dark:text-white input-focus-effect"
                  />
                ) : (
                  <span className={`text-4xl font-black ${match.status === MatchStatus.LIVE ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{match.awayScore || 0}</span>
                )}
              </div>
            )}
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-semibold uppercase tracking-wide bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">{formattedDate}</span>
          </div>

          {/* Away Team */}
          <div
            className={`flex-1 flex flex-col items-center gap-3 group/team ${onTeamClick ? 'cursor-pointer' : ''}`}
            onClick={(e) => handleTeamClickInternal(e, awayTeam.id)}
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover/team:scale-110 transition-transform duration-300 border-2 border-white dark:border-slate-700 overflow-hidden" style={{ backgroundColor: awayTeam.logoColor }}>
                {awayTeam.profilePicture ? (
                  <img src={awayTeam.profilePicture} alt={awayTeam.shortName.toUpperCase()} className="w-full h-full object-cover" />
                ) : awayTeam.shortName.toUpperCase()}
              </div>
              {match.status === MatchStatus.LIVE && match.awayScore > match.homeScore && (
                <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-white"><Trophy size={10} className="text-white" /></div>
              )}
            </div>
            <span className="font-bold text-sm text-center text-slate-800 dark:text-slate-100 leading-tight group-hover/team:text-emerald-600 dark:group-hover/team:text-emerald-400 transition-colors">{awayTeam.name}</span>
          </div>
        </div>

        {/* Referee Controls */}
        {isEditingScore && (
          <div className="mt-4 flex justify-center gap-2 animate-in fade-in slide-in-from-top-2">
            <select
              value={tempStatus}
              onChange={(e) => setTempStatus(e.target.value as MatchStatus)}
              className="text-xs border rounded-lg p-2 bg-white/80 dark:bg-slate-800/80 dark:text-white dark:border-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 input-focus-effect"
            >
              <option value={MatchStatus.SCHEDULED}>Agendado</option>
              <option value={MatchStatus.LIVE}>Ao Vivo</option>
              <option value={MatchStatus.FINISHED}>Encerrado</option>
            </select>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="px-4 py-3 bg-white/40 dark:bg-transparent border-t border-white/50 dark:border-white/5 flex justify-between items-center backdrop-blur-sm">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${arena.lat},${arena.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate max-w-[150px] group/loc btn-feedback"
        >
          <MapPin size={14} className="group-hover/loc:animate-bounce" />
          {arena.name}
        </a>

        {isReferee && (
          <div onClick={(e) => e.stopPropagation()}>
            {isEditingScore ? (
              <button
                onClick={handleSaveScore}
                className="btn-feedback flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:shadow-emerald-300"
              >
                <CheckCircle size={14} />
                Salvar
              </button>
            ) : (
              <button
                onClick={() => setIsEditingScore(true)}
                className="btn-feedback flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
              >
                <Edit size={14} />
                Arbitrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;