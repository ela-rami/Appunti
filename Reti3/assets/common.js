document.addEventListener('DOMContentLoaded', function () {
    const allContentSections = document.querySelectorAll('.content-section');
    const headerElement = document.querySelector('header.topic-header');
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
                if(sidebar) sidebar.classList.add('hidden');
                body.classList.remove('sidebar-overlay-active');
                if(overlay) overlay.style.display = 'none';
            }
        }
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            const isDesktop = window.innerWidth > 992;
            if (isDesktop) {
                body.classList.toggle('sidebar-hidden');
                sidebar.classList.toggle('hidden');
                localStorage.setItem('sidebarState', body.classList.contains('sidebar-hidden') ? 'hidden' : 'visible');
            } else {
                sidebar.classList.toggle('open');
                sidebar.classList.toggle('hidden');
                body.classList.toggle('sidebar-overlay-active');
                overlay.style.display = body.classList.contains('sidebar-overlay-active') ? 'block' : 'none';
            }
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebar.classList.add('hidden');
            body.classList.remove('sidebar-overlay-active');
            overlay.style.display = 'none';
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

            const event = new CustomEvent('sectionshown', { detail: { sectionId: targetId } });
            targetSection.dispatchEvent(event);
            
            // This small delay ensures the content is rendered before scrolling
            setTimeout(() => {
                const targetPosition = targetSection.offsetTop - headerHeight - 20;
                if(smoothScroll) {
                    window.scrollTo({ top: targetPosition, behavior: "smooth" });
                } else {
                    window.scrollTo(0, targetPosition);
                }
            }, 50);
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
                hamburgerBtn.click(); // Simulate a click to close the mobile menu
            }
        });
    });
    
    function setActiveSidebarLinkOnScroll() {
        let currentSectionId = "";
        const scrollPosition = window.pageYOffset;
        
        allContentSections.forEach(section => {
            if (section.style.display === 'block') {
                const sectionTop = section.offsetTop - headerHeight - 50;
                if (scrollPosition >= sectionTop) {
                    currentSectionId = section.id;
                }
            }
        });

        sidebarLinks.forEach(link => {
            link.classList.remove('active-link');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active-link');
            }
        });
    }

    window.addEventListener('scroll', setActiveSidebarLinkOnScroll);
    window.addEventListener('resize', adjustLayoutForSidebar);

    // Initial page load logic
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        if (document.getElementById(targetId)) {
            showSection(targetId, false);
        }
    } else if (allContentSections.length > 0) {
        showSection(allContentSections[0].id, false);
    }
    setActiveSidebarLinkOnScroll();
    
    // Set initial sidebar state for desktop
    if(window.innerWidth > 992){
        const sidebarState = localStorage.getItem('sidebarState');
        if (sidebarState === 'hidden') {
            body.classList.add('sidebar-hidden');
            if(sidebar) sidebar.classList.add('hidden');
        }
    } else {
        if(sidebar) sidebar.classList.add('hidden');
    }

});