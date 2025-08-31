# Engix.dev Website

A modern, responsive single-page website showcasing engineering services with AI integration.

## Features

- **Fixed Header**: Always-visible messaging about engineering passion and AI
- **Clickable Service Cards**: Three main service areas with interactive overlays
- **Contact Form Modal**: Deep dive request form with validation
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern UI/UX**: Clean, minimalistic design with smooth animations

## Project Structure

```
00-ENGIX/
├── index.html          # Main HTML file
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality and form handling
├── images/             # Image assets directory
├── PRD_engix_dev.md   # Product Requirements Document
├── ToDo_engix_dev_v2.md # Development checklist
└── README.md           # This file
```

## Setup Instructions

### 1. Local Development
1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. The website will work locally for testing

### 2. Image Setup
Place the following images in the `images/` directory:
- `contact-ai-modified.jpg` - Personal AI-modified picture for contact section
- `product-development.jpg` - Image representing product development services
- `technical-assistance.jpg` - Image representing technical assistance services

**Note**: If images are not available, the website will show broken image placeholders. Replace with actual images before deployment.

### 3. Form Backend Integration
The contact form currently uses a simulated submission. To enable actual email notifications:

1. Update the `submitForm()` function in `script.js`
2. Replace the placeholder with your preferred email service:
   - **SendGrid**: For reliable email delivery
   - **SMTP**: For custom email server integration
   - **Netlify Forms**: For serverless form handling
   - **Formspree**: For simple form processing

## Development Status

### Completed ✅
- [x] Project structure setup
- [x] HTML structure with fixed header
- [x] CSS styling with responsive design
- [x] JavaScript functionality and form handling
- [x] Modal contact form
- [x] Responsive layout for all devices
- [x] SEO meta tags and optimization

### Pending 🔄
- [ ] Image assets (contact-ai-modified.jpg, product-development.jpg, technical-assistance.jpg)
- [ ] Email backend integration
- [ ] Form spam protection (reCAPTCHA)
- [ ] Hosting deployment

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Features

- Optimized CSS with efficient selectors
- Lazy loading animations using Intersection Observer
- Minimal JavaScript footprint
- Responsive images with proper sizing
- Smooth transitions and hover effects

## SEO Features

- Semantic HTML structure
- Meta description and keywords
- Proper heading hierarchy
- Alt text for images
- Mobile-friendly responsive design

## Contributing

This is a single-page website project. For modifications:
1. Update the relevant HTML, CSS, or JavaScript files
2. Test responsiveness across different screen sizes
3. Validate form functionality
4. Update this README if needed

## License

This project is for the Engix engineering services website.
