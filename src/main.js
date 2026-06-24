import gsap from "gsap";

import { Howl } from "howler";

import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import helvetikerBoldFont from "three/examples/fonts/helvetiker_bold.typeface.json";

import smokeVertexShader from "./shaders/smoke/vertex.glsl";
import smokeFragmentShader from "./shaders/smoke/fragment.glsl";
import themeVertexShader from "./shaders/theme/vertex.glsl";
import themeFragmentShader from "./shaders/theme/fragment.glsl";

/**  -------------------------- Audio setup -------------------------- */

// Background Music
let pianoDebounceTimer = null;
let isMusicFaded = false;
const MUSIC_FADE_TIME = 500;
const PIANO_TIMEOUT = 2000;
const BACKGROUND_MUSIC_VOLUME = 1;
const FADED_VOLUME = 0;

const backgroundMusic = new Howl({
  src: ["/audio/music/cosmic_candy.ogg"],
  loop: true,
  volume: 1,
});

const fadeOutBackgroundMusic = () => {
  if (!isMuted && !isMusicFaded) {
    backgroundMusic.fade(
      backgroundMusic.volume(),
      FADED_VOLUME,
      MUSIC_FADE_TIME
    );
    isMusicFaded = true;
  }
};

const fadeInBackgroundMusic = () => {
  if (!isMuted && isMusicFaded) {
    backgroundMusic.fade(
      FADED_VOLUME,
      BACKGROUND_MUSIC_VOLUME,
      MUSIC_FADE_TIME
    );
    isMusicFaded = false;
  }
};

// Piano
const pianoKeyMap = {
  C1_Key: "Key_24",
  "C#1_Key": "Key_23",
  D1_Key: "Key_22",
  "D#1_Key": "Key_21",
  E1_Key: "Key_20",
  F1_Key: "Key_19",
  "F#1_Key": "Key_18",
  G1_Key: "Key_17",
  "G#1_Key": "Key_16",
  A1_Key: "Key_15",
  "A#1_Key": "Key_14",
  B1_Key: "Key_13",
  C2_Key: "Key_12",
  "C#2_Key": "Key_11",
  D2_Key: "Key_10",
  "D#2_Key": "Key_9",
  E2_Key: "Key_8",
  F2_Key: "Key_7",
  "F#2_Key": "Key_6",
  G2_Key: "Key_5",
  "G#2_Key": "Key_4",
  A2_Key: "Key_3",
  "A#2_Key": "Key_2",
  B2_Key: "Key_1",
};

const pianoSounds = {};

Object.values(pianoKeyMap).forEach((soundKey) => {
  pianoSounds[soundKey] = new Howl({
    src: [`/audio/sfx/piano/${soundKey}.ogg`],
    preload: true,
    volume: 0.5,
  });
});

// Button
const buttonSounds = {
  click: new Howl({
    src: ["/audio/sfx/click/bubble.ogg"],
    preload: true,
    volume: 0.5,
  }),
};

/**  -------------------------- Scene setup -------------------------- */
const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color("#e9ded0");

const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  200
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 45;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.update();

//Set starting camera position
if (window.innerWidth < 768) {
  camera.position.set(
    29.567116827654726,
    14.018476147584705,
    31.37040363900147
  );
  controls.target.set(
    -0.08206262548844094,
    3.3119233527087255,
    -0.7433922282864018
  );
} else {
  camera.position.set(17.49173098423395, 9.108969527553887, 17.850992894238058);
  controls.target.set(
    0.4624746759408973,
    1.9719940043010387,
    -0.8300979125494505
  );
}

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update Camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**  -------------------------- Modal Stuff -------------------------- */
const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact"),
};

const overlay = document.querySelector(".overlay");

let touchHappened = false;
let overlayTouchStart = { x: 0, y: 0, moved: false };

const closeVisibleModalFromOverlay = () => {
  const modal = document.querySelector('.modal[style*="display: block"]');
  if (modal) hideModal(modal);
};

const isRealOverlayTap = (event) => event.target === overlay && !overlayTouchStart.moved;

overlay.addEventListener(
  "touchstart",
  (e) => {
    const touch = e.touches[0];
    overlayTouchStart = {
      x: touch.clientX,
      y: touch.clientY,
      moved: false,
    };
  },
  { passive: true }
);

overlay.addEventListener(
  "touchmove",
  (e) => {
    const touch = e.touches[0];
    if (
      Math.abs(touch.clientX - overlayTouchStart.x) > 10 ||
      Math.abs(touch.clientY - overlayTouchStart.y) > 10
    ) {
      overlayTouchStart.moved = true;
    }
  },
  { passive: true }
);

overlay.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    window.setTimeout(() => {
      touchHappened = false;
    }, 350);

    if (!isRealOverlayTap(e)) return;
    e.preventDefault();
    closeVisibleModalFromOverlay();
  },
  { passive: false }
);

overlay.addEventListener(
  "click",
  (e) => {
    if (touchHappened || e.target !== overlay) return;
    e.preventDefault();
    closeVisibleModalFromOverlay();
  },
  { passive: false }
);

document.querySelectorAll(".modal").forEach((modal) => {
  ["click", "pointerdown", "pointermove", "pointerup", "touchstart", "touchmove", "touchend", "wheel"].forEach(
    (eventName) => {
      modal.addEventListener(
        eventName,
        (event) => {
          event.stopPropagation();
        },
        { passive: true }
      );
    }
  );
});

document.querySelectorAll(".modal-exit-button").forEach((button) => {
  function handleModalExit(e) {
    e.preventDefault();
    const modal = e.target.closest(".modal");

    gsap.to(button, {
      scale: 5,
      duration: 0.5,
      ease: "back.out(2)",
      onStart: () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.5,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.set(button, {
              clearProps: "all",
            });
          },
        });
      },
    });

    buttonSounds.click.play();
    hideModal(modal);
  }

  button.addEventListener(
    "touchend",
    (e) => {
      touchHappened = true;
      handleModalExit(e);
    },
    { passive: false }
  );

  button.addEventListener(
    "click",
    (e) => {
      if (touchHappened) return;
      handleModalExit(e);
    },
    { passive: false }
  );
});

let isModalOpen = true;

const showModal = (modal) => {
  modal.style.display = "block";
  overlay.style.display = "block";

  isModalOpen = true;
  controls.enabled = false;

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }
  document.body.style.cursor = "default";
  currentIntersects = [];

  gsap.set(modal, {
    opacity: 0,
    scale: 0,
  });
  gsap.set(overlay, {
    opacity: 0,
  });

  gsap.to(overlay, {
    opacity: 1,
    duration: 0.5,
  });

  gsap.to(modal, {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    ease: "back.out(2)",
  });
};

const hideModal = (modal) => {
  isModalOpen = false;
  controls.enabled = true;

  if (modal === modals.work && window.location.hash.startsWith("#project/")) {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }

  gsap.to(overlay, {
    opacity: 0,
    duration: 0.5,
  });

  gsap.to(modal, {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    ease: "back.in(2)",
    onComplete: () => {
      modal.style.display = "none";
      overlay.style.display = "none";
    },
  });
};

/**  -------------------------- Dynamic Work Projects -------------------------- */
const workListView = document.querySelector(".work-list-view");
const workProjectGrid = document.querySelector(".work-project-grid");
const projectDetailView = document.querySelector(".project-detail-view");
const projectPage = document.querySelector(".project-page");
let lastProjectOpenAt = 0;
const modalScrollAreas = document.querySelectorAll(".modal-content-wrapper");
modalScrollAreas.forEach((area) => {
  ["touchstart", "touchmove", "wheel"].forEach((eventName) => {
    area.addEventListener(
      eventName,
      (event) => {
        event.stopPropagation();
      },
      { passive: true }
    );
  });
});

