import { X, Send, Tag, CreditCard, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createInquiry } from '../admin/lib/inquiries-api';
import { trackEvent } from '../admin/lib/ops-api';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { openUrlBlank } from '../lib/open-external';
import { copyTextToClipboard } from '../lib/product-actions';
import { sendChatAssist } from '../lib/chat-api';
import type { Product } from '../data/products';
import { promoCodes, installmentPlans, calcInstallment } from '../data/products';
import { hamelAssets } from '../data/hamelAssets';
import { ChatMarkdown } from './ChatMarkdown';
import { SelectOrEnterVoucher } from './SelectOrEnterVoucher';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  computeVoucherDiscount,
  recordVoucherRedemption,
  type StoreVoucher,
} from '../data/vouchers';
import {
  validateInquiryAddress,
  validateInquiryBeforeSubmit,
  validateInquiryName,
  validateInquiryPhone,
} from '../lib/inquiry-validation';

interface ConversationalInquiryModalProps {
  product: Product;
  onClose: () => void;
  onComplete: (data: InquiryFormData) => void;
}

export interface InquiryFormData {
  name: string;
  roomSize: string;
  hp: string;
  quantity: string;
  address: string;
  propertyType: string;
  floor: string;
  scheduleDate: string;
  scheduleTime: string;
  contactNumber: string;
  promoCode?: string;
  promoDiscount?: string;
  installmentMonths?: string;
  installmentMonthlyAmount?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
  /** Faith Hugs–style confirmation card after submit */
  kind?: 'text' | 'confirmation';
}

function PenguinAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-6 w-6' : 'h-10 w-10';
  return (
    <div
      className={`${dim} shrink-0 overflow-hidden rounded-full border border-[#BAE6FD] bg-white`}
    >
      <img src={hamelAssets.mascot.cta} alt="" className="h-full w-full object-contain p-0.5" />
    </div>
  );
}

function buildInquiryMessage(product: Product, data: Partial<InquiryFormData>): string {
  const promoLine = data.promoCode ? `\nPromo:     ${data.promoCode} (${data.promoDiscount})` : '';
  const installLine = data.installmentMonths
    ? `\nPayment:   ${data.installmentMonths}${data.installmentMonthlyAmount ? ` @ ${data.installmentMonthlyAmount}` : ''}`
    : '';
  return `Hi Hamel Trading!\nHere's my inquiry:\n\nCustomer:  ${data.name}\nProduct:   ${product.brand} ${product.model}\nHP / Qty:  ${data.hp} · ${data.quantity} unit(s)${installLine}\nAddress:   ${data.address}\nProperty:  ${data.propertyType}, ${data.floor}\nSchedule:  ${data.scheduleDate}, ${data.scheduleTime}\nContact:   ${data.contactNumber}${promoLine}\n\nSent via Hamel AI Assistant`;
}

function looksLikeSideQuestion(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.includes('?')) return true;
  return /^(what|how|why|when|where|can|could|is|are|do|does|magkano|libre|warranty|garantiya|install|delivery|payment|installment|ano|pwede|meron)/i.test(
    t
  );
}

// 9 steps: name, room, quantity, address, property+floor, schedule, installment, promoCode, contact+summary
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const TOTAL_STEPS = 9;

