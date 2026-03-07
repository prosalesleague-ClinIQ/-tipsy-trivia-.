import { useGameState } from '../../state/GameStateContext';
import { useSocket } from '../../socket/SocketProvider';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function HostJeopardyBoard() {
    const { state } = useGameState();
    const { socket } = useSocket();
    const { room } = state;
    const board = room?.jeopardy_board;
    const [cursor, setCursor] = useState({ col: 0, row: 0 });

    useEffect(() => {
        if (!socket) return;

        const handleCursor = (data: { x: number; y: number }) => {
            setCursor({ col: data.x, row: data.y });
        };

        socket.on('jeopardy:cursor', handleCursor);
        return () => {
            socket.off('jeopardy:cursor', handleCursor);
        };
    }, [socket]);

    if (!board) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="glass p-8 text-center text-white/40">Loading Jeopardy Board…</div>
        </div>
    );

    const categories = board.map(col => col[0]?.category ?? '');

    return (
        <div className="min-h-screen p-6 flex flex-col">
            <h1 className="font-display font-black text-4xl gradient-text text-center mb-6">
                {room?.jeopardy_controller_id
                    ? `${Object.values(room.players).find(p => p.id === room.jeopardy_controller_id)?.name ?? 'Player'}'s Turn`
                    : 'Pick a Category'}
            </h1>

            <div className="flex-1 grid gap-3" style={{ gridTemplateColumns: `repeat(${board.length}, 1fr)` }}>
                {/* Headers */}
                {categories.map((cat, i) => (
                    <div key={i} className="glass p-3 text-center font-display font-bold text-sm text-brand-gold">
                        {cat}
                    </div>
                ))}

                {/* Cells: 5 rows × N columns */}
                {[0, 1, 2, 3, 4].map(row => (
                    board.map((col, colIdx) => {
                        const cell = col[row];
                        if (!cell) return <div key={`${colIdx}-${row}`} />;
                        const isSelected = cursor.col === colIdx && cursor.row === row;

                        return (
                            <div
                                key={`${colIdx}-${row}`}
                                className={`jeopardy-cell relative text-2xl font-display font-bold h-20 ${cell.answered ? 'used' : ''
                                    } ${cell.daily_double ? 'border-brand-gold' : ''} ${isSelected && !cell.answered ? 'ring-4 ring-brand-purple drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] z-10' : ''
                                    }`}
                            >
                                {cell.answered ? '' : `$${cell.value}`}
                                {cell.daily_double && !cell.answered && <span className="ml-1 text-xs text-brand-gold">⭐</span>}
                            </div>
                        );
                    })
                ))}
            </div>
        </div>
    );
}
