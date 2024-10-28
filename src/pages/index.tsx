import { useCallback, useContext, useEffect, useRef, useState } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
} from "@/features/messages/messages";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import { ISpeechToSpeech, SessionOptions } from "@/lib/SpeechToSpeech/ISpeechToSpeech";
import { LocalWebsocketSpeechToSpeech } from "@/lib/SpeechToSpeech/LocalWebsocketSpeechToSpeech";

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");

  const [isMicRecording, setIsMicRecording] = useState(false);
  const speechToSpeechRef = useRef<ISpeechToSpeech | null>(null);
  const [userMessage, setUserMessage] = useState("");

  useEffect(() => {
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      setSystemPrompt(params.systemPrompt ?? SYSTEM_PROMPT);
      setChatLog(params.chatLog ?? []);
    }
  }, []);

  useEffect(() => {
    process.nextTick(() =>
      window.localStorage.setItem(
        "chatVRMParams",
        JSON.stringify({ systemPrompt, chatLog })
      )
    );
  }, [systemPrompt, chatLog]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });

      setChatLog(newChatLog);
    },
    [chatLog]
  );

  const playAssistantSpeech = useCallback(
    async (audioData: Blob) => {
      const arrayBuffer = await audioData.arrayBuffer();
      viewer.model?.speakWithoutEmotion(arrayBuffer);
    },
    [viewer]
  );

  useEffect(() => {
    const speechToSpeech = new LocalWebsocketSpeechToSpeech();
    speechToSpeechRef.current = speechToSpeech;

    const sessionOptions: SessionOptions = {
      messages: chatLog,
      sttModelId: "your-stt-model-id",
      llmModelId: "your-llm-model-id",
      ttsModelId: "your-tts-model-id",
    };

    speechToSpeech.start(isMicRecording, sessionOptions);

    speechToSpeech.onUserSpeechStart(() => {
      console.log('User speech started');
    });

    speechToSpeech.onUserSpeechEnd(() => {
      console.log('User speech ended');
    });

    speechToSpeech.onUserSpeechTranscript((transcript) => {
      setUserMessage(transcript);
      setChatLog((prevChatLog) => [
        ...prevChatLog,
        { role: "user", content: transcript },
      ]);
      setChatProcessing(true);
    });

    speechToSpeech.onAssistantMessage((generatedMessageContent) => {
      setAssistantMessage(generatedMessageContent);
      setChatLog((prevChatLog) => [
        ...prevChatLog,
        { role: "assistant", content: generatedMessageContent },
      ]);
      setChatProcessing(false);
    });

    speechToSpeech.onAssistantSpeech((audioData) => {
      playAssistantSpeech(audioData);
    });

    return () => {
      speechToSpeech.stop();
      speechToSpeechRef.current = null;
    };
  }, [isMicRecording, chatLog, playAssistantSpeech]);

  const handleSendChat = useCallback(
    (text: string) => {
      if (speechToSpeechRef.current) {
        speechToSpeechRef.current.handleUserMessage(text);
        setChatLog((prevChatLog) => [
          ...prevChatLog,
          { role: "user", content: text },
        ]);
        setUserMessage("");
        setChatProcessing(true);
      }
    },
    [speechToSpeechRef]
  );

  return (
    <div className={"font-M_PLUS_2"}>
      <Meta />
      <Introduction />
      <VrmViewer />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
        isMicRecording={isMicRecording}
        setIsMicRecording={setIsMicRecording}
        speechToSpeech={speechToSpeechRef.current}
        userMessage={userMessage}
        setUserMessage={setUserMessage}
      />
      <Menu
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        assistantMessage={assistantMessage}
        onChangeSystemPrompt={setSystemPrompt}
        onChangeChatLog={handleChangeChatLog}
        handleClickResetChatLog={() => setChatLog([])}
        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
      />
      <GitHubLink />
    </div>
  );
}