const projects = [
  {
    id: "eco-resource-b2b",
    title: "Eco-Resource B2B - Cloud-Native Platform",
    period: "Oct 2025 - Jun 2026",
    role: "Cloud / DevOps flagship project",
    priority: 1,
    featured: true,
    theme: "eco",
    image: "/captures-projets/captures-eco/WhatsApp%20Image%202026-05-24%20at%2023.32.02.jpeg",
    summary:
      "An end-to-end ESPRIT capstone project combining private cloud infrastructure, DevOps, observability and a circular-economy B2B platform.",
    description:
      "Eco-Resource B2B is a PI project developed at ESPRIT with my team AetherOps. The project connects cloud infrastructure, DevOps automation, intelligent monitoring and a sustainable B2B platform that helps companies exchange reusable industrial resources.",
    problem:
      "In Tunisia, existing recycling and reuse initiatives are mostly focused on households, e-waste, specific sectors or simple marketplaces. Industrial companies still lack a complete B2B digital platform for waste valorization, resource pooling, shared logistics, legal traceability and intelligent decision support.",
    solution:
      "We designed a cloud-native solution deployed across OpenStack, Kubernetes and Azure. The platform centralizes listings, stocks, reservations, deliveries, transactions, events and sustainability analytics for companies, transporters and administrators.",
    phases: [
      "Cloud infrastructure: OpenStack, KVM virtualization, virtual machines, distributed services and secure network configuration.",
      "Monitoring and intelligent infrastructure: Prometheus, Grafana, Kubernetes/system observability and AI-assisted anomaly detection for pods.",
      "Eco-Resource B2B platform: marketplace, material publication, buyer-seller matching, image classification, logistics coordination and QR traceability.",
      "Deployment and intelligent operations: GitLab CI/CD, frontend on Microsoft Azure, backend on Kubernetes hosted on OpenStack, Ngrok tunneling and incident troubleshooting.",
    ],
    platformFeatures: [
      "Company space: dashboard, marketplace, listings, requests, products, stocks, inventories, reservations, deliveries, complaints, transactions, reports and financial indicators.",
      "Transporter space: dashboard, trips, shipments, delivery notes and revenue tracking.",
      "Administrator space: users, listings, stocks, products, stock movements, deliveries, reservations, finances, events, solidarity actions and analytics tools.",
      "AI modules: recommendation system for buyer-seller matching, image-based material classification, damaged-product detection, surplus prediction and smart pricing ideas.",
      "Traceability and reporting: QR codes, sustainability reports, analytics dashboards, PDF/Excel export and environmental indicators aligned with circular-economy goals.",
    ],
    modules: [
      "Users and administration",
      "Events and B2B campaigns",
      "Stock and product management",
      "Deliveries and shipments",
      "Listings, posts and attachments",
      "Reservations, orders and allocations",
      "Finance, transactions and escrow",
      "Solidarity and associations",
      "Waste lots and auctions",
      "Feedback and continuous improvement",
    ],
    impact:
      "The project supports sustainable industrial innovation and contributes to SDGs 9, 12 and 13 by encouraging industrial resource reuse, better traceability and lower-waste operations.",
    highlights: [
      "Designed the global cloud architecture with OpenStack VMs, isolated networking, shared storage and Kubernetes nodes.",
      "Automated build, test and deployment workflows with GitLab CI/CD.",
      "Implemented monitoring and infrastructure visibility with Prometheus, Grafana, Kubernetes observability and intelligent anomaly detection.",
      "Built role-based Angular workflows for companies, transporters and administrators.",
      "Integrated AI recommendation, material classification, logistics coordination, QR-code traceability and sustainability reporting.",
    ],
    tags: ["OpenStack", "Kubernetes", "GitLab CI/CD", "Azure", "Prometheus", "Grafana", "Spring Boot", "Angular", "AI"],
    links: [
      { label: "Frontend GitHub", url: "https://github.com/ranym-eng/eco-ressource-b2b-frontend" },
      { label: "Backend GitHub", url: "https://github.com/ranym-eng/eco-ressource-b2b-backend" },
    ],
    media: [
      {
        type: "image",
        src: "/captures-projets/captures-eco/landingpage.jpeg",
        alt: "Eco-Resource landing home page",
        title: "Eco-Resource home page and value proposition",
        featured: true,
      },
      {
        type: "image",
        src: "/captures-projets/captures-eco/dash-openstack.png",
        alt: "OpenStack instances dashboard for Eco-Resource infrastructure",
        title: "OpenStack private cloud infrastructure",
      },
      {
        type: "image",
        src: "/captures-projets/captures-eco/k8S.png",
        alt: "Kubernetes pods and services terminal output",
        title: "Kubernetes backend deployment on OpenStack",
      },
      {
        type: "image",
        src: "/captures-projets/captures-eco/grafana.png",
        alt: "Grafana monitoring dashboard",
        title: "Grafana observability dashboard",
      },
      {
        type: "image",
        src: "/captures-projets/captures-eco/marketplace.jpeg",
        alt: "Eco-Resource marketplace interface",
        title: "B2B marketplace for reusable resources",
      },
      {
        type: "image",
        src: "/captures-projets/captures-eco/dashlivreur.jpeg",
        alt: "Transporter dashboard with delivery map",
        title: "Transporter logistics dashboard",
      },
      {
        type: "image",
        src: "/captures-projets/captures-eco/statistics.jpeg",
        alt: "Eco-Resource analytics and reporting dashboard",
        title: "Sustainability and operations analytics",
      },
      {
        type: "image",
        src: "/captures-projets/captures-eco/treasure&finance.jpeg",
        alt: "Treasury and finance dashboard",
        title: "Treasury and finance tracking",
      },
    ],
  },
  {
    id: "sagemcom-test-traces",
    title: "Test Trace Management Portal - Sagemcom",
    period: "Jan 2025 - Jun 2025",
    role: "Full-stack internship at Sagemcom",
    priority: 4,
    featured: true,
    image: "/captures-projets/captures-tracesagemcom/i_auth.png",
    summary:
      "A web portal for centralizing manufacturing test traces and helping quality teams analyze product reliability.",
    description:
      "This PFE project at Sagemcom focused on the design and development of a centralized web portal for managing test traces generated during the production of multi-energy smart meters.",
    problem:
      "Test data was dispersed and complex to consult, making quality analysis, traceability and production follow-up harder for the teams.",
    solution:
      "I built a full-stack portal with Angular, .NET Core, SQL Server and analytics dashboards to let users authenticate, consult traces, manage users, follow operations and visualize quality indicators in one place.",
    highlights: [
      "Centralized trace consultation with filters by serial number, operation and date range.",
      "Built secure authentication, user management and access workflows.",
      "Created dashboards for trace volume, operations, users and production-quality indicators.",
      "Structured the backend around .NET Core APIs connected to SQL Server.",
      "Used Scrum iterations to refine requirements and deliver the core workflows.",
    ],
    tags: ["Angular", ".NET Core", "SQL Server", "Power BI", "Scrum", "QA"],
    links: [
      { label: "Frontend GitHub", url: "https://github.com/ranym-eng/test-trace-management-frontend" },
      { label: "Backend GitHub", url: "https://github.com/ranym-eng/Web-based-test-logging-management-system" },
    ],
    media: [
      {
        type: "image",
        src: "/captures-projets/captures-tracesagemcom/i_auth.png",
        alt: "Sagemcom portal authentication screen",
        title: "Authentication entry point",
        featured: true,
      },
      {
        type: "image",
        src: "/captures-projets/captures-tracesagemcom/i_dash.png",
        alt: "Test trace dashboard with quality indicators",
        title: "Quality and trace analytics dashboard",
      },
      {
        type: "image",
        src: "/captures-projets/captures-tracesagemcom/i_consultertrace1.png",
        alt: "Trace consultation interface with filters",
        title: "Trace consultation and filtering",
      },
      {
        type: "image",
        src: "/captures-projets/captures-tracesagemcom/i_listeUser.png",
        alt: "User management interface",
        title: "User and access management",
      },
      {
        type: "image",
        src: "/captures-projets/captures-tracesagemcom/ui-consulter-notification1.png",
        alt: "Notification dropdown in the Sagemcom portal",
        title: "Operational notifications",
      },
      {
        type: "image",
        src: "/captures-projets/captures-tracesagemcom/UI-consulter-profil%20(2).png",
        alt: "User profile page",
        title: "Profile and account settings",
      },
    ],
  },
  
  {
    id: "cafe-management",
    title: "CafeConnect - Web and Mobile Cafe Management App",
    period: "Jul 2023 - Sep 2023",
    role: "Full-stack and mobile internship at BeeCoders",
    priority: 5,
    featured: true,
    image: "/captures-projets/captures-cafeconnect/login.png",
    summary:
      "A cafe operations app focused on products, categories, orders and billing.",
    description:
      "CafeConnect is a management platform for cafe teams, delivered with a web back office and a mobile experience connected to the same REST backend.",
    problem:
      "Small cafe teams need a simple way to centralize menus, orders and invoices without spreading daily work across disconnected tools.",
    solution:
      "I built the management workflow with Angular, Spring Boot and MySQL, then connected the client apps through REST APIs for consistent business data.",
    highlights: [
      "Managed product catalog, categories, customer orders and generated bills.",
      "Created a clean back-office flow with filtering and CRUD actions.",
      "Exposed REST APIs to keep web and mobile clients aligned.",
      "Delivered an operational tool for everyday cafe sales workflows.",
    ],
    tags: ["Angular", "Spring Boot", "Flutter", "MySQL", "REST API"],
    media: [
      {
        type: "image",
        src: "/captures-projets/captures-cafeconnect/login.png",
        alt: "CafeConnect login screen",
        title: "Branded authentication",
        caption: "Login flow with the cafe visual identity used as the project entry point.",
        featured: true,
        objectPosition: "center center",
      },
      {
        type: "image",
        src: "/captures-projets/captures-cafeconnect/gerer%20les%20commandes%20(1).png",
        alt: "CafeConnect manage orders screen",
        title: "Order management",
        caption: "Customer details, selected products, quantities and total amount in one workflow.",
      },
      {
        type: "image",
        src: "/captures-projets/captures-cafeconnect/gerer%20les%20produits.png",
        alt: "CafeConnect manage products screen",
        title: "Product catalog",
        caption: "Product list with category, description, price and edit/delete actions.",
      },
      {
        type: "image",
        src: "/captures-projets/captures-cafeconnect/g%C3%A9rer%20les%20categories.png",
        alt: "CafeConnect manage categories screen",
        title: "Categories",
        caption: "Simple category management for organizing the cafe menu.",
      },
      {
        type: "image",
        src: "/captures-projets/captures-cafeconnect/consulter%20factures.png",
        alt: "CafeConnect bills screen",
        title: "Billing follow-up",
        caption: "Invoice list with customer information, payment method and total.",
      },
    ],
  },
  {
    id: "heart-risk-prediction",
    title: "Heart Disease Risk Prediction System",
    period: "Sep 2025 - Dec 2025",
    role: "Machine learning academic project",
    priority: 3,
    featured: true,
    image: "/captures-projets/captures-ml-heartdisease/homepagedash.png",
    summary:
      "A Streamlit application demonstrating multiple machine-learning objectives for heart disease risk prediction.",
    description:
      "This academic machine-learning project presents an interactive Streamlit application for exploring heart disease risk prediction through classification, regression, multi-class classification and clustering workflows.",
    problem:
      "Heart-risk analysis can involve different business needs: identifying high-risk patients, estimating a continuous risk score, classifying risk levels and grouping similar patient profiles.",
    solution:
      "I built a Streamlit interface backed by trained scikit-learn models, saved preprocessing artifacts and visual outputs so users can test each prediction objective from a single dashboard.",
    highlights: [
      "BO1: binary classification to identify patients with high cardiac risk.",
      "BO2: regression model to estimate a continuous behavioral risk score from 0 to 100.",
      "BO3: multi-class classification for low, medium and high risk levels.",
      "BO4: clustering to group patients with similar medical profiles.",
      "Packaged trained models, scalers, selected features and cluster information for Streamlit inference.",
    ],
    tags: ["Python", "Streamlit", "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Clustering"],
    links: [
      { label: "GitHub", url: "https://github.com/ranym-eng/ML-heartdisease" },
      { label: "Live Demo", url: "https://ml-heartdisease-33xtbcsv2lig92i98ev6uw.streamlit.app/" },
      { label: "Demo Video", url: "https://youtu.be/z5nOB7gtSbg" },
    ],
    media: [
      {
        type: "image",
        src: "/captures-projets/captures-ml-heartdisease/homepagedash.png",
        alt: "Heart disease prediction Streamlit dashboard",
        title: "Streamlit dashboard overview",
        featured: true,
      },
      {
        type: "image",
        src: "/captures-projets/captures-ml-heartdisease/homedash.png",
        alt: "Business objectives and processing pipeline",
        title: "Business objectives and ML pipeline",
      },
      {
        type: "image",
        src: "/captures-projets/captures-ml-heartdisease/form-classification-binaire.png",
        alt: "Binary classification input form",
        title: "BO1 binary classification form",
      },
      {
        type: "image",
        src: "/captures-projets/captures-ml-heartdisease/classification_binaire.png",
        alt: "Binary classification prediction result",
        title: "BO1 high-risk prediction result",
      },
      {
        type: "image",
        src: "/captures-projets/captures-ml-heartdisease/form-score-continu.png",
        alt: "Continuous score input form",
        title: "BO2 continuous score form",
      },
      {
        type: "image",
        src: "/captures-projets/captures-ml-heartdisease/score-continu.png",
        alt: "Continuous risk score result",
        title: "BO2 behavioral risk score",
      },
      {
        type: "image",
        src: "/captures-projets/captures-ml-heartdisease/classification-multi-classe2.png",
        alt: "Multi-class risk classification result with feature importance",
        title: "BO3 multi-class risk level",
      },
      {
        type: "image",
        src: "/captures-projets/captures-ml-heartdisease/form-clustering.png",
        alt: "Clustering patient profile form",
        title: "BO4 clustering form",
      },
      {
        type: "image",
        src: "/captures-projets/captures-ml-heartdisease/clistering-stat.png",
        alt: "Cluster comparison chart",
        title: "BO4 similar patient clusters",
      },
    ],
  },
  {
    id: "gym-management",
    title: "Gymify - Web and Desktop Gym Management System",
    period: "Jan 2025 - May 2025",
    role: "Integration academic project",
    priority: 2,
    featured: true,
    image: "/captures-projets/captures-gymify-web/homepage-principale.png",
    summary:
      "A multi-role gym management system delivered as a Symfony web app and a JavaFX desktop app.",
    description:
      "Gymify is an academic project built at ESPRIT to simplify gym operations across multiple branches. It combines a Symfony web platform and a JavaFX desktop application connected to a centralized MySQL database.",
    problem:
      "Gym teams need to manage users, branches, activities, subscriptions, courses, events, products, payments, complaints and member interactions without splitting data across disconnected tools.",
    solution:
      "We built coordinated web and desktop interfaces for administrators, gym managers, coaches and athletes, with secure access, planning, marketplace, payments and external service integrations.",
    highlights: [
      "Built the web platform with Symfony, Twig, JavaScript and MySQL.",
      "Created the desktop application with JavaFX, FXML, CSS, Maven and MySQL.",
      "Implemented role-based workflows for administrators, gym managers, coaches and athletes.",
      "Integrated Stripe payments, Google Calendar, Google Auth, reCAPTCHA and weather services.",
      "Added AI-assisted features including a DeepInfra chatbot and recommendation-oriented modules.",
    ],
    tags: ["Symfony", "JavaFX", "MySQL", "Stripe", "Google Calendar", "DeepInfra", "JWT"],
    links: [
      { label: "Web GitHub", url: "https://github.com/ranym-eng/Gymify-symfony" },
      { label: "Desktop GitHub", url: "https://github.com/ranym-eng/Gymify-desktop" },
    ],
    media: [
      {
        type: "image",
        src: "/captures-projets/captures-gymify-web/homepage-principale.png",
        alt: "Gymify web homepage",
        title: "Web app homepage",
        featured: true,
      },
      {
        type: "image",
        src: "/captures-projets/captures-gymify-web/cours-dispo.png",
        alt: "Gymify available courses page",
        title: "Web courses and training sessions",
      },
      {
        type: "image",
        src: "/captures-projets/captures-gymify-web/calendriercours.png",
        alt: "Gymify course calendar",
        title: "Course calendar",
      },
      {
        type: "image",
        src: "/captures-projets/captures-gymify-web/marketplace.png",
        alt: "Gymify web marketplace",
        title: "Web marketplace",
      },
      {
        type: "image",
        src: "/captures-projets/captures-gymify-web/ai-chat.png",
        alt: "Gymify AI chat assistant",
        title: "AI chat assistant",
      },
      {
        type: "image",
        src: "/captures-projets/captures-gymify-web/blogs.png",
        alt: "Gymify web blogs interface",
        title: "Web community blogs",
      },
      {
        type: "image",
        src: "/captures-projets/captures-gymify-desktop/logindesktop.png",
        alt: "Gymify desktop login",
        title: "Desktop app login",
      },
      {
        type: "image",
        src: "/captures-projets/captures-gymify-desktop/gymify_accueilsportif.png",
        alt: "Gymify desktop member home",
        title: "Desktop member workspace",
      },
      {
        type: "image",
        src: "/captures-projets/captures-gymify-desktop/calendar.png",
        alt: "Gymify desktop planning calendar",
        title: "Desktop planning calendar",
      },
      {
        type: "image",
        src: "/captures-projets/captures-gymify-desktop/marketplace.png",
        alt: "Gymify desktop marketplace",
        title: "Desktop marketplace and cart",
      },
      {
        type: "image",
        src: "/captures-projets/captures-gymify-desktop/blogs.png",
        alt: "Gymify desktop blogs interface",
        title: "Desktop community blogs",
      },
    ],
  },
  {
    id: "restaurant-mobile-app",
    title: "Foodify - FlutterFlow Restaurant Mobile App",
    period: "Oct 2024 - Dec 2024",
    role: "Mobile academic project",
    priority: 6,
    featured: true,
    image: "/captures-projets/capture-mobile-restaurant/loginbyrole.jpg",
    summary:
      "A FlutterFlow mobile app for restaurant discovery, reservations, orders and business tracking.",
    description:
      "Foodify is a restaurant mobile experience built with FlutterFlow and Firebase. It supports multiple roles, customer restaurant discovery, food ordering, reservations and a business dashboard for restaurant activity.",
    problem:
      "Restaurant users need a simple mobile flow to discover places, reserve tables or order meals, while restaurant owners need a quick overview of revenue, orders and reservations.",
    solution:
      "I designed the app screens and navigation in FlutterFlow, connected the flows to Firebase and REST APIs, and structured the experience around user, business and delivery roles.",
    highlights: [
      "Created onboarding, authentication and role-based access screens.",
      "Built restaurant and dish browsing flows with search and categories.",
      "Added reservation and delivery entry points for simple users.",
      "Designed a business dashboard for revenue, orders and reservations.",
    ],
    tags: ["FlutterFlow", "Firebase", "REST API", "Mobile"],
    mediaFrame: "phone",
    links: [
      {
        label: "Live Demo",
        href: "https://projetmobile-cjdox1.flutterflow.app/",
      },
    ],
    media: [
      {
        type: "image",
        src: "/captures-projets/capture-mobile-restaurant/loginbyrole.jpg",
        alt: "Foodify role selection screen",
        title: "Role selection",
        caption: "Separate access paths for simple users, business users and delivery users.",
        featured: true,
        objectPosition: "center top",
      },
      {
        type: "image",
        src: "/captures-projets/capture-mobile-restaurant/login.jpg",
        alt: "Foodify login screen",
        title: "Authentication",
        caption: "Clean login screen with the Foodify identity and account access flow.",
        objectPosition: "center top",
      },
      {
        type: "image",
        src: "/captures-projets/capture-mobile-restaurant/listerestau.png",
        alt: "Foodify restaurant list screen",
        title: "Restaurant discovery",
        caption: "Customers browse restaurant categories and available places before reserving.",
        objectPosition: "center top",
      },
      {
        type: "image",
        src: "/captures-projets/capture-mobile-restaurant/listeplats.jpg",
        alt: "Foodify dishes list screen",
        title: "Dish browsing",
        caption: "Dish listing with search, meal categories and bottom navigation.",
        objectPosition: "center top",
      },
      {
        type: "image",
        src: "/captures-projets/capture-mobile-restaurant/user-reservororder.jpg",
        alt: "Foodify reservation or delivery screen",
        title: "Reservation and delivery",
        caption: "User entry point for booking a table or ordering food delivery.",
        objectPosition: "center top",
      },
      {
        type: "image",
        src: "/captures-projets/capture-mobile-restaurant/reservation-calendar.jpg",
        alt: "Foodify reservation calendar screen",
        title: "Reservation calendar",
        caption: "Calendar overview for tracking restaurant reservations.",
        objectPosition: "center top",
      },
      {
        type: "image",
        src: "/captures-projets/capture-mobile-restaurant/restau-business-dash.jpg",
        alt: "Foodify business dashboard screen",
        title: "Business dashboard",
        caption: "Restaurant owner dashboard with revenue, active orders and reservations.",
        objectPosition: "center top",
      },
    ],
  },
  {
    id: "safe-driving-car",
    title: "Safe Driving Car",
    period: "Sep 2023 - Apr 2024",
    role: "Data science mini project",
    priority: 9,
    featured: false,
    image: "/images/computer.webp",
    summary:
      "A data science and computer vision mini project focused on safe-driving analysis.",
    description:
      "Worked on a safe-driving analysis project using Python data science tools and OpenCV. The project explored visual/data processing workflows for detecting and understanding driving-related signals.",
    highlights: [
      "Processed data with Pandas and NumPy.",
      "Created analysis visuals with Matplotlib and Seaborn.",
      "Used OpenCV for computer vision experimentation.",
    ],
    tags: ["Python", "Pandas", "NumPy", "OpenCV", "Seaborn"],
    media: [
      { type: "image", src: "/images/computer.webp", alt: "Safe driving data science preview", title: "Safe Driving Car preview" },
    ],
  },
  {
    id: "myclublife",
    title: "MyClubLife",
    period: "Feb 2023 - May 2023",
    role: "Club management web app",
    priority: 7,
    featured: false,
    image: "/images/community.webp",
    summary:
      "A university club-life web app for discovering clubs, events, competitions and membership requests.",
    description:
      "MyClubLife is a university social-space web application that helps students discover clubs, explore events and competitions, join clubs and interact with club life through member and request workflows.",
    problem:
      "Student club information, events and membership requests can become difficult to follow when they are scattered across informal channels.",
    solution:
      "I built a structured Angular-based web experience connected to PHP/API and MySQL layers to centralize club discovery, event browsing, competitions and joining workflows.",
    highlights: [
      "Built club discovery pages and club-related navigation.",
      "Supported authentication, account creation and login flows.",
      "Added event and competition workflows for upcoming, ongoing and past activities.",
      "Handled join-club flows, member lists and request management.",
    ],
    tags: ["Angular", "PHP", "MySQL", "Bootstrap", "Angular Material"],
    links: [
      { label: "GitHub", url: "https://github.com/ranym-eng/my-club-life" },
    ],
    media: [
      { type: "image", src: "/images/community.webp", alt: "Club management web app preview", title: "MyClubLife preview" },
    ],
  },
  {
    id: "get-opportunity",
    title: "Get Opportunity",
    period: "Feb 2023 - Apr 2023",
    role: "Study abroad web platform",
    priority: 8,
    featured: false,
    image: "/captures-projets/generated/get-opportunity-anime.png",
    summary:
      "A study abroad web platform helping users discover and manage international opportunities.",
    description:
      "Built a web platform for study abroad opportunities with Angular, PHP and MySQL. The project focused on presenting opportunities clearly and supporting structured data management.",
    highlights: [
      "Developed the frontend experience with Angular.",
      "Built backend logic with PHP.",
      "Stored opportunity and user-related data in MySQL.",
    ],
    tags: ["Angular", "PHP", "MySQL", "Full-stack"],
    media: [
      {
        type: "image",
        src: "/captures-projets/generated/get-opportunity-anime.png",
        alt: "Anime-style Get Opportunity project preview",
        title: "Get Opportunity illustrated preview",
      },
    ],
  },
];

