const fs = require('fs');
const path = require('path');
const https = require('https');
const { app, Menu, Tray, net } = require('electron');
const { exec } = require('child_process');
const { menubar } = require('menubar');

const iconPath = path.join(__dirname, 'assets', 'images', 'icon.png');
const fileDir = path.join(app.getPath('userData'), 'gallery27');
const filePath = path.join(fileDir, 'latest.png');
const urlG27 = 'http://api.punkscape.xyz/gallery27/scapes/latest';
const interval = 60 * 1000; // milliseconds

let tray = null;
let mb = null;
var timer = null;

app.whenReady().then(() => {
  initialize();
});

const initialize = function() {
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir);
  }

  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { id: 0, label: 'Live', type: 'radio', click: itemClicked, checked: true},
    { id: 1, label: 'Off', type: 'radio', click: itemClicked},
    { type: 'separator'},
    { id: 2, label: 'Quit', type: 'normal', click: itemClicked}
  ]);
  tray.setContextMenu(contextMenu);

  mb = menubar({tray});
  mb.on('ready', () => {
    console.log('ready');
    loadLatestScape();
    timer = setInterval(loop, interval);
    tray.removeAllListeners();
  });
};

const itemClicked = function(menuItem, browserWindow, event) {
  console.log(menuItem['label'], menuItem['id']);
  if (menuItem['id']==0) {
    clearInterval(timer);
    timer = setInterval(loop, interval);
  } else if (menuItem['id']==1) {
    clearInterval(timer);
  } else if (menuItem['id']==2) {
    app.quit();
  }
}

const loop = function() {
  console.log('Loop');
  loadLatestScape();
}

const loadLatestScape = function() {
  const request = net.request(urlG27);
  request.on('response', (response) => {
    console.log(`STATUS: ${response.statusCode}`);
    response.on('data', (data) => {
      let json = JSON.parse(data);
      let imageURL = json['image'];
      saveImage(imageURL, setBackground);
    });
  });
  request.end();
};

const saveImage = function(imageURL, onDownload) {
  let request = https.get(imageURL, (response) => {
    let file = fs.createWriteStream(filePath);
    response.pipe(file);
    file.on('finish', function() {
      file.close();
      onDownload();
    });
  });
  request.on('error', function(error) {
    console.log('error: ' + error.message);
  });
  request.end();
};

const setBackground = function() {
  let script = "/usr/bin/osascript<<END\ntell application \"System Events\" to tell every desktop to set picture to \"" + filePath + "\"\nEND"
  exec(script,
    function (error, stdout, stderr) {
      if (stdout) console.log('stdout: ' + stdout);
      if (stderr) console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });
};
