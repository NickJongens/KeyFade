import { useEffect, useState } from 'react';
import { Box, Button, Text, Center, Flex, useToast, Image, Input } from '@chakra-ui/react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js'; // Using CryptoJS for HMAC
import '../styles/View.css';

const logoUrl = import.meta.env.VITE_LOGO_URL || '/logo.png';
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
const faviconUrl = import.meta.env.VITE_FAVICON_URL || '/favicon.ico'; // Optional favicon from .env
const hmacSecret = import.meta.env.VITE_HMAC_SECRET || ''; // Get HMAC secret from .env

const View = () => {
  const { id, key } = useParams<{ id: string; key: string }>();
  const [secret, setSecret] = useState<string>(''); 
  const toast = useToast();
  const navigate = useNavigate();

  // Effect to set the favicon
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link); // Cleanup function to remove the favicon on unmount
    };
  }, [faviconUrl]);

  const generateHMAC = (method: string, url: string, body: string) => {
    // Strip the protocol from the URL
    const strippedUrl = url.replace(/^https?:\/\//, '');
    const host = strippedUrl.split('/')[0]; // Extract host from stripped URL
    const path = strippedUrl.substring(host.length); // Get the path after the host
    
    // Construct the base string without the protocol
    const baseString = `${method}${host}${path}${method === 'POST' ? JSON.stringify(body) : ''}`;
    return CryptoJS.HmacSHA256(baseString, hmacSecret).toString(CryptoJS.enc.Hex); // Return the calculated signature
  };

  useEffect(() => {
    const fetchSecret = async () => {
      try {
        const method = 'GET';
        const body = ''; // No request body for GET
        const signature = generateHMAC(method, `${backendUrl}/api/secrets/${id}/${key}`, body); // Generate HMAC signature

        const response = await axios.get(`${backendUrl}/api/secrets/${id}/${key}`, {
          headers: {
            'x-signature': signature, // Send the HMAC signature in the request header
          },
        });

        if (response.data && response.data.value) {
          setSecret(response.data.value);
        } else {
          setSecret('');
          toast({
            title: 'Error',
            description: 'Secret value not found.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to retrieve the secret.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchSecret();
  }, [id, key, toast]);

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this secret? This action cannot be undone.');
    if (confirmed) {
      try {
        const method = 'DELETE';
        const body = ''; // No request body for DELETE
        const signature = generateHMAC(method, `${backendUrl}/api/secrets/${id}/${key}`, body); // Generate HMAC signature

        await axios.delete(`${backendUrl}/api/secrets/${id}/${key}`, {
          headers: {
            'x-signature': signature, // Send the HMAC signature in the request header
          },
        });

        toast({
          title: 'Secret Deleted',
          description: 'The secret has been successfully deleted.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setTimeout(() => navigate('/'), 2000);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete the secret.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    toast({
      title: 'Copied to Clipboard',
      description: 'The secret has been copied to your clipboard.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  // Get colors and wording from the environment variables
  const secretLabel = import.meta.env.VITE_SECRET_LABEL || 'Secret:';
  const paragraphText = import.meta.env.VITE_SECRET_PARAGRAPH_TEXT || ''; 
  const copyButtonColor = import.meta.env.VITE_BUTTON_COLOR || 'blue'; 
  const deleteButtonColor = import.meta.env.VITE_DELETE_BUTTON_COLOR || 'red'; 
  const textColor = import.meta.env.VITE_TEXT_COLOR || 'black'; 

  return (
    <Center h="100vh" flexDirection="column">
      <Image 
        src={logoUrl} 
        alt="Logo" 
        width={{ base: '60%', sm: '40%', md: '30%' }} // Scales with the box width
        maxWidth="500px" // Add a maximum width to prevent it from getting too large
        mb={4} // Add some margin below the logo
      />
      <Box bg="white" p={6} borderRadius="15px" boxShadow="lg" width={{ base: '90%', sm: '80%', md: '560px' }}>
        <Text className="label" color={textColor} marginBottom="4" fontWeight="normal">{secretLabel}</Text>
        <Input
          type="text"
          value={secret}
          readOnly
          width="100%" 
          borderRadius="15px"
          textAlign="center" // Center the text inside the input box
          mb={4}
        />
        <Flex mt={4} justifyContent="space-between">
          <Button onClick={handleDelete} colorScheme={deleteButtonColor} width="20%">Delete</Button>
          <Button onClick={handleCopy} colorScheme={copyButtonColor} width="75%">Copy</Button>
        </Flex>
        {paragraphText && (
          <Text mt={4} color={textColor} textAlign="center">{paragraphText}</Text>
        )}
      </Box>
    </Center>
  );
};

export default View;
