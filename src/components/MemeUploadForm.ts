import { supabase } from '../services/supabase';

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
          transition: all 0.3s ease;
        }
        .file-input-container:hover {
          background: rgba(79, 70, 229, 0.1);
        }
        .file-input-container.dragover {
          background: rgba(79, 70, 229, 0.2);
          border-color: var(--secondary-color);
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
          background: #f3f4f6;
          transition: transform 0.2s;
        }
        .preview-item:hover {
          transform: scale(1.02);
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
          background: var(--primary-color);
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
          transition: background-color 0.2s;
        }
        .remove-button:hover {
          background: rgba(0,0,0,0.7);
        }
        .error-message {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255,0,0,0.8);
          color: white;
          padding: 0.5rem;
          text-align: center;
          font-size: 0.875rem;
        }
        .upload-status {
          text-align: center;
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #666;
        }
      </style>
      <form class="upload-form">
        <div class="file-input-container">
          <input type="file" multiple accept="image/*,video/*" style="display: none;">
          <p>Arrastra y suelta archivos aquí o haz clic para seleccionar</p>
          <small>Formatos permitidos: JPG, PNG, GIF, WEBP, MP4</small>
        </div>
        <div class="preview-container"></div>
        <div class="upload-status"></div>
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
    const statusElement = this.shadowRoot?.querySelector('.upload-status');
    if (statusElement) {
      statusElement.textContent = 'Subiendo archivos...';
    }

    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      if (!this.isValidFile(file)) {
        errorCount++;
        continue;
      }

      const preview = await this.createPreview(file);
      this.previewContainer.appendChild(preview);

      const progressBar = this.createProgressBar();
      this.progressBars.set(file.name, progressBar);
      preview.appendChild(progressBar);

      try {
        await this.uploadFile(file, progressBar);
        successCount++;
      } catch (error) {
        console.error('Error uploading file:', error);
        this.showError(preview);
        errorCount++;
      }
    }

    if (statusElement) {
      if (successCount > 0 && errorCount === 0) {
        statusElement.textContent = `¡Éxito! ${successCount} archivo(s) subido(s) correctamente.`;
      } else if (successCount > 0 && errorCount > 0) {
        statusElement.textContent = `${successCount} archivo(s) subido(s), ${errorCount} error(es).`;
      } else if (successCount === 0 && errorCount > 0) {
        statusElement.textContent = `Error al subir ${errorCount} archivo(s).`;
      }
    }
  }

  private isValidFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
    const isValid = validTypes.includes(file.type);
    
    if (!isValid) {
      console.warn(`Tipo de archivo no válido: ${file.type}`);
    }
    
    return isValid;
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

    try {
      // Verificar la conexión con Supabase
      console.log('Verificando conexión con Supabase...');
      
      // Primero verificamos si el bucket existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error al listar buckets:', bucketsError);
        console.error('Detalles del error:', {
          message: bucketsError.message,
          name: bucketsError.name
        });
        throw new Error('Error al verificar los buckets de almacenamiento');
      }

      console.log('Buckets encontrados:', buckets);
      const bucketExists = buckets.some(bucket => bucket.name === 'memes');
      
      if (!bucketExists) {
        console.error('Buckets disponibles:', buckets.map(b => b.name));
        console.error('No se encontró el bucket "memes". Por favor, crea el bucket en Supabase.');
        throw new Error('El bucket "memes" no existe en Supabase. Por favor, crea el bucket primero.');
      }

      console.log('Bucket "memes" encontrado, procediendo a subir archivo...');
      
      // Intentamos subir el archivo
      const { data, error } = await supabase.storage
        .from('memes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error detallado al subir archivo:', error);
        console.error('Detalles del error:', {
          message: error.message,
          name: error.name
        });
        throw error;
      }

      console.log('Archivo subido exitosamente:', data);

      // Actualizar la barra de progreso al 100%
      progressBar.value = 100;

      // Disparar evento personalizado cuando se completa la carga
      this.dispatchEvent(new CustomEvent('meme-uploaded', {
        detail: { url: data.path }
      }));
    } catch (error) {
      console.error('Error completo al subir archivo:', error);
      throw error;
    }
  }

  private showError(preview: HTMLDivElement) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = 'Error al subir. Por favor, verifica la consola del navegador para más detalles.';
    preview.appendChild(errorMessage);
  }
} 