import { useEffect } from 'react';
import { Center, Text, Button, Image } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import '../styles/NotFound.css';

const logoUrl = import.meta.env.VITE_LOGO_URL || '/logo.png';

const NotFound = () => {
  const navigate = useNavigate();

  // Favicon logic
  useEffect(() => {
    const faviconUrl = import.meta.env.VITE_FAVICON_URL || '/favicon.ico';
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const buttonColor = import.meta.env.VITE_NOT_FOUND_BUTTON_COLOR || 'blue'; 
  const textColor = import.meta.env.VITE_TEXT_COLOR || 'black'; 
  const notFoundMessage = import.meta.env.VITE_NOT_FOUND_MESSAGE || '404 - Page Not Found'; 
  const buttonLabel = import.meta.env.VITE_NOT_FOUND_BUTTON_LABEL || 'Go to Home';

  return (
    <Center h="100vh" flexDirection="column">
      {/* Display the logo with responsive styles */}
      <Image 
        src={logoUrl} 
        alt="Logo" 
        width={{ base: '60%', sm: '40%', md: '30%' }} // Responsive scaling
        maxWidth="500px" // Maximum width to prevent excessive growth
        mb={4} 
      />
      <Text fontSize="2xl" mb={4} color={textColor}>
        {notFoundMessage}
      </Text>
      <Button colorScheme={buttonColor} onClick={() => navigate('/')}>
        {buttonLabel}
      </Button>
    </Center>
  );
};

export default NotFound;