const createChipMarkup = (tags) =>
  tags.map((tag) => `<span class="project-chip">${tag}</span>`).join("");

const monthMap = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const getProjectEndDate = (period) => {
  const matches = [...period.matchAll(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/g)];
  const [, month, year] = matches.at(-1) || [];
  return new Date(Number(year || 0), monthMap[month] || 0, 1);
};

const getOrderedProjects = () =>
  [...projects].sort((a, b) => (a.priority || 99) - (b.priority || 99));

let siteLanguage = "en";

const siteCopy = {
  en: {
    languageLabel: "EN",
    workModalTitle: "~ My Work ~",
    workIntro: "Cloud, DevOps, full-stack and data projects from my internships and academic work.",
    aboutModalTitle: "About Me",
    aboutHeader: "Cloud Computing engineering student, DevOps-minded builder.",
    aboutP1:
      "Hi, I'm Ranym Mejri, a fourth-year Cloud Computing engineering student at ESPRIT. I like building reliable digital systems from the infrastructure layer up: private cloud, Kubernetes, CI/CD, observability, APIs and clean user-facing applications.",
    aboutP2:
      "Through internships at Sagemcom and BeeCoders, I worked on full-stack, IoT, QA dashboards and mobile applications. My recent projects focus on Cloud/DevOps: OpenStack, Kubernetes, GitLab CI/CD, Prometheus, Grafana, Zabbix and automated deployments.",
    aboutUpTo: "What I'm Up To:",
    aboutGoal:
      "Looking for a Cloud/DevOps internship where I can contribute to scalable, automated and well-monitored infrastructure.",
    aboutSkills:
      "Strengthening my skills in OpenStack, Kubernetes, Docker, Jenkins, Ansible, SonarQube, networking and security.",
    aboutAi:
      "Exploring AI and data projects with Python, Flask, XGBoost, Random Forest, K-Means, OpenCV and Power BI.",
    funFact: "Fun Fact:",
    funFactText: "The piano in this portfolio actually works! 🎹 Give it a try.",
    contactModalTitle: "Contact",
    contactHeader: "Open to opportunities, collaborations & tech discussions - let's connect",
    featuredTitle: "Featured Work",
    featuredText: "Six selected projects with the clearest product, engineering and portfolio signal.",
    otherTitle: "Other Projects",
    otherText: "Earlier academic and exploratory projects kept as supporting experience.",
    viewProject: "View project",
    projects: "Projects",
    overview: "Overview",
    problem: "Problem",
    solution: "Solution",
    impact: "Impact",
    storyLabel: "Project story",
    detailsLabel: "Project details",
    keyWork: "Key work",
    phasesTitle: "Project phases",
    phasesText: "From infrastructure setup to intelligent operations.",
    featuresTitle: "Platform features",
    featuresText: "The operational product layer behind the cloud infrastructure.",
    modulesTitle: "Functional modules",
  },
  fr: {
    languageLabel: "FR",
    workModalTitle: "~ Mes Projets ~",
    workIntro: "Projets Cloud, DevOps, full-stack et data réalisés pendant mes stages et travaux académiques.",
    aboutModalTitle: "À propos",
    aboutHeader: "Étudiante ingénieure en Cloud Computing, orientée DevOps.",
    aboutP1:
      "Je suis Ranym Mejri, étudiante en quatrième année Cloud Computing à ESPRIT. J'aime construire des systèmes fiables depuis l'infrastructure jusqu'à l'application: cloud privé, Kubernetes, CI/CD, observabilité, APIs et interfaces propres.",
    aboutP2:
      "Pendant mes stages chez Sagemcom et BeeCoders, j'ai travaillé sur des applications full-stack, IoT, dashboards QA et mobile. Mes projets récents se concentrent sur le Cloud/DevOps: OpenStack, Kubernetes, GitLab CI/CD, Prometheus, Grafana, Zabbix et déploiements automatisés.",
    aboutUpTo: "Ce que je vise:",
    aboutGoal:
      "Trouver un stage Cloud/DevOps où je peux contribuer à une infrastructure scalable, automatisée et bien supervisée.",
    aboutSkills:
      "Renforcer mes compétences en OpenStack, Kubernetes, Docker, Jenkins, Ansible, SonarQube, réseaux et sécurité.",
    aboutAi:
      "Explorer des projets IA et data avec Python, Flask, XGBoost, Random Forest, K-Means, OpenCV et Power BI.",
    funFact: "Fun Fact:",
    funFactText: "Le piano dans ce portfolio fonctionne vraiment ! 🎹 Essaie-le.",
    contactModalTitle: "Contact",
    contactHeader: "Ouverte aux opportunités, collaborations & discussions tech - connectons-nous !",
    featuredTitle: "Projets Phares",
    featuredText: "Six projets sélectionnés pour leur valeur produit, technique et portfolio.",
    otherTitle: "Autres Projets",
    otherText: "Projets académiques et exploratoires gardés comme expérience complémentaire.",
    viewProject: "Voir le projet",
    projects: "Projets",
    overview: "Vue d'ensemble",
    problem: "Problème",
    solution: "Solution",
    impact: "Impact",
    storyLabel: "Histoire du projet",
    detailsLabel: "Détails du projet",
    keyWork: "Travail réalisé",
    phasesTitle: "Phases du projet",
    phasesText: "De l'infrastructure aux opérations intelligentes.",
    featuresTitle: "Fonctionnalités",
    featuresText: "La couche produit opérationnelle derrière l'infrastructure cloud.",
    modulesTitle: "Modules fonctionnels",
  },
};