export function ConversationalInquiryModal({ product, onClose, onComplete }: ConversationalInquiryModalProps) {
  const { whatsappUrl, messengerUrl } = useStoreSettings();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi there! I'm Hamel's AI assistant.\nI see you're interested in the **${product.brand} ${product.model}**!\n\nI'll help you place your inquiry — it only takes about 2 minutes. Let's start!\n\nFirst, what's your name?`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [formData, setFormData] = useState<Partial<InquiryFormData>>({});
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [subStep, setSubStep] = useState<'main' | 'time' | 'date' | 'hp-recommendation'>('main');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [messengerAutoSend, setMessengerAutoSend] = useState(false);
  const [messengerConsentOpen, setMessengerConsentOpen] = useState(false);

  // Promo code UI state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<StoreVoucher | null>(null);
  const [promoStatus, setPromoStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [promoDetails, setPromoDetails] = useState<{ label: string } | null>(null);

  // Installment UI state
  const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/messenger/status');
        if (!res.ok) return;
        const data = (await res.json()) as { configured?: boolean };
        if (!cancelled) setMessengerAutoSend(Boolean(data.configured));
      } catch {
        // keep prefill fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const addMessage = (text: string, sender: 'ai' | 'user', kind: Message['kind'] = 'text') => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      sender,
      timestamp: new Date(),
      kind,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addAIMessage = (text: string, delay: number = 1000) => {
    setIsTyping(true);
    setShowQuickReplies(false);
    setTimeout(() => {
      addMessage(text, 'ai');
      setIsTyping(false);
      setShowQuickReplies(true);
    }, delay);
  };

  const stepPrompt = (): string => {
    if (currentStep === 1) return "First, what's your name?";
    if (currentStep === 2 && subStep === 'main') return 'What is the size of the room where you\'ll install the aircon?';
    if (currentStep === 2) return 'Shall I use the recommended HP, or pick another?';
    if (currentStep === 3) return 'How many units do you need?';
    if (currentStep === 4) return 'Please share the installation address (barangay + city; street/house # optional).';
    if (currentStep === 5 && subStep === 'main') return 'What type of property is it?';
    if (currentStep === 5) return 'Which floor is the room on?';
    if (currentStep === 6 && subStep === 'main') return 'When would you like delivery and installation?';
    if (currentStep === 6 && subStep === 'date') return 'What date would you like for delivery and installation?';
    if (currentStep === 6) return 'What time works best for you?';
    if (currentStep === 7) return 'Choose an installment plan, or say "No installment".';
    if (currentStep === 8) return 'Enter a promo code, or tap Skip.';
    if (currentStep === 9 && !formData.contactNumber) return "What's the best mobile number for our team?";
    return 'Does everything look correct?';
  };

  const answerSideQuestion = async (userInput: string) => {
    setIsTyping(true);
    setShowQuickReplies(false);
    try {
      const res = await sendChatAssist({
        message: `Customer is inquiring about ${product.brand} ${product.model} (product id ${product.id}). They asked: ${userInput}\n\nAnswer briefly, then remind them to continue the inquiry.`,
        history: [],
      });
      const reply =
        (res.reply?.trim() ||
          "Happy to help! For a firm quote our team can follow up after this inquiry.") +
        `\n\nWhen you're ready — ${stepPrompt()}`;
      addMessage(reply, 'ai');
    } catch {
      addMessage(
        `I can help with that after we finish your inquiry, or you can ask our team on Messenger.\n\n${stepPrompt()}`,
        'ai'
      );
    } finally {
      setIsTyping(false);
      setShowQuickReplies(true);
    }
  };

  const handleUserMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping || submitting || submitted) return;
    setInputText('');
    addMessage(trimmed, 'user');
    setShowQuickReplies(false);
    void processStep(trimmed);
  };

  const processStep = async (userInput: string) => {
    const lowerInput = userInput.toLowerCase();

    // FAQ / human handoff shortcuts
    if (lowerInput.includes('human') || lowerInput.includes('tao') || lowerInput.includes('talk to') || lowerInput.includes('makausap')) {
      handleHumanHandoff();
      return;
    }

    // Off-script product questions → real AI assist, then continue the step
    const quick = getQuickReplies().map((q) => q.toLowerCase());
    const isQuickPick = quick.some((q) => lowerInput === q || lowerInput.includes(q.slice(0, 12)));
    if (
      !isQuickPick &&
      looksLikeSideQuestion(userInput) &&
      !(currentStep === 9 && formData.contactNumber)
    ) {
      await answerSideQuestion(userInput);
      return;
    }

    switch (currentStep) {
      case 1: {
        const nameCheck = validateInquiryName(userInput);
        if (!nameCheck.ok) {
          addAIMessage(`${nameCheck.message}\n\n${stepPrompt()}`, 700);
          break;
        }
        setFormData((prev) => ({ ...prev, name: nameCheck.value }));
        addAIMessage(
          `Nice to meet you, **${nameCheck.value}**!\n\nNow let's make sure you get the right HP size.\n\nWhat is the size of the room where you'll install the aircon?`,
          1000
        );
        setCurrentStep(2);
        break;
      }

      case 2:
        if (subStep === 'main') {
          let roomSize = userInput;
          if (lowerInput.includes('small') || lowerInput.includes('up to 15')) roomSize = 'Small (up to 15sqm)';
          else if (lowerInput.includes('medium') || lowerInput.includes('15') || lowerInput.includes('25')) roomSize = 'Medium (15-25sqm)';
          else if (lowerInput.includes('large') || lowerInput.includes('40')) roomSize = 'Large (25-40sqm)';
          else if (lowerInput.includes('not sure')) roomSize = 'Not sure';

          setFormData((prev) => ({ ...prev, roomSize }));

          const rec = roomSize.includes('Small') ? '0.75HP' :
                      roomSize.includes('Medium') ? '1HP' :
                      roomSize.includes('Large') ? '1.5HP' : '1HP';

          addAIMessage(`Got it! For ${roomSize.toLowerCase()}, I recommend ${rec} — it's the most efficient choice for that space.\n\nShall I set it to ${rec} for you?`, 1000);
          setSubStep('hp-recommendation');
        } else if (subStep === 'hp-recommendation') {
          let hp = '1HP';
          if (lowerInput.includes('yes')) hp = '1HP';
          else if (lowerInput.includes('0.75')) hp = '0.75HP';
          else if (lowerInput.includes('1.5')) hp = '1.5HP';
          else if (lowerInput.includes('2')) hp = '2HP';

          setFormData((prev) => ({ ...prev, hp }));
          addAIMessage(`Perfect! ${hp} it is.\n\nHow many units do you need?`, 1000);
          setCurrentStep(3);
          setSubStep('main');
        }
        break;

      case 3: {
        let quantity = userInput;
        if (userInput === '1' || lowerInput.includes('1 unit')) quantity = '1';
        else if (lowerInput.includes('2')) quantity = '2';
        else if (lowerInput.includes('3')) quantity = '3';

        setFormData((prev) => ({ ...prev, quantity }));
        addAIMessage(`Great, ${quantity} unit${quantity !== '1' ? 's' : ''}!\n\nNow, where will the aircon be installed?\n\nBarangay and city/municipality are enough — street or house number is optional if you don’t have one.`, 1000);
        setCurrentStep(4);
        break;
      }

      case 4: {
        const addressCheck = validateInquiryAddress(userInput);
        if (!addressCheck.ok) {
          addAIMessage(`${addressCheck.message}\n\n${stepPrompt()}`, 700);
          break;
        }
        setFormData((prev) => ({ ...prev, address: addressCheck.value }));
        addAIMessage('Thanks! What type of property is it?', 1000);
        setCurrentStep(5);
        break;
      }

      case 5:
        if (subStep === 'main') {
          setFormData((prev) => ({ ...prev, propertyType: userInput }));
          addAIMessage("Which floor is the room on?", 1000);
          setSubStep('time');
        } else if (subStep === 'time') {
          setFormData((prev) => ({ ...prev, floor: userInput }));
          addAIMessage("Got it! When would you like the delivery and installation?", 1000);
          setCurrentStep(6);
          setSubStep('main');
        }
        break;

      case 6:
        if (subStep === 'main') {
          const wantsSpecificDate =
            lowerInput.includes('specific date') ||
            lowerInput.includes('choose a date') ||
            lowerInput.includes('pick a date') ||
            lowerInput === 'date';

          if (wantsSpecificDate) {
            addAIMessage(
              'Sure! What date works for you?\n\nYou can type something like **July 15**, **next Monday**, or **July 20, 2026**.',
              1000
            );
            setSubStep('date');
            break;
          }

          let scheduleDate = userInput;
          if (lowerInput.includes('asap') || lowerInput.includes('this week')) scheduleDate = 'ASAP (this week)';
          else if (lowerInput.includes('next week')) scheduleDate = 'Next week';

          setFormData((prev) => ({ ...prev, scheduleDate }));
          addAIMessage("Got it! What time works best for you?", 1000);
          setSubStep('time');
        } else if (subStep === 'date') {
          setFormData((prev) => ({ ...prev, scheduleDate: userInput }));
          addAIMessage(`Noted — **${userInput}**. What time works best for you?`, 1000);
          setSubStep('time');
        } else if (subStep === 'time') {
          setFormData((prev) => ({ ...prev, scheduleTime: userInput }));
          addAIMessage(`Great! Would you like to pay in installments?\n\nWe offer 0% interest on 3, 6, and 12-month plans via credit card — or extended 24 and 36-month terms.\n\nPlease choose a payment plan below, or type "No installment" to pay in full.`, 1000);
          setCurrentStep(7);
          setSubStep('main');
        }
        break;

      case 7: {
        // Installment step — handled via buttons, but also accept text
        let installmentMonths = '';
        let installmentMonthlyAmount = '';

        if (lowerInput.includes('no') || lowerInput.includes('full') || lowerInput.includes('cash')) {
          installmentMonths = 'Full payment';
          installmentMonthlyAmount = '';
        } else {
          const match = userInput.match(/(\d+)/);
          if (match) {
            const months = parseInt(match[1]);
            const plan = installmentPlans.find(p => p.months === months);
            if (plan) {
              const monthly = calcInstallment(product.priceStart, plan.months, plan.interestRate);
              installmentMonths = `${months} months`;
              installmentMonthlyAmount = `₱${monthly.toLocaleString()}/month`;
            }
          }
        }

        setFormData((prev) => ({ ...prev, installmentMonths, installmentMonthlyAmount }));

        const installMsg = installmentMonths === 'Full payment'
          ? 'Full payment — got it!'
          : `${installmentMonths} at ${installmentMonthlyAmount} — noted!`;

        addAIMessage(`${installMsg}\n\nDo you have a promo code? Type it now to get a discount, or tap "Skip" to continue.`, 1000);
        setCurrentStep(8);
        setSelectedInstallment(null);
        break;
      }

      case 8: {
        // Promo code step
        const code = userInput.trim().toUpperCase();
        let promoCode = '';
        let promoDiscount = '';

        if (lowerInput === 'skip' || lowerInput === 'none' || lowerInput === 'no code' || lowerInput === 'wala') {
          promoCode = '';
          promoDiscount = '';
        } else if (promoCodes[code]) {
          const found = promoCodes[code];
          promoCode = code;
          promoDiscount = found.label;
        }

        setFormData((prev) => ({ ...prev, promoCode, promoDiscount }));

        const promoMsg = promoCode
          ? `Code "${promoCode}" applied — ${promoDiscount}! 🎉`
          : 'No promo code — no problem!';

        addAIMessage(`${promoMsg}\n\nAlmost done, ${formData.name}!\n\nWhat's the best mobile number for our team to reach you?`, 1000);
        setCurrentStep(9);
        setPromoStatus('idle');
        break;
      }

      case 9:
        // After contact is collected, this step handles confirmation
        if (formData.contactNumber) {
          if (
            lowerInput.includes('yes') ||
            lowerInput.includes('send') ||
            lowerInput.includes('correct') ||
            lowerInput.includes('ok')
          ) {
            const gate = validateInquiryBeforeSubmit(formData);
            if (!gate.ok) {
              addAIMessage(
                `Before I send this to Hamel Trading: ${gate.message}\n\nPlease reply with the corrected info, or tap **Edit something**.`,
                800
              );
              break;
            }
            void finalizeInquiry(formData as InquiryFormData);
          } else if (lowerInput.includes('edit')) {
            addAIMessage(
              'No problem! Tell me what to change (name, address, schedule, contact, etc.), or continue on Messenger with our team.',
              800
            );
          } else {
            addAIMessage('Reply **Yes, send it!** to submit to Hamel Trading, or **Edit something** to make changes.', 800);
          }
          break;
        }
        {
          const phoneCheck = validateInquiryPhone(userInput);
          if (!phoneCheck.ok) {
            addAIMessage(`${phoneCheck.message}\n\n${stepPrompt()}`, 700);
            break;
          }
          setFormData((prev) => ({ ...prev, contactNumber: phoneCheck.value }));
          showSummary({ ...formData, contactNumber: phoneCheck.value } as InquiryFormData);
        }
        break;
    }
  };

  const handleInstallmentSelect = (months: number) => {
    const plan = installmentPlans.find(p => p.months === months);
    if (!plan) return;
    setSelectedInstallment(months);
    const monthly = calcInstallment(product.priceStart, plan.months, plan.interestRate);
    const label = `${months} months`;
    const amount = `₱${monthly.toLocaleString()}/month`;
    setFormData((prev) => ({ ...prev, installmentMonths: label, installmentMonthlyAmount: amount }));

    // Auto-advance after selection
    setTimeout(() => {
      addMessage(`${months}-month installment at ${amount}`, 'user');
      addAIMessage(`${label} at ${amount} — noted!\n\nDo you have a promo code? Type it now to get a discount, or tap "Skip" to continue.`, 1000);
      setCurrentStep(8);
      setSelectedInstallment(null);
    }, 300);
  };

  const handlePromoCodeApply = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    if (promoCodes[code]) {
      setPromoStatus('valid');
      setPromoDetails({ label: promoCodes[code].label });
    } else {
      setPromoStatus('invalid');
      setPromoDetails(null);
    }
  };

  const handlePromoCodeSubmit = () => {
    if (promoStatus === 'valid' && promoDetails) {
      handleUserMessage(promoCodeInput.trim().toUpperCase());
    } else {
      handleUserMessage('Skip');
    }
    setPromoCodeInput('');
    setPromoStatus('idle');
    setPromoDetails(null);
  };

  const showSummary = (data: InquiryFormData) => {
    const promoLine = data.promoCode ? `\nPromo      ${data.promoCode} (${data.promoDiscount})` : '';
    const installLine = data.installmentMonths
      ? `\nPayment    ${data.installmentMonths}${data.installmentMonthlyAmount ? ` @ ${data.installmentMonthlyAmount}` : ''}`
      : '';
    const summary = `Here's your complete inquiry summary, **${data.name}**!\n\n**Your Inquiry Summary**\n- **Product:** ${product.brand} ${product.model}\n- **HP / Qty:** ${data.hp} · ${data.quantity} unit${data.quantity !== '1' ? 's' : ''}${installLine ? `\n- **Payment:** ${data.installmentMonths}${data.installmentMonthlyAmount ? ` @ ${data.installmentMonthlyAmount}` : ''}` : ''}\n- **Address:** ${data.address}\n- **Property:** ${data.propertyType}, ${data.floor}\n- **Schedule:** ${data.scheduleDate}, ${data.scheduleTime}\n- **Contact:** ${data.contactNumber}${promoLine ? `\n- **Promo:** ${data.promoCode} (${data.promoDiscount})` : ''}\n\nDoes everything look correct?\nI'll send this to the **Hamel Trading** team right away!`;

    addAIMessage(summary, 1200);
  };

  const finalizeInquiry = async (data: InquiryFormData): Promise<string | null> => {
    if (submitting || submitted) return inquiryId;

    const gate = validateInquiryBeforeSubmit(data);
    if (!gate.ok) {
      addAIMessage(
        `I can’t submit this yet — ${gate.message}\n\nPlease correct it here in chat first.`,
        600
      );
      return null;
    }
    setSubmitting(true);
    setIsTyping(true);
    setShowQuickReplies(false);

    const voucherLine = appliedVoucher
      ? `Voucher: ${appliedVoucher.code} (${appliedVoucher.label})`
      : data.promoCode
        ? `Promo: ${data.promoCode} (${data.promoDiscount})`
        : '';
    const notes = [
      voucherLine,
      data.installmentMonths
        ? `Payment: ${data.installmentMonths}${data.installmentMonthlyAmount ? ` @ ${data.installmentMonthlyAmount}` : ''}`
        : '',
      data.roomSize ? `Room: ${data.roomSize}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    let createdId: string | null = inquiryId;
    try {
      const res = await createInquiry({
        customerName: data.name || 'Guest',
        productLabel: `${product.brand} ${product.model}`,
        productId: product.id,
        quantity: data.quantity,
        phone: data.contactNumber,
        address: data.address,
        propertyType: data.propertyType,
        floor: data.floor,
        scheduleDate: data.scheduleDate,
        scheduleTime: data.scheduleTime,
        hp: data.hp,
        notes: notes || undefined,
        source: 'ai-chat',
      });
      createdId = res.id;
      setInquiryId(res.id);
      void trackEvent('chat_open', window.location.pathname, { productId: product.id });
      if (appliedVoucher) {
        void recordVoucherRedemption(appliedVoucher.id);
      }
    } catch {
      // still show confirmation + messaging options
    }

    setIsTyping(false);
    setSubmitted(true);
    addMessage(
      `Thank you for your Hamel Trading inquiry! Here are your order details:\n\n**Name:** ${data.name}\n**Phone:** ${data.contactNumber}\n**Address:** ${data.address}\n**Property:** ${data.propertyType}, ${data.floor}\n**Order:** ${data.quantity} × ${product.brand} ${product.model} (${data.hp})\n**Schedule:** ${data.scheduleDate}, ${data.scheduleTime}\n**Payment:** ${data.installmentMonths || 'To confirm with team'}${
        appliedVoucher
          ? `\n**Voucher:** ${appliedVoucher.code} (${appliedVoucher.label})`
          : data.promoCode
            ? `\n**Promo:** ${data.promoCode} (${data.promoDiscount})`
            : ''
      }\n\nOur team will follow up shortly. You can also continue on Messenger or WhatsApp below.`,
      'ai',
      'confirmation'
    );
    onComplete(data);
    setSubmitting(false);
    return createdId;
  };

  const handleHumanHandoff = () => {
    addAIMessage(
      `Of course, ${formData.name || 'there'}! You can continue with our team on Messenger or WhatsApp — I'll include everything we've gathered so far.`,
      1000
    );
  };

  const openWithDetails = async (platform: 'messenger' | 'whatsapp') => {
    const data = formData as InquiryFormData;
    const message = buildInquiryMessage(product, data);

    let id = inquiryId;
    if (!submitted) {
      id = await finalizeInquiry(data);
    }

    if (platform === 'whatsapp') {
      openUrlBlank(whatsappUrl(message));
      return;
    }

    // Clipboard + text= prefill always — Page auto-send needs a Meta webhook
    // and often fails for first-time empty chats even with a valid token.
    await copyTextToClipboard(message);

    if (messengerAutoSend && id) {
      try {
        await fetch('/api/messenger/expect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inquiryId: id }),
        });
      } catch {
        // still open Messenger
      }

      // Faith Hugs–style: open with ref only so the Page (not the customer) sends.
      // Clipboard is backup if Meta webhook is not connected yet.
      openUrlBlank(messengerUrl({ ref: `inquiry_${id}` }));

      const inquiryForDeliver = id;
      void (async () => {
        for (const delayMs of [1500, 3000, 5000, 8000, 12000, 18000, 25000]) {
          await new Promise((r) => setTimeout(r, delayMs));
          try {
            const res = await fetch('/api/messenger/deliver', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ inquiryId: inquiryForDeliver }),
            });
            const payload = (await res.json().catch(() => null)) as {
              sent?: boolean;
              reason?: string;
            } | null;
            if (payload?.sent || payload?.reason === 'Already sent') {
              console.info('[messenger] inquiry details delivered');
              return;
            }
            if (payload?.reason) {
              console.warn('[messenger] deliver pending:', payload.reason);
            }
          } catch {
            // retry
          }
        }
      })();
      onClose();
      return;
    }

    openUrlBlank(messengerUrl({ message, ref: id ? `inquiry_${id}` : undefined }));
    onClose();
  };

  const getQuickReplies = (): string[] => {
    if (currentStep === 1) return [];
    if (currentStep === 2) {
      if (subStep === 'main') return ['Small (up to 15sqm)', 'Medium (15-25sqm)', 'Large (25-40sqm)', 'Not sure'];
      return ['Yes, use recommended HP', 'I want 1.5HP', 'I want 2HP'];
    }
    if (currentStep === 3) return ['1 unit', '2 units', '3 units', 'More than 3'];
    if (currentStep === 4) return [];
    if (currentStep === 5) {
      if (subStep === 'main') return ['House / Bungalow', 'Condo unit', 'Office / Commercial', 'Apartment'];
      return ['Ground floor', '2nd floor', '3rd floor', '4th floor or higher'];
    }
    if (currentStep === 6) {
      if (subStep === 'main') return ['ASAP (this week)', 'Next week', 'Choose a specific date'];
      if (subStep === 'date') return [];
      return ['Morning (8AM-12PM)', 'Afternoon (1PM-5PM)', 'Flexible anytime'];
    }
    if (currentStep === 7) return ['No installment (full payment)'];
    if (currentStep === 8) return ['Skip'];
    if (currentStep === 9 && formData.contactNumber) return ['Yes, send it!', 'Edit something'];
    return [];
  };

  const getPlaceholder = (): string => {
    if (currentStep === 1) return 'Type your name...';
    if (currentStep === 2) return subStep === 'main' ? 'Or type room size...' : 'Choose or type HP...';
    if (currentStep === 3) return 'Type quantity...';
    if (currentStep === 4) return 'e.g. Simborio, Tayud, Liloan';
    if (currentStep === 5) return 'Choose or type...';
    if (currentStep === 6) {
      if (subStep === 'date') return 'e.g. July 15, next Monday...';
      return 'Choose or type...';
    }
    if (currentStep === 7) return 'Or type "No installment"...';
    if (currentStep === 8) return 'Enter promo code or type Skip...';
    if (currentStep === 9) return formData.contactNumber ? '' : 'e.g. 0912-345-6789';
    return 'Type your message...';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) handleUserMessage(inputText);
    }
  };

  const showSendButtons =
    !submitted &&
    (messages[messages.length - 1]?.text.includes('Does everything look correct') ||
      messages[messages.length - 1]?.text.includes('continue with our team on Messenger'));

  const showPostSubmitButtons = submitted;

  // Installment step inline UI
  const showInstallmentPicker = currentStep === 7 && showQuickReplies && !isTyping;

  // Promo code step inline UI
  const showPromoCodeUI = currentStep === 8 && showQuickReplies && !isTyping;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[480px] max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <PenguinAvatar size="md" />
            <div>
              <div className="font-bold text-gray-900">Chat with Hamel AI</div>
              <div className="text-xs text-gray-500">Typically replies instantly</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Online
            </div>
            <button type="button" onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Product Strip */}
        <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#E0F2FE' }}>
          <img src={product.image} alt={product.model} className="w-12 h-12 object-contain bg-white rounded" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium" style={{ color: '#0EA5E9' }}>{product.brand}</div>
            <div className="text-sm font-bold text-gray-900 truncate">{product.model}</div>
            <div className="text-xs" style={{ color: '#0EA5E9' }}>
              ₱{product.priceStart.toLocaleString()} – ₱{product.priceEnd.toLocaleString()}
            </div>
          </div>
          {/* Promo badge on product strip */}
          {product.installmentOptions && product.installmentOptions.length > 0 && (
            <div className="text-xs text-right shrink-0">
              <div className="font-semibold" style={{ color: '#0EA5E9' }}>0% Installment</div>
              <div className="text-gray-500">up to 12 months</div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#0c2340' }}>
          <div className="flex gap-0.5 flex-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{
                  backgroundColor:
                    i + 1 < currentStep ? '#4ade80' :
                    i + 1 === currentStep ? '#FFC107' :
                    '#2d5499'
                }}
              />
            ))}
          </div>
          <div className="text-xs ml-3 text-blue-200">Step {currentStep} of {TOTAL_STEPS}</div>
        </div>

        <div className="flex-1 overflow-y-auto">
        {/* Chat Area */}
        <div className="p-4 space-y-3">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.sender === 'ai' && (
                <div className="mr-2 mt-0.5 shrink-0">
                  <PenguinAvatar size="sm" />
                </div>
              )}
              <div
                className={`max-w-[75%] px-3 py-2 ${
                  message.sender === 'user'
                    ? 'text-white rounded-2xl rounded-br-sm'
                    : message.kind === 'confirmation'
                      ? 'rounded-2xl rounded-bl-sm border border-[#BAE6FD] bg-[#F0F9FF] text-gray-900'
                      : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200'
                }`}
                style={message.sender === 'user' ? { backgroundColor: '#0EA5E9' } : {}}
              >
                {message.kind === 'confirmation' ? (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0C4A6E]">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Inquiry Confirmation
                    </div>
                    <ChatMarkdown text={message.text} tone="ai" />
                  </div>
                ) : (
                  <ChatMarkdown
                    text={message.text}
                    tone={message.sender === 'user' ? 'user' : 'ai'}
                  />
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="mr-2 shrink-0">
                <PenguinAvatar size="sm" />
              </div>
              <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 w-14">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Confirm / send to Hamel Trading */}
        {(showSendButtons || showPostSubmitButtons) && (
          <div className="px-4 pb-4 space-y-3">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">
                  ₱{product.priceStart.toLocaleString()}
                </span>
              </div>
              <SelectOrEnterVoucher
                subtotal={product.priceStart}
                applied={appliedVoucher}
                onApply={setAppliedVoucher}
                productId={product.id}
              />
              {appliedVoucher ? (
                <div className="mt-2 flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-sm">
                  <span className="font-bold text-gray-900">Est. total</span>
                  <span className="font-black text-[#2563EB]">
                    ₱
                    {Math.max(
                      0,
                      product.priceStart -
                        computeVoucherDiscount(appliedVoucher, product.priceStart).amount
                    ).toLocaleString()}
                  </span>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMessengerConsentOpen(true)}
              className="w-full py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0EA5E9' }}
            >
              <div className="flex items-center justify-center gap-2">
                <img
                  src={hamelAssets.social.messenger}
                  alt=""
                  className="h-5 w-5 rounded-sm bg-white object-contain p-0.5"
                />
                <span>
                  {showSendButtons ? 'Send inquiry & continue in Messenger' : 'Continue in Messenger'}
                </span>
              </div>
              <div className="text-xs mt-1 opacity-80">
                Review what will be shared before continuing
              </div>
            </button>
            <p className="text-xs text-gray-500 text-center">
              Your complete order details will be saved for the Hamel team.
            </p>
          </div>
        )}

        <AlertDialog open={messengerConsentOpen} onOpenChange={setMessengerConsentOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send details to Messenger?</AlertDialogTitle>
              <AlertDialogDescription>
                Hamel Trading will save your inquiry and open Messenger with your selected product,
                name, phone number, address, schedule, and payment preference ready for the team.
                {' '}
                {messengerAutoSend
                  ? 'Hamel Trading will send your inquiry details into the chat automatically (you do not need to type or tap Send).'
                  : 'Messenger will open with your details ready to review and send.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={submitting}
                onClick={(event) => {
                  event.preventDefault();
                  setMessengerConsentOpen(false);
                  void openWithDetails('messenger');
                }}
                className="bg-[#0EA5E9] text-white hover:bg-[#0284C7]"
              >
                {submitting ? 'Sending…' : 'Send & open Messenger'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Installment Picker UI */}
        {showInstallmentPicker && !showSendButtons && !showPostSubmitButtons && (
          <div className="px-4 pb-3">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <CreditCard size={12} /> Choose an installment plan:
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {installmentPlans.map((plan) => {
                const monthly = calcInstallment(product.priceStart, plan.months, plan.interestRate);
                const isSelected = selectedInstallment === plan.months;
                return (
                  <button
                    key={plan.months}
                    onClick={() => handleInstallmentSelect(plan.months)}
                    className="flex flex-col items-center py-2 px-1 rounded-lg border-2 text-center transition-all"
                    style={{
                      borderColor: isSelected ? '#0EA5E9' : '#E5E7EB',
                      backgroundColor: isSelected ? '#E0F2FE' : '#FFF',
                    }}
                  >
                    <div className="text-sm font-bold text-gray-900">{plan.months}mo</div>
                    <div className="text-xs font-semibold" style={{ color: '#0EA5E9' }}>
                      ₱{monthly.toLocaleString()}
                    </div>
                    {plan.interestRate === 0 ? (
                      <div className="text-xs text-green-600">0% int.</div>
                    ) : (
                      <div className="text-xs text-orange-500">{plan.interestRate * 100}% p.a.</div>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handleUserMessage('No installment (full payment)')}
              className="w-full py-1.5 rounded-lg text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              No installment — pay in full
            </button>
          </div>
        )}

        {/* Promo Code UI */}
        {showPromoCodeUI && !showSendButtons && !showPostSubmitButtons && (
          <div className="px-4 pb-3">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Tag size={12} /> Enter promo code for additional discount:
            </div>
            <div className="flex gap-2 mb-1">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => {
                  setPromoCodeInput(e.target.value.toUpperCase());
                  setPromoStatus('idle');
                  setPromoDetails(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handlePromoCodeApply();
                }}
                placeholder="e.g. HAMEL10"
                className="flex-1 px-3 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] text-base font-mono uppercase"
              />
              <button
                onClick={handlePromoCodeApply}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#0EA5E9' }}
              >
                Apply
              </button>
            </div>

            {promoStatus === 'valid' && promoDetails && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1.5 rounded mb-1.5">
                <span>✓</span>
                <span className="font-semibold">{promoDetails.label}</span>
              </div>
            )}
            {promoStatus === 'invalid' && (
              <div className="text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded mb-1.5">
                Invalid promo code. Check the code and try again.
              </div>
            )}

            <div className="flex gap-2">
              {promoStatus === 'valid' ? (
                <button
                  onClick={handlePromoCodeSubmit}
                  className="flex-1 py-1.5 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#059669' }}
                >
                  Apply "{promoCodeInput}" and Continue
                </button>
              ) : (
                <button
                  onClick={() => handleUserMessage('Skip')}
                  className="flex-1 py-1.5 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Skip — I don't have a code
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-1.5 text-center">
              Try: HAMEL10 · SUMMER20 · CEBU500 · NEWCLIENT
            </p>
          </div>
        )}

        {/* Standard Quick Reply Chips */}
        {!showSendButtons && !showPostSubmitButtons && !showInstallmentPicker && !showPromoCodeUI && showQuickReplies && getQuickReplies().length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {getQuickReplies().map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleUserMessage(reply)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border-2 hover:text-white transition-colors"
                  style={{ borderColor: '#0EA5E9', color: '#0EA5E9' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0EA5E9';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#0EA5E9';
                  }}
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Input Bar */}
        {!showSendButtons && !showPostSubmitButtons && !showInstallmentPicker && !showPromoCodeUI && (
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type={currentStep === 9 && !formData.contactNumber ? 'tel' : 'text'}
                inputMode={currentStep === 9 && !formData.contactNumber ? 'tel' : 'text'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholder()}
                disabled={isTyping || submitting}
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] text-base disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => inputText.trim() && handleUserMessage(inputText)}
                disabled={!inputText.trim() || isTyping || submitting}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-50"
                style={{ backgroundColor: '#0EA5E9' }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
