import './styles/main.css';
import { MemeUploadForm } from './components/MemeUploadForm';
import { MemeGallery } from './components/MemeGallery';
import { MemeCard } from './components/MemeCard';
import { MemeModal } from './components/MemeModal';
import { MemeSortToggle } from './components/MemeSortToggle';

// Registrar los componentes web
customElements.define('meme-upload-form', MemeUploadForm);
customElements.define('meme-card', MemeCard);
customElements.define('meme-gallery', MemeGallery);
customElements.define('meme-modal', MemeModal);
customElements.define('meme-sort-toggle', MemeSortToggle); 