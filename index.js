const { app, Menu, Tray } = require('electron');
const path = require('path');

const iconPath = path.join(__dirname, 'assets', 'images', 'icon.png');

let tray = null;

app.whenReady().then(() => {
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
		{ label: 'Live', type: 'radio', checked: true },
    { label: 'Off', type: 'radio' },
    { label: '', type: 'separator'},
		{ label: 'Quit', type: 'normal' },
	]);
	tray.setContextMenu(contextMenu);
});
