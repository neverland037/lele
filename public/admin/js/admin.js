// Admin Dashboard SPA Controller
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('lele_token');
  const user = JSON.parse(localStorage.getItem('lele_user') || '{}');

  if (!token) {
    window.location.href = '/admin/login.html';
    return;
  }

  // Display username
  const userDisplay = document.getElementById('user-display-name');
  if (userDisplay && user.username) {
    userDisplay.textContent = user.username;
  }

  // Common authenticated fetch helper
  async function fetchAuth(url, options = {}) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(url, options);
      if (res.status === 401) {
        localStorage.removeItem('lele_token');
        localStorage.removeItem('lele_user');
        window.location.href = '/admin/login.html';
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error('Fetch error:', err);
      showToast('Error de conexión con el servidor', 'error');
      return null;
    }
  }

  // --- TOAST NOTIFICATIONS ---
  window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="mdi ${type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // --- TAB NAVIGATION ---
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const pageTitle = document.getElementById('page-title');

  function switchTab(tabId) {
    navItems.forEach(n => n.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const activePanel = document.getElementById(`panel-${tabId}`);

    if (activeNav) activeNav.classList.add('active');
    if (activePanel) activePanel.classList.add('active');

    const titles = {
      dashboard: 'Panel General',
      projects: 'Gestión de Proyectos',
      posts: 'Gestión de Blog',
      skills: 'Gestión de Habilidades',
      profile: 'Perfil y Redes Sociales',
      messages: 'Bandeja de Mensajes',
      settings: 'Ajustes y Seguridad'
    };
    if (pageTitle) pageTitle.textContent = titles[tabId] || 'Panel de Control';

    // Load tab-specific data
    if (tabId === 'dashboard') loadDashboard();
    else if (tabId === 'projects') loadProjects();
    else if (tabId === 'posts') loadPosts();
    else if (tabId === 'skills') loadSkills();
    else if (tabId === 'profile') loadProfile();
    else if (tabId === 'messages') loadMessages();
    else if (tabId === 'settings') loadSettings();
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    localStorage.removeItem('lele_token');
    localStorage.removeItem('lele_user');
    window.location.href = '/admin/login.html';
  });

  // Mobile Sidebar Toggle
  document.querySelector('.admin-mobile-toggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('open');
  });

  // Global Modal Close Handler
  window.closeAllModals = function() {
    document.querySelectorAll('.modal-admin-overlay').forEach(m => m.classList.remove('active'));
  };

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-close-modal') || e.target.closest('.btn-close-modal') || e.target.classList.contains('modal-admin-overlay')) {
      closeAllModals();
    }
  });

  // ==========================================
  // 1. DASHBOARD
  // ==========================================
  async function loadDashboard() {
    const data = await fetchAuth('/api/admin/dashboard');
    if (!data || !data.success) return;

    const { stats, recentMessages } = data;

    document.getElementById('kpi-projects').textContent = stats.totalProjects;
    document.getElementById('kpi-posts').textContent = stats.totalPosts;
    document.getElementById('kpi-skills').textContent = stats.totalSkills;
    document.getElementById('kpi-messages').textContent = stats.totalMessages;

    // Update unread badges
    const unreadBadges = document.querySelectorAll('.unread-badge');
    unreadBadges.forEach(b => {
      b.textContent = stats.unreadMessages;
      b.style.display = stats.unreadMessages > 0 ? 'inline-block' : 'none';
    });

    // Recent Messages Table
    const msgTable = document.getElementById('recent-messages-table');
    if (msgTable) {
      if (recentMessages.length === 0) {
        msgTable.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No hay mensajes recientes</td></tr>`;
      } else {
        msgTable.innerHTML = recentMessages.map(m => `
          <tr>
            <td><strong>${m.name}</strong></td>
            <td>${m.email}</td>
            <td><span class="badge ${m.is_read ? 'badge-tag' : 'badge-unread'}">${m.is_read ? 'Leído' : 'Nuevo'}</span></td>
            <td>${new Date(m.created_at).toLocaleDateString()}</td>
          </tr>
        `).join('');
      }
    }
  }

  // ==========================================
  // 2. PROJECTS (PORTAFOLIO)
  // ==========================================
  let projectsList = [];
  let currentProjectImages = [];

  async function loadProjects() {
    const data = await fetchAuth('/api/projects');
    if (!data || !data.success) return;

    projectsList = data.projects;
    const table = document.getElementById('projects-table-body');
    if (!table) return;

    if (projectsList.length === 0) {
      table.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:30px;">No hay proyectos registrados.</td></tr>`;
      return;
    }

    table.innerHTML = projectsList.map(p => `
      <tr>
        <td><img src="/${p.cover_image || 'img/thumb-1.jpg'}" class="thumb-preview" alt="${p.title}" /></td>
        <td><strong>${p.title}</strong></td>
        <td><span class="badge badge-tag">${p.category_label || p.category_tag}</span></td>
        <td>${p.order_index}</td>
        <td>${p.images ? p.images.length : 0} fotos</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="openEditProjectModal(${p.id})" title="Editar"><i class="mdi mdi-pencil"></i></button>
            <button class="btn-icon delete" onclick="deleteProject(${p.id})" title="Eliminar"><i class="mdi mdi-delete"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  let draggedIndex = null;

  window.openCreateProjectModal = function() {
    document.getElementById('project-form').reset();
    document.getElementById('project-id').value = '';
    document.getElementById('project-modal-title').textContent = 'Nuevo Proyecto';
    document.getElementById('project-cover-preview').src = '/img/thumb-1.jpg';
    document.getElementById('project-cover-path').value = 'img/thumb-1.jpg';
    currentProjectImages = [];
    renderSlidePreviews();
    document.getElementById('modal-project-form').classList.add('active');
  };

  window.openEditProjectModal = function(id) {
    const p = projectsList.find(item => item.id === id);
    if (!p) return;

    document.getElementById('project-id').value = p.id;
    document.getElementById('project-modal-title').textContent = 'Editar Proyecto';
    document.getElementById('project-title').value = p.title;
    document.getElementById('project-category-tag').value = p.category_tag;
    document.getElementById('project-category-label').value = p.category_label || '';
    document.getElementById('project-client').value = p.client_name || '';
    document.getElementById('project-url').value = p.live_url || '';
    document.getElementById('project-description').value = p.description || '';
    document.getElementById('project-order').value = p.order_index || 0;
    
    const cover = p.cover_image || 'img/thumb-1.jpg';
    document.getElementById('project-cover-path').value = cover;
    document.getElementById('project-cover-preview').src = `/${cover}`;

    // Combine cover and all slide images so all images appear in the list
    let allImgs = [];
    if (cover && cover !== 'img/thumb-1.jpg') {
      allImgs.push(cover);
    }
    if (Array.isArray(p.images)) {
      p.images.forEach(img => {
        if (!allImgs.includes(img)) allImgs.push(img);
      });
    }
    if (allImgs.length === 0 && cover) {
      allImgs.push(cover);
    }

    currentProjectImages = allImgs;
    renderSlidePreviews();

    document.getElementById('modal-project-form').classList.add('active');
  };

  function renderSlidePreviews() {
    const container = document.getElementById('project-slides-preview');
    if (!container) return;

    const currentCover = document.getElementById('project-cover-path').value;

    if (currentProjectImages.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding:10px 0; width:100%;">No hay imágenes cargadas aún. Selecciona una portada o sube fotos para el carrusel.</div>';
      return;
    }

    container.innerHTML = currentProjectImages.map((img, index) => {
      const isCover = img === currentCover;
      return `
        <div class="preview-item ${isCover ? 'is-cover' : ''}"
             draggable="true"
             data-index="${index}"
             onclick="setCoverFromSlides('${img}')"
             title="Clic: Definir como Portada | Arrastra para cambiar el orden">
          <div class="drag-icon-handle"><i class="mdi mdi-drag"></i> ${index + 1}</div>
          <img src="/${img}" alt="Slide ${index + 1}" />
          ${isCover ? '<div class="preview-cover-badge">★ Portada</div>' : '<div class="preview-set-cover-hint"><span>Clic: Portada</span><span style="font-size:0.6rem; opacity:0.8;">↔ Arrastra</span></div>'}
          <button type="button" class="preview-remove" onclick="event.stopPropagation(); removeSlideImage(${index})" title="Eliminar foto">&times;</button>
        </div>
      `;
    }).join('');

    // Attach Drag and Drop Event Listeners
    const items = container.querySelectorAll('.preview-item');
    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedIndex = parseInt(item.getAttribute('data-index'));
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedIndex);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        items.forEach(i => i.classList.remove('drag-over'));
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      item.addEventListener('dragenter', () => {
        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const targetIndex = parseInt(item.getAttribute('data-index'));

        if (draggedIndex !== null && draggedIndex !== targetIndex) {
          const movedItem = currentProjectImages.splice(draggedIndex, 1)[0];
          currentProjectImages.splice(targetIndex, 0, movedItem);
          renderSlidePreviews();
        }
      });
    });
  }

  window.setCoverFromSlides = function(img) {
    document.getElementById('project-cover-path').value = img;
    document.getElementById('project-cover-preview').src = `/${img}`;
    renderSlidePreviews();
    showToast('Imagen seleccionada como portada.');
  };

  window.removeSlideImage = function(index) {
    const removed = currentProjectImages.splice(index, 1)[0];
    if (document.getElementById('project-cover-path').value === removed && currentProjectImages.length > 0) {
      setCoverFromSlides(currentProjectImages[0]);
    } else if (currentProjectImages.length === 0) {
      document.getElementById('project-cover-path').value = 'img/thumb-1.jpg';
      document.getElementById('project-cover-preview').src = '/img/thumb-1.jpg';
    }
    renderSlidePreviews();
  };

  // Upload Cover Image directly
  document.getElementById('cover-file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const res = await fetchAuth('/api/upload', { method: 'POST', body: formData });
    if (res && res.success) {
      document.getElementById('project-cover-path').value = res.filePath;
      document.getElementById('project-cover-preview').src = `/${res.filePath}`;
      if (!currentProjectImages.includes(res.filePath)) {
        currentProjectImages.unshift(res.filePath);
      }
      renderSlidePreviews();
      showToast('Imagen de portada subida.');
    }
  });

  // Upload Slide Images
  document.getElementById('slides-file-input')?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetchAuth('/api/upload', { method: 'POST', body: formData });
      if (res && res.success) {
        if (!currentProjectImages.includes(res.filePath)) {
          currentProjectImages.push(res.filePath);
        }
      }
    }
    // If no cover set yet or default placeholder, use the first uploaded slide
    if ((document.getElementById('project-cover-path').value === 'img/thumb-1.jpg' || !document.getElementById('project-cover-path').value) && currentProjectImages.length > 0) {
      setCoverFromSlides(currentProjectImages[0]);
    } else {
      renderSlidePreviews();
    }
    showToast(`${files.length} foto(s) agregada(s).`);
  });

  // Save Project Form Submit
  document.getElementById('project-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('project-id').value;

    const payload = {
      title: document.getElementById('project-title').value.trim(),
      category_tag: document.getElementById('project-category-tag').value,
      category_label: document.getElementById('project-category-label').value.trim(),
      client_name: document.getElementById('project-client').value.trim(),
      live_url: document.getElementById('project-url').value.trim(),
      description: document.getElementById('project-description').value.trim(),
      order_index: parseInt(document.getElementById('project-order').value) || 0,
      cover_image: document.getElementById('project-cover-path').value,
      images: currentProjectImages
    };

    const url = id ? `/api/projects/${id}` : '/api/projects';
    const method = id ? 'PUT' : 'POST';

    const res = await fetchAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      showToast(id ? 'Proyecto actualizado exitosamente.' : 'Proyecto creado exitosamente.');
      closeAllModals();
      loadProjects();
    }
  });

  window.deleteProject = async function(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto?')) return;

    const res = await fetchAuth(`/api/projects/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      showToast('Proyecto eliminado.');
      loadProjects();
    }
  };

  // ==========================================
  // 3. BLOG / POSTS
  // ==========================================
  let postsList = [];

  async function loadPosts() {
    const data = await fetchAuth('/api/admin/posts');
    if (!data || !data.success) return;

    postsList = data.posts;
    const table = document.getElementById('posts-table-body');
    if (!table) return;

    if (postsList.length === 0) {
      table.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:30px;">No hay artículos registrados.</td></tr>`;
      return;
    }

    table.innerHTML = postsList.map(p => `
      <tr>
        <td><img src="/${p.cover_image || 'img/thumb-1.jpg'}" class="thumb-preview" alt="${p.title}" /></td>
        <td><strong>${p.title}</strong></td>
        <td><span class="badge badge-tag">${p.category || 'General'}</span></td>
        <td><span class="badge ${p.is_published ? 'badge-success' : 'badge-danger'}">${p.is_published ? 'Publicado' : 'Borrador'}</span></td>
        <td>${p.views || 0}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="openEditPostModal(${p.id})" title="Editar"><i class="mdi mdi-pencil"></i></button>
            <button class="btn-icon delete" onclick="deletePost(${p.id})" title="Eliminar"><i class="mdi mdi-delete"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.openCreatePostModal = function() {
    document.getElementById('post-form').reset();
    document.getElementById('post-id').value = '';
    document.getElementById('post-modal-title').textContent = 'Nuevo Artículo';
    document.getElementById('post-cover-preview').src = '/img/thumb-1.jpg';
    document.getElementById('post-cover-path').value = 'img/thumb-1.jpg';
    document.getElementById('post-published').checked = true;
    document.getElementById('modal-post-form').classList.add('active');
  };

  window.openEditPostModal = function(id) {
    const p = postsList.find(item => item.id === id);
    if (!p) return;

    document.getElementById('post-id').value = p.id;
    document.getElementById('post-modal-title').textContent = 'Editar Artículo';
    document.getElementById('post-title').value = p.title;
    document.getElementById('post-category').value = p.category || 'Marketing';
    document.getElementById('post-date').value = p.published_date || '';
    document.getElementById('post-excerpt').value = p.excerpt || '';
    document.getElementById('post-content').value = p.content || '';
    document.getElementById('post-published').checked = !!p.is_published;

    document.getElementById('post-cover-path').value = p.cover_image || 'img/thumb-1.jpg';
    document.getElementById('post-cover-preview').src = `/${p.cover_image || 'img/thumb-1.jpg'}`;

    document.getElementById('modal-post-form').classList.add('active');
  };

  document.getElementById('post-cover-file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const res = await fetchAuth('/api/upload', { method: 'POST', body: formData });
    if (res && res.success) {
      document.getElementById('post-cover-path').value = res.filePath;
      document.getElementById('post-cover-preview').src = `/${res.filePath}`;
      showToast('Portada de artículo subida.');
    }
  });

  document.getElementById('post-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('post-id').value;

    const payload = {
      title: document.getElementById('post-title').value.trim(),
      category: document.getElementById('post-category').value.trim(),
      published_date: document.getElementById('post-date').value.trim(),
      excerpt: document.getElementById('post-excerpt').value.trim(),
      content: document.getElementById('post-content').value.trim(),
      cover_image: document.getElementById('post-cover-path').value,
      is_published: document.getElementById('post-published').checked ? 1 : 0
    };

    const url = id ? `/api/posts/${id}` : '/api/posts';
    const method = id ? 'PUT' : 'POST';

    const res = await fetchAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      showToast(id ? 'Artículo actualizado.' : 'Artículo creado exitosamente.');
      closeAllModals();
      loadPosts();
    }
  });

  window.deletePost = async function(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este artículo?')) return;
    const res = await fetchAuth(`/api/posts/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      showToast('Artículo eliminado.');
      loadPosts();
    }
  };

  // ==========================================
  // 4. SKILLS (HABILIDADES)
  // ==========================================
  let skillsList = [];

  async function loadSkills() {
    const data = await fetchAuth('/api/skills');
    if (!data || !data.success) return;

    skillsList = data.skills;
    const table = document.getElementById('skills-table-body');
    if (!table) return;

    table.innerHTML = skillsList.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td><span class="badge badge-tag">${s.category || 'Diseño'}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="flex-grow:1; background:#12161f; height:8px; border-radius:4px; overflow:hidden;">
              <div style="width:${s.percentage}%; background:var(--accent-cyan); height:100%;"></div>
            </div>
            <span>${s.percentage}%</span>
          </div>
        </td>
        <td>${s.order_index}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="openEditSkillModal(${s.id})" title="Editar"><i class="mdi mdi-pencil"></i></button>
            <button class="btn-icon delete" onclick="deleteSkill(${s.id})" title="Eliminar"><i class="mdi mdi-delete"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.openCreateSkillModal = function() {
    document.getElementById('skill-form').reset();
    document.getElementById('skill-id').value = '';
    document.getElementById('skill-modal-title').textContent = 'Nueva Habilidad';
    document.getElementById('skill-range-val').textContent = '50%';
    document.getElementById('skill-pct').value = 50;
    document.getElementById('modal-skill-form').classList.add('active');
  };

  window.openEditSkillModal = function(id) {
    const s = skillsList.find(item => item.id === id);
    if (!s) return;

    document.getElementById('skill-id').value = s.id;
    document.getElementById('skill-modal-title').textContent = 'Editar Habilidad';
    document.getElementById('skill-name').value = s.name;
    document.getElementById('skill-category').value = s.category || 'Diseño';
    document.getElementById('skill-pct').value = s.percentage;
    document.getElementById('skill-range-val').textContent = `${s.percentage}%`;
    document.getElementById('skill-order').value = s.order_index || 0;

    document.getElementById('modal-skill-form').classList.add('active');
  };

  document.getElementById('skill-pct')?.addEventListener('input', (e) => {
    document.getElementById('skill-range-val').textContent = `${e.target.value}%`;
  });

  document.getElementById('skill-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('skill-id').value;

    const payload = {
      name: document.getElementById('skill-name').value.trim(),
      category: document.getElementById('skill-category').value.trim(),
      percentage: parseInt(document.getElementById('skill-pct').value) || 50,
      order_index: parseInt(document.getElementById('skill-order').value) || 0
    };

    const url = id ? `/api/skills/${id}` : '/api/skills';
    const method = id ? 'PUT' : 'POST';

    const res = await fetchAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      showToast(id ? 'Habilidad actualizada.' : 'Habilidad creada.');
      closeAllModals();
      loadSkills();
    }
  });

  window.deleteSkill = async function(id) {
    if (!confirm('¿Eliminar esta habilidad?')) return;
    const res = await fetchAuth(`/api/skills/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      showToast('Habilidad eliminada.');
      loadSkills();
    }
  };

  // ==========================================
  // 5. PROFILE & SOCIALS
  // ==========================================
  async function loadProfile() {
    const data = await fetchAuth('/api/profile');
    if (!data || !data.success) return;

    const p = data.profile;
    document.getElementById('profile-name').value = p.name || '';
    document.getElementById('profile-tagline').value = p.tagline || '';
    document.getElementById('profile-bio-title').value = p.bio_title || '';
    document.getElementById('profile-bio-content').value = p.bio_content || '';
    document.getElementById('profile-email').value = p.email || '';
    document.getElementById('profile-phone').value = p.phone || '';
    document.getElementById('profile-whatsapp').value = p.whatsapp || '';
    document.getElementById('profile-instagram').value = p.instagram || '';
    document.getElementById('profile-facebook').value = p.facebook || '';
    document.getElementById('profile-linkedin').value = p.linkedin || '';
    
    document.getElementById('profile-avatar-path').value = p.avatar_url || 'img/image.png';
    document.getElementById('profile-avatar-preview').src = `/${p.avatar_url || 'img/image.png'}`;
  }

  document.getElementById('avatar-file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const res = await fetchAuth('/api/upload', { method: 'POST', body: formData });
    if (res && res.success) {
      document.getElementById('profile-avatar-path').value = res.filePath;
      document.getElementById('profile-avatar-preview').src = `/${res.filePath}`;
      showToast('Foto de perfil subida.');
    }
  });

  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      name: document.getElementById('profile-name').value.trim(),
      tagline: document.getElementById('profile-tagline').value.trim(),
      bio_title: document.getElementById('profile-bio-title').value.trim(),
      bio_content: document.getElementById('profile-bio-content').value.trim(),
      avatar_url: document.getElementById('profile-avatar-path').value,
      email: document.getElementById('profile-email').value.trim(),
      phone: document.getElementById('profile-phone').value.trim(),
      whatsapp: document.getElementById('profile-whatsapp').value.trim(),
      instagram: document.getElementById('profile-instagram').value.trim(),
      facebook: document.getElementById('profile-facebook').value.trim(),
      linkedin: document.getElementById('profile-linkedin').value.trim()
    };

    const res = await fetchAuth('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      showToast('Perfil actualizado correctamente.');
    }
  });

  // ==========================================
  // 6. MESSAGES (CONTACT INBOX)
  // ==========================================
  let messagesList = [];

  async function loadMessages() {
    const data = await fetchAuth('/api/admin/messages');
    if (!data || !data.success) return;

    messagesList = data.messages;
    const table = document.getElementById('messages-table-body');
    if (!table) return;

    if (messagesList.length === 0) {
      table.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:30px;">No hay mensajes en la bandeja de entrada.</td></tr>`;
      return;
    }

    table.innerHTML = messagesList.map(m => `
      <tr style="${m.is_read ? '' : 'background: rgba(227, 27, 109, 0.06);'}">
        <td><strong>${m.name}</strong></td>
        <td><a href="mailto:${m.email}" style="color:var(--accent-cyan);">${m.email}</a></td>
        <td><div style="max-width:350px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.message}</div></td>
        <td><span class="badge ${m.is_read ? 'badge-tag' : 'badge-unread'}">${m.is_read ? 'Leído' : 'Nuevo'}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="toggleReadMessage(${m.id}, ${m.is_read ? 0 : 1})" title="${m.is_read ? 'Marcar como no leído' : 'Marcar como leído'}">
              <i class="mdi ${m.is_read ? 'mdi-email-outline' : 'mdi-email-open-outline'}"></i>
            </button>
            <a href="mailto:${m.email}?subject=Re: Contacto Portafolio" class="btn-icon" title="Responder por correo">
              <i class="mdi mdi-reply"></i>
            </a>
            <button class="btn-icon delete" onclick="deleteMessage(${m.id})" title="Eliminar"><i class="mdi mdi-delete"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.toggleReadMessage = async function(id, is_read) {
    const res = await fetchAuth(`/api/admin/messages/${id}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read })
    });
    if (res && res.success) {
      loadMessages();
      loadDashboard();
    }
  };

  window.deleteMessage = async function(id) {
    if (!confirm('¿Eliminar este mensaje?')) return;
    const res = await fetchAuth(`/api/admin/messages/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      showToast('Mensaje eliminado.');
      loadMessages();
      loadDashboard();
    }
  };

  // ==========================================
  // 7. SETTINGS & PASSWORD
  // ==========================================
  async function loadSettings() {
    const data = await fetchAuth('/api/profile');
    if (!data || !data.success) return;

    const s = data.settings;
    document.getElementById('settings-site-title').value = s.site_title || '';
    document.getElementById('settings-meta-desc').value = s.meta_description || '';
    document.getElementById('settings-hero-title').value = s.hero_title || '';
    document.getElementById('settings-hero-subtitle').value = s.hero_subtitle || '';
    document.getElementById('settings-footer').value = s.footer_text || '';
  }

  document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      site_title: document.getElementById('settings-site-title').value.trim(),
      meta_description: document.getElementById('settings-meta-desc').value.trim(),
      hero_title: document.getElementById('settings-hero-title').value.trim(),
      hero_subtitle: document.getElementById('settings-hero-subtitle').value.trim(),
      footer_text: document.getElementById('settings-footer').value.trim()
    };

    const res = await fetchAuth('/api/profile/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      showToast('Configuración del sitio guardada.');
    }
  });

  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      showToast('La nueva contraseña y su confirmación no coinciden.', 'error');
      return;
    }

    const res = await fetchAuth('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (res && res.success) {
      showToast('Contraseña actualizada exitosamente.');
      document.getElementById('password-form').reset();
    } else {
      showToast(res ? res.message : 'Error al cambiar contraseña.', 'error');
    }
  });

  // Initial tab
  switchTab('dashboard');
});
