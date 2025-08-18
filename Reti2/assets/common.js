document.addEventListener('DOMContentLoaded', function () {
    const allContentSections = document.querySelectorAll('.content-section');
    const headerElement = document.querySelector('header');
    let headerHeight = headerElement ? headerElement.offsetHeight : 70;

    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const overlay = document.querySelector('.overlay');
    const body = document.body;
    const sidebarLinks = document.querySelectorAll('#sidebar a.sidebar-link');

    // --- LOGICA DELLA SIDEBAR E LAYOUT (invariata) ---
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
        } else {
            sidebar.style.top = '0';
            sidebar.style.height = '100vh';
            body.classList.add('sidebar-hidden');
            sidebar.classList.add('hidden');
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
            if (window.innerWidth > 992) {
                const isCurrentlyHidden = body.classList.contains('sidebar-hidden');
                sidebar.classList.toggle('hidden', isCurrentlyHidden);
                body.classList.toggle('sidebar-hidden', isCurrentlyHidden);
                localStorage.setItem('sidebarState', isCurrentlyHidden ? 'visible' : 'hidden');
            } else {
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

    // --- GESTIONE SEZIONI E LINK (con evento personalizzato) ---
    function showSection(targetId, smoothScroll = true) {
        allContentSections.forEach(s => {
            s.classList.remove('active-section');
            s.style.display = 'none';
        });
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active-section');
            targetSection.style.display = 'block';

            // *** NUOVA PARTE: Emetti l'evento per Mermaid ***
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
                hamburgerBtn.click();
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
            setTimeout(() => {
                const elementToScroll = document.getElementById(targetId);
                if (elementToScroll) {
                     const targetPosition = elementToScroll.offsetTop - headerHeight - 20;
                     window.scrollTo({ top: targetPosition, behavior: "auto" });
                }
            }, 100);
        }
    }

    adjustLayoutForSidebar();
    handleInitialLoad();

    // Link PDF
    const appuntiProfButton = document.getElementById('appunti-prof-btn');
    if (appuntiProfButton) {
        const pdfPath = document.body.dataset.pdfPath;
        if (pdfPath) {
            appuntiProfButton.href = pdfPath;
        } else {
            appuntiProfButton.style.display = 'none';
        }
    }

    // --- GESTIONE DI MERMAID (copiata da OOP funzionante) ---
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: false, 
            theme: 'dark', 
            darkMode: true,
            fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-main').trim(),
            themeVariables: {
                primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim(),
                primaryTextColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
                primaryBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim(),
                lineColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim(),
                mainBkg: 'transparent',
            },
            fontSize: '14px',
        });
        
        const mermaidOriginalDefinitions = new Map();
        document.querySelectorAll('.mermaid').forEach((diag, index) => {
            const id = diag.id || `mermaid-dynamic-init-${index}`;
            diag.id = id;
            
            // Estrazione più robusta del contenuto
            let decodedContent = '';
            if (diag.tagName.toLowerCase() === 'pre') {
                // Se è un elemento <pre>, prendi il textContent direttamente
                decodedContent = diag.textContent.trim();
            } else {
                // Altrimenti usa il metodo precedente
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = diag.innerHTML; 
                decodedContent = (tempDiv.textContent || tempDiv.innerText || "").trim();
            }
            
            
            mermaidOriginalDefinitions.set(id, decodedContent);
            diag.innerHTML = ''; 
            diag.style.visibility = 'hidden'; 
        });
        
        async function renderMermaidDiagram(diagElement) {
            const diagramId = diagElement.id;
            const diagramDefinition = mermaidOriginalDefinitions.get(diagramId);
            if (!diagramDefinition) { return; }
            diagElement.innerHTML = ''; 
            try {
                const tempSvgId = 'tempsvg-' + diagramId + '-' + Date.now(); 
                const { svg } = await mermaid.render(tempSvgId, diagramDefinition);
                diagElement.innerHTML = svg;
                diagElement.style.visibility = 'visible';
            } catch (e) {
                console.error("Mermaid rendering error:", e);
                diagElement.innerHTML = `<p style="color:red;">Error rendering diagram</p>`;
                diagElement.style.visibility = 'visible';
            }
        }
        
        allContentSections.forEach(section => {
            section.addEventListener('sectionshown', function() {
                this.querySelectorAll('.mermaid').forEach(renderMermaidDiagram);
            });
        });
        
        const initiallyActiveSection = document.querySelector('.content-section.active-section');
        if (initiallyActiveSection) {
            initiallyActiveSection.querySelectorAll('.mermaid').forEach(renderMermaidDiagram);
        }
    }
});