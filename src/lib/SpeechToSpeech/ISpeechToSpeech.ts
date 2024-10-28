import { Message } from "@/features/messages/messages";

export interface SessionOptions {
  messages: Message[],
  sttModelId: string,
  llmModelId: string,
  ttsModelId: string,
}

export interface ISpeechToSpeech {
  start(isVoiceOn: boolean, sessionOptions: SessionOptions): void;
  stop(): void;
  voiceOn(): void;
  voiceOff(): void;
  handleUserMessage(message: string): void;
  onUserSpeechStart(callback: () => void): void;
  onUserSpeechEnd(callback: () => void): void;
  onUserSpeechTranscript(callback: (transcript: string) => void): void;
  onAssistantMessage(callback: (generatedMessageContent: string) => void): void;
  onAssistantSpeech(callback: (generatedSpeechAudioData: Blob) => void): void;
}