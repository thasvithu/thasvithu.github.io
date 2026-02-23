
const links = document.querySelectorAll('.alternate-style');
const bodySkin = document.querySelectorAll('.body-skin');
const colorStorageKey = 'portfolio_skin_color';
const themeStorageKey = 'portfolio_theme_mode';

function setActiveStyle(color) {
  for (let i = 0; i < links.length; i += 1) {
    const title = links[i].getAttribute('title');
    if (color === title) {
      links[i].removeAttribute('disabled');
    } else {
      links[i].setAttribute('disabled', true);
    }
  }
  localStorage.setItem(colorStorageKey, color);
}

for (let i = 0; i < bodySkin.length; i += 1) {
  bodySkin[i].addEventListener('change', function () {
    const dark = this.value === 'dark';
    document.body.classList.toggle('dark', dark);
    localStorage.setItem(themeStorageKey, dark ? 'dark' : 'light');
  });
}

const styleToggle = document.querySelector('.toggle-style-switcher');
const switcherPanel = document.querySelector('.style-switcher');
if (styleToggle && switcherPanel) {
  styleToggle.addEventListener('click', () => {
    switcherPanel.classList.toggle('open');
  });
}

// Restore previously selected color and mode on load.
const storedColor = localStorage.getItem(colorStorageKey);
if (storedColor) {
  setActiveStyle(storedColor);
}

const storedMode = localStorage.getItem(themeStorageKey) || 'light';
const darkEnabled = storedMode === 'dark';
document.body.classList.toggle('dark', darkEnabled);
for (let i = 0; i < bodySkin.length; i += 1) {
  const input = bodySkin[i];
  input.checked = input.value === (darkEnabled ? 'dark' : 'light');
}
