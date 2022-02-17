import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { mode } from "@chakra-ui/theme-tools";
const dark = "linear-gradient(to right, #000000, #434343)";
const light = "#f0f0f0";

const theme = extendTheme({
  config: {
    initialColorMode: "dark"
  },
  styles: {
    global: (props) => ({
      body: {
        bg: mode(light, dark)(props),
      }
    })
  }
});

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