const t = (key) => siteCopy[siteLanguage]?.[key] || siteCopy.en[key] || key;

const renderProjectCard = (project) => `
  <article class="work-project ${project.featured ? "is-featured" : "is-secondary"}" role="button" tabindex="0" data-project-id="${project.id}" aria-label="Open ${project.title}">
    <div class="work-project-wrapper">
      <div class="work-image-wrapper">
        <img class="work-base-image" src="${project.image}" alt="${project.title}" />
      </div>
      <div class="work-card-body">
        <div class="work-card-kicker">${project.role}</div>
        <h2 class="work-card-title">${project.title}</h2>
        <p class="work-card-description">${project.summary}</p>
        <div class="work-card-meta">
          <span class="project-chip">${project.period}</span>
          ${createChipMarkup(project.tags.slice(0, project.featured ? 4 : 3))}
        </div>
        <span class="work-card-cue">
          ${t("viewProject")}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12H19M13 6L19 12L13 18" />
          </svg>
        </span>
      </div>
    </div>
  </article>
`;

const renderProjectCards = () => {
  if (!workProjectGrid) return;

  const orderedProjects = getOrderedProjects();
  const featuredProjects = orderedProjects.filter((project) => project.featured);
  const secondaryProjects = orderedProjects.filter((project) => !project.featured);

  workProjectGrid.innerHTML = `
    <section class="work-project-group" aria-label="Featured projects">
      <div class="work-section-heading">
        <div>
          <span>${t("featuredTitle")}</span>
          <p>${t("featuredText")}</p>
        </div>
      </div>
      <div class="work-featured-grid">
        ${featuredProjects.map(renderProjectCard).join("")}
      </div>
    </section>

    <section class="work-project-group" aria-label="Other projects">
      <div class="work-section-heading">
        <div>
          <span>${t("otherTitle")}</span>
          <p>${t("otherText")}</p>
        </div>
      </div>
      <div class="work-secondary-grid">
        ${secondaryProjects.map(renderProjectCard).join("")}
      </div>
    </section>
  `;

  workProjectGrid.querySelectorAll(".work-project").forEach((card) => {
    let startX = 0;
    let startY = 0;
    let hasMoved = false;
    let suppressNextClick = false;

    const openFromCard = () => {
      if (!card.dataset.projectId) return;
      openProject(card.dataset.projectId);
    };

    card.addEventListener(
      "pointerdown",
      (event) => {
        startX = event.clientX;
        startY = event.clientY;
        hasMoved = false;
      },
      { passive: true }
    );

    card.addEventListener(
      "pointermove",
      (event) => {
        if (
          Math.abs(event.clientX - startX) > 10 ||
          Math.abs(event.clientY - startY) > 10
        ) {
          hasMoved = true;
        }
      },
      { passive: true }
    );

    card.addEventListener("pointerup", (event) => {
      event.stopPropagation();
      if (event.pointerType === "touch") {
        suppressNextClick = true;
        window.setTimeout(() => {
          suppressNextClick = false;
        }, 350);

        if (hasMoved) return;
        event.preventDefault();
        openFromCard();
      }
    });

    card.addEventListener("click", (event) => {
      event.stopPropagation();
      if (suppressNextClick || hasMoved) {
        event.preventDefault();
        hasMoved = false;
        return;
      }
      openFromCard();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openFromCard();
    });
  });
};

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value) element.textContent = value;
};

const applySiteLanguage = () => {
  document.documentElement.lang = siteLanguage;
  setText(".language-toggle-current", t("languageLabel"));
  setText(".work .modal-title", t("workModalTitle"));
  setText(".work-intro", t("workIntro"));
  setText(".about .modal-title", t("aboutModalTitle"));
  setText(".about .modal-paragraph-header:nth-of-type(1)", t("aboutHeader"));
  const aboutParagraphs = document.querySelectorAll(".about .modal-paragraph-text");
  if (aboutParagraphs[0]) aboutParagraphs[0].textContent = t("aboutP1");
  if (aboutParagraphs[1]) aboutParagraphs[1].textContent = t("aboutP2");
  setText(".about .modal-paragraph-header:nth-of-type(2)", t("aboutUpTo"));
  const aboutListItems = document.querySelectorAll(".about .list-text");
  if (aboutListItems[0]) aboutListItems[0].textContent = t("aboutGoal");
  if (aboutListItems[1]) aboutListItems[1].textContent = t("aboutSkills");
  if (aboutListItems[2]) aboutListItems[2].textContent = t("aboutAi");
  setText(".about .modal-paragraph-header-2", t("funFact"));
  setText(".about .list-text-2", t("funFactText"));
  setText(".contact .modal-title", t("contactModalTitle"));
  setText(".contact .modal-paragraph-header", t("contactHeader"));

  renderProjectCards();
  if (projectPage?.classList.contains("is-active")) {
    const [, projectId] = window.location.hash.split("#project/");
    const activeProjectId = projectId || projectPage.querySelector(".project-page-shell")?.dataset.projectId;
    if (activeProjectId) openProject(activeProjectId, false);
  }
};

const renderProjectMediaCarousel = (project) => {
  const mediaItems = project.media?.length
    ? project.media
    : [{ type: "image", src: project.image, alt: project.title, title: project.title }];
  const isPhoneFrame = project.mediaFrame === "phone";

  const slides = mediaItems
    .map((item, index) => {
      const media =
        item.type === "video"
          ? `<video src="${item.src}" muted loop playsinline controls aria-label="${item.alt}"></video>`
          : `<img src="${item.src}" alt="${item.alt}" />`;
      const mediaMarkup = isPhoneFrame
        ? `
          <div class="project-phone-frame">
            <span class="project-phone-speaker"></span>
            <div class="project-phone-screen">${media}</div>
          </div>
        `
        : media;

      return `
        <figure class="project-media-slide ${index === 0 ? "is-active" : ""}" data-media-index="${index}">
          ${mediaMarkup}
          <figcaption>${item.title || item.alt || project.title}</figcaption>
        </figure>
      `;
    })
    .join("");

  const thumbnails = mediaItems
    .map(
      (item, index) => `
        <button class="project-media-thumb ${index === 0 ? "is-active" : ""}" type="button" data-media-index="${index}" aria-label="Show media ${index + 1}">
          <img src="${item.type === "video" ? project.image : item.src}" alt="" />
          <span>${String(index + 1).padStart(2, "0")}</span>
        </button>
      `
    )
    .join("");

  return `
    <section class="project-media-carousel ${isPhoneFrame ? "project-media-carousel--phone" : ""}" aria-label="${project.title} media carousel">
      <div class="project-media-stage">
        ${slides}
        <div class="project-media-controls">
          <button class="project-media-control" type="button" data-carousel-action="prev" aria-label="Previous media">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg>
          </button>
          <button class="project-media-control" type="button" data-carousel-action="next" aria-label="Next media">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6L15 12L9 18" /></svg>
          </button>
        </div>
      </div>
      <div class="project-media-thumbs">${thumbnails}</div>
    </section>
  `;
};

