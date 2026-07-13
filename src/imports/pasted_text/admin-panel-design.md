═══════════════════════════════════════
HAMEL TRADING — ADMIN PANEL DESIGN
Complete Dashboard & Management System
═══════════════════════════════════════

BRAND COLORS:
Primary Blue: #0EA5E9 (bright sky blue)
Secondary Yellow: #FFC107 (golden yellow)
Success Green: #10B981
Danger Red: #EF4444
Gray Scale: #F9FAFB, #E5E7EB, #6B7280, #1F2937

═══════════════════════════════════════
SIDEBAR NAVIGATION
═══════════════════════════════════════

Width: 260px (desktop)
Background: White
Border right: 1px solid #E5E7EB
Shadow: subtle

TOP SECTION:
┌─────────────────────────────┐
│ ❄️ HAMEL                    │
│    Admin Panel              │
└─────────────────────────────┘

MENU ITEMS:
📊 Dashboard
📦 Products
   • All Products
   • Add New Product
   • Categories
   • Brands
📋 Orders & Inquiries
   • All Inquiries
   • Pending
   • Confirmed
   • Completed
👥 Customers
   • All Customers
   • Reviews
💬 Messages
   • AI Chat Logs
   • Contact Form
📈 Analytics
   • Sales Report
   • Popular Products
   • Traffic Stats
⚙️ Settings
   • Profile
   • Notifications
   • System

BOTTOM SECTION:
Profile card with avatar, name, logout button

ACTIVE STATE:
Background: #E0F2FE
Border left: 3px solid #0EA5E9
Text color: #0EA5E9
Icon color: #0EA5E9

═══════════════════════════════════════
TOP HEADER BAR
═══════════════════════════════════════

Height: 64px
Background: White
Border bottom: 1px solid #E5E7EB
Sticky on scroll

LEFT SIDE:
• Hamburger menu (mobile)
• Page title (bold, 20px)

RIGHT SIDE:
• Search bar (300px wide)
• Notification bell icon (with badge)
• Profile dropdown

═══════════════════════════════════════
PAGE 1 — DASHBOARD (OVERVIEW)
═══════════════════════════════════════

STATS CARDS (4 across):
┌──────────────────────────┐
│ 📊 Total Inquiries       │
│ 248                      │
│ +12% from last month     │
└──────────────────────────┘

┌──────────────────────────┐
│ ⏳ Pending Orders        │
│ 23                       │
│ Needs attention          │
└──────────────────────────┘

┌──────────────────────────┐
│ ✅ Completed This Month  │
│ 87                       │
│ +8% from last month      │
└──────────────────────────┘

┌──────────────────────────┐
│ 👥 Active Customers      │
│ 1,234                    │
│ +156 this month          │
└──────────────────────────┘

RECENT INQUIRIES TABLE:
Columns:
• Customer Name
• Product
• HP / Qty
• Date
• Status (badge)
• Actions (View, Reply, Mark Complete)

Show latest 10 inquiries
"View All" button at bottom

POPULAR PRODUCTS SECTION:
Card layout showing:
• Product image
• Name & brand
• Total inquiries (this month)
• View count
• Quick edit button

AI CHAT ACTIVITY CHART:
Line graph showing:
• Messages per day (last 7 days)
• Peak hours
• Response rate

═══════════════════════════════════════
PAGE 2 — PRODUCTS MANAGEMENT
═══════════════════════════════════════

TOP BAR:
• Search products (left)
• Filter by brand dropdown
• Filter by category dropdown
• "Add New Product" button (right, yellow)

PRODUCTS TABLE:
┌─────────────────────────────────────────┐
│ Image | Name | Brand | HP | Price Range │
│       | Status | Stock | Actions         │
└─────────────────────────────────────────┘

Each row:
• Thumbnail image (60x60px)
• Product name & model
• Brand badge
• Available HP options (pills)
• Price range
• Status toggle (Active/Inactive)
• Stock indicator
• Actions: Edit | Duplicate | Delete

