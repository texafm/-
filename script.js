// ========== 設定 ==========
// ⚠️ 以下のURLを、あなたのGoogle Apps ScriptのURLに置き換えてください
const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

let rowCount = 0;
let sortColumn = null;
let sortDirection = 'asc';

// ========== API通信 ==========
async function callAPI(params) {
    const url = new URL(API_URL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showStatus('通信エラーが発生しました', 'error');
        return null;
    }
}

// ========== データ読み込み ==========
async function loadData() {
    showLoading(true);
    
    const result = await callAPI({ action: 'getData' });
    
    if (result && result.success) {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        rowCount = 0;
        
        // ヘッダー行をスキップ
        const data = result.data.slice(1);
        
        data.forEach((rowData, index) => {
            if (rowData[0]) { // 空行をスキップ
                rowCount++;
                createTableRow(rowData, index + 2); // +2はヘッダー行とインデックス調整
            }
        });
        
        updateEmptyMessage();
        showStatus('✅ データを読み込みました', 'success');
    }
    
    showLoading(false);
}

function createTableRow(rowData, sheetRow) {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    newRow.id = `row-${rowCount}`;
    newRow.dataset.sheetRow = sheetRow;

    let rowHTML = `
        <td class="row-number">${rowData[0]}</td>
        <td>${escapeHtml(rowData[1] || '')}</td>
        <td class="subject-tooltip" title="${escapeHtml(rowData[2] || '')}">${escapeHtml(rowData[2] || '')}</td>
        <td>${rowData[3] || ''}</td>
        <td>${rowData[4] || ''}</td>
        <td>${rowData[5] || ''}</td>
    `;

    // 日付列（列7から列20まで）
    for (let i = 6; i < 20; i++) {
        const vendorNum = Math.floor((i - 11) / 3) + 1;
        let classStr = '';
        if (i >= 11) {
            classStr = 'vendor-group-' + vendorNum;
        }
        
        rowHTML += `
            <td class="${classStr}">
                <input type="date" value="${rowData[i] || ''}" 
                       onchange="updateCell(${sheetRow}, ${i + 1}, this.value)">
            </td>
        `;
    }

    rowHTML += `
        <td>
            <button class="delete-btn" onclick="deleteRow(${sheetRow}, this)">削除</button>
        </td>
    `;

    newRow.innerHTML = rowHTML;
    tableBody.appendChild(newRow);
}

// ========== 行追加 ==========
async function addRow() {
    const estimateNo = document.getElementById('estimateNo').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const billingMonth = document.getElementById('billingMonth').value;
    const completionDate = document.getElementById('completionDate').value;
    const salePrice = document.getElementById('salePrice').value;

    if (!estimateNo || !subject || !billingMonth || !completionDate || !salePrice) {
        alert('すべての項目を入力してください');
        return;
    }

    showLoading(true);

    rowCount++;
    const formattedMonth = formatMonth(billingMonth);
    const formattedDate = formatDate(completionDate);
    const formattedPrice = parseInt(salePrice).toLocaleString() + '円';

    const rowData = [
        rowCount,
        estimateNo,
        subject,
        formattedMonth,
        formattedDate,
        formattedPrice,
        '', '', '', '', '', '', '', '', '', '', '', '', '', '' // 日付列（14列分）
    ];

    const result = await callAPI({
        action: 'addRow',
        rowData: JSON.stringify(rowData)
    });

    if (result && result.success) {
        // フォームをクリア
        document.getElementById('estimateNo').value = '';
        document.getElementById('subject').value = '';
        document.getElementById('billingMonth').value = '';
        document.getElementById('completionDate').value = '';
        document.getElementById('salePrice').value = '';
        
        // データを再読み込み
        await loadData();
        showStatus('✅ データを追加しました', 'success');
    }

    showLoading(false);
    document.getElementById('estimateNo').focus();
}

// ========== セル更新 ==========
async function updateCell(row, col, value) {
    showStatus('💾 保存中...', 'info');
    
    const result = await callAPI({
        action: 'updateCell',
        row: row,
        col: col,
        value: value
    });

    if (result && result.success) {
        showStatus('✅ 保存しました', 'success');
    }
}

// ========== 行削除 ==========
async function deleteRow(sheetRow, button) {
    if (!confirm('この行を削除しますか？')) {
        return;
    }

    showLoading(true);

    const result = await callAPI({
        action: 'deleteRow',
        row: sheetRow
    });

    if (result && result.success) {
        await loadData();
        showStatus('✅ 削除しました', 'success');
    }

    showLoading(false);
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

        let aValue = aCell.textContent.trim();
        let bValue = bCell.textContent.trim();

        // 数値判定
        const aNum = parseFloat(aValue.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bValue.replace(/[^0-9.-]/g, ''));

        if (!isNaN(aNum) && !isNaN(bNum)) {
            aValue = aNum;
            bValue = bNum;
        } else {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
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
    link.href = URL.createObjectURL(blob);
    link.download = `quotation_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ========== ユーティリティ ==========
function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showStatus(message, type) {
    const statusEl = document.getElementById('saveStatus');
    statusEl.textContent = message;
    statusEl.className = 'save-status ' + type;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

function updateEmptyMessage() {
    const tableBody = document.getElementById('tableBody');
    const emptyMessage = document.getElementById('emptyMessage');
    emptyMessage.style.display = tableBody.children.length === 0 ? 'block' : 'none';
}

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

    // 初回データ読み込み
    loadData();
});