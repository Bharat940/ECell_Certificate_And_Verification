# Certificate Generation and Verification System

A professional certificate management platform for E-Cell RGPV, featuring automated PDF generation, QR code verification, and secure cloud storage.

## Features

### Admin Dashboard
- Secure JWT-based authentication
- Complete event management (create, edit, delete)
- Multi-template certificate generation
- Bulk certificate operations
- Real-time certificate preview and download
- Copy verification URLs and certificate numbers

### Certificate Generation
- Automated server-side PDF generation using Puppeteer
- QR code integration for instant verification
- Cloud storage via Cloudinary
- Unique certificate numbering system (ECELL-YYYY-XXXXX)
- A4 landscape layout with print-safe CSS

### Public Verification
- Certificate verification via unique number or QR code
- Embedded PDF preview
- Download certificate functionality
- Multi-day event support
- Tamper-proof verification system

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose ODM
- **PDF Generation:** Puppeteer
- **QR Codes:** qrcode library
- **Cloud Storage:** Cloudinary
- **Styling:** Tailwind CSS
- **Authentication:** JWT (jsonwebtoken)
- **UI Components:** Lucide React icons
- **Notifications:** react-hot-toast

## Prerequisites

- Node.js 18 or higher
- MongoDB (local installation or MongoDB Atlas)
- Cloudinary account (free tier available)

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <your-repository-url>
cd Certs_and_verification
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecell-certificates

# Authentication
JWT_SECRET=<generate-secure-random-string>
ADMIN_KEY=<generate-secure-random-string>

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

**Generate secure keys:**
```bash
# For JWT_SECRET and ADMIN_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Usage

### Admin Access

1. Navigate to `/admin`
2. Enter your admin key (from `.env` file)
3. Access the dashboard at `/admin/dashboard`

### Managing Events

**Create Event:**
1. Click "Create Event" in the dashboard
2. Enter event details (title, dates, organizer, template)
3. Submit to create

**Edit/Delete Event:**
- Use action buttons on event cards
- Delete requires confirmation and no associated certificates

### Generating Certificates

1. Click "Generate Certificate" in the dashboard
2. Select an event from the dropdown
3. Enter participant name and optional email
4. Click "Generate Certificate"
5. Download PDF or copy verification URL

### Bulk Operations

**Delete Selected Certificates:**
1. Navigate to event certificates page
2. Select certificates using checkboxes
3. Click "Delete Selected (X)"

**Delete All Certificates:**
1. Click "Delete All (X)" button
2. Type event name to confirm
3. Confirm deletion

### Verifying Certificates

**Method 1 - Direct URL:**
- Navigate to `/verify/{CERTIFICATE_NUMBER}`
- Example: `/verify/ECELL-2026-00001`

**Method 2 - QR Code:**
- Scan QR code on the certificate
- Automatically redirects to verification page

**Method 3 - Landing Page:**
- Visit homepage
- Enter certificate number in the form

## Project Structure

```
/app
  /admin                          # Admin authentication and dashboard
    /dashboard                    # Main admin interface
    /events/[eventId]/certificates # Event-specific certificates
  /verify/[certificateNumber]     # Public verification page
  /api
    /admin
      /login                      # Admin authentication
      /logout                     # Admin logout
      /events                     # Event CRUD operations
      /certificates               # Certificate generation and management
      /certificates/bulk-delete   # Bulk delete operations
    /verify/[certificateNumber]   # Certificate verification

/lib
  auth.ts                         # JWT authentication utilities
  db.ts                           # MongoDB connection
  pdf.ts                          # PDF generation with Puppeteer
  qr.ts                           # QR code generation
  cloudinary.ts                   # Cloud storage integration
  certificateUtils.ts             # Certificate number generation
  dateUtils.ts                    # Date formatting utilities
  templateUtils.ts                # Template management
  templates.ts                    # Template metadata
  logger.ts                       # Logging system

/models
  Event.ts                        # Event schema and model
  Certificate.ts                  # Certificate schema and model