PAGINATION:
Bottom of table
Show 20 per page
Page numbers + prev/next

═══════════════════════════════════════
PAGE 3 — ADD/EDIT PRODUCT
═══════════════════════════════════════

TWO-COLUMN LAYOUT:

LEFT COLUMN (main form):
┌─────────────────────────┐
│ Basic Information       │
├─────────────────────────┤
│ • Product Name          │
│ • Brand (dropdown)      │
│ • Model Number          │
│ • Category              │
│ • Description (wysiwyg) │
└─────────────────────────┘

┌─────────────────────────┐
│ Pricing & Availability  │
├─────────────────────────┤
│ • Price Start           │
│ • Price End             │
│ • HP Options (multi)    │
│ • Stock Status          │
└─────────────────────────┘

┌─────────────────────────┐
│ Specifications          │
├─────────────────────────┤
│ Repeatable fields:      │
│ [Label] [Value] [+][-]  │
│                         │
│ Examples:               │
│ Coverage Area: 15-20sqm │
│ Energy Rating: 5 Star   │
│ Add More button         │
└─────────────────────────┘

┌─────────────────────────┐
│ Features                │
├─────────────────────────┤
│ Checkboxes:             │
│ ☑ Inverter Technology   │
│ ☐ Wi-Fi Control         │
│ ☑ Sleep Mode            │
│ ☑ Auto Clean            │
│ + Add custom feature    │
└─────────────────────────┘

RIGHT COLUMN (media & preview):
┌─────────────────────────┐
│ Product Images          │
├─────────────────────────┤
│ Main image upload       │
│ (drag & drop or click)  │
│                         │
│ Additional images:      │
│ [img1] [img2] [img3]    │
│ [+] Add more            │
└─────────────────────────┘

┌─────────────────────────┐
│ SEO & Tags              │
├─────────────────────────┤
│ • Meta title            │
│ • Meta description      │
│ • Tags (comma-sep)      │
└─────────────────────────┘

BOTTOM ACTION BAR:
• Cancel (gray button)
• Save Draft (white button)
• Publish (yellow button)

═══════════════════════════════════════
PAGE 4 — ORDERS & INQUIRIES
═══════════════════════════════════════

TABS:
All | Pending | Confirmed | Completed

FILTERS:
• Date range picker
• Product filter
• HP filter
• Search customer

INQUIRY CARDS (list view):
┌────────────────────────────────────┐
│ 🟡 PENDING                          │
│ Juan dela Cruz • 0912-345-6789     │
│ Panasonic Aero Series 1HP • 1 unit │
│ 123 Colon St, Cebu City            │
│ Preferred: May 10, Morning         │
│ Submitted: 2 hours ago             │
│                                    │
│ [View Details] [Reply] [Mark ✓]   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 🟢 CONFIRMED                        │
│ Maria Santos • 0917-234-5678       │
│ Samsung WindFree 1.5HP • 2 units   │
│ ...                                │
└────────────────────────────────────┘

STATUS COLORS:
• Pending: Yellow #FFC107
• Confirmed: Blue #0EA5E9
• Completed: Green #10B981
• Cancelled: Red #EF4444

INQUIRY DETAIL MODAL:
Width: 800px
Sections:
• Customer info
• Product details
• Delivery info
• Timeline (submitted → viewed → replied → confirmed)
• Notes section (internal)
• Action buttons

═══════════════════════════════════════
PAGE 5 — CUSTOMERS
═══════════════════════════════════════

CUSTOMER TABLE:
Columns:
• Name
• Email
• Phone
• Total Inquiries
• Last Activity
• Status (Active/Inactive)
• Actions

CUSTOMER DETAIL VIEW:
• Profile summary
• Inquiry history
• Contact timeline
• Notes

