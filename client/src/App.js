import './App.css';
import useFetch from 'use-http';
//import { useState, useEffect } from 'react';

import useInterval from 'react-use/esm/useInterval';

function Measures({ payload }) {
  const { BS, BV, H0, T0, T1 } = payload;
  return (
    <div className="Measures">
      <div className="Measures__raw">
        BS: {BS}, BV: {BV}, H0: {H0}, T0: {T0}, T1: {T1}
      </div>
      <div className="Measures__focus_temp">
        {Number((T1 * 9) / 5 + 32).toFixed(1)}
      </div>
    </div>
  );
}

function Device({ device }) {
  const { get, loading, error, data = {} } = useFetch(
    `/api/device/${device.id}`,
    { cachePolicy: 'no-cache'},
    []
  );

  useInterval(() => {
    console.log(`beep: ${device.id}`);
  }, 5 * 1000);

  return (
    <div className="Device">
      <br />
      {device.label} ({device.id})<br />
      {device.location}
      {error && 'error'}
      {loading && 'loading'}
      {data.last && <Measures payload={data.last.payload_fields} />}
    </div>
  );
}

function App() {
  const options = {};
  const { loading, error, data = [] } = useFetch('/api/device', options, []);

  return (
    <div className="App">
      {error && 'Error'}
      {loading && 'Loading'}
      {data.map(device => (
        <Device key={device.id} device={device} />
      ))}
    </div>
  );
}

export default App;
