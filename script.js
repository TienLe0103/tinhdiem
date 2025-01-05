const subjects = [
    "Văn", "Tiếng Anh", "Toán", "Lịch sử", "Vật lý",
    "Sinh học", "GDKT&PL", "Hóa học", "Địa lý", "Tin học",
    "Công nghệ nông nghiệp", "Công nghệ công nghiệp", "GDQP"
];

const overlay = document.getElementById('overlay');
const modal = document.getElementById('modal');
const subjectCheckboxes = document.getElementById('subjectCheckboxes');
const doneButton = document.getElementById('doneButton');
const addColumnButton = document.getElementById('addColumnButton');
const deleteColumnButton = document.getElementById('deleteColumnButton');
const resetButton = document.getElementById('resetButton');
const editSubjectsButton = document.getElementById('editSubjectsButton');
const nihaoButton = document.getElementById('nihaoButton');
const evaluationResult = document.getElementById('evaluationResult');
const txHeader = document.getElementById('txHeader');
const tbody = document.querySelector('#scoreTable tbody');
let currentTxCount = 4;

function renderCheckboxes(selectedSubjects = []) {
    subjectCheckboxes.innerHTML = '';
    subjects.forEach(subject => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = subject;
        if (selectedSubjects.includes(subject)) {
            checkbox.checked = true;
        }
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${subject}`));
        subjectCheckboxes.appendChild(label);
        subjectCheckboxes.appendChild(document.createElement('br'));
    });
}

window.onload = () => {
    restoreData();
    if (!localStorage.getItem('scoreTableData')) {
        modal.classList.add('active');
        overlay.classList.add('active');
        renderCheckboxes();
    }
};

function calculateAverage(row) {
    const txCells = Array.from(row.querySelectorAll('td[contenteditable="true"]')).slice(0, currentTxCount);
    const gkCell = row.querySelectorAll('td[contenteditable="true"]')[currentTxCount];
    const ckCell = row.querySelectorAll('td[contenteditable="true"]')[currentTxCount + 1];
    const tbOutputCell = row.querySelector('.tb-output');

    let txSum = 0;
    let filledTxCount = 0;

    txCells.forEach(cell => {
        const value = parseFloat(cell.textContent);
        if (!isNaN(value)) {
            txSum += value;
            filledTxCount++;
        }
    });

    const gk = parseFloat(gkCell.textContent);
    const ck = parseFloat(ckCell.textContent);

    if (!isNaN(gk) && !isNaN(ck)) {
        const totalScore = txSum + gk * 2 + ck * 3;
        const denominator = 5 + filledTxCount;
        const average = totalScore / denominator;
        tbOutputCell.textContent = average.toFixed(1);
    } else {
        tbOutputCell.textContent = '';
    }
}

function saveData() {
    const data = [];
    tbody.querySelectorAll('tr').forEach(row => {
        const rowData = Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim());
        data.push(rowData);
    });
    localStorage.setItem('scoreTableData', JSON.stringify(data));
    localStorage.setItem('currentTxCount', currentTxCount);
}

function restoreData() {
    const storedData = JSON.parse(localStorage.getItem('scoreTableData'));
    const storedTxCount = localStorage.getItem('currentTxCount');
    if (storedData && storedTxCount) {
        currentTxCount = parseInt(storedTxCount, 10);
        txHeader.colSpan = currentTxCount;

        tbody.innerHTML = ''; 
        storedData.forEach(rowData => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${rowData[0]}</td>` + rowData.slice(1).map(cell => `<td contenteditable="true">${cell}</td>`).join('');
            tbody.appendChild(row);
        });
        attachInputListeners();
    }
}

function resetData() {
    localStorage.removeItem('scoreTableData');
    localStorage.removeItem('currentTxCount');
    tbody.innerHTML = ''; 
    currentTxCount = 4; 
    txHeader.colSpan = currentTxCount;
    modal.classList.add('active'); 
    overlay.classList.add('active');
    renderCheckboxes();
}

function attachInputListeners() {
    tbody.querySelectorAll('td[contenteditable="true"]').forEach(cell => {
        cell.addEventListener('input', function () {
            this.textContent = this.textContent.replace(/[^0-9.]/g, '');
            if ((this.textContent.match(/\./g) || []).length > 1) {
                this.textContent = this.textContent.slice(0, this.textContent.lastIndexOf('.'));
            }
            const row = this.closest('tr');
            calculateAverage(row);
            saveData();
        });
        cell.addEventListener('blur', function () {
            if (this.textContent.endsWith('.')) {
                this.textContent = this.textContent.slice(0, -1);
            }
            const value = parseFloat(this.textContent);
            if (!isNaN(value)) {
                if (value < 0) this.textContent = '0';
                else if (value > 10) this.textContent = '10';
            }
            const row = this.closest('tr');
            calculateAverage(row);
            saveData();
        });
    });
}

