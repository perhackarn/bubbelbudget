// Data storage keys
const STORAGE_KEYS = {
    SALES: 'bubbelbudget_sales',
    PURCHASES: 'bubbelbudget_purchases',
    INVENTORY: 'bubbelbudget_inventory',
    ARTICLES: 'bubbelbudget_articles'
};

console.log('JavaScript file loaded!');

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
}

// Data functions
function getSales() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
}

function getPurchases() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
}

function getInventory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '{}');
}

function getArticles() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTICLES) || '[]');
}

function saveSale(sale) {
    const sales = getSales();
    sales.push(sale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
}

function savePurchase(purchase) {
    const purchases = getPurchases();
    purchases.push(purchase);
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
}

function saveArticle(article) {
    const articles = getArticles();
    articles.push(article);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
}

function updateInventory(product, quantityChange, reason) {
    const inventory = getInventory();
    if (!inventory[product]) {
        inventory[product] = { antal: 0, senast_uppdaterad: new Date().toISOString(), anledning: reason };
    }
    
    inventory[product].antal += quantityChange;
    inventory[product].senast_uppdaterad = new Date().toISOString();
    inventory[product].anledning = reason;
    
    if (inventory[product].antal < 0) {
        inventory[product].antal = 0;
    }
    
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
}

// Display functions
function displaySales() {
    const sales = getSales().sort((a, b) => new Date(b.datum) - new Date(a.datum));
    const container = document.getElementById('forsaljning-lista');
    
    if (!container) return;
    
    if (sales.length === 0) {
        container.innerHTML = '<div class="empty-state">Inga försäljningar registrerade ännu</div>';
        return;
    }
    
    container.innerHTML = sales.slice(0, 10).map(sale => `
        <div class="transaction-item">
            <button class="delete-btn" onclick="deleteSale('${sale.id}')" title="Ta bort">×</button>
            <div class="transaction-header">
                <span class="transaction-product">${sale.produkt}</span>
                <span class="transaction-amount positive">+${sale.totalbelopp.toFixed(2)} kr</span>
            </div>
            <div class="transaction-details">
                <div><span class="transaction-date">${formatDate(sale.datum)}</span> • ${sale.antal} st × ${sale.pris.toFixed(2)} kr</div>
                ${sale.anteckning ? `<div>📝 ${sale.anteckning}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function displayPurchases() {
    const purchases = getPurchases().sort((a, b) => new Date(b.datum) - new Date(a.datum));
    const container = document.getElementById('inkop-lista');
    
    if (!container) return;
    
    if (purchases.length === 0) {
        container.innerHTML = '<div class="empty-state">Inga inköp registrerade ännu</div>';
        return;
    }
    
    container.innerHTML = purchases.slice(0, 10).map(purchase => `
        <div class="transaction-item">
            <button class="delete-btn" onclick="deletePurchase('${purchase.id}')" title="Ta bort">×</button>
            <div class="transaction-header">
                <span class="transaction-product">${purchase.produkt}</span>
                <span class="transaction-amount negative">-${purchase.totalbelopp.toFixed(2)} kr</span>
            </div>
            <div class="transaction-details">
                <div><span class="transaction-date">${formatDate(purchase.datum)}</span> • ${purchase.antal} st × ${purchase.kostnad.toFixed(2)} kr</div>
                <div>🏪 ${purchase.leverantor}</div>
                ${purchase.anteckning ? `<div>📝 ${purchase.anteckning}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function displayArticles() {
    const articles = getArticles().sort((a, b) => a.namn.localeCompare(b.namn));
    const container = document.getElementById('artikel-lista');
    
    if (!container) return;
    
    if (articles.length === 0) {
        container.innerHTML = '<div class="empty-state">Inga artiklar registrerade ännu</div>';
        return;
    }
    
    container.innerHTML = articles.map(article => `
        <div class="transaction-item">
            <button class="delete-btn" onclick="deleteArticle('${article.id}')" title="Ta bort">×</button>
            <div class="transaction-header">
                <span class="transaction-product">${article.namn}</span>
                <span class="transaction-amount positive">${article.forsaljningspris.toFixed(2)} kr</span>
            </div>
            <div class="transaction-details">
                ${article.beskrivning ? `<div>📝 ${article.beskrivning}</div>` : ''}
                ${article.kategori ? `<div>🏷️ ${article.kategori}</div>` : ''}
                ${article.inkopspris > 0 ? `<div>💰 Inköpspris: ${article.inkopspris.toFixed(2)} kr</div>` : ''}
                ${article.anteckning ? `<div>💭 ${article.anteckning}</div>` : ''}
                <div>📅 Skapad: ${formatDate(article.skapad.split('T')[0])}</div>
            </div>
        </div>
    `).join('');
}

function displayInventory() {
    const inventory = getInventory();
    const container = document.getElementById('lager-lista');
    
    if (!container) return;
    
    const products = Object.keys(inventory);
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state">Inget lager registrerat ännu</div>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        const item = inventory[product];
        return `
            <div class="lager-item">
                <div class="lager-info">
                    <div class="transaction-product">${product}</div>
                    <div class="transaction-details">
                        Uppdaterad: ${formatDate(item.senast_uppdaterad.split('T')[0])} • ${item.anledning}
                    </div>
                </div>
                <div class="lager-count">${item.antal} st</div>
            </div>
        `;
    }).join('');
}

function displayReport() {
    const sales = getSales();
    const purchases = getPurchases();
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalbelopp, 0);
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalbelopp, 0);
    const profit = totalSales - totalPurchases;
    
    const salesEl = document.getElementById('total-forsaljning');
    const purchasesEl = document.getElementById('total-inkop');
    const profitEl = document.getElementById('total-vinst');
    
    if (salesEl) salesEl.textContent = `${totalSales.toFixed(2)} kr`;
    if (purchasesEl) purchasesEl.textContent = `${totalPurchases.toFixed(2)} kr`;
    if (profitEl) {
        profitEl.textContent = `${profit.toFixed(2)} kr`;
        profitEl.style.color = profit >= 0 ? '#4CAF50' : '#f44336';
    }
}

function updateArticleDropdowns() {
    const articles = getArticles().sort((a, b) => a.namn.localeCompare(b.namn));
    
    const saleSelect = document.getElementById('forsaljning-artikel');
    const purchaseSelect = document.getElementById('inkop-artikel');
    const inventorySelect = document.getElementById('lager-artikel');
    
    if (saleSelect) {
        saleSelect.innerHTML = '<option value="">Välj artikel</option>';
        articles.forEach(article => {
            const option = document.createElement('option');
            option.value = article.namn;
            option.textContent = `${article.namn} (${article.forsaljningspris.toFixed(2)} kr)`;
            option.dataset.price = article.forsaljningspris;
            saleSelect.appendChild(option);
        });
        
        const manualOption = document.createElement('option');
        manualOption.value = 'manual';
        manualOption.textContent = '➕ Skriv egen produkt';
        saleSelect.appendChild(manualOption);
    }
    
    if (purchaseSelect) {
        purchaseSelect.innerHTML = '<option value="">Välj artikel</option>';
        articles.forEach(article => {
            const option = document.createElement('option');
            option.value = article.namn;
            option.textContent = `${article.namn}${article.inkopspris > 0 ? ` (${article.inkopspris.toFixed(2)} kr)` : ''}`;
            option.dataset.price = article.inkopspris || 0;
            purchaseSelect.appendChild(option);
        });
        
        const purchaseManualOption = document.createElement('option');
        purchaseManualOption.value = 'manual';
        purchaseManualOption.textContent = '➕ Skriv egen produkt';
        purchaseSelect.appendChild(purchaseManualOption);
    }
    
    if (inventorySelect) {
        inventorySelect.innerHTML = '<option value="">Välj artikel</option>';
        articles.forEach(article => {
            const option = document.createElement('option');
            option.value = article.namn;
            option.textContent = article.namn;
            inventorySelect.appendChild(option);
        });
        
        const inventoryManualOption = document.createElement('option');
        inventoryManualOption.value = 'manual';
        inventoryManualOption.textContent = '➕ Skriv egen produkt';
        inventorySelect.appendChild(inventoryManualOption);
    }
}

function loadAllData() {
    displaySales();
    displayPurchases();
    displayArticles();
    displayInventory();
    displayReport();
    updateArticleDropdowns();
}

// Test function
function testFunction() {
    alert('JavaScript works!');
}

// Tab function 
function showTab(tabName, element) {
    console.log('showTab called with:', tabName);
    
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons  
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active class to selected button
    if (element) {
        element.classList.add('active');
    }
    
    // Reload data
    loadAllData();
}

// Form handlers - definiera först, använd senare
function handleSaleForm(e) {
    e.preventDefault();
    
    const artikelSelect = document.getElementById('forsaljning-artikel');
    const produktInput = document.getElementById('forsaljning-produkt');
    const produktnamn = artikelSelect.value || produktInput.value;
    
    const formData = {
        id: Date.now().toString(),
        datum: document.getElementById('forsaljning-datum').value,
        produkt: produktnamn,
        antal: parseInt(document.getElementById('forsaljning-antal').value),
        pris: parseFloat(document.getElementById('forsaljning-pris').value),
        anteckning: document.getElementById('forsaljning-anteckning').value,
        totalbelopp: parseInt(document.getElementById('forsaljning-antal').value) * parseFloat(document.getElementById('forsaljning-pris').value)
    };
    
    saveSale(formData);
    updateInventory(formData.produkt, -formData.antal, 'Försäljning');
    e.target.reset();
    setTodayDate();
    loadAllData();
}

function handlePurchaseForm(e) {
    e.preventDefault();
    
    const artikelSelect = document.getElementById('inkop-artikel');
    const produktInput = document.getElementById('inkop-produkt');
    const produktnamn = artikelSelect.value || produktInput.value;
    
    const formData = {
        id: Date.now().toString(),
        datum: document.getElementById('inkop-datum').value,
        produkt: produktnamn,
        antal: parseInt(document.getElementById('inkop-antal').value),
        kostnad: parseFloat(document.getElementById('inkop-kostnad').value),
        leverantor: document.getElementById('inkop-leverantor').value,
        anteckning: document.getElementById('inkop-anteckning').value,
        totalbelopp: parseInt(document.getElementById('inkop-antal').value) * parseFloat(document.getElementById('inkop-kostnad').value)
    };
    
    savePurchase(formData);
    updateInventory(formData.produkt, formData.antal, 'Inköp från ' + formData.leverantor);
    e.target.reset();
    setTodayDate();
    loadAllData();
}

function handleArticleForm(e) {
    e.preventDefault();
    
    const articleData = {
        id: Date.now().toString(),
        namn: document.getElementById('artikel-namn').value,
        beskrivning: document.getElementById('artikel-beskrivning').value,
        forsaljningspris: parseFloat(document.getElementById('artikel-forsaljningspris').value),
        inkopspris: parseFloat(document.getElementById('artikel-inkopspris').value) || 0,
        kategori: document.getElementById('artikel-kategori').value,
        anteckning: document.getElementById('artikel-anteckning').value,
        skapad: new Date().toISOString()
    };
    
    saveArticle(articleData);
    e.target.reset();
    loadAllData();
}

function handleInventoryForm(e) {
    e.preventDefault();
    
    // Get product name from either dropdown or manual input
    const artikelSelect = document.getElementById('lager-artikel');
    const produktInput = document.getElementById('lager-produkt');
    const produktnamn = artikelSelect.value || produktInput.value;
    
    const antal = parseInt(document.getElementById('lager-antal').value);
    const anteckning = document.getElementById('lager-anteckning').value;
    
    const inventory = getInventory();
    inventory[produktnamn] = {
        antal: antal,
        senast_uppdaterad: new Date().toISOString(),
        anledning: anteckning || 'Manuell justering'
    };
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    
    e.target.reset();
    loadAllData();
}

function handleSaleArticleChange() {
    const select = document.getElementById('forsaljning-artikel');
    const produktInput = document.getElementById('forsaljning-produkt');
    const prisInput = document.getElementById('forsaljning-pris');
    
    if (select.value === 'manual') {
        produktInput.style.display = 'block';
        produktInput.required = true;
        select.required = false;
        prisInput.value = '';
    } else if (select.value) {
        produktInput.style.display = 'none';
        produktInput.required = false;
        select.required = true;
        
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption.dataset.price) {
            prisInput.value = selectedOption.dataset.price;
        }
    } else {
        produktInput.style.display = 'none';
        produktInput.required = false;
        select.required = true;
        prisInput.value = '';
    }
}

