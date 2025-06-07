import { supabase } from '../services/supabase';

export class MemeModal extends HTMLElement {
  private modal: HTMLDivElement | null = null;
  private content: HTMLDivElement | null = null;
  private currentUrl: string = '';
  private currentType: string = '';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s;
        }
        :host(.visible) {
          display: flex;
          opacity: 1;
        }
        .modal {
          position: relative;
          margin: auto;
          max-width: 90vw;
          max-height: 90vh;
          background: white;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .content {
          position: relative;
          width: 100%;
          height: 100%;
        }
        img, video {
          max-width: 100%;
          max-height: 90vh;
          object-fit: contain;
        }
        .close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .close-button:hover {
          background: rgba(0,0,0,0.7);
        }
      </style>
      <div class="modal">
        <button class="close-button">×</button>
        <div class="content"></div>
      </div>
    `;

    this.modal = this.shadowRoot.querySelector('.modal');
    this.content = this.shadowRoot.querySelector('.content');
  }

  private setupEventListeners() {
    const closeButton = this.shadowRoot?.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }

    this.addEventListener('click', (e) => {
      if (e.target === this) {
        this.hide();
      }
    });

    document.addEventListener('meme-clicked', ((e: CustomEvent) => {
      this.show(e.detail.url, e.detail.type);
    }) as EventListener);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  private async show(url: string, type: string) {
    if (!this.content) return;

    this.currentUrl = url;
    this.currentType = type;

    const { data: { publicUrl } } = supabase.storage
      .from('memes')
      .getPublicUrl(url);

    this.content.innerHTML = type === 'image'
      ? `<img src="${publicUrl}" alt="Meme">`
      : `<video src="${publicUrl}" controls autoplay loop></video>`;

    this.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  private hide() {
    this.classList.remove('visible');
    document.body.style.overflow = '';
    

    const video = this.content?.querySelector('video');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }
} 