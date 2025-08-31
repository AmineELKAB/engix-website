# Form Backend Setup Guide

This guide explains how to configure the contact form to send actual emails.

## Option 1: Formspree (Recommended - Free)

Formspree is a free service that handles form submissions and sends emails.

### Setup Steps:

1. **Go to [Formspree.io](https://formspree.io)**
2. **Sign up for a free account**
3. **Create a new form:**
   - Click "New Form"
   - Give it a name (e.g., "Engix Contact Form")
   - Choose "Contact Form" template
4. **Get your form endpoint:**
   - Copy the endpoint URL (looks like: `https://formspree.io/f/xaybzwkd`)
5. **Update the configuration:**
   - Open `config.js`
   - Replace `YOUR_FORM_ID` with your actual form ID
   - Example: `endpoint: 'https://formspree.io/f/xaybzwkd'`

### How it works:
- ✅ **Owner notification**: You'll receive an email for each form submission
- ✅ **Sender confirmation**: The person submitting the form gets an automatic confirmation
- ✅ **Spam protection**: Built-in spam filtering
- ✅ **Free tier**: Up to 50 submissions per month

## Option 2: SendGrid (Professional)

SendGrid is a professional email service with more features.

### Setup Steps:

1. **Sign up for [SendGrid](https://sendgrid.com)**
2. **Create an API key**
3. **Set up your backend server** (requires server-side code)
4. **Update configuration:**
   - Set `formspree.enabled = false`
   - Set `sendgrid.enabled = true`
   - Replace `YOUR_SENDGRID_API_KEY` with your actual API key

## Option 3: Custom SMTP Server

For complete control over email delivery.

### Setup Steps:

1. **Configure your SMTP server details**
2. **Create a backend API endpoint** (e.g., `/api/contact`)
3. **Update the configuration to use your custom endpoint**

## Testing the Form

1. **Open the website in your browser**
2. **Click on the contact card** (first image)
3. **Fill out the form** with test data
4. **Submit the form**
5. **Check your email** for the notification

## Troubleshooting

### Form not sending emails:
- Check that the Formspree endpoint is correct in `config.js`
- Verify your Formspree account is active
- Check browser console for error messages

### Spam protection too strict:
- Adjust rate limiting in `config.js`
- Modify honeypot field behavior

### Custom styling needed:
- Update CSS in `styles.css`
- Modify form validation in `script.js`

## Security Features

The form includes several spam protection measures:
- **Honeypot field**: Hidden field that bots fill out
- **Rate limiting**: Prevents rapid-fire submissions
- **Input validation**: Checks email format and required fields
- **Request length limits**: Prevents extremely long submissions

## Next Steps

After setting up the form backend:
1. Test the form thoroughly
2. Replace placeholder images with real ones
3. Deploy to your hosting service
4. Monitor form submissions and spam
