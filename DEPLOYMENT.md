# Deployment Guide for engix.dev

This guide covers deploying your website to various hosting platforms.

## 🚀 **Option 1: GitHub Pages (Recommended - Free)**

GitHub Pages is perfect for static websites and offers free hosting with automatic deployments.

### Setup Steps:

1. **Push your code to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/engix-website.git
   git push -u origin master
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Select "Deploy from a branch"
   - Choose "gh-pages" branch
   - Click "Save"

3. **Automatic Deployment:**
   - The GitHub Actions workflow will automatically deploy on every push
   - Your site will be available at: `https://YOUR_USERNAME.github.io/engix-website`

4. **Custom Domain (Optional):**
   - In GitHub Pages settings, add your custom domain: `engix.dev`
   - Update your DNS records to point to GitHub Pages

### Benefits:
- ✅ **Free hosting**
- ✅ **Automatic deployments**
- ✅ **SSL certificate included**
- ✅ **CDN for fast global access**
- ✅ **Version control integration**

## 🌐 **Option 2: Netlify (Professional - Free Tier)**

Netlify offers advanced features like form handling, serverless functions, and global CDN.

### Setup Steps:

1. **Sign up at [Netlify.com](https://netlify.com)**
2. **Connect your GitHub repository:**
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Set build command: `npm run build` (or leave empty for static site)
   - Set publish directory: `.` (root directory)

3. **Configure form handling:**
   - Go to "Forms" in your site dashboard
   - Netlify will automatically detect your contact form
   - You can view submissions in the dashboard

4. **Custom domain setup:**
   - Go to "Domain management"
   - Add your custom domain: `engix.dev`
   - Follow DNS configuration instructions

### Benefits:
- ✅ **Free tier with generous limits**
- ✅ **Built-in form handling**
- ✅ **Global CDN**
- ✅ **SSL certificates**
- ✅ **Preview deployments**

## ☁️ **Option 3: Vercel (Modern - Free Tier)**

Vercel is excellent for modern web applications with automatic deployments.

### Setup Steps:

1. **Sign up at [Vercel.com](https://vercel.com)**
2. **Import your GitHub repository:**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a static site
   - Click "Deploy"

3. **Custom domain:**
   - Go to "Settings" → "Domains"
   - Add your custom domain: `engix.dev`
   - Configure DNS as instructed

### Benefits:
- ✅ **Free tier available**
- ✅ **Automatic deployments**
- ✅ **Global edge network**
- ✅ **Analytics included**
- ✅ **Preview deployments**

## 🔧 **Option 4: Traditional Web Hosting**

For complete control over your hosting environment.

### Setup Steps:

1. **Purchase hosting plan** (e.g., Bluehost, HostGator, SiteGround)
2. **Upload files via FTP/SFTP:**
   - Use FileZilla or similar FTP client
   - Upload all files to `public_html` directory
   - Ensure file permissions are correct (644 for files, 755 for directories)

3. **Configure domain:**
   - Point your domain to your hosting provider's nameservers
   - Set up SSL certificate (usually included with hosting)

## 📱 **Testing Your Deployment**

After deployment, test these key features:

### ✅ **Functionality Tests:**
- [ ] Website loads correctly
- [ ] Fixed header displays properly
- [ ] Service cards are clickable
- [ ] Contact form opens modal
- [ ] Form validation works
- [ ] Responsive design on mobile

### ✅ **Performance Tests:**
- [ ] Page loads quickly (< 3 seconds)
- [ ] Images load properly
- [ ] Animations are smooth
- [ ] Service worker registers
- [ ] Offline functionality works

### ✅ **SEO Tests:**
- [ ] Meta tags are present
- [ ] Structured data is valid
- [ ] Page is indexable by search engines
- [ ] Social media sharing works

## 🚨 **Post-Deployment Checklist**

1. **Update configuration files:**
   - Set correct domain in `config.js`
   - Update Formspree endpoint with real form ID
   - Configure analytics tracking

2. **Replace placeholder images:**
   - Upload real images to replace HTML placeholders
   - Optimize images for web (compress, proper dimensions)

3. **Test form functionality:**
   - Submit test form to verify email delivery
   - Check spam protection is working
   - Verify rate limiting functions

4. **Monitor performance:**
   - Check Core Web Vitals in Google PageSpeed Insights
   - Monitor real user performance metrics
   - Optimize based on performance data

## 🔒 **Security Considerations**

- **HTTPS**: Ensure SSL certificate is active
- **Form protection**: Verify honeypot and rate limiting work
- **Content Security Policy**: Consider adding CSP headers
- **Regular updates**: Keep dependencies updated

## 📊 **Analytics Setup**

1. **Google Analytics:**
   - Create Google Analytics account
   - Add tracking code to your HTML
   - Set up goals for form submissions

2. **Performance monitoring:**
   - Use the built-in performance monitoring
   - Set up alerts for performance issues
   - Track Core Web Vitals

## 🆘 **Troubleshooting**

### Common Issues:

**Site not loading:**
- Check DNS configuration
- Verify hosting provider status
- Check file permissions

**Form not working:**
- Verify Formspree configuration
- Check browser console for errors
- Test in different browsers

**Performance issues:**
- Optimize images
- Minify CSS/JS files
- Enable compression on server

**Mobile issues:**
- Test responsive design
- Check viewport meta tag
- Verify touch interactions

## 🎯 **Next Steps After Deployment**

1. **Set up monitoring and alerts**
2. **Configure backup systems**
3. **Set up staging environment**
4. **Plan content updates**
5. **Monitor analytics and performance**
6. **Plan future enhancements**
