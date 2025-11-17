
document.addEventListener('DOMContentLoaded', () => {
  const notesArea = document.getElementById('notes');
  const saveBtn = document.getElementById('save-notes');
  const msg = document.getElementById('notes-msg');

  if (!notesArea || !saveBtn || !msg) return;

  // Load saved notes from localStorage
  const saved = localStorage.getItem('guca-notes');
  if (saved) {
    notesArea.value = saved;
  }

  saveBtn.addEventListener('click', () => {
    const text = notesArea.value || '';
    localStorage.setItem('guca-notes', text);
    msg.textContent = 'Notas guardadas en este navegador.';
    msg.className = 'msg success';
  });
});
