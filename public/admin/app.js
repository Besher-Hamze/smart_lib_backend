const TOKEN_KEY = 'smart_lib_admin_token';
const API = 'http://localhost:3000/api';
const $ = (id) => document.getElementById(id);

let authors = [];
let categories = [];
let books = [];
let bookSearchQuery = '';
let editingAuthorId = null;
let editingBookId = null;
let chapterBookId = null;
let chaptersCache = {};
let selectedBookCategoryIds = new Set();
let categoryPickerQuery = '';

function token() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }

function showLoading(show = true) {
  $('loadingOverlay').classList.toggle('hidden', !show);
}

function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span><span>${message}</span>`;
  $('toastContainer').appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message || data?.error || text || res.statusText;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return data;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function openModal(id) {
  $(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  $(id).classList.add('hidden');
  if (!document.querySelector('.modal-backdrop:not(.hidden)')) {
    document.body.style.overflow = '';
  }
}

function showLogin() {
  $('loginView').classList.remove('hidden');
  $('appView').classList.add('hidden');
}

function showApp() {
  $('loginView').classList.add('hidden');
  $('appView').classList.remove('hidden');
}

async function login() {
  const err = $('loginError');
  const btn = $('loginBtn');
  err.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'جاري الدخول…';
  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: $('loginEmail').value.trim(),
        password: $('loginPassword').value,
      }),
    });
    setToken(res.accessToken);
    showApp();
    await refreshAll();
    toast('مرحباً بك في لوحة الإدارة');
  } catch (e) {
    err.textContent = e.message;
    err.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'تسجيل الدخول';
  }
}

function logout() {
  setToken(null);
  showLogin();
  toast('تم تسجيل الخروج', 'error');
}

function switchTab(name) {
  document.querySelectorAll('.nav-item').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  ['authors', 'categories', 'books'].forEach((p) => {
    $(`${p}Panel`).classList.toggle('hidden', p !== name);
  });
}

function updateStats() {
  $('statAuthors').textContent = authors.length;
  $('statCategories').textContent = categories.length;
  $('statBooks').textContent = books.length;
  $('badgeAuthors').textContent = authors.length;
  $('badgeCategories').textContent = categories.length;
  $('badgeBooks').textContent = books.length;
}

async function refreshAll() {
  showLoading(true);
  try {
    [authors, categories, books] = await Promise.all([
      api('/admin/authors'),
      api('/admin/categories'),
      api('/admin/books'),
    ]);
    updateStats();
    renderAuthors();
    renderCategories();
    renderBooks();
    fillBookSelects();
  } finally {
    showLoading(false);
  }
}

function emptyRow(cols, icon, text, actionHtml = '') {
  return `<tr><td colspan="${cols}">
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <p>${text}</p>
      ${actionHtml}
    </div>
  </td></tr>`;
}

function bindTableActions() {
  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.onclick = () => {
      const { action, id, title, content } = btn.dataset;
      switch (action) {
        case 'edit-author': openAuthorModal(id); break;
        case 'delete-author': deleteAuthor(id); break;
        case 'delete-category': deleteCategory(id); break;
        case 'edit-book': openBookModal(id); break;
        case 'chapters': openChapters(id); break;
        case 'publish': togglePublish(id, true); break;
        case 'unpublish': togglePublish(id, false); break;
        case 'delete-book': deleteBook(id); break;
        case 'edit-chapter':
          openEditChapter(id);
          break;
        case 'remove-chapter': removeChapter(id); break;
      }
    };
  });
}

function decodeAttr(s) {
  if (!s) return '';
  return s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
}

function renderAuthors() {
  const tbody = $('authorsTableBody');
  tbody.innerHTML = authors.length
    ? authors.map((a) => `
    <tr>
      <td><span class="cell-title">${esc(a.name)}</span></td>
      <td>${esc((a.bio || '—').slice(0, 80))}${(a.bio || '').length > 80 ? '…' : ''}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" data-action="edit-author" data-id="${escAttr(a.id)}">تعديل</button>
        <button class="btn btn-danger btn-sm" data-action="delete-author" data-id="${escAttr(a.id)}">حذف</button>
      </td>
    </tr>`).join('')
    : emptyRow(3, '✍️', 'لا يوجد مؤلفون بعد', '<button class="btn btn-accent btn-sm" id="emptyAddAuthor">+ أضف مؤلفاً</button>');
  bindTableActions();
  $('emptyAddAuthor')?.addEventListener('click', () => openAuthorModal());
}

function renderCategories() {
  const tbody = $('categoriesTableBody');
  tbody.innerHTML = categories.length
    ? categories.map((c) => `
    <tr>
      <td><span class="cell-title">${esc(c.name)}</span></td>
      <td><span class="slug-tag">${esc(c.slug)}</span></td>
      <td>${esc(c.description || '—')}</td>
      <td>
        <button class="btn btn-danger btn-sm" data-action="delete-category" data-id="${escAttr(c.id)}">حذف</button>
      </td>
    </tr>`).join('')
    : emptyRow(4, '🏷️', 'لا أصناف — أضف من الشريط أعلاه');
  bindTableActions();
}

function filteredBooks() {
  const q = bookSearchQuery.trim().toLowerCase();
  if (!q) return books;
  return books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      (b.authorName || '').toLowerCase().includes(q) ||
      (b.slug || '').toLowerCase().includes(q),
  );
}

function renderBooks() {
  const list = filteredBooks();
  const tbody = $('booksTableBody');
  tbody.innerHTML = list.length
    ? list.map((b) => {
      const statusBadge =
        b.publishStatus === 'published'
          ? '<span class="badge badge-published">● منشور</span>'
          : '<span class="badge badge-draft">○ مسودة</span>';
      return `
    <tr>
      <td>
        <span class="cell-title">${esc(b.title)}</span>
        <span class="cell-sub">${esc(b.slug)}</span>
      </td>
      <td>${esc(b.authorName || '—')}</td>
      <td>${statusBadge}</td>
      <td><span class="badge badge-chapters">${b.chaptersCount ?? 0} فصل</span></td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" data-action="chapters" data-id="${escAttr(b.id)}">📄 فصول</button>
        <button class="btn btn-secondary btn-sm" data-action="edit-book" data-id="${escAttr(b.id)}">تعديل</button>
        ${b.publishStatus === 'published'
          ? `<button class="btn btn-ghost btn-sm" data-action="unpublish" data-id="${escAttr(b.id)}">إلغاء نشر</button>`
          : `<button class="btn btn-accent btn-sm" data-action="publish" data-id="${escAttr(b.id)}">نشر</button>`}
        <button class="btn btn-danger btn-sm" data-action="delete-book" data-id="${escAttr(b.id)}">حذف</button>
      </td>
    </tr>`;
    }).join('')
    : emptyRow(
        5,
        '📖',
        bookSearchQuery ? 'لا نتائج للبحث' : 'لا كتب — أضف كتاباً أو استورد seed',
        bookSearchQuery ? '' : '<button class="btn btn-accent btn-sm" id="emptyAddBook">+ كتاب جديد</button>',
      );
  bindTableActions();
  $('emptyAddBook')?.addEventListener('click', () => openBookModal());
}

function fillBookSelects() {
  $('bookAuthorId').innerHTML = authors.length
    ? authors.map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('')
    : '<option value="">— أضف مؤلفاً أولاً —</option>';
}

function setPublishStatus(status) {
  $('bookPublishStatus').value = status;
  document.querySelectorAll('.status-option').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
}

function initCategoryPicker(selectedIds = []) {
  selectedBookCategoryIds = new Set(selectedIds);
  categoryPickerQuery = '';
  const search = $('categoryPickerSearch');
  if (search) search.value = '';
  $('bookCategoryPicker')?.classList.remove('has-error');
  renderCategoryPicker();
}

function getFilteredCategories() {
  const q = categoryPickerQuery.trim().toLowerCase();
  if (!q) return categories;
  return categories.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.slug || '').toLowerCase().includes(q),
  );
}

function renderCategoryPicker() {
  const count = selectedBookCategoryIds.size;
  $('categorySelectedCount').textContent = `${count} محدد`;
  $('categoryPickerPlaceholder')?.classList.toggle('hidden', count > 0);

  const chipsEl = $('selectedCategoryChips');
  if (chipsEl) {
    chipsEl.innerHTML = [...selectedBookCategoryIds]
      .map((id) => {
        const cat = categories.find((c) => c.id === id);
        if (!cat) return '';
        return `
          <span class="selected-chip">
            ${esc(cat.name)}
            <button type="button" class="selected-chip-remove" data-remove-cat="${escAttr(id)}" aria-label="إزالة">×</button>
          </span>`;
      })
      .join('');
    chipsEl.querySelectorAll('[data-remove-cat]').forEach((btn) => {
      btn.onclick = () => toggleBookCategory(btn.dataset.removeCat);
    });
  }

  const grid = $('categoryPickerGrid');
  if (!grid) return;

  if (!categories.length) {
    grid.innerHTML = `
      <button type="button" class="category-option empty-filter" disabled>
        لا أصناف — أضف من تبويب الأصناف
      </button>`;
    return;
  }

  const filtered = getFilteredCategories();
  if (!filtered.length) {
    grid.innerHTML = `
      <button type="button" class="category-option empty-filter" disabled>
        لا نتائج للبحث
      </button>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (c) => `
    <button type="button"
      class="category-option${selectedBookCategoryIds.has(c.id) ? ' selected' : ''}"
      data-cat-id="${escAttr(c.id)}"
      title="${esc(c.slug)}">
      ${esc(c.name)}
    </button>`,
    )
    .join('');

  grid.querySelectorAll('[data-cat-id]').forEach((btn) => {
    btn.onclick = () => toggleBookCategory(btn.dataset.catId);
  });
}

