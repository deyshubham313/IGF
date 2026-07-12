$content = Get-Content 'admin.html' -Raw -Encoding UTF8
$newJS = @"

// ══════════════════════════════════════════════════════════════════
// NEW FEATURE PANELS: Analytics, Orders, Customers, Inventory, Coupons
// ══════════════════════════════════════════════════════════════════

// Analytics
function initAnalytics() {
  var cats = [
    { name:'Air Hockey', pct:32, rev:'Rs18L' }, { name:'Bumper Cars', pct:28, rev:'Rs15L' },
    { name:'VR Simulators', pct:18, rev:'Rs10L' }, { name:'Kiddy Rides', pct:12, rev:'Rs7L' },
    { name:'Basketball', pct:10, rev:'Rs5L' }
  ];
  var tEl = document.getElementById('topProdsChart');
  if (tEl) {
    tEl.innerHTML = cats.map(function(c) {
      return '<div style="margin-bottom:14px;">'
        + '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">'
        + '<span style="font-size:0.85rem;color:var(--text-primary);">' + c.name + '</span>'
        + '<span style="font-family:Orbitron,sans-serif;font-size:0.7rem;color:var(--igf-orange);">' + c.rev + ' (' + c.pct + '%)</span>'
        + '</div>'
        + '<div style="height:5px;background:rgba(255,87,34,0.1);border-radius:3px;overflow:hidden;">'
        + '<div style="width:' + c.pct + '%;height:100%;background:linear-gradient(90deg,#c0392b,#ff5722);border-radius:3px;"></div>'
        + '</div></div>';
    }).join('');
  }
  if (window.Chart) { renderRevenueChart(); }
  else {
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
    s.onload = renderRevenueChart;
    document.head.appendChild(s);
  }
}

function renderRevenueChart() {
  var ctx = document.getElementById('revenueChart');
  if (!ctx || ctx._igfChart) return;
  ctx._igfChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [{ label: 'Revenue (Rs L)', data: [3.2,4.8,5.1,6.8,7.2,9.5,8.3,10.2,11.4,9.8,6.5,7.9], backgroundColor: 'rgba(255,87,34,0.3)', borderColor: '#ff5722', borderWidth: 2, borderRadius: 4 }]
    },
    options: {
      plugins: { legend: { labels: { color: '#8a6050' } } },
      scales: { x: { ticks: { color: '#8a6050' }, grid: { color: 'rgba(255,87,34,0.06)' } }, y: { ticks: { color: '#8a6050' }, grid: { color: 'rgba(255,87,34,0.06)' } } }
    }
  });
}

// Orders
var MOCK_ORDERS = [
  { id:'IGF-2026-001', product:'Air Hockey Table', customer:'Rajesh Kumar', city:'Mumbai', amount:'Rs2,45,000', status:'delivered', date:'5 Jun 2026' },
  { id:'IGF-2026-042', product:'Bumper Car x4', customer:'Priya Hotels Ltd', city:'Bengaluru', amount:'Rs6,80,000', status:'dispatched', date:'18 Jun 2026' },
  { id:'IGF-2026-088', product:'VR Simulator', customer:'FunZone Pvt Ltd', city:'Delhi', amount:'Rs4,20,000', status:'processing', date:'24 Jun 2026' },
  { id:'IGF-2026-125', product:'Kiddy Rides x8', customer:'Amusement Hub', city:'Hyderabad', amount:'Rs3,60,000', status:'confirmed', date:'26 Jun 2026' },
  { id:'IGF-2026-093', product:'Basketball Machine x2', customer:'Sports Arena', city:'Pune', amount:'Rs1,80,000', status:'delivered', date:'12 Jun 2026' },
];
function initAdminOrders() { renderOrdersTable(MOCK_ORDERS); }
function renderOrdersTable(orders) {
  var body = document.getElementById('ordersTableBody');
  if (!body) return;
  var sc = { delivered:'#4ade80', dispatched:'#60a5fa', processing:'#fbbf24', confirmed:'#ff5722' };
  body.innerHTML = orders.map(function(o) {
    return '<tr style="border-bottom:1px solid rgba(255,87,34,0.06);">'
      + '<td style="padding:12px 10px;font-family:Orbitron,sans-serif;font-size:0.65rem;color:var(--igf-orange);">'+o.id+'</td>'
      + '<td style="padding:12px 10px;font-size:0.83rem;color:var(--text-primary);">'+o.product+'</td>'
      + '<td style="padding:12px 10px;font-size:0.83rem;color:var(--text-muted);">'+o.customer+'</td>'
      + '<td style="padding:12px 10px;font-family:Orbitron,sans-serif;font-size:0.7rem;color:var(--igf-amber);">'+o.amount+'</td>'
      + '<td style="padding:12px 10px;"><span style="padding:4px 10px;border-radius:20px;font-family:Orbitron,sans-serif;font-size:0.45rem;color:'+(sc[o.status]||'#fff')+';border:1px solid '+(sc[o.status]||'rgba(255,255,255,0.2)')+';text-transform:uppercase;">'+o.status+'</span></td>'
      + '<td style="padding:12px 10px;font-size:0.78rem;color:var(--text-muted);">'+o.date+'</td></tr>';
  }).join('');
}