doneButton.addEventListener('click', () => {
    const selectedSubjects = Array.from(subjectCheckboxes.querySelectorAll('input:checked')).map(cb => cb.value);
    const currentSubjects = Array.from(tbody.querySelectorAll('tr td:first-child')).map(cell => cell.textContent);

    selectedSubjects.forEach(subject => {
        if (!currentSubjects.includes(subject)) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subject}</td>
                ${'<td contenteditable="true"></td>'.repeat(currentTxCount)}
                <td contenteditable="true"></td>
                <td contenteditable="true"></td>
                <td class="tb-output"></td>
            `;
            tbody.appendChild(row);
        }
    });

    currentSubjects.forEach(subject => {
        if (!selectedSubjects.includes(subject)) {
            const rowToRemove = Array.from(tbody.querySelectorAll('tr')).find(row => row.querySelector('td:first-child').textContent === subject);
            if (rowToRemove) {
                tbody.removeChild(rowToRemove);
            }
        }
    });

    modal.classList.remove('active');
    overlay.classList.remove('active');
    attachInputListeners();
    saveData();
});

editSubjectsButton.addEventListener('click', () => {
    const currentSubjects = Array.from(tbody.querySelectorAll('tr td:first-child')).map(cell => cell.textContent);
    renderCheckboxes(currentSubjects);
    modal.classList.add('active');
    overlay.classList.add('active');
});

resetButton.addEventListener('click', resetData);

addColumnButton.addEventListener('click', () => {
    currentTxCount++;
    txHeader.colSpan = currentTxCount;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const newTd = document.createElement('td');
        newTd.contentEditable = "true";
        row.insertBefore(newTd, row.cells[currentTxCount]);
        newTd.addEventListener('input', function () {
            this.textContent = this.textContent.replace(/[^0-9.]/g, '');
            if ((this.textContent.match(/\./g) || []).length > 1) {
                this.textContent = this.textContent.slice(0, this.textContent.lastIndexOf('.'));
            }
            const rowElement = this.closest('tr');
            calculateAverage(rowElement);
            saveData();
        });
        newTd.addEventListener('blur', function () {
            if (this.textContent.endsWith('.')) {
                this.textContent = this.textContent.slice(0, -1);
            }
            const value = parseFloat(this.textContent);
            if (!isNaN(value)) {
                if (value < 0) this.textContent = '0';
                else if (value > 10) this.textContent = '10';
            }
            const rowElement = this.closest('tr');
            calculateAverage(rowElement);
            saveData();
        });
    });
    saveData();
});

deleteColumnButton.addEventListener('click', () => {
    if (currentTxCount > 1) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            row.deleteCell(currentTxCount - 1);
        });
        currentTxCount--;
        txHeader.colSpan = currentTxCount;
    }
    saveData();
});

tbody.addEventListener('input', function (event) {
    if (event.target.tagName === 'TD' && event.target.getAttribute('contenteditable') === 'true') {
        const row = event.target.closest('tr');
        calculateAverage(row);
    }
});

function restoreData() {
    const storedData = JSON.parse(localStorage.getItem('scoreTableData'));
    const storedTxCount = localStorage.getItem('currentTxCount');
    if (storedData && storedTxCount) {
        currentTxCount = parseInt(storedTxCount, 10);
        txHeader.colSpan = currentTxCount;

        tbody.innerHTML = ''; 
        storedData.forEach(rowData => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${rowData[0]}</td>` + rowData.slice(1).map((cell, index) => {
                if (index === currentTxCount + 2) {
                    return `<td class="tb-output">${cell}</td>`;
                } else {
                    return `<td contenteditable="true">${cell}</td>`;
                }
            }).join('');
            tbody.appendChild(row);
        });
        attachInputListeners(); 
        tbody.querySelectorAll('tr').forEach(row => calculateAverage(row)); 
        evaluateStudents(); 
    }
}

function evaluateStudents() {
    let totalSubjects = 0;
    let excellentSubjects = 0;
    let goodSubjects = 0;
    let averageSubjects = 0;
    let hasFailed = false;

    tbody.querySelectorAll('tr').forEach(row => {
        const tbCell = row.querySelector('.tb-output');
        const tb = parseFloat(tbCell.textContent);

        if (!isNaN(tb)) {
            totalSubjects++;

            if (tb >= 8.0) {
                excellentSubjects++;
                tbCell.classList.add('highlight');
            } else {
                tbCell.classList.remove('highlight');
            }

            if (tb >= 6.5) goodSubjects++;
            if (tb >= 5.0) averageSubjects++;
            if (tb < 3.5) hasFailed = true;
        }
    });

    let evaluation = '';
    if (excellentSubjects >= 6 && goodSubjects === totalSubjects) {
        evaluation = 'Tốt';
    } else if (goodSubjects >= 6 && averageSubjects === totalSubjects) {
        evaluation = 'Khá';
    } else if (!hasFailed && averageSubjects >= 6) {
        evaluation = 'Đạt';
    } else {
        evaluation = 'Chưa đạt';
    }

    evaluationResult.textContent = `Mức xếp loại: ${evaluation}`;
}

nihaoButton.addEventListener('click', evaluateStudents);