const setupProjectCarousel = () => {
  if (!projectPage) return;

  const carousel = projectPage.querySelector(".project-media-carousel");
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll(".project-media-slide")];
  const thumbs = [...carousel.querySelectorAll(".project-media-thumb")];
  if (!slides.length) return;

  let activeIndex = 0;
  let autoplayTimer;
  const autoplayDelay = 4200;

  const setActiveMedia = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.querySelectorAll("video").forEach((video) => {
        if (!isActive) video.pause();
      });
    });

    thumbs.forEach((thumb, index) => {
      thumb.classList.toggle("is-active", index === activeIndex);
    });
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayTimer);
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (slides.length < 2) return;
    autoplayTimer = window.setInterval(() => setActiveMedia(activeIndex + 1), autoplayDelay);
  };

  const restartAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  carousel.querySelectorAll("[data-carousel-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.carouselAction === "next" ? 1 : -1;
      setActiveMedia(activeIndex + direction);
      restartAutoplay();
    });
  });

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      setActiveMedia(Number(thumb.dataset.mediaIndex));
      restartAutoplay();
    });
  });

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", startAutoplay);
  startAutoplay();
};

const renderProjectListSection = (title, items, className = "") => {
  if (!items?.length) return "";

  return `
    <section class="project-page-section ${className}">
      <h2>${title}</h2>
      <ul class="project-detail-list">
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </section>
  `;
};

const renderProjectTextSection = (title, text, className = "") => {
  if (!text) return "";

  return `
    <section class="project-page-section ${className}">
      <h2>${title}</h2>
      <p>${text}</p>
    </section>
  `;
};

const renderProjectInsight = (title, text) => `
  <article class="project-insight">
    <h2>${title}</h2>
    <p>${text}</p>
  </article>
`;

const splitProjectPoint = (item) => {
  const [title, ...rest] = item.split(":");
  return {
    title: rest.length ? title.trim() : item,
    body: rest.length ? rest.join(":").trim() : "",
  };
};

const renderProjectTimeline = (items) => {
  if (!items?.length) return "";

  return `
    <section class="project-experience-section project-timeline-section" aria-label="${t("phasesTitle")}">
      <div class="project-section-heading">
        <span>${t("phasesTitle")}</span>
        <p>${t("phasesText")}</p>
      </div>
      <div class="project-timeline">
        ${items
          .map((item, index) => {
            const point = splitProjectPoint(item);
            return `
              <article class="project-timeline-item">
                <span>${String(index + 1).padStart(2, "0")}</span>
                <h3>${point.title}</h3>
                ${point.body ? `<p>${point.body}</p>` : ""}
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
};

const renderProjectFeatureCards = (items) => {
  if (!items?.length) return "";

  return `
    <section class="project-experience-section project-feature-section" aria-label="${t("featuresTitle")}">
      <div class="project-section-heading">
        <span>${t("featuresTitle")}</span>
        <p>${t("featuresText")}</p>
      </div>
      <div class="project-feature-grid">
        ${items
          .map((item) => {
            const point = splitProjectPoint(item);
            return `
              <article class="project-feature-card">
                <h3>${point.title}</h3>
                ${point.body ? `<p>${point.body}</p>` : ""}
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
};

const renderProjectDetails = (title, items, isOpen = false) => {
  if (!items?.length) return "";

  return `
    <details class="project-detail-disclosure" ${isOpen ? "open" : ""}>
      <summary>
        <span>${title}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9L12 15L18 9" /></svg>
      </summary>
      <ul class="project-detail-list">
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </details>
  `;
};

const renderProjectModuleCloud = (items) => {
  if (!items?.length) return "";

  return `
    <section class="project-module-cloud" aria-label="${t("modulesTitle")}">
      <h2>${t("modulesTitle")}</h2>
      <div>
        ${items.map((item) => `<span class="project-module-chip">${item}</span>`).join("")}
      </div>
    </section>
  `;
};

const renderProjectLinks = (links) => {
  if (!links?.length) return "";

  return `
    <div class="project-link-row">
      ${links
        .map((link) => {
          const href = link.href || link.url || "#";
          return `
            <a class="project-link-button" href="${href}" target="_blank" rel="noopener noreferrer">
              ${link.label}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 17L17 7" />
                <path d="M9 7H17V15" />
              </svg>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
};

const showProjectList = () => {
  if (!workListView || !projectDetailView) return;

  hideProjectPage(false);
  workListView.classList.remove("is-hidden");
  projectDetailView.classList.remove("is-active");
  projectDetailView.innerHTML = "";

  if (window.location.hash.startsWith("#project/")) {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }

  gsap.fromTo(
    ".work-project",
    { opacity: 0, y: 24, rotate: -1 },
    { opacity: 1, y: 0, rotate: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" }
  );
};

const openProject = (projectId, shouldUpdateHash = true) => {
  const project = projects.find((item) => item.id === projectId);
  if (!project || !projectPage) return;

  if (shouldUpdateHash) {
    history.pushState(
      "",
      document.title,
      `${window.location.pathname}${window.location.search}#project/${project.id}`
    );
  }

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.style.display = "none";
  });
  overlay.style.display = "none";
  overlay.style.opacity = 0;
  isModalOpen = true;
  controls.enabled = false;
  const projectInsights = [
    { title: t("overview"), text: project.description },
    { title: t("problem"), text: project.problem || project.summary },
    { title: t("solution"), text: project.solution || project.description },
    project.impact ? { title: t("impact"), text: project.impact } : null,
  ].filter(Boolean);

  projectPage.innerHTML = `
    <div class="project-page-shell project-theme-${project.theme || "default"}" data-project-id="${project.id}">
      <nav class="project-page-nav" aria-label="Project navigation">
        <button class="project-page-back" type="button" aria-label="Back to project list">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6L9 12L15 18" />
            <path d="M10 12H21" />
          </svg>
          <span>${t("projects")}</span>
        </button>
        <span class="project-page-current">${String(project.priority || 1).padStart(2, "0")}</span>
      </nav>

      <header class="project-page-hero">
        <div class="project-page-copy">
          <div class="project-detail-meta">
            <span class="project-chip">${project.period}</span>
            <span class="project-chip">${project.role}</span>
          </div>
          <h1 class="project-page-title">${project.title}</h1>
          <p class="project-page-summary">${project.summary}</p>
          <div class="project-detail-meta">${createChipMarkup(project.tags)}</div>
          ${renderProjectLinks(project.links)}
        </div>
        ${renderProjectMediaCarousel(project)}
      </header>

      <section class="project-insight-grid" style="--insight-count: ${projectInsights.length}" aria-label="${t("storyLabel")}">
        ${projectInsights.map((item) => renderProjectInsight(item.title, item.text)).join("")}
      </section>

      <section class="project-detail-stack" aria-label="${t("detailsLabel")}">
        ${renderProjectDetails(t("keyWork"), project.highlights, true)}
      </section>

      ${renderProjectTimeline(project.phases)}
      ${renderProjectFeatureCards(project.platformFeatures)}
      ${renderProjectModuleCloud(project.modules)}
    </div>
  `;

  projectPage.setAttribute("aria-hidden", "false");
  projectPage.classList.add("is-active");
  document.body.classList.add("project-page-open");

  projectPage
    .querySelector(".project-page-back")
    .addEventListener("click", returnToProjectList);
  setupProjectCarousel();

  gsap.fromTo(
    ".project-page-shell > *",
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
  );
};

const hideProjectPage = (shouldClearHash = true) => {
  if (!projectPage) return;

  projectPage.classList.remove("is-active");
  projectPage.setAttribute("aria-hidden", "true");
  projectPage.innerHTML = "";
  document.body.classList.remove("project-page-open");
  isModalOpen = false;
  controls.enabled = true;

  if (shouldClearHash && window.location.hash.startsWith("#project/")) {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }
};

const returnToProjectList = () => {
  hideProjectPage(true);
  showProjectList();
  showModal(modals.work);
};

const openProjectFromHash = () => {
  const [, projectId] = window.location.hash.split("#project/");
  if (!projectId) return;

  openProject(projectId, false);
};

applySiteLanguage();

window.addEventListener("hashchange", openProjectFromHash);
window.addEventListener("popstate", () => {
  if (window.location.hash.startsWith("#project/")) {
    openProjectFromHash();
  } else {
    hideProjectPage(false);
  }
});

if (window.location.hash.startsWith("#project/")) {
  openProjectFromHash();
}

/**  -------------------------- Loading Screen & Intro Animation -------------------------- */

const manager = new THREE.LoadingManager();

const loadingScreen = document.querySelector(".loading-screen");
const loadingScreenButton = document.querySelector(".loading-screen-button");
const noSoundButton = document.querySelector(".no-sound-button");

manager.onLoad = function () {
  loadingScreenButton.style.border = "8px solid #8a6f5a";
  loadingScreenButton.style.background = "#5a4a3f";
  loadingScreenButton.style.color = "#fff6ee";
  loadingScreenButton.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";
  loadingScreenButton.textContent = "Enter!";
  loadingScreenButton.style.cursor = "pointer";
  loadingScreenButton.style.transition =
    "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
  let isDisabled = false;

  noSoundButton.textContent = "Enter without Sound :(";

  function handleEnter(withSound = true) {
    if (isDisabled) return;

    noSoundButton.textContent = "";
    loadingScreenButton.style.cursor = "default";
    loadingScreenButton.style.border = "8px solid #b89f87";
    loadingScreenButton.style.background = "#f6efe7";
    loadingScreenButton.style.color = "#8a6f5a";
    loadingScreenButton.style.boxShadow = "none";
    loadingScreenButton.textContent = "~ Welcome to my portfolio~";
    loadingScreen.style.background = "#f6efe7";
    isDisabled = true;

    toggleFavicons();

    if (!withSound) {
      isMuted = true;
      updateMuteState(true);

      soundOnSvg.style.display = "none";
      soundOffSvg.style.display = "block";
    } else {
      backgroundMusic.play();
    }

    playReveal();
  }

  loadingScreenButton.addEventListener("mouseenter", () => {
    loadingScreenButton.style.transform = "scale(1.3)";
  });

  loadingScreenButton.addEventListener("touchend", (e) => {
    touchHappened = true;
    e.preventDefault();
    handleEnter();
  });

  loadingScreenButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter(true);
  });

  loadingScreenButton.addEventListener("mouseleave", () => {
    loadingScreenButton.style.transform = "none";
  });

  noSoundButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter(false);
  });
};

