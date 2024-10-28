import { MessageInput } from "@/components/messageInput";
import { useCallback } from "react";
import { ISpeechToSpeech } from "@/lib/SpeechToSpeech/ISpeechToSpeech";

type Props = {
  isChatProcessing: boolean;
  onChatProcessStart: (text: string) => void;
  isMicRecording: boolean;
  setIsMicRecording: (value: boolean) => void;
  speechToSpeech: ISpeechToSpeech | null;
  userMessage: string;
  setUserMessage: (value: string) => void;
};

/**
 * テキスト入力と音声入力を提供する
 *
 * 音声認識の完了時は自動で送信し、返答文の生成中は入力を無効化する
 *
 */
export const MessageInputContainer = ({
  isChatProcessing,
  onChatProcessStart,
  isMicRecording,
  setIsMicRecording,
  speechToSpeech,
  userMessage,
  setUserMessage,
}: Props) => {
  const handleClickMicButton = useCallback(() => {
    if (isMicRecording) {
      speechToSpeech?.voiceOff();
      setIsMicRecording(false);
    } else {
      speechToSpeech?.voiceOn();
      setIsMicRecording(true);
    }
  }, [isMicRecording, speechToSpeech, setIsMicRecording]);

  const handleClickSendButton = useCallback(() => {
    onChatProcessStart(userMessage);
  }, [onChatProcessStart, userMessage]);

  return (
    <MessageInput
      userMessage={userMessage}
      isChatProcessing={isChatProcessing}
      isMicRecording={isMicRecording}
      onChangeUserMessage={(e) => setUserMessage(e.target.value)}
      onClickMicButton={handleClickMicButton}
      onClickSendButton={handleClickSendButton}
    />
  );
};
