document.addEventListener('DOMContentLoaded', function () {
    const allContentSections = document.querySelectorAll('.content-section');
    const headerElement = document.querySelector('header');
    let headerHeight = headerElement ? headerElement.offsetHeight : 70;

    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const overlay = document.querySelector('.overlay');
    const body = document.body;
    const sidebarLinks = document.querySelectorAll('#sidebar a.sidebar-link');


    function adjustLayoutForSidebar() {
        if (headerElement) { headerHeight = headerElement.offsetHeight; }
        if (window.innerWidth > 992) {
            sidebar.style.top = headerHeight + 'px';
            sidebar.style.height = `calc(100% - ${headerHeight}px)`;
            if (sidebar.classList.contains('hidden-desktop-explicit')) {
                body.classList.add('sidebar-hidden');
            } else {
                body.classList.remove('sidebar-hidden');
                sidebar.classList.remove('hidden');
            }
            body.classList.remove('sidebar-overlay-active');
            if(overlay) overlay.style.display = 'none';
        } else {
            sidebar.style.top = '0';
            sidebar.style.height = '100vh';
            body.classList.add('sidebar-hidden'); 
            if (sidebar.classList.contains('open')) {
                body.classList.add('sidebar-overlay-active');
                if(overlay) overlay.style.display = 'block';
            } else {
                sidebar.classList.add('hidden'); 
                body.classList.remove('sidebar-overlay-active');
                if(overlay) overlay.style.display = 'none';
            }
        }
    }
    
    window.addEventListener('resize', adjustLayoutForSidebar);

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            const sidebarIsCurrentlyHiddenOrNotOpen = sidebar.classList.contains('hidden') || !sidebar.classList.contains('open');
            
            sidebar.classList.toggle('hidden', !sidebarIsCurrentlyHiddenOrNotOpen);
            sidebar.classList.toggle('open', sidebarIsCurrentlyHiddenOrNotOpen);

            if (window.innerWidth > 992) {
                body.classList.toggle('sidebar-hidden', !sidebarIsCurrentlyHiddenOrNotOpen);
                if (sidebar.classList.contains('hidden')) {
                    sidebar.classList.add('hidden-desktop-explicit');
                    localStorage.setItem('sidebarState', 'hidden'); // Save state
                } else {
                    sidebar.classList.remove('hidden-desktop-explicit');
                    localStorage.setItem('sidebarState', 'visible'); // Save state
                }
            } else {
                 body.classList.toggle('sidebar-overlay-active', sidebarIsCurrentlyHiddenOrNotOpen);
                 if(overlay) overlay.style.display = sidebarIsCurrentlyHiddenOrNotOpen ? 'block' : 'none';
            }
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('open');
            body.classList.remove('sidebar-overlay-active');
            if(overlay) overlay.style.display = 'none';
             if (window.innerWidth > 992) {
                body.classList.add('sidebar-hidden'); // Ensure push state is correct
                sidebar.classList.add('hidden-desktop-explicit');
                localStorage.setItem('sidebarState', 'hidden'); // Save state
            }
        });
    }

    function showSection(targetId, smoothScroll = true) {
        allContentSections.forEach(s => {
            s.classList.remove('active-section');
            s.style.display = 'none';
        });
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active-section');
            targetSection.style.display = 'block';

            // Dispatch custom event per far partire il rendering dei diagrammi
            const event = new CustomEvent('sectionshown', { detail: { sectionId: targetId } });
            targetSection.dispatchEvent(event);

            if (smoothScroll) {
                const targetPosition = targetSection.offsetTop - headerHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth"
                });
            }
        }
    }
    
    sidebarLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            sidebarLinks.forEach(link => link.classList.remove('active-link'));
            this.classList.add('active-link');

            showSection(targetId);
            history.pushState(null, null, `#${targetId}`);

            if (window.innerWidth <= 992) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('open');
                body.classList.remove('sidebar-overlay-active');
                if(overlay) overlay.style.display = 'none';
            }
        });
    });
    
    function setActiveSidebarLinkOnScroll() {
        let currentSectionId = "";
        
        // Determina la sezione visibile basandosi sulla posizione dello scroll
        for (let i = allContentSections.length - 1; i >= 0; i--) {
            const section = allContentSections[i];
            const sectionTop = section.offsetTop - headerHeight - (window.innerHeight * 0.3); // trigger point
            if (window.pageYOffset >= sectionTop) {
                currentSectionId = section.id;
                break; 
            }
        }
        
        sidebarLinks.forEach(link => {
            link.classList.remove('active-link');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active-link');
            }
        });
    }
    window.addEventListener('scroll', setActiveSidebarLinkOnScroll);

    // Gestione del caricamento iniziale della pagina
    function handleInitialLoad() {
        if (window.location.hash) {
            const targetId = window.location.hash.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement && Array.from(allContentSections).includes(targetElement)) {
                showSection(targetId, false);
                setTimeout(() => {
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    window.scrollTo({ top: targetPosition, behavior: "auto" });
                    document.querySelector(`#sidebar a[href="${window.location.hash}"]`)?.classList.add('active-link');
                }, 0);
                return;
            }
        }
        
        // Se non c'è un hash valido, mostra la prima sezione
        if (allContentSections.length > 0) {
            const firstSectionId = allContentSections[0].id;
            showSection(firstSectionId);
            document.querySelector(`#sidebar a[href="#${firstSectionId}"]`)?.classList.add('active-link');
        }
    }
    
    // Gestione stato sidebar
    if (window.innerWidth > 992) {
        const sidebarState = localStorage.getItem('sidebarState');
        if (sidebarState === 'hidden') {
            sidebar.classList.add('hidden', 'hidden-desktop-explicit');
            body.classList.add('sidebar-hidden');
        } else {
            sidebar.classList.remove('hidden', 'hidden-desktop-explicit');
            body.classList.remove('sidebar-hidden');
        }
    } else {
         sidebar.classList.add('hidden');
    }
    
    handleInitialLoad();
    adjustLayoutForSidebar();

    // Logica per il bottone "Appunti Prof (PDF)"
    const appuntiProfButton = document.getElementById('appunti-prof-btn');
    if (appuntiProfButton) {
        const pdfPath = document.body.dataset.pdfPath;
        if (pdfPath) {
            appuntiProfButton.href = pdfPath;
        } else {
            appuntiProfButton.style.display = 'none'; 
            // console.warn("Attributo 'data-pdf-path' non trovato sul body. Il bottone 'Appunti Prof' non funzionerà correttamente.");
        }
    }
});