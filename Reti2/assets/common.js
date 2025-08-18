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
            
            const isHidden = localStorage.getItem('sidebarState') === 'hidden';
            sidebar.classList.toggle('hidden', isHidden);
            body.classList.toggle('sidebar-hidden', isHidden);
            
            sidebar.classList.remove('open');
            body.classList.remove('sidebar-overlay-active');
            if (overlay) overlay.style.display = 'none';

        } else { // Mobile view
            sidebar.style.top = '0';
            sidebar.style.height = '100vh';
            body.classList.add('sidebar-hidden'); // Main content always full width
            sidebar.classList.add('hidden'); // Sidebar always hidden by default

            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('hidden');
                body.classList.add('sidebar-overlay-active');
                if (overlay) overlay.style.display = 'block';
            } else {
                body.classList.remove('sidebar-overlay-active');
                if (overlay) overlay.style.display = 'none';
            }
        }
    }
    
    window.addEventListener('resize', adjustLayoutForSidebar);

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            if (window.innerWidth > 992) { // Desktop toggle
                const isCurrentlyHidden = body.classList.contains('sidebar-hidden');
                sidebar.classList.toggle('hidden', isCurrentlyHidden);
                body.classList.toggle('sidebar-hidden', isCurrentlyHidden);
                localStorage.setItem('sidebarState', isCurrentlyHidden ? 'visible' : 'hidden');
            } else { // Mobile toggle
                const isCurrentlyOpen = sidebar.classList.contains('open');
                sidebar.classList.toggle('open', !isCurrentlyOpen);
                sidebar.classList.toggle('hidden', isCurrentlyOpen);
                body.classList.toggle('sidebar-overlay-active', !isCurrentlyOpen);
                if(overlay) overlay.style.display = !isCurrentlyOpen ? 'block' : 'none';
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

            // Dispatch custom event for Mermaid rendering
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
                hamburgerBtn.click(); // Simulate click to close
            }
        });
    });
    
    function handleInitialLoad() {
        let targetId = window.location.hash.substring(1);
        const targetElement = document.getElementById(targetId);

        if (!targetId || !targetElement) {
            targetId = allContentSections.length > 0 ? allContentSections[0].id : null;
        }

        if (targetId) {
            showSection(targetId, false);
            const activeLink = document.querySelector(`#sidebar a[href="#${targetId}"]`);
            if(activeLink) activeLink.classList.add('active-link');
            
            // Scroll into view after a short delay to ensure layout is stable
            setTimeout(() => {
                const elementToScroll = document.getElementById(targetId);
                if (elementToScroll) {
                     const targetPosition = elementToScroll.offsetTop - headerHeight - 20;
                     window.scrollTo({ top: targetPosition, behavior: "auto" });
                }
            }, 100);
        }
    }

    // Initial setup
    adjustLayoutForSidebar();
    handleInitialLoad();

    // Link PDF path from body data attribute to the button
    const appuntiProfButton = document.getElementById('appunti-prof-btn');
    if (appuntiProfButton) {
        const pdfPath = document.body.dataset.pdfPath;
        if (pdfPath) {
            appuntiProfButton.href = pdfPath;
        } else {
            appuntiProfButton.style.display = 'none';
        }
    }
});