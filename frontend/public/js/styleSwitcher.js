
const links = document.querySelectorAll('.alternate-style');
const bodySkin = document.querySelectorAll('.body-skin');
const colorStorageKey = 'portfolio_skin_color';
const themeStorageKey = 'portfolio_theme_mode';
const skinPalette = {
  pink: '#ec1839',
  blue: '#2196f3',
  green: '#72b626',
  orange: '#fa5b0f',
  yellow: '#ffb400'
};

function setActiveStyle(color) {
  for (let i = 0; i < links.length; i += 1) {
    const title = links[i].getAttribute('title');
    if (color === title) {
      links[i].removeAttribute('disabled');
    } else {
      links[i].setAttribute('disabled', true);
    }
  }
  if (skinPalette[color]) {
    document.documentElement.style.setProperty('--skin-color', skinPalette[color]);
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
} else {
  const activeLink = Array.from(links).find((link) => !link.hasAttribute('disabled'));
  const activeTitle = activeLink ? activeLink.getAttribute('title') : 'pink';
  if (activeTitle && skinPalette[activeTitle]) {
    document.documentElement.style.setProperty('--skin-color', skinPalette[activeTitle]);
  }
}

const storedMode = localStorage.getItem(themeStorageKey) || 'light';
const darkEnabled = storedMode === 'dark';
document.body.classList.toggle('dark', darkEnabled);
for (let i = 0; i < bodySkin.length; i += 1) {
  const input = bodySkin[i];
  input.checked = input.value === (darkEnabled ? 'dark' : 'light');
}
