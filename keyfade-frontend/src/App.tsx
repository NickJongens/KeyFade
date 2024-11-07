import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Create from './components/Create';
import View from './components/View';
import NotFound from './components/NotFound';
import theme from './styles/theme'; // Import your custom theme
import './styles/styles.css'; // Import central styles

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Create />} />
          <Route path="/:id/:key" element={<View />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
};

export default App;
