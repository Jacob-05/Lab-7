import { supabase } from '../services/supabase';
import { MemeCard } from './MemeCard';

export class MemeGallery extends HTMLElement {
  private container!: HTMLDivElement;
  private memes: any[] = [];
  private isRandomOrder: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.loadMemes();
    this.setupEventListeners();
  }

  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-top: 2rem;
        }
        .gallery-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }
        .loading {
          text-align: center;
          padding: 2rem;
          font-size: 1.2rem;
          color: var(--text-color);
        }
        .error {
          text-align: center;
          padding: 2rem;
          color: red;
          font-size: 1.2rem;
        }
      </style>
      <div class="gallery-container">
        <div class="loading">Cargando memes...</div>
      </div>
    `;

    this.container = this.shadowRoot.querySelector('.gallery-container')!;
  }

  private async loadMemes() {
    try {
      const { data, error } = await supabase.storage
        .from('memes')
        .list();

      if (error) throw error;

      this.memes = data;
      this.renderMemes();
    } catch (error) {
      console.error('Error loading memes:', error);
      this.showError();
    }
  }

  private renderMemes() {
    if (!this.container) return;

    this.container.innerHTML = '';

    const sortedMemes = this.isRandomOrder
      ? [...this.memes].sort(() => Math.random() - 0.5)
      : this.memes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    sortedMemes.forEach(meme => {
      const memeCard = document.createElement('meme-card') as MemeCard;
      memeCard.setAttribute('url', meme.name);
      memeCard.setAttribute('type', this.getFileType(meme.name));
      this.container.appendChild(memeCard);
    });
  }

  private getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return 'image';
    } else if (ext === 'mp4') {
      return 'video';
    }
    return 'unknown';
  }

  private setupEventListeners() {
    // Escuchar el evento de cambio de orden
    document.addEventListener('sort-order-changed', ((e: CustomEvent) => {
      this.isRandomOrder = e.detail.random;
      this.renderMemes();
    }) as EventListener);

    // Escuchar el evento de nuevo meme subido
    document.addEventListener('meme-uploaded', () => {
      this.loadMemes();
    });
  }

  private showError() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="error">
        Error al cargar los memes. Por favor, intenta de nuevo más tarde.
      </div>
    `;
  }
} 