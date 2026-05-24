function switchView(viewName) {
  document.querySelectorAll('[data-view]').forEach(view => {
    view.classList.toggle('active', view.dataset.view === viewName);
  });

  document.querySelectorAll('[data-switch-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.switchView === viewName);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-switch-view]').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.switchView));
  });
});