function handlePurchaseArticleChange() {
    const select = document.getElementById('inkop-artikel');
    const produktInput = document.getElementById('inkop-produkt');
    const kostnadInput = document.getElementById('inkop-kostnad');
    
    if (select.value === 'manual') {
        produktInput.style.display = 'block';
        produktInput.required = true;
        select.required = false;
        kostnadInput.value = '';
    } else if (select.value) {
        produktInput.style.display = 'none';
        produktInput.required = false;
        select.required = true;
        
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption.dataset.price && selectedOption.dataset.price > 0) {
            kostnadInput.value = selectedOption.dataset.price;
        }
    } else {
        produktInput.style.display = 'none';
        produktInput.required = false;
        select.required = true;
        kostnadInput.value = '';
    }
}

function handleInventoryArticleChange() {
    const select = document.getElementById('lager-artikel');
    const produktInput = document.getElementById('lager-produkt');
    
    if (select.value === 'manual') {
        produktInput.style.display = 'block';
        produktInput.required = true;
        select.required = false;
    } else if (select.value) {
        produktInput.style.display = 'none';
        produktInput.required = false;
        select.required = true;
    } else {
        produktInput.style.display = 'none';
        produktInput.required = false;
        select.required = true;
    }
}

// Delete functions
function deleteSale(id) {
    if (!confirm('Är du säker på att du vill ta bort denna försäljning?')) return;
    
    const sales = getSales();
    const saleIndex = sales.findIndex(sale => sale.id === id);
    if (saleIndex > -1) {
        const sale = sales[saleIndex];
        updateInventory(sale.produkt, sale.antal, 'Återförd från raderad försäljning');
        sales.splice(saleIndex, 1);
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
        loadAllData();
    }
}

