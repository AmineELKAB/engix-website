# PRD: engix.dev Website

## 1. Overview
The purpose of this PRD is to define the specifications for **engix.dev**, a single-page website that explains the offered engineering services and prompts visitors to contact for a deep dive session.  
The website stands for **Engineering Excellence**.

---

## 2. Objectives
- Present a clear and strong message of engineering passion combined with AI.  
- Display clickable service-related images with associated explanatory text.  
- Provide a modern, reactive contact form for deep dive requests.  
- Ensure seamless email notifications for both the website owner and the request sender.
- All website items should be modern, reactive providing optimal user experience
- SEO should be included in all aspects
- Web page should be optimized for use on computer and mobile devices

---

## 3. Target Audience
- Companies and individuals worldwide seeking engineering expertise.  
- Clients looking for product development, process optimization, or technical assistance.  

---

## 4. Functional Requirements

### 4.1 Fixed Top Message (Header)
- **Main message**: `Engineering passion and AI for awesome projects worldwide`  
- **Secondary message**: `Combining the power of AI and human engineering expertise makes our deliverables quick, robust and cost efficient`  
- Behavior: Fixed at top of page, always visible (non-scrollable).

### 4.2 Clickable Images Section

#### Image 1 – Contact Request
- Image: Personal picture with AI modifications (from project folder).  
- Overlay Text: `Click to request a deep dive`.  
- Action: Clicking opens a **modern, reactive request form**.  
- **Form fields**:  
  - Name (mandatory)  
  - Email (mandatory)  
  - WhatsApp / phone number  
  - Request (mandatory)  
- Submission flow:  
  - On submit → owner receives notification email.  
  - On submit → sender receives confirmation email.  

#### Image 2 – Product & Process Development
- **Title**: `Product and process development & optimization`.  
- **Text**:  
  `You need engineering support for the full development cycle or only an early prototyping?`  
  `You need to optimize an existing product cost or performance?`  
  `We can support design, simulation, testing and serial production launch, covering mechanical, electrical, electronics, software and AI systems.`  

#### Image 3 – Technical Assistance
- **Title**: `Technical assistance for your projects`.  
- **Text**:  
  `You are delivering technical products and need efficient assistance to make your customers happy?`  
  `You are running a production plant and need on-site or remote support?`  
  `We can offer your customers a great experience, relying on professional tools and indicators.`  

---

## 5. Non-Functional Requirements
- **Design**: Clean, modern, responsive, minimalistic.  
- **Performance**: Fast loading, optimized for both desktop and mobile.  
- **Security**: Email notifications should be protected against spam.  
- **Scalability**: Page structure should allow easy future extension.  

---

## 6. Technical Requirements
- **Frontend**: HTML5, CSS3, JavaScript (React.js or similar optional).  
- **Form Handling**: AJAX-based submission, no page reload.  
- **Email Notifications**: SMTP integration or third-party service (e.g., SendGrid).  
- **Hosting**: Standard web hosting (or GitHub Pages for static, with serverless form handling).  

---

## 7. Deliverables
- Complete source code of the webpage.  
- Responsive design with the fixed header, clickable images, and functional form.  
- Email notification integration tested and validated.  

---

## 8. Success Criteria
- Users can clearly understand the offered services.  
- Deep dive request form works flawlessly with email notifications.  
- Website loads quickly and works on all modern devices.  
- SEO
