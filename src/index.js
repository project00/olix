// Punto di ingresso principale per il bundler
import('./main.jsx').catch((error) => {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="h-screen flex flex-col items-center justify-center p-4 bg-red-50">
      <h1 class="text-2xl font-bold text-red-600 mb-4">Errore di Caricamento</h1>
      <p class="text-red-800 mb-4">${error.message}</p>
      <button
        onclick="window.location.reload()"
        class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Ricarica l'Applicazione
      </button>
    </div>
  `;
  console.error('Failed to load application:', error);
});
