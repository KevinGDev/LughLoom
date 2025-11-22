import {ChatMessage} from './chatMessageInterface';

export interface DisplayMessage extends ChatMessage {
  displayedLength?: number;
}