function playReveal() {
  const tl = gsap.timeline();

  tl.to(loadingScreen, {
    scale: 0.5,
    duration: 1.2,
    delay: 0.25,
    ease: "back.in(1.8)",
  }).to(
    loadingScreen,
    {
      y: "200vh",
      transform: "perspective(1000px) rotateX(45deg) rotateY(-35deg)",
      duration: 1.2,
      ease: "back.in(1.8)",
      onComplete: () => {
        isModalOpen = false;
        playIntroAnimation();
        loadingScreen.remove();
      },
    },
    "-=0.1"
  );
}

function playIntroAnimation() {
  const t1 = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  t1.timeScale(0.8);

  t1.to(plank1.scale, {
    x: 1,
    y: 1,
  })
    .to(
      plank2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      workBtn.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    )
    .to(
      aboutBtn.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    )
    .to(
      contactBtn.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    );

  const tFrames = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFrames.timeScale(0.8);

  tFrames
    .to(frame1.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      frame2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      frame3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const t2 = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  t2.timeScale(0.8);

  t2.to(boba.scale, {
    z: 1,
    y: 1,
    x: 1,
    delay: 0.4,
  })
    .to(
      github.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      youtube.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    )
    .to(
      twitter.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    );

  const tFlowers = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFlowers.timeScale(0.8);

  tFlowers
    .to(flower5.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      flower4.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      flower3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      flower2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      flower1.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tBoxes = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tBoxes.timeScale(0.8);

  tBoxes
    .to(box1.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      box2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      box3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tLamp = gsap.timeline({
    defaults: {
      duration: 0.8,
      delay: 0.2,
      ease: "back.out(1.8)",
    },
  });
  tLamp.timeScale(0.8);

  tLamp.to(lamp.scale, {
    x: 1,
    y: 1,
    z: 1,
  });

  const tSlippers = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tSlippers.timeScale(0.8);

  tSlippers
    .to(slippers1.scale, {
      x: 1,
      y: 1,
      z: 1,
      delay: 0.5,
    })
    .to(
      slippers2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tEggs = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tEggs.timeScale(0.8);

  tEggs
    .to(egg1.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      egg2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      egg3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tFish = gsap.timeline({
    defaults: {
      delay: 0.8,
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFish.timeScale(0.8);

  tFish.to(fish.scale, {
    x: 1,
    y: 1,
    z: 1,
  });

  const lettersTl = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.7)",
    },
  });
  lettersTl.timeScale(0.8);

  lettersTl
    .to(nameLogo.position, {
      y: nameLogo.userData.initialPosition.y + 0.3,
      duration: 0.4,
      ease: "back.out(1.8)",
      delay: 0.25,
    })
    .to(
      nameLogo.scale,
      {
        x: nameLogo.userData.initialScale.x,
        y: nameLogo.userData.initialScale.y,
        z: nameLogo.userData.initialScale.z,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      nameLogo.position,
      {
        y: nameLogo.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    );

  const pianoKeysTl = gsap.timeline({
    defaults: {
      duration: 0.4,
      ease: "back.out(1.7)",
      onComplete: () => {
        setTimeout(() => {
          createDelayedHitboxes();
        }, 1950);
      },
    },
  });
  pianoKeysTl.timeScale(1.2);

  const pianoKeys = [
    C1_Key,
    Cs1_Key,
    D1_Key,
    Ds1_Key,
    E1_Key,
    F1_Key,
    Fs1_Key,
    G1_Key,
    Gs1_Key,
    A1_Key,
    As1_Key,
    B1_Key,
    C2_Key,
    Cs2_Key,
    D2_Key,
    Ds2_Key,
    E2_Key,
    F2_Key,
    Fs2_Key,
    G2_Key,
    Gs2_Key,
    A2_Key,
    As2_Key,
    B2_Key,
  ];

  pianoKeys.forEach((key, index) => {
    pianoKeysTl
      .to(
        key.position,
        {
          y: key.userData.initialPosition.y + 0.2,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        index * 0.1
      )
      .to(
        key.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        "<"
      )
      .to(
        key.position,
        {
          y: key.userData.initialPosition.y,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        ">-0.2"
      );
  });
}

/**  -------------------------- Loaders & Texture Preparations -------------------------- */
const textureLoader = new THREE.TextureLoader();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const loader = new GLTFLoader(manager);
loader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
  .setPath("textures/skybox/")
  .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);

const textureMap = {
  First: {
    day: "/textures/room/day/first_texture_set_day.webp",
    night: "/textures/room/night/first_texture_set_night.webp",
  },
  Second: {
    day: "/textures/room/day/second_texture_set_day.webp",
    night: "/textures/room/night/second_texture_set_night.webp",
  },
  Third: {
    day: "/textures/room/day/third_texture_set_day.webp",
    night: "/textures/room/night/third_texture_set_night.webp",
  },
  Fourth: {
    day: "/textures/room/day/fourth_texture_set_day.webp",
    night: "/textures/room/night/fourth_texture_set_night.webp",
  },
};

const loadedTextures = {
  day: {},
  night: {},
};

Object.entries(textureMap).forEach(([key, paths]) => {
  // Load and configure day texture
  const dayTexture = textureLoader.load(paths.day);
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  dayTexture.minFilter = THREE.LinearFilter;
  dayTexture.magFilter = THREE.LinearFilter;
  loadedTextures.day[key] = dayTexture;

  // Load and configure night texture
  const nightTexture = textureLoader.load(paths.night);
  nightTexture.flipY = false;
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  nightTexture.minFilter = THREE.LinearFilter;
  nightTexture.magFilter = THREE.LinearFilter;
  loadedTextures.night[key] = nightTexture;
});

// Reuseable Materials
const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  opacity: 1,
  color: 0xfff6ee,
  metalness: 0,
  roughness: 0,
  ior: 3,
  thickness: 0.01,
  specularIntensity: 1,
  envMap: environmentMap,
  envMapIntensity: 1,
  depthWrite: false,
  specularColor: 0xfff6ee,
});

const whiteMaterial = new THREE.MeshBasicMaterial({
  color: 0xfff6ee,
});

const nameFont = new FontLoader().parse(helvetikerBoldFont);
const nameLogoMaterial = new THREE.MeshBasicMaterial({
  color: 0x8a6f5a,
});

const createMaterialForTextureSet = (textureSet) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uDayTexture1: { value: loadedTextures.day.First },
      uNightTexture1: { value: loadedTextures.night.First },
      uDayTexture2: { value: loadedTextures.day.Second },
      uNightTexture2: { value: loadedTextures.night.Second },
      uDayTexture3: { value: loadedTextures.day.Third },
      uNightTexture3: { value: loadedTextures.night.Third },
      uDayTexture4: { value: loadedTextures.day.Fourth },
      uNightTexture4: { value: loadedTextures.night.Fourth },
      uMixRatio: { value: 0 },
      uTextureSet: { value: textureSet },
    },
    vertexShader: themeVertexShader,
    fragmentShader: themeFragmentShader,
  });

  Object.entries(material.uniforms).forEach(([key, uniform]) => {
    if (uniform.value instanceof THREE.Texture) {
      uniform.value.minFilter = THREE.LinearFilter;
      uniform.value.magFilter = THREE.LinearFilter;
    }
  });

  return material;
};

const roomMaterials = {
  First: createMaterialForTextureSet(1),
  Second: createMaterialForTextureSet(2),
  Third: createMaterialForTextureSet(3),
  Fourth: createMaterialForTextureSet(4),
};

// Smoke Shader setup
const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
smokeGeometry.translate(0, 0.5, 0);
smokeGeometry.scale(0.33, 1, 0.33);

const perlinTexture = textureLoader.load("/shaders/perlin.png");
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;

const smokeMaterial = new THREE.ShaderMaterial({
  vertexShader: smokeVertexShader,
  fragmentShader: smokeFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uPerlinTexture: new THREE.Uniform(perlinTexture),
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
});

const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
smoke.position.y = 1.83;
scene.add(smoke);

const videoElement = document.createElement("video");
videoElement.src = "/textures/video/Screen.mp4";
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.autoplay = true;
videoElement.play();

const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.flipY = false;

/**  -------------------------- Model and Mesh Setup -------------------------- */

// LOL DO NOT DO THIS USE A FUNCTION TO AUTOMATE THIS PROCESS HAHAHAAHAHAHAHAHAHA
let fish;
let coffeePosition;
let hourHand;
let minuteHand;
let chairTop;
const xAxisFans = [];
const yAxisFans = [];
let plank1,
  plank2,
  workBtn,
  aboutBtn,
  contactBtn,
  boba,
  github,
  youtube,
  twitter;

let letter1, letter2, letter3, letter4, letter5, letter6, letter7, letter8;
let nameLogo;
const nameLetterMeshes = [];

function createNameLogoFromLetters() {
  if (!nameLetterMeshes.length || nameLogo) return;

  const originalLettersBox = new THREE.Box3();

  nameLetterMeshes.forEach((letter) => {
    letter.scale.copy(letter.userData.nameOriginalScale);
    letter.updateWorldMatrix(true, false);
    originalLettersBox.expandByObject(letter);
    letter.visible = false;
    letter.scale.set(0, 0, 0);
  });

  const originalLettersSize = originalLettersBox.getSize(new THREE.Vector3());
  const originalLettersCenter = originalLettersBox.getCenter(new THREE.Vector3());

  const nameGeometry = new TextGeometry("Ranym Mejri", {
    font: nameFont,
    size: 1,
    depth: 0.12,
    curveSegments: 8,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });

  nameGeometry.computeBoundingBox();
  const nameBox = nameGeometry.boundingBox;
  const nameSize = nameBox.getSize(new THREE.Vector3());
  const nameCenter = nameBox.getCenter(new THREE.Vector3());
  nameGeometry.translate(-nameCenter.x, -nameCenter.y, -nameCenter.z);

  nameLogo = new THREE.Mesh(nameGeometry, nameLogoMaterial);
  const scaleToFit = Math.min(
    originalLettersSize.x / nameSize.x,
    originalLettersSize.y / nameSize.y
  );

  nameLogo.name = "Name_Logo_Ranym_Mejri";
  nameLogo.position.copy(originalLettersCenter);
  nameLogo.rotation.copy(nameLetterMeshes[0].rotation);
  nameLogo.scale.setScalar(scaleToFit * 0.96);
  nameLogo.userData.initialPosition = nameLogo.position.clone();
  nameLogo.userData.initialScale = nameLogo.scale.clone();
  nameLogo.scale.set(0, 0, 0);

  nameLetterMeshes[0].parent.add(nameLogo);
}

function registerNameLetter(child) {
  nameLetterMeshes.push(child);
  child.userData.nameOriginalScale = child.scale.clone();
  child.userData.initialPosition ??= child.position.clone();
  child.userData.initialScale ??= child.scale.clone();
  child.scale.set(0, 0, 0);
}

let C1_Key,
  Cs1_Key,
  D1_Key,
  Ds1_Key,
  E1_Key,
  F1_Key,
  Fs1_Key,
  G1_Key,
  Gs1_Key,
  A1_Key,
  As1_Key,
  B1_Key;
let C2_Key,
  Cs2_Key,
  D2_Key,
  Ds2_Key,
  E2_Key,
  F2_Key,
  Fs2_Key,
  G2_Key,
  Gs2_Key,
  A2_Key,
  As2_Key,
  B2_Key;

let flower1, flower2, flower3, flower4, flower5;

let box1, box2, box3;

let lamp;

let slippers1, slippers2;

let egg1, egg2, egg3;

let frame1, frame2, frame3;

const useOriginalMeshObjects = ["Bulb", "Cactus", "Kirby"];

const objectsNeedingHitboxes = [];

const objectsWithIntroAnimations = [
  "Hanging_Plank_1",
  "Hanging_Plank_2",
  "My_Work_Button",
  "About_Button",
  "Contact_Button",
  "Boba",
  "GitHub",
  "YouTube",
  "Twitter",
  "Name_Letter_1",
  "Name_Letter_2",
  "Name_Letter_3",
  "Name_Letter_4",
  "Name_Letter_5",
  "Name_Letter_6",
  "Name_Letter_7",
  "Name_Letter_8",
  "Flower_1",
  "Flower_2",
  "Flower_3",
  "Flower_4",
  "Flower_5",
  "Box_1",
  "Box_2",
  "Box_3",
  "Lamp",
  "Slipper_1",
  "Slipper_2",
  "Fish_Fourth",
  "Egg_1",
  "Egg_2",
  "Egg_3",
  "Frame_1",
  "Frame_2",
  "Frame_3",
  "C1_Key",
  "C#1_Key",
  "D1_Key",
  "D#1_Key",
  "E1_Key",
  "F1_Key",
  "F#1_Key",
  "G1_Key",
  "G#1_Key",
  "A1_Key",
  "A#1_Key",
  "B1_Key",
  "C2_Key",
  "C#2_Key",
  "D2_Key",
  "D#2_Key",
  "E2_Key",
  "F2_Key",
  "F#2_Key",
  "G2_Key",
  "G#2_Key",
  "A2_Key",
  "A#2_Key",
  "B2_Key",
];

function hasIntroAnimation(objectName) {
  return objectsWithIntroAnimations.some((animatedName) =>
    objectName.includes(animatedName)
  );
}

loader.load("/models/Room_Portfolio.glb", (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      if (child.name.includes("Fish_Fourth")) {
        fish = child;
        child.position.x += 0.04;
        child.position.z -= 0.03;
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
      }
      if (child.name.includes("Chair_Top")) {
        chairTop = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Hour_Hand")) {
        hourHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Minute_Hand")) {
        minuteHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Coffee")) {
        coffeePosition = child.position.clone();
      }

      if (child.name.includes("Hover") || child.name.includes("Key")) {
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      // LOL DO NOT DO THIS USE A FUNCTION TO AUTOMATE THIS PROCESS HAHAHAAHAHAHAHAHAHA
      if (child.name.includes("Hanging_Plank_1")) {
        plank1 = child;
        child.scale.set(0, 0, 1);
      } else if (child.name.includes("Hanging_Plank_2")) {
        plank2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("My_Work_Button")) {
        workBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("About_Button")) {
        aboutBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Contact_Button")) {
        contactBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Boba")) {
        boba = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("GitHub")) {
        github = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("YouTube")) {
        youtube = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Twitter")) {
        twitter = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_1")) {
        letter1 = child;
        registerNameLetter(child);
      } else if (child.name.includes("Name_Letter_2")) {
        letter2 = child;
        registerNameLetter(child);
      } else if (child.name.includes("Name_Letter_3")) {
        letter3 = child;
        registerNameLetter(child);
      } else if (child.name.includes("Name_Letter_4")) {
        letter4 = child;
        registerNameLetter(child);
      } else if (child.name.includes("Name_Letter_5")) {
        letter5 = child;
        registerNameLetter(child);
      } else if (child.name.includes("Name_Letter_6")) {
        letter6 = child;
        registerNameLetter(child);
      } else if (child.name.includes("Name_Letter_7")) {
        letter7 = child;
        registerNameLetter(child);
      } else if (child.name.includes("Name_Letter_8")) {
        letter8 = child;
        registerNameLetter(child);
      } else if (child.name.includes("Flower_1")) {
        flower1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_2")) {
        flower2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_3")) {
        flower3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_4")) {
        flower4 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_5")) {
        flower5 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Box_1")) {
        box1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Box_2")) {
        box2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Box_3")) {
        box3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lamp")) {
        lamp = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Slipper_1")) {
        slippers1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Slipper_2")) {
        slippers2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Fish_Fourth")) {
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Egg_1")) {
        egg1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Egg_2")) {
        egg2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Egg_3")) {
        egg3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Frame_1")) {
        frame1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Frame_2")) {
        frame2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Frame_3")) {
        frame3 = child;
        child.scale.set(0, 0, 0);
      }
      Object.keys(pianoKeyMap).forEach((keyName) => {
        if (child.name.includes(keyName)) {
          const varName = keyName.replace("#", "s").split("_")[0] + "_Key";
          eval(`${varName} = child`);
          child.scale.set(0, 0, 0);
          child.userData.initialPosition = new THREE.Vector3().copy(
            child.position
          );
        }
      });

      if (child.name.includes("Water")) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0xb89f87,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        });
      } else if (child.name.includes("Glass")) {
        child.material = glassMaterial;
      } else if (child.name.includes("Bubble")) {
        child.material = whiteMaterial;
      } else if (child.name.includes("Screen")) {
        child.material = new THREE.MeshBasicMaterial({
          map: videoTexture,
          transparent: true,
          opacity: 0.9,
        });
      } else {
        Object.keys(textureMap).forEach((key) => {
          if (child.name.includes(key)) {
            child.material = roomMaterials[key];

            if (child.name.includes("Fan")) {
              if (
                child.name.includes("Fan_2") ||
                child.name.includes("Fan_4")
              ) {
                xAxisFans.push(child);
              } else {
                yAxisFans.push(child);
              }
            }
          }
        });
      }

      if (child.name.includes("Raycaster")) {
        if (hasIntroAnimation(child.name)) {
          // Create a hitbox for object after intro is done playing,
          // Set an original scale first for the hitbox
          child.userData.originalScale = new THREE.Vector3(1, 1, 1);

          objectsNeedingHitboxes.push(child);
        } else {
          // Create immediate hitboxes/meshes for objects that DON'T have an intro animation
          const raycastObject = createStaticHitbox(child);

          if (raycastObject !== child) {
            scene.add(raycastObject);
          }

          raycasterObjects.push(raycastObject);
          hitboxToObjectMap.set(raycastObject, child);
        }
      }
    }
  });

  createNameLogoFromLetters();

  if (coffeePosition) {
    smoke.position.set(
      coffeePosition.x,
      coffeePosition.y + 0.2,
      coffeePosition.z
    );
  }

  scene.add(glb.scene);
});

