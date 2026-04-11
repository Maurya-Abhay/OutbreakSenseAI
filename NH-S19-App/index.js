import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import App from './App';
import { AuthProvider } from './src/context/AuthContext';

// Wrap App with SafeAreaProvider to enable useSafeAreaInsets hook
// and AuthProvider for global authentication state
const RootApp = () => (
  <SafeAreaProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </SafeAreaProvider>
);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(RootApp);
