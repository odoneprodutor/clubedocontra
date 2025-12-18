import React, { useState, useEffect } from 'react';
import { useLocationData } from '../hooks/useLocationData';

interface CitySelectProps {
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
    required?: boolean;
    name?: string;
}

export const CitySelect: React.FC<CitySelectProps> = ({ value, onChange, className, required, name }) => {
    const { states, cities, loadCities, loading } = useLocationData();
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    // Parse initial value (Format: "City - UF" or just "City")
    useEffect(() => {
        if (value && value.includes(' - ')) {
            const [c, s] = value.split(' - ');
            if (s !== selectedState) {
                setSelectedState(s);
                loadCities(s);
            }
            setSelectedCity(c);
        }
    }, [value]);

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const uf = e.target.value;
        setSelectedState(uf);
        setSelectedCity('');
        if (onChange) onChange('');
        loadCities(uf);
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const city = e.target.value;
        setSelectedCity(city);
        if (onChange) {
            if (city && selectedState) {
                onChange(`${city} - ${selectedState}`);
            } else {
                onChange(city);
            }
        }
    };

    return (
        <div className={`grid grid-cols-3 gap-2 ${className}`}>
            <input type="hidden" name={name} value={selectedCity && selectedState ? `${selectedCity} - ${selectedState}` : ''} />
            <div className="col-span-1">
                <select
                    className="w-full py-3 px-0 text-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition appearance-none"
                    value={selectedState}
                    onChange={handleStateChange}
                    required={required}
                    style={{ textAlignLast: 'center' }}
                >
                    <option value="">UF</option>
                    {states.map(s => <option key={s.id} value={s.sigla}>{s.sigla}</option>)}
                </select>
            </div>
            <div className="col-span-2 relative">
                <select
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition disabled:opacity-50"
                    value={selectedCity}
                    onChange={handleCityChange}
                    required={required}
                    disabled={!selectedState || loading}
                >
                    <option value="">{loading ? 'Carregando...' : 'Cidade'}</option>
                    {cities.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
            </div>
        </div>
    );
};
