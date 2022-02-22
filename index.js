const fs = require('fs');
const path = require('path');
const https = require('https');
const { app, Menu, Tray, net, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const { menubar } = require('menubar');

const iconPath = path.join(__dirname, 'assets', 'images', 'icon.png');
const fileDir = path.join(app.getPath('userData'), 'gallery27');
const filePath = path.join(fileDir, 'latest.png');
const urlG27 = 'http://api.punkscape.xyz/gallery27/scapes/latest';

let tray = null;
let mb = null;

app.whenReady().then(() => {
  initialize();
});

const initialize = function() {
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir);
  }

  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Live', type: 'radio', checked: true},
    { label: 'Off', type: 'radio'},
  ]);
  tray.setContextMenu(contextMenu);

  mb = menubar({tray});
  mb.on('ready', () => {
    console.log('Menubar app is ready.');
    loadLatestScape(
      imageURL => {
        console.log(imageURL);
        saveImage(imageURL, setBackground);
      },
      () => handleError()
    );
  });
};

const loadLatestScape = function(onImageLoad, onError) {
  const request = net.request(urlG27);
  request.on('response', (response) => {
    console.log(`STATUS: ${response.statusCode}`);
    response.on('data', (data) => {
      let json = JSON.parse(data);
      let imageURL = json['image'];
      onImageLoad(imageURL);
    });
    response.on('end', () => {
      console.log('No more data in response.');
    });
  });
  request.end();
};

const handleError = function() {

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
  var script = "/usr/bin/osascript<<END\ntell application \"System Events\" to tell every desktop to set picture to \"" + filePath + "\"\nEND"
  exec(script,
    function (error, stdout, stderr) {
      if (stdout) console.log('stdout: ' + stdout);
      if (stderr) console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });
};

const click = function(menuItem, browserWindow, event) {
  console.log(menuItem);
};
