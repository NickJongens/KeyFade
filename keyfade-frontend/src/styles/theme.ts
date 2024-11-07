// styles/theme.ts
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  components: {
    Button: {
      baseStyle: {
        borderRadius: '75px', // Set the desired border radius
      },
    },
    Input: {
      baseStyle: {
        borderRadius: '75px', // Match the border radius of the buttons
        borderColor: 'gray.300', // Set border color
        _focus: {
          borderColor: 'blue.500', // Change border color on focus
          boxShadow: '0 0 0 1px blue.500', // Add a focus shadow
        },
      },
    },
    Flex: {
      baseStyle: {
        borderRadius: '15px', // Consistent border radius for Flex components
        padding: '16px', // Add padding for better spacing
      },
    },
  },
});

export default theme;
