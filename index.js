const { app, Menu, Tray, net } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { menubar } = require('menubar');
const cheerio = require('cheerio');

const iconPath = path.join(__dirname, 'assets', 'images', 'icon.png');

let tray = null;
let mb = null;

app.whenReady().then(() => {
  mb = menubar({
    icon: iconPath,
    showDocIcon: false,
  });
  mb.on('ready', () => {
    console.log('Menubar app is ready.');
    loadG27();
    setBackground('~/Downloads/final-3.png');
  });
});

const loadG27 = function() {
  const urlG27 = 'https://punkscape.xyz/gallery27/now';
  const request = net.request(urlG27);
  request.on('response', (response) => {
    console.log(`STATUS: ${response.statusCode}`);
    response.on('data', (htmlString) => {
      const $ = cheerio.load(htmlString);
      console.log(`BODY: ${$('body')}`);
    });
    response.on('end', () => {
      console.log('No more data in response.')
    });
  });
  request.end();
};

const setBackground = function(imagePath) {
  var script = "/usr/bin/osascript<<END\ntell application \"System Events\" to tell every desktop to set picture to \"" + imagePath + "\"\nEND"
  exec(script,
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });
};
