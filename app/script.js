document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    card.style.transition = 'transform 180ms ease';
    card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-4px)');
    card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
    card.setAttribute('data-index', String(index + 1));
  });
});
