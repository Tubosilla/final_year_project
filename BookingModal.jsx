import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatUGX } from '../data/data';
import './BookingModal.css';

export default function BookingModal({ service, onClose }) {
  const { currentUser, addBooking } = useApp();
  const [step, setStep] = useState(1); // 1: details, 2: payment
  const [form, setForm] = useState({
    basis: 'daily',
    quantity: 1,
    startDate: '',
    notes: ''
  });
  const [payment, setPayment] = useState({ method: '', txRef: '' });
  const [done, setDone] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const price = service.prices[form.basis];
  const total = price * form.quantity;

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handlePay = (e) => setPayment(p => ({ ...p, [e.target.name]: e.target.value }));

  const submitBooking = () => {
    const id = addBooking({
      clientId: currentUser.id,
      clientName: currentUser.name,
      serviceId: service.id,
      serviceName: service.name,
      basis: form.basis,
      quantity: Number(form.quantity),
      price,
      total,
      startDate: form.startDate,
      notes: form.notes,
      paymentMethod: payment.method || null,
      paymentStatus: payment.method ? 'pending-verification' : 'unpaid',
    });
    setBookingId(id);
    setDone(true);
  };

  if (done) return (
    <div className="modal-overlay">
      <div className="booking-modal fade-in">
        <div className="done-state">
          <div className="done-icon">✅</div>
          <h2>Booking Submitted!</h2>
          <p>Your <strong>{service.name}</strong> booking <strong>({bookingId.toUpperCase()})</strong> has been received.</p>
          <p>We will confirm and assign a staff member shortly. You'll be notified.</p>
          <div className="done-summary">
            <div className="ds-row"><span>Service</span><span>{service.name}</span></div>
            <div className="ds-row"><span>Total</span><span style={{color: service.accent, fontWeight:700}}>{formatUGX(total)}</span></div>
            <div className="ds-row"><span>Start Date</span><span>{form.startDate}</span></div>
            <div className="ds-row"><span>Payment</span><span>{payment.method || 'Not paid yet'}</span></div>
          </div>
          <button className="btn btn-primary w-full" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-modal fade-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="bk-header" style={{ background: service.color }}>
          <span className="bk-icon">{service.icon}</span>
          <div>
            <h2 style={{ color: service.accent }}>Book {service.name}</h2>
            <p style={{ color: service.accent, opacity: 0.7 }}>
              {formatUGX(price)} per {form.basis}
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="steps-bar">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1 Details</div>
          <div className="step-line" />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2 Payment</div>
        </div>

        {step === 1 && (
          <div className="bk-body">
            <div className="form-group">
              <label>Pricing Basis</label>
              <select name="basis" value={form.basis} onChange={handle}>
                {['hourly','daily','weekly','monthly'].map(b => (
                  <option key={b} value={b}>{b.charAt(0).toUpperCase()+b.slice(1)} — {formatUGX(service.prices[b])}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity ({form.basis === 'hourly' ? 'hours' : form.basis === 'daily' ? 'days' : form.basis === 'weekly' ? 'weeks' : 'months'})</label>
              <input type="number" name="quantity" value={form.quantity} min="1" max="52" onChange={handle} />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handle} min={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="form-group">
              <label>Special Notes / Instructions</label>
              <textarea name="notes" value={form.notes} onChange={handle} rows="3" placeholder="Any special requirements..." />
            </div>
            <div className="total-box" style={{ borderColor: service.accent }}>
              <span>Total Estimate</span>
              <strong style={{ color: service.accent }}>{formatUGX(total)}</strong>
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ background: service.accent }}
              onClick={() => form.startDate ? setStep(2) : alert('Please select a start date')}
            >
              Continue to Payment →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bk-body">
            <div className="pay-summary">
              <p>You're booking <strong>{service.name}</strong></p>
              <div className="pay-total">{formatUGX(total)}</div>
              <p className="pay-sub">{form.quantity} {form.basis}(s) starting {form.startDate}</p>
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select name="method" value={payment.method} onChange={handlePay}>
                <option value="">-- Select (or pay later) --</option>
                <option value="mobile-money">📱 Mobile Money (MTN / Airtel)</option>
                <option value="bank-transfer">🏦 Bank Transfer</option>
                <option value="cash">💵 Cash on Service Day</option>
              </select>
            </div>

            {payment.method === 'mobile-money' && (
              <div className="pay-instructions">
                <h4>📱 Mobile Money Instructions</h4>
                <p>1. Dial <strong>*165#</strong> (MTN) or <strong>*185#</strong> (Airtel)</p>
                <p>2. Send <strong>{formatUGX(total)}</strong> to: <strong>0700 123 456</strong></p>
                <p>3. Name: <strong>Mpigi Care Ltd</strong></p>
                <div className="form-group" style={{marginTop:12}}>
                  <label>Transaction Reference (optional)</label>
                  <input name="txRef" value={payment.txRef} onChange={handlePay} placeholder="e.g. MTNUG12345678" />
                </div>
              </div>
            )}

            {payment.method === 'bank-transfer' && (
              <div className="pay-instructions">
                <h4>🏦 Bank Transfer Details</h4>
                <p>Bank: <strong>Centenary Bank Uganda</strong></p>
                <p>Account: <strong>3001234567</strong></p>
                <p>Name: <strong>Mpigi Care Services Ltd</strong></p>
                <p>Branch: <strong>Mpigi Branch</strong></p>
              </div>
            )}

            <div className="btn-row">
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ background: service.accent }} onClick={submitBooking}>
                ✅ Confirm Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
