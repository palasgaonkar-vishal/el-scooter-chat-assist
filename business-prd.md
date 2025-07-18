
# Ather Energy Customer Support Portal - Business PRD

## Product Overview
Mobile-first customer support webapp for Ather Energy's electric two-wheeler customers, featuring OTP authentication, FAQ matching system, order inquiries, and admin management capabilities.

## Functional Requirements

| Requirement ID | Description | User Story | Expected Behavior/Outcome |
|----------------|-------------|------------|---------------------------|
| FR001 | Customer Mobile OTP Authentication | As a customer, I want to login using my mobile number with OTP verification so I can securely access the support portal. | System sends OTP via Twilio SMS, validates the code, and creates/authenticates user session lasting 30 minutes. |
| FR002 | Customer Profile Management | As a customer, I want to optionally add my name, email, address, and select my scooter model so I can receive personalized support. | System provides optional profile fields including multi-select for scooter models (450S, 450x, Rizta) after successful login. |
| FR003 | Admin Email/Password Authentication | As an admin, I want to login with email and password so I can access administrative functions separately from customer access. | System provides separate admin login interface with email/password authentication and session management. |
| FR004 | Natural Language Query Input | As a customer, I want to ask questions in natural language about my electric scooter so I can get help easily. | System provides chat interface accepting free-form text input for customer queries. |
| FR005 | File Upload in Chat | As a customer, I want to upload images and PDFs with my queries so I can provide visual context for my issues. | System accepts image and PDF uploads up to 10MB, stores them in Supabase storage, and associates them with chat conversations. |
| FR006 | FAQ Text Similarity Matching | As a customer, I want the system to automatically find the best matching answer from existing FAQs so I can get instant help. | System uses text similarity scoring to match user queries against FAQ database (question, answer, category, tags) and returns best match if confidence score is sufficiently high. |
| FR007 | FAQ Response Rating | As a customer, I want to rate whether the system's response was helpful so the system can improve and I can escalate if needed. | System provides helpful/not helpful rating options after each FAQ response, tracks ratings for analytics. |
| FR008 | Manual Query Escalation | As a customer, I want to escalate my query to human support if the automated response doesn't help me. | System provides escalation option when user rates response as "not helpful", queues query for admin review with full context. |
| FR009 | FAQ Category Browsing | As a customer, I want to browse FAQs by categories so I can find relevant information quickly. | System organizes FAQs into categories: Charging, Service & Maintenance, Range & Performance, Order Inquiries, Cost of Ownership, License Requirements, Warranty. |
| FR010 | Order Status Inquiry | As a customer, I want to check my scooter order status using my mobile number so I can track delivery progress. | System matches customer mobile number with order database and displays Order ID, Scooter Model, Order Status, Delivery Date, Payment Status, Tracking ID. |
| FR011 | Chat History Persistence | As a customer, I want to access my previous chat conversations so I can reference past interactions. | System stores all chat interactions with timestamps, user identification, and file attachments for future reference. |
| FR012 | Offline FAQ Access | As a customer, I want to access previously loaded FAQs and chat history when offline so I can get help even with poor connectivity. | System caches FAQ data and chat history locally for offline access in mobile-first scenarios. |
| FR013 | Admin FAQ Management | As an admin, I want to add, edit, and delete FAQs with categories and model tags so I can maintain the knowledge base. | Admin panel provides CRUD operations for FAQs with fields for question, answer, category, model tags (450S, 450x, Rizta), and metadata. |
| FR014 | Admin Escalated Query Management | As an admin, I want to view and respond to escalated customer queries so I can provide personalized support. | Admin dashboard shows queue of escalated queries (system-escalated and user-escalated) with full context, file attachments, and response interface. |
| FR015 | Order Data CSV Management | As an admin, I want to upload order data via CSV file so I can update customer order information in bulk. | System provides CSV template download and upload functionality with validation for required fields: Order ID, Customer Mobile, Scooter Model, Order Status, Delivery Date, Payment Status, Tracking ID. |
| FR016 | Real-time Analytics Dashboard | As an admin, I want to view real-time analytics about support portal usage so I can monitor performance and identify improvement areas. | Dashboard displays metrics: total queries, system-answered queries, system-escalated queries, user-escalated queries, response helpfulness ratings, user satisfaction scores. |
| FR017 | System Auto-escalation | As an admin, I want queries that don't match existing FAQs to be automatically escalated so no customer inquiry goes unanswered. | System automatically queues queries for admin review when text similarity confidence score falls below threshold, preserving full query context. |
| FR018 | Session Timeout Management | As a user (customer/admin), I want my session to timeout after 30 minutes of inactivity so my account remains secure. | System automatically logs out users after 30 minutes of inactivity and prompts for re-authentication. |
| FR019 | Mobile-First Responsive Design | As a customer, I want the support portal to work seamlessly on my mobile device so I can get help anywhere. | System provides responsive design optimized for mobile devices with touch-friendly interfaces and appropriate scaling. |
| FR020 | Scooter Model-Specific Responses | As a customer, I want to receive answers specific to my scooter model when relevant so I get accurate information. | System considers scooter model tags when matching FAQs and prioritizes model-specific responses based on user's selected scooter model. |

## Non-Functional Requirements

| Requirement ID | Description | User Story | Expected Behavior/Outcome |
|----------------|-------------|------------|---------------------------|
| NFR001 | Performance - Daily User Scale | As a business stakeholder, I want the system to handle 100 daily active users so we can serve our expected customer base. | System architecture supports concurrent usage by 100 users with acceptable response times (<3 seconds for queries). |
| NFR002 | Integration Architecture | As a business stakeholder, I want the system built on Lovable and Supabase only so we minimize infrastructure complexity and costs. | Complete solution deployed using Lovable frontend and Supabase backend services (auth, database, storage, edge functions). |
| NFR003 | Cost Optimization | As a business stakeholder, I want minimal infrastructure costs in initial months so we can launch within budget constraints. | Solution leverages free tiers of Supabase and Twilio, with scalable pricing model for future growth. |
| NFR004 | File Storage Limits | As a system administrator, I want file uploads limited to 10MB so we manage storage costs effectively. | System enforces 10MB maximum file size for image and PDF uploads with appropriate user feedback. |
| NFR005 | Data Security | As a business stakeholder, I want customer data protected according to Indian data protection standards so we maintain trust and compliance. | System implements secure authentication, encrypted data storage, and appropriate access controls via Supabase security features. |
| NFR006 | Deployment Timeline | As a business stakeholder, I want the complete MVP delivered in less than one week so we can launch quickly to market. | All functional requirements implemented, tested, and deployed within 7-day timeline. |
| NFR007 | Language Support | As a business stakeholder, I want the system to support English only initially so we can focus on core functionality first. | All user interfaces, content, and interactions provided in English language only. |
| NFR008 | SMS Integration Reliability | As a customer, I want OTP messages delivered reliably so I can access the portal consistently. | Twilio SMS integration provides reliable OTP delivery with appropriate error handling and retry mechanisms. |

## Success Metrics
- User authentication success rate > 95%
- FAQ matching accuracy > 80% for common queries
- Customer satisfaction rating > 4/5 for resolved queries
- Admin response time for escalated queries < 24 hours
- System uptime > 99%
- Mobile usability score > 85%

## Technical Stack
- **Frontend**: Lovable (React, TypeScript, Tailwind CSS)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **SMS Service**: Twilio
- **File Storage**: Supabase Storage
- **Deployment**: Lovable + Supabase hosted infrastructure

## MVP Scope
All functional requirements (FR001-FR020) and non-functional requirements (NFR001-NFR008) are considered must-have for MVP launch.
