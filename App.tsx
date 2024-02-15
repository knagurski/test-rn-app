import React from 'react';
import {StyleSheet, Text, View, Button} from 'react-native';
import {
  initialize,
  Event,
  Event as FFEvent,
  Result,
  VariationValue,
} from '@harnessio/ff-javascript-client-sdk';
import {useState, useEffect} from 'react';
import {Buffer} from 'buffer';

if (!global.btoa) {
  global.btoa = str => Buffer.from(str, 'utf-8').toString('base64');
}
if (!global.Buffer) {
  global.Buffer = Buffer;
}
const flagName = 'apptestflag';
const cfTarget = {identifier: 'HarnessRNSampleApp'};
const apiKey = '69383d81-8167-4960-a18c-fdbccb93a480'
let client: Result;

function initClient() {
  const options = {
    streamEnabled: true,
    debug: true,
    pollingEnabled: true,
    // pollingInterval: 60000,
    cache: false,
    // streamer: RNStreamer
  };
  try {
    client = initialize(apiKey, cfTarget, options);
    // Diagnostic events
    const onNetworkError = (errorType: Event) => (e: any) => {
      console.error('Network error!!!! :', errorType, e);
    };
    const onAuthError = onNetworkError(FFEvent.ERROR_AUTH);
    const onStreamError = onNetworkError(FFEvent.ERROR_STREAM);
    const onFetchFlagError = onNetworkError(FFEvent.ERROR_FETCH_FLAG);
    const onFetchFlagsError = onNetworkError(FFEvent.ERROR_FETCH_FLAGS);
    const onMetricsError = onNetworkError(FFEvent.ERROR_METRICS);
    client.on(FFEvent.ERROR_AUTH, onAuthError);
    client.on(FFEvent.ERROR_STREAM, onStreamError);
    client.on(FFEvent.ERROR_FETCH_FLAG, onFetchFlagError);
    client.on(FFEvent.ERROR_FETCH_FLAGS, onFetchFlagsError);
    client.on(FFEvent.ERROR_METRICS, onMetricsError);
    client.on(Event.DISCONNECTED, () => {
      console.log('Disconnected');
    });
    client.on(Event.CONNECTED, () => {
      console.log('Connected');
    });
    client.on(Event.POLLING, () => {
      console.log('Polling');
    });
    client.on(Event.POLLING_STOPPED, () => {
      console.log('Polling stopped');
    });
  } catch (err) {
    console.log(err);
  }
}

initClient();

function App(): React.JSX.Element {
  const [flagValue, setFlagValue] = useState<VariationValue | null>(null);

  async function evalFlag() {
    console.log('Eval');
    let res = client.variation(flagName, false, true);
    console.log('Eval result: ', res);
    setFlagValue(res.value);
  }

  useEffect(() => {
    client.on(Event.READY, flags => {
      console.log('Flags loaded from cache: ', flags);
      for (var flag in flags) {
        console.log('Flag: ', flag);
        console.log('Value: ', flags[flag]);
        if (flag == flagName) {
          setFlagValue(flags[flag]);
        }
      }
    });
    client.on(Event.CHANGED, flagInfo => {
      console.log('Flag changed: ', flagInfo);
      if (flagInfo.flag == flagName) {
        setFlagValue(flagInfo.value);
      }
    });
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>
        Feature flag '{flagName}' is {JSON.stringify(flagValue)} YEO!
      </Text>
      <Button title="Check Status" color="#f194ff" onPress={() => evalFlag()}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
});
export default App;