// Customers
var MOCK_CUSTOMERS = [
  { name:'Rajesh Kumar', city:'Mumbai', email:'rajesh@email.com', orders:3, spent:'Rs6,85,000' },
  { name:'Priya Hotels Ltd', city:'Bengaluru', email:'ops@priyahotels.com', orders:2, spent:'Rs8,20,000' },
  { name:'FunZone Pvt Ltd', city:'Delhi', email:'admin@funzone.in', orders:1, spent:'Rs4,20,000' },
  { name:'Amusement Hub', city:'Hyderabad', email:'contact@amhub.com', orders:4, spent:'Rs12,40,000' },
  { name:'Sports Arena', city:'Pune', email:'info@sportsarena.com', orders:2, spent:'Rs3,60,000' },
];
function initCustomers() {
  var body = document.getElementById('customersTableBody');
  if (!body) return;
  body.innerHTML = MOCK_CUSTOMERS.map(function(c, i) {
    return '<tr style="border-bottom:1px solid rgba(255,87,34,0.06);">'
      + '<td style="padding:12px 10px;font-family:Orbitron,sans-serif;font-size:0.6rem;color:var(--text-dim);">'+(i+1)+'</td>'
      + '<td style="padding:12px 10px;font-weight:600;color:var(--text-primary);">'+c.name+'</td>'
      + '<td style="padding:12px 10px;color:var(--text-muted);">'+c.city+'</td>'
      + '<td style="padding:12px 10px;color:var(--text-muted);">'+c.email+'</td>'
      + '<td style="padding:12px 10px;font-family:Orbitron,sans-serif;font-size:0.65rem;color:var(--igf-orange);text-align:center;">'+c.orders+'</td>'
      + '<td style="padding:12px 10px;font-family:Orbitron,sans-serif;font-size:0.68rem;color:var(--igf-amber);">'+c.spent+'</td></tr>';
  }).join('');
}

// Inventory
var STOCK_DATA = [
  { cat:'Air Hockey Tables', stock:12, max:20, status:'in-stock' },
  { cat:'Bumper Cars', stock:3, max:15, status:'low-stock' },
  { cat:'VR Simulators', stock:8, max:10, status:'in-stock' },
  { cat:'Kiddy Rides', stock:24, max:30, status:'in-stock' },
  { cat:'Basketball Machines', stock:1, max:10, status:'low-stock' },
  { cat:'Trampoline Parks', stock:0, max:5, status:'out-of-stock' },
];
function initInventory() {
  var body = document.getElementById('inventoryTableBody');
  if (!body) return;
  var sc = { 'in-stock':{ bg:'rgba(74,222,128,0.1)', color:'#4ade80', label:'IN STOCK' }, 'low-stock':{ bg:'rgba(251,191,36,0.1)', color:'#fbbf24', label:'LOW STOCK' }, 'out-of-stock':{ bg:'rgba(239,68,68,0.1)', color:'#ef4444', label:'OUT OF STOCK' } };
  body.innerHTML = STOCK_DATA.map(function(item) {
    var s = sc[item.status]; var pct = Math.round(item.stock/item.max*100);
    return '<div style="display:grid;grid-template-columns:2fr 1fr 2fr 1fr;gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,87,34,0.06);">'
      + '<div style="font-weight:600;color:var(--text-primary);">'+item.cat+'</div>'
      + '<div style="font-family:Orbitron,sans-serif;font-size:0.7rem;color:var(--igf-amber);">'+item.stock+'/'+item.max+'</div>'
      + '<div style="height:6px;background:rgba(255,87,34,0.1);border-radius:3px;overflow:hidden;"><div style="width:'+pct+'%;height:100%;background:'+s.color+';border-radius:3px;"></div></div>'
      + '<span style="padding:4px 10px;border-radius:20px;font-family:Orbitron,sans-serif;font-size:0.42rem;background:'+s.bg+';color:'+s.color+';text-align:center;">'+s.label+'</span>'
      + '</div>';
  }).join('');
}

