import { supabase } from '../supabaseClient';

/**
 * Generates a standard UUID with fallback for environments where crypto.randomUUID is unavailable.
 */
export const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 */
export const uploadImage = async (file: File): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        // Note: alert() will be replaced in a future task
        alert('Erro ao fazer upload da imagem. Tente novamente.');
        return null;
    }
};

/**
 * Extracts Youtube ID from URL.
 */
export const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};
