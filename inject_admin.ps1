$content = Get-Content 'admin.html' -Raw -Encoding UTF8
$newPanels = @"

    <!-- SALES ANALYTICS -->
    <div class="panel" id="panel-analytics">
      <div class="panel-header"><div class="panel-tag">Insights</div><div class="panel-title">Sales <span class="accent">Analytics</span></div><div class="panel-desc">Revenue, top products, and customer overview.</div></div>
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;">
        <div class="stat-card"><div class="stat-num-big"><span>312</span></div><div class="stat-label-text">Total Orders</div><div class="stat-trend">+18% vs last year</div></div>
        <div class="stat-card"><div class="stat-num-big">Rs<span>84L</span></div><div class="stat-label-text">Revenue (YTD)</div><div class="stat-trend">+23%</div></div>
        <div class="stat-card"><div class="stat-num-big"><span>89</span></div><div class="stat-label-text">Active Customers</div><div class="stat-trend">+34 this month</div></div>
        <div class="stat-card"><div class="stat-num-big">Rs<span>26k</span></div><div class="stat-label-text">Avg Order Value</div><div class="stat-trend">+8%</div></div>
      </div>
      <div class="g-card"><div class="card-title">Monthly Revenue</div><canvas id="revenueChart" height="80"></canvas></div>
      <div class="g-card"><div class="card-title">Top Categories</div><div id="topProdsChart"></div></div>
    </div>

    <!-- ORDER MANAGEMENT -->
    <div class="panel" id="panel-orders">
      <div class="panel-header"><div class="panel-tag">Operations</div><div class="panel-title">Order <span class="accent">Management</span></div><div class="panel-desc">View and manage all customer orders.</div></div>
      <div class="g-card">
        <div class="card-title">All Orders</div>
        <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;" id="ordersTable">
          <thead><tr style="border-bottom:1px solid rgba(255,87,34,0.15);">
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">ORDER ID</th>
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">PRODUCT</th>
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">CUSTOMER</th>
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">AMOUNT</th>
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">STATUS</th>
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">DATE</th>
          </tr></thead>
          <tbody id="ordersTableBody"></tbody>
        </table></div>
      </div>
    </div>

    <!-- CUSTOMER MANAGEMENT -->
    <div class="panel" id="panel-customers">
      <div class="panel-header"><div class="panel-tag">CRM</div><div class="panel-title">Customer <span class="accent">Management</span></div><div class="panel-desc">View and manage your customer database.</div></div>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px;">
        <div class="stat-card"><div class="stat-num-big"><span>89</span></div><div class="stat-label-text">Total Customers</div></div>
        <div class="stat-card"><div class="stat-num-big"><span>34</span></div><div class="stat-label-text">New This Month</div></div>
        <div class="stat-card"><div class="stat-num-big"><span>12</span></div><div class="stat-label-text">Repeat Buyers</div></div>
      </div>
      <div class="g-card">
        <div class="card-title">Customer Database</div>
        <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
          <thead><tr style="border-bottom:1px solid rgba(255,87,34,0.12);">
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">#</th>
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">NAME</th>
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">CITY</th>
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">EMAIL</th>
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">ORDERS</th>
            <th style="padding:10px;font-family:'Orbitron',sans-serif;font-size:0.48rem;color:var(--text-dim);text-align:left;">TOTAL SPENT</th>
          </tr></thead>
          <tbody id="customersTableBody"></tbody>
        </table></div>
      </div>
    </div>

    <!-- INVENTORY MANAGEMENT -->
    <div class="panel" id="panel-inventory">
      <div class="panel-header"><div class="panel-tag">Stock</div><div class="panel-title">Inventory <span class="accent">Management</span></div><div class="panel-desc">Monitor stock levels for all categories.</div></div>
      <div class="g-card"><div class="card-title">Stock Levels</div><div id="inventoryTableBody"></div></div>
    </div>

    <!-- COUPON MANAGEMENT -->
    <div class="panel" id="panel-coupons">
      <div class="panel-header"><div class="panel-tag">Promotions</div><div class="panel-title">Coupon <span class="accent">Management</span></div><div class="panel-desc">Create and manage discount codes.</div></div>
      <div class="g-card" style="margin-bottom:20px;">
        <div class="card-title">Create New Coupon</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:end;">
          <div class="field-group" style="margin:0;"><label class="field-label">CODE</label><input class="field-input" id="newCouponCode" placeholder="e.g. SUMMER25" /></div>
          <div class="field-group" style="margin:0;"><label class="field-label">DISCOUNT %</label><input class="field-input" type="number" id="newCouponPct" placeholder="10" /></div>
          <div class="field-group" style="margin:0;"><label class="field-label">EXPIRY DATE</label><input class="field-input" type="date" id="newCouponExpiry" /></div>
          <button class="btn btn-primary" onclick="createCoupon()">+ CREATE</button>
        </div>
      </div>
      <div class="g-card"><div class="card-title">Active Coupons</div><div id="couponsList"></div></div>
    </div>

  </div><!-- /main-content -->
"@
$content = $content.Replace("  </div><!-- /main-content -->", $newPanels)
Set-Content 'admin.html' $content -Encoding UTF8
Write-Host "Done"
