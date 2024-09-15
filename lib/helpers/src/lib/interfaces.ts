export interface IAuth {
  message: string;
  address: string;
  publicKey: string;
  signature: string;
}

export interface IJwt {
  authToken: string;
}

export interface IChatHistory {
  role: string;
  content: string;
}

export interface IChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface IChat {
  id: string;
  model: string;
  system_fingerprint: string;
  message_history: IChatHistory[];
  usage: IChatUsage;
}
