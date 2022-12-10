const fs = require('fs');
const path = require('path');
const https = require('https');
const { app, Menu, Tray, net, shell } = require('electron');
const { exec } = require('child_process');
const { menubar } = require('menubar');

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const months_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const days_short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const iconPath = path.join(__dirname, 'assets', 'images', 'icon.png');
const fileDir = path.join(app.getPath('userData'), 'gallery27');
const urlG27 = 'http://api.punkscape.xyz/gallery27/scapes/latest';
const urlPSLatest = 'https://punkscape.xyz/gallery27/now/';
const interval = 60 * 1000; // milliseconds

var filePath = null;
let tray = null;
let mb = null;
var timer = null;

var tokenID = null;
var punkscapeID = null;
var bidsCount = null;
var auctionEndsAt = null;

app.whenReady().then(() => {
  initialize();
});

const initialize = function() {
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir);
  }

  tray = new Tray(iconPath);
  updateMenu(false);

  mb = menubar({tray});
  mb.on('ready', () => {
    console.log('ready');
    tray.removeAllListeners();
  });
};

const updateMenu = function(on) {
  "on - true if live else false"
  template = [
    { id: 0, label: 'Live Updates', type: 'radio', click: itemClicked, checked: on},
    { id: 1, label: 'Off', type: 'radio', click: itemClicked, checked: !on},
    { type: 'separator'},
  ];
  if (auctionEndsAt!=null) {
    console.log('Auction info');
    let d = auctionEndsAt;
    let dateString = `${days_short[d.getDay()]} ${months_short[d.getMonth()]} ${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
    template = template.concat([
      { label: `Day ${73}, Bid #${bidsCount}`, type: 'normal', enabled: false},
      { label: `Auction ends ${dateString}`, type: 'normal', enabled: false},
      { type: 'separator'}
    ]);
  }
  template = template.concat([
    { id: 2, label: 'View on punkscape.xyz', type: 'normal', click: itemClicked},
    { type: 'separator'},
    { id: 3, label: 'Quit', type: 'normal', click: itemClicked}
  ]);
  const contextMenu = Menu.buildFromTemplate(template);
  tray.setContextMenu(contextMenu);
}

const itemClicked = function(menuItem, browserWindow, event) {
  console.log(menuItem['label'], menuItem['id']);
  if (menuItem['id']==0) {
    loadLatestData();
    clearInterval(timer);
    timer = setInterval(loop, interval);
  } else if (menuItem['id']==1) {
    auctionEndsAt = null;
    clearInterval(timer);
  } else if (menuItem['id']==2) {
    shell.openExternal(urlPSLatest);
  } else if (menuItem['id']==3) {
    app.quit();
  }
}

const loop = function() {
  console.log('Loop');
  loadLatestData();
}

const loadLatestData = function() {
  const request = net.request(urlG27);
  request.on('response', (response) => {
    console.log(`STATUS: ${response.statusCode}`);
    response.on('data', (data) => {
      let json = JSON.parse(data);
      console.log(json);
      let newTokenID = json['token_id'];
      let newPunkscapeID = json['punkscape_id'];
      let newBidsCount = json['bids_count'];
      imageURL = json['image'];
      auctionEndsAt = new Date(json['auction_ends_at']);
      console.log(`Loading bid #${newBidsCount} for token ${newTokenID} ends at ${auctionEndsAt}..`);
      console.log(`\twith image from URL ${imageURL}`);
      if (newTokenID != tokenID || newBidsCount != bidsCount) {
        console.log('Updating background...');
        tokenID = newTokenID;
        punkscapeID = newPunkscapeID;
        bidsCount = newBidsCount;
        updateMenu(true);
        saveImage(imageURL, setBackground);
      }
    });
  });
  request.on('error', function(error) {
    console.log('error: ' + error.message);
  });
  request.end();
};

const saveImage = function(imageURL, onDownload) {
  let request = https.get(imageURL, (response) => {
    removeAllFiles();
    filePath = getNewFilePath();
    let file = fs.createWriteStream(filePath);
    response.pipe(file);
    console.log(`Saved filed to ${filePath}.`);
    file.on('finish', function() {
      file.close();
      console.log('Downloaded file.');
      onDownload();
    });
  });
  request.on('error', function(error) {
    console.log('error: ' + error.message);
  });
  request.end();
};

const getNewFilePath = function() {
  let d = new Date();
  let time = d.getTime();
  return path.join(fileDir, time + '.png');;
};

const removeAllFiles = function() {
  console.log(`read directory ${fileDir}`);
  files = fs.readdirSync(fileDir);
  for (const file of files) {
    fs.unlink(path.join(fileDir, file), err => {
      if (err) throw err;
    });
  }
};

const setBackground = function() {
  let script = "/usr/bin/osascript<<END\ntell application \"System Events\" to tell every desktop to set picture to \"" + filePath + "\"\nEND"
  console.log(`Setting background from ${filePath}...`);
  exec(script,
    function (error, stdout, stderr) {
      console.log('Set background.');
      if (stdout) console.log('stdout: ' + stdout);
      if (stderr) console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });
};
