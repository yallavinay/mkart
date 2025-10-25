// Checkout page logic
let coAddresses = [];
let coSelectedAddressId = null;
let coCart = [];
let coSummary = { subtotal: 0, shipping: 0, codFee: 0, total: 0 };

document.addEventListener('DOMContentLoaded', async () => {
  await coEnsureAuthenticated();
  await coLoadCart();
  await coLoadAddresses();
  coBindEvents();
  coRecalc();
});

async function coEnsureAuthenticated() {
  const resp = await fetch('/api/users/session', { credentials: 'include' });
  if (!resp.ok) {
    coShowError('Please login to continue');
    setTimeout(() => (window.location.href = '/login'), 1200);
    throw new Error('Not authenticated');
  }
}

async function coLoadCart() {
  const r = await fetch('/api/users/cart', { credentials: 'include' });
  if (!r.ok) throw new Error('Failed to load cart');
  coCart = await r.json();
  const subtotal = coCart.reduce((s, it) => s + it.medicine.sellingPrice * it.quantity, 0);
  coSummary.subtotal = subtotal;
}

async function coLoadAddresses() {
  const r = await fetch('/api/users/addresses', { credentials: 'include' });
  if (!r.ok) throw new Error('Failed to load addresses');
  coAddresses = await r.json();
  const list = document.getElementById('addressesList');
  if (!coAddresses.length) {
    list.innerHTML = '<div class="text-muted">No addresses saved. Please add one.</div>';
    return;
  }
  const defaultAddr = coAddresses.find(a => a.isDefault) || coAddresses[0];
  coSelectedAddressId = defaultAddr.id ?? defaultAddr._id;
  list.innerHTML = coAddresses
    .map((a) => {
      const id = a.id ?? a._id;
      const isDefault = !!a.isDefault;
      const type = (((a.addressType || a.type) || 'home') + '').toUpperCase();
      const fullName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      const line1 = a.address || a.line1 || '';
      const district = a.district || '';
      const state = a.state || '';
      const pin = a.pinCode || a.pincode || '';
      const selected = id === coSelectedAddressId ? 'checked' : '';
      return `
        <label class="address-card ${isDefault ? 'default' : ''} w-100">
          <div class="form-check">
            <input class="form-check-input" type="radio" name="coAddress" value="${id}" ${selected}>
            <div class="ms-2">
              <div class="fw-bold">${type} ${isDefault ? '<span class="badge bg-success ms-2">Default</span>' : ''}</div>
              <div>${fullName}</div>
              <div>${line1}</div>
              <div>${district}${district && state ? ', ' : ''}${state}${pin ? ` - ${pin}` : ''}</div>
            </div>
          </div>
        </label>`;
    })
    .join('');
}

function coBindEvents() {
  // address change
  const list = document.getElementById('addressesList');
  list?.addEventListener('change', (e) => {
    if (e.target.name === 'coAddress') {
      coSelectedAddressId = e.target.value;
    }
  });

  // add address inline
  document.getElementById('addAddressInlineBtn')?.addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('checkoutAddressModal'));
    document.getElementById('checkoutAddressForm').reset();
    modal.show();
  });

  document.getElementById('coSaveAddressBtn')?.addEventListener('click', coSaveAddressInline);

  // payment change
  document.getElementById('pmCOD')?.addEventListener('change', coRecalc);
  document.getElementById('pmRazorpay')?.addEventListener('change', coRecalc);

  // place order
  document.getElementById('placeOrderBtn')?.addEventListener('click', coPlaceOrder);
}

async function coSaveAddressInline() {
  const data = {
    addressType: document.getElementById('coAddressType').value,
    firstName: document.getElementById('coFirstName').value,
    lastName: document.getElementById('coLastName').value,
    mobile: document.getElementById('coMobile').value,
    address: document.getElementById('coAddress').value,
    pinCode: document.getElementById('coPinCode').value,
    district: document.getElementById('coDistrict').value,
    state: document.getElementById('coState').value,
    landmark: document.getElementById('coLandmark').value,
    isDefault: document.getElementById('coIsDefault').checked
  };
  try {
    const r = await fetch('/api/users/addresses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('Failed to save address');
    bootstrap.Modal.getInstance(document.getElementById('checkoutAddressModal'))?.hide();
    await coLoadAddresses();
    coShowSuccess('Address added');
  } catch (e) {
    coShowError(e.message);
  }
}

function coRecalc() {
  coSummary.shipping = coSummary.subtotal > 500 ? 0 : 50;
  const cod = document.getElementById('pmCOD')?.checked;
  coSummary.codFee = cod ? 10 : 0;
  coSummary.total = coSummary.subtotal + coSummary.shipping + coSummary.codFee;
  document.getElementById('sumSubtotal').textContent = `₹${coSummary.subtotal.toFixed(2)}`;
  document.getElementById('sumShipping').textContent = coSummary.shipping ? `₹${coSummary.shipping}` : 'FREE';
  document.getElementById('sumCodFee').textContent = `₹${coSummary.codFee}`;
  document.getElementById('sumTotal').textContent = `₹${coSummary.total.toFixed(2)}`;
}

async function coPlaceOrder() {
  if (!coSelectedAddressId) {
    coShowError('Please select a delivery address');
    return;
  }
  const paymentMethod = document.getElementById('pmCOD').checked ? 'cod' : 'online';

  // Build shippingAddress object from selected address
  const addr = coAddresses.find(a => (a.id ?? a._id) == coSelectedAddressId);
  if (!addr) { coShowError('Invalid address'); return; }
  const shippingAddress = {
    addressType: addr.addressType || addr.type || 'home',
    firstName: addr.firstName,
    lastName: addr.lastName,
    mobile: addr.mobile,
    address: addr.address || addr.line1,
    pinCode: addr.pinCode || addr.pincode,
    district: addr.district,
    state: addr.state,
    landmark: addr.landmark || ''
  };

  try {
    const r = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ shippingAddress, paymentMethod })
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to place order');
    }
    coShowSuccess('Order placed successfully');
    setTimeout(() => (window.location.href = '/orders'), 1200);
  } catch (e) {
    console.error('Order error:', e);
    coShowError(e.message);
  }
}

function coShowSuccess(msg) { coShowNotification(msg, 'success'); }
function coShowError(msg) { coShowNotification(msg, 'danger'); }
function coShowNotification(message, type) {
  const existing = document.querySelectorAll('.notification');
  existing.forEach(n => n.remove());
  const n = document.createElement('div');
  n.className = `alert alert-${type} notification position-fixed`;
  n.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:300px;box-shadow:0 4px 12px rgba(0,0,0,0.15);border:none;border-radius:8px;';
  n.innerHTML = `<div class="d-flex align-items-center"><i class="fas fa-${type==='success'?'check-circle':'exclamation-circle'} me-2"></i><span>${message}</span><button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
  document.body.appendChild(n);
  setTimeout(() => { if (n.parentNode) n.remove(); }, 5000);
}
