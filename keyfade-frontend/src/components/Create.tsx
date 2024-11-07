import React, { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Center,
  Flex,
  useToast,
  Image,
} from '@chakra-ui/react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import Link from './Link';
import '../styles/Create.css';

const logoUrl = import.meta.env.VITE_LOGO_URL || '/logo.png';
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001';
const hmacSecret = import.meta.env.VITE_HMAC_SECRET || '';

const passwordLabel = import.meta.env.VITE_CREATE_PASSWORD_LABEL || 'Password to Encrypt:';
const expiryOptionsLabel = import.meta.env.VITE_CREATE_EXPIRY_OPTIONS_LABEL || 'Expiry Options:';

const toastErrorTitle = import.meta.env.VITE_CREATE_TOAST_ERROR_TITLE || 'Error';
const toastErrorDescription = import.meta.env.VITE_CREATE_TOAST_ERROR_DESCRIPTION || 'Failed to generate an encrypted link.';

const Create: React.FC = () => {
  const [credential, setCredential] = useState<string>('');
  const [expiry, setExpiry] = useState<number>(7); // default to 7 days
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const toast = useToast();

  const generateHMAC = (method: string, url: string, body: object): string => {
    const strippedUrl = url.replace(/^https?:\/\//, '');
    const baseString = `${method}${strippedUrl}${JSON.stringify(body)}`;
    const signature = CryptoJS.HmacSHA256(baseString, hmacSecret).toString(CryptoJS.enc.Hex);
    return signature;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const body = {
      name: credential,
      value: credential,
      expiryDays: expiry,
    };

    try {
      const signature = generateHMAC('POST', `${backendUrl}/api/create`, body);

      const response = await axios.post(`${backendUrl}/api/create`, body, {
        headers: {
          signature: signature,
        },
      });

      const { secretId, key } = response.data;
      const generatedUrl = `${frontendUrl}/${secretId}/${key}`;
      setGeneratedLink(generatedUrl);
    } catch (error) {
      toast({
        title: toastErrorTitle,
        description: toastErrorDescription,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSliderChange = (value: number): void => {
    const expiryOptions = [1, 7, 14, 30, 60, 90];
    setExpiry(expiryOptions[value]);
  };

  const getExpiryText = (days: number): string => {
    switch (days) {
      case 1: return '1 Day';
      case 7: return '1 Week (7 Days)';
      case 14: return '2 Weeks (14 Days)';
      case 30: return '1 Month (30 Days)';
      case 60: return '2 Months (60 Days)';
      case 90: return '3 Months (90 Days)';
      default: return 'Unknown Expiry';
    }
  };

  const sliderColor = import.meta.env.VITE_EXPIRY_SLIDER_COLOR || 'blue';
  const textColor = import.meta.env.VITE_TEXT_COLOR || 'black';
  const buttonColor = import.meta.env.VITE_BUTTON_COLOR || 'blue';

  useEffect(() => {
    const faviconUrl = import.meta.env.VITE_FAVICON_URL || '/favicon.ico';
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    link.type = 'image/x-icon';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <Center h="100vh" flexDirection="column">
      <Image 
        src={logoUrl} 
        alt="Logo" 
        width={{ base: '60%', sm: '40%', md: '30%' }} // Scales with the box width
        maxWidth="500px" // Add a maximum width to prevent it from getting too large
        mb={4} // Add some margin below the logo
      />
      <Flex 
        direction="column" 
        p={6} 
        borderRadius="15px" 
        boxShadow="lg" 
        width={{ base: '90%', sm: '80%', md: '560px' }}
        maxHeight="600px" // Set a maximum height
        height="auto" // Change height to auto so it adjusts based on content
        backgroundColor="white" 
      >
        {!generatedLink ? (
          <form onSubmit={handleSubmit} style={{ height: '100%' }}>
            <Flex direction="column" justify="center" height="100%">
              <FormControl mb={4} isRequired>
                <FormLabel className="label" textAlign="center">{passwordLabel}</FormLabel>
                <Input 
                  type="text" 
                  value={credential} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCredential(e.target.value)} 
                  autoComplete="off" // Prevent autocomplete
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel className="label" textAlign="center">{expiryOptionsLabel}</FormLabel>
                <Slider
                  min={0}
                  max={5}
                  value={[1, 7, 14, 30, 60, 90].indexOf(expiry)}
                  onChange={handleSliderChange}
                  step={1}
                  width="100%"
                  colorScheme={sliderColor}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text textAlign="center" mt={2} color={textColor}>{getExpiryText(expiry)}</Text>
              </FormControl>
              <Button type="submit" colorScheme={buttonColor} width="full">Generate Link</Button>
            </Flex>
          </form>
        ) : (
          <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
            <Link generatedLink={generatedLink} />
          </Flex>
        )}
      </Flex>
    </Center>
  );
};

export default Create;
