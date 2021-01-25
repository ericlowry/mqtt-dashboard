const express = require('express');
const router = express.Router();
const assert = require('assert');
const debug = require('debug')('api:device');
const mqtt = require('mqtt');

const MAX_DEVICE_SAMPLES = ( 24 * 60 ) / 5; // 24 hours worth of samples

const { MQTT_HOST, MQTT_APP_ID, MQTT_APP_KEY } = process.env;

debug(MQTT_HOST);
debug(MQTT_APP_ID);
debug(MQTT_APP_KEY);

const devices = [
  {
    id: 'env-01',
    label: 'Snails',
    location: 'Dining Room',
  },

  {
    id: 'env-02',
    label: 'Brownie (Beta Fish)',
    location: 'Living Room (Left)',
  },

  {
    id: 'env-03',
    label: 'Bluebell (Beta Fish)',
    location: 'Living Room (Right)',
  },

  {
    id: 'env-04',
    label: 'Crabs',
    location: 'Library (Left)',
  },

  {
    id: 'env-05',
    label: 'Frogs',
    location: 'Library (Right)',
  },
];

const deviceSamples = {
  'env-01': [
    {
      app_id: 'myrealms-home-env',
      dev_id: 'env-01',
      hardware_serial: 'A84041000181C72E',
      port: 2,
      counter: 564,
      payload_raw: 'yygIogDnAQf7f/8=',
      payload_fields: { BS: 3, BV: 2.856, H0: 23.1, T0: 22.1, T1: 20.43 },
      metadata: {
        time: '2021-01-16T22:03:44.002165858Z',
        frequency: 904.7,
        modulation: 'LORA',
        data_rate: 'SF7BW125',
        airtime: 61696000,
        coding_rate: '4/5',
      },
    },
  ],
  'env-02': [
    {
      app_id: 'myrealms-home-env',
      dev_id: 'env-02',
      hardware_serial: 'A840414881827652',
      port: 2,
      counter: 562,
      payload_raw: 'y8AHwwFEAQlNf/8=',
      payload_fields: { BS: 3, BV: 3.008, H0: 32.4, T0: 19.87, T1: 23.81 },
      metadata: {
        time: '2021-01-16T22:03:50.197583226Z',
        frequency: 905.1,
        modulation: 'LORA',
        data_rate: 'SF7BW125',
        airtime: 61696000,
        coding_rate: '4/5',
      },
    },
  ],
  'env-03': [
    {
      app_id: 'myrealms-home-env',
      dev_id: 'env-03',
      hardware_serial: 'A84041859182765B',
      port: 2,
      counter: 562,
      payload_raw: 'y9EHvwE8AQkOf/8=',
      payload_fields: { BS: 3, BV: 3.025, H0: 31.6, T0: 19.83, T1: 23.18 },
      metadata: {
        time: '2021-01-16T22:03:53.67214135Z',
        frequency: 904.1,
        modulation: 'LORA',
        data_rate: 'SF7BW125',
        airtime: 61696000,
        coding_rate: '4/5',
      },
    },
  ],
  'env-04': [
    {
      app_id: 'myrealms-home-env',
      dev_id: 'env-04',
      hardware_serial: 'A84041CA6182765C',
      port: 2,
      counter: 562,
      payload_raw: 'y+cHzwEtAQfif/8=',
      payload_fields: { BS: 3, BV: 3.047, H0: 30.1, T0: 19.99, T1: 20.18 },
      metadata: {
        time: '2021-01-16T22:04:03.895095069Z',
        frequency: 904.3,
        modulation: 'LORA',
        data_rate: 'SF7BW125',
        airtime: 61696000,
        coding_rate: '4/5',
      },
    },
  ],
  'env-05': [
    {
      app_id: 'myrealms-home-env',
      dev_id: 'env-05',
      hardware_serial: 'A840414871827661',
      port: 2,
      counter: 562,
      payload_raw: 'y7sHfgEvAQeFf/8=',
      payload_fields: { BS: 3, BV: 3.003, H0: 30.3, T0: 19.18, T1: 19.25 },
      metadata: {
        time: '2021-01-16T22:04:08.590184623Z',
        frequency: 905.1,
        modulation: 'LORA',
        data_rate: 'SF7BW125',
        airtime: 61696000,
        coding_rate: '4/5',
      },
    },
  ],
};

const ttn = mqtt.connect(`mqtt://${MQTT_HOST}`, {
  username: MQTT_APP_ID,
  password: MQTT_APP_KEY,
});

ttn.on('error', err => {
  console.error(`MQTT_ERROR: ${err}`);
});

ttn.on('connect', () => {
  debug('mqtt: connected');
  ttn.subscribe(`${MQTT_APP_ID}/devices/+/up`, (err, granted) => {
    if (err) console.error(`MQTT_ERROR: ${err}`);
    if (granted) {
      debug(granted);
    }
  });
});

ttn.on('disconnect', () => {
  debug('mqtt: disconnected');
});

ttn.on('message', (topic, payload) => {
  debug(`mqtt: ${topic}`);
  // debug(`mqtt payload: ${payload.toString()}`);
  try {
    const message = JSON.parse(payload);
    delete message.metadata.gateways; // not needed
    deviceSamples[message.dev_id].push(message);
    while (deviceSamples[message.dev_id].length > MAX_DEVICE_SAMPLES)
      deviceSamples[message.dev_id].shift();
    debug(message);
  } catch (error) {
    console.error(`MQTT_ERROR: ${error}`);
  }
});

/* GET a list of devices */
router.get('/', function (req, res, next) {
  res.send(devices);
});

/* GET a device's info */
router.get('/:deviceId', function (req, res, next) {
  const { deviceId } = req.params;
  debug(req.query);
  assert(deviceId);
  const device = devices.find(dev => deviceId === dev.id);
  if (!device) {
    res.status(404).send({ error: 'device not found' });
  } else {
    const samples = deviceSamples[deviceId];
    res.send({ 
      ...device, 
      last: samples.length ? samples[samples.length - 1] : undefined,
      history: "history" in req.query ? samples : undefined
    });
  }
});

module.exports = router;
