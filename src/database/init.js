const bcrypt = require('bcryptjs');
const db = require('../config/database');
const env = require('../config/env');

function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      tagline TEXT,
      bio_title TEXT,
      bio_content TEXT,
      avatar_url TEXT,
      resume_url TEXT,
      email TEXT,
      phone TEXT,
      whatsapp TEXT,
      instagram TEXT,
      facebook TEXT,
      linkedin TEXT,
      behance TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      percentage INTEGER NOT NULL DEFAULT 50,
      category TEXT DEFAULT 'Diseño',
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_tag TEXT NOT NULL,
      category_label TEXT NOT NULL,
      description TEXT,
      client_name TEXT,
      live_url TEXT,
      cover_image TEXT,
      images_json TEXT DEFAULT '[]',
      is_featured INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT,
      cover_image TEXT,
      category TEXT DEFAULT 'Marketing',
      is_published INTEGER DEFAULT 1,
      published_date TEXT,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      site_title TEXT NOT NULL,
      meta_description TEXT,
      hero_title TEXT,
      hero_subtitle TEXT,
      footer_text TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin if not exists
  const existingUser = db.queryOne('SELECT id FROM users WHERE username = ?', [env.DEFAULT_ADMIN_USER]);
  if (!existingUser) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(env.DEFAULT_ADMIN_PASS, salt);
    db.run(
      'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
      [env.DEFAULT_ADMIN_USER, passwordHash, 'lesly.estela@pixibit.dev', 'admin']
    );
  }

  // Seed Profile
  const existingProfile = db.queryOne('SELECT id FROM profile WHERE id = 1');
  if (!existingProfile) {
    db.run(`
      INSERT INTO profile (
        id, name, tagline, bio_title, bio_content, avatar_url,
        email, phone, whatsapp, instagram, facebook, linkedin
      ) VALUES (
        1,
        'Lesli Estela',
        'Dirección de arte, identidad visual y diseño de experiencias digitales de alto impacto.',
        'Estrategia visual con rigor técnico y foco en conversión',
        'Diseño identidades de marca sólidas, piezas publicitarias de alto rendimiento e interfaces web modernas. Mi metodología combina diseño gráfico editorial, análisis de comportamiento del usuario y desarrollo de activos digitales listos para impulsar el crecimiento comercial de tu negocio.',
        'img/image.png',
        'contacto@lesliestela.com',
        '906127524',
        'https://api.whatsapp.com/send/?phone=906127524&text&type=phone_number&app_absent=0',
        'https://www.instagram.com/ylsel_495/',
        'https://www.facebook.com/lesly.eswtelavasquez',
        'https://linkedin.com'
      )
    `);
  }

  // Always migrate avatar and ensure anti-slop high-conversion texts in profile & site_settings
  db.run("UPDATE profile SET avatar_url = 'img/image.png' WHERE avatar_url LIKE '%lele.png%' OR avatar_url LIKE '%me.png%' OR avatar_url IS NULL");
  db.run(`
    UPDATE profile 
    SET tagline = 'Dirección de arte, identidad visual y diseño de experiencias digitales de alto impacto.',
        bio_title = 'Estrategia visual con rigor técnico y foco en conversión',
        bio_content = 'Diseño identidades de marca sólidas, piezas publicitarias de alto rendimiento e interfaces web modernas. Mi metodología combina diseño gráfico editorial, análisis de comportamiento del usuario y desarrollo de activos digitales listos para impulsar el crecimiento comercial de tu negocio.'
    WHERE tagline LIKE '%apasionada%' OR bio_title LIKE '%¿Quién soy?%'
  `);


  // Seed Skills
  const skillsCount = db.queryOne('SELECT COUNT(*) as count FROM skills');
  if (skillsCount && skillsCount.count === 0) {
    const initialSkills = [
      { name: 'Illustrator', percentage: 85, category: 'Diseño', order_index: 1 },
      { name: 'Photoshop', percentage: 85, category: 'Diseño', order_index: 2 },
      { name: 'Premiere Pro', percentage: 70, category: 'Video', order_index: 3 },
      { name: 'Fotografía', percentage: 60, category: 'Audiovisual', order_index: 4 },
      { name: 'After Effects', percentage: 60, category: 'Video', order_index: 5 },
      { name: 'UI/UX', percentage: 60, category: 'Diseño Web', order_index: 6 },
      { name: 'Figma', percentage: 60, category: 'Diseño Web', order_index: 7 },
      { name: 'HTML', percentage: 50, category: 'Desarrollo Web', order_index: 8 },
      { name: 'CSS', percentage: 50, category: 'Desarrollo Web', order_index: 9 },
      { name: 'SEO', percentage: 50, category: 'Marketing', order_index: 10 }
    ];

    for (const s of initialSkills) {
      db.run(
        'INSERT INTO skills (name, percentage, category, order_index) VALUES (?, ?, ?, ?)',
        [s.name, s.percentage, s.category, s.order_index]
      );
    }
  }

  // Seed Projects
  const projectsCount = db.queryOne('SELECT COUNT(*) as count FROM projects');
  if (projectsCount && projectsCount.count === 0) {
    const initialProjects = [
      {
        title: 'Fuente Dorada',
        category_tag: 'promo',
        category_label: 'MATERIAL PROMOCIONAL',
        description: 'Campaña visual y material publicitario para Fuente Dorada. Diseño de folletería, banners publicitarios y piezas para redes sociales destacando la identidad premium de la marca.',
        client_name: 'Fuente Dorada',
        live_url: '',
        cover_image: 'img/thumb-1.jpg',
        images_json: JSON.stringify([
          'img/slides/ordering-0.jpg',
          'img/slides/ordering-1.jpg',
          'img/slides/ordering-2.jpg'
        ]),
        order_index: 1
      },
      {
        title: 'Heladería Arcoíris',
        category_tag: 'promo',
        category_label: 'MATERIAL PROMOCIONAL',
        description: 'Desarrollo de piezas promocionales coloridas y dinámicas para heladería artesanal, incluyendo menús ilustrados, afiches en punto de venta y packaging alegre.',
        client_name: 'Heladería Arcoíris',
        live_url: '',
        cover_image: 'img/thumb-2.jpg',
        images_json: JSON.stringify([
          'img/slides/discover-1.jpg',
          'img/slides/discover-2.jpg'
        ]),
        order_index: 2
      },
      {
        title: 'Apu Pariakaka',
        category_tag: 'promo',
        category_label: 'MATERIAL PROMOCIONAL',
        description: 'Diseño conceptual y promocional inspirado en la mística andina. Composición visual de impacto para cartelería cultural y merchandising exclusivo.',
        client_name: 'Apu Pariakaka',
        live_url: '',
        cover_image: 'img/thumb-3.jpg',
        images_json: JSON.stringify([
          'img/slides/newrelic-0.jpg',
          'img/slides/newrelic-1.jpg',
          'img/slides/newrelic-2.jpg'
        ]),
        order_index: 3
      },
      {
        title: 'Tienda Virtual',
        category_tag: 'web',
        category_label: 'SITIOS WEB',
        description: 'Diseño de interfaz y experiencia de usuario para plataforma e-commerce moderna, con navegación intuitiva y optimización visual para conversión móvil.',
        client_name: 'E-commerce Project',
        live_url: 'https://lesli-estela.pixibit.dev',
        cover_image: 'img/thumb-4.jpg',
        images_json: JSON.stringify([
          'img/slides/roambi-0.jpg',
          'img/slides/roambi-1.jpg',
          'img/slides/roambi-2.jpg'
        ]),
        order_index: 4
      },
      {
        title: 'Monte Pukuy',
        category_tag: 'branding',
        category_label: 'IDENTIDAD DE MARCA',
        description: 'Manual de Identidad de Marca para Monte Pukuy Chinchay Fruits, donde la esencia de la naturaleza se fusiona con la frescura de los productos agroindustriales.',
        client_name: 'Monte Pukuy Chinchay Fruits',
        live_url: '',
        cover_image: 'img/thumb-5.jpg',
        images_json: JSON.stringify([
          'img/slides/walker-0.jpg',
          'img/slides/walker-1.jpg',
          'img/slides/walker-2.jpg',
          'img/slides/walker-3.jpg'
        ]),
        order_index: 5
      },
      {
        title: 'Portafolio Personal',
        category_tag: 'web',
        category_label: 'SITIOS WEB',
        description: 'Diseño y maquetación de portafolio profesional interactivo con transiciones fluidas, sistema de partículas y panel de gestión de contenidos.',
        client_name: 'Lesli Estela',
        live_url: 'https://lesli-estela.pixibit.dev',
        cover_image: 'img/thumb-6.jpg',
        images_json: JSON.stringify([
          'img/slides/mystand-0.jpg',
          'img/slides/mystand-1.jpg',
          'img/slides/mystand-2.jpg'
        ]),
        order_index: 6
      }
    ];

    for (const p of initialProjects) {
      db.run(`
        INSERT INTO projects (
          title, category_tag, category_label, description, client_name,
          live_url, cover_image, images_json, is_featured, order_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `, [p.title, p.category_tag, p.category_label, p.description, p.client_name, p.live_url, p.cover_image, p.images_json, p.order_index]);
    }
  }

  // Seed Blog Posts
  const postsCount = db.queryOne('SELECT COUNT(*) as count FROM posts');
  if (postsCount && postsCount.count === 0) {
    const initialPosts = [
      {
        title: '10 Estrategias de Marketing Digital que Debes Conocer en 2026',
        slug: '10-estrategias-de-marketing-digital-2026',
        excerpt: 'Exploramos las estrategias clave de marketing digital más relevantes y efectivas: contenido de valor, SEO, automatización con IA y branding visual.',
        content: `### 10 Estrategias de Marketing Digital Clave\n\nEn este artículo exploraremos las estrategias más efectivas para posicionar tu marca en el mercado actual:\n\n1. **Marketing de Contenidos Visual**: El contenido visual estructurado genera un 80% más de retención.\n2. **Optimización SEO y Experiencia de Usuario**: La velocidad y el diseño responsivo son fundamentales.\n3. **Branding Coherente y Auténtico**: Transmitir los valores de la marca en cada punto de contacto.\n4. **Social Media Engagement**: Crear comunidades activas en torno a historias reales.\n5. **Automatización e Inteligencia Artificial**: Optimizar flujos de trabajo creativos.\n6. **Video Marketing y Reels**: El formato vertical domina el consumo digital.\n7. **Email Marketing Segmentado**: Comunicación personalizada y de alto valor.\n8. **Estrategia de Micro-Influencers**: Colaboraciones con audiencias hiper-específicas.\n9. **Diseño Web Centrado en la Conversión**: Arquitecturas visuales pensadas para guiar al usuario.\n10. **Analítica y Medición Continua**: Decisiones basadas en datos e iteración constante.`,
        cover_image: 'img/thumb-1.jpg',
        category: 'Marketing',
        published_date: 'MARZO 29, 2026'
      },
      {
        title: 'Cómo Crear una Campaña Publicitaria Efectiva: Guía Paso a Paso',
        slug: 'como-crear-campana-publicitaria-efectiva',
        excerpt: 'Aprende paso a paso cómo estructurar una campaña exitosa: desde la definición de objetivos hasta la elección de canales y medición de resultados.',
        content: `### Guía Paso a Paso para una Campaña Exitosa\n\nCrear una campaña publicitaria memorable requiere un balance entre creatividad y método analítico:\n\n1. **Definición del Objetivo (SMART)**: ¿Qué buscamos lograr? Reconocimiento, leads o ventas directas.\n2. **Conocimiento Profundo del Buyer Persona**: Conocer sus puntos de dolor, deseos y hábitos de consumo.\n3. **El Concepto Creativo Central (Big Idea)**: La idea fuerza que unifica todas las piezas publicitarias.\n4. **Selección Estratégica de Canales**: Combinación óptima de medios digitales y físicos.\n5. **Producción de Activos Visuales de Alto Impacto**: Gráficos, videos y copys persuasivos.\n6. **Lanzamiento y Seguimiento de Métricas**: Monitorización constante del ROI y feedback de audiencia.`,
        cover_image: 'img/thumb-2.jpg',
        category: 'Publicidad',
        published_date: 'ABRIL 19, 2026'
      },
      {
        title: 'El Poder del Storytelling en el Marketing: Cómo Contar Historias que Conecten',
        slug: 'poder-storytelling-en-marketing',
        excerpt: 'Descubre cómo conectar emocionalmente con tu audiencia a través de narrativas persuasivas y conceptos visuales memorables.',
        content: `### Conectando con las Emociones a través del Storytelling\n\nLas personas no compran productos, compran historias que refuerzan su identidad y valores:\n\n- **El Héroe es tu Cliente**: Posiciona a tu usuario como el protagonista y a tu marca como el guía o mentor.\n- **Conflicto y Resolución**: Toda buena historia plantea un desafío real que se supera con una solución inspiradora.\n- **Lenguaje Visual y Emoción**: El uso del color, tipografía y composición para despertar sensaciones inmediatas.\n- **Humanizar la Marca**: Mostrar los procesos, el equipo y la visión detrás de cada proyecto.`,
        cover_image: 'img/thumb-3.jpg',
        category: 'Branding',
        published_date: 'MAYO 04, 2026'
      },
      {
        title: 'Tendencias en Diseño y Publicidad: Lo Que Debes Saber para Destacar',
        slug: 'tendencias-diseno-publicidad-destacar',
        excerpt: 'Explora las últimas tendencias en identidad visual, micro-interacciones, diseño minimalista y experiencias interactivas.',
        content: `### Tendencias Actuales en el Mundo del Diseño\n\nEl diseño evoluciona a un ritmo acelerado. Estas son las tendencias que están marcando la pauta:\n\n- **Glassmorphism y Efectos de Profundidad**: Estéticas limpias con gradientes suaves y transparencias sofisticadas.\n- **Tipografías con Personalidad Fuerte**: Serifas modernas y fuentes display que comunican carácter propio.\n- **Micro-Animaciones Interactivas**: Pequeños detalles visuales que enriquecen la navegación sin sobrecargar.\n- **Sostenibilidad y Minimalismo Consciente**: Diseños directos, sin artificios innecesarios.`,
        cover_image: 'img/thumb-4.jpg',
        category: 'Diseño',
        published_date: 'MAYO 23, 2026'
      }
    ];

    for (const post of initialPosts) {
      db.run(`
        INSERT INTO posts (
          title, slug, excerpt, content, cover_image, category, is_published, published_date
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `, [post.title, post.slug, post.excerpt, post.content, post.cover_image, post.category, post.published_date]);
    }
  }

  // Seed Site Settings
  const existingSettings = db.queryOne('SELECT id FROM site_settings WHERE id = 1');
  if (!existingSettings) {
    db.run(`
      INSERT INTO site_settings (
        id, site_title, meta_description, hero_title, hero_subtitle, footer_text
      ) VALUES (
        1,
        'Lesli Estela | Dirección de Arte, Identidad Visual & Diseño Web',
        'Portafolio profesional de Lesli Estela. Especialista en identidad de marca, piezas publicitarias de alto impacto, interfaces UI/UX y diseño web.',
        'Diseño visual estratégico que <span class="highlight">construye marcas</span> memorables',
        'Identidad de marca, diseño publicitario y experiencias web de alta fidelidad orientadas a resultados comerciales.',
        'Lesli Estela &copy; 2026. Dirección de Arte & Estrategia Visual.'
      )
    `);
  } else {
    db.run(`
      UPDATE site_settings
      SET site_title = 'Lesli Estela | Dirección de Arte, Identidad Visual & Diseño Web',
          meta_description = 'Portafolio profesional de Lesli Estela. Especialista en identidad de marca, piezas publicitarias de alto impacto, interfaces UI/UX y diseño web.',
          hero_title = 'Diseño visual estratégico que <span class="highlight">construye marcas</span> memorables',
          hero_subtitle = 'Identidad de marca, diseño publicitario y experiencias web de alta fidelidad orientadas a resultados comerciales.',
          footer_text = 'Lesli Estela &copy; 2026. Dirección de Arte & Estrategia Visual.'
      WHERE hero_title LIKE '%Hola, soy%' OR hero_subtitle LIKE '%apasionada%'
    `);
  }
}

module.exports = { initDatabase };
