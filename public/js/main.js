// Lesli Estela - Dynamic Public Client Script
document.addEventListener('DOMContentLoaded', () => {
  let projectsData = [];
  let currentProject = null;
  let currentSlideIndex = 0;

  // Initialize Page
  fetchProfile();
  fetchSkills();
  fetchProjects();
  fetchPosts();
  initNav();
  initContactForm();

  // --- PROFILE & SITE SETTINGS ---
  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (!data.success) return;

      const { profile, settings } = data;

      // Update Site Title & Hero
      if (settings.site_title) document.title = settings.site_title;
      if (settings.hero_title) document.getElementById('hero-title').innerHTML = settings.hero_title;
      if (settings.hero_subtitle) document.getElementById('hero-subtitle').textContent = settings.hero_subtitle;
      if (settings.footer_text) document.getElementById('footer-copy').innerHTML = settings.footer_text;

      // Update Bio / About Me
      if (profile.name) document.getElementById('nav-logo-text').textContent = profile.name;
      if (profile.bio_title) document.getElementById('bio-title').textContent = profile.bio_title;
      if (profile.bio_content) document.getElementById('bio-content').innerHTML = profile.bio_content;
      if (profile.avatar_url) document.getElementById('bio-avatar').src = profile.avatar_url;

      // Update Social Links
      const socialsContainer = document.getElementById('social-icons');
      if (socialsContainer) {
        let html = '';
        if (profile.facebook) {
          html += `<a href="${profile.facebook}" target="_blank" class="social-btn" title="Facebook"><i class="mdi mdi-facebook"></i></a>`;
        }
        if (profile.instagram) {
          html += `<a href="${profile.instagram}" target="_blank" class="social-btn" title="Instagram"><i class="mdi mdi-instagram"></i></a>`;
        }
        if (profile.whatsapp) {
          html += `<a href="${profile.whatsapp}" target="_blank" class="social-btn" title="WhatsApp"><i class="mdi mdi-whatsapp"></i></a>`;
        }
        if (profile.linkedin) {
          html += `<a href="${profile.linkedin}" target="_blank" class="social-btn" title="LinkedIn"><i class="mdi mdi-linkedin"></i></a>`;
        }
        socialsContainer.innerHTML = html;
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }

  // --- SKILLS ---
  async function fetchSkills() {
    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      if (!data.success) return;

      const skillsContainer = document.getElementById('skills-container');
      if (!skillsContainer) return;

      skillsContainer.innerHTML = data.skills.map(s => `
        <div class="skill-bar-wrap">
          <div class="skill-bar-fill" style="width: ${s.percentage}%">
            <span class="skill-name">${s.name}</span>
          </div>
          <span class="skill-percentage">${s.percentage}%</span>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error loading skills:', err);
    }
  }

  // --- PROJECTS / PORTFOLIO ---
  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (!data.success) return;

      projectsData = data.projects;
      renderProjects('all');
      initFilterButtons();
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  }

  function renderProjects(filterTag) {
    const gallery = document.getElementById('projects-gallery');
    if (!gallery) return;

    const filtered = filterTag === 'all' 
      ? projectsData 
      : projectsData.filter(p => p.category_tag === filterTag);

    if (filtered.length === 0) {
      gallery.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No hay proyectos en esta categoría.</div>`;
      return;
    }

    gallery.innerHTML = filtered.map(p => `
      <div class="project-card" data-category="${p.category_tag}">
        <div class="project-thumb">
          <img src="${p.cover_image || 'img/thumb-1.jpg'}" alt="${p.title}" loading="lazy">
        </div>
        <div class="project-info">
          <div class="project-category">${p.category_label || p.category_tag}</div>
          <h3 class="project-title">${p.title}</h3>
          <p class="project-excerpt">${p.description || ''}</p>
          <button class="project-btn" onclick="openProjectModal(${p.id})">
            <span>Ver Más</span>
            <i class="mdi mdi-arrow-right"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  function initFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        renderProjects(filter);
      });
    });
  }

  // Window-accessible Project Modal opener
  window.openProjectModal = function(id) {
    currentProject = projectsData.find(p => p.id === id);
    if (!currentProject) return;

    currentSlideIndex = 0;
    const modal = document.getElementById('project-modal');
    document.getElementById('modal-project-title').textContent = currentProject.title;
    document.getElementById('modal-project-tag').textContent = currentProject.category_label || currentProject.category_tag;
    document.getElementById('modal-project-desc').textContent = currentProject.description || 'Sin descripción adicional.';

    const linkBtn = document.getElementById('modal-project-link');
    if (currentProject.live_url && currentProject.live_url.startsWith('http')) {
      linkBtn.href = currentProject.live_url;
      linkBtn.style.display = 'inline-flex';
    } else {
      linkBtn.style.display = 'none';
    }

    updateCarouselSlides();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function updateCarouselSlides() {
    const slides = currentProject && currentProject.images && currentProject.images.length > 0 
      ? currentProject.images 
      : [currentProject.cover_image || 'img/thumb-1.jpg'];

    const slideImg = document.getElementById('carousel-slide-img');
    const prevBtn = document.getElementById('carousel-prev-btn');
    const nextBtn = document.getElementById('carousel-next-btn');

    slideImg.src = slides[currentSlideIndex] || slides[0];

    if (slides.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
  }

  document.getElementById('carousel-prev-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentProject) return;
    const slides = currentProject.images && currentProject.images.length > 0 ? currentProject.images : [currentProject.cover_image];
    currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
    updateCarouselSlides();
  });

  document.getElementById('carousel-next-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentProject) return;
    const slides = currentProject.images && currentProject.images.length > 0 ? currentProject.images : [currentProject.cover_image];
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    updateCarouselSlides();
  });

  // Modal Closers
  document.querySelectorAll('.modal-close-btn, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el || el.classList.contains('modal-close-btn')) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = 'auto';
      }
    });
  });

  // --- BLOG ---
  async function fetchPosts() {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (!data.success) return;

      const blogGrid = document.getElementById('blog-grid');
      if (!blogGrid) return;

      if (data.posts.length === 0) {
        blogGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No hay publicaciones disponibles en este momento.</div>`;
        return;
      }

      blogGrid.innerHTML = data.posts.map(post => `
        <div class="blog-card" onclick="openBlogModal('${post.slug}')">
          <div class="blog-thumb">
            <img src="${post.cover_image || 'img/thumb-1.jpg'}" alt="${post.title}" loading="lazy">
          </div>
          <div class="blog-info">
            <div class="blog-meta">
              <span class="blog-tag">${post.category || 'MARKETING'}</span>
              <span class="blog-date">${post.published_date || ''}</span>
            </div>
            <h3 class="blog-title">${post.title}</h3>
            <p class="blog-excerpt">${post.excerpt || ''}</p>
            <div class="blog-read-more">
              <span>Leer artículo completo</span>
              <i class="mdi mdi-arrow-right"></i>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error loading blog posts:', err);
    }
  }

  window.openBlogModal = async function(slug) {
    try {
      const res = await fetch(`/api/posts/${slug}`);
      const data = await res.json();
      if (!data.success) return;

      const post = data.post;
      const modal = document.getElementById('blog-modal');
      document.getElementById('modal-blog-tag').textContent = post.category || 'BLOG';
      document.getElementById('modal-blog-title').textContent = post.title;
      document.getElementById('modal-blog-date').textContent = post.published_date || '';
      document.getElementById('modal-blog-img').src = post.cover_image || 'img/thumb-1.jpg';

      // Simple Markdown-to-HTML parser for formatted article content
      let contentHtml = post.content || '';
      contentHtml = contentHtml
        .replace(/^### (.*$)/gim, '<h3 style="color:#04c2c9; margin: 20px 0 10px 0;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="color:#ffffff; margin: 24px 0 12px 0;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#ffffff;">$1</strong>')
        .replace(/^\s*\n\*/gm, '<ul>\n*')
        .replace(/^(\d+)\.\s+(.*$)/gim, '<li style="margin-left:20px; margin-bottom:6px;"><strong>$1.</strong> $2</li>')
        .replace(/^-\s+(.*$)/gim, '<li style="margin-left:20px; margin-bottom:6px;">$1</li>')
        .replace(/\n\n/gim, '<br><br>');

      document.getElementById('modal-blog-content').innerHTML = contentHtml;

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      console.error('Error opening blog article:', err);
    }
  };

  // --- CONTACT FORM ---
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const feedback = document.getElementById('contact-feedback');
    const submitBtn = document.getElementById('contact-submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      feedback.className = 'form-feedback';
      feedback.style.display = 'none';

      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const message = document.getElementById('contact-message').value.trim();

      if (!name || !email || !message) {
        feedback.className = 'form-feedback error';
        feedback.textContent = 'Por favor completa todos los campos requeridos.';
        feedback.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="mdi mdi-loading mdi-spin"></i> Enviando...';

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        const data = await res.json();
        if (data.success) {
          feedback.className = 'form-feedback success';
          feedback.textContent = data.message || '¡Tu mensaje ha sido enviado correctamente! Gracias.';
          feedback.style.display = 'block';
          form.reset();
        } else {
          feedback.className = 'form-feedback error';
          feedback.textContent = data.message || 'No se pudo enviar el mensaje.';
          feedback.style.display = 'block';
        }
      } catch (err) {
        feedback.className = 'form-feedback error';
        feedback.textContent = 'Ocurrió un error al enviar el mensaje. Intenta de nuevo más tarde.';
        feedback.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>ENVIAR MENSAJE</span> <i class="mdi mdi-send"></i>';
      }
    });
  }

  // --- NAVIGATION & SCROLL ---
  function initNav() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    mobileToggle?.addEventListener('click', () => {
      navLinks?.classList.toggle('show');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks?.classList.remove('show');
      });
    });

    // ScrollSpy Link Active Highlight
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
      let current = '';
      const scrollPos = window.scrollY + 200;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          current = section.getAttribute('id');
        }
      });

      document.querySelectorAll('.nav-link').forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('href') === `#${current}`) {
          li.classList.add('active');
        }
      });
    });

    // Scroll to Top
    document.getElementById('scroll-top-btn')?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
