// Shared mock data and utilities for L&D Ops Assistant POC

const MOCK = {
  workshops: [
    {
      id: 'wb-001',
      name: 'Strengths-based Development Program',
      short: 'Strengths-based Dev',
      abbr: 'SB',
      color: 'purple',
      status: 'pre-workshop',
      sessions: 4,
      total: 104,
      rsvp: { accept: 78, decline: 8, tentative: 6, none: 12 },
      dates: '24/03 – 31/03/2026',
      pendingEmails: 7,
      progress: 65,
      trainer: 'Toro / External Facilitator',
      room: 'Đà Nẵng – Hà Nội Room',
    },
    {
      id: 'wb-002',
      name: 'Leadership Mindset for Mid-level',
      short: 'Leadership Mindset',
      abbr: 'LM',
      color: 'blue',
      status: 'pre-workshop',
      sessions: 2,
      total: 48,
      rsvp: { accept: 31, decline: 0, tentative: 5, none: 12 },
      dates: '18/06/2026',
      pendingEmails: 0,
      progress: 30,
      trainer: 'Internal L&D',
      room: 'Sài Gòn – Đà Nẵng Room',
    },
    {
      id: 'wb-003',
      name: 'Onboarding Orientation Q3',
      short: 'Onboarding Q3',
      abbr: 'OB',
      color: 'green',
      status: 'planning',
      sessions: 1,
      total: 22,
      rsvp: { accept: 0, decline: 0, tentative: 0, none: 22 },
      dates: '05/07/2026',
      pendingEmails: 0,
      progress: 5,
      trainer: 'HRBP',
      room: 'TBD',
    },
  ],

  emails: [
    { id: 'em-001', type: 'invite', label: 'Email mời tham dự — Session 1', session: 1, date: '25/03/2026', count: 29, status: 'pending', time: '08:42', preview: 'Starter thân mến, Toro trân trọng mời Minh đến tham gia Strengths-based Development Workshop...' },
    { id: 'em-002', type: 'invite', label: 'Email mời tham dự — Session 2', session: 2, date: '26/03/2026', count: 27, status: 'pending', time: '08:43', preview: 'Starter thân mến, Toro trân trọng mời Lan đến tham gia Strengths-based Development Workshop...' },
    { id: 'em-003', type: 'invite', label: 'Email mời tham dự — Session 3', session: 3, date: '27/03/2026', count: 22, status: 'pending', time: '08:44', preview: 'Starter thân mến, Toro trân trọng mời Hùng đến tham gia Strengths-based Development Workshop...' },
    { id: 'em-004', type: 'invite', label: 'Email mời tham dự — Session 4', session: 4, date: '31/03/2026', count: 26, status: 'pending', time: '08:45', preview: 'Starter thân mến, Toro trân trọng mời Tuấn đến tham gia Strengths-based Development Workshop...' },
    { id: 'em-005', type: 'setup', label: 'Setup phòng — AF & IT', session: null, date: 'Tất cả sessions', count: 1, status: 'pending', time: '08:46', preview: 'Dear AF và IT team, Team Zalopay có tổ chức workshop theo lịch dưới đây, nhờ AF & IT team hỗ trợ set up phòng...' },
    { id: 'em-006', type: 'remind', label: 'Remind 12h — Session 1', session: 1, date: 'Gửi 24/03 chiều', count: 29, status: 'pending', time: '08:47', preview: 'Starter ơi, Buổi sáng ngày mai (25/3/2026) lúc 9h30-12h chúng ta có hẹn tại Strengths Workshop...' },
    { id: 'em-007', type: 'remind', label: 'Remind 12h — Session 2', session: 2, date: 'Gửi 25/03 chiều', count: 27, status: 'pending', time: '08:48', preview: 'Starter ơi, Buổi sáng ngày mai (26/3/2026) lúc 9h30-12h chúng ta có hẹn tại Strengths Workshop...' },
  ],

  attendees: [
    { name: 'Nguyễn Văn Minh', email: 'minhNV@zalopay.vn', bu: 'Engineering', session: 1, rsvp: 'accept' },
    { name: 'Trần Thị Lan', email: 'lanTT@zalopay.vn', bu: 'Product', session: 1, rsvp: 'accept' },
    { name: 'Lê Hùng', email: 'hungL@zalopay.vn', bu: 'Design', session: 2, rsvp: 'decline' },
    { name: 'Phạm Tuấn Anh', email: 'anhPT@zalopay.vn', bu: 'Data', session: 2, rsvp: 'none' },
    { name: 'Đỗ Thị Hoa', email: 'hoaDT@zalopay.vn', bu: 'Engineering', session: 3, rsvp: 'accept' },
    { name: 'Vũ Minh Khoa', email: 'khoaVM@zalopay.vn', bu: 'Marketing', session: 3, rsvp: 'tentative' },
    { name: 'Ngô Thị Thu', email: 'thuNT@zalopay.vn', bu: 'BD', session: 4, rsvp: 'none' },
    { name: 'Bùi Quang Huy', email: 'huyBQ@zalopay.vn', bu: 'Finance', session: 4, rsvp: 'accept' },
  ],

  feedbackStats: {
    totalAttendees: 104,
    responses: 56,
    avgScore: 4.6,
    nps: 72,
    satisfaction: 92,
    distribution: [34, 18, 3, 1, 0],
    criteria: [4.7, 4.5, 4.8, 4.4, 4.1, 4.9],
    strengths: [
      { text: 'Facilitator kết nối tốt strengths report vào công việc thực tế', count: 28 },
      { text: 'Hoạt động nhóm thú vị, tạo không gian chia sẻ tốt', count: 22 },
      { text: 'Nội dung thực tiễn, có thể áp dụng ngay', count: 19 },
      { text: 'Không khí workshop thoải mái, cởi mở', count: 15 },
    ],
    improvements: [
      { text: 'Thời lượng ngắn, cần thêm 30–45 phút thực hành nhóm', count: 18 },
      { text: 'Muốn có thêm case study thực tế từ Zalopay', count: 12 },
      { text: 'Handout chưa đủ bài tập để làm tiếp sau workshop', count: 8 },
    ],
  },
};

