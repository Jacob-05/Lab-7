import { createClient } from '@supabase/supabase-js';

declare const process: {
  env: {
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
  }
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export class MemeCard extends HTMLElement {
  private url: string = '';
  private type: string = '';

  static get observedAttributes() {
    return ['url', 'type'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    if (name === 'url') {
      this.url = newValue;
    } else if (name === 'type') {
      this.type = newValue;
    }

    if (this.isConnected) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  private async render() {
    if (!this.shadowRoot) return;

    const { data: { publicUrl } } = supabase.storage
      .from('memes')
      .getPublicUrl(this.url);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          aspect-ratio: 1;
          border-radius: 0.5rem;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s;
        }
        :host(:hover) {
          transform: scale(1.05);
        }
        .meme-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        img, video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.3);
          opacity: 0;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
        }
        :host(:hover) .overlay {
          opacity: 1;
        }
      </style>
      <div class="meme-container">
        ${this.type === 'image' 
          ? `<img src="${publicUrl}" alt="Meme">`
          : `<video src="${publicUrl}" muted loop></video>`
        }
        <div class="overlay">
          Click para ver
        </div>
      </div>
    `;
  }

  private setupEventListeners() {
    this.addEventListener('click', () => {
      const event = new CustomEvent('meme-clicked', {
        detail: {
          url: this.url,
          type: this.type
        }
      });
      document.dispatchEvent(event);
    });
  }
} 