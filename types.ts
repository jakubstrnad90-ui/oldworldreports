
export enum UnitStatus {
  READY = 'Ready',
  ENGAGED = 'Engaged',
  WIPED_OUT = 'Wiped Out',
  PSYCHOLOGICAL_SHOCK = 'Psychological Shock',
}

export interface UnitStats {
  M: string | number;
  WS: string | number;
  BS: string | number;
  S: string | number;
  T: string | number;
  W: string | number;
  I: string | number;
  A: string | number;
  Ld: string | number;
}

export interface ArmyUnit {
  name_en: string;
  points: number;
  strength?: number;
  status?: UnitStatus;
  stats?: UnitStats;
  special_rules?: { name_en: string }[];
  equipment?: { name_en: string }[];
  type?: string;
  size?: string;
  [key: string]: any;
}

export interface Army {
  name: string;
  points: number;
  army: string;
  characters: ArmyUnit[];
  core: ArmyUnit[];
  special: ArmyUnit[];
  rare: ArmyUnit[];
}

export interface PlayerState {
  army: Army | null;
  victoryPoints: number;
}

export enum GamePhase {
  START_OF_TURN = 'Start of Turn',
  STRATEGY = 'Strategy Phase',
  MOVEMENT = 'Movement Phase',
  SHOOTING = 'Shooting Phase',
  COMBAT = 'Combat Phase',
}

export interface UnitReference {
  playerId: 'player1' | 'player2';
  unitType: 'characters' | 'core' | 'special' | 'rare';
  unitIndex: number;
  unitName: string;
}

export interface BattleEvent {
  id: string;
  turn: number;
  playerId: 'player1' | 'player2';
  phase: GamePhase;
  description: string;
  actingUnit?: UnitReference;
  targetUnit?: UnitReference;
}

export interface GameState {
  player1: PlayerState;
  player2: PlayerState;
  battleLog: BattleEvent[];
  currentTurn: number;
  turnPhotos: Record<number, string>; // turn number -> base64 data URL
}

export enum GeminiRequestType {
  BATTLE_REPORT = 'BATTLE_REPORT',
  GENERAL_STORY = 'GENERAL_STORY',
  RULES_QUERY = 'RULES_QUERY',
}