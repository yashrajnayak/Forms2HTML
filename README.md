![Google Form to HTML Converter](/assets/screenshot.jpeg)

A powerful client-side tool that converts Google Forms into clean, customizable HTML5 forms with Bootstrap styling. Perfect for developers who want to integrate Google Forms into their websites with custom styling and handling.

## Features

- 🚀 Zero backend dependencies - runs entirely in browser
- 💅 Modern UI with Bootstrap 5
- 📱 Fully responsive design
- 🔄 Real-time conversion with progress indicator
- 📋 One-click code copying
- 🛡️ Client-side processing - no data sent to servers
- 🎨 Clean, semantic HTML output
- 📝 Generated code with helpful comments
- ✨ Intelligent field handling:
  - Smart label processing
  - Preserves field types and validation
  - Generates semantic HTML with ARIA support
- 🌐 Multiple CORS proxy support with automatic fallback
- ✅ Real-time validation and feedback

## Technical Details

### Supported Form Fields
- ✍️ Text inputs
- 📧 Email fields
- 🔢 Number inputs
- 📝 Textareas
- 🔘 Radio buttons
- ☑️ Checkboxes (with group validation)
- 📋 Select dropdowns

### Technology Stack
- Bootstrap 5.3.0 - Modern UI framework
- Handlebars 4.7.8 - Template rendering
- Highlight.js 11.9.0 - Code syntax highlighting
- Font Awesome 6.4.0 - Icons
- Native JavaScript - Core functionality

## Troubleshooting

### Common Issues
- Form must be publicly accessible
- Required checkbox groups need at least one selection
- CORS proxies may have rate limits
- Some complex form elements may need manual adjustment

### Debug Tips
- Check browser console for detailed error messages
- Verify form URL is public and correctly formatted
- Clear browser cache if seeing outdated results
- Check network tab for CORS-related issues

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
