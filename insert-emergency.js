const fs = require('fs');
const path = 'src/app/clients/client-detail/client-detail.component.html';

const content = fs.readFileSync(path, 'utf8');
const placeholder = '         } @else {\n      <!-- TAB PLACEHOLDER';
const idx = content.indexOf(placeholder);
console.log('Placeholder found at index:', idx);

if (idx > 0) {
  const before = content.substring(0, idx);
  const after = content.substring(idx);

  const emergencyTab = [
    "         } @else if (activeTab === 'emergency') {",
    "          <div class=\"space-y-6\">",
    "            <!-- Emergency Contacts header -->",
    "            <div class=\"flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between\">",
    "              <div>",
    "                <h2 class=\"text-xl font-bold text-slate-900\">Emergency Contacts</h2>",
    "                <p class=\"text-sm text-slate-500\">View and manage emergency contacts for this client.</p>",
    "              </div>",
    "              <div class=\"flex flex-col sm:flex-row gap-2 sm:items-center\">",
    "                <div class=\"relative\">",
    "                  <svg class=\"w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path stroke-linecap=\"round\" d=\"M21 21l-4.3-4.3\"/></svg>",
    "                  <input type=\"text\" placeholder=\"Search emergency contacts...\" class=\"w-full sm:w-56 pl-9 pr-3 py-3 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent\"/>",
    "                </div>",
    '                <button class="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">',
    '                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h18M6 8h12M10 12h4M11 16h2"/></svg>',
    "                  Filters",
    '                </button>',
    '                <button class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 text-sm font-medium shadow-sm">',
    '                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>',
    "                  Add Emergency Contact",
    '                  <svg class="w-3.5 h-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>',
    "                </button>",
    "              </div>",
    "            </div>",
    "",
    "            <!-- Stat cards -->",
    '            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">',
    '              <div class="stat-card">',
    '                <div class="stat-icon bg-blue-50 text-blue-600"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3-6.65"/></svg></div>',
    '                <div><p class="text-xs text-slate-400">Total Emergency Contacts</p><p class="text-xl font-bold text-slate-900">6</p></div>',
    "              </div>",
    '              <div class="stat-card">',
    '                <div class="stat-icon bg-emerald-50 text-emerald-600"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3l2 5-2.5 1.5a11 11 0 005 5L14 14l5 2v3a2 2 0 01-2 2h-1C9.163 21 3 14.837 3 7V5z"/></svg></div>',
    '                <div><p class="text-xs text-slate-400">Active Contacts</p><p class="text-xl font-bold text-slate-900">5</p></div>',
    "              </div>",
    '              <div class="stat-card">',
    '                <div class="stat-icon bg-rose-50 text-rose-500"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>',
    '                <div><p class="text-xs text-slate-400">Inactive Contacts</p><p class="text-xl font-bold text-slate-900">1</p></div>',
    "              </div>",
    '              <div class="stat-card">',
    '                <div class="stat-icon bg-sky-50 text-sky-600"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>',
    '                <div><p class="text-xs text-slate-400">Primary Contacts</p><p class="text-xl font-bold text-slate-900">2</p></div>',
    "              </div>",
    "            </div>",
    "",
    "            <!-- Emergency Contacts table -->",
    '            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">',
    '              <div class="overflow-x-auto">',
    '                <table class="w-full text-sm min-w-[900px]"><thead><tr class="border-b border-slate-100 text-slate-400 text-xs">',
    '                  <th class="th">Contact Name</th><th class="th">Relationship</th><th class="th">Phone</th><th class="th">Email</th><th class="th">Availability</th><th class="th">Primary</th><th class="th">Status</th><th class="th text-right">Actions</th>',
    '                </tr></thead><tbody class="divide-y divide-slate-100">',
    '                  <tr class="hover:bg-slate-50"><td class="td"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">MT</div><span class="font-medium text-slate-800 whitespace-nowrap">Michael Thompson</span></div></td><td class="td text-slate-600 whitespace-nowrap">Chief Security Officer</td><td class="td text-slate-600 whitespace-nowrap">+44 020 7946 1001</td><td class="td text-slate-600 whitespace-nowrap">michael.thompson@metrosecurity.co.uk</td><td class="td text-slate-600 whitespace-nowrap">24/7</td><td class="td"><span class="badge bg-blue-50 text-blue-600">Yes</span></td><td class="td"><span class="badge bg-emerald-50 text-emerald-600">Active</span></td><td class="td"><div class="flex items-center justify-end gap-3 text-slate-400"><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6h.01M12 12h.01M12 18h.01"/></svg></button></div></td></tr>',
    '                  <tr class="hover:bg-slate-50"><td class="td"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">RJ</div><span class="font-medium text-slate-800 whitespace-nowrap">Rebecca Johnson</span></div></td><td class="td text-slate-600 whitespace-nowrap">Operations Director</td><td class="td text-slate-600 whitespace-nowrap">+44 020 7946 1002</td><td class="td text-slate-600 whitespace-nowrap">rebecca.johnson@metrosecurity.co.uk</td><td class="td text-slate-600 whitespace-nowrap">24/7</td><td class="td"><span class="badge bg-slate-100 text-slate-500">No</span></td><td class="td"><span class="badge bg-emerald-50 text-emerald-600">Active</span></td><td class="td"><div class="flex items-center justify-end gap-3 text-slate-400"><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6h.01M12 12h.01M12 18h.01"/></svg></button></div></td></tr>',
    '                  <tr class="hover:bg-slate-50"><td class="td"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">AD</div><span class="font-medium text-slate-800 whitespace-nowrap">Andrew Davis</span></div></td><td class="td text-slate-600 whitespace-nowrap">Facilities Manager</td><td class="td text-slate-600 whitespace-nowrap">+44 020 7946 1003</td><td class="td text-slate-600 whitespace-nowrap">andrew.davis@metrosecurity.co.uk</td><td class="td text-slate-600 whitespace-nowrap">Business Hours</td><td class="td"><span class="badge bg-blue-50 text-blue-600">Yes</span></td><td class="td"><span class="badge bg-emerald-50 text-emerald-600">Active</span></td><td class="td"><div class="flex items-center justify-end gap-3 text-slate-400"><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6h.01M12 12h.01M12 18h.01"/></svg></button></div></td></tr>',
    '                  <tr class="hover:bg-slate-50"><td class="td"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-bold shrink-0">SL</div><span class="font-medium text-slate-800 whitespace-nowrap">Sophia Lewis</span></div></td><td class="td text-slate-600 whitespace-nowrap">HR Manager</td><td class="td text-slate-600 whitespace-nowrap">+44 020 7946 1004</td><td class="td text-slate-600 whitespace-nowrap">sophia.lewis@metrosecurity.co.uk</td><td class="td text-slate-600 whitespace-nowrap">Business Hours</td><td class="td"><span class="badge bg-slate-100 text-slate-500">No</span></td><td class="td"><span class="badge bg-emerald-50 text-emerald-600">Active</span></td><td class="td"><div class="flex items-center justify-end gap-3 text-slate-400"><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6h.01M12 12h.01M12 18h.01"/></svg></button></div></td></tr>',
    '                  <tr class="hover:bg-slate-50"><td class="td"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">BW</div><span class="font-medium text-slate-800 whitespace-nowrap">Brian Wilson</span></div></td><td class="td text-slate-600 whitespace-nowrap">IT Manager</td><td class="td text-slate-600 whitespace-nowrap">+44 020 7946 1005</td><td class="td text-slate-600 whitespace-nowrap">brian.wilson@metrosecurity.co.uk</td><td class="td text-slate-600 whitespace-nowrap">On Call</td><td class="td"><span class="badge bg-slate-100 text-slate-500">No</span></td><td class="td"><span class="badge bg-rose-50 text-rose-500">Inactive</span></td><td class="td"><div class="flex items-center justify-end gap-3 text-slate-400"><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6h.01M12 12h.01M12 18h.01"/></svg></button></div></td></tr>',
    '                  <tr class="hover:bg-slate-50"><td class="td"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">EM</div><span class="font-medium text-slate-800 whitespace-nowrap">Emma Mitchell</span></div></td><td class="td text-slate-600 whitespace-nowrap">Health &amp; Safety Manager</td><td class="td text-slate-600 whitespace-nowrap">+44 020 7946 1006</td><td class="td text-slate-600 whitespace-nowrap">emma.mitchell@metrosecurity.co.uk</td><td class="td text-slate-600 whitespace-nowrap">Business Hours</td><td class="td"><span class="badge bg-slate-100 text-slate-500">No</span></td><td class="td"><span class="badge bg-emerald-50 text-emerald-600">Active</span></td><td class="td"><div class="flex items-center justify-end gap-3 text-slate-400"><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button><button class="hover:text-slate-600"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6h.01M12 12h.01M12 18h.01"/></svg></button></div></td></tr>',
    '                </tbody></table>',
    '              </div>',
    '              <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 text-sm text-slate-400">',
    '                <p>Showing 1 to 6 of 6 emergency contacts</p>',
    '                <div class="flex items-center gap-1">',
    '                  <button class="page-btn"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg></button>',
    '                  <button class="page-btn bg-blue-600 text-white border-blue-600">1</button>',
    '                  <button class="page-btn"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></button>',
    '                </div>',
    '              </div>',
    '            </div>',
    "          </div>",
  ].join('\n');

  const newContent = before + emergencyTab + after;
  fs.writeFileSync(path, newContent, 'utf8');
  console.log('Successfully inserted emergency tab content');
  console.log('Original length:', content.length, 'New length:', newContent.length);

  const verify = fs.readFileSync(path, 'utf8');
  const count = (verify.match(/activeTab === 'emergency'/g) || []).length;
  console.log('Occurrences of emergency tab:', count);
} else {
  console.log('ERROR: Placeholder not found!');
}
