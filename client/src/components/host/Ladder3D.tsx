import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Stars, Sparkles, Float, Environment, PerspectiveCamera } from '@react-three/drei';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

const MILESTONES = [
    "Basement Dweller",
    "Local Legend",
    "Hometown Hero",
    "Regional Boss",
    "Major City Mention",
    "National News",
    "Global Icon",
    "Ascended Immortal"
];

function CameraFollowBox({ targetStep }: { targetStep: number }) {
    const targetPos = useMemo(() => new THREE.Vector3(), []);
    const lookAtPos = useMemo(() => new THREE.Vector3(), []);

    useFrame((state) => {
        // Step positions are y: i*2, z: -i*3
        const targetY = targetStep * 2 + 2;
        const targetZ = -targetStep * 3;

        // Camera trails behind and slightly above the target
        targetPos.set(4, targetY + 3, targetZ + 8);
        lookAtPos.set(0, targetY, targetZ - 2);

        state.camera.position.lerp(targetPos, 0.05);
        state.camera.lookAt(lookAtPos);
    });

    return null;
}

function PlayerAvatar({ currentStep }: { currentStep: number }) {
    const ref = useRef<THREE.Mesh>(null);
    const targetPos = useMemo(() => new THREE.Vector3(), []);

    useFrame(() => {
        if (!ref.current) return;
        const targetY = currentStep * 2 + 1; // +1 to sit on top of step
        const targetZ = -currentStep * 3;
        targetPos.set(0, targetY, targetZ);

        // Smooth hop animation
        ref.current.position.lerp(targetPos, 0.1);

        // Rotate slowly
        ref.current.rotation.y += 0.02;
        ref.current.rotation.x += 0.01;
    });

    return (
        <mesh ref={ref} position={[0, 1, 0]}>
            <octahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color="#00f6ff" emissive="#00f6ff" emissiveIntensity={2} roughness={0.2} metalness={0.8} />
            <pointLight distance={10} intensity={2} color="#00f6ff" />
        </mesh>
    );
}

function LadderSteps({ maxSteps, currentStep }: { maxSteps: number; currentStep: number }) {
    const steps: React.ReactNode[] = [];
    for (let i = 0; i < maxSteps; i++) {
        const isCurrentOrPassed = i <= currentStep;
        const milestoneKey = Math.floor((i / maxSteps) * (MILESTONES.length - 1));
        const milestoneText = i === 0 || i === maxSteps - 1 || i % 3 === 0 ? MILESTONES[milestoneKey] : "";

        steps.push(
            <group key={i} position={[0, i * 2, -i * 3]}>
                <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                    <mesh receiveShadow castShadow>
                        <boxGeometry args={[4, 0.4, 2]} />
                        <meshStandardMaterial
                            color={isCurrentOrPassed ? "#ff00c8" : "#4b5563"}
                            emissive={isCurrentOrPassed ? "#ff00c8" : "#000000"}
                            emissiveIntensity={isCurrentOrPassed ? 0.5 : 0}
                            roughness={0.4}
                            metalness={0.5}
                        />
                    </mesh>
                </Float>

                {milestoneText && (
                    <Text
                        position={[3, 1, 0]}
                        rotation={[0, -0.3, 0]}
                        fontSize={0.8}
                        color={isCurrentOrPassed ? "#ffffff" : "#9ca3af"}
                        anchorX="left"
                        anchorY="middle"
                        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
                    >
                        {milestoneText}
                    </Text>
                )}
            </group>
        );
    }
    return <>{steps}</>;
}

export interface Ladder3DProps {
    currentStep: number;
    maxSteps?: number;
}

export default function Ladder3D({ currentStep, maxSteps = 15 }: Ladder3DProps) {
    return (
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-900 via-indigo-950 to-purple-900 overflow-hidden">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[5, 5, 10]} fov={60} />
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={1.5}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />

                {/* Heavenly environment details */}
                <Stars radius={100} depth={50} count={3000} factor={6} saturation={1} fade speed={1} />
                <Sparkles count={200} scale={30} size={4} speed={0.4} opacity={0.3} color="#ffe4e1" />

                <fog attach="fog" args={['#1e1b4b', 10, 50]} />

                <CameraFollowBox targetStep={currentStep} />
                <LadderSteps maxSteps={maxSteps} currentStep={currentStep} />
                <PlayerAvatar currentStep={currentStep} />

                <Environment preset="sunset" />
            </Canvas>
        </div>
    );
}
