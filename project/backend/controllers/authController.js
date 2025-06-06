import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import client from '../config/client.js';

function getAllAdmins() {
  return new Promise((resolve, reject) => {
    const baseDN = 'ou=admins,dc=diplomski,dc=com';
    const opts = {
      filter: '(&(objectClass=simpleSecurityObject))',
      scope: 'one',
      attributes: ['userPassword', 'uid']
    };
    client.search(baseDN, opts, (err, res) => {
      if (err) {
        return reject(err);
      }
      const admins = [];
      res.on('searchEntry', (entry) => {
        if (entry.pojo) {
          const admin = {};
          entry.pojo.attributes.forEach(attr => {
            if (attr.type === 'uid') {
              admin.username = attr.values[0];
              console.log(admin)
            } else if (attr.type === 'userPassword') {
              admin.password = attr.values[0];
            }
            admins.push(admin);
          });
        }
      });
      res.on('error', (err) => {
        reject(err);
      });
      res.on('end', (result) => {
        if (admins.length === 0) {
          reject(new Error('No admins found'));
        } else {
          console.log(admins[0].username + "dasdasd");
          resolve(admins);
        }
      });
    });
  });
}

const registerPC = asyncHandler(async (req, res) => {
  const { name, password, roomNumber, pcNumber } = req.body;
  const reqip = req.ip;
  const replace = "::ffff:";
  const ip = reqip.replace(replace, "");
  const admins = await getAllAdmins();
  const admin = admins.find(admin => 
    admin.username === name && admin.password === password
  );
  console.log(admins);
  if (admin) {
    console.log("dobar login", ip);
    const token = generateToken(res, ip, roomNumber, pcNumber);
    console.log(token);

    const entry = {
      cn: ip,
      sn: token,
      info: pcNumber,
      roomNumber: roomNumber,
      objectClass: ['top', 'inetOrgPerson', 'extensibleObject'],
    };

    const dn = `sn=${token},ou=pcs,dc=diplomski,dc=com`;
    client.add(dn, entry, (err) => {
      if (err) {
        console.error('Error adding entry to LDAP:', err);
        res.status(500).json({ message: 'Error registering PC' });
      } else {
        console.log('Entry added successfully');
        res.json({ message : ip });
      }
    });
  } else {
    console.log("los login");
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

export { registerPC };