EXPORT BUTTON:
Export to CSV for mailing lists

═══════════════════════════════════════
PAGE 6 — MESSAGES (AI CHAT LOGS)
═══════════════════════════════════════

TWO-PANE LAYOUT:

LEFT PANE (conversations list):
┌────────────────────────┐
│ 🔵 Juan dela Cruz      │
│ "How much is..."       │
│ 5 min ago              │
└────────────────────────┘

┌────────────────────────┐
│ Maria Santos           │
│ "What HP for 20sqm?"   │
│ 1 hour ago             │
└────────────────────────┘

RIGHT PANE (conversation detail):
Shows full AI chat transcript
• Timestamp
• Customer messages (right)
• AI responses (left)
• Product mentioned (highlighted)
• Handoff status (if escalated)

FILTERS:
• Show all / Handoff requested / Active
• Date range
• Product mentioned

═══════════════════════════════════════
PAGE 7 — ANALYTICS DASHBOARD
═══════════════════════════════════════

DATE RANGE SELECTOR:
Today | This Week | This Month | Custom

CHARTS:
1. Inquiries Over Time
   Line chart showing daily inquiries

2. Popular Products
   Bar chart of top 10 most inquired

3. HP Distribution
   Pie chart showing which HP sells most

4. Inquiry Sources
   Donut chart: Direct / AI Chat / Form

5. Peak Hours Heatmap
   Shows what time of day gets most inquiries

6. Conversion Funnel
   Inquiry → Confirmed → Completed

EXPORT BUTTON:
Download PDF report

═══════════════════════════════════════
PAGE 8 — SETTINGS
═══════════════════════════════════════

TABS:
Profile | Notifications | System | AI Settings

PROFILE TAB:
• Change name
• Change email
• Change password
• Profile photo upload

NOTIFICATIONS TAB:
Toggle switches:
☑ Email on new inquiry
☑ Email on AI handoff request
☐ Daily summary email
☑ SMS for urgent inquiries

SYSTEM TAB:
• Business hours
• Contact details
• Social media links
• Messenger/WhatsApp integration

AI SETTINGS TAB:
• AI greeting message (editable)
• FAQ responses (editable)
• Auto-reply toggle
• Handoff keywords
• Training data upload

═══════════════════════════════════════
COMPONENTS LIBRARY
═══════════════════════════════════════

