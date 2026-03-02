import { useGameState } from '../../state/GameStateContext';

export default function HostJeopardyBoard() {
    const { state } = useGameState();
    const { room } = state;
    const board = room?.jeopardy_board;

    if (!board) return (
        <div className="animated-bg min-h-screen flex items-center justify-center">
            <div className="glass p-8 text-center text-white/40">Loading Jeopardy Board…</div>
        </div>
    );

    const categories = board.map(col => col[0]?.category ?? '');

    return (
        <div className="animated-bg min-h-screen p-6 flex flex-col">
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
                        return (
                            <div
                                key={`${colIdx}-${row}`}
                                className={`jeopardy-cell text-2xl font-display font-bold h-20 ${cell.answered ? 'used' : ''} ${cell.daily_double ? 'border-brand-gold' : ''}`}
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
