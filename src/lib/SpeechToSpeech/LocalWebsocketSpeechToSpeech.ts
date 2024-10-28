import { ISpeechToSpeech, SessionOptions } from './ISpeechToSpeech';

export class LocalWebsocketSpeechToSpeech implements ISpeechToSpeech {
  private ws: WebSocket | null = null;
  private userSpeechStartCallback: (() => void) | null = null;
  private userSpeechEndCallback: (() => void) | null = null;
  private userSpeechTranscriptCallback: ((transcript: string) => void) | null = null;
  private assistantMessageCallback: ((assistantMessageContent: string) => void) | null = null;
  private assistantSpeechCallback: ((assistantSpeechAudioData: Blob) => void) | null = null;
  private audioBuffer: Float32Array = new Float32Array(0);

  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private audioContext: AudioContext | null = null;
  private isVoiceOn: boolean = false;

  constructor() {}

  async start(isVoiceOn: boolean, sessionOptions: SessionOptions) {
    this.isVoiceOn = isVoiceOn;
    await this.startStream(sessionOptions);
  }

  private async startStream(sessionOptions: SessionOptions) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('WebSocket接続を開始します');
      const localUrl = "ws://localhost:8000/ws";
      this.ws = new WebSocket(localUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('WebSocket接続が確立しました');
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            event: 'startSession',
            sttModelId: sessionOptions.sttModelId,
            llmModelId: sessionOptions.llmModelId,
            ttsModelId: sessionOptions.ttsModelId,
            messages: sessionOptions.messages,
          }));
        }
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === "userSpeechStart" && this.userSpeechStartCallback) {
          this.userSpeechStartCallback();
        } else if (data.event === "userSpeechEnd" && this.userSpeechEndCallback) {
          this.userSpeechEndCallback();
        } else if (data.event === "userSpeechTranscript" && this.userSpeechTranscriptCallback) {
          this.userSpeechTranscriptCallback(data.transcript);
        } else if (data.event === "assistantMessageGenerated" && this.assistantMessageCallback) {
          this.assistantMessageCallback(data.generatedMessageContent);
        } else if (data.event === "assistantSpeechGenerated" && this.assistantSpeechCallback) {
          const audioData = new Uint8Array(data.audioData);
          const audioBlob = new Blob([audioData], { type: 'audio/wav' });
          this.assistantSpeechCallback(audioBlob);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket接続が閉じられました');
      };

      this.ws.onerror = (error) => {
        console.error('WebSocketエラー:', error);
      };


      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(256, 1, 1);

      if (this.isVoiceOn) {
        this.connectAudioNodes();
      }

      this.processor.onaudioprocess = (event) => {
        if (!this.isVoiceOn) return;

        const inputData = event.inputBuffer.getChannelData(0);

        const newBuffer = new Float32Array(this.audioBuffer.length + inputData.length);
        newBuffer.set(this.audioBuffer);
        newBuffer.set(inputData, this.audioBuffer.length);
        this.audioBuffer = newBuffer;

        const samplesPerChunk = 640;

        while (this.audioBuffer.length >= samplesPerChunk) {
          const chunk = this.audioBuffer.slice(0, samplesPerChunk);
          const buffer = this.encodePCM(chunk);
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(buffer);
          }
          this.audioBuffer = this.audioBuffer.slice(samplesPerChunk);
        }
      };



    } catch (err) {
      console.error('マイクへのアクセスに失敗しました', err);
    }
  }

  private connectAudioNodes() {
    if (this.source && this.processor && this.audioContext) {
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    }
  }

  private disconnectAudioNodes() {
    if (this.source && this.processor && this.audioContext) {
      this.source.disconnect(this.processor);
      this.processor.disconnect(this.audioContext.destination);
    }
  }

  private encodePCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(i * 2, s, true);
    }
    return buffer;
  }

  stop() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }


  voiceOn() {
    if (!this.isVoiceOn) {
      this.isVoiceOn = true;
      this.connectAudioNodes();
    }
  }

  voiceOff() {
    if (this.isVoiceOn) {
      this.isVoiceOn = false;
      this.disconnectAudioNodes();
    }
  }

  onUserSpeechStart(callback: () => void) {
    this.userSpeechStartCallback = callback;
  }

  onUserSpeechEnd(callback: () => void) {
    this.userSpeechEndCallback = callback;
  }

  onUserSpeechTranscript(callback: (transcript: string) => void) {
    this.userSpeechTranscriptCallback = callback;
  }

  onAssistantMessage(callback: (generatedMessageContent: string) => void) {
    this.assistantMessageCallback = callback;
  }

  onAssistantSpeech(callback: (audioData: Blob) => void) {
    this.assistantSpeechCallback = callback;
  }

  handleUserMessage(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event: 'userMessage', message }));
    }
  }
}