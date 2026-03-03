import { createContext, useContext, useReducer, type ReactNode, useEffect } from 'react';
import type { Room, Player, Question, ScoreEntry, HostScript } from '@tipsy-trivia/shared';
import type {
    QuestionShowPayload, AnswerRevealPayload, BuzzerLockPayload,
    GameEndPayload, RoomJoinedPayload,
    MovieQuestionStartPayload, MovieStageAdvancePayload,
    MovieAnswerResultPayload, MovieRevealPayload,
} from '@tipsy-trivia/shared';
import { useSocket } from '../socket/SocketProvider';

export interface GameState {
    room: Room | null;
    myPlayer: Player | null;
    mySessionToken: string | null;
    isHost: boolean;
    currentQuestion: Question | null;
    lastReveal: AnswerRevealPayload | null;
    scores: ScoreEntry[];
    hostScript: HostScript | null;
    buzzerWinner: BuzzerLockPayload | null;
    gameEnd: GameEndPayload | null;
    serverTime: number;
    buzzerMode: boolean;
    connectionStatus: 'connecting' | 'connected' | 'disconnected';
    // Movie Ladder state
    movieQuestion: MovieQuestionStartPayload | null;
    movieStageUpdate: MovieStageAdvancePayload | null;
    movieAnswerResult: MovieAnswerResultPayload | null;
    movieReveal: MovieRevealPayload | null;
}

type Action =
    | { type: 'ROOM_JOINED'; payload: RoomJoinedPayload & { isHost: boolean } }
    | { type: 'ROOM_UPDATED'; payload: { room: Room } }
    | { type: 'QUESTION_SHOW'; payload: QuestionShowPayload }
    | { type: 'ANSWER_REVEAL'; payload: AnswerRevealPayload }
    | { type: 'BUZZER_LOCK'; payload: BuzzerLockPayload }
    | { type: 'SCOREBOARD_UPDATE'; payload: { scores: ScoreEntry[] } }
    | { type: 'HOST_SCRIPT'; payload: { script: HostScript } }
    | { type: 'GAME_END'; payload: GameEndPayload }
    | { type: 'CONNECTION_STATUS'; payload: 'connecting' | 'connected' | 'disconnected' }
    | { type: 'MOVIE_QUESTION_START'; payload: MovieQuestionStartPayload }
    | { type: 'MOVIE_STAGE_ADVANCE'; payload: MovieStageAdvancePayload }
    | { type: 'MOVIE_ANSWER_RESULT'; payload: MovieAnswerResultPayload }
    | { type: 'MOVIE_REVEAL'; payload: MovieRevealPayload }
    | { type: 'RESET' };

const initialState: GameState = {
    room: null,
    myPlayer: null,
    mySessionToken: null,
    isHost: false,
    currentQuestion: null,
    lastReveal: null,
    scores: [],
    hostScript: null,
    buzzerWinner: null,
    gameEnd: null,
    serverTime: 0,
    buzzerMode: false,
    connectionStatus: 'connecting',
    movieQuestion: null,
    movieStageUpdate: null,
    movieAnswerResult: null,
    movieReveal: null,
};

function reducer(state: GameState, action: Action): GameState {
    switch (action.type) {
        case 'ROOM_JOINED':
            return {
                ...state,
                room: action.payload.room,
                myPlayer: action.payload.your_player,
                mySessionToken: action.payload.session_token,
                isHost: action.payload.isHost,
            };
        case 'ROOM_UPDATED':
            return { ...state, room: action.payload.room };
        case 'QUESTION_SHOW':
            return {
                ...state,
                currentQuestion: action.payload.question,
                serverTime: action.payload.server_time,
                buzzerMode: action.payload.buzzer_mode,
                lastReveal: null,
                buzzerWinner: null,
                gameEnd: null,
            };
        case 'ANSWER_REVEAL':
            return { ...state, lastReveal: action.payload, scores: action.payload.scores };
        case 'BUZZER_LOCK':
            return { ...state, buzzerWinner: action.payload };
        case 'SCOREBOARD_UPDATE':
            return { ...state, scores: action.payload.scores };
        case 'HOST_SCRIPT':
            return { ...state, hostScript: action.payload.script };
        case 'GAME_END':
            return { ...state, gameEnd: action.payload, scores: action.payload.scores };
        case 'CONNECTION_STATUS':
            return { ...state, connectionStatus: action.payload };
        case 'MOVIE_QUESTION_START':
            return {
                ...state,
                movieQuestion: action.payload,
                movieStageUpdate: null,
                movieAnswerResult: null,
                movieReveal: null,
            };
        case 'MOVIE_STAGE_ADVANCE':
            return { ...state, movieStageUpdate: action.payload };
        case 'MOVIE_ANSWER_RESULT':
            return { ...state, movieAnswerResult: action.payload };
        case 'MOVIE_REVEAL':
            return { ...state, movieReveal: action.payload, scores: action.payload.scores };
        case 'RESET':
            return { ...initialState };
        default:
            return state;
    }
}

const GameStateContext = createContext<{
    state: GameState;
    dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => { } });

export function GameStateProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { socket, connected } = useSocket();

    useEffect(() => {
        dispatch({ type: 'CONNECTION_STATUS', payload: connected ? 'connected' : 'disconnected' });
    }, [connected]);

    useEffect(() => {
        if (!socket) return;

        socket.on('room:updated', (data) => dispatch({ type: 'ROOM_UPDATED', payload: data }));
        socket.on('question:show', (data) => dispatch({ type: 'QUESTION_SHOW', payload: data }));
        socket.on('answer:reveal', (data) => dispatch({ type: 'ANSWER_REVEAL', payload: data }));
        socket.on('buzzer:lock', (data) => dispatch({ type: 'BUZZER_LOCK', payload: data }));
        socket.on('scoreboard:update', (data) => dispatch({ type: 'SCOREBOARD_UPDATE', payload: data }));
        socket.on('host:script', (data) => dispatch({ type: 'HOST_SCRIPT', payload: data }));
        socket.on('game:end', (data) => dispatch({ type: 'GAME_END', payload: data }));
        socket.on('movie:question_start', (data) => dispatch({ type: 'MOVIE_QUESTION_START', payload: data }));
        socket.on('movie:stage_advance', (data) => dispatch({ type: 'MOVIE_STAGE_ADVANCE', payload: data }));
        socket.on('movie:answer_result', (data) => dispatch({ type: 'MOVIE_ANSWER_RESULT', payload: data }));
        socket.on('movie:reveal', (data) => dispatch({ type: 'MOVIE_REVEAL', payload: data }));

        return () => {
            socket.off('room:updated');
            socket.off('question:show');
            socket.off('answer:reveal');
            socket.off('buzzer:lock');
            socket.off('scoreboard:update');
            socket.off('host:script');
            socket.off('game:end');
            socket.off('movie:question_start');
            socket.off('movie:stage_advance');
            socket.off('movie:answer_result');
            socket.off('movie:reveal');
        };
    }, [socket]);

    return (
        <GameStateContext.Provider value={{ state, dispatch }}>
            {children}
        </GameStateContext.Provider>
    );
}

export function useGameState() {
    return useContext(GameStateContext);
}