/**  -------------------------- Raycaster setup -------------------------- */

const raycasterObjects = [];
let currentIntersects = [];
let currentHoveredObject = null;

const socialLinks = {
  GitHub: "https://github.com/ranym-eng",
  Email: "mailto:ranymmejri1@gmail.com",
  Drive: "https://drive.google.com/drive/folders/1Ykx7ijFy4EgwxDbcY_-o4ql2ToqQu378",
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const hitboxToObjectMap = new Map();

function shouldUseOriginalMesh(objectName) {
  return useOriginalMeshObjects.some((meshName) =>
    objectName.includes(meshName)
  );
}

function createStaticHitbox(originalObject) {
  // Check if we should use original mesh
  if (shouldUseOriginalMesh(originalObject.name)) {
    if (!originalObject.userData.initialScale) {
      originalObject.userData.initialScale = new THREE.Vector3().copy(
        originalObject.scale
      );
    }
    if (!originalObject.userData.initialPosition) {
      originalObject.userData.initialPosition = new THREE.Vector3().copy(
        originalObject.position
      );
    }
    if (!originalObject.userData.initialRotation) {
      originalObject.userData.initialRotation = new THREE.Euler().copy(
        originalObject.rotation
      );
    }

    originalObject.userData.originalObject = originalObject;
    return originalObject;
  }

  if (!originalObject.userData.initialScale) {
    originalObject.userData.initialScale = new THREE.Vector3().copy(
      originalObject.scale
    );
  }
  if (!originalObject.userData.initialPosition) {
    originalObject.userData.initialPosition = new THREE.Vector3().copy(
      originalObject.position
    );
  }
  if (!originalObject.userData.initialRotation) {
    originalObject.userData.initialRotation = new THREE.Euler().copy(
      originalObject.rotation
    );
  }

  const currentScale = originalObject.scale.clone();
  const hasZeroScale =
    currentScale.x === 0 || currentScale.y === 0 || currentScale.z === 0;

  if (hasZeroScale && originalObject.userData.originalScale) {
    originalObject.scale.copy(originalObject.userData.originalScale);
  }

  const box = new THREE.Box3().setFromObject(originalObject);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  if (hasZeroScale) {
    originalObject.scale.copy(currentScale);
  }

  let hitboxGeometry;
  let sizeMultiplier = { x: 1.1, y: 1.75, z: 1.1 };

  hitboxGeometry = new THREE.BoxGeometry(
    size.x * sizeMultiplier.x,
    size.y * sizeMultiplier.y,
    size.z * sizeMultiplier.z
  );

  const hitboxMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    visible: false,
  });

  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
  hitbox.position.copy(center);
  hitbox.name = originalObject.name + "_Hitbox";
  hitbox.userData.originalObject = originalObject;

  if (originalObject.name.includes("Headphones")) {
    hitbox.rotation.x = 0;
    hitbox.rotation.y = Math.PI / 4;
    hitbox.rotation.z = 0;
  }

  return hitbox;
}

function createDelayedHitboxes() {
  objectsNeedingHitboxes.forEach((child) => {
    const raycastObject = createStaticHitbox(child);

    if (raycastObject !== child) {
      scene.add(raycastObject);
    }

    raycasterObjects.push(raycastObject);
    hitboxToObjectMap.set(raycastObject, child);
  });

  objectsNeedingHitboxes.length = 0;
}

function handleRaycasterInteraction() {
  if (isModalOpen || projectPage?.classList.contains("is-active")) return;

  if (currentIntersects.length > 0) {
    const hitbox = currentIntersects[0].object;
    const object = hitboxToObjectMap.get(hitbox);

    if (object.name.includes("Button")) {
      buttonSounds.click.play();
    }

    Object.entries(pianoKeyMap).forEach(([keyName, soundKey]) => {
      if (object.name.includes(keyName)) {
        if (pianoDebounceTimer) {
          clearTimeout(pianoDebounceTimer);
        }

        fadeOutBackgroundMusic();

        pianoSounds[soundKey].play();

        pianoDebounceTimer = setTimeout(() => {
          fadeInBackgroundMusic();
        }, PIANO_TIMEOUT);

        gsap.to(object.rotation, {
          x: object.userData.initialRotation.x + Math.PI / 42,
          duration: 0.4,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.to(object.rotation, {
              x: object.userData.initialRotation.x,
              duration: 0.25,
              ease: "back.out(2)",
            });
          },
        });
      }
    });

    Object.entries(socialLinks).forEach(([key, url]) => {
      if (object.name.includes(key)) {
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = url;
        newWindow.target = "_blank";
        newWindow.rel = "noopener noreferrer";
      }
    });

    if (object.name.includes("Work_Button")) {
      showModal(modals.work);
      showProjectList();
    } else if (object.name.includes("About_Button")) {
      showModal(modals.about);
    } else if (object.name.includes("Contact_Button")) {
      showModal(modals.contact);
    }
  }
}

