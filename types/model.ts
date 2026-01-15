export type ModelMode = 
  | 'chat' 
  | 'responses'
  | 'image_generation' 
  | 'audio_transcription' 
  | 'embedding' 
  | 'rerank' 
  | 'video_generation' 
  | 'ocr'
  | 'audio_generation'
  | 'voice'
  | 'completion'
  | 'audio_speech';

export interface ModelData {
  input_cost_per_token?: number;
  output_cost_per_token?: number;
  input_cost_per_image?: number;
  output_cost_per_image?: number;
  input_cost_per_second?: number;
  output_cost_per_second?: number;
  ocr_cost_per_page?: number;
  max_input_tokens?: number;
  max_output_tokens?: number;
  max_tokens?: number;
  max_query_tokens?: number;
  mode: ModelMode;
  provider: string;
  supports_function_calling?: boolean;
  supports_tool_choice?: boolean;
  supports_vision?: boolean;
  supports_audio_input?: boolean;
  supports_audio_output?: boolean;
  supports_reasoning?: boolean;
  supports_web_search?: boolean;
  supports_response_schema?: boolean;
  supports_parallel_function_calling?: boolean;
  supports_prompt_caching?: boolean;
  supports_system_messages?: boolean;
  source?: string;
  deprecation_date?: string;
  supported_endpoints?: string[];
  supported_modalities?: string[];
  supported_output_modalities?: string[];
  modes?: string[];
  supported_modes?: string[];
}

export interface ModelEntry {
  [modelId: string]: ModelData;
}

export interface ProcessedModel {
  id: string;
  name: string;
  provider: string;
  data: ModelData;
  slug: string;
  displayName: string;
}