/components
  EventCard.tsx                   # Event display component
  CertificateCard.tsx             # Certificate display component
  EventFormModal.tsx              # Event creation/edit modal
  CertificateFormModal.tsx        # Certificate generation modal
  ConfirmDialog.tsx               # Confirmation dialog component

/public
  /templates
    certificate-default.html      # Default template
    certificate-bootcamp.html     # Bootcamp template
    certificate-workshop.html     # Workshop template
    certificate-hackathon.html    # Hackathon template
  /assets                         # Images and static assets
```

## Database Schema

### Event Model
```typescript
{
  title: string;
  startDate: string;
  endDate: string;
  organizer: string;
  template: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Certificate Model
```typescript
{
  certificateNumber: string;      // Unique (ECELL-YYYY-XXXXX)
  participantName: string;
  participantEmail?: string;
  eventId: ObjectId;              // Reference to Event
  certificateUrl: string;         // Cloudinary URL
  cloudinaryPublicId: string;     // For deletion
  verificationHash: string;       // SHA-256 hash
  verificationUrl: string;        // Full verification URL
  issuedAt: Date;
}
```

## Certificate Templates

Templates are located in `/public/templates/` and use the following placeholders:

- `{{participantName}}` - Participant's name
- `{{eventName}}` - Event title
- `{{eventDate}}` - Formatted event date
- `{{certificateNumber}}` - Unique certificate number
- `{{issueDate}}` - Certificate issue date
- `{{qrCode}}` - Base64 QR code image
- `{{organizer}}` - Event organizer name

**Template Specifications:**
- Format: A4 Landscape (297mm x 210mm)
- Print-safe CSS with background colors
- Absolute positioning for precise layout
- Embedded fonts for consistency

## Security Features

- JWT-based admin authentication with HTTP-only cookies
- Secure admin key verification
- SHA-256 certificate verification hash
- Unique certificate numbers with collision prevention
- Immutable certificates (no regeneration)
- Tamper-proof PDF storage on Cloudinary
- Input validation and sanitization
- Protected admin routes

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard

### Other Platforms

Compatible with:
- Railway
- Render
- Heroku
- AWS (EC2, Elastic Beanstalk)
- DigitalOcean App Platform

**Note:** Puppeteer requires additional configuration on some platforms. Refer to [Puppeteer deployment documentation](https://pptr.dev/guides/docker) for platform-specific setup.

## API Endpoints

### Admin Routes (Protected)

- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/events` - List all events
- `POST /api/admin/events` - Create event
- `PUT /api/admin/events/[eventId]` - Update event
- `DELETE /api/admin/events/[eventId]` - Delete event
- `GET /api/admin/events/[eventId]/certificates` - List event certificates
- `POST /api/admin/certificates` - Generate certificate
- `DELETE /api/admin/certificates/[certificateId]` - Delete certificate
- `POST /api/admin/certificates/bulk-delete` - Bulk delete certificates

### Public Routes

- `GET /api/verify/[certificateNumber]` - Verify certificate

## Troubleshooting

### PDF Generation Fails
- Verify Puppeteer is installed correctly
- Check Cloudinary credentials in `.env`
- Ensure sufficient disk space
- Check Node.js version (18+ required)

### Certificate Not Found
- Verify MongoDB connection string
- Check certificate number format (ECELL-YYYY-XXXXX)
- Ensure database contains data
- Check network connectivity

### Admin Login Issues
- Verify `ADMIN_KEY` matches `.env` file
- Clear browser cookies and cache
- Ensure `JWT_SECRET` is set
- Check browser console for errors

### Cloudinary Upload Errors
- Verify API credentials
- Check account upload limits
- Ensure stable internet connection
- Review Cloudinary dashboard for errors

## Development

### Running Tests

```bash
# Test database connection
curl http://localhost:3000/api/test-db

# Test admin login
# Navigate to http://localhost:3000/admin
```

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Modular component architecture
- Comprehensive error handling

## Support

For issues and questions:
- Check error logs in the terminal
- Review browser console (F12)
- Verify environment variables
- Ensure all dependencies are installed

---

Built for E-Cell RGPV
