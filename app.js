// Data storage keys
const STORAGE_KEYS = {
    SALES: 'bubbelbudget_sales',
    PURCHASES: 'bubbelbudget_purchases',
    INVENTORY: 'bubbelbudget_inventory'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeForms();
    loadAllData();
    setTodayDate();
});

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('forsaljning-datum').value = today;
    document.getElementById('inkop-datum').value = today;
}

// Tab navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to selected button
    event.target.classList.add('active');
    
    // Reload data for current tab
    loadAllData();
}

// Initialize forms
function initializeForms() {
    document.getElementById('forsaljning-form').addEventListener('submit', handleSaleForm);
    document.getElementById('inkop-form').addEventListener('submit', handlePurchaseForm);
    document.getElementById('lager-form').addEventListener('submit', handleInventoryForm);
}

// Handle sale form submission
function handleSaleForm(e) {
    e.preventDefault();
    
    const formData = {
        id: Date.now().toString(),
        datum: document.getElementById('forsaljning-datum').value,
        produkt: document.getElementById('forsaljning-produkt').value,
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

// Handle purchase form submission
function handlePurchaseForm(e) {
    e.preventDefault();
    
    const formData = {
        id: Date.now().toString(),
        datum: document.getElementById('inkop-datum').value,
        produkt: document.getElementById('inkop-produkt').value,
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

// Handle inventory form submission
function handleInventoryForm(e) {
    e.preventDefault();
    
    const produkt = document.getElementById('lager-produkt').value;
    const antal = parseInt(document.getElementById('lager-antal').value);
    const anteckning = document.getElementById('lager-anteckning').value;
    
    setInventory(produkt, antal, anteckning || 'Manuell justering');
    e.target.reset();
    loadAllData();
}

// Data persistence functions
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

function getSales() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
}

function getPurchases() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
}

function getInventory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '{}');
}

function updateInventory(product, quantityChange, reason) {
    const inventory = getInventory();
    if (!inventory[product]) {
        inventory[product] = { antal: 0, senast_uppdaterad: new Date().toISOString(), anledning: reason };
    }
    
    inventory[product].antal += quantityChange;
    inventory[product].senast_uppdaterad = new Date().toISOString();
    inventory[product].anledning = reason;
    
    // Don't allow negative inventory
    if (inventory[product].antal < 0) {
        inventory[product].antal = 0;
    }
    
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
}

function setInventory(product, quantity, reason) {
    const inventory = getInventory();
    inventory[product] = {
        antal: quantity,
        senast_uppdaterad: new Date().toISOString(),
        anledning: reason
    };
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
}

// Display functions
function loadAllData() {
    displaySales();
    displayPurchases();
    displayInventory();
    displayReport();
}

function displaySales() {
    const sales = getSales().sort((a, b) => new Date(b.datum) - new Date(a.datum));
    const container = document.getElementById('forsaljning-lista');
    
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

function displayInventory() {
    const inventory = getInventory();
    const container = document.getElementById('lager-lista');
    
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
    
    document.getElementById('total-forsaljning').textContent = `${totalSales.toFixed(2)} kr`;
    document.getElementById('total-inkop').textContent = `${totalPurchases.toFixed(2)} kr`;
    
    const profitElement = document.getElementById('total-vinst');
    profitElement.textContent = `${profit.toFixed(2)} kr`;
    profitElement.style.color = profit >= 0 ? '#4CAF50' : '#f44336';
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

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
}

// Data export/import functions
function exportData() {
    const data = {
        sales: getSales(),
        purchases: getPurchases(),
        inventory: getInventory(),
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
            loadAllData();
            alert('All data har raderats.');
        }
    }
}