function toggleBookCategory(id) {
  if (selectedBookCategoryIds.has(id)) selectedBookCategoryIds.delete(id);
  else selectedBookCategoryIds.add(id);
  $('bookCategoryPicker')?.classList.remove('has-error');
  renderCategoryPicker();
}

function selectAllVisibleCategories() {
  getFilteredCategories().forEach((c) => selectedBookCategoryIds.add(c.id));
  renderCategoryPicker();
}

function clearAllCategories() {
  selectedBookCategoryIds.clear();
  renderCategoryPicker();
}

function selectedCategoryIds() {
  return [...selectedBookCategoryIds];
}

function openAuthorModal(id = null) {
  editingAuthorId = id;
  const a = id ? authors.find((x) => x.id === id) : null;
  $('authorModalTitle').textContent = a ? 'تعديل مؤلف' : 'مؤلف جديد';
  $('authorName').value = a?.name || '';
  $('authorBio').value = a?.bio || '';
  $('authorAvatar').value = a?.avatarUrl || '';
  openModal('authorModal');
  $('authorName').focus();
}

function closeAuthorModal() {
  closeModal('authorModal');
  editingAuthorId = null;
}

async function saveAuthor() {
  const name = $('authorName').value.trim();
  if (!name) return toast('أدخل اسم المؤلف', 'error');
  const body = {
    name,
    bio: $('authorBio').value.trim(),
    avatarUrl: $('authorAvatar').value.trim(),
  };
  showLoading(true);
  try {
    if (editingAuthorId) {
      await api(`/admin/authors/${editingAuthorId}`, { method: 'PATCH', body: JSON.stringify(body) });
      toast('تم تحديث المؤلف');
    } else {
      await api('/admin/authors', { method: 'POST', body: JSON.stringify(body) });
      toast('تم إضافة المؤلف');
    }
    closeAuthorModal();
    await refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function deleteAuthor(id) {
  if (!confirm('حذف هذا المؤلف؟')) return;
  showLoading(true);
  try {
    await api(`/admin/authors/${id}`, { method: 'DELETE' });
    toast('تم حذف المؤلف');
    await refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function addCategory() {
  const name = $('newCategoryName').value.trim();
  if (!name) return toast('أدخل اسم الصنف', 'error');
  showLoading(true);
  try {
    await api('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description: $('newCategoryDesc').value.trim() }),
    });
    $('newCategoryName').value = '';
    $('newCategoryDesc').value = '';
    toast(`تم إضافة «${name}»`);
    await refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function deleteCategory(id) {
  if (!confirm('حذف هذا الصنف؟')) return;
  showLoading(true);
  try {
    await api(`/admin/categories/${id}`, { method: 'DELETE' });
    toast('تم حذف الصنف');
    await refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

function openBookModal(id = null) {
  if (!authors.length) return toast('أضف مؤلفاً أولاً', 'error');
  if (!categories.length) return toast('أضف صنفاً واحداً على الأقل من تبويب الأصناف', 'error');
  editingBookId = id;
  const b = id ? books.find((x) => x.id === id) : null;
  $('bookModalTitle').textContent = b ? 'تعديل كتاب' : 'كتاب جديد';
  $('bookTitle').value = b?.title || '';
  $('bookDescription').value = b?.description || '';
  $('bookAuthorId').value = b?.authorId || authors[0]?.id || '';
  $('bookLanguage').value = b?.language || 'ar';
  $('bookCoverUrl').value = b?.coverUrl || '';
  setPublishStatus(b?.publishStatus || 'draft');
  initCategoryPicker(b?.categoryIds || []);
  openModal('bookModal');
  $('bookTitle').focus();
}

function closeBookModal() {
  closeModal('bookModal');
  editingBookId = null;
  selectedBookCategoryIds.clear();
}

async function saveBook() {
  const body = {
    title: $('bookTitle').value.trim(),
    description: $('bookDescription').value.trim(),
    authorId: $('bookAuthorId').value,
    categoryIds: selectedCategoryIds(),
    language: $('bookLanguage').value.trim() || 'ar',
    coverUrl: $('bookCoverUrl').value.trim(),
    publishStatus: $('bookPublishStatus').value,
  };
  if (!body.title) return toast('أدخل عنوان الكتاب', 'error');
  if (!body.categoryIds.length) {
    $('bookCategoryPicker')?.classList.add('has-error');
    toast('اختر صنفاً واحداً على الأقل', 'error');
    $('bookCategoryPicker')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  showLoading(true);
  try {
    if (editingBookId) {
      await api(`/admin/books/${editingBookId}`, { method: 'PATCH', body: JSON.stringify(body) });
      toast('تم تحديث الكتاب');
    } else {
      await api('/admin/books', { method: 'POST', body: JSON.stringify(body) });
      toast('تم إنشاء الكتاب');
    }
    closeBookModal();
    await refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function deleteBook(id) {
  if (!confirm('حذف هذا الكتاب؟')) return;
  showLoading(true);
  try {
    await api(`/admin/books/${id}`, { method: 'DELETE' });
    toast('تم حذف الكتاب');
    await refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function togglePublish(id, publish) {
  showLoading(true);
  try {
    await api(`/admin/books/${id}/${publish ? 'publish' : 'unpublish'}`, { method: 'POST' });
    toast(publish ? 'تم نشر الكتاب' : 'تم إلغاء النشر');
    await refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function runSeed() {
  if (!confirm('استيراد seed إلى MongoDB؟')) return;
  showLoading(true);
  try {
    const res = await api('/admin/seed', { method: 'POST' });
    toast(`تم: ${res.total} كتاب · ${res.chaptersUpserted} فصل جديد`);
    await refreshAll();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function openChapters(bookId) {
  chapterBookId = bookId;
  const book = books.find((b) => b.id === bookId);
  $('chaptersModalTitle').textContent = book ? `فصول: ${book.title}` : 'الفصول';
  $('newChapterTitle').value = '';
  $('newChapterContent').value = '';
  openModal('chaptersModal');
  await renderChaptersList();
}

function closeChaptersModal() {
  closeModal('chaptersModal');
  chapterBookId = null;
}

async function renderChaptersList() {
  const list = $('chaptersList');
  list.innerHTML = '<div class="empty-state"><div class="spinner"></div></div>';
  try {
    const chapters = await api(`/admin/books/${chapterBookId}/chapters`);
    const active = chapters.filter((c) => !c.isDeleted);
    if (!active.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📄</div><p>لا فصول بعد — أضف الأول أدناه</p></div>';
      return;
    }
    chaptersCache = {};
    active.forEach((c) => { chaptersCache[c.id] = c; });
    list.innerHTML = active.map((c) => `
      <div class="chapter-item">
        <div class="chapter-header">
          <div>
            <span class="chapter-num">فصل ${c.chapterNumber}</span>
            <div class="chapter-title">${esc(c.title)}</div>
          </div>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" data-action="edit-chapter"
              data-id="${escAttr(c.id)}">تعديل</button>
            <button class="btn btn-danger btn-sm" data-action="remove-chapter" data-id="${escAttr(c.id)}">حذف</button>
          </div>
        </div>
        <p class="chapter-preview">${esc(c.contentText.slice(0, 220))}${c.contentText.length > 220 ? '…' : ''}</p>
      </div>`).join('');
    bindTableActions();
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><p>${esc(e.message)}</p></div>`;
  }
}

function openEditChapter(id) {
  const c = chaptersCache[id];
  if (!c) return toast('تعذّر تحميل الفصل', 'error');
  $('editChapterId').value = id;
  $('editChapterTitle').value = c.title || '';
  $('editChapterContent').value = c.contentText || '';
  openModal('editChapterModal');
  $('editChapterTitle').focus();
}

function closeEditChapterModal() {
  closeModal('editChapterModal');
}

async function saveChapterEdit() {
  const id = $('editChapterId').value;
  const title = $('editChapterTitle').value.trim();
  const contentText = $('editChapterContent').value.trim();
  if (!title) return toast('أدخل عنوان الفصل', 'error');
  showLoading(true);
  try {
    await api(`/admin/chapters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, contentText }),
    });
    toast('تم تحديث الفصل');
    closeEditChapterModal();
    await refreshAll();
    await renderChaptersList();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function addChapter() {
  const title = $('newChapterTitle').value.trim();
  const contentText = $('newChapterContent').value.trim();
  if (!title) return toast('أدخل عنوان الفصل', 'error');
  showLoading(true);
  try {
    await api(`/admin/books/${chapterBookId}/chapters`, {
      method: 'POST',
      body: JSON.stringify({ title, contentText }),
    });
    $('newChapterTitle').value = '';
    $('newChapterContent').value = '';
    toast('تم إضافة الفصل');
    await refreshAll();
    await renderChaptersList();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function removeChapter(id) {
  if (!confirm('حذف هذا الفصل؟')) return;
  showLoading(true);
  try {
    await api(`/admin/chapters/${id}`, { method: 'DELETE' });
    toast('تم حذف الفصل');
    await refreshAll();
    await renderChaptersList();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    showLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  $('loginForm').addEventListener('submit', (e) => { e.preventDefault(); login(); });
  $('logoutBtn').addEventListener('click', logout);
  $('newAuthorBtn').addEventListener('click', () => openAuthorModal());
  $('saveAuthorBtn').addEventListener('click', saveAuthor);
  $('addCategoryBtn').addEventListener('click', addCategory);
  $('newBookBtn').addEventListener('click', () => openBookModal());
  $('saveBookBtn').addEventListener('click', saveBook);
  $('seedBtn').addEventListener('click', runSeed);
  $('addChapterBtn').addEventListener('click', addChapter);
  $('saveChapterBtn').addEventListener('click', saveChapterEdit);

  $('categoryPickerSearch')?.addEventListener('input', (e) => {
    categoryPickerQuery = e.target.value;
    renderCategoryPicker();
  });
  $('selectAllCategoriesBtn')?.addEventListener('click', selectAllVisibleCategories);
  $('clearCategoriesBtn')?.addEventListener('click', clearAllCategories);
  document.querySelectorAll('.status-option').forEach((btn) => {
    btn.addEventListener('click', () => setPublishStatus(btn.dataset.status));
  });

  $('bookSearch')?.addEventListener('input', (e) => {
    bookSearchQuery = e.target.value;
    renderBooks();
  });

  document.querySelectorAll('.nav-item').forEach((t) => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop.id);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach((m) => closeModal(m.id));
  });

  if (token()) {
    try {
      showApp();
      await refreshAll();
    } catch {
      logout();
    }
  } else {
    showLogin();
  }
});
