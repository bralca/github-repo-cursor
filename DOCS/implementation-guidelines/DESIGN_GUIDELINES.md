
# Design Guidelines - GitHub Explorer

## Table of Contents

1. [Overview](#overview)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Component Styling Patterns](#component-styling-patterns)
5. [Layout Principles](#layout-principles)
6. [Animation and Transition Guidelines](#animation-and-transition-guidelines)
7. [Icon System](#icon-system)
8. [Accessibility Considerations](#accessibility-considerations)
9. [Implementation Details](#implementation-details)

## Overview

GitHub Explorer uses a clean, modern design system that enhances the developer experience while maintaining professional aesthetics. The design language focuses on readability, information hierarchy, and consistent visual patterns that make complex GitHub data easy to understand and navigate.

The application follows a responsive, component-based approach with a design system built on Tailwind CSS and shadcn/ui components. Dark and light modes are fully supported, with careful attention to contrast and readability in both themes.

## Color Palette

### Theme Colors

The application uses a HSL color system defined as CSS variables for maximum flexibility between light and dark modes.

#### Light Mode

```css
:root {
  --background: 0 0% 100%; /* #FFFFFF */
  --foreground: 240 10% 3.9%; /* #0A0A0A */
  --card: 0 0% 100%; /* #FFFFFF */
  --card-foreground: 240 10% 3.9%; /* #0A0A0A */
  --popover: 0 0% 100%; /* #FFFFFF */
  --popover-foreground: 240 10% 3.9%; /* #0A0A0A */
  --primary: 240 5.9% 10%; /* #1A1A1A */
  --primary-foreground: 0 0% 98%; /* #FAFAFA */
  --secondary: 240 4.8% 95.9%; /* #F5F5F5 */
  --secondary-foreground: 240 5.9% 10%; /* #1A1A1A */
  --muted: 240 4.8% 95.9%; /* #F5F5F5 */
  --muted-foreground: 240 3.8% 46.1%; /* #757575 */
  --accent: 240 4.8% 95.9%; /* #F5F5F5 */
  --accent-foreground: 240 5.9% 10%; /* #1A1A1A */
  --destructive: 0 84.2% 60.2%; /* #E63939 */
  --destructive-foreground: 0 0% 98%; /* #FAFAFA */
  --border: 240 5.9% 90%; /* #E5E5E5 */
  --input: 240 5.9% 90%; /* #E5E5E5 */
  --ring: 240 5.9% 10%; /* #1A1A1A */
}
```

#### Dark Mode

```css
.dark {
  --background: 222 47% 5%; /* #080c14 */
  --foreground: 210 40% 98%; /* #f1f8ff */
  --card: 222 47% 8%; /* #0c121d */
  --card-foreground: 210 40% 98%; /* #f1f8ff */
  --popover: 222 47% 7%; /* #0b101a */
  --popover-foreground: 210 40% 98%; /* #f1f8ff */
  --primary: 217 91% 60%; /* #3b82f6 */
  --primary-foreground: 210 40% 98%; /* #f1f8ff */
  --secondary: 217 33% 17%; /* #1e293b */
  --secondary-foreground: 210 40% 98%; /* #f1f8ff */
  --muted: 217 33% 17%; /* #1e293b */
  --muted-foreground: 215 20.2% 75%; /* #a4b8d5 */
  --accent: 217 33% 17%; /* #1e293b */
  --accent-foreground: 210 40% 98%; /* #f1f8ff */
  --destructive: 0 84.2% 60.2%; /* #f87171 */
  --destructive-foreground: 210 40% 98%; /* #f1f8ff */
  --border: 217 33% 25%; /* #2a3952 */
  --input: 217 33% 25%; /* #2a3952 */
  --ring: 224 76.3% 48%; /* #4f46e5 */
}
```

### Semantic Colors

| Category   | Light Mode     | Dark Mode      | Usage                         |
|------------|----------------|----------------|-------------------------------|
| Success    | `#22c55e`      | `#22c55e`      | Success states, completion, positive changes |
| Warning    | `#f59e0b`      | `#fbbf24`      | Warnings, attention required  |
| Error      | `#ef4444`      | `#f87171`      | Errors, destructive actions   |
| Info       | `#3b82f6`      | `#60a5fa`      | Information, neutral notifications |
| Addition   | `#22c55e`      | `#7ee787`      | Code additions in diff views  |
| Deletion   | `#ef4444`      | `#ffa198`      | Code deletions in diff views  |

### Color Usage Guidelines

- **Primary Color**: Use for main actions, links, and primary UI elements that need emphasis
- **Secondary Color**: Use for secondary actions, backgrounds of less important UI elements
- **Accent Color**: Use sparingly to highlight important UI elements or data points
- **Background Colors**: 
  - Main background: `bg-background`
  - Card backgrounds: `bg-card` or for glass effect: `bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm`
- **Text Colors**:
  - Primary text: `text-foreground`
  - Secondary/muted text: `text-muted-foreground`
- **Status Colors**:
  - Success: Green shades for positive actions, completions
  - Warning: Amber/orange shades for caution, pending states
  - Error: Red shades for errors, destructive actions
  - Info: Blue shades for informational content

## Typography

### Font Families

The application uses a system font stack for optimal performance and native appearance:

```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
```

For code and monospaced content:

```css
font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
```

### Type Scale

| Element             | Size Class   | Actual Size | Weight     | Line Height | Usage                    |
|---------------------|--------------|-------------|------------|-------------|--------------------------|
| h1 (Large Heading)  | text-4xl     | 2.25rem     | font-bold  | leading-tight | Page titles, hero sections |
| h2 (Medium Heading) | text-2xl     | 1.5rem      | font-bold  | leading-tight | Section headings        |
| h3 (Small Heading)  | text-xl      | 1.25rem     | font-semibold | leading-snug | Subsection headings      |
| h4 (Mini Heading)   | text-lg      | 1.125rem    | font-medium | leading-snug | Component headings      |
| Body                | text-base    | 1rem        | font-normal | leading-normal | Main content text       |
| Small Text          | text-sm      | 0.875rem    | font-normal | leading-normal | Secondary information   |
| Extra Small         | text-xs      | 0.75rem     | font-normal | leading-tight | Meta information, captions |
| Code                | text-sm      | 0.875rem    | font-mono  | leading-normal | Code snippets           |

### Font Weight Guidelines

- `font-bold` (700): Headings, buttons, emphasized text
- `font-semibold` (600): Subheadings, interactive elements
- `font-medium` (500): Component titles, slightly emphasized text
- `font-normal` (400): Body text, regular content
- `font-light` (300): De-emphasized content

### Line Heights and Spacing

- Headings: `leading-tight` (1.25) for compact layout
- Body text: `leading-normal` (1.5) for readability
- Small text: `leading-relaxed` (1.625) for better readability at small sizes

### Paragraph Spacing

- `mb-4` for paragraph spacing
- `mb-6` for section spacing
- `mb-8` to `mb-16` for major section breaks

## Component Styling Patterns

### Buttons

The application uses shadcn/ui button components with several variants:

```jsx
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outline Action</Button>
<Button variant="ghost">Subtle Action</Button>
<Button variant="link">Link Style</Button>
<Button variant="destructive">Destructive Action</Button>
```

Size variants:

```jsx
<Button size="default">Default Size</Button>
<Button size="sm">Small Size</Button>
<Button size="lg">Large Size</Button>
<Button size="icon">Icon Button</Button>
```

Button with icon:

```jsx
<Button>
  <SomeIcon className="mr-2 h-4 w-4" />
  Button with Icon
</Button>
```

### Form Elements

Input fields:

```jsx
<Input type="text" placeholder="Standard input" />
<Input type="text" disabled placeholder="Disabled input" />
```

Select fields:

```jsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

Checkbox:

```jsx
<Checkbox id="terms" />
<label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
  Accept terms and conditions
</label>
```

### Cards

Standard card:

```jsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

Glass effect card:

```jsx
<Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 shadow-sm">
  {/* Card content */}
</Card>
```

### Navigation Elements

Tabs:

```jsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Tab 1 content</TabsContent>
  <TabsContent value="tab2">Tab 2 content</TabsContent>
</Tabs>
```

### Data Visualization

Based on the repository files, charts use the Recharts library with custom styling:

```jsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip 
      contentStyle={{ 
        backgroundColor: 'rgba(23, 23, 23, 0.9)',
        border: '1px solid rgba(63, 63, 70, 0.4)',
        borderRadius: '0.5rem',
        color: '#f1f5f9'
      }}
    />
    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

For diff views, custom styling is applied:

```css
.diff-container {
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  font-size: 12px;
  line-height: 20px;
}
/* Additional diff styling in CommitStyles.tsx */
```

## Layout Principles

### Grid System

The application uses Tailwind's grid and flex utilities for layout:

- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` for responsive grid layouts
- `flex flex-col md:flex-row gap-4` for flexible layouts

### Spacing Units

Tailwind's spacing scale is used throughout:

- `p-4` (1rem): Standard padding
- `px-4 py-2`: Horizontal and vertical padding (buttons)
- `m-4`: Standard margin
- `gap-4`: Standard gap between grid/flex items

### Responsive Breakpoints

Following Tailwind's default breakpoints:

- `sm`: 640px and above
- `md`: 768px and above
- `lg`: 1024px and above
- `xl`: 1280px and above
- `2xl`: 1536px and above

Usage example:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

### Component Spacing Guidelines

- Cards and sections: `mb-6` to `mb-8` for vertical spacing
- Within cards:
  - Header: `mb-4`
  - Between elements: `mb-4` or `gap-4` (flex/grid)
  - Form fields: `mb-4` between fields

### Page Layout Patterns

Most pages follow a consistent layout:

1. Page header with title and actions
2. Filtering/selection controls
3. Main content area (cards, tables, visualizations)
4. Pagination or load more controls (where applicable)

## Animation and Transition Guidelines

The application uses subtle animations to enhance the user experience:

### Keyframes

```css
@keyframes fade-up {
  "0%": {
    opacity: "0",
    transform: "translateY(10px)"
  },
  "100%": {
    opacity: "1",
    transform: "translateY(0)"
  }
},

@keyframes fade-in {
  "0%": {
    opacity: "0"
  },
  "100%": {
    opacity: "1"
  }
}
```

### Animation Classes

```css
.animate-fade-up {
  animation: fade-up 0.5s ease-out;
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
```

### Transition Standards

- Duration: 
  - Fast (150ms): Simple transitions like hover states
  - Medium (300ms): Opacity, color changes, small movements
  - Slow (500ms): Complex animations, larger movements

- Easing functions:
  - `ease-out`: Most transitions (smooth deceleration)
  - `ease-in-out`: Complex transitions
  - `linear`: Continuous animations

### Animation Usage Guidelines

- Use animations sparingly to avoid overwhelming users
- Animate elements sequentially using delays when appropriate
- Ensure animations don't impede user interaction
- Respect user preferences for reduced motion

```jsx
// Example of staggered animation with delays
<div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
  {/* Content */}
</div>
```

## Icon System

GitHub Explorer uses the Lucide React icon library for consistent iconography.

### Icon Usage

```jsx
import { Star, GitFork, GitPullRequest } from "lucide-react";

// Basic usage
<Star className="w-4 h-4" />

// With color
<Star className="w-4 h-4 text-yellow-500" />

// In a button
<Button>
  <Star className="w-4 h-4 mr-2" />
  Star
</Button>
```

### Icon Size Guidelines

- `w-3 h-3`: Extra small icons (badges, tight spaces)
- `w-4 h-4`: Standard size for inline icons
- `w-5 h-5`: Medium icons (navigation, buttons)
- `w-6 h-6`: Large icons (feature highlights)
- `w-8 h-8` and above: Extra large icons (illustrations, empty states)

### Icon Color Guidelines

Icons should inherit text color by default (`currentColor`) but can be styled with text color utilities:

- Primary icons: Text color (inherit)
- Accent icons: `text-primary`
- Status icons: Semantic colors (success, warning, error)
- Muted icons: `text-muted-foreground`

## Accessibility Considerations

### Color Contrast

- All text must maintain a minimum contrast ratio of 4.5:1 against its background
- Interactive elements must have distinct focus states
- Don't rely solely on color to convey information

### Keyboard Navigation

- All interactive elements must be focusable and operable with keyboard
- Use appropriate focus styles: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Logical tab order following the visual layout

### Screen Readers

- Use semantic HTML elements
- Include aria attributes where appropriate
- Provide alternative text for images and icons

```jsx
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

### Motion Sensitivity

- Honor user preferences with `prefers-reduced-motion` media query
- Provide static alternatives for essential animated content

## Implementation Details

### Tailwind Configuration

The application extends Tailwind's default configuration with custom colors, animations, and utilities:

```javascript
// tailwind.config.ts
theme: {
  container: {
    center: true,
    padding: "2rem",
    screens: {
      "2xl": "1400px",
    },
  },
  extend: {
    colors: {
      // Theme colors (derived from CSS variables)
    },
    keyframes: {
      // Custom keyframes
    },
    animation: {
      // Custom animations
    },
  },
},
plugins: [require("tailwindcss-animate")],
```

### Global CSS Patterns

The application includes global CSS for base styling, dark mode, and custom utilities:

```css
@layer base {
  :root {
    /* CSS variables */
  }
  
  .dark {
    /* Dark mode CSS variables */
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
  }

  /* Custom scrollbar styles */
  ::-webkit-scrollbar {
    @apply w-1.5 h-1.5;
  }

  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gray-300/50 dark:bg-gray-600/80 rounded-full hover:bg-gray-300/70 dark:hover:bg-gray-600 transition-colors;
  }
}

.glass-card {
  @apply bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 shadow-sm;
}
```

### Component Composition

The application follows a composable component approach:

1. **Base components**: Low-level UI primitives from shadcn/ui
2. **Composite components**: Domain-specific components that compose multiple base components
3. **Page layouts**: Compositions of composite components to form complete pages

### Styling Guidelines

- Use Tailwind utility classes for most styling
- Avoid inline styles except for dynamic values
- Use CSS variables for theming
- Extract common patterns to reusable components
- Use consistent class ordering:
  1. Layout (display, position)
  2. Box model (width, height, margin, padding)
  3. Typography (font, text)
  4. Visual (color, background, border)
  5. Animation/misc (transition, transform)

### Dark Mode Implementation

The application uses a class-based approach to toggle dark mode:

```jsx
// Example from ThemeToggle.tsx
const { theme, toggleTheme } = useTheme();

return (
  <Button variant="ghost" onClick={toggleTheme}>
    {theme === "light" ? <Moon /> : <Sun />}
  </Button>
);
```

The dark mode class triggers the alternative CSS variables defined in `:root` vs `.dark`.

### Responsive Design Approach

- Mobile-first design using Tailwind's responsive prefixes
- Flexible layouts that adapt to screen size
- Component-level responsive behavior
- Specialized layouts for mobile vs desktop on complex UIs

```jsx
// Example of responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="col-span-1 md:col-span-2 lg:col-span-1">
    {/* Responsive content */}
  </div>
</div>
```