function playHoverAnimation(objectHitbox, isHovering) {
  let scale = 1.4;
  const object = hitboxToObjectMap.get(objectHitbox);
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (object.name.includes("Coffee")) {
    gsap.killTweensOf(smoke.scale);
    if (isHovering) {
      gsap.to(smoke.scale, {
        x: 1.4,
        y: 1.4,
        z: 1.4,
        duration: 0.5,
        ease: "back.out(2)",
      });
    } else {
      gsap.to(smoke.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  }

  if (object.name.includes("Fish")) {
    scale = 1.2;
  }

  if (isHovering) {
    // Scale animation for all objects
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * scale,
      y: object.userData.initialScale.y * scale,
      z: object.userData.initialScale.z * scale,
      duration: 0.5,
      ease: "back.out(2)",
    });

    if (object.name.includes("About_Button")) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x - Math.PI / 10,
        duration: 0.5,
        ease: "back.out(2)",
      });
    } else if (
      object.name.includes("Contact_Button") ||
      object.name.includes("My_Work_Button") ||
      object.name.includes("GitHub") ||
      object.name.includes("YouTube") ||
      object.name.includes("Twitter")
    ) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x + Math.PI / 10,
        duration: 0.5,
        ease: "back.out(2)",
      });
    }

    if (object.name.includes("Boba") || object.name.includes("Name_Letter")) {
      gsap.to(object.position, {
        y: object.userData.initialPosition.y + 0.2,
        duration: 0.5,
        ease: "back.out(2)",
      });
    }
  } else {
    // Reset scale for all objects
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "back.out(2)",
    });

    if (
      object.name.includes("About_Button") ||
      object.name.includes("Contact_Button") ||
      object.name.includes("My_Work_Button") ||
      object.name.includes("GitHub") ||
      object.name.includes("YouTube") ||
      object.name.includes("Twitter")
    ) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }

    if (object.name.includes("Boba") || object.name.includes("Name_Letter")) {
      gsap.to(object.position, {
        y: object.userData.initialPosition.y,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  }
}

window.addEventListener("mousemove", (e) => {
  touchHappened = false;
  pointer.x = (e.clientX / sizes.width) * 2 - 1;
  pointer.y = -(e.clientY / sizes.height) * 2 + 1;
});

let sceneTouchStart = { x: 0, y: 0, moved: false };

const isUiTouchTarget = (target) =>
  target.closest(".modal, .overlay, .project-page, .toggle-buttons");

window.addEventListener(
  "touchstart",
  (e) => {
    if (isModalOpen || isUiTouchTarget(e.target)) return;
    const touch = e.touches[0];
    sceneTouchStart = { x: touch.clientX, y: touch.clientY, moved: false };
    e.preventDefault();
    pointer.x = (touch.clientX / sizes.width) * 2 - 1;
    pointer.y = -(touch.clientY / sizes.height) * 2 + 1;
  },
  { passive: false }
);

window.addEventListener(
  "touchmove",
  (e) => {
    if (isModalOpen || isUiTouchTarget(e.target)) return;
    const touch = e.touches[0];
    if (
      Math.abs(touch.clientX - sceneTouchStart.x) > 10 ||
      Math.abs(touch.clientY - sceneTouchStart.y) > 10
    ) {
      sceneTouchStart.moved = true;
    }
  },
  { passive: true }
);

window.addEventListener(
  "touchend",
  (e) => {
    if (isModalOpen || isUiTouchTarget(e.target)) return;
    e.preventDefault();
    if (sceneTouchStart.moved) return;
    handleRaycasterInteraction();
  },
  { passive: false }
);

window.addEventListener("click", (event) => {
  if (event.target.closest(".modal, .overlay, .project-page, .toggle-buttons")) return;
  handleRaycasterInteraction();
});

// Other Event Listeners
const themeToggleButton = document.querySelector(".theme-toggle-button");
const muteToggleButton = document.querySelector(".mute-toggle-button");
const languageToggleButton = document.querySelector(".language-toggle-button");
const sunSvg = document.querySelector(".sun-svg");
const moonSvg = document.querySelector(".moon-svg");
const soundOffSvg = document.querySelector(".sound-off-svg");
const soundOnSvg = document.querySelector(".sound-on-svg");

const updateMuteState = (muted) => {
  if (muted) {
    backgroundMusic.volume(0);
  } else {
    backgroundMusic.volume(BACKGROUND_MUSIC_VOLUME);
  }

  buttonSounds.click.mute(muted);
  Object.values(pianoSounds).forEach((sound) => {
    sound.mute(muted);
  });
};

const handleMuteToggle = (e) => {
  e.preventDefault();

  isMuted = !isMuted;
  updateMuteState(isMuted);
  buttonSounds.click.play();

  if (!backgroundMusic.playing()) {
    backgroundMusic.play();
  }

  gsap.to(muteToggleButton, {
    rotate: -45,
    scale: 5,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (!isMuted) {
        soundOffSvg.style.display = "none";
        soundOnSvg.style.display = "block";
      } else {
        soundOnSvg.style.display = "none";
        soundOffSvg.style.display = "block";
      }

      gsap.to(muteToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.set(muteToggleButton, {
            clearProps: "all",
          });
        },
      });
    },
  });
};

let isMuted = false;
muteToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleMuteToggle(e);
  },
  { passive: false }
);

muteToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleMuteToggle(e);
  },
  { passive: false }
);

const handleLanguageToggle = (e) => {
  e.preventDefault();
  siteLanguage = siteLanguage === "en" ? "fr" : "en";
  buttonSounds.click.play();
  applySiteLanguage();

  gsap.to(languageToggleButton, {
    rotate: siteLanguage === "fr" ? -8 : 8,
    scale: 1.25,
    duration: 0.24,
    ease: "back.out(2)",
    onComplete: () => {
      gsap.to(languageToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.24,
        ease: "back.out(2)",
        onComplete: () => gsap.set(languageToggleButton, { clearProps: "all" }),
      });
    },
  });
};

languageToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleLanguageToggle(e);
  },
  { passive: false }
);

languageToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleLanguageToggle(e);
  },
  { passive: false }
);

// Themeing stuff
const toggleFavicons = () => {
  const isDark = document.body.classList.contains("dark-theme");
  const theme = isDark ? "light" : "dark";
  const iconPath = `/media/${theme}-icon.png`;

  document.querySelector('link[rel="icon"]').href = iconPath;
  document.querySelector('link[rel="shortcut icon"]').href = iconPath;
  document.querySelector('link[rel="apple-touch-icon"]').href = iconPath;
};

let isNightMode = false;

const handleThemeToggle = (e) => {
  e.preventDefault();
  toggleFavicons();

  const isDark = document.body.classList.contains("dark-theme");
  document.body.classList.remove(isDark ? "dark-theme" : "light-theme");
  document.body.classList.add(isDark ? "light-theme" : "dark-theme");

  isNightMode = !isNightMode;
  scene.background = new THREE.Color(isNightMode ? "#6b5748" : "#e9ded0");
  buttonSounds.click.play();

  gsap.to(themeToggleButton, {
    rotate: 45,
    scale: 5,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (isNightMode) {
        sunSvg.style.display = "none";
        moonSvg.style.display = "block";
      } else {
        moonSvg.style.display = "none";
        sunSvg.style.display = "block";
      }

      gsap.to(themeToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.set(themeToggleButton, {
            clearProps: "all",
          });
        },
      });
    },
  });

  Object.values(roomMaterials).forEach((material) => {
    gsap.to(material.uniforms.uMixRatio, {
      value: isNightMode ? 1 : 0,
      duration: 1.5,
      ease: "power2.inOut",
    });
  });
};

// Click event listener
themeToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleThemeToggle(e);
  },
  { passive: false }
);

themeToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleThemeToggle(e);
  },
  { passive: false }
);

/**  -------------------------- Render and Animations Stuff -------------------------- */
const clock = new THREE.Clock();

const updateClockHands = () => {
  if (!hourHand || !minuteHand) return;

  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const minuteAngle = (minutes + seconds / 60) * ((Math.PI * 2) / 60);

  const hourAngle = (hours + minutes / 60) * ((Math.PI * 2) / 12);

  minuteHand.rotation.x = -minuteAngle;
  hourHand.rotation.x = -hourAngle;
};

const render = (timestamp) => {
  const elapsedTime = clock.getElapsedTime();

  // Update Shader Univform
  smokeMaterial.uniforms.uTime.value = elapsedTime;

  //Update Orbit Controls
  controls.update();

  // Update Clock hand rotation
  updateClockHands();

  // Fan rotate animation
  xAxisFans.forEach((fan) => {
    fan.rotation.x -= 0.04;
  });

  yAxisFans.forEach((fan) => {
    fan.rotation.y -= 0.04;
  });

  // Chair rotate animation
  if (chairTop) {
    const time = timestamp * 0.001;
    const baseAmplitude = Math.PI / 8;

    const rotationOffset =
      baseAmplitude *
      Math.sin(time * 0.5) *
      (1 - Math.abs(Math.sin(time * 0.5)) * 0.3);

    chairTop.rotation.y = chairTop.userData.initialRotation.y + rotationOffset;
  }

  // Fish up and down animation
  if (fish) {
    const time = timestamp * 0.0015;
    const amplitude = 0.12;
    const position =
      amplitude * Math.sin(time) * (1 - Math.abs(Math.sin(time)) * 0.1);
    fish.position.y = fish.userData.initialPosition.y + position;
  }

  // Raycaster
  if (!isModalOpen) {
    raycaster.setFromCamera(pointer, camera);

    // Get all the objects the raycaster is currently shooting through / intersecting with
    currentIntersects = raycaster.intersectObjects(raycasterObjects);

    for (let i = 0; i < currentIntersects.length; i++) {}

    if (currentIntersects.length > 0) {
      const currentIntersectObject = currentIntersects[0].object;

      if (currentIntersectObject.name.includes("Hover")) {
        if (currentIntersectObject !== currentHoveredObject) {
          if (currentHoveredObject) {
            playHoverAnimation(currentHoveredObject, false);
          }

          currentHoveredObject = currentIntersectObject;
          playHoverAnimation(currentIntersectObject, true);
        }
      }

      if (currentIntersectObject.name.includes("Pointer")) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    } else {
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
    }
  }

  renderer.render(scene, camera);

  window.requestAnimationFrame(render);
};

render();

