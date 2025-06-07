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
    `;

    this.container = this.shadowRoot.querySelector('.gallery-container')!;
  }

  private async loadMemes() {
    try {
      const { data: folders, error: foldersError } = await supabase.storage
        .from('memes')
        .list('');

      if (foldersError) {
        console.error('Error al cargar carpetas:', foldersError);
        throw foldersError;
      }

      let allMemes: any[] = [];

      for (const folder of folders || []) {
        if (folder.name) {
          const { data: files, error: filesError } = await supabase.storage
            .from('memes')
            .list(folder.name);

          if (filesError) {
            console.error(`Error al cargar archivos de ${folder.name}:`, filesError);
            continue;
          }

          if (files) {

            const filesWithPath = files.map(file => ({
              ...file,
              name: `${folder.name}/${file.name}`
            }));
            allMemes = [...allMemes, ...filesWithPath];
          }
        }
      }


      this.memes = allMemes.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      this.renderMemes();
    } catch (error) {
      console.error('Error al cargar memes:', error);
      this.showError();
    }
  }

  private renderMemes() {
    if (!this.container) return;

    this.container.innerHTML = '';

    const sortedMemes = this.isRandomOrder
      ? [...this.memes].sort(() => Math.random() - 0.5)
      : this.memes;

    sortedMemes.forEach(meme => {
      const memeCard = document.createElement('meme-card') as MemeCard;
      const fullPath = meme.name.includes('/') ? meme.name : `${new Date().toISOString().split('T')[0]}/${meme.name}`;
      memeCard.setAttribute('url', fullPath);
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
    document.addEventListener('sort-order-changed', ((e: CustomEvent) => {
      this.isRandomOrder = e.detail.random;
      this.renderMemes();
    }) as EventListener);

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