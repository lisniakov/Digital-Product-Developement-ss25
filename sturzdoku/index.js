// index.js   (project root)

import 'react-native-url-polyfill/auto';     // keep the URL polyfill
import { registerRootComponent } from 'expo';
import App from './App';

// This does two things: 
// 1. Calls AppRegistry.registerComponent('main', () => App)
// 2. Sets up Fast Refresh, gesture handler, etc.
registerRootComponent(App);
