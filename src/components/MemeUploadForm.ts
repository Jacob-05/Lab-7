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

export class MemeUploadForm extends HTMLElement {
  private form!: HTMLFormElement;
  private fileInput!: HTMLInputElement;
  private previewContainer!: HTMLDivElement;
  private progressBars: Map<string, HTMLProgressElement>;

  constructor() {
    super();
    this.progressBars = new Map();
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
          display: block;
          margin-bottom: 2rem;
        }
        .upload-form {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .file-input-container {
          border: 2px dashed var(--primary-color);
          padding: 2rem;
          text-align: center;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          cursor: pointer;
        }
        .preview-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .preview-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .preview-item img, .preview-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(0,0,0,0.1);
        }
        .progress-bar progress {
          width: 100%;
          height: 100%;
          border: none;
        }
        .remove-button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
      <form class="upload-form">
        <div class="file-input-container">
          <input type="file" multiple accept="image/*,video/*" style="display: none;">
          <p>Arrastra y suelta archivos aquí o haz clic para seleccionar</p>
        </div>
        <div class="preview-container"></div>
      </form>
    `;

    this.form = this.shadowRoot.querySelector('form')!;
    this.fileInput = this.shadowRoot.querySelector('input[type="file"]')!;
    this.previewContainer = this.shadowRoot.querySelector('.preview-container')!;
  }

  private setupEventListeners() {
    const dropZone = this.shadowRoot?.querySelector('.file-input-container');
    
    if (dropZone) {
      dropZone.addEventListener('click', () => this.fileInput.click());
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = (e as DragEvent).dataTransfer?.files;
        if (files) this.handleFiles(files);
      });
    }

    this.fileInput.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) this.handleFiles(files);
    });
  }

  private async handleFiles(files: FileList) {
    for (const file of Array.from(files)) {
      if (!this.isValidFile(file)) continue;

      const preview = await this.createPreview(file);
      this.previewContainer.appendChild(preview);

      const progressBar = this.createProgressBar();
      this.progressBars.set(file.name, progressBar);
      preview.appendChild(progressBar);

      try {
        await this.uploadFile(file, progressBar);
      } catch (error) {
        console.error('Error uploading file:', error);
        this.showError(preview);
      }
    }
  }

  private isValidFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
    return validTypes.includes(file.type);
  }

  private async createPreview(file: File): Promise<HTMLDivElement> {
    const preview = document.createElement('div');
    preview.className = 'preview-item';

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-button';
    removeButton.innerHTML = '×';
    removeButton.onclick = () => preview.remove();
    preview.appendChild(removeButton);

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      preview.appendChild(img);
    } else if (file.type === 'video/mp4') {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      preview.appendChild(video);
    }

    return preview;
  }

  private createProgressBar(): HTMLProgressElement {
    const progressBar = document.createElement('progress');
    progressBar.className = 'progress-bar';
    progressBar.value = 0;
    progressBar.max = 100;
    return progressBar;
  }

  private async uploadFile(file: File, progressBar: HTMLProgressElement) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${new Date().toISOString().split('T')[0]}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('memes')
      .upload(filePath, file);

    if (error) throw error;

    // Actualizar la barra de progreso al 100%
    progressBar.value = 100;

    // Disparar evento personalizado cuando se completa la carga
    this.dispatchEvent(new CustomEvent('meme-uploaded', {
      detail: { url: data.path }
    }));
  }

  private showError(preview: HTMLDivElement) {
    preview.style.border = '2px solid red';
    const errorMessage = document.createElement('div');
    errorMessage.textContent = 'Error al subir';
    errorMessage.style.color = 'red';
    preview.appendChild(errorMessage);
  }
} 