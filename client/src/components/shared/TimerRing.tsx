interface Props {
    total: number;
    current: number;
    size?: number;
}

export default function TimerRing({ total, current, size = 100 }: Props) {
    const radius = (size / 2) - 8;
    const circumference = 2 * Math.PI * radius;
    const fraction = Math.min(1, Math.max(0, current / total));
    const offset = circumference * (1 - fraction);

    const strokeColor = fraction > 0.5 ? '#7C3AED' : fraction > 0.25 ? '#F59E0B' : '#EF4444';

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={6} />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s' }}
                />
            </svg>
            <span className="font-display font-black text-2xl" style={{ color: strokeColor }}>
                {Math.ceil(current)}s
            </span>
        </div>
    );
}
