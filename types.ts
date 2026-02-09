export enum AppMode {
  LANDING = 'LANDING',
  RED_CARPET = 'RED_CARPET',
  BRAND_INTERACTION = 'BRAND_INTERACTION'
}

export enum ProcessingState {
  IDLE = 'IDLE',
  SEARCHING_LOGO = 'SEARCHING_LOGO',
  ANALYZING_SCENE = 'ANALYZING_SCENE',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface RedCarpetState {
  userImage: File | null;
  resultImage: string | null;
}

export interface BrandState {
  productType: 'perfume' | 'watch';
  userPoseImage: string | null; // Base64
  resultImage: string | null;
}

export interface LogoSearchResult {
  uri: string;
  title: string;
}

// Internal representation of the JSON task requested by the prompt
export interface TaskPayload {
  request_id: string;
  engine: string;
  task: string;
  [key: string]: any;
}