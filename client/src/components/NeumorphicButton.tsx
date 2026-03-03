import React, { useState } from 'react';
import './NeumorphicButton.css';

interface NeumorphicButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: 'blue' | 'pink';
  style?: React.CSSProperties;
}

export const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({
  children,
  onClick,
  accent = 'blue',
  style,
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      className={`neumorphic-btn accent-${accent} ${pressed ? 'pressed' : ''}`}
      style={style}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
    >
      <span className="neon-text">{children}</span>
    </button>
  );
};
