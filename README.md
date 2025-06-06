# Apache Guacamole Integracija za Daljinski Pristup Udaljenim Racunarima

Ovaj projekat prikazuje kako se Apache Guacamole može postaviti i koristiti za daljinski pristup udaljenim racunarima putem web pregledača, sa MySQL bazom podataka kao skladištem za konfiguracije konekcija.

## Sadržaj

- [Uvod](#uvod)
- [Preduslovi](#preduslovi)
- [Postavljanje Okruženja sa Docker Compose-om](#postavljanje-okruženja-sa-docker-compose-om)
- [Razumevanje docker-compose.yml fajla](#razumevanje-docker-composeyml-fajla)
- [Backend Aplikacija (Node.js)](#backend-aplikacija-nodejs)
  - [Dohvatanje informacija o uređaju](#dohvatanje-informacija-o-uređaju)
  - [Kreiranje Guacamole Konekcije](#kreiranje-guacamole-konekcije)
- [Frontend Aplikacija (React)](#frontend-aplikacija-react)
  - [Guacamole Klijent Inicijalizacija](#guacamole-klijent-inicijalizacija)
  - [Upravljanje Prikazom i Unosom](#upravljanje-prikazom-i-unosom)
- [Zaključak](#zaključak)

## Uvod

Apache Guacamole je robusno, klijentsko okruženje bez dodatnog softvera (clientless) za pristup udaljenim desktopima. Ovaj tutorijal će vas provesti kroz proces postavljanja Guacamole-a koristeći Docker Compose, integraciju sa MySQL bazom podataka za skladištenje konfiguracija, i Node.js/React aplikacijama za dinamičko upravljanje Guacamole konekcijama.

### Ključna funkcionalnost:

- **Centralizovano upravljanje**: Sve konekcije se centralno upravljaju u MySQL bazi
- **Jednostavan pristup**: Korisnici pristupaju udaljenim racunarima direktno iz web pregledača
- **Dinamičko kreiranje konekcija**: Konekcije se kreiraju "on-the-fly" na osnovu informacija o udaljenim racunarima

## Preduslovi

Pre nego što počnete, uverite se da imate sledeće instalirano:

- **Docker Desktop**: Uključuje Docker Engine i Docker Compose
- **Node.js i npm**: Za pokretanje backend i frontend aplikacija

### Razumevanje osnova:
- Docker i Docker Compose
- Osnove Node.js i React-a

## Postavljanje Okruženja sa Docker Compose-om

Naš `docker-compose.yml` fajl definiše sve potrebne servise za pokretanje Guacamole-a sa MySQL podrškom.

```yaml
version: '3.8'

services:
  guacamole-mysql:
    image: mysql:5.7
    container_name: guacamole-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: guacamole_db
      MYSQL_USER: guacamole_user
      MYSQL_PASSWORD: guacamole_password
    volumes:
      - ./mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  guacamole-init:
    image: guacamole/guacamole
    container_name: guacamole-init
    environment:
      MYSQL_HOSTNAME: guacamole-mysql
      MYSQL_DATABASE: guacamole_db
      MYSQL_USER: guacamole_user
      MYSQL_PASSWORD: guacamole_password
    depends_on:
      guacamole-mysql:
        condition: service_healthy
    command: /opt/guacamole/bin/initdb.sh --mysql > /opt/guacamole/init/initdb.sql
    volumes:
      - ./init:/opt/guacamole/init

  guacamole:
    image: guacamole/guacamole
    container_name: guacamole
    environment:
      GUACD_HOSTNAME: guacd
      MYSQL_HOSTNAME: guacamole-mysql
      MYSQL_DATABASE: guacamole_db
      MYSQL_USER: guacamole_user
      MYSQL_PASSWORD: guacamole_password
      GUACAMOLE_HOME: /config
    volumes:
      - ./guacamole_config:/config
    depends_on:
      guacd:
        condition: service_started
    ports:
      - "8082:8080"

  guacd:
    image: guacamole/guacd
    container_name: guacd
    ports:
      - "4822:4822"
```

Da biste pokrenuli sve servise, jednostavno navigirajte do direktorijuma gde se nalazi `docker-compose.yml` i izvršite:

```bash
docker-compose up -d
```

## Razumevanje docker-compose.yml fajla

### guacamole-mysql:
- Koristi `mysql:5.7` sliku
- Postavlja se kao `guacamole-mysql` kontejner
- Definiše promenljive okruženja za pristup bazi podataka (root lozinka, ime baze, korisničko ime i lozinka za Guacamole)
- Mapira volumen `./mysql-data` na `/var/lib/mysql` kako bi podaci baze bili perzistentni
- **healthcheck**: Proverava da li je MySQL server spreman pre nego što se drugi servisi pokrenu

### guacamole-init:
- Koristi `guacamole/guacamole` sliku
- Zavisi od toga da `guacamole-mysql` bude `service_healthy`
- **command**: Pokreće skriptu `initdb.sh` koja generiše Guacamole šemu za MySQL bazu podataka

### guacamole:
- Glavni Guacamole web aplikacioni kontejner
- Definiše promenljive okruženja za povezivanje sa `guacd` i `guacamole-mysql`
- `GUACAMOLE_HOME: /config` specifikuje lokaciju za Guacamole konfiguracione fajlove
- **ports**: `8082:8080` izlaže Guacamole web interfejs na portu 8082

### guacd:
- Core Guacamole proxy (guacd) za obradu udaljenih desktop protokola (RDP, VNC, SSH)
- Izlaže port 4822 na hostu

## Backend Aplikacija (Node.js)

Backend aplikacija je zadužena za dobijanje informacija o udaljenim racunarima i za dinamičko kreiranje Guacamole konekcija putem Guacamole API-ja.

### Dohvatanje informacija o uređaju

Za potrebe ovog primera, simuliramo dohvatanje informacija o uređaju. U stvarnoj aplikaciji, ove informacije bi došle iz baze podataka ili inventarnog sistema.

```javascript
// Simulacija dohvatanja informacija o uređaju
function getDeviceInfo(roomNumber, pcNumber) {
  return new Promise((resolve, reject) => {
    // Mock podaci za demonstraciju
    const mockDevices = {
      "1-1": {
        identifier: "user_remote_pc_1_1",
        ipAddress: "192.168.1.100",
        userPassword: "remote_pc_user",
        password: "remote_pc_password"
      },
      "1-2": {
        identifier: "user_remote_pc_1_2",
        ipAddress: "192.168.1.101",
        userPassword: "remote_pc_user2",
        password: "remote_pc_password2"
      }
      // Dodajte više uređaja po potrebi
    };

    const deviceKey = `${roomNumber}-${pcNumber}`;
    const device = mockDevices[deviceKey];

    if (device) {
      resolve(device);
    } else {
      reject(new Error(`No matching device found for Room ${roomNumber}, PC ${pcNumber}`));
    }
  });
}
```

### Kreiranje Guacamole Konekcije

`getGuacamoleConnection` funkcija je glavni endpoint koji obavlja sledeće korake:

1. **Autentifikacija na Guacamole API**: Prikuplja administratorski token
2. **Dohvatanje informacija o uređaju**: Koristi `getDeviceInfo` za detalje o udaljenom racunaru
3. **Kreiranje nove Guacamole konekcije**: Dinamički kreira RDP konekciju
4. **Vraća detalje konekcije**: Prosleđuje generisani ID konekcije i token frontendu

```javascript
import axios from "axios";
import qs from 'qs';

const getGuacamoleConnection = async (req, res) => {
  try {
    if (!process.env.GUACAMOLE_INTERNAL_URL) {
      throw new Error('GUACAMOLE_INTERNAL_URL is not set in the environment variables');
    }

    // 1. Autentifikacija na Guacamole API
    const authFormData = qs.stringify({
      username: process.env.GUACAMOLE_ADMIN_USERNAME || "guacadmin",
      password: process.env.GUACAMOLE_ADMIN_PASSWORD || "guacadmin"
    });
    
    const authResponse = await axios.post(`${process.env.GUACAMOLE_INTERNAL_URL}/api/tokens`, authFormData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const guacamoleAuthToken = authResponse.data.authToken;

    // 2. Dohvatanje informacija o uređaju
    const roomNumber = req.cookies.roomNumber;
    const pcNumber = req.cookies.pcNumber;
    const deviceInfo = await getDeviceInfo(roomNumber, pcNumber);

    // 3. Kreiranje nove Guacamole konekcije
    const newConnectionData = {
      "parentIdentifier": "ROOT",
      "name": generateRandomString(11),
      "protocol": "rdp",
      "parameters": {
        "port": "3389",
        "security": "nla",
        "ignore-cert": "true",
        "hostname": deviceInfo.ipAddress,
        "username": deviceInfo.userPassword,
        "password": deviceInfo.password,
        "enable-font-smoothing": "true",
        "enable-full-window-drag": "true",
        "disable-bitmap-caching": "true",
        "client-name": deviceInfo.identifier,
      },
      "attributes": {}
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

    // 4. Vraća detalje konekcije frontendu
    res.json({
      guacamoleUrl: process.env.GUACAMOLE_EXTERNAL_URL,
      connectionId: connectionId,
      authToken: guacamoleAuthToken,
      dataSource: 'mysql',
    });

  } catch (error) {
    console.error('Greška pri povezivanju na Guacamole:', error.message);
    if (error.response) {
      console.error('Odgovor sa greškom:', error.response.data);
      console.error('Status greške:', error.response.status);
    }
    res.status(500).json({ error: 'Interna greška servera', details: error.message });
  }
};

export { getGuacamoleConnection };
```

## Frontend Aplikacija (React)

Frontend koristi `guacamole-common-js` biblioteku za interakciju sa Guacamole web aplikacijom i prikaz udaljenog desktopa.

```javascript
  const handleConnect = async () => {
    if (guacamoleClient) {
      guacamoleClient.disconnect();
      setGuacamoleClient(null);
      setConnectionStatus('');
      return;
    }

    try { 
      console.log("Dohvatanje podataka za konekciju...");
      const response = await fetch("http://192.168.1.3:5000/api/pcs/guacamole-connection", {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nije uspelo uspostavljanje konekcije');
      }

      const connectionData = await response.json();
      console.log("Podaci o konekciji:", connectionData);

      // Inicijalizacija Guacamole klijenta
      const guacamoleServerUrl = "http://192.168.1.3:8082/guacamole";
      const guac = new Guacamole.Client(
        new Guacamole.WebSocketTunnel(`ws://${guacamoleServerUrl.replace('http://', '')}/websocket-tunnel`)
      );

      setGuacamoleClient(guac);

      // Podešavanje dimenzija prikaza
      const screenWidth = Math.floor(window.innerWidth * 0.95);
      const screenHeight = Math.floor(window.innerHeight * 0.9);

      console.log("Povezivanje na Guacamole...");
      guac.connect(`token=${connectionData.authToken}&GUAC_ID=${connectionData.connectionId}&GUAC_TYPE=c&GUAC_WIDTH=${screenWidth}&GUAC_HEIGHT=${screenHeight}&GUAC_DPI=96&GUAC_DATA_SOURCE=${connectionData.dataSource}`);

      // Rukovanje greškama i promenama stanja
      guac.onerror = (error) => {
        console.error("Guacamole greška:", error);
        setError(`Greška konekcije: ${error.message}`);
        setIsLoading(false);
        setConnectionStatus('');
      };

      guac.onstatechange = (state) => {
        console.log("Guacamole stanje promenjeno:", state);
        if (state === 3) { // Connected state
          setIsLoading(false);
          setConnectionStatus('');
        }
      };

    } catch (error) {
      console.error("Greška:", error);
      setError(error.message || 'Došlo je do greške prilikom povezivanja.');
      setGuacamoleClient(null);
      setIsLoading(false);
      setConnectionStatus('');
    }
  };
```

### Guacamole Klijent Inicijalizacija

Kada korisnik klikne na dugme "Connect", frontend:

1. Šalje zahtev backendu za dobijanje konekcionih detalja
2. Inicijalizuje `Guacamole.Client` koristeći `Guacamole.WebSocketTunnel`
3. Poziva `guac.connect()` sa primljenim parametrima
4. Rukuje greškama i promenama stanja konekcije

## Zaključak

Ovaj projekat pruža funkcionalno rešenje za daljinski pristup udaljenim mašinama putem web pregledača, koristeći snagu Apache Guacamole-a u kombinaciji sa robusnim backendom i reaktivnim frontendom. Kroz Docker Compose, osigurana je laka implementacija, dok dinamičko kreiranje konekcija omogućava fleksibilno upravljanje pristupom udaljenim racunarima.

Ovo rešenje je idealno za demonstraciju, testiranje, ili kao osnova za razvoj složenijih sistema za daljinski pristup.

---

## Dodatne napomene

- Zamenite IP adrese u kodu sa stvarnim adresama vaših servera
- Postavite odgovarajuće environment varijable za produkciju
- Obezbedite sigurnosne mere za pristup MySQL bazi i Guacamole API-ju
- Testirajte konekcije sa stvarnim udaljenim racunarima pre produkcijske upotrebe
