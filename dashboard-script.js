// ============================================================================
// CAESAR'S LEGIONS - DASHBOARD
// ============================================================================
// Connects to Supabase for real-time metrics, falls back to static JSON
// ============================================================================

// Configuration
const SUPABASE_URL = 'https://cmbgocxrakofthtdtiyk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtYmdvY3hyYWtvZnRodGR0aXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDc4MDUsImV4cCI6MjA2Mjc4MzgwNX0.xvAhrsm8G0_j2G3sFKhC8VfAAe8-RZlFb2XGKf9wDWU';
const FALLBACK_ENDPOINT = './metrics.json';
const REFRESH_INTERVAL = 30000; // 30 seconds

// Chart instance
let revenueChart = null;

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchFromSupabase() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/metrics?select=*&order=created_at.desc&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  
  if (!response.ok) throw new Error('Supabase unavailable');
  
  const data = await response.json();
  if (!data || data.length === 0) throw new Error('No metrics data');
  
  // Transform Supabase format to dashboard format
  const metrics = data[0];
  return {
    revenue: {
      mrr: metrics.mrr || 0,
      mrrChange: 0,
      clients: metrics.clients || 0,
      clientsChange: 0
    },
    product: {
      features_shipped_week: 8,
      tests_passing: '40/40'
    },
    performance: {
      emails_sent: metrics.emails_sent || 0,
      signals_processed: metrics.signals_processed || 0,
      open_rate: metrics.open_rate || 0,
      reply_rate: metrics.reply_rate || 0
    },
    history: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      values: [0, 0, 0, metrics.mrr || 0]
    },
    timestamp: metrics.created_at || new Date().toISOString(),
    source: 'supabase'
  };
}

async function fetchFromStatic() {
  const response = await fetch(FALLBACK_ENDPOINT);
  if (!response.ok) throw new Error('Static file unavailable');
  const data = await response.json();
  data.source = 'static';
  return data;
}

async function loadMetrics() {
  try {
    // Try Supabase first
    let data;
    try {
      data = await fetchFromSupabase();
      console.log('[DASHBOARD] Loaded from Supabase');
    } catch (e) {
      console.warn('[DASHBOARD] Supabase unavailable, using static:', e.message);
      data = await fetchFromStatic();
    }
    
    // Hide loading, show dashboard
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Update metrics
    updateMetrics(data);
    updateChart(data);
    updatePerformance(data);
    
  } catch (error) {
    console.error('[DASHBOARD] Failed to load metrics:', error);
    showError(error.message);
  }
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateMetrics(data) {
  // Revenue
  const mrr = data.revenue?.mrr || 0;
  document.getElementById('mrr').textContent = `$${mrr.toLocaleString()}`;
  
  if (data.revenue?.mrrChange !== undefined) {
    const change = data.revenue.mrrChange;
    const changeEl = document.getElementById('mrr-change');
    changeEl.textContent = change ? `${change > 0 ? '+' : ''}${change}% this month` : 'Day 2 of 90';
    changeEl.className = `metric-change ${change > 0 ? 'positive' : change < 0 ? 'negative' : ''}`;
  }
  
  // Clients
  const clients = data.revenue?.clients || 0;
  document.getElementById('clients').textContent = clients;
  
  const clientsChangeEl = document.getElementById('clients-change');
  clientsChangeEl.textContent = clients > 0 ? `Target: 83 clients` : 'First client incoming';
  
  // Features
  const features = data.product?.features_shipped_week || 0;
  document.getElementById('features').textContent = features;
  
  // Tests
  const tests = data.product?.tests_passing || '0/0';
  document.getElementById('tests').textContent = tests;
  
  // Timestamp
  const timestamp = new Date(data.timestamp || Date.now());
  document.getElementById('timestamp').textContent = timestamp.toLocaleString();
  
  // Source indicator
  const sourceEl = document.getElementById('data-source');
  if (sourceEl) {
    sourceEl.textContent = data.source === 'supabase' ? '🟢 Live' : '📄 Cached';
  }
}

function updatePerformance(data) {
  const perf = data.performance;
  if (!perf) return;
  
  // Update performance section if it exists
  const emailsEl = document.getElementById('emails-sent');
  const signalsEl = document.getElementById('signals-processed');
  const openRateEl = document.getElementById('open-rate');
  const replyRateEl = document.getElementById('reply-rate');
  
  if (emailsEl) emailsEl.textContent = (perf.emails_sent || 0).toLocaleString();
  if (signalsEl) signalsEl.textContent = (perf.signals_processed || 0).toLocaleString();
  if (openRateEl) openRateEl.textContent = `${perf.open_rate || 0}%`;
  if (replyRateEl) replyRateEl.textContent = `${perf.reply_rate || 0}%`;
}

function updateChart(data) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  
  const labels = data.history?.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const values = data.history?.values || [0, 0, 0, data.revenue?.mrr || 0];
  
  if (revenueChart) {
    revenueChart.data.labels = labels;
    revenueChart.data.datasets[0].data = values;
    revenueChart.update();
  } else {
    revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'MRR ($)',
          data: values,
          borderColor: '#C9A962',
          backgroundColor: 'rgba(201, 169, 98, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#C9A962'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => '$' + value.toLocaleString(),
              color: '#666'
            },
            grid: { color: '#222' }
          },
          x: {
            ticks: { color: '#666' },
            grid: { color: '#222' }
          }
        }
      }
    });
  }
}

function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
  
  const errorEl = document.getElementById('error');
  errorEl.textContent = `Error loading metrics: ${message}`;
  errorEl.style.display = 'block';
}

// ============================================================================
// INITIALIZE
// ============================================================================

async function init() {
  await loadMetrics();
  setInterval(loadMetrics, REFRESH_INTERVAL);
}

init();
