import axios from "axios";
import qs from 'qs';
import client from '../config/client.js';

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

function getDeviceInfo(roomNumber, pcNumber) {
  return new Promise((resolve, reject) => {
    const baseDN = 'ou=virtualmachines,dc=diplomski,dc=com';
    const opts = {
      filter: `(&(objectClass=inetOrgPerson)(street=${pcNumber})(roomNumber=${roomNumber}))`,
      scope: 'one',
      attributes: ['cn', 'sn', 'userPassword', 'title']
    };
    client.search(baseDN, opts, (err, res) => {
      if (err) {
        return reject(err);
      }
      let device = null;
      res.on('searchEntry', (entry) => {
        if (entry.pojo) {
          device = {};
          entry.pojo.attributes.forEach(attr => {
            if (attr.type === 'cn') {
              device.identifier = attr.values[0];
            } else if (attr.type === 'sn') {
              device.ipAddress = attr.values[0];
            } else if (attr.type === 'userPassword') {
              device.userPassword = attr.values[0];
            } else if (attr.type === 'title') {
              device.password = attr.values[0];
            }
          });
        }
      });
      res.on('error', (err) => {
        reject(err);
      });
      res.on('end', (result) => {
        if (!device) {
          reject(new Error('No matching device found'));
        } else {
          resolve(device);
        }
      });
    });
  });
}

const getGuacamoleConnection = async (req, res) => {
  try {
    if (!process.env.GUACAMOLE_INTERNAL_URL) {
      throw new Error('GUACAMOLE_INTERNAL_URL is not set in the environment variables');
    }

    const authFormData = qs.stringify({
      username: process.env.GUACAMOLE_ADMIN_USERNAME || "guacadmin",
      password: process.env.GUACAMOLE_ADMIN_PASSWORD || "guacadmin"
    });
    
    const authResponse = await axios.post(`${process.env.GUACAMOLE_INTERNAL_URL}/api/tokens`, authFormData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const guacamoleAuthToken = authResponse.data.authToken;
    const roomNumber = req.cookies.roomNumber;
    const pcNumber = req.cookies.pcNumber;
    const deviceInfo = await getDeviceInfo(roomNumber, pcNumber);

    const newConnectionData =     {
        "parentIdentifier": "ROOT",
        "name": generateRandomString(11),
        "protocol": "rdp",
        "parameters": {
          "port": "3389",
          "read-only": "",
          "swap-red-blue": "",
          "cursor": "",
          "color-depth": "16",
          "clipboard-encoding": "",
          "disable-copy": "",
          "disable-paste": "",
          "dest-port": "",
          "recording-exclude-output": "",
          "recording-exclude-mouse": "",
          "recording-include-keys": "",
          "create-recording-path": "",
          "enable-sftp": "",
          "sftp-port": "",
          "sftp-server-alive-interval": "",
          "enable-audio": "",
          "security": "nla",
          "disable-auth": "",
          "ignore-cert": "true",
          "gateway-port": "",
          "server-layout": "",
          "timezone": "",
          "console": "",
          "width": "",
          "height": "",
          "dpi": "",
          "resize-method": "",
          "console-audio": "",
          "disable-audio": "",
          "enable-audio-input": "",
          "enable-printing": "",
          "enable-drive": "",
          "create-drive-path": "",
          "enable-wallpaper": "",
          "enable-theming": "",
          "enable-font-smoothing": "true",
          "enable-full-window-drag": "true",
          "enable-desktop-composition": "",
          "enable-menu-animations": "",
          "disable-bitmap-caching": "true",
          "disable-offscreen-caching": "",
          "disable-glyph-caching": "",
          "preconnection-id": "",
          "hostname": deviceInfo.ipAddress,
          "username": deviceInfo.identifier,
          "password": deviceInfo.password,
          "domain": "",
          "gateway-hostname": "",
          "gateway-username": "",
          "gateway-password": "",
          "gateway-domain": "",
          "initial-program": "",
          "client-name": "",
          "printer-name": "",
          "drive-name": "",
          "drive-path": "",
          "static-channels": "",
          "remote-app": "",
          "remote-app-dir": "",
          "remote-app-args": "",
          "preconnection-blob": "",
          "load-balance-info": "",
          "recording-path": "",
          "recording-name": "",
          "sftp-hostname": "",
          "sftp-host-key": "",
          "sftp-username": "",
          "sftp-password": "",
          "sftp-private-key": "",
          "sftp-passphrase": "",
          "sftp-root-directory": "",
          "sftp-directory": ""
        },
        "attributes": {
          "max-connections": "",
          "max-connections-per-user": "",
          "weight": "",
          "failover-only": "",
          "guacd-port": "",
          "guacd-encryption": "",
          "guacd-hostname": ""
        }
      };

    const newConnectionResponse = await axios.post(
      `${process.env.GUACAMOLE_INTERNAL_URL}/api/session/data/mysql/connections?token=${guacamoleAuthToken}`,
      newConnectionData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const connectionId = newConnectionResponse.data.identifier;

    res.json({
      guacamoleUrl: process.env.GUACAMOLE_EXTERNAL_URL,
      connectionId: connectionId,
      authToken: guacamoleAuthToken,
      dataSource: 'mysql',
    });

  } catch (error) {
    console.error('Error connecting to Guacamole:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export { getGuacamoleConnection };