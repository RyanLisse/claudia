# @claudia/ui-kit

A comprehensive, accessible React component library built with TypeScript, Tailwind CSS, and Radix UI primitives.

## Features

✨ **Modern Stack**: Built with React 18, TypeScript, and Tailwind CSS  
🎨 **Design System**: Comprehensive design tokens and theming support  
♿ **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation  
📱 **Responsive**: Mobile-first responsive design  
🎯 **TypeScript**: Full type safety and IntelliSense support  
📚 **Storybook**: Interactive documentation and component playground  
🧪 **Testing**: Comprehensive test coverage with Vitest and Testing Library  
🎭 **Theming**: Dark mode support with CSS custom properties  
⚡ **Performance**: Tree-shakeable exports and optimized bundle size  

## Installation

```bash
npm install @claudia/ui-kit
# or
yarn add @claudia/ui-kit
# or
pnpm add @claudia/ui-kit
```

## Usage

```tsx
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@claudia/ui-kit'
import '@claudia/ui-kit/styles'

function App() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input label="Email" type="email" placeholder="Enter your email" />
        <Button>Get Started</Button>
      </CardContent>
    </Card>
  )
}
```

## Components

### Core Components

- **Button** - Versatile button with variants, sizes, icons, and loading states
- **Input** - Feature-rich input with labels, validation, icons, and addons
- **Card** - Flexible container with header, content, and footer sections

### Design Tokens

Access design tokens for consistent styling:

```tsx
import { colors, spacing, typography } from '@claudia/ui-kit/tokens'

const theme = {
  primaryColor: colors.primary[500],
  spacing: spacing[4],
  fontSize: typography.fontSize.lg,
}
```

### Hooks

Useful hooks for common patterns:

```tsx
import { useDisclosure, useMediaQuery, useFocusTrap } from '@claudia/ui-kit'

function Modal() {
  const { isOpen, open, close } = useDisclosure()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const focusRef = useFocusTrap(isOpen)
  
  // Component logic
}
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Start Storybook
npm run storybook

# Run tests
npm test

# Build package
npm run build
```

### Storybook

View components and documentation at [http://localhost:6006](http://localhost:6006)

```bash
npm run storybook
```

### Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Check accessibility
npm run a11y
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- ✅ Keyboard navigation support
- ✅ Screen reader compatibility  
- ✅ Focus management
- ✅ Color contrast compliance
- ✅ Reduced motion support
- ✅ High contrast mode support

### Focus Management

```tsx
import { useFocusTrap, useKeyboardNavigation } from '@claudia/ui-kit'

// Trap focus within a modal
const focusRef = useFocusTrap(isOpen)

// Handle keyboard navigation in lists
const { handleKeyDown } = useKeyboardNavigation({
  items: menuItems,
  orientation: 'vertical'
})
```

## Theming

### CSS Custom Properties

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

.dark {
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Dark Mode

```tsx
function ThemeProvider() {
  const [theme, setTheme] = useState('light')
  
  return (
    <div className={theme}>
      <App />
    </div>
  )
}
```

## Performance

- **Tree Shaking**: Import only what you need
- **Bundle Size**: Optimized with minimal dependencies
- **Code Splitting**: Async component loading support
- **Memoization**: Built-in performance optimizations

```tsx
// Tree-shakeable imports
import { Button } from '@claudia/ui-kit'

// Or import specific components
import { Button } from '@claudia/ui-kit/components/Button'
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure accessibility compliance
5. Submit a pull request

## License

MIT © Claudia UI Kit