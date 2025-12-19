import React, { useState, useEffect } from 'react';
import { UserAccount, Team, UserRole } from '../types';
import { Trophy, AlertTriangle, User, Mail, Key, UserPlus } from 'lucide-react';
import { CitySelect } from './CitySelect';
import { uploadImage } from '../utils/helpers';

interface LoginScreenProps {
    users: UserAccount[];
    teams: Team[];
    onLogin: (user: UserAccount) => void;
    onRegister: (newUser: UserAccount) => void;
    pendingInviteTeamId?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, teams, onLogin, onRegister, pendingInviteTeamId }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.FAN);
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [avatar, setAvatar] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Auto-select team if invititation is pending
    useEffect(() => {
        if (pendingInviteTeamId) {
            setSelectedTeamId(pendingInviteTeamId);
            setIsRegistering(true); // Assuming invites usually for new users, but they can toggle back
        }
    }, [pendingInviteTeamId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isRegistering) {
            if (!name || !email || !password) {
                setError("Por favor, preencha todos os campos obrigatórios.");
                return;
            }

            const emailExists = users.some(u => u.email === email);
            if (emailExists) {
                setError("Este email já está cadastrado.");
                return;
            }

            if ((role === UserRole.COACH || role === UserRole.PLAYER || role === UserRole.FAN) && !selectedTeamId) {
                if (teams.length === 0) {
                    setError("Não existem times cadastrados. Registre-se como DIRETOR primeiro para criar um time.");
                    return;
                }
                setError("Por favor, selecione um time.");
                return;
            }

            const newUser: UserAccount = {
                id: crypto.randomUUID(),
                email,
                password,
                name,
                role,
                location: location || 'Desconhecida',
                avatar: avatar || undefined,
                teamId: (role === UserRole.COACH || role === UserRole.PLAYER || role === UserRole.FAN) && selectedTeamId ? selectedTeamId : null
            };

            onRegister(newUser);
            onLogin(newUser);
        } else {
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                onLogin(user);
            } else {
                setError("Email ou senha incorretos.");
            }
        }
    };

    const needsTeamSelection = role === UserRole.COACH || role === UserRole.PLAYER || role === UserRole.FAN;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 z-0"></div>
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>

            <div className="max-w-4xl w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 animate-in zoom-in-95 duration-500">
                <div className="md:w-1/2 p-12 text-white flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-emerald-600/80 to-teal-800/80 backdrop-blur-md">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner border border-white/20">
                                <Trophy size={36} className="text-white drop-shadow-md icon-hover" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight drop-shadow-lg">Clube<span className="text-emerald-200">DoContra</span></h1>
                        </div>
                        <p className="text-emerald-50 text-lg leading-relaxed mb-8 font-light">
                            Eleve o nível do seu jogo. A plataforma definitiva para gestão esportiva.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-emerald-600 bg-slate-200 shadow-md">
                                    <img src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="" className="w-full h-full rounded-full" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-emerald-600 bg-white flex items-center justify-center text-xs font-bold text-emerald-800 shadow-md">+10k</div>
                        </div>
                        <p className="text-sm text-emerald-100/80 font-medium">Junte-se a milhares de atletas e diretores.</p>
                    </div>
                </div>

                <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white/90 backdrop-blur-xl relative">
                    <div className="max-w-sm w-full mx-auto">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">
                            {isRegistering ? 'Criar Conta' : 'Bem-vindo'}
                        </h2>
                        <p className="text-slate-500 mb-8 text-sm">
                            {isRegistering ? 'Preencha seus dados para começar.' : 'Entre com suas credenciais para continuar.'}
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50/80 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-3 backdrop-blur-sm animate-pulse">
                                <AlertTriangle size={18} /> {error}
                            </div>
                        )}

                        {pendingInviteTeamId && (
                            <div className="mb-6 p-4 bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-3 backdrop-blur-sm">
                                <UserPlus size={18} className="text-emerald-600" />
                                <div>
                                    <strong>Convite Especial!</strong>
                                    <p>Você está sendo convidado para entrar no time <u>{teams.find(t => t.id === pendingInviteTeamId)?.name || '...'}</u>.</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isRegistering && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nome Completo</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-3 text-slate-400 group-hover:text-emerald-500 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm shadow-inner input-focus-effect"
                                            placeholder="Seu nome"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 text-slate-400 group-hover:text-emerald-500 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm shadow-inner input-focus-effect"
                                        placeholder="seu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Senha</label>
                                <div className="relative group">
                                    <Key className="absolute left-3 top-3 text-slate-400 group-hover:text-emerald-500 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm shadow-inner input-focus-effect"
                                        placeholder="******"
                                        required
                                    />
                                </div>
                            </div>

                            {isRegistering && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Sua Cidade</label>
                                        <div className="relative group p-1 bg-slate-50 border border-slate-200 rounded-xl">
                                            <CitySelect value={location} onChange={setLocation} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Avatar (Foto)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const url = await uploadImage(file);
                                                    if (url) setAvatar(url);
                                                }
                                            }}
                                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Tipo de Conta</label>
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as UserRole)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm cursor-pointer input-focus-effect"
                                        >
                                            <option value={UserRole.FAN}>Torcedor</option>
                                            <option value={UserRole.PLAYER}>Jogador</option>
                                            <option value={UserRole.COACH}>Técnico</option>
                                            <option value={UserRole.DIRECTOR}>Diretor Esportivo</option>
                                            <option value={UserRole.REFEREE}>Árbitro</option>
                                        </select>
                                        {role === UserRole.DIRECTOR && (
                                            <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-start gap-2">
                                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                                <span>Apenas Diretores podem criar novos times. Jogadores devem se juntar a times existentes.</span>
                                            </div>
                                        )}
                                    </div>

                                    {needsTeamSelection && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                                                {role === UserRole.FAN ? 'Time do Coração' : 'Time'}
                                            </label>
                                            <select
                                                value={selectedTeamId}
                                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                                disabled={!!pendingInviteTeamId} // Lock selection if invited
                                                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm cursor-pointer input-focus-effect ${pendingInviteTeamId ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : ''}`}
                                            >
                                                <option value="">Selecione um time...</option>
                                                {teams.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            <button
                                type="submit"
                                className="btn-feedback w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 mt-6 tracking-wide text-sm uppercase"
                            >
                                {isRegistering ? 'Cadastrar' : 'Entrar'}
                            </button>

                            <div className="flex items-center gap-4 py-4">
                                <div className="h-px bg-slate-200 flex-1"></div>
                                <span className="text-xs text-slate-400 font-medium">OU</span>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    const { error } = await import('../supabaseClient').then(m => m.supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: {
                                            redirectTo: window.location.origin
                                        }
                                    }));
                                    if (error) setError(error.message);
                                }}
                                className="btn-feedback w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl shadow-sm hover:bg-slate-50 flex items-center justify-center gap-3 transition"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continuar com Google
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-xs text-slate-400 mb-2">
                                {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                            </p>
                            <button
                                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                                className="text-emerald-600 font-bold text-sm hover:text-emerald-700 transition btn-feedback"
                            >
                                {isRegistering ? 'Fazer Login' : 'Criar Conta Grátis'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
