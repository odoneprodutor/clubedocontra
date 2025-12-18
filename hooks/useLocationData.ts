import { useState, useEffect } from 'react';

export const useLocationData = () => {
    const [states, setStates] = useState<{ id: number; sigla: string; nome: string }[]>([]);
    const [cities, setCities] = useState<{ id: number; nome: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(res => res.json())
            .then(data => setStates(data))
            .catch(err => console.error("Error loading states:", err));
    }, []);

    const loadCities = (stateSigla: string) => {
        if (!stateSigla) {
            setCities([]);
            return;
        }
        setLoading(true);
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateSigla}/municipios?orderBy=nome`)
            .then(res => res.json())
            .then(data => {
                setCities(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading cities:", err);
                setLoading(false);
            });
    };

    return { states, cities, loading, loadCities };
};
