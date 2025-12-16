
import React, { useMemo } from 'react';
import { Team, Match, MatchStatus, MatchType } from '../types';

interface StandingsTableProps {
  teams: Team[];
  matches: Match[];
  onTeamClick?: (teamId: string) => void;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ teams, matches, onTeamClick }) => {
  // Recalculate standings based on matches (in a real app, this might be stored in DB, but we compute on fly)
  const computedTeams = useMemo(() => {
    // Clone teams to avoid mutating props directly
    const newTeams = teams.map(t => ({
      ...t,
      wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, points: 0
    }));

    matches.forEach(match => {
      if (match.status === MatchStatus.FINISHED && match.type === MatchType.LEAGUE) {
        const homeIdx = newTeams.findIndex(t => t.id === match.homeTeamId);
        const awayIdx = newTeams.findIndex(t => t.id === match.awayTeamId);

        if (homeIdx === -1 || awayIdx === -1) return;

        const hScore = match.homeScore || 0;
        const aScore = match.awayScore || 0;

        newTeams[homeIdx].goalsFor += hScore;
        newTeams[homeIdx].goalsAgainst += aScore;
        newTeams[awayIdx].goalsFor += aScore;
        newTeams[awayIdx].goalsAgainst += hScore;

        if (hScore > aScore) {
          newTeams[homeIdx].wins++;
          newTeams[homeIdx].points += 3;
          newTeams[awayIdx].losses++;
        } else if (hScore < aScore) {
          newTeams[awayIdx].wins++;
          newTeams[awayIdx].points += 3;
          newTeams[homeIdx].losses++;
        } else {
          newTeams[homeIdx].draws++;
          newTeams[homeIdx].points += 1;
          newTeams[awayIdx].draws++;
          newTeams[awayIdx].points += 1;
        }
      }
    });

    return newTeams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      return gdB - gdA;
    });
  }, [teams, matches]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-emerald-600 border-b border-emerald-500">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          Tabela do Campeonato
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">Pos</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3 text-center">P</th>
              <th className="px-4 py-3 text-center">J</th>
              <th className="px-4 py-3 text-center">V</th>
              <th className="px-4 py-3 text-center">E</th>
              <th className="px-4 py-3 text-center">D</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">SG</th>
            </tr>
          </thead>
          <tbody>
            {computedTeams.map((team, index) => (
              <tr key={team.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{index + 1}º</td>
                <td
                  className={`px-4 py-3 font-medium text-gray-900 flex items-center gap-2 ${onTeamClick ? 'cursor-pointer hover:text-emerald-600' : ''}`}
                  onClick={() => onTeamClick && onTeamClick(team.id)}
                >
                  {team.profilePicture ? (
                    <img src={team.profilePicture} alt={team.shortName} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white font-bold"
                      style={{ backgroundColor: team.logoColor }}
                    >
                      {team.shortName.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                  {team.name}
                </td>
                <td className="px-4 py-3 text-center font-bold text-emerald-600">{team.points}</td>
                <td className="px-4 py-3 text-center">{team.wins + team.draws + team.losses}</td>
                <td className="px-4 py-3 text-center text-green-600">{team.wins}</td>
                <td className="px-4 py-3 text-center text-gray-500">{team.draws}</td>
                <td className="px-4 py-3 text-center text-red-500">{team.losses}</td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  {team.goalsFor - team.goalsAgainst}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsTable;
