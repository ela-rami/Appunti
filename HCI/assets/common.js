document.addEventListener('DOMContentLoaded', function () {
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
            if(sidebar) {
                sidebar.style.top = headerHeight + 'px';
                sidebar.style.height = `calc(100% - ${headerHeight}px)`;
            }
            if (localStorage.getItem('sidebarState') === 'hidden') {
                body.classList.add('sidebar-hidden');
                if(sidebar) sidebar.classList.add('hidden');
            } else {
                body.classList.remove('sidebar-hidden');
                if(sidebar) sidebar.classList.remove('hidden');
            }
            body.classList.remove('sidebar-overlay-active');
            if(overlay) overlay.style.display = 'none';
        } else { // Mobile view
            if(sidebar) {
                sidebar.style.top = '0';
                sidebar.style.height = '100vh';
            }
            body.classList.add('sidebar-hidden'); 
            if (sidebar && sidebar.classList.contains('open')) {
                body.classList.add('sidebar-overlay-active');
                if(overlay) overlay.style.display = 'block';
            } else {
                if(sidebar) sidebar.classList.remove('open');
                body.classList.remove('sidebar-overlay-active');
                if(overlay) overlay.style.display = 'none';
            }
        }
    }
    
    window.addEventListener('resize', adjustLayoutForSidebar);

    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', () => {
            const sidebarIsOpen = sidebar.classList.contains('open');
            
            sidebar.classList.toggle('open', !sidebarIsOpen);

            if (window.innerWidth > 992) {
                body.classList.toggle('sidebar-hidden');
                const newState = body.classList.contains('sidebar-hidden') ? 'hidden' : 'visible';
                localStorage.setItem('sidebarState', newState);
                sidebar.classList.toggle('hidden');
            } else {
                 body.classList.toggle('sidebar-overlay-active', !sidebarIsOpen);
                 if(overlay) overlay.style.display = !sidebarIsOpen ? 'block' : 'none';
            }
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            body.classList.remove('sidebar-overlay-active');
            if(overlay) overlay.style.display = 'none';
        });
    }
    
    // LOGICA DI SCROLLING CORRETTA
    sidebarLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                sidebarLinks.forEach(link => link.classList.remove('active-link'));
                this.classList.add('active-link');

                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth"
                });
                
                // Aggiorna l'URL senza ricaricare la pagina
                history.pushState(null, null, `#${targetId}`);
            }

            if (window.innerWidth <= 992 && sidebar) {
                sidebar.classList.remove('open');
                body.classList.remove('sidebar-overlay-active');
                if(overlay) overlay.style.display = 'none';
            }
        });
    });
    
    // LOGICA PER EVIDENZIARE IL LINK DURANTE LO SCROLL
    function setActiveSidebarLinkOnScroll() {
        if (!sidebarLinks.length) return;
        
        let currentSectionId = "";
        const fromTop = window.scrollY + headerHeight + 50; // Aggiunto un offset

        sidebarLinks.forEach(link => {
            const section = document.querySelector(link.hash);
            if (section && section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop) {
                currentSectionId = section.id;
            }
        });
        
        if (currentSectionId) {
            sidebarLinks.forEach(link => {
                link.classList.toggle('active-link', link.hash === '#' + currentSectionId);
            });
        }
    }
    window.addEventListener('scroll', setActiveSidebarLinkOnScroll);

    // Initial setup
    adjustLayoutForSidebar();
    
    // Scroll to hash if present on page load
    if (window.location.hash) {
        const targetElement = document.getElementById(window.location.hash.substring(1));
        if (targetElement) {
            setTimeout(() => {
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                window.scrollTo({ top: targetPosition, behavior: "auto" });
                setActiveSidebarLinkOnScroll();
            }, 100);
        }
    } else {
        setActiveSidebarLinkOnScroll();
    }
});