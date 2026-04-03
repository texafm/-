let rowCount = 0;
let sortColumn = null;
let sortDirection = 'asc';
const STORAGE_KEY = 'quotation_system_data';

const customerColumns = [
    { name: '注文書提出', index: 7 },
    { name: '注文書受領', index: 8 },
    { name: '請書依頼', index: 9 },
    { name: '請書スキャン', index: 10 },
    { name: '請書提出', index: 11 }
];

const vendorColumns = [
    { name: '注文書①', index: 12 },
    { name: '請書受領①', index: 13 },
    { name: '請求書①', index: 14 },
    { name: '注文書②', index: 15 },
    { name: '請書受領②', index: 16 },
    { name: '請求書②', index: 17 },
    { name: '注文書③', index: 18 },
    { name: '請書受領③', index: 19 },
    { name: '請求書③', index: 20 }
];

// ========== データ保存機能 ==========
function saveToLocalStorage() {
    const data = [];
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = {
            estimateNo: cells[1].textContent,
            subject: cells[2].textContent,
            billingMonth: cells[3].textContent,
            completionDate: cells[4].textContent,
            salePrice: cells[5].textContent,
            dates: []
        };

        // 日付データを保存
        for (let i = 7; i < cells.length - 1; i++) {
            const input = cells[i].querySelector('input[type="date"]');
            rowData.dates.push(input ? input.value : '');
        }

        data.push(rowData);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showSaveStatus();
}

function loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    data.forEach(rowData => {
        rowCount++;
        const tableBody = document.getElementById('tableBody');
        const newRow = document.createElement('tr');
        newRow.id = `row-${rowCount}`;
        newRow.dataset.rowNum = rowCount;

        let rowHTML = `
            <td class="row-number" data-sort-value="${rowCount}">${rowCount}</td>
            <td data-sort-value="${rowData.estimateNo}">${escapeHtml(rowData.estimateNo)}</td>
            <td class="subject-tooltip" title="${escapeHtml(rowData.subject)}" data-sort-value="${rowData.subject}">${escapeHtml(rowData.subject)}</td>
            <td data-sort-value="${rowData.billingMonth}">${rowData.billingMonth}</td>
            <td data-sort-value="${rowData.completionDate}">${rowData.completionDate}</td>
            <td data-sort-value="${rowData.salePrice}">${rowData.salePrice}</td>
            <td></td>
        `;

        // 日付データを復元
        rowData.dates.forEach((dateValue, index) => {
            const vendorNum = Math.floor(index / 3) + 1;
            let classStr = 'vendor-group-' + vendorNum;
            if (index % 3 === 2) classStr += ' vendor-last';

            rowHTML += `
                <td class="${classStr}">
                    <input type="date" class="date-input" data-row="${rowCount}" data-column="${index + 7}" value="${dateValue}" onchange="saveData()">
                </td>
            `;
        });

        rowHTML += `
            <td>
                <button class="delete-btn" onclick="deleteRow(${rowCount})">削除</button>
            </td>
        `;

        newRow.innerHTML = rowHTML;
        tableBody.appendChild(newRow);
    });

    updateEmptyMessage();
}

