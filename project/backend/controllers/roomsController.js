import client from '../config/client.js';

function getAllRooms() {
  return new Promise((resolve, reject) => {
    const baseDN = 'ou=classrooms,dc=diplomski,dc=com';
    const opts = {
      filter: '(&(objectClass=room))',
      scope: 'one',
      attributes: ['cn', 'roomNumber']
    };

    client.search(baseDN, opts, (err, res) => {
      if (err) {
        return reject(err);
      }

      const rooms = [];

      res.on('searchEntry', (entry) => {
        console.log("Entry POJO:", entry.pojo); 
        if (entry.pojo) {
          const room = {};
          entry.pojo.attributes.forEach(attr => {
            if (attr.type === 'cn') {
              room.identifier = attr.values[0];
            } else if (attr.type === 'roomNumber') {
              const roomNumbers = [];
              attr.values.forEach(value => {
                roomNumbers.push(value);
              });
              room.roomNumbers = roomNumbers;
            } 
          });
          rooms.push(room);
        }
      });

      res.on('error', (err) => {
        reject(err);
      });

      res.on('end', (result) => {
        if (rooms.length === 0) {
          reject(new Error('No rooms found'));
        } else {
          resolve(rooms);
        }
      });
    });
  });
}

const getRooms = async (req, res) => {
  try {
    const rooms = await getAllRooms();
    console.log(rooms);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
};

export { getRooms };