// State (persisted in sessionStorage)
const STATE_KEY = 'ld_ops_poc_state';
function getState() {
  try { return JSON.parse(sessionStorage.getItem(STATE_KEY)) || {}; } catch { return {}; }
}
function setState(updates) {
  const s = { ...getState(), ...updates };
  sessionStorage.setItem(STATE_KEY, JSON.stringify(s));
  return s;
}
function getApprovedEmails() { return getState().approvedEmails || []; }
function approveEmail(id) {
  const approved = [...getApprovedEmails(), id];
  setState({ approvedEmails: approved });
  return approved;
}
function isApproved(id) { return getApprovedEmails().includes(id); }

// Nav HTML - shared across pages
function renderNav(activePage) {
  const pages = [
    { id: 'index', label: 'Dashboard', icon: '⬛', href: 'index.html' },
    { id: 'emails', label: 'Duyệt Email', href: 'emails.html', badge: 7 },
    { id: 'workshop', label: 'Workshop Detail', href: 'workshop.html' },
    { id: 'rsvp', label: 'RSVP Tracker', href: 'rsvp.html' },
    { id: 'feedback', label: 'Feedback Report', href: 'feedback.html' },
    { id: 'certificates', label: 'Certificates', href: 'certificates.html' },
  ];
  return pages;
}

// Toast notification
function showToast(message, type = 'success') {
  const colors = { success: 'bg-green-600', error: 'bg-red-500', info: 'bg-blue-600', zalo: 'bg-blue-500' };
  const toast = document.createElement('div');
  toast.className = `fixed bottom-6 right-6 z-50 ${colors[type]} text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium transform translate-y-2 opacity-0 transition-all duration-300`;
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function showZaloNotif(message) {
  const notif = document.createElement('div');
  notif.className = 'fixed top-6 right-6 z-50 bg-white border border-blue-200 rounded-xl shadow-xl p-4 flex items-start gap-3 max-w-xs transform translate-y-2 opacity-0 transition-all duration-300';
  notif.innerHTML = `
    <div class="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">Z</div>
    <div>
      <div class="text-xs font-bold text-gray-800 mb-0.5">Zalo · Toro Bot</div>
      <div class="text-xs text-gray-600">${message}</div>
    </div>
  `;
  document.body.appendChild(notif);
  requestAnimationFrame(() => {
    notif.style.opacity = '1';
    notif.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    notif.style.opacity = '0';
    setTimeout(() => notif.remove(), 300);
  }, 5000);
}
