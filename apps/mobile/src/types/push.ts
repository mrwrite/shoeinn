export interface PushRegisterRequest {
  token: string;
  platform?: "ios" | "android";
}

export interface PushUnregisterRequest {
  token: string;
}

