import React, { useEffect, useState } from 'react';
import { Flex, Input, Button as ChakraButton, Text as ChakraText, useToast } from '@chakra-ui/react';

interface LinkProps {
  generatedLink: string;
}

const Link: React.FC<LinkProps> = ({ generatedLink }) => {
  const toast = useToast();
  const [isButtonFlashing, setIsButtonFlashing] = useState(true);
  const [isTextFlashing, setIsTextFlashing] = useState(false);
  const [showBelowLinkText, setShowBelowLinkText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsButtonFlashing(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const faviconUrl = import.meta.env.VITE_FAVICON_URL || '/favicon.jpeg';
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({
      title: import.meta.env.VITE_LINK_TOAST_TITLE || 'Link Copied',
      description: import.meta.env.VITE_LINK_TOAST_DESC || 'The link has been copied to your clipboard.',
      status: 'info',
      duration: 3000,
      isClosable: false,
    });

    setShowBelowLinkText(true);
    setTimeout(() => {
      setIsTextFlashing(true);
      setTimeout(() => setIsTextFlashing(false), 500);
    }, 500);
  };

  const belowLinkText = import.meta.env.VITE_LINK_BELOW_TEXT || "Please remember to send this link.";
  const buttonColor = import.meta.env.VITE_LINK_BUTTON_COLOR || 'purple';
  const textColor = import.meta.env.VITE_TEXT_COLOR || 'black';
  const generatedLinkLabel = import.meta.env.VITE_LINK_GENERATED_LABEL || "Encrypted Link:";
  const copyLinkLabel = import.meta.env.VITE_LINK_COPY_BUTTON || "Copy Link";

  return (
    <Flex direction="column" alignItems="center" justifyContent="center" width="100%" p={4}>
      <ChakraText 
        mb={4} 
        className="label"
        fontWeight="normal" // Set font weight to normal
        maxWidth="600px" // Set a max width to prevent the text from being too wide on 4K
        textAlign="center"
      >
        {generatedLinkLabel}
      </ChakraText>
      
      <Input 
        type="text" 
        value={generatedLink} 
        readOnly 
        width="100%" 
        maxWidth="600px" // Prevents input from being too large on higher resolutions
        mb={2} 
      />

      <ChakraButton 
        mt={2} 
        onClick={handleCopy} 
        colorScheme={buttonColor} 
        width="full" 
        maxWidth="600px" // Ensure the button doesn't get too wide
        _hover={{ transform: isButtonFlashing ? 'scale(1.05)' : 'none', opacity: isButtonFlashing ? 0.7 : 1 }} 
        transition="all 0.3s"
      >
        {copyLinkLabel}
      </ChakraButton>

      {showBelowLinkText && (
        <ChakraText 
          mt={4} 
          textAlign="center"
          color={textColor} 
          fontWeight="normal" // Set font weight to normal for below text as well
          maxWidth="600px" // Limit width for the text as well
          _hover={{ transform: isTextFlashing ? 'scale(1.05)' : 'none', opacity: isTextFlashing ? 0.7 : 1 }} 
          transition="all 0.3s"
        >
          {belowLinkText}
        </ChakraText>
      )}
    </Flex>
  );
};

export default Link;
