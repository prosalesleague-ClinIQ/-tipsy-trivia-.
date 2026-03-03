import { useState, useEffect } from 'react';
import { Shield, Upload, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PackStats {
    id: string;
    name: string;
    version: string;
    question_count: number;
}

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [authed, setAuthed] = useState(false);
    const [error, setError] = useState('');
    const [packs, setPacks] = useState<PackStats[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<{ status: 'idle' | 'uploading' | 'success' | 'error', msg: string }>({ status: 'idle', msg: '' });

    const apiUrl = import.meta.env.VITE_SERVER_URL ? `${import.meta.env.VITE_SERVER_URL}/admin` : '/admin';

    const login = async () => {
        try {
            const res = await fetch(`${apiUrl}/packs`, { headers: { 'Authorization': `Bearer ${password}` } });
            if (res.ok) {
                setAuthed(true);
                setError('');
                loadPacks();
            } else {
                setError('Invalid password');
            }
        } catch {
            setError('Connection failed');
        }
    };

    const loadPacks = async () => {
        const res = await fetch(`${apiUrl}/packs`, { headers: { 'Authorization': `Bearer ${password}` } });
        if (res.ok) {
            const data = await res.json();
            setPacks(data.packs);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploadStatus({ status: 'uploading', msg: 'Uploading...' });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${apiUrl}/import`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${password}` },
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setUploadStatus({ status: 'success', msg: `Imported ${data.imported} questions. Skipped ${data.skipped}.` });
                loadPacks();
            } else {
                setUploadStatus({ status: 'error', msg: data.error || 'Import failed' });
            }
        } catch (e) {
            setUploadStatus({ status: 'error', msg: 'Network error during upload' });
        }
        setFile(null);
    };

    if (!authed) return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #181a20 0%, #23263a 100%)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl" style={{ boxShadow: '0 8px 32px #181a20, 0 0 0 1.5px #ff00c822 inset' }}>
                <Shield className="w-12 h-12 text-brand-pink mx-auto mb-4" />
                <h1 className="font-display font-black text-3xl mb-6">Admin Panel</h1>
                <input
                    type="password"
                    className="input text-center text-xl tracking-widest mb-4"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={e => e.key === 'Enter' && login()}
                />
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <motion.button
                    className="w-full py-3 rounded-2xl font-bold text-white"
                    style={{ background: 'linear-gradient(90deg, #ff00c8, #00f6ff)', boxShadow: '0 4px 24px #ff00c855' }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    onClick={login}
                >Login</motion.button>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen p-8 text-white" style={{ background: 'linear-gradient(135deg, #181a20 0%, #23263a 100%)' }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring' }} className="flex items-center gap-3 mb-8">
                <Shield className="w-8 h-8" style={{ color: '#ff00c8', filter: 'drop-shadow(0 0 8px #ff00c8)' }} />
                <h1 className="font-display font-black text-3xl neon-text">Content Admin</h1>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pack upload */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', delay: 0.1 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
                    <h2 className="font-display font-bold text-xl">Import Pack</h2>
                    <p className="text-white/50 text-sm">Upload a JSON question pack to add or update questions.</p>
                    <input
                        type="file"
                        accept=".json"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-purple/20 file:text-brand-purple hover:file:bg-brand-purple/30"
                    />
                    <motion.button
                        className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white ${!file ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ background: 'linear-gradient(90deg, #00f6ff, #ff00c8)', boxShadow: '0 4px 24px #00f6ff55' }}
                        whileHover={file ? { scale: 1.05 } : {}}
                        whileTap={file ? { scale: 0.95 } : {}}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        onClick={handleUpload}
                        disabled={!file || uploadStatus.status === 'uploading'}
                    >
                        <Upload className="w-4 h-4" /> Upload & Parse
                    </motion.button>

                    {uploadStatus.status !== 'idle' && (
                        <div className={`p-4 rounded-xl flex items-start gap-3 mt-2 ${uploadStatus.status === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/50' :
                                uploadStatus.status === 'success' ? 'bg-green-500/20 text-green-200 border border-green-500/50' :
                                    'bg-blue-500/20 text-blue-200'
                            }`}>
                            {uploadStatus.status === 'error' ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                            <span className="text-sm font-body">{uploadStatus.msg}</span>
                        </div>
                    )}
                </motion.div>

                {/* Installed packs */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', delay: 0.2 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
                    <h2 className="font-display font-bold text-xl mb-4">Installed Packs</h2>
                    {packs.length === 0 ? (
                        <p className="text-white/40 italic text-sm">No packs found in database.</p>
                    ) : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {packs.map(p => (
                                <motion.div key={p.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring' }} className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex justify-between items-center shadow-md">
                                    <div>
                                        <h3 className="font-body font-bold text-lg text-brand-gold">{p.name}</h3>
                                        <p className="text-white/40 text-xs">ID: {p.id} • v{p.version}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-display font-black text-2xl text-white block">{p.question_count}</span>
                                        <span className="text-white/40 text-xs uppercase tracking-widest">Questions</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
