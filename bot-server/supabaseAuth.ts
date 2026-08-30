import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL ou Service Role Key não configurados.');
    }
    return createClient(supabaseUrl, supabaseKey);
};

export const useSupabaseAuthState = async (sessionId: string) => {
    const supabase = getSupabase();

    const readSessionData = async (type: string, id: string) => {
        const { data, error } = await supabase
            .from('whatsapp_sessions')
            .select('data')
            .eq('session_id', sessionId)
            .eq('type', type)
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao ler do Supabase:', error.message);
        }

        if (data && data.data) {
            return JSON.parse(data.data, BufferJSON.reviver);
        }
        return null;
    };

    const writeSessionData = async (type: string, id: string, value: any) => {
        const valueStr = JSON.stringify(value, BufferJSON.replacer);
        const { error } = await supabase
            .from('whatsapp_sessions')
            .upsert({
                session_id: sessionId,
                type: type,
                id: id,
                data: valueStr
            }, { onConflict: 'session_id,type,id' });

        if (error) {
            console.error('Erro ao salvar no Supabase:', error.message);
        }
    };

    const removeSessionData = async (type: string, id: string) => {
        const { error } = await supabase
            .from('whatsapp_sessions')
            .delete()
            .eq('session_id', sessionId)
            .eq('type', type)
            .eq('id', id);

        if (error) {
            console.error('Erro ao remover no Supabase:', error.message);
        }
    };

    let creds = await readSessionData('creds', 'creds');
    if (!creds) {
        creds = initAuthCreds();
        await writeSessionData('creds', 'creds', creds);
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type: string, ids: string[]) => {
                    const data: { [key: string]: any } = {};
                    await Promise.all(
                        ids.map(async id => {
                            let value = await readSessionData(type, id);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data: any) => {
                    const tasks: Promise<void>[] = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            if (value) {
                                tasks.push(writeSessionData(category, id, value));
                            } else {
                                tasks.push(removeSessionData(category, id));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeSessionData('creds', 'creds', creds)
    };
};