function showSaveStatus() {
    const statusEl = document.getElementById('saveStatus');
    statusEl.style.display = 'block';
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

function saveData() {
    saveToLocalStorage();
}

// ========== 行追加機能 ==========
function addRow() {
    const estimateNo = document.getElementById('estimateNo').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const billingMonth = document.getElementById('billingMonth').value;
    const completionDate = document.getElementById('completionDate').value;
    const salePrice = document.getElementById('salePrice').value;

    if (!estimateNo || !subject || !billingMonth || !completionDate || !salePrice) {
        alert('すべての項目を入力してください');
        return;
    }

    rowCount++;
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    newRow.id = `row-${rowCount}`;
    newRow.dataset.rowNum = rowCount;

    let rowHTML = `
        <td class="row-number" data-sort-value="${rowCount}">${rowCount}</td>
        <td data-sort-value="${estimateNo}">${escapeHtml(estimateNo)}</td>
        <td class="subject-tooltip" title="${escapeHtml(subject)}" data-sort-value="${subject}">${escapeHtml(subject)}</td>
        <td data-sort-value="${billingMonth}">${formatMonth(billingMonth)}</td>
        <td data-sort-value="${completionDate}">${formatDate(completionDate)}</td>
        <td data-sort-value="${parseInt(salePrice)}">${parseInt(salePrice).toLocaleString()}円</td>
        <td></td>
    `;

    customerColumns.forEach((col) => {
        rowHTML += `
            <td>
                <input type="date" class="date-input" data-row="${rowCount}" data-column="${col.index}" onchange="saveData()">
            </td>
        `;
    });

    vendorColumns.forEach((col, index) => {
        const vendorNum = Math.floor(index / 3) + 1;
        let classStr = 'vendor-group-' + vendorNum;
        if (index % 3 === 2) classStr += ' vendor-last';
        
        rowHTML += `
            <td class="${classStr}">
                <input type="date" class="date-input" data-row="${rowCount}" data-column="${col.index}" onchange="saveData()">
            </td>
        `;
    });

    rowHTML += `
        <td>
            <button class="delete-btn" onclick="deleteRow(${rowCount})">削除</button>
        </td>
    `;

    newRow.innerHTML = rowHTML;
    tableBody.appendChild(newRow);

    updateEmptyMessage();
    saveData();

    document.getElementById('estimateNo').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('billingMonth').value = '';
    document.getElementById('completionDate').value = '';
    document.getElementById('salePrice').value = '';
    document.getElementById('estimateNo').focus();
}

function deleteRow(rowNum) {
    if (confirm('この行を削除しますか？')) {
        const row = document.getElementById(`row-${rowNum}`);
        row.remove();
        updateEmptyMessage();
        saveData();
    }
}

function updateEmptyMessage() {
    const tableBody = document.getElementById('tableBody');
    const emptyMessage = document.getElementById('emptyMessage');
    if (tableBody.children.length === 0) {
        emptyMessage.style.display = 'block';
    } else {
        emptyMessage.style.display = 'none';
    }
}

// ========== ソート機能 ==========
function sortTable(columnIndex) {
    const tableBody = document.getElementById('tableBody');
    const rows = Array.from(tableBody.querySelectorAll('tr'));

    if (sortColumn === columnIndex) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = columnIndex;
        sortDirection = 'asc';
    }

    rows.sort((a, b) => {
        const aCell = a.querySelectorAll('td')[columnIndex];
        const bCell = b.querySelectorAll('td')[columnIndex];

        let aValue = aCell.dataset.sortValue || aCell.textContent.trim();
        let bValue = bCell.dataset.sortValue || bCell.textContent.trim();

        if (!isNaN(aValue) && !isNaN(bValue)) {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        } else {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
            return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });

    rows.forEach(row => tableBody.appendChild(row));
}

// ========== CSVエクスポート ==========
function exportToCSV() {
    const headers = [
        'No', '見積No', '件名', '請求月', '完了予定日', '売価',
        '注文書提出', '注文書受領', '請書依頼', '請書スキャン', '請書提出',
        '業者①注文書', '業者①請書受領', '業者①請求書',
        '業者②注文書', '業者②請書受領', '業者②請求書',
        '業者③注文書', '業者③請書受領', '業者③請求書'
    ];

    const rows = document.querySelectorAll('#tableBody tr');
    const csvData = [headers.join(',')];

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [];
        
        for (let i = 0; i < cells.length - 1; i++) {
            const input = cells[i].querySelector('input[type="date"]');
            if (input) {
                rowData.push(input.value);
            } else {
                rowData.push(cells[i].textContent.trim());
            }
        }
        
        csvData.push(rowData.map(data => `"${data}"`).join(','));
    });

    const csv = csvData.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `quotation_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ========== すべてのデータを削除 ==========
function clearAllData() {
    if (confirm('本当にすべてのデータを削除しますか？\n\nこの操作は取り消せません。')) {
        if (confirm('もう一度確認します。本当に削除しますか？')) {
            localStorage.removeItem(STORAGE_KEY);
            document.getElementById('tableBody').innerHTML = '';
            rowCount = 0;
            updateEmptyMessage();
            alert('すべてのデータが削除されました。');
        }
    }
}

// ========== ユーティリティ関数 ==========
function formatMonth(monthString) {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    return `${year}年${month}月`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '/');
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ========== 初期化 ==========
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('salePrice').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addRow();
        }
    });

    loadFromLocalStorage();
    updateEmptyMessage();
});