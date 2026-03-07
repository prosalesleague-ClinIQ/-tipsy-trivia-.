import { motion } from 'framer-motion';

interface DPadControllerProps {
    onMove: (dx: number, dy: number) => void;
    onSelect: () => void;
    label?: string;
}

export default function DPadController({ onMove, onSelect, label }: DPadControllerProps) {
    const handleUp = () => onMove(0, -1);
    const handleDown = () => onMove(0, 1);
    const handleLeft = () => onMove(-1, 0);
    const handleRight = () => onMove(1, 0);

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full h-full">
            {label && (
                <p className="text-white/50 text-center mb-12 font-body text-xl tracking-widest uppercase">
                    {label}
                </p>
            )}

            <div className="relative w-72 h-72">
                {/* Center Button */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 shadow-xl flex items-center justify-center text-white/80 font-bold z-10"
                    onClick={onSelect}
                    onPointerDown={(e) => { e.currentTarget.click(); }}
                >
                    OK
                </motion.button>

                {/* Up */}
                <motion.button
                    whileTap={{ scale: 0.95, y: 5 }}
                    className="absolute top-0 left-0 right-0 mx-auto w-20 h-24 bg-slate-700 rounded-t-2xl border-t-4 border-slate-600 shadow-md flex items-start justify-center pt-4 text-white hover:bg-slate-600"
                    onClick={handleUp}
                    onPointerDown={(e) => { e.currentTarget.click(); }}
                >
                    <span className="text-2xl mt-1">▲</span>
                </motion.button>

                {/* Down */}
                <motion.button
                    whileTap={{ scale: 0.95, y: -5 }}
                    className="absolute bottom-0 left-0 right-0 mx-auto w-20 h-24 bg-slate-700 rounded-b-2xl border-b-4 border-slate-600 shadow-md flex items-end justify-center pb-4 text-white hover:bg-slate-600"
                    onClick={handleDown}
                    onPointerDown={(e) => { e.currentTarget.click(); }}
                >
                    <span className="text-2xl mb-1">▼</span>
                </motion.button>

                {/* Left */}
                <motion.button
                    whileTap={{ scale: 0.95, x: 5 }}
                    className="absolute left-0 top-0 bottom-0 my-auto w-24 h-20 bg-slate-700 rounded-l-2xl border-l-4 border-slate-600 shadow-md flex items-center justify-start pl-4 text-white hover:bg-slate-600"
                    onClick={handleLeft}
                    onPointerDown={(e) => { e.currentTarget.click(); }}
                >
                    <span className="text-2xl ml-1">◀</span>
                </motion.button>

                {/* Right */}
                <motion.button
                    whileTap={{ scale: 0.95, x: -5 }}
                    className="absolute right-0 top-0 bottom-0 my-auto w-24 h-20 bg-slate-700 rounded-r-2xl border-r-4 border-slate-600 shadow-md flex items-center justify-end pr-4 text-white hover:bg-slate-600"
                    onClick={handleRight}
                    onPointerDown={(e) => { e.currentTarget.click(); }}
                >
                    <span className="text-2xl mr-1">▶</span>
                </motion.button>
            </div>
        </div>
    );
}
