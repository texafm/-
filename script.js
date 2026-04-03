let rowCount = 0;
let sortColumn = null;
let sortDirection = 'asc';

const customerColumns = [
    { name: '注文書提出', index: 7 },
    { name: '注文書受領', index: 8 },
    { name: '請書依頼', index: 9 },
    { name: '請書スキャン', index: 10 },
    { name: '請書提出', index: 11 }
];

const vendorColumns = [
    // 業者①
    { name: '注文書①', index: 12 },
    { name: '請書受領①', index: 13 },
    { name: '請求書①', index: 14 },
    // 業者②
    { name: '注文書②', index: 15 },
    { name: '請書受領②', index: 16 },
    { name: '請求書②', index: 17 },
    // 業者③
    { name: '注文書③', index: 18 },
    { name: '請書受領③', index: 19 },
    { name: '請求書③', index: 20 }
];

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

    // お客様関連の日付列
    customerColumns.forEach((col) => {
        rowHTML += `
            <td>
                <input type="date" class="date-input" data-row="${rowCount}" data-column="${col.index}">
            </td>
        `;
    });

    // 業者関連の日付列（3グループ×3列）
    vendorColumns.forEach((col, index) => {
        const vendorNum = Math.floor(index / 3) + 1;
        let classStr = 'vendor-group-' + vendorNum;
        if (index % 3 === 2) classStr += ' vendor-last';
        
        rowHTML += `
            <td class="${classStr}">
                <input type="date" class="date-input" data-row="${rowCount}" data-column="${col.index}">
            </td>
        `;
    });

    // 削除ボタン
    rowHTML += `
        <td>
            <button class="delete-btn" onclick="deleteRow(${rowCount})">削除</button>
        </td>
    `;

    newRow.innerHTML = rowHTML;
    tableBody.appendChild(newRow);

    updateEmptyMessage();

    // フォームをクリア
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

function sortTable(columnIndex) {
    const tableBody = document.getElementById('tableBody');
    const rows = Array.from(tableBody.querySelectorAll('tr'));

    // ソート方向の切り替え
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

        // 数値判定
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

    // DOMに反映
    rows.forEach(row => tableBody.appendChild(row));
}

function setRowType(rowNum, type) {
    resetRowColors(rowNum);
    const row = document.getElementById(`row-${rowNum}`);
    const cells = row.querySelectorAll('td');

    if (type === 'クラウド') {
        // 業者注文書提出①～③を青色に
        [12, 15, 18].forEach(colIndex => {
            cells[colIndex].classList.add('blue-cell');
        });
    } else if (type === '内製') {
        // 業者注文書提出①以降をすべて赤色に
        for (let i = 12; i < cells.length - 1; i++) {
            cells[i].classList.add('red-cell');
        }
    }
}

function resetRowColors(rowNum) {
    const row = document.getElementById(`row-${rowNum}`);
    const cells = row.querySelectorAll('td');
    cells.forEach(cell => {
        cell.classList.remove('blue-cell', 'red-cell');
    });
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

// Enterキーで追加
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('salePrice').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addRow();
        }
    });

    updateEmptyMessage();
});