// Coupons
function initCoupons() { renderCouponsList(); }
function getCoupons() {
  var def = [{code:'IGF10',pct:10,expiry:'2026-12-31',uses:45,maxUses:100},{code:'NEXUS20',pct:20,expiry:'2026-09-30',uses:12,maxUses:50},{code:'WELCOME',pct:5,expiry:'2026-12-31',uses:88,maxUses:200},{code:'PREMIUM15',pct:15,expiry:'2026-08-31',uses:7,maxUses:30},{code:'IGF2026',pct:12,expiry:'2026-12-31',uses:23,maxUses:80}];
  try { return JSON.parse(localStorage.getItem('igf_admin_coupons')||JSON.stringify(def)); } catch(e) { return def; }
}
function saveCoupons(c) { localStorage.setItem('igf_admin_coupons',JSON.stringify(c)); renderCouponsList(); }
function renderCouponsList() {
  var el = document.getElementById('couponsList');
  if (!el) return;
  el.innerHTML = getCoupons().map(function(c,i) {
    var pct2 = Math.round(c.uses/c.maxUses*100);
    return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,87,34,0.06);">'
      + '<span style="font-family:Orbitron,sans-serif;font-size:0.75rem;font-weight:700;color:var(--igf-orange);">'+c.code+'</span>'
      + '<span style="font-family:Orbitron,sans-serif;font-size:0.7rem;color:var(--igf-amber);">'+c.pct+'% OFF</span>'
      + '<span style="font-size:0.78rem;color:var(--text-muted);">'+c.expiry+'</span>'
      + '<div><span style="font-size:0.78rem;color:var(--text-muted);">'+c.uses+'/'+c.maxUses+'</span><div style="height:3px;background:rgba(255,87,34,0.1);border-radius:2px;margin-top:4px;overflow:hidden;"><div style="width:'+pct2+'%;height:100%;background:var(--igf-orange);"></div></div></div>'
      + '<button onclick="deleteCoupon('+i+')" style="background:transparent;border:1px solid rgba(239,68,68,0.25);color:#ef4444;width:28px;height:28px;border-radius:50%;cursor:none;display:flex;align-items:center;justify-content:center;">x</button>'
      + '</div>';
  }).join('');
}
function createCoupon() {
  var code=(document.getElementById('newCouponCode').value||'').trim().toUpperCase();
  var pct=parseInt(document.getElementById('newCouponPct').value||'0',10);
  var expiry=document.getElementById('newCouponExpiry').value;
  if(!code||!pct||!expiry){alert('Fill in Code, Discount %, and Expiry.');return;}
  var coupons=getCoupons();
  if(coupons.find(function(c){return c.code===code;})){alert('Code already exists.');return;}
  coupons.push({code:code,pct:pct,expiry:expiry,uses:0,maxUses:100});
  saveCoupons(coupons);
  document.getElementById('newCouponCode').value='';
  document.getElementById('newCouponPct').value='';
  document.getElementById('newCouponExpiry').value='';
  toast('Coupon '+code+' created!');
}
function deleteCoupon(idx) {
  var coupons=getCoupons();
  if(confirm('Delete '+coupons[idx].code+'?')){coupons.splice(idx,1);saveCoupons(coupons);toast('Coupon deleted.');}
}
"@

$endTag = "</script>`n</body>"
$content = $content.Replace($endTag, $newJS + "`n</script>`n</body>")
Set-Content 'admin.html' $content -Encoding UTF8
Write-Host "Done"