function deletePurchase(id) {
    if (!confirm('Är du säker på att du vill ta bort detta inköp?')) return;
    
    const purchases = getPurchases();
    const purchaseIndex = purchases.findIndex(purchase => purchase.id === id);
    if (purchaseIndex > -1) {
        const purchase = purchases[purchaseIndex];
        updateInventory(purchase.produkt, -purchase.antal, 'Återförd från raderat inköp');
        purchases.splice(purchaseIndex, 1);
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        loadAllData();
    }
}

function deleteArticle(id) {
    if (!confirm('Är du säker på att du vill ta bort denna artikel?')) return;
    
    const articles = getArticles();
    const filteredArticles = articles.filter(article => article.id !== id);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(filteredArticles));
    loadAllData();
}

// Export/Import functions
function exportData() {
    const data = {
        sales: getSales(),
        purchases: getPurchases(),
        inventory: getInventory(),
        articles: getArticles(),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `bubbelbudget_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('import-file').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('Detta kommer att ersätta all befintlig data. Är du säker?')) {
                if (data.sales) localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data.sales));
                if (data.purchases) localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(data.purchases));
                if (data.inventory) localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(data.inventory));
                if (data.articles) localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(data.articles));
                
                loadAllData();
                alert('Data importerad successfully!');
            }
        } catch (error) {
            alert('Fel vid import av data. Kontrollera att filen är korrekt formaterad.');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Detta kommer att radera ALL data permanent. Är du helt säker?')) {
        if (confirm('Sista chansen - detta går INTE att ångra. Fortsätt?')) {
            localStorage.removeItem(STORAGE_KEYS.SALES);
            localStorage.removeItem(STORAGE_KEYS.PURCHASES);
            localStorage.removeItem(STORAGE_KEYS.INVENTORY);
            localStorage.removeItem(STORAGE_KEYS.ARTICLES);
            loadAllData();
            alert('All data har raderats.');
        }
    }
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const saleDate = document.getElementById('forsaljning-datum');
    const purchaseDate = document.getElementById('inkop-datum');
    
    if (saleDate) saleDate.value = today;
    if (purchaseDate) purchaseDate.value = today;
}

// Make functions global
window.testFunction = testFunction;
window.showTab = showTab;
window.deleteSale = deleteSale;
window.deletePurchase = deletePurchase;
window.deleteArticle = deleteArticle;
window.exportData = exportData;
window.importData = importData;
window.handleImport = handleImport;
window.clearAllData = clearAllData;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    try {
        // Initialize forms
        const forms = {
            'forsaljning-form': handleSaleForm,
            'inkop-form': handlePurchaseForm,
            'artikel-form': handleArticleForm,
            'lager-form': handleInventoryForm
        };
        
        Object.keys(forms).forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', forms[formId]);
            }
        });
        
        // Setup dropdowns
        const saleSelect = document.getElementById('forsaljning-artikel');
        const purchaseSelect = document.getElementById('inkop-artikel');
        const inventorySelect = document.getElementById('lager-artikel');
        
        if (saleSelect) saleSelect.addEventListener('change', handleSaleArticleChange);
        if (purchaseSelect) purchaseSelect.addEventListener('change', handlePurchaseArticleChange);
        if (inventorySelect) inventorySelect.addEventListener('change', handleInventoryArticleChange);
        
        // Set today's date and load data
        setTodayDate();
        loadAllData();
        
        console.log('App initialized successfully!');
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});