/**
 * iSTORE 2026 - ENGINE TOTAL 
 * - Detetividade de Grade (A, B, C)
 * - Home limitada a 4 produtos
 * - Menu Hambúrguer Mobile
 * - Sem campo "Support"
 */

const API_URL = 'https://www.datamarked.dk/?id=8016&apikey=3ECBC13EA72E40CBB293982EAE5999FF6BF3B58D9D1400DB4F19EF2F9C3B6266';
let alleProdukter = [];
let nuvarandeKategori = 'Alla';

// --- 1. DETETOR DE GRADE INTELIGENTE ---
function extrairGrade(titulo) {
    const t = titulo.toUpperCase();
    if (t.includes("GRADE A+")) return "Grade A+";
    if (t.includes("GRADE A")) return "Grade A";
    if (t.includes("GRADE B")) return "Grade B";
    if (t.includes("GRADE C")) return "Grade C";
    
    // Procura por letra isolada no fim (ex: "- B")
    const matchSimples = t.match(/\s+([ABC][+]?)$/);
    if (matchSimples) return "Grade " + matchSimples[1];
    
    return "Grade A+"; // Fallback se não encontrar nada
}

// --- 2. CARREGAR PRODUTOS ---
async function hentProdukter() {
    const grid = document.getElementById('productGrid') || document.getElementById('homeProductGrid') || document.querySelector('.apple-grid');
    if (grid) grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 50px;">Laddar iStore...</p>';

    try {
        const svar = await fetch(API_URL);
        const data = await svar.json();

        alleProdukter = data.map(item => {
            const nameUpper = item.title.toUpperCase();
            let cat = 'Annat';
            if (nameUpper.includes('IPHONE')) cat = 'iPhone';
            else if (nameUpper.includes('IPAD')) cat = 'iPad';
            else if (nameUpper.includes('MACBOOK PRO')) cat = 'MacBook Pro';
            else if (nameUpper.includes('MACBOOK AIR')) cat = 'MacBook Air';
            else if (nameUpper.includes('IMAC')) cat = 'iMac';
            else if (nameUpper.includes('MAC')) cat = 'Mac';

            return {
                namn: item.title,
                pris: typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : item.price,
                billede: item.image,
                link: item.link,
                kategori: cat
            };
        });

        renderFiltre();
        renderGrid();
    } catch (fejl) {
        console.error("Erro API:", fejl);
    }
}

// --- 3. FILTROS ---
function renderFiltre() {
    const container = document.getElementById('filterContainer');
    if (!container) return;
    const categorias = ['Alla', 'MacBook Pro', 'MacBook Air', 'iMac', 'Mac Mini', 'iPhone', 'iPad'];
    container.innerHTML = categorias.map(k => `
        <button class="apple-filter-btn ${nuvarandeKategori === k ? 'active' : ''}" 
                onclick="skiftKategori('${k}')">${k}</button>
    `).join('');
}

window.skiftKategori = (k) => {
    nuvarandeKategori = k;
    renderFiltre();
    renderGrid();
};

// --- 4. RENDERIZAR GRID (COM LIMITE NA HOME) ---
function renderGrid() {
    const grid = document.getElementById('productGrid') || document.getElementById('homeProductGrid') || document.querySelector('.apple-grid');
    if (!grid) return;

    const sökord = document.getElementById('searchField')?.value.toLowerCase() || '';
    
    let filtrerade = alleProdukter.filter(p => 
        (nuvarandeKategori === 'Alla' || p.kategori === nuvarandeKategori) && 
        p.namn.toLowerCase().includes(sökord)
    );

    // Se for a Home (ID homeProductGrid ou sem filtros), mostra só 4 aleatórios
    if (grid.id === 'homeProductGrid' || !document.getElementById('filterContainer')) {
        filtrerade = shuffleArray(filtrerade).slice(0, 4);
    }

    grid.innerHTML = filtrerade.map(p => `
        <article class="product-card">
            <div class="img-wrapper"><img src="${p.billede}"></div>
            <div class="product-info">
                <span class="eyebrow">${p.kategori}</span>
                <h3>${p.namn}</h3>
                <p><strong>${p.pris.toLocaleString('sv-SE')} kr</strong></p>
                <div class="card-buttons">
                    <button class="btn-secondary" onclick="openModal('${encodeURIComponent(JSON.stringify(p))}')">Detaljer</button>
                    <a href="${p.link}" target="_blank" class="btn-primary">Köp</a>
                </div>
            </div>
        </article>
    `).join('');
}

// --- 5. MODAL (LADO A LADO + GRADE CORRETO) ---
window.openModal = (productData) => {
    const p = JSON.parse(decodeURIComponent(productData));
    const modal = document.getElementById('productModal');
    const body = document.getElementById('modalBody');

    const gradeFinal = extrairGrade(p.namn);
    // Limpa o nome para não repetir o "Grade" no título principal do modal
    const nomeLimpo = p.namn.replace(/Grade\s*[A-C1-3+]+/i, "").replace(/\-\s*[ABC][+]?$/i, "").trim();

    body.innerHTML = `
        <button class="close-modal" onclick="closeModal()">×</button>
        <div class="modal-grid">
            <div class="modal-img">
                <img src="${p.billede}" alt="${p.namn}">
            </div>
            <div class="modal-info">
                <span class="eyebrow">${p.kategori}</span>
                <h1>${nomeLimpo}</h1>
                <span class="modal-price">${p.pris.toLocaleString('sv-SE')} kr</span>
                
                <div class="product-description-container">
                    <span class="description-label">Översikt</span>
                    <p class="product-text">Denna ${p.namn} är noggrant testad och certifierad. Vi garanterar äkta Apple-kvalitet.</p>
                </div>

                <div class="meta-box">
                    <div class="meta-item"><span>Skick:</span> <strong>${gradeFinal}</strong></div>
                    <div class="meta-item"><span>Garanti:</span> <strong>24 Månader</strong></div>
                </div>

                <a href="${p.link}" target="_blank" class="buy-now-btn">Gå till beställning</a>
            </div>
        </div>
    `;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
};

window.closeModal = () => {
    document.getElementById('productModal').style.display = "none";
    document.body.style.overflow = "auto";
};

// --- 6. MENU HAMBURGUER ---
function initMenu() {
    const header = document.querySelector('.header-grid');
    if (!header) return;

    // Adiciona o botão se não existir
    if (!document.querySelector('.menu-toggle')) {
        const btn = document.createElement('button');
        btn.className = 'menu-toggle';
        btn.innerHTML = '<span class="open-icon">☰</span><span class="close-icon">×</span>';
        header.appendChild(btn);

        btn.addEventListener('click', () => {
            header.classList.toggle('nav-active');
            document.body.style.overflow = header.classList.contains('nav-active') ? 'hidden' : '';
        });
    }
}

// Auxiliares
function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    hentProdukter();
    initMenu();
    document.getElementById('searchField')?.addEventListener('input', renderGrid);
});