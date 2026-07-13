═══════════════════════════════════════
COMPONENT — SEND INQUIRY MODAL
(Full AI Chat replaces the old form)
═══════════════════════════════════════

MODAL SPECS:
Width: 480px (desktop) / 100% (mobile)
Height: auto (scrollable)
Position: Centered popup overlay
Background overlay: rgba(0,0,0,0.5)
Modal background: white
Border radius: 16px
No form fields — replaced entirely 
by AI chat conversation

───────────────────────────────────────
MODAL HEADER
───────────────────────────────────────
Left side:
- Small "H" circle avatar (deep blue 
  #1A3A6B, white letter)
- Title: "Chat with Hamel AI" 
  (16px, bold, dark)
- Subtext: "Typically replies instantly" 
  (12px, gray)

Right side:
- Green dot + "Online" label (11px)
- Close button X (top right corner)

───────────────────────────────────────
PRODUCT STRIP (below header)
Light blue background (#EAF3FB)
───────────────────────────────────────
- Left: Product thumbnail image
- Right:
  Brand name: "Panasonic" 
    (11px, blue #185FA5)
  Product: "Aero Series Inverter 2HP" 
    (13px, bold, dark blue #0C447C)
  Price: "₱35,500 - ₱39,500" 
    (12px, blue)

───────────────────────────────────────
PROGRESS BAR (below product strip)
───────────────────────────────────────
Background: #152e57 (dark navy)
7 pill-shaped bars side by side:
  - Completed steps: green (#4ade80)
  - Current step: orange (#F47B20)
  - Upcoming steps: muted blue (#2d5499)
Label right: "Step 1 of 7" 
  (10px, light blue)
Padding: 8px 16px

───────────────────────────────────────
CHAT AREA
Height: 320px, scrollable
Padding: 14px
───────────────────────────────────────
AI message bubbles:
  - Left aligned
  - Light gray background
  - 0.5px border
  - Border radius: 14px, 
    bottom-left = 4px (tail effect)
  - Font: 13px, line height 1.5
  - Small "H" avatar to the left

Customer message bubbles:
  - Right aligned  
  - Deep blue (#1A3A6B) background
  - White text
  - Border radius: 14px,
    bottom-right = 4px (tail effect)
  - No avatar

Typing indicator (before AI replies):
  - Same style as AI bubble
  - 3 animated bouncing dots
  - Width: 52px

───────────────────────────────────────
QUICK REPLY CHIPS
Below chat area, above input
───────────────────────────────────────
- Pill shape (border radius: 20px)
- Default: white bg + #1A3A6B border
  + #1A3A6B text
- Selected/hover: #1A3A6B filled 
  + white text
- Font: 12px, medium weight
- Gap: 6px between chips
- Wrap to next line if needed

───────────────────────────────────────
INPUT BAR (bottom of modal)
───────────────────────────────────────
- Pill-shaped text input (full width)
- Placeholder changes per step
- Background: light gray
- Right: circular blue send button 
  with white arrow icon (#1A3A6B)
- Border top: 0.5px separator line

═══════════════════════════════════════
DESIGN ALL 12 FRAMES IN FIGMA
(each is a separate artboard)
═══════════════════════════════════════

FRAME 1 — Opening / Greeting
────────────────────────────────────
Progress: Step 1 active (orange)

Product strip visible at top

AI bubble (auto message):
"Hi there! I'm Hamel's AI assistant.
I see you're interested in the 
Panasonic Aero Series Inverter 2HP!

I'll help you place your inquiry — 
it only takes about 2 minutes. 
Let's start!

First, what's your name?"

No chips shown
Input placeholder: "Type your name..."

────────────────────────────────────
FRAME 2 — Name received, room size
────────────────────────────────────
Progress: Step 2 active

Show previous messages:
  AI: "...what's your name?"
  Customer: "Juan dela Cruz"

New AI bubble:
"Nice to meet you, Juan! 

Now let's make sure you get the 
right HP size.

What is the size of the room where 
you'll install the aircon?"

Chips:
  "Small (up to 15sqm)"
  "Medium (15–25sqm)"
  "Large (25–40sqm)"
  "Not sure"

Input placeholder: "Or type room size..."

────────────────────────────────────
FRAME 3 — HP recommendation
────────────────────────────────────
Progress: Step 2 done, Step 3 active

Show previous messages collapsed 
(gray "View earlier messages" link)

New AI bubble:
"Got it! For a medium-sized room 
(15–25sqm), I recommend 1HP — 
it's the most efficient choice for 
that space.

Shall I set it to 1HP for you?"

Chips: 
  "Yes, set to 1HP"
  "I want 1.5HP"
  "I want 2HP"
  "Help me decide"

────────────────────────────────────
FRAME 4 — Quantity
────────────────────────────────────
Progress: Step 3 active

AI bubble:
"Perfect! 1HP it is.

How many units do you need?"

Chips:
  "1 unit"
  "2 units"
  "3 units"
  "More than 3"

────────────────────────────────────
FRAME 5 — Installation address
────────────────────────────────────
Progress: Step 4 active

AI bubble:
"Great, 1 unit!

Now, where will the aircon be 
installed? Please share the 
complete address — street, 
barangay, and city."

No chips — free text
Placeholder: 
  "e.g. 123 Colon St, Brgy. 
  Santo Niño, Cebu City"

────────────────────────────────────
FRAME 6 — Property type + floor
────────────────────────────────────
Progress: Step 5 active

AI bubble:
"Thanks! What type of property 
is it?"

Chips:
  "House / Bungalow"
  "Condo unit"
  "Office / Commercial"
  "Apartment"

Second AI bubble (after selection):
"Which floor is the room on?"

Chips:
  "Ground floor"
  "2nd floor"
  "3rd floor"
  "4th floor or higher"

────────────────────────────────────
FRAME 7 — Preferred schedule
────────────────────────────────────
Progress: Step 6 active

AI bubble:
"Got it! When would you like 
the delivery and installation?"

Chips:
  "ASAP (this week)"
  "Next week"
  "Choose a specific date"

Second AI bubble (after selection):
"What time works best for you?"

Chips:
  "Morning (8AM–12PM)"
  "Afternoon (1PM–5PM)"
  "Flexible anytime"

────────────────────────────────────
FRAME 8 — Contact number
────────────────────────────────────
Progress: Step 7 active

AI bubble:
"Almost done, Juan!

What's the best mobile number 
for our team to reach you?"

No chips — number input
Placeholder: "e.g. 0912-345-6789"

────────────────────────────────────
FRAME 9 — Order summary
────────────────────────────────────
Progress: All 7 steps done (green)

AI bubble:
"Here's your complete inquiry 
summary, Juan!"

Summary card inside chat bubble:
┌────────────────────────────────┐
│ Your Inquiry Summary           │
│ ─────────────────────────────  │
│ Product    Panasonic Aero 2HP  │
│ HP / Qty   1HP · 1 unit        │
│ Address    123 Colon St,       │
│            Brgy. Santo Niño    │
│            Cebu City           │
│ Property   House, 2nd floor    │
│ Schedule   May 10, Morning     │
│ Contact    0912-345-6789       │
└────────────────────────────────┘

AI bubble below card:
"Does everything look correct?
I'll send this to the Hamel 
team right away!"

Chips: 
  "Yes, send it!"
  "Edit something"

────────────────────────────────────
FRAME 10 — Send options
────────────────────────────────────
AI bubble:
"All set, Juan! Choose how you'd 
like to send your inquiry to 
our team:"

Button 1 (full width, filled blue):
  💬 icon + "Continue on Messenger"
  Subtext (11px gray below button):
  "Opens with your details ready"

Button 2 (full width, filled green):
  📲 icon + "Continue on WhatsApp"
  Subtext:
  "Message opens with your 
  details ready"

Small text below both buttons:
"Your complete order details will 
be automatically included — no 
need to retype anything."

────────────────────────────────────
FRAME 11 — FAQ answer state
(Can appear at ANY step)
────────────────────────────────────
Show mid-conversation example:

Customer typed: 
  "libre ba ang installation?"

AI bubble:
"Yes! Professional installation 
is included with your order.

Our TESDA-certified installers 
will handle everything. Additional 
charges may apply for high floors 
or special wall types.

Now, let's continue — where will 
the aircon be installed?"

Same chips from interrupted step 
still shown below

Design note: Show this as a 
mid-conversation interrupt example 
so client understands AI can answer 
questions at any point

────────────────────────────────────
FRAME 12 — Human handoff
────────────────────────────────────
Triggered when customer types:
"talk to someone" / "human" / 
"tao" / "representative" / 
"pwede makausap"

AI bubble:
"Of course, Juan! Let me connect 
you with our team right away.

I'll include everything we've 
discussed so you won't need 
to repeat yourself."

Button 1 (full width, filled blue):
  💬 "Continue on Messenger"
  Subtext: "Chat opens with 
  your details ready"

Button 2 (full width, filled green):
  📲 "Continue on WhatsApp"
  Subtext: "Message opens with 
  your details ready"

Small note below:
  Lock icon + "Your inquiry summary 
  will be automatically included 
  in the message."

═══════════════════════════════════════
AUTO-GENERATED MESSAGE TEMPLATE
(Reference frame — show in Figma
as a WhatsApp/Messenger preview)
═══════════════════════════════════════

Messenger / WhatsApp preview mockup:

"Hi Hamel Trading! 
Here's my inquiry:

Customer:  Juan dela Cruz
Product:   Panasonic Aero 
           Series Inverter
HP / Qty:  1HP · 1 unit
Address:   123 Colon St, 
           Brgy. Santo Niño, 
           Cebu City
Property:  House, 2nd floor
Schedule:  May 10, Morning 
           (8AM–12PM)
Contact:   0912-345-6789

Sent via Hamel AI Assistant"

Design as a phone mockup showing 
the WhatsApp or Messenger interface 
with this message pre-typed in 
the input bar — ready to send.

═══════════════════════════════════════
FAQ RESPONSES
(Design as example AI bubbles — 
show in a separate reference frame)
═══════════════════════════════════════

Show these as a grid of AI bubble 
examples so client can see all the 
questions the AI can handle:

Q: "magkano?" / "how much?"
A: "Prices start at ₱12,500 for 
   window type and ₱18,900 for 
   split type inverter. Final price 
   depends on the HP and brand."

Q: "warranty?"
A: "All units have official 
   manufacturer warranty — 1 year 
   parts & labor, up to 5 years on 
   the compressor for inverter units."

Q: "libre ba installation?"
A: "Yes! Installation is included. 
   Our TESDA-certified team handles 
   everything. Additional fees may 
   apply for high floors."

Q: "saan kayo nagde-deliver?"
A: "We deliver across Metro Cebu — 
   Cebu City, Mandaue, Lapu-Lapu, 
   Talisay, Consolacion, and more. 
   Usually 3–5 business days."

Q: "ano difference ng inverter?"
A: "Inverter aircons save 30–50% 
   on electricity vs non-inverter. 
   They auto-adjust power to 
   maintain your set temperature."

Q: "anong HP ang tama?"
A: "0.75HP = up to 12sqm
   1HP = 12–22sqm
   1.5HP = 22–35sqm
   2HP = 35–50sqm"

Q: "anong brands?"
A: "We carry Samsung, Carrier, 
   Panasonic, Daikin, Midea, 
   and LG — all with official 
   warranties."

Q: "paano mag-maintain?"
A: "Clean the filter every 2–4 
   weeks, professional cleaning 
   every 6 months. Hamel also 
   offers maintenance services!"

═══════════════════════════════════════
FLOATING CHAT TRIGGER BUTTON
(Shows on all website pages)
═══════════════════════════════════════

Position: Fixed bottom right
  (24px from bottom and right edge)

Defa