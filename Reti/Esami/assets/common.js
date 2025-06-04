// Reti/Esami/assets/common.js

document.addEventListener('DOMContentLoaded', function () {

    const allContentSections = document.querySelectorAll('.content-section');
    const headerElement = document.querySelector('header');
    let headerHeight = headerElement ? headerElement.offsetHeight : 70; // Default fallback

    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const overlay = document.querySelector('.overlay');
    const body = document.body;
    const sidebarLinks = document.querySelectorAll('#sidebar a.sidebar-link');

    // --- 1. Initialize Mermaid.js configuration ---
    // This must happen early but *before* attempting to parse definitions or render.
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: false, // CRITICAL: Prevent auto-rendering on page load
            theme: 'dark',
            darkMode: true,
            fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-code').trim(),
            themeVariables: {
                primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim(),
                primaryTextColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
                primaryBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim(),
                lineColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim(),
                secondaryColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-deep-space').trim(),
                tertiaryColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim(),
                fontSize: '14px',
                textColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
                mainBkg: getComputedStyle(document.documentElement).getPropertyValue('--code-bg').trim(),
                nodeBorder: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim(),
            }
        });
    }

    // --- 2. Store original Mermaid definitions ---
    // This MUST happen before any content manipulation that might clear the original diagram text.
    // We iterate over all potential Mermaid containers on the page.
    const mermaidOriginalDefinitions = new Map();
    document.querySelectorAll('.mermaid').forEach((diag, index) => {
        const id = diag.id || `mermaid-diagram-${index}`; // Ensure unique ID
        diag.id = id;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = diag.innerHTML; 
        const decodedContent = tempDiv.textContent || tempDiv.innerText || ""; 
        mermaidOriginalDefinitions.set(id, decodedContent.trim());
        diag.innerHTML = ''; // Clear original content to prepare for rendering
        diag.style.visibility = 'hidden'; // Keep hidden until rendered
    });

    // --- Utility Function: Render a single Mermaid diagram ---
    async function renderMermaidDiagram(diagElement) {
        const diagramId = diagElement.id;
        const diagramDefinition = mermaidOriginalDefinitions.get(diagramId);

        if (!diagramDefinition) {
            console.error(`Mermaid: Definition not found for ID: ${diagramId}`);
            diagElement.innerHTML = `<p style="color:var(--accent-primary); font-weight:bold;">Errore: Definizione diagramma non trovata.</p>`;
            diagElement.style.visibility = 'visible';
            return;
        }

        try {
            // Mermaid.render requires a unique ID for its internal processing
            // We use a temporary one for the render call, but keep the diagElement.id
            const tempSvgId = 'tempsvg-' + diagramId + '-' + Date.now(); 
            const { svg } = await mermaid.render(tempSvgId, diagramDefinition);
            diagElement.innerHTML = svg;
            diagElement.style.visibility = 'visible'; // Make visible after successful rendering
        } catch (e) {
            console.error(`Mermaid rendering failed for ID: ${diagramId}`, e);
            diagElement.innerHTML = `<p style="color:var(--accent-primary); font-weight:bold;">Errore rendering Mermaid:</p><pre style="text-align:left; white-space:pre-wrap; word-wrap:break-word; color: var(--text-secondary);">${e.message}\n\n${diagramDefinition.replace(/</g, "<").replace(/>/g, ">")}</pre>`;
            diagElement.style.visibility = 'visible';
        }
    }


    // --- Utility Function: Process Markdown Bold ---
    function processMarkdownBold(element) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentNode && (node.parentNode.closest('pre') || node.parentNode.closest('code') || node.parentNode.closest('.mermaid-container'))) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        let node;
        const textNodesToProcess = [];
        while ((node = walker.nextNode())) {
            textNodesToProcess.push(node);
        }

        textNodesToProcess.forEach(node => {
            let text = node.nodeValue;
            const regex = /\*\*(.*?)\*\*/g;
            let match;
            let lastIndex = 0;
            const fragment = document.createDocumentFragment();
            let changed = false;

            while ((match = regex.exec(text)) !== null) {
                changed = true;
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                }
                const strong = document.createElement('strong');
                strong.textContent = match[1];
                fragment.appendChild(strong);
                lastIndex = regex.lastIndex;
            }

            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }

            if (changed && node.parentNode) {
                node.parentNode.replaceChild(fragment, node);
            }
        });
    }

    // --- Layout Adjustment Functions ---
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

    // --- Hamburger Menu and Overlay Logic ---
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            const sidebarIsCurrentlyHiddenOrNotOpen = sidebar.classList.contains('hidden') || !sidebar.classList.contains('open');
            
            sidebar.classList.toggle('hidden', !sidebarIsCurrentlyHiddenOrNotOpen);
            sidebar.classList.toggle('open', sidebarIsCurrentlyHiddenOrNotOpen);

            if (window.innerWidth > 992) {
                body.classList.toggle('sidebar-hidden', !sidebarIsCurrentlyHiddenOrNotOpen);
                if (sidebar.classList.contains('hidden')) {
                    sidebar.classList.add('hidden-desktop-explicit');
                    localStorage.setItem('sidebarState', 'hidden');
                } else {
                    sidebar.classList.remove('hidden-desktop-explicit');
                    localStorage.setItem('sidebarState', 'visible');
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
                body.classList.add('sidebar-hidden');
                sidebar.classList.add('hidden-desktop-explicit');
                localStorage.setItem('sidebarState', 'hidden');
            }
        });
    }

    // --- Section Display and Scroll Logic ---
    function showSection(targetId, smoothScroll = true) {
        const targetElement = document.getElementById(targetId);
        let articleToShow = null;

        if (targetElement) {
            articleToShow = targetElement.closest('.content-section');
        }

        allContentSections.forEach(s => {
            s.classList.remove('active-section');
            s.style.display = 'none';
        });

        if (articleToShow) {
            articleToShow.classList.add('active-section');
            articleToShow.style.display = 'block';

            // --- Trigger rendering for Mermaid and Markdown processing ---
            // This is crucial: render/process content ONLY when its section is visible.
            articleToShow.querySelectorAll('.mermaid').forEach(renderMermaidDiagram);
            processMarkdownBold(articleToShow);

            if (smoothScroll && targetElement) {
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth"
                });
            }
        } else {
            console.warn(`Article for ID "${targetId}" not found or is not a content-section. Cannot show section.`);
            // Fallback: If a specific element within an article is not found,
            // but the article itself might be intended, you could show the first article
            // or an error message. For now, it just warns and hides everything.
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
    
    // --- Initial page load logic ---
    function initialSetup() {
        adjustLayoutForSidebar(); // Adjust layout based on screen size

        // Determine initial active section and sidebar link based on URL hash or default to first
        let currentHash = window.location.hash.substring(1);
        
        if (currentHash) {
            const targetElement = document.getElementById(currentHash);
            if (targetElement && targetElement.closest('.content-section')) {
                showSection(currentHash, false); // Show relevant section without smooth scroll on load
                const activeLink = document.querySelector(`#sidebar a[href="#${currentHash}"]`);
                if (activeLink) {
                    activeLink.classList.add('active-link');
                    // Scroll sidebar to make active link visible if necessary
                    setTimeout(() => {
                        activeLink.scrollIntoView({ behavior: 'auto', block: 'nearest' });
                    }, 100); 
                }
                return;
            }
        } 
        
        // Default to first article if no valid hash or hash points to non-existent element
        if (allContentSections.length > 0) {
            const firstSectionId = allContentSections[0].id;
            showSection(firstSectionId, false);
            document.querySelector(`#sidebar a[href="#${firstSectionId}"]`)?.classList.add('active-link');
        }
    }

    // Call initial setup
    initialSetup();

    // Determine initial sidebar visibility for desktop (based on localStorage)
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

    // Logic for the "Appunti Prof (PDF)" button
    const appuntiProfButton = document.getElementById('appunti-prof-btn');
    if (appuntiProfButton) {
        const pdfPath = document.body.dataset.pdfPath;
        if (pdfPath) {
            appuntiProfButton.href = pdfPath;
        } else {
            appuntiProfButton.style.display = 'none'; 
        }
    }

    // Update the "Torna all'Indice dei Capitoli" button link
    const lezioniHomeBtn = document.getElementById('lezioni-home-btn');
    if (lezioniHomeBtn) {
        // Assuming your main index for Reti lessons will be at Reti/Esami/index.html
        lezioniHomeBtn.href = 'index.html'; // Points to index.html in the same directory
    }
});