BUTTONS:
Primary (yellow #FFC107):
  Large: px-6 py-3, font-bold
  Medium: px-4 py-2, font-semibold
  Small: px-3 py-1.5, font-medium

Secondary (blue #0EA5E9):
  Outline style with hover fill

Danger (red #EF4444):
  For delete actions

Ghost:
  Transparent with hover bg

BADGES:
Rounded-full, px-3 py-1, text-xs
• Pending: bg-yellow-100, text-yellow-800
• Active: bg-green-100, text-green-800
• Inactive: bg-gray-100, text-gray-800

TABLES:
• Striped rows (odd: white, even: gray-50)
• Hover: bg-blue-50
• Border: 1px solid #E5E7EB
• Header: bg-gray-100, font-semibold

CARDS:
• White background
• Shadow: sm
• Border: 1px solid #E5E7EB
• Rounded: lg (8px)
• Padding: p-6

MODALS:
• Overlay: bg-black/50
• Max-width: varies by content
• Rounded: xl (12px)
• Shadow: 2xl
• Close button: top-right

FORM INPUTS:
• Height: 40px
• Border: 1px solid #E5E7EB
• Focus: ring-2 ring-blue-500
• Rounded: md (6px)
• Padding: px-3

DROPDOWNS:
• Same as inputs
• Chevron icon right
• Menu appears below
• Max-height with scroll

═══════════════════════════════════════
RESPONSIVE BREAKPOINTS
═══════════════════════════════════════

Desktop: > 1024px
  - Show sidebar
  - Multi-column layouts
  - Full tables

Tablet: 768px - 1024px
  - Collapsible sidebar
  - 2-column layouts
  - Horizontal scroll tables

Mobile: < 768px
  - Hidden sidebar (hamburger)
  - Single column
  - Card-based tables
  - Bottom nav for quick actions

═══════════════════════════════════════
PERMISSIONS & ROLES
═══════════════════════════════════════

ADMIN (full access):
• All pages
• Delete products
• Manage users
• System settings

STAFF (limited):
• View inquiries
• Reply to messages
• Edit product stock
• Cannot delete

VIEWER (read-only):
• Dashboard
• Analytics
• View inquiries only

═══════════════════════════════════════
NOTIFICATIONS SYSTEM
═══════════════════════════════════════

NOTIFICATION BELL:
Shows unread count badge
Dropdown shows latest 5

NOTIFICATION TYPES:
🟡 New inquiry received
🔵 AI handoff request
🟢 Order confirmed
🔴 Urgent: customer waiting
💬 New review posted

Click to open relevant page
Mark as read option

═══════════════════════════════════════
QUICK ACTIONS (FLOATING BUTTON)
Mobile only — bottom right corner
═══════════════════════════════════════

+ button expands to:
• 📋 New Inquiry
• 📦 Add Product
• 💬 Messages

═══════════════════════════════════════
DATA TABLES — BEST PRACTICES
═══════════════════════════════════════

• Show 20 items per page
• Sortable columns (click header)
• Search/filter bar above table
• Bulk actions (select multiple)
• Export to CSV option
• Loading skeleton on fetch
• Empty state with illustration

═══════════════════════════════════════
EMPTY STATES
═══════════════════════════════════════

When no data:
• Illustration or icon (large)
• Friendly message
• CTA button to add first item
• Helper text

Example:
┌────────────────────────┐
│         📦             │
│                        │
│  No products yet!      │
│  Add your first        │
│  product to get        │
│  started.              │
│                        │
│  [+ Add Product]       │
└────────────────────────┘

═══════════════════════════════════════
LOADING STATES
═══════════════════════════════════════

• Skeleton loaders for cards/tables
• Spinner for buttons
• Progress bar for uploads
• Shimmer effect for placeholders

═══════════════════════════════════════
ERROR HANDLING
═══════════════════════════════════════

Toast notifications:
• Success: green, check icon
• Error: red, X icon
• Warning: yellow, ! icon
• Info: blue, i icon

Position: top-right
Duration: 3-5 seconds
Dismissible

Form validation:
• Red border on invalid field
• Error message below field
• Prevent submit until valid

═══════════════════════════════════════
SECURITY FEATURES
═══════════════════════════════════════

• Login page with 2FA option
• Session timeout (30 min inactive)
• Activity log (who did what when)
• Password requirements enforced
• HTTPS only
• CSRF protection
• Rate limiting on API

═══════════════════════════════════════
ACCESSIBILITY
═══════════════════════════════════════

• Keyboard navigation (Tab, Enter, Esc)
• Focus indicators on all interactive elements
• ARIA labels on icons
• Color contrast WCAG AA compliant
• Screen reader friendly
• Alt text on images

═══════════════════════════════════════
PERFORMANCE
═══════════════════════════════════════

• Lazy load tables (paginated)
• Image optimization
• Debounced search
• Cache frequently accessed data
• Optimistic UI updates
• Virtual scrolling for long lists

═══════════════════════════════════════
NEXT STEPS / FUTURE FEATURES
═══════════════════════════════════════

Phase 2:
• Inventory management (stock tracking)
• Automated email replies
• SMS notifications
• Mobile app (React Native)
• Multi-language support
• Advanced reporting
• Calendar view for installations
• Staff scheduling
• Commission tracking

Phase 3:
• Integration with accounting software
• Customer portal (order tracking)
• Supplier management
• Warranty claim system
• Service request ticketing
