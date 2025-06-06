export class MemeSortToggle extends HTMLElement {
  private isRandom: boolean = false;

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
          display: block;
          margin: 1rem 0;
          text-align: center;
        }
        .toggle-container {
          display: inline-flex;
          align-items: center;
          background: white;
          padding: 0.5rem;
          border-radius: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .toggle-button {
          padding: 0.5rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 1.5rem;
          transition: background-color 0.2s;
          font-weight: 500;
        }
        .toggle-button.active {
          background: var(--primary-color);
          color: white;
        }
      </style>
      <div class="toggle-container">
        <button class="toggle-button active" data-sort="chronological">
          Cronológico
        </button>
        <button class="toggle-button" data-sort="random">
          Aleatorio
        </button>
      </div>
    `;
  }

  private setupEventListeners() {
    const buttons = this.shadowRoot?.querySelectorAll('.toggle-button');
    if (!buttons) return;

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const sortType = button.getAttribute('data-sort');
        this.setSortType(sortType === 'random');
      });
    });
  }

  private setSortType(isRandom: boolean) {
    if (this.isRandom === isRandom) return;

    this.isRandom = isRandom;
    const buttons = this.shadowRoot?.querySelectorAll('.toggle-button');
    
    if (buttons) {
      buttons.forEach(button => {
        const sortType = button.getAttribute('data-sort');
        button.classList.toggle('active', 
          (sortType === 'random' && isRandom) || 
          (sortType === 'chronological' && !isRandom)
        );
      });
    }

    // Disparar evento de cambio de orden
    document.dispatchEvent(new CustomEvent('sort-order-changed', {
      detail: { random: isRandom }
    }));
  }
} 