// React 18 entry point that renders the root App inside React.StrictMode.
// This file mounts the application to the DOM element with id "root".

import { ColorModeScript } from '@chakra-ui/react';
import React from 'react';
import { createRoot } from 'react-dom/client';

import AppWrapper from './App';
import theme from './theme';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <AppWrapper />
  </React.StrictMode>
);
