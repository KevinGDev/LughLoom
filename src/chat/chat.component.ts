import {Component, OnInit} from '@angular/core';
import {TranslatePipe} from "@ngx-translate/core";
import {FormsModule} from "@angular/forms";
import {OllamaService} from '../services/ollama.service';
import {HttpClient} from '@angular/common/http';
import {NgClass} from '@angular/common';

interface Message {
  role: string;
  content: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [TranslatePipe, FormsModule, NgClass],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  constructor(
    private readonly ollamaService: OllamaService,
    private readonly http: HttpClient
  ) {
  }

  rules: string = '';
  answer: string = '';
  isLoading: boolean = false;

  conversation: Message[] = [];

  ngOnInit(): void {
    this.initializeRules();
  }

  initializeRules() {
    this.http.get('assets/rules/rules.txt', {responseType: 'text'}).subscribe(data => {
      console.log(data);
      this.rules = data;
      this.isLoading = true;
      this.startStory();
    });
  }


  async startStory() {
    try {
      await this.ollamaService.generateChatStream(this.rules, (message: Message) => {
        this.pushOrUpdateAssistantMessage(message);
      });

    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
    }
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.sendAnswer();
    }
  }

  sendAnswer(): void {
    if (!this.answer.trim()) return;
    this.isLoading = true;
    const playerMessage: Message = {role: 'user', content: this.answer};
    this.conversation.push(playerMessage);
    try {
      this.ollamaService.generateChatStream(this.answer, (message: Message) => {
        this.answer = '';
        this.pushOrUpdateAssistantMessage(message);
      });
    } catch (error) {
      console.error('Erreur durant le streaming :', error);
    } finally {
      this.isLoading = false;
    }
  }

  private pushOrUpdateAssistantMessage(message: Message) {
    if (
      this.conversation.length > 0 &&
      this.conversation[this.conversation.length - 1].role === message.role &&
      message.role !== 'user'
    ) {
      this.conversation[this.conversation.length - 1].content += message.content;
    } else {
      this.conversation.push({role: message.role, content: message.content});
    }
  }


  downloadConversation(): void {
    const dataStr = JSON.stringify(this.conversation, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversation.json';
    a.click();

    window.URL.revokeObjectURL(url);
  }

  async summarizeAndDownload(): Promise<void> {
    const fullConversation = this.conversation
      .map(msg => `${msg.role === 'user' ? 'Joueur' : 'MJ'} : ${msg.content}`)
      .join('\n');

    const prompt = `
Tu es un conteur ancien, témoin des âges révolus. Résume cette conversation en une histoire cohérente, sombre et immersive, comme un récit de dark fantasy. Donne-lui un ton narratif et mystérieux, comme une chronique maudite ou une légende oubliée.

Voici le journal de la conversation :

${fullConversation}
  `;

    this.isLoading = true;

    let summary = '';

    try {
      await this.ollamaService.generateChatStream(prompt, (message: Message) => {
        summary += message.content;
      });

      // Ajoute le résumé à la conversation
      this.conversation.push({
        role: 'assistant',
        content: `📜 **Résumé narratif de l'aventure :**\n${summary}`
      });

      // Télécharge le JSON avec le résumé ajouté
      this.downloadConversation();

    } catch (error) {
      console.error('Erreur lors du résumé ou du téléchargement :', error);
    } finally {
      this.isLoading = false;
    }
  }
}
